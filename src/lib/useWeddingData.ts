import { useCallback, useEffect, useState } from "react";
import { supabase, SUPABASE_ENABLED } from "./supabase";
import { WEDDING as DEFAULT_WEDDING, IMG as DEFAULT_IMG } from "./wedding";

/**
 * Tipe data undangan yang bisa disimpan di DB.
 * Semua field opsional — field yang tidak ada akan diisi dari DEFAULT.
 */
import type { ReligiousFormat } from "./religiousFormats";

import type { TemplateId } from "./templates";

export interface WeddingData {
  initials?: string;
  dateLabel?: string;
  dateShort?: string;
  dateISO?: string;
  city?: string;
  venueMain?: string;
  groom?: Partial<typeof DEFAULT_WEDDING.groom> & { parentsEn?: string; bioEn?: string };
  bride?: Partial<typeof DEFAULT_WEDDING.bride> & { parentsEn?: string; bioEn?: string };
  quote?: Partial<typeof DEFAULT_WEDDING.quote> & { textEn?: string };
  events?: Array<Partial<(typeof DEFAULT_WEDDING.events)[number]> & { nameEn?: string; noteEn?: string }>;
  story?: Array<Partial<(typeof DEFAULT_WEDDING.story)[number]> & { titleEn?: string; textEn?: string }>;
  gallery?: Array<Partial<(typeof DEFAULT_WEDDING.gallery)[number]>>;
  gifts?: Array<Partial<(typeof DEFAULT_WEDDING.gifts)[number]>>;
  giftAddress?: string;
  dresscode?: Array<Partial<(typeof DEFAULT_WEDDING.dresscode)[number]>>;
  photos?: Partial<typeof DEFAULT_IMG>;
  themeId?: string;
  ornamentId?: string;
  customOrnament?: string; // SVG content untuk ornamen custom
  language?: "id" | "en"; // Bahasa: Indonesia atau English
  religiousFormat?: ReligiousFormat; // Format agama
  templateId?: TemplateId; // Desain template
}

/**
 * Hook untuk fetch & update data undangan PER USER (multi-tenant).
 * - Jika Supabase aktif: fetch dari tabel `settings` dengan filter user_id.
 * - Jika tidak: pakai localStorage dengan key per-user.
 * - Setiap admin punya data undangan sendiri, tidak saling mempengaruhi.
 */
export function useWeddingData(
  userId?: string | null,
  slug?: string | null
) {
  const [data, setData] = useState<WeddingData>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const storageKey = userId ? `wedding-data-${userId}` : "wedding-data-default";

  // Fetch initial data
  const fetchData = useCallback(async () => {
  setLoading(true);
  setError(null);

  try {
    if (SUPABASE_ENABLED && slug) {
      const { data: row, error: err } = await supabase
        .from("settings")
        .select("data")
        .eq("slug", slug)
        .maybeSingle();

      if (err) throw err;

      setData((row?.data as WeddingData) || {});
    } else if (SUPABASE_ENABLED && userId) {
      const { data: row, error: err } = await supabase
        .from("settings")
        .select("data")
        .eq("user_id", userId)
        .maybeSingle();

      if (err) throw err;

      setData((row?.data as WeddingData) || {});
    } else {
      const raw = localStorage.getItem(storageKey);
      setData(raw ? JSON.parse(raw) : {});
    }
  } catch (e: any) {
    setError(e.message || "Gagal memuat data");
    setData({});
  } finally {
    setLoading(false);
  }
}, [userId, slug, storageKey]);

  useEffect(() => {
  if (!SUPABASE_ENABLED || (!userId && !slug)) return;

  const filter = slug
    ? `slug=eq.${slug}`
    : `user_id=eq.${userId}`;

  const channel = supabase
    .channel(`settings-changes-${slug || userId}`)
    .on(
      "postgres_changes",
      {
        event: "UPDATE",
        schema: "public",
        table: "settings",
        filter,
      },
      (payload) => {
        setData((payload.new as any).data || {});
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}, [userId, slug]);

  // Subscribe real-time (jika Supabase aktif)
  useEffect(() => {
    if (!SUPABASE_ENABLED || !userId) return;
    const channel = supabase
      .channel(`settings-changes-${userId}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "settings", filter: `user_id=eq.${userId}` },
        (payload) => {
          setData((payload.new as any).data || {});
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  // Update data
  const updateData = useCallback(
    async (patch: WeddingData) => {
      const merged = { ...data, ...patch };
      setData(merged);
      try {
        if (SUPABASE_ENABLED && userId) {
          const { data: existing } = await supabase
            .from("settings")
            .select("id")
            .eq("user_id", userId)
            .limit(1);
          if (existing && existing.length > 0) {
            const { error } = await supabase
              .from("settings")
              .update({ data: merged, updated_at: new Date().toISOString() })
              .eq("id", existing[0].id);
            if (error) throw error;
          } else {
            const { error } = await supabase.from("settings").insert({
              user_id: userId,
              data: merged,
            });
            if (error) throw error;
          }
        } else {
          localStorage.setItem(storageKey, JSON.stringify(merged));
        }
      } catch (e: any) {
        setError(e.message || "Gagal menyimpan");
        throw e;
      }
    },
    [data, userId, storageKey]
  );

  // Merge dengan default
  const mergedData = mergeWithDefaults(data);

  return { data, mergedData, loading, error, updateData, refetch: fetchData };
}

/**
 * Gabungkan data dari DB dengan default, agar field yang tidak ada tetap terisi.
 */
function mergeWithDefaults(data: WeddingData): typeof DEFAULT_WEDDING & { photos: typeof DEFAULT_IMG; religiousFormat?: ReligiousFormat; language?: "id" | "en" } {
  return {
    initials: data.initials ?? DEFAULT_WEDDING.initials,
    dateLabel: data.dateLabel ?? DEFAULT_WEDDING.dateLabel,
    dateShort: data.dateShort ?? DEFAULT_WEDDING.dateShort,
    dateISO: data.dateISO ?? DEFAULT_WEDDING.dateISO,
    city: data.city ?? DEFAULT_WEDDING.city,
    venueMain: data.venueMain ?? DEFAULT_WEDDING.venueMain,
    groom: { ...DEFAULT_WEDDING.groom, ...data.groom },
    bride: { ...DEFAULT_WEDDING.bride, ...data.bride },
    quote: { ...DEFAULT_WEDDING.quote, ...data.quote },
    events: data.events?.length
      ? data.events.map((e, i) => ({ ...DEFAULT_WEDDING.events[i] || DEFAULT_WEDDING.events[0], ...e }))
      : DEFAULT_WEDDING.events,
    story: data.story?.length
      ? data.story.map((s, i) => ({ ...DEFAULT_WEDDING.story[i] || DEFAULT_WEDDING.story[0], ...s }))
      : DEFAULT_WEDDING.story,
    gallery: data.gallery?.length
      ? data.gallery.map((g, i) => ({ ...DEFAULT_WEDDING.gallery[i] || DEFAULT_WEDDING.gallery[0], ...g }))
      : DEFAULT_WEDDING.gallery,
    gifts: data.gifts?.length
      ? data.gifts.map((g, i) => ({ ...DEFAULT_WEDDING.gifts[i] || DEFAULT_WEDDING.gifts[0], ...g }))
      : DEFAULT_WEDDING.gifts,
    giftAddress: data.giftAddress ?? DEFAULT_WEDDING.giftAddress,
    dresscode: data.dresscode?.length
      ? data.dresscode.map((d, i) => ({ ...DEFAULT_WEDDING.dresscode[i] || DEFAULT_WEDDING.dresscode[0], ...d }))
      : DEFAULT_WEDDING.dresscode,
    photos: { ...DEFAULT_IMG, ...data.photos },
    religiousFormat: data.religiousFormat,
    language: data.language,
  };
}
