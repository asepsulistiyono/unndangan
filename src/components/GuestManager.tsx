import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  downloadFile,
  fillTemplate,
  guestLink,
  parseBulk,
  toCsv,
  toLinksTxt,
  type Guest,
  waShareLink,
} from "../lib/guests";

import {
  deleteAllGuests,
  deleteGuest,
  fetchGuestTemplate,
  fetchGuests,
  insertGuests,
  saveGuestTemplate,
  updateGuest,
} from "../lib/guestService";

type GuestManagerProps = {
  invitationSlug?: string;
};

export default function GuestManager({
  invitationSlug,
}: GuestManagerProps) {
  const [guests, setGuests] = useState<Guest[]>(
    [],
  );

  const [bulk, setBulk] = useState("");
  const [query, setQuery] = useState("");
  const [template, setTemplate] = useState("");
  const [templateLoaded, setTemplateLoaded] =
    useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [editingId, setEditingId] =
    useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editPhone, setEditPhone] = useState("");

  const [confirmClear, setConfirmClear] =
    useState(false);

  const [notice, setNotice] = useState("");

  function say(message: string) {
    setNotice(message);

    window.setTimeout(() => {
      setNotice((current) =>
        current === message ? "" : current,
      );
    }, 3500);
  }

  /*
   * Memuat data dari Supabase.
   * fetchGuests juga menangani migrasi data lama
   * dari localStorage.
   */
  useEffect(() => {
    let active = true;

    async function loadRemoteData() {
      try {
        const [
          remoteGuests,
          remoteTemplate,
        ] = await Promise.all([
          fetchGuests(),
          fetchGuestTemplate(),
        ]);

        if (!active) {
          return;
        }

        setGuests(remoteGuests);
        setTemplate(remoteTemplate);
        setTemplateLoaded(true);
      } catch (error) {
        console.error(
          "Gagal memuat data tamu:",
          error,
        );

        if (active) {
          say(
            "Data tamu gagal dimuat. Pastikan Anda sudah login.",
          );
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void loadRemoteData();

    return () => {
      active = false;
    };
  }, []);

  /*
   * Menyimpan template ke Supabase dengan jeda 500ms
   * agar tidak menyimpan pada setiap ketikan.
   */
  useEffect(() => {
    if (!templateLoaded) {
      return;
    }

    const timer = window.setTimeout(() => {
      void saveGuestTemplate(template).catch(
        (error) => {
          console.error(
            "Gagal menyimpan template:",
            error,
          );

          say("Template gagal disimpan");
        },
      );
    }, 500);

    return () => {
      window.clearTimeout(timer);
    };
  }, [template, templateLoaded]);

  const filteredGuests = useMemo(() => {
    const normalizedQuery =
      query.trim().toLowerCase();

    if (!normalizedQuery) {
      return guests;
    }

    return guests.filter((guest) => {
      return (
        guest.name
          .toLowerCase()
          .includes(normalizedQuery) ||
        guest.phone
          .toLowerCase()
          .includes(normalizedQuery)
      );
    });
  }, [guests, query]);

  async function addBulk() {
    const items = parseBulk(bulk);

    if (items.length === 0) {
      say(
        "Tidak ada nama yang terbaca. Gunakan satu tamu per baris.",
      );
      return;
    }

    const existing = new Set(
      guests.map(
        (guest) =>
          `${guest.name.trim().toLowerCase()}||${guest.phone.trim()}`,
      ),
    );

    const seen = new Set(existing);

    const fresh = items.filter((item) => {
      const key = `${item.name
        .trim()
        .toLowerCase()}||${item.phone.trim()}`;

      if (seen.has(key)) {
        return false;
      }

      seen.add(key);
      return true;
    });

    if (fresh.length === 0) {
      say("Semua tamu sudah terdaftar.");
      return;
    }

    setSaving(true);

    try {
      const inserted = await insertGuests(fresh);

      setGuests((previous) => [
        ...inserted,
        ...previous,
      ]);

      setBulk("");

      const duplicateCount =
        items.length - inserted.length;

      if (duplicateCount > 0) {
        say(
          `${inserted.length} tamu ditambahkan. ${duplicateCount} duplikat dilewati.`,
        );
      } else {
        say(
          `${inserted.length} tamu berhasil ditambahkan.`,
        );
      }
    } catch (error) {
      console.error(
        "Gagal menambahkan tamu:",
        error,
      );

      say("Tamu gagal disimpan ke server.");
    } finally {
      setSaving(false);
    }
  }

  function startEdit(guest: Guest) {
    setEditingId(guest.id);
    setEditName(guest.name);
    setEditPhone(guest.phone);
  }

  function cancelEdit() {
    setEditingId(null);
    setEditName("");
    setEditPhone("");
  }

  async function saveEdit() {
    if (!editingId) {
      return;
    }

    if (!editName.trim()) {
      say("Nama tamu tidak boleh kosong.");
      return;
    }

    setSaving(true);

    try {
      const updated = await updateGuest({
        id: editingId,
        name: editName,
        phone: editPhone,
      });

      setGuests((previous) =>
        previous.map((guest) =>
          guest.id === updated.id
            ? updated
            : guest,
        ),
      );

      cancelEdit();
      say("Perubahan tamu berhasil disimpan.");
    } catch (error) {
      console.error(
        "Gagal mengubah tamu:",
        error,
      );

      say("Perubahan gagal disimpan.");
    } finally {
      setSaving(false);
    }
  }

  async function removeGuest(guest: Guest) {
    const confirmed = window.confirm(
      `Hapus tamu "${guest.name}"?`,
    );

    if (!confirmed) {
      return;
    }

    try {
      await deleteGuest(guest.id);

      setGuests((previous) =>
        previous.filter(
          (item) => item.id !== guest.id,
        ),
      );

      say(`${guest.name} berhasil dihapus.`);
    } catch (error) {
      console.error(
        "Gagal menghapus tamu:",
        error,
      );

      say("Tamu gagal dihapus.");
    }
  }

  async function removeAllGuests() {
    if (guests.length === 0) {
      return;
    }

    setSaving(true);

    try {
      await deleteAllGuests();

      setGuests([]);
      setConfirmClear(false);
      say("Semua tamu berhasil dihapus.");
    } catch (error) {
      console.error(
        "Gagal menghapus semua tamu:",
        error,
      );

      say("Semua tamu gagal dihapus.");
    } finally {
      setSaving(false);
    }
  }

  function getGuestMessage(guest: Guest) {
    const link = guestLink(
      guest.name,
      invitationSlug,
    );

    return fillTemplate(
      template,
      guest.name,
      link,
    );
  }

  function sendWhatsApp(guest: Guest) {
    const message = getGuestMessage(guest);
    const url = waShareLink(
      guest.phone,
      message,
    );

    window.open(
      url,
      "_blank",
      "noopener,noreferrer",
    );
  }

  function exportCsv() {
    if (guests.length === 0) {
      say("Belum ada data tamu untuk diekspor.");
      return;
    }

    downloadFile(
      "daftar-tamu.csv",
      toCsv(guests, invitationSlug),
      "text/csv",
    );

    say("File CSV berhasil dibuat.");
  }

  function exportLinks() {
    if (guests.length === 0) {
      say("Belum ada data tamu untuk diekspor.");
      return;
    }

    downloadFile(
      "link-undangan.txt",
      toLinksTxt(guests, invitationSlug),
      "text/plain",
    );

    say("File link undangan berhasil dibuat.");
  }

  function copyGuestLink(guest: Guest) {
    const link = guestLink(
      guest.name,
      invitationSlug,
    );

    void navigator.clipboard
      .writeText(link)
      .then(() => {
        say("Link undangan berhasil disalin.");
      })
      .catch(() => {
        say("Link gagal disalin.");
      });
  }

  return (
    <section className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">
      <div className="mb-8">
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-amber-500">
          Guest Manager
        </p>

        <h1 className="mt-2 font-serif text-3xl font-semibold text-slate-100">
          Daftar Tamu Undangan
        </h1>

        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
          Tambahkan tamu, buat link personal, dan
          kirim undangan melalui WhatsApp.
        </p>
      </div>

      {notice ? (
        <div className="mb-6 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">
          {notice}
        </div>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
        <div className="space-y-6">
          <div className="rounded-xl border border-slate-700 bg-slate-900/60 p-5 shadow-xl">
            <div className="mb-4">
              <h2 className="text-lg font-semibold text-slate-100">
                Tambah Banyak Tamu
              </h2>

              <p className="mt-1 text-sm text-slate-400">
                Satu tamu per baris dengan format:
              </p>

              <code className="mt-2 inline-block rounded bg-slate-950 px-2 py-1 text-xs text-amber-300">
                Nama Tamu | Nomor WhatsApp
              </code>
            </div>

            <textarea
              value={bulk}
              onChange={(event) =>
                setBulk(event.target.value)
              }
              placeholder={`Bapak Ahmad | 08123456789
Ibu Siti | 082233445566
Keluarga Budi | 081298765432`}
              rows={7}
              className="w-full resize-y rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-slate-100 outline-none transition placeholder:text-slate-600 focus:border-amber-500"
            />

            <div className="mt-4 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => void addBulk()}
                disabled={saving}
                className="rounded-lg bg-amber-500 px-5 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saving
                  ? "Menyimpan..."
                  : "Tambah Tamu"}
              </button>

              <button
                type="button"
                onClick={() => setBulk("")}
                disabled={!bulk}
                className="rounded-lg border border-slate-700 px-5 py-2.5 text-sm font-medium text-slate-300 transition hover:border-slate-500 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
              >
                Bersihkan
              </button>
            </div>
          </div>

          <div className="rounded-xl border border-slate-700 bg-slate-900/60 p-5 shadow-xl">
            <div className="mb-4">
              <h2 className="text-lg font-semibold text-slate-100">
                Template Pesan WhatsApp
              </h2>

              <p className="mt-1 text-sm text-slate-400">
                Gunakan variabel{" "}
                <code className="text-amber-300">
                  {"{nama}"}
                </code>{" "}
                dan{" "}
                <code className="text-amber-300">
                  {"{link}"}
                </code>
                .
              </p>
            </div>

            <textarea
              value={template}
              onChange={(event) =>
                setTemplate(event.target.value)
              }
              rows={12}
              className="w-full resize-y rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-sm leading-6 text-slate-100 outline-none transition placeholder:text-slate-600 focus:border-amber-500"
            />

            <p className="mt-3 text-xs text-slate-500">
              Template tersimpan otomatis ke Supabase.
            </p>
          </div>
        </div>

        <aside className="space-y-6">
          <div className="rounded-xl border border-slate-700 bg-slate-900/60 p-5 shadow-xl">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm text-slate-400">
                  Total tamu
                </p>

                <p className="mt-1 text-4xl font-bold text-amber-400">
                  {guests.length}
                </p>
              </div>

              <div className="rounded-full bg-amber-500/10 px-4 py-2 text-xs font-medium text-amber-300">
                Tersinkron
              </div>
            </div>

            <div className="mt-5 grid gap-3">
              <button
                type="button"
                onClick={exportCsv}
                className="rounded-lg border border-slate-700 px-4 py-2.5 text-sm font-medium text-slate-200 transition hover:border-amber-500 hover:text-amber-300"
              >
                Download CSV
              </button>

              <button
                type="button"
                onClick={exportLinks}
                className="rounded-lg border border-slate-700 px-4 py-2.5 text-sm font-medium text-slate-200 transition hover:border-amber-500 hover:text-amber-300"
              >
                Download Semua Link
              </button>

              {confirmClear ? (
                <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3">
                  <p className="text-sm text-red-300">
                    Hapus seluruh daftar tamu?
                  </p>

                  <div className="mt-3 flex gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        void removeAllGuests()
                      }
                      disabled={saving}
                      className="rounded-md bg-red-500 px-3 py-2 text-xs font-semibold text-white hover:bg-red-400 disabled:opacity-50"
                    >
                      Ya, Hapus Semua
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        setConfirmClear(false)
                      }
                      className="rounded-md border border-slate-600 px-3 py-2 text-xs text-slate-300"
                    >
                      Batal
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() =>
                    setConfirmClear(true)
                  }
                  disabled={guests.length === 0}
                  className="rounded-lg border border-red-500/30 px-4 py-2.5 text-sm font-medium text-red-300 transition hover:bg-red-500/10 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Hapus Semua Tamu
                </button>
              )}
            </div>
          </div>
        </aside>
      </div>

      <div className="mt-8 rounded-xl border border-slate-700 bg-slate-900/60 shadow-xl">
        <div className="flex flex-col gap-4 border-b border-slate-700 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-100">
              Daftar Tamu
            </h2>

            <p className="mt-1 text-sm text-slate-400">
              {filteredGuests.length} dari{" "}
              {guests.length} tamu ditampilkan
            </p>
          </div>

          <input
            type="search"
            value={query}
            onChange={(event) =>
              setQuery(event.target.value)
            }
            placeholder="Cari nama atau nomor..."
            className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-2.5 text-sm text-slate-100 outline-none focus:border-amber-500 sm:max-w-xs"
          />
        </div>

        {loading ? (
          <div className="px-6 py-16 text-center">
            <div className="mx-auto size-8 animate-spin rounded-full border-2 border-slate-700 border-t-amber-400" />

            <p className="mt-4 text-sm text-slate-400">
              Memuat daftar tamu...
            </p>
          </div>
        ) : filteredGuests.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <p className="text-lg text-slate-300">
              {guests.length === 0
                ? "Belum ada tamu."
                : "Tamu tidak ditemukan."}
            </p>

            <p className="mt-2 text-sm text-slate-500">
              {guests.length === 0
                ? "Tambahkan tamu menggunakan form di atas."
                : "Coba gunakan kata pencarian lain."}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-800">
            {filteredGuests.map((guest, index) => {
              const link = guestLink(
                guest.name,
                invitationSlug,
              );

              const isEditing =
                editingId === guest.id;

              return (
                <div
                  key={guest.id}
                  className="p-5 transition hover:bg-slate-800/30"
                >
                  {isEditing ? (
                    <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_220px_auto]">
                      <input
                        value={editName}
                        onChange={(event) =>
                          setEditName(
                            event.target.value,
                          )
                        }
                        placeholder="Nama tamu"
                        className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-slate-100 outline-none focus:border-amber-500"
                      />

                      <input
                        value={editPhone}
                        onChange={(event) =>
                          setEditPhone(
                            event.target.value,
                          )
                        }
                        placeholder="Nomor WhatsApp"
                        className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-slate-100 outline-none focus:border-amber-500"
                      />

                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            void saveEdit()
                          }
                          disabled={saving}
                          className="rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-emerald-400 disabled:opacity-50"
                        >
                          Simpan
                        </button>

                        <button
                          type="button"
                          onClick={cancelEdit}
                          className="rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-300 hover:border-slate-500"
                        >
                          Batal
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                      <div className="flex min-w-0 items-start gap-4">
                        <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-amber-500/10 text-sm font-semibold text-amber-300">
                          {index + 1}
                        </div>

                        <div className="min-w-0">
                          <h3 className="truncate font-medium text-slate-100">
                            {guest.name}
                          </h3>

                          <p className="mt-1 text-sm text-slate-400">
                            {guest.phone || "Nomor belum diisi"}
                          </p>

                          <a
                            href={link}
                            target="_blank"
                            rel="noreferrer"
                            className="mt-2 block max-w-xl truncate text-xs text-amber-400 hover:text-amber-300"
                          >
                            {link}
                          </a>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2 lg:justify-end">
                        <button
                          type="button"
                          onClick={() =>
                            sendWhatsApp(guest)
                          }
                          className="rounded-lg bg-emerald-500 px-3 py-2 text-xs font-semibold text-slate-950 hover:bg-emerald-400"
                        >
                          WhatsApp
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            copyGuestLink(guest)
                          }
                          className="rounded-lg border border-slate-700 px-3 py-2 text-xs text-slate-300 hover:border-amber-500 hover:text-amber-300"
                        >
                          Salin Link
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            startEdit(guest)
                          }
                          className="rounded-lg border border-slate-700 px-3 py-2 text-xs text-slate-300 hover:border-amber-500 hover:text-amber-300"
                        >
                          Edit
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            void removeGuest(guest)
                          }
                          className="rounded-lg border border-red-500/30 px-3 py-2 text-xs text-red-300 hover:bg-red-500/10"
                        >
                          Hapus
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
