import {
  createContext,
  useContext,
  useEffect,
  type ReactNode,
} from "react";

import {
  useWeddingData,
  type WeddingData,
} from "./useWeddingData";

import {
  WEDDING as DEFAULT_WEDDING,
} from "./wedding";

import {
  getTheme,
  type Theme,
} from "./themes";

import {
  updateMetaTags,
} from "./metaTags";

import {
  translations,
  translateDate,
  type Language,
  type Translations,
} from "./translations";

import {
  getReligiousFormat,
  type ReligiousFormat,
  type ReligiousFormatData,
} from "./religiousFormats";

import {
  getTemplate,
  type TemplateId,
  type DesignTemplate,
} from "./templates";

interface WeddingContextType {
  /*
   * data sekarang menggunakan mergedData,
   * sehingga quote default tetap tersedia
   * meskipun database memiliki quote: null.
   */
  data: typeof DEFAULT_WEDDING & {
    photos: any;
  };

  mergedData: typeof DEFAULT_WEDDING & {
    photos: any;
  };

  theme: Theme;
  language: Language;
  t: Translations;
  religiousFormat: ReligiousFormatData;
  template: DesignTemplate;

  translateDateStr: (
    dateStr: string
  ) => string;

  getLocalizedText: (
    idText: string,
    enText?: string
  ) => string;

  loading: boolean;
  error: string | null;

  updateData: (
    patch: WeddingData
  ) => Promise<void>;

  refetch: () => Promise<void>;
}

const WeddingContext =
  createContext<WeddingContextType | null>(
    null
  );

function getSlugFromHash(): string | null {
  if (
    typeof window === "undefined"
  ) {
    return null;
  }

  const hash =
    window.location.hash;

  if (!hash.startsWith("#/")) {
    return null;
  }

  const rawSlug = hash
    .replace(/^#\//, "")
    .split("?")[0]
    .split("/")[0]
    .trim();

  if (!rawSlug) {
    return null;
  }

  /*
   * Route berikut bukan slug undangan.
   */
  const ignoredRoutes = [
    "admin",
    "login",
    "tamu",
    "guest",
    "register",
    "forgot-password",
  ];

  if (
    ignoredRoutes.includes(
      rawSlug.toLowerCase()
    )
  ) {
    return null;
  }

  try {
    return decodeURIComponent(rawSlug);
  } catch {
    return rawSlug;
  }
}

export function WeddingProvider({
  children,
  userId,
  slug,
}: {
  children: ReactNode;
  userId?: string | null;
  slug?: string | null;
}) {
  /*
   * Jika slug diberikan oleh App.tsx,
   * gunakan nilai tersebut.

   * Jika tidak, ambil slug dari URL hash.
   */
  const effectiveSlug =
    slug?.trim() || getSlugFromHash();

  const weddingData = useWeddingData(
    userId ?? null,
    effectiveSlug
  );

  const theme = getTheme(
    weddingData.data.themeId ||
      "emerald-garden"
  );

  const language =
    (weddingData.data.language ||
      "id") as Language;

  const t = translations[language];

  const religiousFormat =
    getReligiousFormat(
      (weddingData.data.religiousFormat ||
        "islam") as ReligiousFormat
    );

  const template = getTemplate(
    (weddingData.data.templateId ||
      "classic-elegant") as TemplateId
  );

  const translateDateStr = (
    dateStr: string
  ) => {
    return translateDate(
      dateStr,
      language
    );
  };

  const getLocalizedText = (
    idText: string,
    enText?: string
  ) => {
    if (
      language === "en" &&
      enText
    ) {
      return enText;
    }

    return idText;
  };

  /*
   * Gunakan mergedData sebagai data utama.
   *
   * Sebelumnya:
   * data: weddingData.data
   *
   * Masalahnya, jika database memiliki:
   * quote: null
   *
   * maka komponen mendapatkan quote null.
   *
   * Sekarang:
   * data: weddingData.mergedData
   *
   * sehingga data.quote selalu memiliki
   * fallback dari DEFAULT_WEDDING.quote.
   */
  const value: WeddingContextType = {
    ...weddingData,

    data: weddingData.mergedData,

    theme,
    language,
    t,
    religiousFormat,
    template,
    translateDateStr,
    getLocalizedText,
  };

  useEffect(() => {
    if (
      weddingData.loading ||
      !weddingData.mergedData
    ) {
      return;
    }

    const {
      groom,
      bride,
      dateLabel,
    } = weddingData.mergedData;

    const title =
      language === "id"
        ? `Undangan Pernikahan ${groom.short} & ${bride.short}`
        : `Wedding Invitation ${groom.short} & ${bride.short}`;

    const description =
      `${groom.full} & ${bride.full} — ${dateLabel}`;

    updateMetaTags({
      title,
      description,
    });
  }, [
    weddingData.loading,
    weddingData.mergedData,
    language,
  ]);

  return (
    <WeddingContext.Provider
      value={value}
    >
      {children}
    </WeddingContext.Provider>
  );
}

export function useWedding() {
  const context = useContext(
    WeddingContext
  );

  if (!context) {
    throw new Error(
      "useWedding must be used within WeddingProvider"
    );
  }

  return context;
}
