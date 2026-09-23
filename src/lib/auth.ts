import { supabase, SUPABASE_ENABLED } from "./supabase";
import { removeSlugByUserId } from "./slug";

export type AdminRole = "admin" | "super_admin";

export interface AdminProfile {
  user_id: string;
  role: AdminRole;
  name: string | null;
}

/* ============================================================
 * MODE DEMO
 * ============================================================ */

const LS_USERS = "demo-users-v1";
const LS_PROFILES = "demo-profiles-v1";
const LS_SESSION = "demo-session-v1";
const LS_CONFIG = "demo-config-v1";

interface DemoUser {
  id: string;
  username: string;
  password: string;
  name: string | null;
}

interface DemoConfig {
  adminWA: string;
}

function dispatchAuthEvent() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("demo-auth-change"));
  }
}

function loadDemoUsers(): DemoUser[] {
  try {
    const raw = localStorage.getItem(LS_USERS);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveDemoUsers(users: DemoUser[]) {
  localStorage.setItem(LS_USERS, JSON.stringify(users));
}

function loadDemoProfiles(): AdminProfile[] {
  try {
    const raw = localStorage.getItem(LS_PROFILES);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveDemoProfiles(profiles: AdminProfile[]) {
  localStorage.setItem(LS_PROFILES, JSON.stringify(profiles));
}

function loadDemoConfig(): DemoConfig {
  try {
    const raw = localStorage.getItem(LS_CONFIG);
    return raw ? JSON.parse(raw) : { adminWA: "6281234567890" };
  } catch {
    return { adminWA: "6281234567890" };
  }
}

function saveDemoConfig(config: DemoConfig) {
  localStorage.setItem(LS_CONFIG, JSON.stringify(config));
}

function ensureDemoSuperAdmin(): void {
  if (SUPABASE_ENABLED) return;

  const users = loadDemoUsers();
  const profiles = loadDemoProfiles();

  const demoUsername = "superadmin";
  const demoPassword = "demo123";

  let demoUser = users.find((user) => user.username === demoUsername);

  if (!demoUser) {
    demoUser = {
      id: "demo-super-" + Date.now(),
      username: demoUsername,
      password: demoPassword,
      name: "Super Admin (Demo)",
    };

    users.push(demoUser);
    saveDemoUsers(users);
  } else if (demoUser.password !== demoPassword) {
    demoUser.password = demoPassword;
    saveDemoUsers(users);
  }

  const profileExists = profiles.some(
    (profile) => profile.user_id === demoUser?.id
  );

  if (!profileExists && demoUser) {
    profiles.push({
      user_id: demoUser.id,
      role: "super_admin",
      name: "Super Admin (Demo)",
    });

    saveDemoProfiles(profiles);
  }
}

/* ============================================================
 * AUTH FUNCTIONS
 * ============================================================ */

export async function signIn(username: string, password: string) {
  if (SUPABASE_ENABLED) {
    const email = username.includes("@")
      ? username
      : `${username}@wedding.local`;

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;

    return data;
  }

  ensureDemoSuperAdmin();

  const users = loadDemoUsers();

  const user = users.find(
    (item) => item.username === username && item.password === password
  );

  if (!user) {
    throw new Error("Username atau password salah");
  }

  const session = {
    user_id: user.id,
    username: user.username,
    name: user.name,
  };

  sessionStorage.setItem(LS_SESSION, JSON.stringify(session));

  dispatchAuthEvent();

  return {
    user: {
      id: user.id,
      username: user.username,
      name: user.name,
    },
    session,
  };
}

export async function signOut() {
  if (SUPABASE_ENABLED) {
    const { error } = await supabase.auth.signOut();

    if (error) throw error;

    return;
  }

  sessionStorage.removeItem(LS_SESSION);
  dispatchAuthEvent();
}

export async function getSession(): Promise<{
  user_id: string;
  username: string;
  name: string | null;
} | null> {
  if (SUPABASE_ENABLED) {
    const { data } = await supabase.auth.getSession();

    if (!data.session?.user) {
      return null;
    }

    return {
      user_id: data.session.user.id,
      username: data.session.user.email?.split("@")[0] || "",
      name: null,
    };
  }

  try {
    const raw = sessionStorage.getItem(LS_SESSION);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export async function changePassword(newPassword: string) {
  if (SUPABASE_ENABLED) {
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (error) throw error;

    return;
  }

  const session = await getSession();

  if (!session) {
    throw new Error("Belum login");
  }

  const users = loadDemoUsers();

  const userIndex = users.findIndex(
    (user) => user.id === session.user_id
  );

  if (userIndex === -1) {
    throw new Error("User tidak ditemukan");
  }

  users[userIndex].password = newPassword;
  saveDemoUsers(users);
}

export async function getAdminProfile(
  userId: string
): Promise<AdminProfile | null> {
  if (SUPABASE_ENABLED) {
    try {
      const { data, error } = await supabase
        .from("admin_profiles")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle();

      if (error) {
        console.error("Error fetching admin profile:", error);
        return null;
      }

      if (!data) {
        return null;
      }

      return data as AdminProfile;
    } catch (error) {
      console.error("Exception in getAdminProfile:", error);
      return null;
    }
  }

  ensureDemoSuperAdmin();

  const profiles = loadDemoProfiles();

  return profiles.find((profile) => profile.user_id === userId) || null;
}

export async function listAdmins(): Promise<AdminProfile[]> {
  if (SUPABASE_ENABLED) {
    const { data, error } = await supabase
      .from("admin_profiles")
      .select("*")
      .order("created_at", {
        ascending: false,
      });

    if (error) throw error;

    return (data as AdminProfile[]) || [];
  }

  ensureDemoSuperAdmin();

  return loadDemoProfiles();
}

/* ============================================================
 * CREATE ADMIN
 * ============================================================ */

export async function createAdmin(
  username: string,
  password: string,
  role: AdminRole,
  name: string | null
) {
  if (SUPABASE_ENABLED) {
    const { data, error } = await supabase.functions.invoke(
      "create-new-admin",
      {
        body: {
          username,
          password,
          role,
          name,
        },
      }
    );

    if (error) {
      throw new Error(error.message || "Gagal membuat admin");
    }

    if (data?.error) {
      throw new Error(data.error);
    }

    return {
      id: data.id,
      email: data.email,
    };
  }

  const users = loadDemoUsers();

  const existingUser = users.find((user) => user.username === username);

  if (existingUser) {
    throw new Error("Username sudah terdaftar");
  }

  const newUser: DemoUser = {
    id:
      "demo-" +
      Date.now() +
      "-" +
      Math.random().toString(36).slice(2, 6),
    username,
    password,
    name,
  };

  users.push(newUser);
  saveDemoUsers(users);

  const profiles = loadDemoProfiles();

  profiles.push({
    user_id: newUser.id,
    role,
    name,
  });

  saveDemoProfiles(profiles);

  return {
    id: newUser.id,
    username: newUser.username,
  };
}

/* ============================================================
 * DELETE ADMIN
 * ============================================================ */

export async function deleteAdmin(userId: string) {
  if (SUPABASE_ENABLED) {
    const { data, error } = await supabase.functions.invoke(
      "delete-admin",
      {
        body: { userId },
      }
    );

    if (error) {
      let message = error.message || "Gagal menghapus admin";

      const context = (error as { context?: unknown }).context;

      if (context instanceof Response) {
        const payload = await context
          .clone()
          .json()
          .catch(() => null);

        if (payload?.error) {
          message = payload.error;
        }
      }

      throw new Error(message);
    }

    if (data?.error) {
      throw new Error(data.error);
    }

    return data;
  }

  const profiles = loadDemoProfiles();

  saveDemoProfiles(
    profiles.filter((profile) => profile.user_id !== userId)
  );

  const users = loadDemoUsers();

  saveDemoUsers(users.filter((user) => user.id !== userId));

  removeSlugByUserId(userId);
}

/* ============================================================
 * RESET PASSWORD
 * ============================================================ */

export async function resetAdminPassword(
  userId: string,
  newPassword: string
) {
  if (SUPABASE_ENABLED) {
    throw new Error(
      "Reset password admin lain harus dilakukan melalui server"
    );
  }

  const users = loadDemoUsers();

  const userIndex = users.findIndex((user) => user.id === userId);

  if (userIndex === -1) {
    throw new Error("User tidak ditemukan");
  }

  users[userIndex].password = newPassword;
  saveDemoUsers(users);
}

export async function getAdminPassword(
  userId: string
): Promise<string | null> {
  if (SUPABASE_ENABLED) {
    throw new Error("Lihat password hanya tersedia di mode demo");
  }

  const users = loadDemoUsers();

  const user = users.find((item) => item.id === userId);

  return user?.password || null;
}

/* ============================================================
 * ADMIN WHATSAPP CONFIGURATION
 * ============================================================ */

export async function getAdminWA(): Promise<string> {
  if (!SUPABASE_ENABLED) {
    return loadDemoConfig().adminWA;
  }

  try {
    const { data, error } = await supabase.rpc("get_public_admin_wa");

    if (error) {
      console.error("Error getting public admin WA:", error);
      return "";
    }

    return typeof data === "string" ? data.trim() : "";
  } catch (error) {
    console.error("Exception getting public admin WA:", error);
    return "";
  }
}

export async function setAdminWA(wa: string) {
  const normalizedWA = wa.replace(/\D/g, "");

  if (!normalizedWA) {
    throw new Error("Nomor WhatsApp tidak boleh kosong");
  }

  if (SUPABASE_ENABLED) {
    const {
      data: currentData,
      error: fetchError,
    } = await supabase
      .from("settings")
      .select("id, data")
      .limit(1)
      .maybeSingle();

    if (fetchError) {
      throw new Error(`Gagal membaca pengaturan: ${fetchError.message}`);
    }

    if (!currentData) {
      const { error: insertError } = await supabase
        .from("settings")
        .insert({
          data: {
            adminWA: normalizedWA,
          },
        });

      if (insertError) {
        throw new Error(
          `Gagal menyimpan nomor WA: ${insertError.message}`
        );
      }

      return;
    }

    const currentSettings =
      (currentData.data as Record<string, unknown>) || {};

    const { error: updateError } = await supabase
      .from("settings")
      .update({
        data: {
          ...currentSettings,
          adminWA: normalizedWA,
        },
      })
      .eq("id", currentData.id);

    if (updateError) {
      throw new Error(
        `Gagal menyimpan nomor WA: ${updateError.message}`
      );
    }

    return;
  }

  const config = loadDemoConfig();
  config.adminWA = normalizedWA;
  saveDemoConfig(config);
}

/* ============================================================
 * AUTH STATE CHANGE
 * ============================================================ */

export function onAuthStateChange(
  callback: (user: any) => void
): () => void {
  if (SUPABASE_ENABLED) {
    let callbackCalled = false;

    const { data } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        callbackCalled = true;

        try {
          callback(session?.user || null);
        } catch (error) {
          console.error("Error in auth state callback:", error);
          callback(null);
        }
      }
    );

    const fallbackTimer = setTimeout(async () => {
      if (callbackCalled) return;

      try {
        const { data: sessionData } = await supabase.auth.getSession();
        callback(sessionData.session?.user || null);
      } catch (error) {
        console.error("Error checking session:", error);
        callback(null);
      }
    }, 3000);

    return () => {
      clearTimeout(fallbackTimer);
      data.subscription.unsubscribe();
    };
  }

  const checkSession = () => {
    try {
      const raw = sessionStorage.getItem(LS_SESSION);
      const session = raw ? JSON.parse(raw) : null;

      callback(
        session
          ? {
              id: session.user_id,
              username: session.username,
              name: session.name,
            }
          : null
      );
    } catch {
      callback(null);
    }
  };

  checkSession();

  const handler = () => checkSession();

  window.addEventListener("demo-auth-change", handler);

  return () => {
    window.removeEventListener("demo-auth-change", handler);
  };
}

/* ============================================================
 * RESET DEMO DATA
 * ============================================================ */

export function resetDemoData() {
  if (SUPABASE_ENABLED) return;

  localStorage.removeItem(LS_USERS);
  localStorage.removeItem(LS_PROFILES);
  sessionStorage.removeItem(LS_SESSION);
  localStorage.removeItem(LS_CONFIG);

  window.location.reload();
}
