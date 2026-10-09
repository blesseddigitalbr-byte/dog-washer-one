import { supabase } from "@/lib/supabase";
import { FormEvent, useEffect, useState } from "react";
import { loginBrand } from "../../../shared/loginBrand";

export default function Login() {
  const brand = loginBrand(window.location.hostname);
  useEffect(() => { document.title = `${brand.name} | Entrar`; }, [brand.name]);
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
    <main style={{ backgroundColor: brand.background }} className="min-h-screen px-6 flex items-center justify-center">
      <section className={`w-full max-w-md rounded-2xl p-8 shadow-xl ${brand.lux ? "bg-white border border-purple-100" : "bg-[#F8F6F1]"}`}>
        <div className="mb-8 text-center">
          {brand.lux ? <>
            <div className="relative mx-auto h-28 w-28 overflow-hidden rounded-full bg-white">
              <img src={brand.logo} alt="Lux Dog" className="absolute left-1/2 top-1/2 w-[525px] max-w-none" style={{ transform: "translate(-50%, -32.5%)" }} />
            </div>
            <p className="mt-3 text-xs font-medium text-purple-600">by Dog Washer</p>
          </> : <img
            src="/brand/dwo-horizontal.png"
            alt="DWO — Dog Washer One"
            className="mx-auto mb-5 h-auto w-full max-w-[330px]"
          />}
          <p className="mt-2 text-sm text-slate-600">
            {brand.message}
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

          {error && <p role="alert" className="text-sm text-red-600">{error}</p>}

          <button
            className="w-full rounded-lg bg-[#113A7A] px-4 py-3 font-medium text-white transition hover:bg-[#07111E] disabled:opacity-60"
            style={{ background: brand.lux ? `linear-gradient(110deg, ${brand.secondary}, ${brand.primary})` : brand.primary }}
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
