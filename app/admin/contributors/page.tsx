"use client"
import { useEffect, useState } from "react"
import ImportButton from '@/components/admin/ImportButton'

type Contributor = {
  id: string
  name: string
  github: string
  avatar?: string
}

export default function AdminContributorsPage() {
  const [items, setItems] = useState<Contributor[]>([])
  const [name, setName] = useState("")
  const [github, setGithub] = useState("")
  const [editingId, setEditingId] = useState<string | null>(null)
  const [search, setSearch] = useState("")
  const [loading, setLoading] = useState(false)
  const [auth, setAuth] = useState<null | boolean>(null)
  const [password, setPassword] = useState("")

  async function checkAuth() {
    try {
      const res = await fetch('/api/admin/verify')
      setAuth(res.ok)
      if (res.ok) fetchItems()
    } catch (e) {
      setAuth(false)
    }
  }

  async function fetchItems() {
    const res = await fetch('/api/contributors')
    const data = await res.json()
    setItems(data)
  }

  useEffect(() => { checkAuth() }, [])

  async function login(e: any) {
    e.preventDefault()
    if (!password) return
    setLoading(true)
    const res = await fetch('/api/admin/login', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ password }) })
    if (res.ok) {
      setAuth(true)
      await fetchItems()
    } else {
      alert('Mot de passe incorrect')
      setAuth(false)
    }
    setLoading(false)
  }

  async function addContributor(e: any) {
    e.preventDefault()
    if (!name || !github) return
    setLoading(true)
    if (editingId) {
      const res = await fetch('/api/contributors', { method: 'PUT', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ id: editingId, name, github }) })
      if (res.ok) {
        setName('')
        setGithub('')
        setEditingId(null)
        await fetchItems()
      }
    } else {
      const res = await fetch('/api/contributors', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ name, github }) })
      if (res.ok) {
        setName('')
        setGithub('')
        await fetchItems()
      }
    }
    setLoading(false)
  }

  function startEdit(it: Contributor) {
    setEditingId(it.id)
    setName(it.name)
    setGithub(it.github)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function cancelEdit() {
    setEditingId(null)
    setName('')
    setGithub('')
  }

  async function copyLink(url: string) {
    try {
      await navigator.clipboard.writeText(url)
      alert('Lien copié')
    } catch (e) {
      console.warn('Clipboard not available')
    }
  }

  async function removeContributor(id: string) {
    if (!confirm('Supprimer ce contributeur ?')) return
    setLoading(true)
    await fetch(`/api/contributors?id=${id}`, { method: 'DELETE' })
    await fetchItems()
    setLoading(false)
  }

  if (auth === null) return <main className="content-shell py-10"><div className="max-w-4xl mx-auto">Chargement…</div></main>

  if (!auth) {
    return (
      <main className="content-shell py-10">
        <div className="max-w-2xl mx-auto">
          <div className="rounded-2xl border border-white/8 bg-gradient-to-b from-[#071428]/80 to-[#06142d]/80 p-6">
            <h1 className="text-2xl font-bold text-white">Connexion administrateur</h1>
            <p className="text-slate-300 mt-2">Entrez le mot de passe administrateur pour accéder au tableau de bord.</p>

            <form onSubmit={login} className="mt-6 flex gap-3">
              <input value={password} onChange={e=>setPassword(e.target.value)} type="password" placeholder="Mot de passe admin" className="flex-1 rounded-md border border-white/10 bg-white/5 px-3 py-2 text-white" />
              <button disabled={loading} className="rounded-md bg-[#d4af37] px-4 py-2 font-semibold text-black">{loading ? 'Connexion...' : 'Se connecter'}</button>
            </form>
          </div>
        </div>
      </main>
    )
  }

  const avatarPreview = github ? `${github.replace(/\/$/, '')}.png` : ''

  async function logout() {
    await fetch('/api/admin/logout', { method: 'POST' })
    setAuth(false)
    setItems([])
    setPassword('')
    setEditingId(null)
    setName('')
    setGithub('')
  }

  return (
    <main className="py-2 sm:py-4">
      <div className="mx-auto max-w-6xl space-y-7">
        <div className="flex items-center justify-between">
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-[#d4af37]">Communauté</p>
            <h1 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">Contributeurs</h1>
            <p className="mt-2 text-sm text-slate-400">Cette liste est affichée sur la page d’accueil.</p>
          </div>
          <div className="flex items-center gap-3">
            <ImportButton type="contributors" sample={{ name: '', github: 'https://github.com/', avatar: '' }} onImported={fetchItems} />
            <button onClick={logout} className="rounded-md bg-white/5 px-3 py-2 text-sm text-white">Déconnexion</button>
          </div>
        </div>

        <div className="mt-6 grid gap-6 md:grid-cols-3">
          <div className="md:col-span-1 rounded-2xl border border-white/[0.08] bg-[#0b1827] p-5 sm:p-6">
            <h2 className="text-lg font-semibold text-white">{editingId ? 'Modifier le profil' : 'Ajouter un profil'}</h2>
            <p className="mt-1 text-sm text-slate-400">Le profil sera visible sur l’accueil après enregistrement.</p>

            <form onSubmit={addContributor} className="mt-4 space-y-3">
              <label className="block text-xs font-medium text-slate-400">Nom affiché<input required value={name} onChange={e=>setName(e.target.value)} placeholder="Ex. Alex Martin" className="mt-1.5 w-full rounded-xl border border-white/10 bg-[#07111f] px-3 py-2.5 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-[#d4af37]/60 focus:ring-2 focus:ring-[#d4af37]/10" /></label>
              <label className="block text-xs font-medium text-slate-400">Profil GitHub<input required type="url" value={github} onChange={e=>setGithub(e.target.value)} placeholder="https://github.com/username" className="mt-1.5 w-full rounded-xl border border-white/10 bg-[#07111f] px-3 py-2.5 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-[#d4af37]/60 focus:ring-2 focus:ring-[#d4af37]/10" /></label>

              <div className="flex items-center gap-3">
                <div className="w-16 h-16 rounded-full overflow-hidden bg-white/5 flex items-center justify-center">
                  {avatarPreview ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={avatarPreview} alt="preview" className="w-full h-full object-cover" />
                  ) : (
                    <div className="text-sm text-slate-400">Aperçu</div>
                  )}
                </div>
                <div className="ml-auto flex items-center gap-2">
                  {editingId && (
                    <button type="button" onClick={cancelEdit} className="rounded-md bg-white/5 px-3 py-2 text-sm text-white">Annuler</button>
                  )}
                  <button type="submit" disabled={loading} className="rounded-md bg-[#d4af37] px-4 py-2 font-semibold text-black">{loading ? 'Enregistrement...' : (editingId ? 'Enregistrer' : 'Ajouter')}</button>
                </div>
              </div>
            </form>
          </div>

          <div className="md:col-span-2 rounded-2xl border border-white/[0.08] bg-[#0b1827] p-5 sm:p-6">
            <div className="flex items-center justify-between"><div><h2 className="text-lg font-semibold text-white">Sur la plateforme</h2><p className="mt-1 text-xs text-slate-500">{items.length} profil{items.length === 1 ? '' : 's'}</p></div><span className="rounded-full border border-emerald-300/15 bg-emerald-300/[0.07] px-2.5 py-1 text-[11px] text-emerald-200">Synchronisé</span></div>
            <div className="mt-4">
              <div className="flex items-center gap-3 mb-4">
                <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Rechercher par nom ou pseudo" className="flex-1 rounded-md border border-white/10 bg-white/5 px-3 py-2 text-white" />
                <button onClick={() => { setSearch(''); fetchItems() }} className="rounded-md bg-white/5 px-3 py-2 text-sm text-white">Effacer</button>
              </div>

              <div className="max-h-[60vh] overflow-auto divide-y divide-white/6 pr-2">
                {items.filter(it => {
                  if (!search) return true
                  const username = it.github.replace(/^https?:\/\/(www\.)?github.com\//, '').replace(/\/$/, '')
                  return it.name.toLowerCase().includes(search.toLowerCase()) || username.toLowerCase().includes(search.toLowerCase())
                }).map(it => {
                  const username = it.github.replace(/^https?:\/\/(www\.)?github.com\//, '').replace(/\/$/, '')
                  return (
                    <div key={it.id} className="flex items-center gap-3 py-3">
                      <a href={it.github} target="_blank" rel="noreferrer" className="block flex-shrink-0">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={it.avatar || `${it.github.replace(/\/$/, '')}.png`} alt={it.name} className="h-12 w-12 rounded-full object-cover" />
                      </a>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <div className="font-semibold text-white truncate">{it.name}</div>
                          <div className="text-xs text-slate-300 bg-white/3 px-2 py-0.5 rounded">@{username}</div>
                        </div>
                        <a className="text-sm text-slate-300 truncate block" href={it.github} target="_blank" rel="noreferrer">{it.github}</a>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => copyLink(it.github)} title="Copier le lien" className="rounded-md bg-white/5 px-2 py-1 text-sm text-white">Copier</button>
                        <button onClick={() => startEdit(it)} title="Modifier" className="rounded-md bg-white/5 px-2 py-1 text-sm text-white">Éditer</button>
                        <button onClick={() => removeContributor(it.id)} className="rounded-md bg-red-600 px-3 py-1 text-white text-sm">Supprimer</button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
