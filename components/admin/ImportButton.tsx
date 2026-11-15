"use client";

import { useRef, useState } from "react";
import { Download, FileUp, X } from "lucide-react";

type ImportButtonProps = {
  type: string;
  sample: Record<string, unknown>;
  onImported: () => Promise<void> | void;
};

function parseCsv(source: string) {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;

  for (let i = 0; i < source.length; i += 1) {
    const char = source[i];
    if (quoted) {
      if (char === '"' && source[i + 1] === '"') { cell += '"'; i += 1; }
      else if (char === '"') quoted = false;
      else cell += char;
    } else if (char === '"') quoted = true;
    else if (char === ",") { row.push(cell); cell = ""; }
    else if (char === "\n") { row.push(cell.replace(/\r$/, "")); rows.push(row); row = []; cell = ""; }
    else cell += char;
  }
  if (quoted) throw new Error("Le fichier CSV contient un guillemet non fermé.");
  if (cell || row.length) { row.push(cell.replace(/\r$/, "")); rows.push(row); }

  const headers = rows.shift()?.map((header) => header.replace(/^\uFEFF/, "").trim()) ?? [];
  if (!headers.length || headers.some((header) => !header)) throw new Error("La première ligne doit contenir les noms des champs.");
  return rows.filter((values) => values.some((value) => value.trim() !== "")).map((values, index) => {
    if (values.length !== headers.length) throw new Error(`La ligne ${index + 2} contient ${values.length} colonnes au lieu de ${headers.length}.`);
    return Object.fromEntries(headers.map((header, column) => [header, parseCell(header, values[column])]));
  });
}

function parseCell(field: string, value: string): unknown {
  const trimmed = value.trim();
  if (!trimmed) return "";
  if (trimmed.startsWith("[") || trimmed.startsWith("{")) {
    try { return JSON.parse(trimmed); } catch { return value; }
  }
  if (["points", "projects", "count", "order"].includes(field) && /^-?\d+(\.\d+)?$/.test(trimmed)) return Number(trimmed);
  if (["done", "active", "completed"].includes(field) && /^(true|false)$/i.test(trimmed)) return trimmed.toLowerCase() === "true";
  return value;
}

function downloadFile(name: string, contents: string, mime: string) {
  const url = URL.createObjectURL(new Blob([contents], { type: mime }));
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = name;
  anchor.click();
  URL.revokeObjectURL(url);
}

function toCsvValue(value: unknown) {
  const text = value !== null && typeof value === "object" ? JSON.stringify(value) : String(value ?? "");
  return `"${text.replace(/"/g, '""')}"`;
}

export default function ImportButton({ type, sample, onImported }: ImportButtonProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [records, setRecords] = useState<Record<string, unknown>[]>([]);
  const [fileName, setFileName] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [success, setSuccess] = useState("");

  function downloadJsonTemplate() {
    downloadFile(`${type}-modele.json`, `${JSON.stringify([sample], null, 2)}\n`, "application/json");
  }

  function downloadCsvTemplate() {
    const headers = Object.keys(sample);
    const line = headers.map((header) => toCsvValue(sample[header])).join(",");
    downloadFile(`${type}-modele.csv`, `${headers.map(toCsvValue).join(",")}\n${line}\n`, "text/csv;charset=utf-8");
  }

  async function readFile(file?: File) {
    setError(""); setSuccess(""); setRecords([]); setFileName("");
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { setError("Le fichier dépasse la limite de 5 Mo."); return; }
    try {
      const text = await file.text();
      const parsed: unknown = file.name.toLowerCase().endsWith(".csv")
        ? parseCsv(text)
        : JSON.parse(text.replace(/^\uFEFF/, ""));
      const values = Array.isArray(parsed) ? parsed : [parsed];
      if (!values.length) throw new Error("Le fichier ne contient aucun élément.");
      if (values.length > 500) throw new Error("L’import est limité à 500 éléments par fichier.");
      if (!values.every((value) => value && typeof value === "object" && !Array.isArray(value))) throw new Error("Chaque ligne doit correspondre à un objet avec des champs nommés.");
      setRecords(values as Record<string, unknown>[]);
      setFileName(file.name);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Impossible de lire ce fichier.");
    }
  }

  async function importRecords() {
    setBusy(true); setError(""); setSuccess("");
    try {
      const response = await fetch(`/api/data/${type}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(records),
      });
      const result = await response.json().catch(() => null);
      if (!response.ok) {
        const detail = result?.details?.[0];
        throw new Error(detail ? `Ligne ${detail.row} : ${detail.error}` : result?.error || "Échec de l’import.");
      }
      await onImported();
      setSuccess(`${result.imported} élément${result.imported === 1 ? "" : "s"} importé${result.imported === 1 ? "" : "s"}.`);
      setRecords([]); setFileName("");
      if (inputRef.current) inputRef.current.value = "";
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Échec de l’import.");
    } finally { setBusy(false); }
  }

  return (
    <div className="relative">
      <button type="button" onClick={() => { setOpen((value) => !value); setError(""); }} className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2.5 text-sm font-medium text-slate-200 transition hover:border-white/20 hover:bg-white/5"><FileUp size={16} />Importer</button>
      {open && <div className="absolute right-0 z-30 mt-2 w-[min(90vw,420px)] rounded-2xl border border-white/10 bg-[#0b1827] p-4 shadow-2xl shadow-black/40 sm:p-5">
        <div className="flex items-start justify-between gap-3"><div><h3 className="font-semibold text-white">Importer des éléments</h3><p className="mt-1 text-xs leading-5 text-slate-400">Choisissez un fichier JSON ou CSV. L’import ajoute les lignes sans remplacer les données existantes.</p></div><button type="button" onClick={() => setOpen(false)} aria-label="Fermer" className="rounded-lg p-1 text-slate-500 hover:bg-white/5 hover:text-white"><X size={17} /></button></div>
        <div className="mt-4 flex flex-wrap gap-2"><button type="button" onClick={downloadJsonTemplate} className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 px-2.5 py-2 text-xs text-slate-300 hover:bg-white/5"><Download size={14} />Modèle JSON</button><button type="button" onClick={downloadCsvTemplate} className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 px-2.5 py-2 text-xs text-slate-300 hover:bg-white/5"><Download size={14} />Modèle CSV</button></div>
        <input ref={inputRef} type="file" accept=".json,.csv,application/json,text/csv" className="sr-only" onChange={(event) => readFile(event.target.files?.[0])} />
        <button type="button" onClick={() => inputRef.current?.click()} className="mt-3 w-full rounded-xl border border-dashed border-white/15 px-3 py-3 text-left text-sm text-slate-300 transition hover:border-[#d4af37]/40 hover:bg-white/[0.02]">{fileName || "Choisir un fichier .json ou .csv"}<span className="mt-1 block text-xs text-slate-500">Jusqu’à 5 Mo · 500 lignes max</span></button>
        {records.length > 0 && <div className="mt-3 rounded-xl bg-white/[0.03] p-3"><p className="text-xs font-medium text-slate-200">Aperçu · {records.length} ligne{records.length === 1 ? "" : "s"}</p><div className="mt-2 space-y-1.5">{records.slice(0, 3).map((record, index) => <p key={index} className="truncate text-xs text-slate-500">{String(record.title ?? record.name ?? Object.values(record)[0] ?? "Élément")}</p>)}{records.length > 3 && <p className="text-xs text-slate-600">et {records.length - 3} autre(s)…</p>}</div><button type="button" onClick={importRecords} disabled={busy} className="mt-3 w-full rounded-xl bg-[#d4af37] px-3 py-2.5 text-sm font-semibold text-[#14110a] transition hover:bg-[#efd779] disabled:opacity-50">{busy ? "Importation…" : `Importer ${records.length} élément${records.length === 1 ? "" : "s"}`}</button></div>}
        {error && <p role="alert" className="mt-3 rounded-lg border border-red-400/20 bg-red-950/30 p-2.5 text-xs text-red-200">{error}</p>}
        {success && <p role="status" className="mt-3 rounded-lg border border-emerald-400/20 bg-emerald-950/20 p-2.5 text-xs text-emerald-200">{success}</p>}
      </div>}
    </div>
  );
}
