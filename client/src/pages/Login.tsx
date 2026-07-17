import { supabase } from "@/lib/supabase";
import { FormEvent, useState } from "react";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    const result = await supabase.auth.signInWithPassword({ email, password });
    if (result.error) setError("E-mail ou senha inválidos.");
    setLoading(false);
  }

  return (
    <main className="min-h-screen bg-[#07111E] px-6 flex items-center justify-center">
      <section className="w-full max-w-md rounded-2xl bg-[#F8F6F1] p-8 shadow-2xl">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#113A7A] text-xl font-bold text-[#D8B768]">
            DWO
          </div>
          <h1 className="text-2xl font-semibold text-[#07111E]">Dog Washer One</h1>
          <p className="mt-2 text-sm text-slate-600">
            Gestão, ensino e operação em uma única plataforma.
          </p>
        </div>

        <form className="space-y-5" onSubmit={handleSubmit}>
          <label className="block text-sm font-medium text-slate-700">
            E-mail
            <input
              className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 outline-none focus:border-[#C9A24E] focus:ring-2 focus:ring-[#D8B768]/40"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </label>
          <label className="block text-sm font-medium text-slate-700">
            Senha
            <input
              className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 outline-none focus:border-[#C9A24E] focus:ring-2 focus:ring-[#D8B768]/40"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
          </label>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button
            className="w-full rounded-lg bg-[#113A7A] px-4 py-3 font-medium text-white transition hover:bg-[#07111E] disabled:opacity-60"
            type="submit"
            disabled={loading}
          >
            {loading ? "Entrando..." : "Entrar"}
          </button>
        </form>
      </section>
    </main>
  );
}
