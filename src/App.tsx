import { useEffect, useState } from "react";
import Cover from "./components/Cover";
import Nav from "./components/Nav";
import { Petals } from "./components/Decor";
import Hero from "./components/sections/Hero";
import Couple from "./components/sections/Couple";
import Events from "./components/sections/Events";
import Story from "./components/sections/Story";
import Gallery from "./components/sections/Gallery";
import Gift from "./components/sections/Gift";
import Wishes from "./components/sections/Wishes";
import Closing from "./components/sections/Closing";
import GuestManager from "./components/GuestManager";
import AdminLogin from "./components/admin/AdminLogin";
import AdminPanel from "./components/admin/AdminPanel";
import SuperAdminPanel from "./components/admin/SuperAdminPanel";
import ThemeWrapper from "./components/ThemeWrapper";
import TemplateWrapper from "./components/TemplateWrapper";
import {
  getAdminProfile,
  onAuthStateChange,
  type AdminProfile,
} from "./lib/auth";
import { WeddingProvider } from "./lib/WeddingContext";
import {
  generateSlug,
  getUserIdFromSlug,
  parseInvitationSlug,
} from "./lib/slug";

type Stage = "closed" | "opening" | "open";

type AuthUser = {
  id: string;
  email?: string | null;
  user_metadata?: { name?: string | null };
  username?: string;
  name?: string | null;
};

export default function App() {
  const [stage, setStage] = useState<Stage>("closed");
  const [route, setRoute] = useState(() => window.location.hash);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [profile, setProfile] = useState<AdminProfile | null>(null);
  const [userName, setUserName] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    const onHashChange = () => setRoute(window.location.hash);
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  useEffect(() => {
    const timeout = window.setTimeout(() => setAuthLoading(false), 5000);
    return () => window.clearTimeout(timeout);
  }, []);

  useEffect(() => {
    let mounted = true;
    const unsubscribe = onAuthStateChange((nextUser) => {
      if (!mounted) return;

      const authUser = nextUser as AuthUser | null;
      setUser(authUser);

      void (async () => {
        if (!authUser) {
          if (!mounted) return;
          setProfile(null);
          setUserName(null);
          setAuthLoading(false);
          return;
        }

        try {
          const nextProfile = await getAdminProfile(authUser.id);
          if (!mounted) return;

          setProfile(nextProfile);
          setUserName(
            nextProfile?.name ||
              authUser.user_metadata?.name ||
              authUser.email?.split("@")[0] ||
              authUser.username ||
              authUser.name ||
              null
          );
        } catch (error) {
          console.error("Error loading admin profile:", error);
          if (!mounted) return;
          setProfile(null);
          setUserName(null);
        } finally {
          if (mounted) setAuthLoading(false);
        }
      })();
    });

    return () => {
      mounted = false;
      unsubscribe();
    };
  }, []);

  const invitationSlug = parseInvitationSlug(route);
  const publicUserId = invitationSlug
    ? getUserIdFromSlug(invitationSlug)
    : null;
  const isAdminRoute = route === "#/admin" || route.startsWith("#/admin/");
  const isSuperRoute = route === "#/admin/super";
  const isGuestRoute = route === "#/tamu" || route.startsWith("#/tamu?");

  useEffect(() => {
    if (user && sessionStorage.getItem("redirect-to-admin") === "true") {
      sessionStorage.removeItem("redirect-to-admin");
      window.location.hash = "#/admin";
    }
  }, [user]);

  useEffect(() => {
    document.body.style.overflow =
      stage === "open" || isAdminRoute || isGuestRoute ? "" : "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [stage, isAdminRoute, isGuestRoute]);

  useEffect(() => {
    if (!isAdminRoute && !isGuestRoute) {
      document.title = "Undangan Pernikahan Raka & Sekar";
    }
  }, [isAdminRoute, isGuestRoute]);

  const open = () => {
    if (stage !== "closed") return;
    setStage("opening");
    window.setTimeout(() => setStage("open"), 1250);
  };

  if (isGuestRoute) {
    if (authLoading) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-pine-950">
          <div className="size-12 animate-spin rounded-full border-2 border-gold-400 border-t-transparent" />
        </div>
      );
    }

    if (!user) return <AdminLogin />;

    let guestSlug = "";
    if (profile?.user_id) {
      try {
        const rawData = localStorage.getItem(`wedding-data-${profile.user_id}`);
        if (rawData) {
          const savedData = JSON.parse(rawData) as {
            groom?: { short?: string };
            bride?: { short?: string };
          };
          guestSlug = generateSlug(
            savedData.groom?.short || "Mempelai",
            savedData.bride?.short || "Mempelai"
          );
        }
      } catch (error) {
        console.error("Gagal membaca data undangan:", error);
      }
    }

    return (
      <WeddingProvider userId={user.id}>
        <GuestManager invitationSlug={guestSlug} />
      </WeddingProvider>
    );
  }

  if (isAdminRoute) {
    if (authLoading) {
      return (
        <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-pine-950 px-5 text-center">
          <div className="size-12 animate-spin rounded-full border-2 border-gold-400 border-t-transparent" />
          <p className="text-sm text-sage-300/80">Memuat...</p>
          <button
            type="button"
            onClick={() => {
              setAuthLoading(false);
              setUser(null);
            }}
            className="mt-2 text-xs text-gold-400 underline hover:text-gold-300"
          >
            Lewati loading
          </button>
        </div>
      );
    }

    if (!user) return <AdminLogin />;

    if (!profile) {
      return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-pine-950 px-5 text-center">
          <p className="font-display text-2xl italic text-ivory">Akses Ditolak</p>
          <p className="mt-3 text-sm text-sage-300/80">
            Anda tidak terdaftar sebagai admin.
          </p>
          <button
            type="button"
            onClick={() => {
              window.location.hash = "#/";
              window.location.reload();
            }}
            className="mt-6 border border-gold-500/40 px-5 py-2.5 text-[11px] font-bold uppercase tracking-[0.22em] text-gold-300 transition-all hover:bg-gold-500 hover:text-pine-950"
          >
            Kembali
          </button>
        </div>
      );
    }

    if (isSuperRoute && profile.role !== "super_admin") {
      return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-pine-950 px-5 text-center">
          <p className="font-display text-2xl italic text-ivory">Akses Ditolak</p>
          <p className="mt-3 text-sm text-sage-300/80">
            Hanya super admin yang boleh mengakses halaman ini.
          </p>
          <a
            href="#/admin"
            className="mt-6 border border-gold-500/40 px-5 py-2.5 text-[11px] font-bold uppercase tracking-[0.22em] text-gold-300 transition-all hover:bg-gold-500 hover:text-pine-950"
          >
            Panel Admin
          </a>
        </div>
      );
    }

    return (
      <WeddingProvider userId={user.id}>
        {isSuperRoute ? (
          <SuperAdminPanel profile={profile} userName={userName} />
        ) : (
          <AdminPanel profile={profile} userName={userName} />
        )}
      </WeddingProvider>
    );
  }

  return (
    <WeddingProvider key={publicUserId || "default"} userId={publicUserId}>
      <ThemeWrapper>
        <TemplateWrapper>
          <div
            aria-hidden="true"
            className="pointer-events-none fixed inset-0 z-0"
            style={{
              background:
                "radial-gradient(55% 40% at 85% -5%, rgba(200,169,97,0.09), transparent 65%), radial-gradient(60% 45% at -10% 35%, rgba(32,71,52,0.5), transparent 60%), radial-gradient(70% 50% at 50% 110%, rgba(200,169,97,0.05), transparent 70%)",
            }}
          />

          <Petals />
          {stage !== "open" && (
            <Cover opening={stage === "opening"} onOpen={open} />
          )}

          <main
            className={`relative z-10 transition-opacity duration-1000 ${
              stage === "open" ? "opacity-100" : "opacity-0"
            }`}
            aria-hidden={stage !== "open"}
          >
            <Hero open={stage === "open"} />
            <Couple />
            <Events />
            <Story />
            <Gallery />
            <Gift />
            <Wishes />
            <Closing />
          </main>

          {stage === "open" && <Nav />}
        </TemplateWrapper>
      </ThemeWrapper>
    </WeddingProvider>
  );
}
