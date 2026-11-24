import postgres from "postgres";
import fs from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";

type SeedRecord = Record<string, unknown> & { id?: unknown };
const seedCollections = ["contributors", "profiles", "projects", "events", "resources", "experiments", "open-calls", "discussions", "news"];
const seedMigration = "json-seed-v1";
let client: ReturnType<typeof postgres> | undefined;
let initialization: Promise<void> | undefined;

function getClient() {
  if (client) return client;
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL must be configured for TLC");
  client = postgres(url, { max: 5, idle_timeout: 20, connect_timeout: 10 });
  return client;
}

async function initializeDatabase() {
  const sql = getClient();
  await sql`CREATE TABLE IF NOT EXISTS records (
    seq BIGSERIAL PRIMARY KEY,
    collection TEXT NOT NULL,
    id TEXT NOT NULL,
    data JSONB NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (collection, id)
  )`;
  await sql`CREATE TABLE IF NOT EXISTS tlc_migrations (
    name TEXT PRIMARY KEY,
    applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`;
  const migration = await sql`SELECT name FROM tlc_migrations WHERE name = ${seedMigration}`;
  if (migration.length) return;

  const dataDirectory = path.join(process.cwd(), "data");
  for (const collection of seedCollections) {
    const filePath = path.join(dataDirectory, `${collection}.json`);
    if (!fs.existsSync(filePath)) continue;
    let parsed: unknown;
    try { parsed = JSON.parse(fs.readFileSync(filePath, "utf8")); } catch { continue; }
    if (!Array.isArray(parsed)) continue;
    const records = (parsed as unknown[])
      .filter((item): item is SeedRecord => Boolean(item) && typeof item === "object" && !Array.isArray(item))
      .map((item) => ({ ...item, id: typeof item.id === "string" && item.id ? item.id : randomUUID() }));
    if (!records.length) continue;
    await sql`INSERT INTO records (collection, id, data)
      SELECT ${collection}, item->>'id', item
      FROM jsonb_array_elements(${sql.json(records)}::jsonb) AS item
      ON CONFLICT (collection, id) DO NOTHING`;
  }
  await sql`INSERT INTO tlc_migrations (name) VALUES (${seedMigration}) ON CONFLICT (name) DO NOTHING`;
}

async function ensureDatabase() {
  if (!initialization) {
    initialization = initializeDatabase().catch((error) => {
      initialization = undefined;
      throw error;
    });
  }
  await initialization;
}

export async function readCollection<T>(collection: string): Promise<T[]> {
  await ensureDatabase();
  const rows = await getClient()`SELECT data FROM records WHERE collection = ${collection} ORDER BY seq`;
  return rows.map((row) => row.data as T);
}

export async function appendRecord<T extends { id?: string }>(collection: string, item: T, idPrefix: string) {
  await ensureDatabase();
  const sql = getClient();
  const id = item.id ?? `${idPrefix}-${randomUUID()}`;
  const record = { ...item, id } as T & { id: string };
  await sql`INSERT INTO records (collection, id, data) VALUES (${collection}, ${id}, ${sql.json(record)}::jsonb)`;
  return record;
}

export async function appendRecords<T extends { id: string }>(collection: string, items: T[]): Promise<number> {
  await ensureDatabase();
  if (!items.length) return 0;
  const sql = getClient();
  const rows = await sql`INSERT INTO records (collection, id, data)
    SELECT ${collection}, item->>'id', item FROM jsonb_array_elements(${sql.json(items)}::jsonb) AS item
    ON CONFLICT (collection, id) DO NOTHING RETURNING id`;
  return rows.length;
}

export async function updateRecord<T extends { id: string }>(collection: string, item: T): Promise<boolean> {
  await ensureDatabase();
  const sql = getClient();
  const rows = await sql`UPDATE records SET data = ${sql.json(item)}::jsonb, updated_at = NOW()
    WHERE collection = ${collection} AND id = ${item.id} RETURNING id`;
  return rows.length > 0;
}

export async function deleteRecord(collection: string, id: string): Promise<boolean> {
  await ensureDatabase();
  const rows = await getClient()`DELETE FROM records WHERE collection = ${collection} AND id = ${id} RETURNING id`;
  return rows.length > 0;
}

export async function closeDatabase() {
  if (!client) return;
  await client.end();
  client = undefined;
  initialization = undefined;
}
