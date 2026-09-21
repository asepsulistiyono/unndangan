/**
 * Utility untuk slug URL undangan.
 *
 * Contoh:
 * Raka + Sekar -> raka_dan_sekar
 */

const LS_SLUGS = "wedding-slugs-v1";

/**
 * Membersihkan nama agar aman digunakan sebagai slug.
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

/**
 * Membuat slug dari nama kedua mempelai.
 *
 * Contoh:
 * generateSlug("Budi", "Wati")
 * menghasilkan:
 * budi_dan_wati
 */
export function generateSlug(
  groomName: string,
  brideName: string
): string {
  const groom =
    cleanSlugPart(groomName) || "mempelai";

  const bride =
    cleanSlugPart(brideName) || "mempelai";

  return `${groom}_dan_${bride}`;
}

/**
 * Membersihkan slug dari karakter URL yang tidak diperlukan.
 */
export function normalizeSlug(slug: string): string {
  return slug
    .trim()
    .replace(/^\/+|\/+$/g, "")
    .replace(/^#\/?/, "");
}

/**
 * Menyimpan mapping slug ke user ID.
 */
export function saveSlugMapping(
  slug: string,
  userId: string
): void {
  try {
    const raw = localStorage.getItem(LS_SLUGS);

    const map: Record<string, string> = raw
      ? JSON.parse(raw)
      : {};

    const cleanSlug = normalizeSlug(slug);

    if (!cleanSlug || !userId) {
      return;
    }

    map[cleanSlug] = userId;

    localStorage.setItem(
      LS_SLUGS,
      JSON.stringify(map)
    );
  } catch {
    // Abaikan error localStorage
  }
}

/**
 * Mengambil user ID berdasarkan slug.
 */
export function getUserIdFromSlug(
  slug: string
): string | null {
  try {
    const raw = localStorage.getItem(LS_SLUGS);

    if (!raw) {
      return null;
    }

    const map: Record<string, string> =
      JSON.parse(raw);

    const cleanSlug = normalizeSlug(slug);

    return map[cleanSlug] || null;
  } catch {
    return null;
  }
}

/**
 * Menghapus semua slug milik user tertentu.
 */
export function removeSlugByUserId(
  userId: string
): void {
  try {
    const raw = localStorage.getItem(LS_SLUGS);

    if (!raw) {
      return;
    }

    const map: Record<string, string> =
      JSON.parse(raw);

    const newMap: Record<string, string> = {};

    for (const [slug, mappedUserId] of Object.entries(
      map
    )) {
      if (mappedUserId !== userId) {
        newMap[slug] = mappedUserId;
      }
    }

    localStorage.setItem(
      LS_SLUGS,
      JSON.stringify(newMap)
    );
  } catch {
    // Abaikan error localStorage
  }
}

/**
 * Mengecek apakah hash merupakan route slug undangan.
 *
 * Mendukung:
 * #/budi_dan_wati
 * #/budi_dan_wati/?to=Pak%20Budi
 */
export function parseInvitationSlug(
  hash: string
): string | null {
  let path = hash
    .replace(/^#\/?/, "")
    .trim();

  if (!path) {
    return null;
  }

  const queryIndex = path.indexOf("?");

  if (queryIndex !== -1) {
    path = path.substring(0, queryIndex);
  }

  path = path.replace(/\/+$/, "");

  if (
    path === "admin" ||
    path.startsWith("admin/") ||
    path === "tamu" ||
    path.startsWith("tamu/")
  ) {
    return null;
  }

  if (
    /^[a-z0-9_]+$/.test(path) &&
    path.includes("_dan_")
  ) {
    return path;
  }

  return null;
}
