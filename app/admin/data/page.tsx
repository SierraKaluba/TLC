"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowUpRight, BookOpen, CalendarDays, FlaskConical, FolderKanban, Layers3, MessageSquare, Newspaper, Radio, Users, type LucideIcon } from "lucide-react";

type Entry = { key: string; title: string; description: string; href: string; icon: LucideIcon; publicPage?: string };
const groups: { title: string; note: string; entries: Entry[] }[] = [
  { title: "Contenus du site", note: "Ces collections alimentent directement les rubriques publiques.", entries: [
    { key: "contributors", title: "Contributeurs", description: "Annuaire et profils affiches sur l'accueil.", href: "/admin/data/contributors", icon: Users, publicPage: "/community" },
    { key: "projects", title: "Projets TLC", description: "Fiches projets, equipes et taches.", href: "/admin/data/projects", icon: FolderKanban, publicPage: "/projects" },
    { key: "events", title: "Evenements", description: "Rendez-vous et agenda communautaire.", href: "/admin/data/events", icon: CalendarDays, publicPage: "/events" },
    { key: "resources", title: "Publications et tllib", description: "Catalogue des articles, jeux de donnees et logiciels.", href: "/admin/data/resources", icon: BookOpen, publicPage: "/resources" },
    { key: "news", title: "Actualites", description: "Articles publies sur le blog TLC.", href: "/admin/data/news", icon: Newspaper, publicPage: "/blog" },
  ] },
  { title: "Communaute et recherche", note: "Donnees de travail et de participation.", entries: [
    { key: "profiles", title: "Profils communautaires", description: "Roles, competences et participation des membres.", href: "/admin/data/profiles", icon: Users },
    { key: "open-calls", title: "Appels a contribution", description: "Besoins et missions ouverts.", href: "/admin/data/open-calls", icon: Radio },
    { key: "discussions", title: "Discussions", description: "Sujets et echanges de la communaute.", href: "/admin/data/discussions", icon: MessageSquare },
    { key: "experiments", title: "Experiences", description: "Prototypes, notes et resultats de tests.", href: "/admin/data/experiments", icon: FlaskConical },
  ] },
];

export default function AdminDataIndex() {
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let active = true;
    Promise.all(groups.flatMap((group) => group.entries).map(async ({ key }) => {
      try {
        const response = await fetch("/api/data/" + key, { cache: "no-store" });
        const data = response.ok ? await response.json() : [];
        return [key, Array.isArray(data) ? data.length : 0] as const;
      } catch { return [key, 0] as const; }
    })).then((rows) => {
      if (active) setCounts(Object.fromEntries(rows));
    }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  return <div className="space-y-8">
    <header><p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#9a7427]">Bibliotheque de contenu</p><h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">Toutes les collections</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">Chaque collection dispose d&#8217;un formulaire dedie et alimente les vues indiquees ci-dessous.</p></header>
    {groups.map((group) => <section key={group.title}>
      <div className="mb-4"><h2 className="text-lg font-semibold text-slate-900">{group.title}</h2><p className="mt-1 text-sm text-slate-500">{group.note}</p></div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {group.entries.map(({ key, title, description, href, icon: Icon, publicPage }) => <Link key={key} href={href} className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-amber-300 hover:shadow-md">
          <div className="flex items-start justify-between"><span className="grid h-10 w-10 place-items-center rounded-xl bg-amber-50 text-[#9a7427]"><Icon size={19} /></span><ArrowUpRight size={17} className="text-slate-300 group-hover:text-[#9a7427]" /></div>
          <div className="mt-4 flex items-baseline justify-between gap-2"><h3 className="font-semibold text-slate-900">{title}</h3><span className="text-sm font-semibold text-slate-700">{loading ? "..." : counts[key] ?? 0}</span></div>
          <p className="mt-1.5 min-h-10 text-sm leading-5 text-slate-500">{description}</p>
          <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 text-xs text-slate-500"><span className="inline-flex items-center gap-2"><Layers3 size={13} />{key}</span>{publicPage && <span>Vue publique : {publicPage}</span>}</div>
        </Link>)}
      </div>
    </section>)}
  </div>;
}
