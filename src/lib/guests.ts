import { WEDDING } from "./wedding";
import { generateSlug, normalizeSlug } from "./slug";

export type Guest = {
  id: string;
  name: string;
  phone: string;
};

export const LS_GUESTS =
  "raka-sekar-guests-v1";

export const LS_TEMPLATE =
  "raka-sekar-template-v1";

/**
 * Slug bawaan apabila pemanggil belum mengirim slug.
 *
 * Sebaiknya pada halaman Kelola Tamu tetap mengirim
 * slug secara eksplisit agar mengikuti data undangan
 * yang sedang aktif.
 */
export const DEFAULT_INVITATION_SLUG =
  generateSlug(
    WEDDING.groom.short,
    WEDDING.bride.short
  );

export const DEFAULT_TEMPLATE = `Assalamu'alaikum Warahmatullahi Wabarakatuh.

Kepada Yth. Bapak/Ibu/Saudara/i
*{nama}*

Dengan memohon rahmat dan ridha Allah SWT, kami bermaksud mengundang Bapak/Ibu/Saudara/i untuk hadir di pernikahan kami:

*${WEDDING.groom.short} & ${WEDDING.bride.short}*
${WEDDING.dateLabel} · ${WEDDING.venueMain}

Buka undangan digital kami melalui tautan berikut:
{link}

Merupakan suatu kehormatan dan kebahagiaan bagi kami apabila Bapak/Ibu/Saudara/i berkenan hadir untuk memberikan doa restu. Terima kasih.

Wassalamu'alaikum Warahmatullahi Wabarakatuh.
*${WEDDING.groom.short} & ${WEDDING.bride.short} beserta keluarga*`;

/* ---------- URL & tautan ---------- */

/**
 * Mengambil URL dasar aplikasi tanpa pathname dan
 * tanpa trailing slash.
 *
 * Benar:
 * https://unndangan.vercel.app
 *
 * Salah:
 * https://unndangan.vercel.app/
 * https://unndangan.vercel.app//#/
 */
export function baseUrl(): string {
  if (
    typeof window === "undefined"
  ) {
    return "";
  }

  return window.location.origin.replace(
    /\/+$/,
    ""
  );
}

/**
 * Membuat link undangan umum.
 *
 * Contoh:
 * https://unndangan.vercel.app/#/budi_dan_wati
 */
export function invitationLink(
  invitationSlug?: string
): string {
  const cleanSlug = normalizeSlug(
    invitationSlug || DEFAULT_INVITATION_SLUG
  );

  return `${baseUrl()}/#/${cleanSlug}`;
}

  if (!cleanSlug) {
    throw new Error(
      "Slug undangan belum tersedia."
    );
  }

  return `${baseUrl()}/#/${cleanSlug}`;
}

/**
 * Membuat link undangan khusus tamu.
 *
 * Contoh:
 * https://unndangan.vercel.app/#/budi_dan_wati/?to=Pak%20Budi
 *
 * invitationSlug dibuat opsional agar kode lama
 * tetap bisa dikompilasi. Namun sebaiknya slug
 * selalu dikirim dari halaman Kelola Tamu.
 */
export function guestLink(
  name: string,
  invitationSlug?: string
): string {
  const cleanName = name.trim();

  const cleanSlug = normalizeSlug(
    invitationSlug ||
      DEFAULT_INVITATION_SLUG
  );

  if (!cleanSlug) {
    throw new Error(
      "Slug undangan belum tersedia."
    );
  }

  if (!cleanName) {
    throw new Error(
      "Nama tamu belum tersedia."
    );
  }

  return `${baseUrl()}/#/${cleanSlug}/?to=${encodeURIComponent(
    cleanName
  )}`;
}

/* ---------- nomor WhatsApp ---------- */

/**
 * Mengubah:
 * 0812-3456-7890
 *
 * Menjadi:
 * 6281234567890
 */
export function normalizePhone(
  raw: string
): string {
  let digits = raw.replace(/\D/g, "");

  if (digits.startsWith("0")) {
    digits = "62" + digits.slice(1);
  } else if (digits.startsWith("8")) {
    digits = "62" + digits;
  }

  return digits;
}

export function waShareLink(
  phone: string,
  message: string
): string {
  const text = encodeURIComponent(message);

  return phone
    ? `https://wa.me/${normalizePhone(
        phone
      )}?text=${text}`
    : `https://wa.me/?text=${text}`;
}

/* ---------- parser input massal ---------- */

/**
 * Format yang didukung:
 *
 * Bapak H. Ahmad Fauzi
 * Ibu Siti Aminah | 081234567890
 */
export function parseBulk(
  text: string
): {
  name: string;
  phone: string;
}[] {
  return text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [name, phone] = line
        .split("|")
        .map((value) => value.trim());

      return {
        name: name || "",
        phone: phone || "",
      };
    })
    .filter((guest) => guest.name.length > 0);
}

/* ---------- template pesan ---------- */

export function fillTemplate(
  template: string,
  name: string,
  link: string
): string {
  return template
    .split("{nama}")
    .join(name)
    .split("{link}")
    .join(link);
}

/* ---------- penyimpanan tamu ---------- */

export function loadGuests(): Guest[] {
  try {
    const raw =
      localStorage.getItem(LS_GUESTS);

    if (!raw) {
      return [];
    }

    const parsed: unknown = JSON.parse(raw);

    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.filter(
      (guest): guest is Guest =>
        Boolean(
          guest &&
            typeof guest === "object" &&
            "name" in guest &&
            typeof guest.name === "string" &&
            guest.name.trim().length > 0
        )
    );
  } catch {
    return [];
  }
}

export function saveGuests(
  guests: Guest[]
): void {
  try {
    localStorage.setItem(
      LS_GUESTS,
      JSON.stringify(guests)
    );
  } catch {
    // Abaikan jika penyimpanan penuh
  }
}

export function loadTemplate(): string {
  try {
    return (
      localStorage.getItem(LS_TEMPLATE) ||
      DEFAULT_TEMPLATE
    );
  } catch {
    return DEFAULT_TEMPLATE;
  }
}

export function saveTemplate(
  template: string
): void {
  try {
    localStorage.setItem(
      LS_TEMPLATE,
      template
    );
  } catch {
    // Abaikan error localStorage
  }
}

export function makeId(): string {
  return `${Date.now().toString(36)}-${Math.random()
    .toString(36)
    .slice(2, 8)}`;
}

/* ---------- ekspor file ---------- */

export function downloadFile(
  filename: string,
  content: string,
  mime: string
): void {
  const blob = new Blob([content], {
    type: `${mime};charset=utf-8`,
  });

  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");

  anchor.href = url;
  anchor.download = filename;

  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();

  URL.revokeObjectURL(url);
}

const escCsv = (value: string): string =>
  `"${value.split('"').join('""')}"`;

export function toCsv(
  guests: Guest[],
  invitationSlug?: string
): string {
  const head = "Nama,No HP,Link Undangan";

  const rows = guests.map((guest) => {
    const link = guestLink(
      guest.name,
      invitationSlug
    );

    return [
      escCsv(guest.name),
      escCsv(guest.phone),
      escCsv(link),
    ].join(",");
  });

  return "\uFEFF" + [head, ...rows].join("\n");
}

export function toLinksTxt(
  guests: Guest[],
  invitationSlug?: string
): string {
  return guests
    .map((guest) => {
      const link = guestLink(
        guest.name,
        invitationSlug
      );

      return `${guest.name}\n${link}`;
    })
    .join("\n\n");
}
