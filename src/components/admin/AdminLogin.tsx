import { useState, useEffect } from "react";
import { signIn, getAdminWA, resetDemoData } from "../../lib/auth";
import { SUPABASE_ENABLED } from "../../lib/supabase";
import { Monogram } from "../Decor";
import { IconArrowLeft, IconCheck, IconEye, IconEyeOff } from "../Icons";

export default function AdminLogin({ onLogin }: { onLogin: () => void }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [adminWA, setAdminWA] = useState("");

  useEffect(() => {
  let active = true;

  async function loadAdminWA() {
    try {
      const wa = await getAdminWA();

      if (active) {
        setAdminWA(wa);
      }
    } catch (error) {
      console.error("Gagal memuat nomor WhatsApp admin:", error);

      if (active) {
        setAdminWA("");
      }
    }
  }

  loadAdminWA();

  return () => {
    active = false;
  };
}, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await signIn(username, password);
      // Simpan flag untuk redirect ke admin setelah reload
      sessionStorage.setItem("redirect-to-admin", "true");
      // Reload halaman untuk memastikan state ter-update
      window.location.reload();
    } catch (err: any) {
      setError(err.message || "Login gagal");
      setLoading(false);
    }
  };

const normalizedWA = adminWA.replace(/\D/g, "");

const waLink = normalizedWA
  ? `https://wa.me/${normalizedWA}?text=Halo%20admin%2C%20saya%20ingin%20minta%20dibuatkan%20akun%20untuk%20mengelola%20undangan%20pernikahan.`
  : "#";

  return (
    <div className="relative min-h-screen overflow-x-clip bg-pine-950 font-sans text-ivory">
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0"
        style={{
          background:
            "radial-gradient(55% 40% at 85% -5%, rgba(200,169,97,0.09), transparent 65%), radial-gradient(60% 45% at -10% 35%, rgba(32,71,52,0.5), transparent 60%)",
        }}
      />

      <div className="relative mx-auto flex min-h-screen max-w-md flex-col items-center justify-center px-5 py-10">
        <Monogram className="size-20 text-gold-400" />
        <h1 className="mt-6 font-display text-3xl font-light italic text-ivory">
          Panel Admin
        </h1>
        <p className="mt-2 text-sm text-sage-300/80">Masuk untuk mengelola undangan</p>

        <form onSubmit={handleSubmit} className="mt-10 w-full space-y-5">
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-[0.28em] text-gold-400">
              Username
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              autoComplete="username"
              className="mt-2.5 w-full rounded-[3px] border border-gold-500/25 bg-pine-900/80 px-4 py-3 text-sm text-ivory placeholder:text-sage-300/40 transition-colors focus:border-gold-400 focus:outline-none"
              placeholder="Masukkan username"
            />
          </div>
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-[0.28em] text-gold-400">
              Password
            </label>
            <div className="relative mt-2.5">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                className="w-full rounded-[3px] border border-gold-500/25 bg-pine-900/80 px-4 py-3 pr-12 text-sm text-ivory placeholder:text-sage-300/40 transition-colors focus:border-gold-400 focus:outline-none"
                placeholder="Masukkan password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-sage-300/60 transition-colors hover:text-gold-400"
                aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"}
              >
                {showPassword ? (
                  <IconEyeOff className="size-5" />
                ) : (
                  <IconEye className="size-5" />
                )}
              </button>
            </div>
          </div>

          {error && (
            <div className="border-l-2 border-rose-400/70 bg-rose-400/10 px-4 py-3 text-sm text-rose-300">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2.5 bg-gold-500 px-6 py-4 text-xs font-extrabold uppercase tracking-[0.25em] text-pine-950 shadow-[0_10px_30px_rgba(200,169,97,0.25)] transition-all duration-300 hover:-translate-y-0.5 hover:bg-gold-400 disabled:opacity-50"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="size-4 animate-spin rounded-full border-2 border-pine-950 border-t-transparent" />
                Memproses...
              </span>
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
          className="mt-8 inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.22em] text-gold-400 transition-colors hover:text-gold-200"
        >
          <IconArrowLeft className="size-4" />
          Kembali ke undangan
        </a>

{adminWA && (
          <div className="mt-8 w-full border border-gold-500/30 bg-pine-800/50 p-5">
            <p className="text-[10px] font-bold uppercase tracking-[0.32em] text-gold-400">
              Belum Punya Akun?
            </p>

            <p className="mt-2 text-xs leading-relaxed text-sage-300/80">
              Hubungi admin melalui WhatsApp untuk meminta dibuatkan akun:
            </p>

            <a
              href={waLink}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-flex items-center gap-2 rounded-[3px] bg-emerald-500 px-5 py-2.5 text-xs font-bold text-white transition-all hover:bg-emerald-400"
            >
              <svg
                className="size-4"
                viewBox="0 0 24 24"
                fill="currentColor"
                aria-hidden="true"
              >
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.371.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
              </svg>

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

            <div className="mt-2 space-y-1 font-mono text-xs">
              <p className="text-gold-200">
                <span className="text-sage-300/60">Username:</span>{" "}
                superadmin
              </p>

              {showDemo && (
  <>
    <p className="text-gold-200">
      <span className="text-sage-300/60">Password:</span> demo123
    </p>
    <button ...>Reset Data Demo</button>
  </>
)}
