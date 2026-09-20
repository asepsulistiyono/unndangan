import { useEffect, useState, type FormEvent } from "react";
import { signIn, getAdminWA, resetDemoData } from "../../lib/auth";
import { SUPABASE_ENABLED } from "../../lib/supabase";
import { Monogram } from "../Decor";
import { IconArrowLeft, IconCheck, IconEye, IconEyeOff } from "../Icons";

interface AdminLoginProps {
  onLogin?: () => void;
}

export default function AdminLogin({
  onLogin: _onLogin,
}: AdminLoginProps) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [adminWA, setAdminWA] = useState("");

  useEffect(() => {
    let active = true;

    const loadAdminWA = async () => {
      try {
        const wa = await getAdminWA();
        if (active) setAdminWA(typeof wa === "string" ? wa : "");
      } catch (error) {
        console.error("Gagal memuat nomor WhatsApp admin:", error);
        if (active) setAdminWA("");
      }
    };

    void loadAdminWA();

    return () => {
      active = false;
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
      window.location.reload();
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "Login gagal");
      setLoading(false);
    }
  };

  const normalizedWA = adminWA.replace(/\D/g, "");
  const waLink = normalizedWA
    ? `https://wa.me/${normalizedWA}?text=${encodeURIComponent(
        "Halo admin, saya ingin minta dibuatkan akun untuk mengelola undangan pernikahan."
      )}`
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
        <p className="mt-2 text-sm text-sage-300/80">
          Masuk untuk mengelola undangan
        </p>

        <form onSubmit={handleSubmit} className="mt-10 w-full space-y-5">
          <div>
            <label
              htmlFor="username"
              className="block text-[11px] font-bold uppercase tracking-[0.28em] text-gold-400"
            >
              Username
            </label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              required
              autoComplete="username"
              placeholder="Masukkan username"
              className="mt-2.5 w-full rounded-[3px] border border-gold-500/25 bg-pine-900/80 px-4 py-3 text-sm text-ivory placeholder:text-sage-300/40 transition-colors focus:border-gold-400 focus:outline-none"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-[11px] font-bold uppercase tracking-[0.28em] text-gold-400"
            >
              Password
            </label>
            <div className="relative mt-2.5">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
                autoComplete="current-password"
                placeholder="Masukkan password"
                className="w-full rounded-[3px] border border-gold-500/25 bg-pine-900/80 px-4 py-3 pr-12 text-sm text-ivory placeholder:text-sage-300/40 transition-colors focus:border-gold-400 focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setShowPassword((current) => !current)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-sage-300/60 transition-colors hover:text-gold-400"
                aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"}
              >
                {showPassword ? <IconEyeOff className="size-5" /> : <IconEye className="size-5" />}
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
            className="flex w-full items-center justify-center gap-2.5 bg-gold-500 px-6 py-4 text-xs font-extrabold uppercase tracking-[0.25em] text-pine-950 shadow-[0_10px_30px_rgba(200,169,97,0.25)] transition-colors hover:bg-gold-400 disabled:cursor-not-allowed disabled:opacity-60"
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

        {adminWA ? (
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
      <span aria-hidden="true">💬</span>
      Chat Admin via WhatsApp
    </a>
  </div>
) : null}

        {!SUPABASE_ENABLED ? (
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

              <p className="text-gold-200">
                <span className="text-sage-300/60">Password:</span>{" "}
                demo123
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                const confirmed = window.confirm(
                  "Reset semua data demo? Ini akan menghapus semua akun admin dan data undangan yang tersimpan di browser."
                );

                if (confirmed) {
                  resetDemoData();
                }
              }}
              className="mt-3 w-full border border-rose-400/30 px-4 py-2 text-[10px] font-bold uppercase tracking-[0.18em] text-rose-300 transition-colors hover:bg-rose-400 hover:text-pine-950"
            >
              Reset Data Demo
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}