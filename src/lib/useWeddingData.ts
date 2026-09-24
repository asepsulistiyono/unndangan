import {
  useCallback,
  useEffect,
  useState,
} from "react";

import { generateSlug } from "./slug";

import {
  supabase,
  SUPABASE_ENABLED,
} from "./supabase";

import {
  WEDDING as DEFAULT_WEDDING,
  IMG as DEFAULT_IMG,
} from "./wedding";

import type { ReligiousFormat } from "./religiousFormats";
import type { TemplateId } from "./templates";

export interface WeddingData {
  initials?: string;
  dateLabel?: string;
  dateShort?: string;
  dateISO?: string;
  city?: string;
  venueMain?: string;

  groom?: Partial<typeof DEFAULT_WEDDING.groom> & {
    parentsEn?: string;
    bioEn?: string;
  };

  bride?: Partial<typeof DEFAULT_WEDDING.bride> & {
    parentsEn?: string;
    bioEn?: string;
  };

  quote?: Partial<typeof DEFAULT_WEDDING.quote> & {
    textEn?: string;
  };

  events?: Array<
    Partial<(typeof DEFAULT_WEDDING.events)[number]> & {
      nameEn?: string;
      noteEn?: string;
    }
  >;

  story?: Array<
    Partial<(typeof DEFAULT_WEDDING.story)[number]> & {
      titleEn?: string;
      textEn?: string;
    }
  >;

  gallery?: Array<
    Partial<(typeof DEFAULT_WEDDING.gallery)[number]>
  >;

  gifts?: Array<
    Partial<(typeof DEFAULT_WEDDING.gifts)[number]>
  >;

  giftAddress?: string;

  dresscode?: Array<
    Partial<(typeof DEFAULT_WEDDING.dresscode)[number]>
  >;

  photos?: Partial<typeof DEFAULT_IMG>;

  themeId?: string;
  ornamentId?: string;
  customOrnament?: string;

  language?: "id" | "en";
  religiousFormat?: ReligiousFormat;
  templateId?: TemplateId;
}

type SettingsRow = {
  id: string;
  user_id?: string | null;
  slug?: string | null;
  data?: WeddingData | null;
};

type RealtimePayload = {
  eventType?: "INSERT" | "UPDATE" | "DELETE";
  new?: SettingsRow;
  old?: SettingsRow;
};

function normalizeValue(
  value?: string | null
): string | null {
  if (!value) {
    return null;
  }

  const normalized = value.trim();
  return normalized || null;
}

/**
 * Menyamakan slug yang disimpan ke database dengan format
 * slug undangan: nama mempelai dipisahkan dengan "_dan_".
 */
function cleanSlugPart(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "_")
    .replace(/[^a-z0-9_]/g, "")
    .replace(/_+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function generateSettingsSlug(
  groomName: string,
  brideName: string
): string {
  const groom =
    cleanSlugPart(groomName) || "mempelai";

  const bride =
    cleanSlugPart(brideName) || "mempelai";

  return `${groom}_dan_${bride}`;
}

function normalizeWeddingData(
  value: unknown
): WeddingData {
  if (
    !value ||
    typeof value !== "object" ||
    Array.isArray(value)
  ) {
    return {};
  }

  return value as WeddingData;
}

/**
 * Cari satu baris settings berdasarkan ID atau slug.
 * Jika hanya user_id yang tersedia, pencarian hanya berhasil
 * bila pengguna tersebut memiliki tepat satu baris.
 */
async function findSettingsRow(
  settingsId: string | null,
  slug: string | null,
  userId: string | null
): Promise<SettingsRow | null> {
  if (settingsId) {
    const { data, error } = await supabase
      .from("settings")
      .select("id, user_id, slug, data")
      .eq("id", settingsId)
      .maybeSingle();

    if (error) {
      throw error;
    }

    return data as SettingsRow | null;
  }

  if (slug) {
    const { data, error } = await supabase
      .from("settings")
      .select("id, user_id, slug, data")
      .eq("slug", slug)
      .maybeSingle();

    if (error) {
      throw error;
    }

    return data as SettingsRow | null;
  }

  if (userId) {
    const { data, error } = await supabase
      .from("settings")
      .select("id, user_id, slug, data")
      .eq("user_id", userId)
      .limit(2);

    if (error) {
      throw error;
    }

    const rows = (data || []) as SettingsRow[];

    if (rows.length > 1) {
      throw new Error(
        "Pengguna ini memiliki beberapa undangan. " +
          "Teruskan slug atau ID undangan agar data yang benar dipilih."
      );
    }

    return rows[0] || null;
  }

  return null;
}

/**
 * Menggabungkan patch ke data saat ini.
 *
 * Objek bertingkat digabungkan agar update sebagian, misalnya
 * { groom: { bioEn: "..." } }, tidak menghapus field groom lainnya.
 *
 * Array sengaja diganti utuh. Dengan begitu, gifts: [] berarti
 * semua rekening dihapus.
 */
function mergeWeddingPatch(
  current: WeddingData,
  patch: WeddingData
): WeddingData {
  return {
    ...current,
    ...patch,

    ...(patch.groom !== undefined
      ? {
          groom: {
            ...current.groom,
            ...patch.groom,
          },
        }
      : {}),

    ...(patch.bride !== undefined
      ? {
          bride: {
            ...current.bride,
            ...patch.bride,
          },
        }
      : {}),

    ...(patch.quote !== undefined
      ? {
          quote: {
            ...current.quote,
            ...patch.quote,
          },
        }
      : {}),

    ...(patch.photos !== undefined
      ? {
          photos: {
            ...current.photos,
            ...patch.photos,
          },
        }
      : {}),
  };
}

/**
 * Pemanggilan:
 * useWeddingData(userId, slug, settingsId)
 *
 * Prioritas pemilihan baris:
 * 1. settingsId
 * 2. slug
 * 3. userId, hanya jika memiliki satu baris settings
 */
export function useWeddingData(
  userId?: string | null,
  slug?: string | null,
  settingsId?: string | null
) {
  const normalizedUserId = normalizeValue(userId);
  const normalizedSlug = normalizeValue(slug);
  const normalizedSettingsId =
    normalizeValue(settingsId);

  const nextSlug = generateSlug(
  merged.groom?.short || DEFAULT_WEDDING.groom.short,
  merged.bride?.short || DEFAULT_WEDDING.bride.short
);

  const [data, setData] = useState<WeddingData>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const storageKey = normalizedUserId
    ? `wedding-data-${normalizedUserId}`
    : "wedding-data-default";

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      if (
        SUPABASE_ENABLED &&
        (
          normalizedSettingsId ||
          normalizedSlug ||
          normalizedUserId
        )
      ) {
        const row = await findSettingsRow(
          normalizedSettingsId,
          normalizedSlug,
          normalizedUserId
        );

        if (!row) {
          if (normalizedSettingsId || normalizedSlug) {
            throw new Error(
              "Data undangan berdasarkan ID atau slug tidak ditemukan."
            );
          }

          setData({});
          return;
        }

        const weddingData = normalizeWeddingData(row.data);

        console.log(
          "[WeddingData] Data berhasil dimuat",
          {
            slug: row.slug || null,
            giftsCount: weddingData.gifts?.length || 0,
          }
        );

        setData(weddingData);
        return;
      }

      if (typeof window !== "undefined") {
        const raw = window.localStorage.getItem(storageKey);

        if (!raw) {
          setData({});
          return;
        }

        try {
          const parsed: unknown = JSON.parse(raw);
          setData(normalizeWeddingData(parsed));
        } catch (parseError) {
          console.error(
            "[WeddingData] LocalStorage rusak:",
            parseError
          );

          window.localStorage.removeItem(storageKey);
          setData({});
        }

        return;
      }

      setData({});
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : "Gagal memuat data undangan";

      console.error(
        "[WeddingData] Gagal memuat data:",
        err
      );

      setError(message);
      setData({});
    } finally {
      setLoading(false);
    }
  }, [
    normalizedSettingsId,
    normalizedSlug,
    normalizedUserId,
    storageKey,
  ]);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  /*
   * REALTIME SUBSCRIPTION
   *
   * Gunakan ID atau slug supaya perubahan dari undangan lain
   * milik pengguna yang sama tidak masuk ke halaman ini.
   */
  useEffect(() => {
    if (
      !SUPABASE_ENABLED ||
      (!normalizedSettingsId && !normalizedSlug)
    ) {
      return;
    }

    const targetKey = normalizedSettingsId
      ? `id-${normalizedSettingsId}`
      : `slug-${normalizedSlug}`;

    const filter = normalizedSettingsId
      ? `id=eq.${normalizedSettingsId}`
      : `slug=eq.${normalizedSlug}`;

    const channel = supabase
      .channel(`settings-changes-${targetKey}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "settings",
          filter,
        },
        (payload) => {
          const realtimePayload =
            payload as RealtimePayload;

          if (realtimePayload.eventType === "DELETE") {
            setData({});
            return;
          }

          if (realtimePayload.new) {
            setData(
              normalizeWeddingData(
                realtimePayload.new.data
              )
            );
          }
        }
      )
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          console.log(
            "[WeddingData] Realtime aktif:",
            targetKey
          );
        }

        if (status === "CHANNEL_ERROR") {
          console.error(
            "[WeddingData] Realtime mengalami error"
          );
        }

        if (status === "TIMED_OUT") {
          console.error(
            "[WeddingData] Realtime mengalami timeout"
          );
        }
      });

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [
    normalizedSettingsId,
    normalizedSlug,
  ]);

  /*
   * UPDATE DATA
   */
  const updateData = useCallback(
    async (patch: WeddingData) => {
      const merged = mergeWeddingPatch(data, patch);

      const nextSlug = generateSettingsSlug(
        merged.groom?.short ||
          DEFAULT_WEDDING.groom.short,
        merged.bride?.short ||
          DEFAULT_WEDDING.bride.short
      );

      setData(merged);
      setError(null);

      try {
        if (SUPABASE_ENABLED) {
          const existingRow = await findSettingsRow(
            normalizedSettingsId,
            normalizedSlug,
            normalizedUserId
          );

          if (existingRow?.id) {
            const { error: updateError } = await supabase
              .from("settings")
              .update({
                data: merged,
                slug: nextSlug,
                updated_at: new Date().toISOString(),
              })
              .eq("id", existingRow.id);

            if (updateError) {
              throw updateError;
            }

            console.log(
              "[WeddingData] Data berhasil disimpan ke Supabase",
              { slug: nextSlug }
            );

            return;
          }

          /*
           * Jika ID atau slug tertentu sudah diberikan tetapi
           * tidak ditemukan, jangan membuat baris baru tanpa sengaja.
           */
          if (normalizedSettingsId || normalizedSlug) {
            throw new Error(
              "Baris undangan tidak ditemukan. Periksa ID atau slug undangan."
            );
          }

          /*
           * Buat baris baru hanya jika belum ada baris untuk user ini.
           * Jika user memiliki beberapa undangan, findSettingsRow()
           * akan menghentikan proses agar tidak memilih baris sembarangan.
           */
          if (normalizedUserId) {
            const { error: insertError } = await supabase
              .from("settings")
              .insert({
                user_id: normalizedUserId,
                slug: nextSlug,
                data: merged,
                updated_at: new Date().toISOString(),
              });

            if (insertError) {
              throw insertError;
            }

            console.log(
              "[WeddingData] Data undangan baru berhasil disimpan",
              { slug: nextSlug }
            );

            return;
          }
        }

        if (typeof window !== "undefined") {
          window.localStorage.setItem(
            storageKey,
            JSON.stringify(merged)
          );
        }
      } catch (err: unknown) {
        const message =
          err instanceof Error
            ? err.message
            : "Gagal menyimpan data undangan";

        console.error(
          "[WeddingData] Gagal menyimpan data:",
          err
        );

        setError(message);
        throw err;
      }
    },
    [
      data,
      normalizedSettingsId,
      normalizedSlug,
      normalizedUserId,
      storageKey,
    ]
  );

  const mergedData = mergeWithDefaults(data);

  return {
    data,
    mergedData,
    loading,
    error,
    updateData,
    refetch: fetchData,
  };
}

function mergeWithDefaults(
  data: WeddingData
): typeof DEFAULT_WEDDING & {
  photos: typeof DEFAULT_IMG;
  religiousFormat?: ReligiousFormat;
  language?: "id" | "en";
  themeId?: string;
  ornamentId?: string;
  customOrnament?: string;
  templateId?: TemplateId;
} {
  return {
    initials:
      data.initials ??
      DEFAULT_WEDDING.initials,

    dateLabel:
      data.dateLabel ??
      DEFAULT_WEDDING.dateLabel,

    dateShort:
      data.dateShort ??
      DEFAULT_WEDDING.dateShort,

    dateISO:
      data.dateISO ??
      DEFAULT_WEDDING.dateISO,

    city:
      data.city ??
      DEFAULT_WEDDING.city,

    venueMain:
      data.venueMain ??
      DEFAULT_WEDDING.venueMain,

    groom: {
      ...DEFAULT_WEDDING.groom,
      ...(data.groom || {}),
    },

    bride: {
      ...DEFAULT_WEDDING.bride,
      ...(data.bride || {}),
    },

    quote: {
      ...DEFAULT_WEDDING.quote,
      ...(data.quote || {}),
    },

    events: Array.isArray(data.events)
      ? data.events.map((event, index) => ({
          ...(DEFAULT_WEDDING.events[index] ||
            DEFAULT_WEDDING.events[0]),
          ...event,
        }))
      : DEFAULT_WEDDING.events,

    story: Array.isArray(data.story)
      ? data.story.map((storyItem, index) => ({
          ...(DEFAULT_WEDDING.story[index] ||
            DEFAULT_WEDDING.story[0]),
          ...storyItem,
        }))
      : DEFAULT_WEDDING.story,

    gallery: Array.isArray(data.gallery)
      ? data.gallery.map((galleryItem, index) => ({
          ...(DEFAULT_WEDDING.gallery[index] ||
            DEFAULT_WEDDING.gallery[0]),
          ...galleryItem,
        }))
      : DEFAULT_WEDDING.gallery,

    gifts: Array.isArray(data.gifts)
      ? data.gifts.map((gift, index) => ({
          ...(DEFAULT_WEDDING.gifts[index] ||
            DEFAULT_WEDDING.gifts[0]),
          ...gift,
        }))
      : DEFAULT_WEDDING.gifts,

    giftAddress:
      data.giftAddress ??
      DEFAULT_WEDDING.giftAddress,

    dresscode: Array.isArray(data.dresscode)
      ? data.dresscode.map((dresscodeItem, index) => ({
          ...(DEFAULT_WEDDING.dresscode[index] ||
            DEFAULT_WEDDING.dresscode[0]),
          ...dresscodeItem,
        }))
      : DEFAULT_WEDDING.dresscode,

    photos: {
      ...DEFAULT_IMG,
      ...(data.photos || {}),
    },

    themeId: data.themeId,
    ornamentId: data.ornamentId,
    customOrnament: data.customOrnament,
    religiousFormat: data.religiousFormat,
    language: data.language,
    templateId: data.templateId,
  };
}
