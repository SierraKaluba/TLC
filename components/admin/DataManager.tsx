"use client";

import { useEffect, useState } from "react";
import ImportButton from "@/components/admin/ImportButton";

type RecordItem = { id?: string; title?: string; name?: string; [key: string]: unknown };
type Field = { key: string; label: string; type?: "text" | "url" | "date" | "number" | "textarea" | "list" | "select"; options?: string[]; placeholder?: string };

const TEMPLATES: Record<string, { title: string; expected: string; tips: string[]; template: RecordItem }> = {
  contributors: { title: "Contributeurs", expected: "Nom et URL GitHub requis. L’image est facultative.", tips: ["Utilisez une URL GitHub complète."], template: { name: "", github: "https://github.com/username", avatar: "" } },
  profiles: { title: "Profils communauté", expected: "Nom et rôle requis.", tips: ["Ajoutez les compétences une par ligne."], template: { name: "", role: "", skills: [], points: 0, projects: 0 } },
  projects: { title: "Projets", expected: "Nom du projet requis.", tips: ["Ajoutez les membres et tâches dans les sections dédiées."], template: { title: "", description: "", members: [], tasks: [] } },
  events: { title: "Événements", expected: "Titre, date et type requis.", tips: ["La date s’affiche au format année-mois-jour."], template: { title: "", date: "", type: "Atelier", description: "" } },
  resources: { title: "Publications, ressources et tllib", expected: "Titre et domaine requis. Ces \u00e9l\u00e9ments alimentent le catalogue public, notamment les publications logicielles comme tllib.", tips: ["Ajoutez un lien complet commen\u00e7ant par https:// lorsqu\u2019il existe."], template: { title: "", category: "Recherche", kind: "Article", author: "", year: new Date().getFullYear(), url: "" } },
  experiments: { title: "Expériences", expected: "Titre requis.", tips: ["Décrivez le contexte et les résultats dans les notes."], template: { title: "", notes: "" } },
  "open-calls": { title: "Appels ouverts", expected: "Titre et description requis.", tips: ["Choisissez un niveau d’urgence."], template: { title: "", description: "", urgency: "medium" } },
  discussions: { title: "Discussions", expected: "Sujet requis.", tips: ["Les messages initiaux sont facultatifs."], template: { title: "", messages: [] } },
  news: { title: "Actualit\u00e9s", expected: "Titre, r\u00e9sum\u00e9, contenu et statut requis. Seules les actualit\u00e9s publi\u00e9es sont visibles sur le site.", tips: ["Enregistrez un brouillon pour pr\u00e9parer une publication."], template: { title: "", excerpt: "", body: "", category: "Actualit\u00e9", coverImage: "", publishedAt: new Date().toISOString().slice(0, 10), status: "draft" } },
};

const FIELDS: Record<string, Field[]> = {
  contributors: [
    { key: "name", label: "Nom affiché", placeholder: "Ex. Alex Martin" },
    { key: "github", label: "Profil GitHub", type: "url", placeholder: "https://github.com/username" },
    { key: "avatar", label: "Lien de l’image (facultatif)", type: "url", placeholder: "https://… ou /images/photo.jpg" },
  ],
  profiles: [
    { key: "name", label: "Nom" }, { key: "role", label: "Rôle" },
    { key: "skills", label: "Compétences", type: "list", placeholder: "Une compétence par ligne" },
    { key: "points", label: "Points", type: "number" }, { key: "projects", label: "Projets réalisés", type: "number" },
  ],
  projects: [
    { key: "title", label: "Nom du projet" }, { key: "domain", label: "Domaine", placeholder: "Recherche, NLP, vision..." },
    { key: "status", label: "Statut", type: "select", options: ["En preparation", "En cours", "Publie", "Termine", "Recrutement ouvert"] },
    { key: "lead", label: "Responsable" }, { key: "progress", label: "Progression (%)", type: "number" },
    { key: "description", label: "Description", type: "textarea" },
    { key: "technologies", label: "Technologies", type: "list", placeholder: "Une technologie par ligne" },
    { key: "members", label: "Membres", type: "list", placeholder: "Un nom ou identifiant par ligne" },
  ],
  events: [
    { key: "title", label: "Nom de l’événement" }, { key: "date", label: "Date", type: "date" },
    { key: "type", label: "Type", placeholder: "Atelier, webinaire…" }, { key: "description", label: "Description", type: "textarea" },
  ],
  resources: [
    { key: "title", label: "Titre" }, { key: "category", label: "Domaine", placeholder: "Recherche, logiciel\u2026" },
    { key: "kind", label: "Type de publication", type: "select", options: ["Article", "Dataset", "Note", "Guide", "Produit logiciel", "Documentation"] },
    { key: "author", label: "Auteur ou \u00e9quipe" }, { key: "year", label: "Ann\u00e9e", type: "number" },
    { key: "url", label: "Lien", type: "url", placeholder: "https://" },
  ],
  experiments: [{ key: "title", label: "Titre" }, { key: "notes", label: "Notes", type: "textarea" }],
  "open-calls": [
    { key: "title", label: "Titre" }, { key: "description", label: "Description", type: "textarea" },
    { key: "urgency", label: "Urgence", type: "select", options: ["low", "medium", "high"] },
  ],
  discussions: [{ key: "title", label: "Sujet" }],
  news: [
    { key: "title", label: "Titre" }, { key: "excerpt", label: "R\u00e9sum\u00e9", type: "textarea" },
    { key: "body", label: "Contenu", type: "textarea" }, { key: "category", label: "Rubrique" },
    { key: "publishedAt", label: "Date de publication", type: "date" },
    { key: "coverImage", label: "Image de couverture", type: "url", placeholder: "https:// or /images/" },
    { key: "status", label: "Publication", type: "select", options: ["draft", "published"] },
  ],
};

const REQUIRED_FIELDS: Record<string, string[]> = {
  contributors: ["name", "github"], profiles: ["name", "role"], projects: ["title"],
  events: ["title", "date", "type"], resources: ["title", "category"],
  experiments: ["title"], "open-calls": ["title", "description"], discussions: ["title"],
  news: ["title", "excerpt", "body", "status"],
};

const inputClass = "mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-500 focus:border-amber-500 focus:ring-2 focus:ring-amber-100";

export default function DataManager({ type }: { type: string }) {
  const help = TEMPLATES[type] ?? { title: type, expected: "Respectez les champs attendus pour cette collection.", tips: [], template: { title: "" } };
  const [items, setItems] = useState<RecordItem[]>([]);
  const [form, setForm] = useState<RecordItem>({});
  const [editorValue, setEditorValue] = useState("");
  const [editing, setEditing] = useState<RecordItem | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [jsonError, setJsonError] = useState("");

  async function fetchItems() {
    setLoading(true);
    setError("");
    try {
      const response = await fetch(`/api/data/${type}`, { cache: "no-store" });
      if (!response.ok) throw new Error();
      const data = await response.json();
      setItems(Array.isArray(data) ? data : []);
    } catch { setError("Impossible de charger les données."); setItems([]); }
    finally { setLoading(false); }
  }

  useEffect(() => { void fetchItems(); }, [type]);

  function setFormValue(next: RecordItem) {
    setForm(next);
    setEditorValue(JSON.stringify(next, null, 2));
    setJsonError("");
  }

  function startNew() {
    setEditing(null);
    setError(""); setSuccess("");
    setFormValue(JSON.parse(JSON.stringify(help.template)) as RecordItem);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function startEdit(item: RecordItem) {
    setEditing(item);
    setError(""); setSuccess("");
    setFormValue(JSON.parse(JSON.stringify(item)) as RecordItem);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function updateField(key: string, value: unknown) {
    setFormValue({ ...form, [key]: value });
  }

  function updateJson(value: string) {
    setEditorValue(value);
    try {
      const parsed: unknown = JSON.parse(value);
      if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) throw new Error();
      setForm(parsed as RecordItem);
      setJsonError("");
    } catch { setJsonError("Le JSON doit être un objet valide avant l’enregistrement."); }
  }

  function updateNested(field: "tasks" | "messages", index: number, key: string, value: unknown) {
    const rows = Array.isArray(form[field]) ? [...form[field] as RecordItem[]] : [];
    rows[index] = { ...rows[index], [key]: value };
    updateField(field, rows);
  }

  function addNested(field: "tasks" | "messages") {
    const rows = Array.isArray(form[field]) ? [...form[field] as RecordItem[]] : [];
    rows.push(field === "tasks"
      ? { id: `task-${crypto.randomUUID()}`, title: "", done: false }
      : { id: `message-${crypto.randomUUID()}`, author: "", text: "" });
    updateField(field, rows);
  }

  function removeNested(field: "tasks" | "messages", index: number) {
    const rows = Array.isArray(form[field]) ? [...form[field] as RecordItem[]] : [];
    updateField(field, rows.filter((_, rowIndex) => rowIndex !== index));
  }

  async function save() {
    if (jsonError) { setError(jsonError); return; }
    const missingField = (REQUIRED_FIELDS[type] ?? []).find((key) => {
      const value = form[key];
      return typeof value !== "string" || !value.trim();
    });
    if (missingField) {
      const label = FIELDS[type]?.find((field) => field.key === missingField)?.label ?? missingField;
      setError(`Le champ « ${label} » est obligatoire.`);
      return;
    }
    setLoading(true); setError(""); setSuccess("");
    const payload = { ...form };
    if (editing?.id) payload.id = editing.id;
    try {
      const response = await fetch(`/api/data/${type}`, {
        method: editing?.id ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const result = await response.json().catch(() => null);
        throw new Error(result?.error || "Erreur lors de l’enregistrement.");
      }
      await fetchItems();
      setEditing(null); setForm({}); setEditorValue("");
      setSuccess(editing ? "Modifications enregistrées." : "Élément ajouté avec succès.");
    } catch (caught) { setError(caught instanceof Error ? caught.message : "Impossible d’enregistrer les données."); }
    finally { setLoading(false); }
  }

  async function remove(id?: string) {
    if (!id || !confirm("Supprimer cet élément ?")) return;
    setLoading(true); setError(""); setSuccess("");
    try {
      const response = await fetch(`/api/data/${type}?id=${encodeURIComponent(id)}`, { method: "DELETE" });
      if (!response.ok) throw new Error("Impossible de supprimer cet élément.");
      await fetchItems(); setSuccess("Élément supprimé.");
    } catch (caught) { setError(caught instanceof Error ? caught.message : "Erreur de suppression."); }
    finally { setLoading(false); }
  }

  const nestedRows = (field: "tasks" | "messages") => Array.isArray(form[field]) ? form[field] as RecordItem[] : [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div><p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-[#d4af37]">Collection</p><h2 className="text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">{help.title}</h2><p className="mt-1 text-sm text-slate-500">Ajoutez, modifiez ou retirez des éléments.</p></div>
        <div className="flex flex-wrap gap-2"><ImportButton type={type} sample={help.template} onImported={fetchItems} /><button onClick={startNew} className="rounded-xl bg-[#d4af37] px-4 py-2.5 text-sm font-semibold text-[#14110a] transition hover:bg-[#efd779]">Nouvel élément</button><button onClick={fetchItems} disabled={loading} className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm text-slate-700 transition hover:bg-slate-100 disabled:opacity-50">Actualiser</button></div>
      </div>

      {error && <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">{error}</div>}
      {success && <div role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">{success}</div>}

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"><div className="text-sm font-semibold text-slate-900">À propos des champs</div><p className="mt-1 text-sm text-slate-500">{help.expected}</p>{help.tips.length > 0 && <ul className="mt-2 list-disc space-y-1 pl-5 text-xs text-slate-500">{help.tips.map((tip) => <li key={tip}>{tip}</li>)}</ul>}</div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1.35fr)_minmax(280px,.8fr)]">
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="mb-5 flex items-start justify-between gap-3"><div><h3 className="text-base font-semibold text-slate-900">{editing ? "Modifier les informations" : "Informations de l’élément"}</h3><p className="mt-1 text-xs text-slate-500">Remplissez les champs ci-dessous. Les champs obligatoires sont marqués d’un astérisque.</p></div><span className="shrink-0 rounded-full bg-white/[0.05] px-2.5 py-1 text-[11px] text-slate-500">{editing ? "Modification" : "Nouvel élément"}</span></div>

          {FIELDS[type] ? <div className="grid gap-4 sm:grid-cols-2">{FIELDS[type].map((field) => {
            const value = form[field.key];
            const wide = field.type === "textarea" || field.type === "list";
            const required = (REQUIRED_FIELDS[type] ?? []).includes(field.key);
            return <label key={field.key} className={`block text-xs font-medium text-slate-500 ${wide ? "sm:col-span-2" : ""}`}>{field.label}{required ? " *" : ""}
              {field.type === "textarea" || field.type === "list" ? <textarea rows={field.type === "list" ? 3 : 4} required={required} value={field.type === "list" ? (Array.isArray(value) ? value.join("\n") : "") : String(value ?? "")} onChange={(event) => updateField(field.key, field.type === "list" ? event.target.value.split(/[\n,]/).map((entry) => entry.trim()).filter(Boolean) : event.target.value)} placeholder={field.placeholder || (field.type === "list" ? "Un élément par ligne" : "")} className={inputClass} />
                : field.type === "select" ? <select value={String(value ?? field.options?.[0] ?? "")} onChange={(event) => updateField(field.key, event.target.value)} className={inputClass}>{field.options?.map((option) => <option key={option} value={option} className="bg-white">{option}</option>)}</select>
                  : <input type={field.type || "text"} required={required} value={String(value ?? "")} onChange={(event) => updateField(field.key, field.type === "number" ? (event.target.value === "" ? "" : Number(event.target.value)) : event.target.value)} placeholder={field.placeholder} className={inputClass} />}
            </label>;
          })}</div> : <p className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">Aucun formulaire standard n’est défini pour cette collection. Utilisez le JSON dans les options avancées.</p>}

          {type === "projects" && <div className="mt-5 rounded-xl border border-slate-200 p-4"><div className="mb-3 flex items-center justify-between"><div><h4 className="text-sm font-medium text-slate-700">Tâches du projet</h4><p className="mt-1 text-xs text-slate-500">Ajoutez les tâches et cochez celles qui sont terminées.</p></div><button type="button" onClick={() => addNested("tasks")} className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-100">Ajouter une tâche</button></div>
            {nestedRows("tasks").map((task, index) => <div key={String(task.id ?? index)} className="mb-2 flex items-center gap-2"><input aria-label="Titre de la tâche" value={String(task.title ?? "")} onChange={(event) => updateNested("tasks", index, "title", event.target.value)} placeholder="Description de la tâche" className={`${inputClass} mt-0`} /><label className="flex shrink-0 items-center gap-2 text-xs text-slate-500"><input type="checkbox" checked={Boolean(task.done)} onChange={(event) => updateNested("tasks", index, "done", event.target.checked)} className="accent-[#d4af37]" />Terminée</label><button type="button" aria-label="Retirer la tâche" onClick={() => removeNested("tasks", index)} className="rounded-lg px-2 py-2 text-slate-500 hover:bg-rose-50 hover:text-rose-700">×</button></div>)}
            {nestedRows("tasks").length === 0 && <p className="text-xs text-slate-500">Aucune tâche ajoutée.</p>}</div>}

          {type === "discussions" && <div className="mt-5 rounded-xl border border-slate-200 p-4"><div className="mb-3 flex items-center justify-between"><div><h4 className="text-sm font-medium text-slate-700">Messages</h4><p className="mt-1 text-xs text-slate-500">Ajoutez les messages initiaux de la discussion.</p></div><button type="button" onClick={() => addNested("messages")} className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-100">Ajouter un message</button></div>
            {nestedRows("messages").map((message, index) => <div key={String(message.id ?? index)} className="mb-3 grid gap-2 rounded-xl bg-slate-50 p-3 sm:grid-cols-[1fr_2fr_auto]"><input aria-label="Auteur" value={String(message.author ?? "")} onChange={(event) => updateNested("messages", index, "author", event.target.value)} placeholder="Auteur" className={`${inputClass} mt-0`} /><input aria-label="Message" value={String(message.text ?? "")} onChange={(event) => updateNested("messages", index, "text", event.target.value)} placeholder="Texte du message" className={`${inputClass} mt-0`} /><button type="button" onClick={() => removeNested("messages", index)} className="rounded-lg px-2 py-2 text-slate-500 hover:bg-rose-50 hover:text-rose-700">Retirer</button></div>)}
            {nestedRows("messages").length === 0 && <p className="text-xs text-slate-500">Aucun message ajouté.</p>}</div>}

          <details className="mt-5 rounded-xl border border-slate-200 p-4"><summary className="cursor-pointer text-sm font-medium text-slate-700">Options avancées · modifier le JSON</summary><div className="mt-3"><textarea spellCheck={false} aria-label="Éditeur JSON avancé" className="min-h-56 w-full rounded-xl border border-slate-200 bg-slate-50 p-4 font-mono text-xs leading-6 text-slate-700 outline-none transition focus:border-[#d4af37]/50 focus:ring-2 focus:ring-[#d4af37]/10" value={editorValue} onChange={(event) => updateJson(event.target.value)} /><p className={`mt-2 text-xs ${jsonError ? "text-rose-700" : "text-slate-500"}`}>{jsonError || "Les changements JSON sont synchronisés avec le formulaire ci-dessus."}</p></div></details>

          <div className="mt-5 flex flex-wrap gap-2 border-t border-slate-100 pt-4"><button onClick={save} disabled={loading || !Object.keys(form).length || Boolean(jsonError)} className="rounded-xl bg-[#d4af37] px-4 py-2.5 text-sm font-semibold text-[#14110a] transition hover:bg-[#efd779] disabled:cursor-not-allowed disabled:opacity-50">{loading ? "Enregistrement…" : editing ? "Enregistrer les modifications" : "Ajouter à la plateforme"}</button><button onClick={() => { setEditing(null); setForm({}); setEditorValue(""); setJsonError(""); setError(""); setSuccess(""); }} className="rounded-xl px-4 py-2.5 text-sm text-slate-500 transition hover:bg-slate-100 hover:text-slate-900">Réinitialiser</button></div>
        </section>

        <aside className="max-h-[70vh] overflow-auto rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5"><div className="mb-3 flex items-center justify-between"><h3 className="text-sm font-semibold text-slate-900">Éléments</h3><span className="rounded-full bg-white/[0.06] px-2 py-0.5 text-xs text-slate-500">{items.length}</span></div>{items.length === 0 && !loading && <p className="rounded-xl border border-dashed border-slate-200 px-3 py-8 text-center text-xs text-slate-500">Aucun élément. Ajoutez le premier pour commencer.</p>}<ul className="space-y-2">{items.map((item) => <li key={item.id} className="flex items-center justify-between gap-2 rounded-xl border border-slate-100 bg-slate-50 p-2.5"><button onClick={() => startEdit(item)} className="min-w-0 flex-1 truncate text-left text-sm text-slate-700 hover:text-slate-900">{item.title || item.name || item.id}</button><div className="flex shrink-0 gap-1"><button onClick={() => startEdit(item)} aria-label={`Modifier ${item.title || item.name || "cet élément"}`} className="rounded-lg px-2 py-1 text-xs text-slate-700 hover:bg-slate-100">Modifier</button><button onClick={() => remove(item.id)} aria-label={`Supprimer ${item.title || item.name || "cet élément"}`} className="rounded-lg px-2 py-1 text-xs text-rose-700 hover:bg-rose-50">Supprimer</button></div></li>)}</ul></aside>
      </div>
    </div>
  );
}
