import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";

type StoredRecord = { id: string; collection: string; data: string };

const databaseDirectory = path.join(process.cwd(), ".data");
const databasePath = path.join(databaseDirectory, "tlc.sqlite");
const sourceDirectory = path.join(process.cwd(), "data");

let database: Database.Database | undefined;

function migrateJsonData(db: Database.Database) {
  const insert = db.prepare(
    "INSERT OR IGNORE INTO records (collection, id, data) VALUES (?, ?, ?)",
  );

  const migrate = db.transaction(() => {
    for (const fileName of fs.readdirSync(sourceDirectory)) {
      if (!fileName.endsWith(".json")) continue;
      const collection = fileName.slice(0, -5);
      const filePath = path.join(sourceDirectory, fileName);
      let parsed: unknown;
      try {
        parsed = JSON.parse(fs.readFileSync(filePath, "utf8"));
      } catch {
        continue;
      }
      if (!Array.isArray(parsed)) continue;

      for (const item of parsed) {
        if (!item || typeof item !== "object") continue;
        const record = item as { id?: unknown };
        const id = typeof record.id === "string" ? record.id : randomUUID();
        insert.run(collection, id, JSON.stringify({ ...item, id }));
      }
    }
  });

  migrate();
}

function migratePlatformContributors(db: Database.Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS data_migrations (
      name TEXT PRIMARY KEY,
      completed_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);
  const migrationName = "platform-contributors-to-database-v1";
  const alreadyMigrated = db
    .prepare("SELECT 1 FROM data_migrations WHERE name = ?")
    .get(migrationName);
  if (alreadyMigrated) return;

  const seedPath = path.join(sourceDirectory, "contributors.json");
  const seed = JSON.parse(fs.readFileSync(seedPath, "utf8")) as Array<{
    id: string;
    name: string;
    github: string;
    avatar?: string;
  }>;
  const findByGithub = db.prepare(
    "SELECT id FROM records WHERE collection = 'contributors' AND lower(json_extract(data, '$.github')) = lower(?)",
  );
  const update = db.prepare(
    "UPDATE records SET data = ?, updated_at = CURRENT_TIMESTAMP WHERE collection = 'contributors' AND id = ?",
  );
  const insert = db.prepare(
    "INSERT OR IGNORE INTO records (collection, id, data) VALUES ('contributors', ?, ?)",
  );
  const removePlaceholder = db.prepare(
    "DELETE FROM records WHERE collection = 'contributors' AND data LIKE '%\"name\":\"Example Contributor\"%'",
  );
  const markMigration = db.prepare("INSERT INTO data_migrations (name) VALUES (?)");

  db.transaction(() => {
    for (const contributor of seed) {
      const existing = findByGithub.get(contributor.github) as { id: string } | undefined;
      if (existing) {
        update.run(JSON.stringify({ ...contributor, id: existing.id }), existing.id);
      } else {
        insert.run(contributor.id, JSON.stringify(contributor));
      }
    }
    removePlaceholder.run();
    markMigration.run(migrationName);
  })();
}

function removeDuplicateContributors(db: Database.Database) {
  const migrationName = "deduplicate-platform-contributors-v1";
  const alreadyMigrated = db
    .prepare("SELECT 1 FROM data_migrations WHERE name = ?")
    .get(migrationName);
  if (alreadyMigrated) return;

  const rows = db
    .prepare("SELECT id, data FROM records WHERE collection = 'contributors' ORDER BY rowid")
    .all() as Array<{ id: string; data: string }>;
  const deleteRecord = db.prepare(
    "DELETE FROM records WHERE collection = 'contributors' AND id = ?",
  );
  const markMigration = db.prepare("INSERT INTO data_migrations (name) VALUES (?)");

  db.transaction(() => {
    const seenProfiles = new Set<string>();
    for (const row of rows) {
      let contributor: { github?: unknown };
      try {
        contributor = JSON.parse(row.data);
      } catch {
        continue;
      }
      if (typeof contributor.github !== "string") continue;
      const profile = contributor.github.trim().replace(/\/+$/, "").toLowerCase();
      if (!profile) continue;
      if (seenProfiles.has(profile)) deleteRecord.run(row.id);
      else seenProfiles.add(profile);
    }
    markMigration.run(migrationName);
  })();
}

export function getDatabase() {
  if (database) return database;

  fs.mkdirSync(databaseDirectory, { recursive: true });
  database = new Database(databasePath);
  database.pragma("journal_mode = WAL");
  database.exec(`
    CREATE TABLE IF NOT EXISTS records (
      collection TEXT NOT NULL,
      id TEXT NOT NULL,
      data TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (collection, id)
    )
  `);

  migrateJsonData(database);
  migratePlatformContributors(database);
  removeDuplicateContributors(database);
  return database;
}

export function readCollection<T>(collection: string): T[] {
  const rows = getDatabase()
    .prepare("SELECT data FROM records WHERE collection = ? ORDER BY rowid")
    .all(collection) as Array<{ data: string }>;
  return rows.map((row) => JSON.parse(row.data) as T);
}

export function closeDatabase() {
  if (!database) return;
  database.close();
  database = undefined;
}

export function appendRecord<T extends { id?: string }>(
  collection: string,
  item: T,
  idPrefix: string,
) {
  const id = item.id ?? `${idPrefix}-${randomUUID()}`;
  const record = { ...item, id } as T & { id: string };
  getDatabase()
    .prepare("INSERT INTO records (collection, id, data) VALUES (?, ?, ?)")
    .run(collection, id, JSON.stringify(record));
  return record;
}

export function updateRecord<T extends { id: string }>(collection: string, item: T) {
  const result = getDatabase()
    .prepare(
      "UPDATE records SET data = ?, updated_at = CURRENT_TIMESTAMP WHERE collection = ? AND id = ?",
    )
    .run(JSON.stringify(item), collection, item.id);
  return result.changes > 0;
}

export function deleteRecord(collection: string, id: string) {
  const result = getDatabase()
    .prepare("DELETE FROM records WHERE collection = ? AND id = ?")
    .run(collection, id);
  return result.changes > 0;
}
