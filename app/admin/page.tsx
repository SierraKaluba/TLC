"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight, Database, Plus, Users } from "lucide-react";

type Contributor = { id: string; name: string; github: string; avatar?: string };

export default function AdminHome() {
  const [items, setItems] = useState<Contributor[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/contributors", { cache: "no-store" })
      .then((response) => response.ok ? response.json() : [])
      .then((data: Contributor[]) => setItems(Array.isArray(data) ? data : []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-8">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div><p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-[#d4af37]">TLC · Administration</p><h1 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">Vue d’ensemble</h1><p className="mt-2 max-w-xl text-sm text-slate-400">Gérez les contenus et les personnes qui font vivre la plateforme.</p></div>
        <Link href="/admin/contributors" className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#d4af37] px-4 py-2.5 text-sm font-semibold text-[#14110a] transition hover:bg-[#efd779]"><Plus size={16} />Ajouter un contributeur</Link>
      </div>

      <section className="grid gap-4 sm:grid-cols-2">
        <article className="rounded-2xl border border-white/[0.08] bg-gradient-to-br from-[#10233a] to-[#0c1929] p-5 sm:p-6">
          <div className="flex items-start justify-between"><div className="rounded-xl bg-[#d4af37]/10 p-2.5 text-[#e8c96d]"><Users size={20} /></div><span className="rounded-full border border-emerald-300/15 bg-emerald-300/[0.07] px-2.5 py-1 text-[11px] text-emerald-200">Page publique</span></div>
          <div className="mt-6 text-sm text-slate-400">Contributeurs affichés</div><div className="mt-1 text-4xl font-semibold tracking-tight text-white">{loading ? <span className="inline-block h-10 w-12 animate-pulse rounded bg-white/10" /> : items.length}</div>
          <Link href="/admin/contributors" className="mt-5 inline-flex items-center gap-2 text-sm font-medium text-[#e8c96d] hover:text-[#f4df9e]">Gérer les contributeurs <ArrowRight size={15} /></Link>
        </article>
        <article className="rounded-2xl border border-white/[0.08] bg-gradient-to-br from-[#10233a] to-[#0c1929] p-5 sm:p-6">
          <div className="flex items-start justify-between"><div className="rounded-xl bg-sky-300/10 p-2.5 text-sky-200"><Database size={20} /></div><span className="rounded-full border border-white/10 px-2.5 py-1 text-[11px] text-slate-400">8 collections</span></div>
          <div className="mt-6 text-sm text-slate-400">Contenus de la plateforme</div><div className="mt-1 text-2xl font-semibold tracking-tight text-white">Données centralisées</div>
          <Link href="/admin/data" className="mt-5 inline-flex items-center gap-2 text-sm font-medium text-sky-200 hover:text-sky-100">Parcourir les collections <ArrowRight size={15} /></Link>
        </article>
      </section>

      <section className="overflow-hidden rounded-2xl border border-white/[0.08] bg-[#0b1827]">
        <div className="flex items-center justify-between border-b border-white/[0.07] px-5 py-4 sm:px-6"><div><h2 className="font-semibold text-white">Contributeurs de la plateforme</h2><p className="mt-1 text-xs text-slate-500">La même liste que celle affichée sur l’accueil</p></div><Link href="/admin/contributors" className="text-xs font-medium text-[#e8c96d] hover:text-[#f4df9e]">Tout voir</Link></div>
        <div className="grid gap-px bg-white/[0.06] sm:grid-cols-2 xl:grid-cols-3">
          {loading ? Array.from({ length: 6 }, (_, i) => <div key={i} className="flex items-center gap-3 bg-[#0b1827] p-4"><div className="h-10 w-10 animate-pulse rounded-full bg-white/10" /><div className="h-3 w-32 animate-pulse rounded bg-white/10" /></div>) : items.slice(0, 6).map((item) => <div key={item.id} className="flex min-w-0 items-center gap-3 bg-[#0b1827] p-4"><img src={item.avatar || `${item.github.replace(/\/$/, "")}.png`} alt="" className="h-10 w-10 rounded-full border border-white/10 object-cover" /><div className="min-w-0"><div className="truncate text-sm font-medium text-slate-200">{item.name}</div><div className="truncate text-xs text-slate-500">{item.github.replace(/^https?:\/\/(www\.)?github.com\//, "")}</div></div></div>)}
          {!loading && items.length === 0 && <p className="col-span-full px-5 py-10 text-center text-sm text-slate-500">Aucun contributeur pour le moment.</p>}
        </div>
      </section>
    </div>
  );
}
