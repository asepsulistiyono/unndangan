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

  groom?: Partial<
    typeof DEFAULT_WEDDING.groom
  > & {
    parentsEn?: string;
    bioEn?: string;
  };

  bride?: Partial<
    typeof DEFAULT_WEDDING.bride
  > & {
    parentsEn?: string;
    bioEn?: string;
  };

  quote?: Partial<
    typeof DEFAULT_WEDDING.quote
  > & {
    textEn?: string;
  };

  events?: Array<
    Partial<
      (typeof DEFAULT_WEDDING.events)[number]
    > & {
      nameEn?: string;
      noteEn?: string;
    }
  >;

  story?: Array<
    Partial<
      (typeof DEFAULT_WEDDING.story)[number]
    > & {
      titleEn?: string;
      textEn?: string;
    }
  >;

  gallery?: Array<
    Partial<
      (typeof DEFAULT_WEDDING.gallery)[number]
    >
  >;

  gifts?: Array<
    Partial<
      (typeof DEFAULT_WEDDING.gifts)[number]
    >
  >;

  giftAddress?: string;

  dresscode?: Array<
    Partial<
      (typeof DEFAULT_WEDDING.dresscode)[number]
    >
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
 
  data?: WeddingData | null;
};

type RealtimePayload = {
  eventType?:
    | "INSERT"
    | "UPDATE"
    | "DELETE";

  new?: SettingsRow;
  old?: SettingsRow;
};

export function useWeddingData(
  userId?: string | null,
 
) {
  const [data, setData] =
    useState<WeddingData>({});

  const [loading, setLoading] =
    useState(true);

  const [error, setError] = useState<
    string | null
  >(null);

  const storageKey = userId
    ? `wedding-data-${userId}`
    : "wedding-data-default";

  const fetchData = useCallback(
    async () => {
      setLoading(true);
      setError(null);

      try {
        if (SUPABASE_ENABLED && slug) {
          const {
            data: row,
            error: fetchError,
          } = await supabase
            .from("settings")
            .select("data")
            .eq("slug", slug)
            .maybeSingle();

          if (fetchError) {
            throw fetchError;
          }

          if (!row) {
            throw new Error(
              "Data undangan tidak ditemukan untuk slug tersebut"
            );
          }

          setData(
            (row.data as WeddingData) || {}
          );

          return;
        }

        if (SUPABASE_ENABLED && userId) {
          const {
            data: row,
            error: fetchError,
          } = await supabase
            .from("settings")
            .select("data")
            .eq("user_id", userId)
            .maybeSingle();

          if (fetchError) {
            throw fetchError;
          }

          setData(
            (row?.data as WeddingData) || {}
          );

          return;
        }

        if (
          typeof window !== "undefined"
        ) {
          const raw =
            window.localStorage.getItem(
              storageKey
            );

          setData(
            raw
              ? (JSON.parse(raw) as WeddingData)
              : {}
          );
        } else {
          setData({});
        }
      } catch (err: unknown) {
        const message =
          err instanceof Error
            ? err.message
            : "Gagal memuat data undangan";

        setError(message);
        setData({});
      } finally {
        setLoading(false);
      }
    },
    [slug, storageKey, userId]
  );

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (
      !SUPABASE_ENABLED ||
      (!userId && !slug)
    ) {
      return;
    }

    const targetKey = slug
      ? `slug-${slug}`
      : `user-${userId}`;

    const filter = slug
      ? `slug=eq.${slug}`
      : `user_id=eq.${userId}`;

    const channel = supabase
      .channel(
        `settings-changes-${targetKey}`
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "settings",
          filter,
        },
        (payload: RealtimePayload) => {
          if (
            payload.eventType === "DELETE"
          ) {
            setData({});
            return;
          }

          setData(
            payload.new?.data || {}
          );
        }
      )
      .subscribe((status) => {
        if (status === "CHANNEL_ERROR") {
          console.error(
            "Gagal berlangganan perubahan Realtime tabel settings"
          );
        }

        if (status === "TIMED_OUT") {
          console.error(
            "Subscription Realtime tabel settings mengalami timeout"
          );
        }
      });

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [slug, userId]);

  const updateData = useCallback(
  async (patch: WeddingData) => {
    const merged: WeddingData = {
      ...data,
      ...patch,
    };

    setData(merged);
    setError(null);

    try {
      if (SUPABASE_ENABLED && userId) {
        const {
          data: existingRows,
          error: selectError,
        } = await supabase
          .from("settings")
          .select("id")
          .eq("user_id", userId)
          .limit(1);

        if (selectError) {
          throw selectError;
        }

        const existingRow =
          existingRows?.[0];

        if (existingRow) {
          const {
            error: updateError,
          } = await supabase
            .from("settings")
            .update({
              data: merged,
              updated_at: new Date().toISOString(),
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
              user_id: userId,
              data: merged,
            });

          if (insertError) {
            throw insertError;
          }
        }

        return;
      }

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
        "Gagal menyimpan wedding data:",
        err
      );

      setError(message);
      throw err;
    }
  },
  [data, storageKey, userId]
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
            ] || DEFAULT_WEDDING.events[0]),
            ...event,
          })
        )
      : DEFAULT_WEDDING.events,

    story: data.story?.length
      ? data.story.map(
          (storyItem, index) => ({
            ...(DEFAULT_WEDDING.story[
              index
            ] || DEFAULT_WEDDING.story[0]),
            ...storyItem,
          })
        )
      : DEFAULT_WEDDING.story,

    gallery: data.gallery?.length
      ? data.gallery.map(
          (galleryItem, index) => ({
            ...(DEFAULT_WEDDING.gallery[
              index
            ] || DEFAULT_WEDDING.gallery[0]),
            ...galleryItem,
          })
        )
      : DEFAULT_WEDDING.gallery,

    gifts: data.gifts?.length
      ? data.gifts.map(
          (gift, index) => ({
            ...(DEFAULT_WEDDING.gifts[
              index
            ] || DEFAULT_WEDDING.gifts[0]),
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

    religiousFormat:
      data.religiousFormat,

    language: data.language,
  };
}
