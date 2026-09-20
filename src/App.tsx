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
import { onAuthStateChange, getAdminProfile, type AdminProfile } from "./lib/auth";
import { SUPABASE_ENABLED } from "./lib/supabase";
import { WeddingProvider } from "./lib/WeddingContext";
import
 { parseInvitationSlug, generateSlug } 
from
 
"./lib/slug"
;

type Stage = "closed" | "opening" | "open";

export default function App() {
  const [stage, setStage] = useState<Stage>("closed");
  const [route, setRoute] = useState(() => window.location.hash);
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<AdminProfile | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  // Timeout untuk auth loading - pastikan tidak stuck selamanya
  useEffect(() => {
    const timer = setTimeout(() => {
      console.log("Auth loading timeout - forcing to false");
      setAuthLoading(false);
    }, 5000); // 5 detik timeout (lebih cepat)
    return () => clearTimeout(timer);
  }, []);
  const [userName, setUserName] = useState<string | null>(null);

  // Rute berbasis hash
  useEffect(() => {
    const onHash = () => setRoute(window.location.hash);
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  // Subscribe auth state
  useEffect(() => {
    let mounted = true;
    
    const unsub = onAuthStateChange((u) => {
      if (!mounted) return;
      
      setUser(u);
      
      // Handle async operations
      const loadProfile = async () => {
        if (u) {
          try {
            console.log("Loading profile for user:", u.id);
            const p = await getAdminProfile(u.id);
            if (!mounted) return;
            console.log("Profile loaded:", p);
            setProfile(p);
            
            // Get username from profile name, or email, or user metadata
            let displayName = p?.name || null;
            if (!displayName) {
              // Try to get from user metadata
              displayName = u.user_metadata?.name || null;
            }
            if (!displayName && u.email) {
              // Use email prefix as fallback
              displayName = u.email.split('@')[0];
            }
            
            setUserName(displayName);
          } catch (error) {
            console.error("Error loading profile:", error);
            if (!mounted) return;
            setProfile(null);
            setUserName(null);
          }
        } else {
          if (!mounted) return;
          setProfile(null);
          setUserName(null);
        }
        if (mounted) {
          setAuthLoading(false);
        }
      };
      
      loadProfile();
    });
    
    return () => {
      mounted = false;
      if (typeof unsub === "function") unsub();
    };
  }, []);

  // Parse slug dari URL untuk undangan personal
  <WeddingProvider key={publicUserId || "default"} userId={publicUserId}>

  // Undangan publik hanya menggunakan data dari slug URL
  // Status login admin TIDAK mempengaruhi undangan publik
  // Jika tidak ada slug → tampilkan data default (Raka & Sekar)
  const publicUserId = slugUserId || null;

  // Redirect ke admin setelah login jika diperlukan
  useEffect(() => {
    if (user && sessionStorage.getItem("redirect-to-admin") === "true") {
      sessionStorage.removeItem("redirect-to-admin");
      window.location.hash = "#/admin";
    }
  }, [user]);

  const isAdminRoute = route.startsWith("#/admin");
  const isSuperRoute = route.startsWith("#/admin/super");
  const isGuestRoute = route.startsWith("#/tamu");

  useEffect(() => {
    document.body.style.overflow = stage === "open" || isAdminRoute || isGuestRoute ? "" : "hidden";
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

  // Route: Tamu manager
  if (isGuestRoute) {
    // Halaman tamu hanya bisa diakses oleh admin yang login
    if (authLoading) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-pine-950">
          <div className="size-12 animate-spin rounded-full border-2 border-gold-400 border-t-transparent" />
        </div>
      );
    }
    
    if (!user) {
      // Redirect ke halaman login
      return <AdminLogin onLogin={() => {}} />;
    }
    
    // Generate slug dari data admin yang login
    let invitationSlug = "";
    if (profile?.user_id) {
      try {
        const storageKey = `wedding-data-${profile.user_id}`;
        const rawData = localStorage.getItem(storageKey);
        if (rawData) {
          const savedData = JSON.parse(rawData);
          const groomName = savedData.groom?.short || "Mempelai";
          const brideName = savedData.bride?.short || "Mempelai";
          invitationSlug = generateSlug(groomName, brideName);
        }
      } catch (e) {
        // ignore
      }
    }
    
    return (
      <WeddingProvider userId={user.id}>
        <GuestManager invitationSlug={invitationSlug} />
      </WeddingProvider>
    );
  }

  // Route: Admin
  if (isAdminRoute) {
    // Jika masih loading, tampilkan loading screen dengan timeout
    if (authLoading) {
      return (
        <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-pine-950 px-5 text-center">
          <div className="size-12 animate-spin rounded-full border-2 border-gold-400 border-t-transparent" />
          <p className="text-sm text-sage-300/80">Memuat...</p>
          <button
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

    // Jika belum login, tampilkan form login
    if (!user) {
      try {
        return <AdminLogin onLogin={() => {}} />;
      } catch (err) {
        console.error("Error rendering AdminLogin:", err);
        return (
          <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-pine-950 px-5 text-center">
            <p className="text-sm text-rose-300">Error loading login page</p>
            <button
              onClick={() => window.location.reload()}
              className="text-xs text-gold-400 underline hover:text-gold-300"
            >
              Reload
            </button>
          </div>
        );
      }
    }

    if (!profile) {
      return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-pine-950 px-5 text-center">
          <p className="font-display text-2xl italic text-ivory">Akses Ditolak</p>
          <p className="mt-3 text-sm text-sage-300/80">
            Anda tidak terdaftar sebagai admin.
          </p>
          <button
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

    if (isSuperRoute) {
      return (
        <WeddingProvider userId={user?.id}>
          <SuperAdminPanel profile={profile} userName={userName} />
        </WeddingProvider>
      );
    }

    return (
      <WeddingProvider userId={user?.id}>
        <AdminPanel profile={profile} userName={userName} />
      </WeddingProvider>
    );
  }

  // Route: Undangan publik
  return (
    <WeddingProvider key={publicUserId || "default"} userId={publicUserId}>
      <ThemeWrapper>
        <TemplateWrapper>
          <div
            aria-hidden="true"
            className="pointer-events-none fixed inset-0 z-0"
            style={{
              background:
                "radial-gradient(55% 40% at 85% -5%, rgba(200,169,97,0.09), transparent 65%), radial-gradient(60% 45% at -10% 35%, rgba(32,71,52,0.5), transparent 60%), radial-gradient(70% 50% at 110% 80%, rgba(24,56,41,0.55), transparent 65%)",
            }}
          />

          <Petals />

          {stage !== "open" && <Cover opening={stage === "opening"} onOpen={open} />}

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
