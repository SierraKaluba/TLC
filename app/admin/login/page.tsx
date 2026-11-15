"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Lock } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const response = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });

    if (response.ok) {
      setPassword("");
      router.push("/admin/data");
    } else {
      setError("Mot de passe incorrect ou administration non configurée");
    }

    setLoading(false);
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#07111f] px-4 py-16">
      <div className="pointer-events-none absolute -left-32 top-0 h-96 w-96 rounded-full bg-[#0b3d91]/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-40 -right-20 h-96 w-96 rounded-full bg-[#d4af37]/10 blur-3xl" />
      <div className="relative w-full max-w-md">
        <div className="rounded-3xl border border-white/10 bg-[#0b1827]/90 p-7 shadow-2xl shadow-black/30 backdrop-blur-xl sm:p-9">
          <div className="mb-8 flex justify-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-[#d4af37]/20 bg-[#d4af37]/10">
              <Lock className="h-6 w-6 text-[#d4af37]" />
            </div>
          </div>

          <h1 className="mb-2 text-center text-2xl font-semibold text-white">
            Espace Administrateur
          </h1>
          <p className="mb-8 text-center text-sm text-slate-400">
            Connectez-vous pour accéder au tableau de bord
          </p>

          {error && (
            <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900/30 dark:bg-red-950/30 dark:text-red-400">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label htmlFor="password" className="mb-2 block text-sm font-medium text-slate-200">
                Mot de passe
              </label>
              <input
                id="password"
                type="password"
                placeholder="Entrez votre mot de passe"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-[#07111f] px-4 py-3 text-white placeholder-slate-600 outline-none transition focus:border-[#d4af37]/60 focus:ring-2 focus:ring-[#d4af37]/10"
                required
                autoFocus
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-[#d4af37] px-6 py-3 font-semibold text-[#14110a] transition hover:bg-[#efd779] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? "Connexion..." : "Se connecter"}
            </button>
          </form>

          <div className="mt-8 border-t border-white/[0.07] pt-6">
            <Link
              href="/community"
              className="inline-flex items-center text-sm text-slate-400 transition-colors hover:text-[#d4af37]"
            >
              ← Retour à la communauté
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
