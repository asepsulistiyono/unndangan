import { useEffect, useState, type FormEvent } from "react";
import { getAdminWA, resetDemoData, signIn } from "../../lib/auth";
import { SUPABASE_ENABLED } from "../../lib/supabase";
import { Monogram } from "../Decor";
import { IconArrowLeft, IconCheck, IconEye, IconEyeOff } from "../Icons";

type AdminLoginProps = {
  onLogin?: () => void;
};

const WHATSAPP_MESSAGE =
  "Halo admin, saya ingin minta dibuatkan akun untuk mengelola undangan pernikahan.";

export default function AdminLogin({ onLogin }: AdminLoginProps) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [adminWA, setAdminWA] = useState("");

  useEffect(() => {
    let cancelled = false;

    getAdminWA()
      .then((value) => {
        if (!cancelled) {
          setAdminWA(typeof value === "string" ? value : "");
        }
      })
      .catch((reason: unknown) => {
        console.error("Gagal memuat nomor WhatsApp admin:", reason);
        if (!cancelled) setAdminWA("");
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (loading) return;

    setLoading(true);
    setError("");

    try {
      await signIn(username.trim(), password);
      sessionStorage.setItem("redirect-to-admin", "true");
      onLogin?.();
      window.location.reload();
    } catch (reason: unknown) {
      setError(reason instanceof Error ? reason.message : "Login gagal");
      setLoading(false);
    }
  };

  const phone = adminWA.replace(/\D/g, "");
  const whatsappUrl = phone
    ? `https://wa.me/${phone}?text=${encodeURIComponent(WHATSAPP_MESSAGE)}`
    : "";

  return (
    <main className="relative min-h-screen overflow-x-clip bg-pine-950 font-sans text-ivory">
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0"
        style={{
          background:
            "radial-gradient(55% 40% at 85% -5%, rgba(200,169,97,0.09), transparent 65%), radial-gradient(60% 45% at -10% 35%, rgba(32,71,52,0.5), transparent 60%)",
        }}
      />

      <section className="relative mx-auto flex min-h-screen max-w-md flex-col items-center justify-center px-5 py-10">
        <Monogram className="size-20 text-gold-400" />
        <h1 className="mt-6 font-display text-3xl font-light italic text-ivory">
          Panel Admin
        </h1>
        <p className="mt-2 text-sm text-sage-300/80">
          Masuk untuk mengelola undangan
        </p>

        <form onSubmit={handleSubmit} className="mt-10 w-full space-y-5">
          <div>
            <label
              htmlFor="admin-username"
              className="block text-[11px] font-bold uppercase tracking-[0.28em] text-gold-400"
            >
              Username
            </label>
            <input
              id="admin-username"
              name="username"
              type="text"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              autoComplete="username"
              required
              placeholder="Masukkan username"
              className="mt-2.5 w-full rounded-[3px] border border-gold-500/25 bg-pine-900/80 px-4 py-3 text-sm text-ivory outline-none transition-colors placeholder:text-sage-300/40 focus:border-gold-400"
            />
          </div>

          <div>
            <label
              htmlFor="admin-password"
              className="block text-[11px] font-bold uppercase tracking-[0.28em] text-gold-400"
            >
              Password
            </label>
            <div className="relative mt-2.5">
              <input
                id="admin-password"
                name="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoComplete="current-password"
                required
                placeholder="Masukkan password"
                className="w-full rounded-[3px] border border-gold-500/25 bg-pine-900/80 px-4 py-3 pr-12 text-sm text-ivory outline-none transition-colors placeholder:text-sage-300/40 focus:border-gold-400"
              />
              <button
                type="button"
                onClick={() => setShowPassword((visible) => !visible)}
                aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-sage-300/60 hover:text-gold-400"
              >
                {showPassword ? <IconEyeOff className="size-5" /> : <IconEye className="size-5" />}
              </button>
            </div>
          </div>

          {error && (
            <p role="alert" className="border-l-2 border-rose-400/70 bg-rose-400/10 px-4 py-3 text-sm text-rose-300">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2.5 bg-gold-500 px-6 py-4 text-xs font-extrabold uppercase tracking-[0.25em] text-pine-950 transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? (
              <>
                <span className="size-4 animate-spin rounded-full border-2 border-pine-950 border-t-transparent" />
                Memproses...
              </>
            ) : (
              <>
                <IconCheck className="size-4" />
                Masuk
              </>
            )}
          </button>
        </form>

        <a
          href="#/"
          className="mt-8 inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.22em] text-gold-400 hover:text-gold-200"
        >
          <IconArrowLeft className="size-4" />
          Kembali ke undangan
        </a>

        {whatsappUrl && (
          <div className="mt-8 w-full border border-gold-500/30 bg-pine-800/50 p-5">
            <p className="text-[10px] font-bold uppercase tracking-[0.32em] text-gold-400">
              Belum Punya Akun?
            </p>
            <p className="mt-2 text-xs leading-relaxed text-sage-300/80">
              Hubungi admin melalui WhatsApp untuk meminta dibuatkan akun:
            </p>
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-flex items-center gap-2 rounded-[3px] bg-emerald-500 px-5 py-2.5 text-xs font-bold text-white hover:bg-emerald-400"
            >
              <span aria-hidden="true">💬</span>
              Chat Admin via WhatsApp
            </a>
          </div>
        )}

        {!SUPABASE_ENABLED && (
          <div className="mt-4 w-full border border-gold-500/20 bg-pine-800/30 p-4">
            <p className="text-[10px] font-bold uppercase tracking-[0.32em] text-gold-400">
              Mode Demo
            </p>
            <p className="mt-2 text-xs leading-relaxed text-sage-300/80">
              Gunakan kredensial demo berikut:
            </p>
            <div className="mt-2 space-y-1 font-mono text-xs text-gold-200">
              <p><span className="text-sage-300/60">Username:</span> superadmin</p>
              <p><span className="text-sage-300/60">Password:</span> demo123</p>
            </div>
            <button
              type="button"
              onClick={() => {
                if (window.confirm("Reset semua data demo? Ini akan menghapus semua akun admin dan data undangan yang tersimpan di browser.")) {
                  resetDemoData();
                }
              }}
              className="mt-3 w-full border border-rose-400/30 px-4 py-2 text-[10px] font-bold uppercase tracking-[0.18em] text-rose-300 hover:bg-rose-400 hover:text-pine-950"
            >
              Reset Data Demo
            </button>
          </div>
        )}
      </section>
    </main>
  );
}
