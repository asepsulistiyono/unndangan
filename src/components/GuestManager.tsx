import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type ReactNode,
} from "react";

import {
  DEFAULT_TEMPLATE,
  invitationLink,
  downloadFile,
  fillTemplate,
  guestLink,
  loadGuests,
  loadTemplate,
  makeId,
  normalizePhone,
  parseBulk,
  saveGuests,
  saveTemplate,
  toCsv,
  toLinksTxt,
  waShareLink,
  type Guest,
} from "../lib/guests";

import { copyText } from "./sections/Gift";
import { Monogram, Petals } from "./Decor";

import {
  IconArrowLeft,
  IconCheck,
  IconChat,
  IconCopy,
  IconDownload,
  IconLink,
  IconPencil,
  IconSearch,
  IconTrash,
  IconUpload,
  IconUsers,
} from "./Icons";

const inputCls =
  "w-full rounded-[3px] border border-gold-500/25 bg-pine-900/80 px-4 py-3 text-sm text-ivory placeholder:text-sage-300/40 transition-colors duration-300 focus:border-gold-400 focus:outline-none";

const PAGE = 40;

function RowBtn({
  label,
  onClick,
  tone,
  children,
}: {
  label: string;
  onClick: () => void;
  tone: string;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      onClick={onClick}
      className={`flex size-9 shrink-0 items-center justify-center rounded-full border transition-all duration-200 active:scale-90 ${tone}`}
    >
      {children}
    </button>
  );
}

export default function GuestManager({
  invitationSlug,
}: {
  invitationSlug?: string;
}) {
  const [guests, setGuests] = useState<Guest[]>(
    loadGuests
  );

  const [query, setQuery] = useState("");
  const [template, setTemplate] =
    useState(loadTemplate);
  const [bulk, setBulk] = useState("");
  const [toast, setToast] = useState("");
  const [confirmClear, setConfirmClear] =
    useState(false);

  const [editingId, setEditingId] =
    useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editPhone, setEditPhone] =
    useState("");

  const [visible, setVisible] = useState(PAGE);

  const fileRef =
    useRef<HTMLInputElement | null>(null);

  const toastTimer = useRef<
    number | undefined
  >(undefined);

  /**
   * Membuat URL undangan utama.
   *
   * Jika invitationSlug tersedia:
   * https://domain.com/#/budi_dan_wati
   *
   * Jika belum tersedia, invitationLink()
   * menggunakan slug default dari guests.ts.
   */
  const invitationUrl = invitationLink(
    invitationSlug
  );

  useEffect(() => {
    saveGuests(guests);
  }, [guests]);

  useEffect(() => {
    saveTemplate(template);
  }, [template]);

  useEffect(() => {
    document.title =
      "Kelola Tamu · Undangan Pernikahan";

    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    return () => {
      window.clearTimeout(toastTimer.current);
    };
  }, []);

  const say = (message: string) => {
    setToast(message);

    window.clearTimeout(toastTimer.current);

    toastTimer.current = window.setTimeout(() => {
      setToast("");
    }, 2600);
  };

  const filtered = useMemo(() => {
    const search = query.trim().toLowerCase();

    if (!search) {
      return guests;
    }

    const phoneSearch =
      query.replace(/\D/g, "") || "§";

    return guests.filter(
      (guest) =>
        guest.name
          .toLowerCase()
          .includes(search) ||
        guest.phone.includes(phoneSearch)
    );
  }, [guests, query]);

  const shown = filtered.slice(0, visible);

  const withPhone = useMemo(
    () =>
      guests.filter(
        (guest) => guest.phone.trim().length > 0
      ).length,
    [guests]
  );

  const parsedCount = useMemo(
    () => parseBulk(bulk).length,
    [bulk]
  );

  /* ---------- aksi tamu ---------- */

  const addBulk = () => {
    const items = parseBulk(bulk);

    if (items.length === 0) {
      say(
        "Tidak ada nama terbaca — satu nama per baris"
      );
      return;
    }

    const existing = new Set(
      guests.map(
        (guest) =>
          `${guest.name}||${guest.phone}`
      )
    );

    const fresh = items
      .filter(
        (item) =>
          !existing.has(
            `${item.name}||${item.phone}`
          )
      )
      .map((item) => ({
        id: makeId(),
        name: item.name,
        phone: item.phone,
      }));

    setGuests((previous) => [
      ...fresh,
      ...previous,
    ]);

    setBulk("");

    const duplicateCount =
      items.length - fresh.length;

    say(
      duplicateCount > 0
        ? `${fresh.length} tamu ditambahkan · ${duplicateCount} duplikat dilewati`
        : `${fresh.length} tamu ditambahkan`
    );
  };

  const startEdit = (guest: Guest) => {
    setEditingId(guest.id);
    setEditName(guest.name);
    setEditPhone(guest.phone);
  };

  const saveEdit = () => {
    if (!editName.trim() || !editingId) {
      return;
    }

    setGuests((previous) =>
      previous.map((guest) =>
        guest.id === editingId
          ? {
              ...guest,
              name: editName.trim(),
              phone: editPhone.trim(),
            }
          : guest
      )
    );

    setEditingId(null);
    setEditName("");
    setEditPhone("");

    say("Perubahan disimpan");
  };

  const removeGuest = (guest: Guest) => {
    setGuests((previous) =>
      previous.filter(
        (item) => item.id !== guest.id
      )
    );

    say(`${guest.name} dihapus`);
  };

  /* ---------- link tamu ---------- */

  const copyLink = async (guest: Guest) => {
    const link = guestLink(
      guest.name,
      invitationSlug
    );

    await copyText(link);

    say(`Link untuk ${guest.name} tersalin`);
  };

  const shareWa = (guest: Guest) => {
    const link = guestLink(
      guest.name,
      invitationSlug
    );

    const message = fillTemplate(
      template,
      guest.name,
      link
    );

    const whatsappUrl = waShareLink(
      guest.phone,
      message
    );

    window.open(
      whatsappUrl,
      "_blank",
      "noopener,noreferrer"
    );
  };

  const copyAllLinks = async () => {
    if (filtered.length === 0) {
      return;
    }

    const links = filtered
      .map((guest) =>
        guestLink(
          guest.name,
          invitationSlug
        )
      )
      .join("\n");

    await copyText(links);

    say(
      `${filtered.length} link tersalin ke clipboard`
    );
  };

  /* ---------- import JSON ---------- */

  const onImportFile = (
    event: ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    const reader = new FileReader();

    reader.onload = () => {
      try {
        const parsed: unknown = JSON.parse(
          String(reader.result)
        );

        if (!Array.isArray(parsed)) {
          throw new Error("format salah");
        }

        const items = parsed.filter(
          (
            item
          ): item is {
            name: string;
            phone?: string;
          } =>
            Boolean(
              item &&
                typeof item === "object" &&
                "name" in item &&
                typeof item.name === "string" &&
                item.name.trim().length > 0
            )
        );

        const existing = new Set(
          guests.map(
            (guest) =>
              `${guest.name}||${guest.phone}`
          )
        );

        const fresh = items
          .filter((item) => {
            const phone = item.phone || "";

            return !existing.has(
              `${item.name}||${phone}`
            );
          })
          .map((item) => ({
            id: makeId(),
            name: item.name.trim(),
            phone: item.phone || "",
          }));

        setGuests((previous) => [
          ...fresh,
          ...previous,
        ]);

        say(
          `${fresh.length} tamu dipulihkan dari cadangan`
        );
      } catch {
        say("File cadangan tidak valid");
      }

      if (fileRef.current) {
        fileRef.current.value = "";
      }
    };

    reader.readAsText(file);
  };

  const previewGuest =
    filtered[0] ?? guests[0];

  const previewMsg = previewGuest
    ? fillTemplate(
        template,
        previewGuest.name,
        guestLink(
          previewGuest.name,
          invitationSlug
        )
      )
    : fillTemplate(
        template,
        "Bapak/Ibu Contoh",
        guestLink(
          "Contoh",
          invitationSlug
        )
      );

  return (
    <div className="relative min-h-screen overflow-x-clip bg-pine-950 font-sans text-ivory">
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0"
        style={{
          background:
            "radial-gradient(55% 40% at 85% -5%, rgba(200,169,97,0.09), transparent 65%), radial-gradient(60% 45% at -10% 35%, rgba(32,71,52,0.5), transparent 60%)",
        }}
      />

      <Petals count={8} />

      <div className="relative mx-auto max-w-5xl px-5 py-10 sm:px-8">
        {/* Header */}
        <header className="flex flex-wrap items-center justify-between gap-5 border-b border-gold-500/15 pb-7">
          <div className="flex items-center gap-4">
            <Monogram className="size-14 text-gold-400" />

            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.38em] text-gold-400">
                Panel Pengelola
              </p>

              <h1 className="mt-1 font-display text-3xl font-light italic text-ivory">
                Daftar Tamu Undangan
              </h1>
            </div>
          </div>

          <a
            href="#/"
            className="inline-flex items-center gap-2.5 border border-gold-500/40 px-5 py-2.5 text-[11px] font-bold uppercase tracking-[0.22em] text-gold-300 transition-all duration-300 hover:bg-gold-500 hover:text-pine-950"
          >
            <IconArrowLeft className="size-4" />
            Lihat Undangan
          </a>
        </header>

        {/* Statistik */}
        <div className="mt-8 flex flex-wrap items-center gap-x-10 gap-y-4 border border-gold-500/15 bg-pine-800/50 px-6 py-5">
          <div className="flex items-center gap-3.5">
            <IconUsers className="size-7 text-gold-400" />

            <div>
              <p
                key={guests.length}
                className="tick font-display text-3xl text-gold-200"
              >
                {guests.length.toLocaleString(
                  "id-ID"
                )}
              </p>

              <p className="text-[10px] uppercase tracking-[0.28em] text-sage-300/70">
                Total Tamu
              </p>
            </div>
          </div>

          <span
            className="hidden h-10 w-px bg-gold-500/20 sm:block"
            aria-hidden="true"
          />

          <div>
            <p className="font-display text-3xl text-gold-200">
              {withPhone.toLocaleString("id-ID")}
            </p>

            <p className="text-[10px] uppercase tracking-[0.28em] text-sage-300/70">
              Dengan No. WhatsApp
            </p>
          </div>

          <span
            className="hidden h-10 w-px bg-gold-500/20 sm:block"
            aria-hidden="true"
          />

          <div className="min-w-0 flex-1">
            <p className="flex items-center gap-2 truncate text-[13px] text-sage-300/80">
              <IconLink className="size-4 shrink-0 text-gold-400" />

              <span className="truncate">
                {invitationUrl}/?to=NamaTamu
              </span>
            </p>

            <p className="mt-1 text-[10px] uppercase tracking-[0.28em] text-sage-300/70">
              Pola Link Pribadi
            </p>
          </div>
        </div>

        {/* URL Undangan Personal */}
        <div className="mt-6 border-2 border-gold-500/40 bg-gradient-to-r from-pine-800/80 to-pine-900/80 p-6">
          <div className="flex items-start gap-4">
            <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-gold-500/20">
              <IconLink className="size-6 text-gold-400" />
            </div>

            <div className="flex-1">
              <p className="text-[10px] font-bold uppercase tracking-[0.32em] text-gold-400">
                URL Undangan Personal Anda
              </p>

              <p className="mt-1 text-sm text-sage-300/80">
                Link ini akan otomatis ditambahkan ke setiap undangan tamu
              </p>

              <div className="mt-3 flex items-center gap-2">
                <code className="flex-1 truncate rounded-[3px] bg-pine-950/80 px-4 py-2.5 font-mono text-sm text-gold-200">
                  {invitationUrl}
                </code>

                <button
                  type="button"
                  onClick={() => {
                    void copyText(invitationUrl);
                    say(
                      "URL undangan personal disalin!"
                    );
                  }}
                  className="shrink-0 rounded-[3px] bg-gold-500 px-4 py-2.5 text-[10px] font-bold uppercase tracking-[0.18em] text-pine-950 transition-all hover:bg-gold-400"
                >
                  Salin
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Cara pakai */}
        <ol className="mt-6 grid gap-3 border border-gold-500/15 bg-pine-900/40 p-6 text-[13px] leading-relaxed text-sage-300/90 sm:grid-cols-2">
          {[
            "Tempel daftar nama satu nama per baris. Nomor HP opsional dipisah tanda | lalu klik Tambahkan.",
            "Setiap tamu otomatis mendapat link pribadi — salin atau kirim langsung via WhatsApp.",
            "Atur template pesan; {nama} dan {link} akan terisi otomatis untuk tiap tamu.",
            "Ekspor CSV/TXT untuk alat broadcast, atau cadangkan JSON agar data aman.",
          ].map((step, index) => (
            <li
              key={index}
              className="flex gap-3.5"
            >
              <span className="flex size-6 shrink-0 items-center justify-center rounded-full border border-gold-500/50 font-display text-xs italic text-gold-300">
                {index + 1}
              </span>

              {step}
            </li>
          ))}
        </ol>

        {/* Template pesan */}
        <section className="mt-12">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.35em] text-gold-400">
                Langkah 3
              </p>

              <h2 className="mt-1.5 font-display text-2xl font-light italic text-ivory">
                Template Pesan WhatsApp
              </h2>
            </div>

            <button
              type="button"
              onClick={() => {
                setTemplate(DEFAULT_TEMPLATE);
                say(
                  "Template dikembalikan ke bawaan"
                );
              }}
              className="border border-gold-500/30 px-4 py-2 text-[10px] font-bold uppercase tracking-[0.22em] text-gold-300 transition-colors hover:bg-gold-500 hover:text-pine-950"
            >
              Kembalikan Bawaan
            </button>
          </div>

          <div className="mt-5 grid gap-4 lg:grid-cols-2">
            <div>
              <textarea
                value={template}
                onChange={(event) =>
                  setTemplate(event.target.value)
                }
                rows={12}
                className={`${inputCls} resize-y font-mono text-[12.5px] leading-relaxed`}
                aria-label="Template pesan WhatsApp"
              />

              <p className="mt-2.5 text-xs text-sage-300/70">
                Gunakan{" "}
                <code className="text-gold-300">
                  {"{nama}"}
                </code>{" "}
                dan{" "}
                <code className="text-gold-300">
                  {"{link}"}
                </code>{" "}
                — keduanya terisi otomatis. Tersimpan otomatis di perangkat ini.
              </p>
            </div>

            <div className="border border-gold-500/20 bg-pine-800/50 p-5">
              <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-gold-400">
                Pratinjau{" "}
                {previewGuest
                  ? `· ${previewGuest.name}`
                  : "· contoh"}
              </p>

              <p className="mt-3 max-h-64 overflow-y-auto whitespace-pre-line text-[13px] leading-relaxed text-sage-300/95">
                {previewMsg}
              </p>
            </div>
          </div>
        </section>

        {/* Tambah massal */}
        <section className="mt-12">
          <p className="text-[11px] font-bold uppercase tracking-[0.35em] text-gold-400">
            Langkah 1
          </p>

          <h2 className="mt-1.5 font-display text-2xl font-light italic text-ivory">
            Tambahkan Tamu Massal
          </h2>

          <div className="mt-5 border border-gold-500/20 bg-pine-800/50 p-5 sm:p-6">
            <textarea
              value={bulk}
              onChange={(event) =>
                setBulk(event.target.value)
              }
              rows={8}
              placeholder={
                "Bapak H. Ahmad Fauzi beserta keluarga\nIbu Siti Aminah | 081234567890\nKeluarga Besar Wijaya\nBudi Santoso & Istri | 081987654321"
              }
              className={`${inputCls} resize-y font-mono text-[12.5px]`}
              aria-label="Tempel daftar nama tamu"
            />

            <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
              <p className="text-xs text-sage-300/70">
                {parsedCount > 0 ? (
                  <span className="text-gold-300">
                    {parsedCount} baris terbaca — siap ditambahkan
                  </span>
                ) : (
                  "Satu nama per baris · nomor HP opsional dipisah | · duplikat otomatis dilewati"
                )}
              </p>

              <button
                type="button"
                onClick={addBulk}
                disabled={parsedCount === 0}
                className="bg-gold-500 px-6 py-3 text-[11px] font-extrabold uppercase tracking-[0.22em] text-pine-950 shadow-[0_8px_24px_rgba(200,169,97,0.25)] transition-all duration-300 hover:-translate-y-0.5 hover:bg-gold-400 disabled:cursor-not-allowed disabled:opacity-35 disabled:hover:translate-y-0"
              >
                Tambahkan{" "}
                {parsedCount > 0
                  ? `${parsedCount} Tamu`
                  : ""}
              </button>
            </div>
          </div>
        </section>

        {/* Daftar tamu */}
        <section className="mt-12">
          <p className="text-[11px] font-bold uppercase tracking-[0.35em] text-gold-400">
            Langkah 2
          </p>

          <h2 className="mt-1.5 font-display text-2xl font-light italic text-ivory">
            Daftar Tamu{" "}
            <span className="text-lg text-gold-300/80">
              ({filtered.length.toLocaleString("id-ID")})
            </span>
          </h2>

          {/* Toolbar */}
          <div className="mt-5 flex flex-col gap-3 border border-gold-500/20 bg-pine-800/50 p-4 lg:flex-row lg:items-center">
            <div className="relative flex-1">
              <IconSearch className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-sage-300/50" />

              <input
                value={query}
                onChange={(event) => {
                  setQuery(event.target.value);
                  setVisible(PAGE);
                }}
                placeholder="Cari nama atau nomor…"
                className={`${inputCls} pl-11`}
                aria-label="Cari tamu"
              />
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => {
                  void copyAllLinks();
                }}
                disabled={filtered.length === 0}
                className="inline-flex items-center gap-2 bg-gold-500 px-4 py-2.5 text-[10px] font-extrabold uppercase tracking-[0.18em] text-pine-950 transition-all hover:bg-gold-400 disabled:opacity-35"
              >
                <IconCopy className="size-3.5" />
                Salin Semua Link
              </button>

              <button
                type="button"
                onClick={() => {
                  downloadFile(
                    "daftar-tamu.csv",
                    toCsv(
                      filtered,
                      invitationSlug
                    ),
                    "text/csv"
                  );

                  say("CSV diunduh");
                }}
                disabled={filtered.length === 0}
                className="inline-flex items-center gap-2 border border-gold-500/30 px-4 py-2.5 text-[10px] font-bold uppercase tracking-[0.18em] text-gold-300 transition-colors hover:bg-gold-500 hover:text-pine-950 disabled:opacity-35"
              >
                <IconDownload className="size-3.5" />
                CSV
              </button>

              <button
                type="button"
                onClick={() => {
                  downloadFile(
                    "link-undangan.txt",
                    toLinksTxt(
                      filtered,
                      invitationSlug
                    ),
                    "text/plain"
                  );

                  say("TXT diunduh");
                }}
                disabled={filtered.length === 0}
                className="inline-flex items-center gap-2 border border-gold-500/30 px-4 py-2.5 text-[10px] font-bold uppercase tracking-[0.18em] text-gold-300 transition-colors hover:bg-gold-500 hover:text-pine-950 disabled:opacity-35"
              >
                <IconDownload className="size-3.5" />
                TXT
              </button>

              <button
                type="button"
                onClick={() => {
                  downloadFile(
                    "cadangan-tamu.json",
                    JSON.stringify(
                      guests,
                      null,
                      2
                    ),
                    "application/json"
                  );

                  say(
                    "Cadangan JSON diunduh"
                  );
                }}
                disabled={guests.length === 0}
                className="inline-flex items-center gap-2 border border-gold-500/30 px-4 py-2.5 text-[10px] font-bold uppercase tracking-[0.18em] text-gold-300 transition-colors hover:bg-gold-500 hover:text-pine-950 disabled:opacity-35"
              >
                <IconDownload className="size-3.5" />
                JSON
              </button>

              <button
                type="button"
                onClick={() =>
                  fileRef.current?.click()
                }
                className="inline-flex items-center gap-2 border border-gold-500/30 px-4 py-2.5 text-[10px] font-bold uppercase tracking-[0.18em] text-gold-300 transition-colors hover:bg-gold-500 hover:text-pine-950"
              >
                <IconUpload className="size-3.5" />
                Pulihkan
              </button>

              <input
                ref={fileRef}
                type="file"
                accept=".json,application/json"
                className="hidden"
                onChange={onImportFile}
              />

              {confirmClear ? (
                <span className="inline-flex items-center gap-2 border border-rose-400/40 px-3 py-1.5">
                  <span className="text-[10px] font-bold uppercase text-rose-300">
                    Yakin?
                  </span>

                  <button
                    type="button"
                    onClick={() => {
                      setGuests([]);
                      setConfirmClear(false);
                      say("Semua tamu dihapus");
                    }}
                    className="bg-rose-400 px-3 py-1 text-[10px] font-extrabold uppercase text-pine-950 hover:bg-rose-300"
                  >
                    Ya
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      setConfirmClear(false)
                    }
                    className="px-2 py-1 text-[10px] font-bold uppercase text-sage-300 hover:text-ivory"
                  >
                    Batal
                  </button>
                </span>
              ) : (
                <button
                  type="button"
                  onClick={() =>
                    setConfirmClear(true)
                  }
                  disabled={guests.length === 0}
                  className="inline-flex items-center gap-2 border border-rose-400/30 px-4 py-2.5 text-[10px] font-bold uppercase tracking-[0.18em] text-rose-300/90 transition-colors hover:bg-rose-400 hover:text-pine-950 disabled:opacity-35"
                >
                  <IconTrash className="size-3.5" />
                  Hapus Semua
                </button>
              )}
            </div>
          </div>

          {/* Kondisi kosong */}
          {guests.length === 0 ? (
            <div className="mt-4 border border-dashed border-gold-500/25 px-6 py-16 text-center">
              <IconUsers className="mx-auto size-10 text-gold-500/50" />

              <p className="mt-4 font-display text-xl italic text-sage-300/90">
                Belum ada tamu terdaftar
              </p>

              <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-sage-300/60">
                Tempel 1.000 nama sekaligus di kotak Tambahkan Tamu di atas — link pribadi akan dibuat otomatis untuk setiap nama.
              </p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="mt-4 border border-dashed border-gold-500/25 px-6 py-12 text-center">
              <p className="font-display text-lg italic text-sage-300/80">
                Tidak ada hasil untuk “{query}”
              </p>
            </div>
          ) : (
            <>
              <ul className="mt-4 space-y-2">
                {shown.map((guest, index) =>
                  editingId === guest.id ? (
                    <li
                      key={guest.id}
                      className="border border-gold-500/40 bg-pine-800/80 p-4"
                    >
                      <div className="flex flex-col gap-2.5 sm:flex-row">
                        <input
                          value={editName}
                          onChange={(event) =>
                            setEditName(
                              event.target.value
                            )
                          }
                          className={`${inputCls} flex-1`}
                          aria-label="Nama tamu"
                          autoFocus
                        />

                        <input
                          value={editPhone}
                          onChange={(event) =>
                            setEditPhone(
                              event.target.value
                            )
                          }
                          placeholder="No HP opsional"
                          className={`${inputCls} sm:w-48`}
                          aria-label="Nomor HP tamu"
                        />

                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={saveEdit}
                            className="inline-flex items-center gap-2 bg-gold-500 px-5 py-2.5 text-[10px] font-extrabold uppercase tracking-[0.18em] text-pine-950 hover:bg-gold-400"
                          >
                            <IconCheck className="size-4" />
                            Simpan
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setEditingId(null);
                              setEditName("");
                              setEditPhone("");
                            }}
                            className="border border-gold-500/30 px-4 py-2.5 text-[10px] font-bold uppercase tracking-[0.18em] text-sage-300 hover:text-ivory"
                          >
                            Batal
                          </button>
                        </div>
                      </div>
                    </li>
                  ) : (
                    <li
                      key={guest.id}
                      className="group grid grid-cols-[auto_1fr] items-center gap-x-4 gap-y-2.5 border border-gold-500/12 bg-pine-800/40 px-4 py-3 transition-all duration-300 hover:border-gold-500/40 hover:bg-pine-800/70 sm:grid-cols-[3.2rem_1fr_auto]"
                    >
                      <span className="flex size-8 items-center justify-center rounded-full border border-gold-500/25 font-display text-xs italic text-gold-400/90">
                        {index + 1}
                      </span>

                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-ivory">
                          {guest.name}
                        </p>

                        <p className="truncate text-xs text-sage-300/60">
                          {guest.phone
                            ? `+${normalizePhone(
                                guest.phone
                              )}`
                            : "tanpa nomor — link tetap bisa disalin & dikirim manual"}
                        </p>
                      </div>

                      <div className="col-span-2 flex justify-start gap-1.5 sm:col-span-1 sm:justify-end">
                        <RowBtn
                          label="Kirim via WhatsApp"
                          onClick={() =>
                            shareWa(guest)
                          }
                          tone="border-emerald-400/30 text-emerald-300 hover:bg-emerald-400 hover:text-pine-950"
                        >
                          <IconChat className="size-4" />
                        </RowBtn>

                        <RowBtn
                          label="Salin link undangan"
                          onClick={() =>
                            void copyLink(guest)
                          }
                          tone="border-gold-500/35 text-gold-300 hover:bg-gold-500 hover:text-pine-950"
                        >
                          <IconLink className="size-4" />
                        </RowBtn>

                        <RowBtn
                          label="Ubah"
                          onClick={() =>
                            startEdit(guest)
                          }
                          tone="border-gold-500/20 text-sage-300 hover:bg-pine-700 hover:text-gold-200"
                        >
                          <IconPencil className="size-4" />
                        </RowBtn>

                        <RowBtn
                          label="Hapus"
                          onClick={() =>
                            removeGuest(guest)
                          }
                          tone="border-rose-400/25 text-rose-300/90 hover:bg-rose-400 hover:text-pine-950"
                        >
                          <IconTrash className="size-4" />
                        </RowBtn>
                      </div>
                    </li>
                  )
                )}
              </ul>

              {visible < filtered.length && (
                <div className="mt-5 text-center">
                  <button
                    type="button"
                    onClick={() =>
                      setVisible(
                        (current) => current + 100
                      )
                    }
                    className="border border-gold-500/35 px-7 py-3 text-[11px] font-bold uppercase tracking-[0.22em] text-gold-300 transition-all hover:bg-gold-500 hover:text-pine-950"
                  >
                    Tampilkan Lebih Banyak (
                    {(
                      filtered.length - visible
                    ).toLocaleString("id-ID")}{" "}
                    lagi)
                  </button>
                </div>
              )}
            </>
          )}
        </section>

        {/* Footer */}
        <footer className="mt-14 border-t border-gold-500/15 pt-7 text-center">
          <p className="text-xs leading-relaxed text-sage-300/60">
            Daftar tamu tersimpan di peramban perangkat ini — rutin unduh cadangan JSON.
            <br />
            Bagikan tiap tamu link pribadinya agar namanya tampil di sampul undangan.
          </p>

          <a
            href="#/"
            className="mt-4 inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.22em] text-gold-400 transition-colors hover:text-gold-200"
          >
            <IconArrowLeft className="size-4" />
            Kembali ke undangan
          </a>
        </footer>
      </div>

      {/* Toast */}
      {toast && (
        <div
          role="status"
          className="fixed bottom-6 left-1/2 z-[95] flex -translate-x-1/2 items-center gap-2.5 whitespace-nowrap bg-gold-500 px-6 py-3.5 text-xs font-extrabold uppercase tracking-[0.18em] text-pine-950 shadow-[0_16px_44px_rgba(200,169,97,0.4)] animate-[tick-pop_0.5s_cubic-bezier(0.16,1,0.3,1)]"
        >
          <IconCheck className="size-4" />
          {toast}
        </div>
      )}
    </div>
  );
}
