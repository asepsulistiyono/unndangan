import {
  useCallback,
  useEffect,
  useState,
} from "react";

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

function cleanSlug(value?: string | null) {
  if (!value) {
    return null;
  }

  const result = value.trim();

  return result || null;
}

export function useWeddingData(
  userId?: string | null,
  slug?: string | null
) {
  const normalizedUserId = userId?.trim() || null;
  const normalizedSlug = cleanSlug(slug);

  const [data, setData] =
    useState<WeddingData>({});

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState<string | null>(null);

  const storageKey = normalizedUserId
    ? `wedding-data-${normalizedUserId}`
    : "wedding-data-default";

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      console.log(
        "[WeddingData] Memuat data dengan:",
        {
          userId: normalizedUserId,
          slug: normalizedSlug,
          supabaseEnabled: SUPABASE_ENABLED,
        }
      );

      /*
       * HALAMAN PUBLIK
       *
       * Prioritas utama adalah slug.
       * Contoh:
       * #/romeo_dan_juliaet
       */
      if (
        SUPABASE_ENABLED &&
        normalizedSlug
      ) {
        const {
          data: row,
          error: fetchError,
        } = await supabase
          .from("settings")
          .select("id, user_id, slug, data")
          .eq("slug", normalizedSlug)
          .maybeSingle();

        if (fetchError) {
          throw fetchError;
        }

        if (!row) {
          throw new Error(
            `Data undangan tidak ditemukan untuk slug "${normalizedSlug}"`
          );
        }

        const weddingData =
          (row as SettingsRow).data ||
          {};

        console.log(
          "[WeddingData] Data publik berhasil dimuat:",
          {
            slug: (row as SettingsRow).slug,
            storyCount: Array.isArray(
              weddingData.story
            )
              ? weddingData.story.length
              : 0,
          }
        );

        setData(weddingData);
        return;
      }

      /*
       * HALAMAN ADMIN
       *
       * Admin membaca data berdasarkan user_id.
       */
      if (
        SUPABASE_ENABLED &&
        normalizedUserId
      ) {
        const {
          data: row,
          error: fetchError,
        } = await supabase
          .from("settings")
          .select("id, user_id, slug, data")
          .eq("user_id", normalizedUserId)
          .limit(1)
          .maybeSingle();

        if (fetchError) {
          throw fetchError;
        }

        const weddingData =
          (row as SettingsRow | null)?.data ||
          {};

        console.log(
          "[WeddingData] Data admin berhasil dimuat:",
          {
            slug:
              (row as SettingsRow | null)?.slug,
            storyCount: Array.isArray(
              weddingData.story
            )
              ? weddingData.story.length
              : 0,
          }
        );

        setData(weddingData);
        return;
      }

      /*
       * FALLBACK LOCAL STORAGE
       *
       * Digunakan hanya jika Supabase tidak aktif.
       */
      if (
        typeof window !== "undefined"
      ) {
        const raw =
          window.localStorage.getItem(
            storageKey
          );

        if (!raw) {
          setData({});
          return;
        }

        try {
          setData(
            JSON.parse(raw) as WeddingData
          );
        } catch {
          window.localStorage.removeItem(
            storageKey
          );

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

      /*
       * Data dikosongkan ketika query gagal.
       * mergedData tetap menyediakan struktur default,
       * tetapi error tetap bisa dilihat di console.
       */
      setData({});
    } finally {
      setLoading(false);
    }
  }, [
    normalizedSlug,
    normalizedUserId,
    storageKey,
  ]);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (
      !SUPABASE_ENABLED ||
      (!normalizedUserId &&
        !normalizedSlug)
    ) {
      return;
    }

    const targetKey = normalizedSlug
      ? `slug-${normalizedSlug}`
      : `user-${normalizedUserId}`;

    const filter = normalizedSlug
      ? `slug=eq.${normalizedSlug}`
      : `user_id=eq.${normalizedUserId}`;

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

          if (
            realtimePayload.eventType ===
            "DELETE"
          ) {
            setData({});
            return;
          }

          if (
            realtimePayload.new?.data
          ) {
            setData(
              realtimePayload.new.data
            );
          }
        }
      )
      .subscribe((status) => {
        if (
          status === "CHANNEL_ERROR"
        ) {
          console.error(
            "[WeddingData] Realtime mengalami error"
          );
        }

        if (
          status === "TIMED_OUT"
        ) {
          console.error(
            "[WeddingData] Realtime mengalami timeout"
          );
        }

        if (
          status === "SUBSCRIBED"
        ) {
          console.log(
            "[WeddingData] Realtime aktif:",
            targetKey
          );
        }
      });

    return () => {
      void supabase.removeChannel(
        channel
      );
    };
  }, [
    normalizedSlug,
    normalizedUserId,
  ]);

  const updateData = useCallback(
    async (patch: WeddingData) => {
      const merged: WeddingData = {
        ...data,
        ...patch,
      };

      setData(merged);
      setError(null);

      try {
        /*
         * ADMIN MENYIMPAN KE SUPABASE
         */
        if (
          SUPABASE_ENABLED &&
          normalizedUserId
        ) {
          const {
            data: existingRow,
            error: selectError,
          } = await supabase
            .from("settings")
            .select("id")
            .eq("user_id", normalizedUserId)
            .limit(1)
            .maybeSingle();

          if (selectError) {
            throw selectError;
          }

          if (existingRow?.id) {
            const {
              error: updateError,
            } = await supabase
              .from("settings")
              .update({
                data: merged,
                updated_at:
                  new Date().toISOString(),
              })
              .eq("id", existingRow.id);

            if (updateError) {
              throw updateError;
            }
          } else {
            const {
              error: insertError,
            } = await supabase
              .from("settings")
              .insert({
                user_id: normalizedUserId,
                data: merged,
                updated_at:
                  new Date().toISOString(),
              });

            if (insertError) {
              throw insertError;
            }
          }

          console.log(
            "[WeddingData] Data berhasil disimpan ke Supabase"
          );

          return;
        }

        /*
         * FALLBACK LOCAL STORAGE
         */
        if (
          typeof window !== "undefined"
        ) {
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
      normalizedUserId,
      storageKey,
    ]
  );

  const mergedData =
    mergeWithDefaults(data);

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
      ...data.groom,
    },

    bride: {
      ...DEFAULT_WEDDING.bride,
      ...data.bride,
    },

    quote: {
      ...DEFAULT_WEDDING.quote,
      ...data.quote,
    },

    events: data.events?.length
      ? data.events.map(
          (event, index) => ({
            ...(DEFAULT_WEDDING.events[
              index
            ] ||
              DEFAULT_WEDDING.events[0]),
            ...event,
          })
        )
      : DEFAULT_WEDDING.events,

    story: data.story?.length
      ? data.story.map(
          (storyItem, index) => ({
            ...(DEFAULT_WEDDING.story[
              index
            ] ||
              DEFAULT_WEDDING.story[0]),
            ...storyItem,
          })
        )
      : DEFAULT_WEDDING.story,

    gallery: data.gallery?.length
      ? data.gallery.map(
          (galleryItem, index) => ({
            ...(DEFAULT_WEDDING.gallery[
              index
            ] ||
              DEFAULT_WEDDING.gallery[0]),
            ...galleryItem,
          })
        )
      : DEFAULT_WEDDING.gallery,

    gifts: data.gifts?.length
      ? data.gifts.map(
          (gift, index) => ({
            ...(DEFAULT_WEDDING.gifts[
              index
            ] ||
              DEFAULT_WEDDING.gifts[0]),
            ...gift,
          })
        )
      : DEFAULT_WEDDING.gifts,

    giftAddress:
      data.giftAddress ??
      DEFAULT_WEDDING.giftAddress,

    dresscode: data.dresscode?.length
      ? data.dresscode.map(
          (dresscodeItem, index) => ({
            ...(DEFAULT_WEDDING.dresscode[
              index
            ] ||
              DEFAULT_WEDDING.dresscode[0]),
            ...dresscodeItem,
          })
        )
      : DEFAULT_WEDDING.dresscode,

    photos: {
      ...DEFAULT_IMG,
      ...data.photos,
    },

    themeId: data.themeId,
    ornamentId: data.ornamentId,
    customOrnament: data.customOrnament,
    religiousFormat: data.religiousFormat,
    language: data.language,
    templateId: data.templateId,
  };
}
