import { supabase } from "./supabase";
import {
  DEFAULT_TEMPLATE,
  loadGuests as loadLegacyGuests,
  type Guest,
} from "./guests";

type GuestRow = {
  id: string;
  name: string;
  phone: string;
};

async function getUserId(): Promise<string> {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    throw new Error("Sesi login tidak ditemukan.");
  }

  return user.id;
}

function mapGuest(row: GuestRow): Guest {
  return {
    id: row.id,
    name: row.name,
    phone: row.phone || "",
  };
}

export async function fetchGuests(): Promise<Guest[]> {
  const userId = await getUserId();

  const { data, error } = await supabase
    .from("guests")
    .select("id, name, phone")
    .eq("user_id", userId)
    .order("created_at", {
      ascending: false,
    });

  if (error) {
    throw error;
  }

  const remoteGuests = (data || []).map(mapGuest);

  // Migrasi satu kali dari localStorage ke Supabase.
  if (remoteGuests.length === 0) {
    const legacyGuests = loadLegacyGuests();

    if (legacyGuests.length > 0) {
      const imported = await insertGuests(legacyGuests);

      if (imported.length > 0) {
        return imported;
      }
    }
  }

  return remoteGuests;
}

export async function insertGuests(
  guests: Pick<Guest, "name" | "phone">[],
): Promise<Guest[]> {
  const userId = await getUserId();

  if (guests.length === 0) {
    return [];
  }

  const payload = guests.map((guest) => ({
    user_id: userId,
    name: guest.name.trim(),
    phone: guest.phone.trim(),
  }));

  const { data, error } = await supabase
    .from("guests")
    .insert(payload)
    .select("id, name, phone");

  if (error) {
    throw error;
  }

  return (data || []).map(mapGuest);
}

export async function updateGuest(
  guest: Pick<Guest, "id" | "name" | "phone">,
): Promise<Guest> {
  const userId = await getUserId();

  const { data, error } = await supabase
    .from("guests")
    .update({
      name: guest.name.trim(),
      phone: guest.phone.trim(),
    })
    .eq("id", guest.id)
    .eq("user_id", userId)
    .select("id, name, phone")
    .single();

  if (error) {
    throw error;
  }

  return mapGuest(data);
}

export async function deleteGuest(
  guestId: string,
): Promise<void> {
  const userId = await getUserId();

  const { error } = await supabase
    .from("guests")
    .delete()
    .eq("id", guestId)
    .eq("user_id", userId);

  if (error) {
    throw error;
  }
}

export async function deleteAllGuests(): Promise<void> {
  const userId = await getUserId();

  const { error } = await supabase
    .from("guests")
    .delete()
    .eq("user_id", userId);

  if (error) {
    throw error;
  }
}

export async function fetchGuestTemplate(): Promise<string> {
  const userId = await getUserId();

  const { data, error } = await supabase
    .from("guest_templates")
    .select("template")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data?.template || DEFAULT_TEMPLATE;
}

export async function saveGuestTemplate(
  template: string,
): Promise<void> {
  const userId = await getUserId();

  const { error } = await supabase
    .from("guest_templates")
    .upsert(
      {
        user_id: userId,
        template,
      },
      {
        onConflict: "user_id",
      },
    );

  if (error) {
    throw error;
  }
}