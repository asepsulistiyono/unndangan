import { useState } from "react";

import { useWedding } from "../../lib/WeddingContext";
import {
  signOut,
  type AdminProfile,
} from "../../lib/auth";

import { generateSlug } from "../../lib/slug";

import { Monogram } from "../Decor";
import {
  IconArrowLeft,
  IconCheck,
  IconUsers,
} from "../Icons";

import FieldEditor from "./FieldEditor";
import PhotoUploader from "./PhotoUploader";
import ThemeSelector from "./ThemeSelector";
import OrnamentSelector from "./OrnamentSelector";
import LanguageSelector from "./LanguageSelector";
import ReligiousFormatSelector from "./ReligiousFormatSelector";
import TemplateSelector from "./TemplateSelector";

type Tab =
  | "pengantin"
  | "acara"
  | "kutipan"
  | "kisah"
  | "galeri"
  | "kado"
  | "dresscode"
  | "tema"
  | "ornamen"
  | "bahasa"
  | "agama"
  | "template";

type AdminPanelProps = {
  profile: AdminProfile;
  userName: string | null;
};

export default function AdminPanel({
  profile,
  userName,
}: AdminPanelProps) {
  const {
    mergedData,
    updateData,
    refetch,
  } = useWedding();

  const [tab, setTab] =
    useState<Tab>("pengantin");

  const [saving, setSaving] =
    useState(false);

  const [toast, setToast] =
    useState("");

  const showToast = (message: string) => {
    setToast(message);

    window.setTimeout(() => {
      setToast("");
    }, 2600);
  };

  const handleSave = async (patch: any) => {
    setSaving(true);

    try {
      /**
       * updateData akan menyimpan data berdasarkan user_id.
       * Kolom slug tidak dikirim dari frontend karena
       * slug merupakan generated column di database.
       */
      await updateData(patch);

      /**
       * Ambil data terbaru agar tampilan admin langsung
       * mengikuti data terakhir dari Supabase.
       */
      await refetch();

      showToast("Perubahan tersimpan");
    } catch (err: any) {
      showToast(
        "Gagal menyimpan: " +
          (err?.message || "Terjadi kesalahan")
      );
    } finally {
      setSaving(false);
    }
  };

  const invitationSlug = generateSlug(
    mergedData.groom.short,
    mergedData.bride.short
  );

  const invitationUrl = `${window.location.origin}/#/${invitationSlug}`;

  const tabs: {
    id: Tab;
    label: string;
  }[] = [
    {
      id: "template",
      label: "Template",
    },
    {
      id: "bahasa",
      label: "Bahasa",
    },
    {
      id: "agama",
      label: "Format Agama",
    },
    {
      id: "tema",
      label: "Tema",
    },
    {
      id: "ornamen",
      label: "Ornamen",
    },
    {
      id: "pengantin",
      label: "Pengantin",
    },
    {
      id: "acara",
      label: "Acara",
    },
    {
      id: "kutipan",
      label: "Kutipan",
    },
    {
      id: "kisah",
      label: "Kisah",
    },
    {
      id: "galeri",
      label: "Galeri",
    },
    {
      id: "kado",
      label: "Kado",
    },
    {
      id: "dresscode",
      label: "Dress Code",
    },
  ];

  return (
    <div className="relative min-h-screen bg-pine-950 font-sans text-ivory">
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0"
        style={{
          background:
            "radial-gradient(55% 40% at 85% -5%, rgba(200,169,97,0.09), transparent 65%), radial-gradient(60% 45% at -10% 35%, rgba(32,71,52,0.5), transparent 60%)",
        }}
      />

      <div className="relative mx-auto max-w-5xl px-5 py-8 sm:px-8">
        <header className="flex flex-wrap items-center justify-between gap-5 border-b border-gold-500/15 pb-6">
          <div className="flex items-center gap-4">
            <Monogram className="size-12 text-gold-400 sm:size-14" />

            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.38em] text-gold-400">
                Panel Admin
              </p>

              <h1 className="mt-1 font-display text-2xl font-light italic text-ivory sm:text-3xl">
                Kelola Undangan
              </h1>

              {userName && (
                <p className="mt-1 text-xs text-sage-300/70">
                  Halo,{" "}
                  <span className="font-semibold text-gold-300">
                    {userName}
                  </span>
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <a
              href="#/tamu"
              className="inline-flex items-center gap-2 border border-emerald-400/40 px-4 py-2.5 text-[10px] font-bold uppercase tracking-[0.18em] text-emerald-300 transition-all hover:bg-emerald-400 hover:text-pine-950"
            >
              <IconUsers className="size-4" />
              Kelola Tamu
            </a>

            <a
              href={`#/${invitationSlug}`}
              className="inline-flex items-center gap-2 border border-gold-500/40 px-4 py-2.5 text-[10px] font-bold uppercase tracking-[0.18em] text-gold-300 transition-all hover:bg-gold-500 hover:text-pine-950"
            >
              <IconArrowLeft className="size-4" />
              Lihat Undangan
            </a>

            <button
              type="button"
              onClick={() => signOut()}
              className="border border-rose-400/30 px-4 py-2.5 text-[10px] font-bold uppercase tracking-[0.18em] text-rose-300 transition-colors hover:bg-rose-400 hover:text-pine-950"
            >
              Keluar
            </button>
          </div>
        </header>

        <div className="mt-6 border border-gold-500/25 bg-pine-800/50 p-4">
          <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-gold-400">
            URL Undangan Personal Anda
          </p>

          <div className="mt-2 flex items-center gap-2">
            <code className="flex-1 truncate rounded-[3px] bg-pine-900/80 px-3 py-2 font-mono text-xs text-gold-200">
              {invitationUrl}
            </code>

            <button
              type="button"
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(
                    invitationUrl
                  );

                  showToast(
                    "URL undangan disalin!"
                  );
                } catch {
                  showToast(
                    "Gagal menyalin URL"
                  );
                }
              }}
              className="shrink-0 rounded-[3px] bg-gold-500 px-3 py-2 text-[10px] font-bold uppercase tracking-[0.18em] text-pine-950 transition-all hover:bg-gold-400"
            >
              Salin
            </button>
          </div>

          <p className="mt-2 text-[10px] text-sage-300/60">
            Bagikan URL ini kepada tamu undangan Anda.
            URL dibuat otomatis berdasarkan nama mempelai.
          </p>
        </div>

        <div className="mt-6 flex flex-wrap gap-2 border-b border-gold-500/15 pb-4">
          {tabs.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setTab(item.id)}
              className={`rounded-[3px] px-4 py-2 text-[11px] font-bold uppercase tracking-[0.18em] transition-all ${
                tab === item.id
                  ? "bg-gold-500 text-pine-950"
                  : "border border-gold-500/25 text-gold-300 hover:bg-pine-800"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        <div className="mt-8 space-y-6">
          {tab === "template" && (
            <TemplateSelector />
          )}

          {tab === "bahasa" && (
            <LanguageSelector />
          )}

          {tab === "agama" && (
            <ReligiousFormatSelector />
          )}

          {tab === "tema" && (
            <ThemeSelector />
          )}

          {tab === "ornamen" && (
            <OrnamentSelector />
          )}

          {tab === "pengantin" && (
            <PengantinTab
              mergedData={mergedData}
              onSave={handleSave}
            />
          )}

          {tab === "acara" && (
            <AcaraTab
              mergedData={mergedData}
              onSave={handleSave}
            />
          )}

          {tab === "kutipan" && (
            <KutipanTab
              mergedData={mergedData}
              onSave={handleSave}
            />
          )}

          {tab === "kisah" && (
            <KisahTab
              mergedData={mergedData}
              onSave={handleSave}
            />
          )}

          {tab === "galeri" && (
            <GaleriTab
              mergedData={mergedData}
              onSave={handleSave}
            />
          )}

          {tab === "kado" && (
            <KadoTab
              mergedData={mergedData}
              onSave={handleSave}
            />
          )}

          {tab === "dresscode" && (
            <DressCodeTab
              mergedData={mergedData}
              onSave={handleSave}
            />
          )}
        </div>
      </div>

      {toast && (
        <div
          role="status"
          className="fixed bottom-6 left-1/2 z-[95] flex -translate-x-1/2 items-center gap-2.5 whitespace-nowrap bg-gold-500 px-6 py-3.5 text-xs font-extrabold uppercase tracking-[0.18em] text-pine-950 shadow-[0_16px_44px_rgba(200,169,97,0.4)] animate-[tick-pop_0.5s_cubic-bezier(0.16,1,0.3,1)]"
        >
          <IconCheck className="size-4" />
          {toast}
        </div>
      )}

      {saving && (
        <div className="fixed bottom-6 right-6 z-[94] rounded-[3px] border border-gold-500/30 bg-pine-900 px-4 py-2 text-[10px] font-bold uppercase tracking-[0.18em] text-gold-300">
          Menyimpan...
        </div>
      )}
    </div>
  );
}

/* ============================================================
   TAB: PENGANTIN
============================================================ */

function PengantinTab({
  mergedData,
  onSave,
}: any) {
  return (
    <div className="space-y-8">
      <div>
        <h2 className="font-display text-2xl font-light italic text-ivory">
          Mempelai Pria
        </h2>

        <div className="mt-5 space-y-5">
          <FieldEditor
            label="Nama Panggilan"
            value={mergedData.groom.short}
            onChange={(value) =>
              onSave({
                groom: {
                  ...mergedData.groom,
                  short: value,
                },
              })
            }
          />

          <FieldEditor
            label="Nama Lengkap"
            value={mergedData.groom.full}
            onChange={(value) =>
              onSave({
                groom: {
                  ...mergedData.groom,
                  full: value,
                },
              })
            }
          />

          <FieldEditor
            label="Orang Tua"
            value={mergedData.groom.parents}
            onChange={(value) =>
              onSave({
                groom: {
                  ...mergedData.groom,
                  parents: value,
                },
              })
            }
            multiline
          />

          <FieldEditor
            label="Instagram (tanpa @)"
            value={mergedData.groom.ig}
            onChange={(value) =>
              onSave({
                groom: {
                  ...mergedData.groom,
                  ig: value,
                },
              })
            }
          />

          <FieldEditor
            label="Bio"
            value={mergedData.groom.bio}
            onChange={(value) =>
              onSave({
                groom: {
                  ...mergedData.groom,
                  bio: value,
                },
              })
            }
            multiline
          />

          <PhotoUploader
            label="Foto Mempelai Pria"
            currentUrl={mergedData.photos?.groom}
            onUpload={(url) =>
              onSave({
                photos: {
                  ...mergedData.photos,
                  groom: url,
                },
              })
            }
            preset="portrait"
            description="Ukuran ideal: 3:4, kompresi otomatis ke WebP"
          />
        </div>
      </div>

      <div className="border-t border-gold-500/15 pt-8">
        <h2 className="font-display text-2xl font-light italic text-ivory">
          Mempelai Wanita
        </h2>

        <div className="mt-5 space-y-5">
          <FieldEditor
            label="Nama Panggilan"
            value={mergedData.bride.short}
            onChange={(value) =>
              onSave({
                bride: {
                  ...mergedData.bride,
                  short: value,
                },
              })
            }
          />

          <FieldEditor
            label="Nama Lengkap"
            value={mergedData.bride.full}
            onChange={(value) =>
              onSave({
                bride: {
                  ...mergedData.bride,
                  full: value,
                },
              })
            }
          />

          <FieldEditor
            label="Orang Tua"
            value={mergedData.bride.parents}
            onChange={(value) =>
              onSave({
                bride: {
                  ...mergedData.bride,
                  parents: value,
                },
              })
            }
            multiline
          />

          <FieldEditor
            label="Instagram (tanpa @)"
            value={mergedData.bride.ig}
            onChange={(value) =>
              onSave({
                bride: {
                  ...mergedData.bride,
                  ig: value,
                },
              })
            }
          />

          <FieldEditor
            label="Bio"
            value={mergedData.bride.bio}
            onChange={(value) =>
              onSave({
                bride: {
                  ...mergedData.bride,
                  bio: value,
                },
              })
            }
            multiline
          />

          <PhotoUploader
            label="Foto Mempelai Wanita"
            currentUrl={mergedData.photos?.bride}
            onUpload={(url) =>
              onSave({
                photos: {
                  ...mergedData.photos,
                  bride: url,
                },
              })
            }
            preset="portrait"
            description="Ukuran ideal: 3:4, kompresi otomatis ke WebP"
          />
        </div>
      </div>

      <div className="border-t border-gold-500/15 pt-8">
        <h2 className="font-display text-2xl font-light italic text-ivory">
          Informasi Umum
        </h2>

        <div className="mt-5 space-y-5">
          <FieldEditor
            label="Inisial (untuk logo)"
            value={mergedData.initials}
            onChange={(value) =>
              onSave({
                initials: value,
              })
            }
            description="Contoh: R·S"
          />

          <PhotoUploader
            label="Foto Hero (Sampul)"
            currentUrl={mergedData.photos?.hero}
            onUpload={(url) =>
              onSave({
                photos: {
                  ...mergedData.photos,
                  hero: url,
                },
              })
            }
            preset="hero"
            description="Foto prewedding utama, ukuran ideal: 16:9 atau 4:3"
          />
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   TAB: ACARA
============================================================ */

function AcaraTab({
  mergedData,
  onSave,
}: any) {
  return (
    <div className="space-y-8">
      <div>
        <h2 className="font-display text-2xl font-light italic text-ivory">
          Tanggal & Lokasi
        </h2>

        <div className="mt-5 space-y-5">
          <FieldEditor
            label="Tanggal (tampilan)"
            value={mergedData.dateLabel}
            onChange={(value) =>
              onSave({
                dateLabel: value,
              })
            }
            description="Contoh: Sabtu, 12 Juni 2027"
          />

          <FieldEditor
            label="Tanggal (singkat)"
            value={mergedData.dateShort}
            onChange={(value) =>
              onSave({
                dateShort: value,
              })
            }
            description="Contoh: 12 · 06 · 2027"
          />

          <FieldEditor
            label="Tanggal (ISO)"
            value={mergedData.dateISO}
            onChange={(value) =>
              onSave({
                dateISO: value,
              })
            }
            description="Format: 2027-06-12T08:00:00+07:00"
          />

          <FieldEditor
            label="Kota"
            value={mergedData.city}
            onChange={(value) =>
              onSave({
                city: value,
              })
            }
          />

          <FieldEditor
            label="Gedung Utama"
            value={mergedData.venueMain}
            onChange={(value) =>
              onSave({
                venueMain: value,
              })
            }
          />
        </div>
      </div>

      <div className="border-t border-gold-500/15 pt-8">
        <h2 className="font-display text-2xl font-light italic text-ivory">
          Rangkaian Acara
        </h2>

        <p className="mt-2 text-sm text-sage-300/70">
          Edit detail tiap acara di bawah. Untuk menambah atau menghapus acara, hubungi developer.
        </p>

        {mergedData.events.map(
          (event: any, index: number) => (
            <div
              key={index}
              className="mt-6 space-y-4 border border-gold-500/15 bg-pine-800/40 p-5"
            >
              <h3 className="font-display text-lg italic text-gold-300">
                {event.name}
              </h3>

              <FieldEditor
                label="Nama Acara"
                value={event.name}
                onChange={(value) => {
                  const updated = [
                    ...mergedData.events,
                  ];

                  updated[index] = {
                    ...event,
                    name: value,
                  };

                  onSave({
                    events: updated,
                  });
                }}
              />

              <FieldEditor
                label="Tanggal"
                value={event.date}
                onChange={(value) => {
                  const updated = [
                    ...mergedData.events,
                  ];

                  updated[index] = {
                    ...event,
                    date: value,
                  };

                  onSave({
                    events: updated,
                  });
                }}
              />

              <FieldEditor
                label="Waktu"
                value={event.time}
                onChange={(value) => {
                  const updated = [
                    ...mergedData.events,
                  ];

                  updated[index] = {
                    ...event,
                    time: value,
                  };

                  onSave({
                    events: updated,
                  });
                }}
              />

              <FieldEditor
                label="Venue"
                value={event.venue}
                onChange={(value) => {
                  const updated = [
                    ...mergedData.events,
                  ];

                  updated[index] = {
                    ...event,
                    venue: value,
                  };

                  onSave({
                    events: updated,
                  });
                }}
              />

              <FieldEditor
                label="Alamat"
                value={event.address}
                onChange={(value) => {
                  const updated = [
                    ...mergedData.events,
                  ];

                  updated[index] = {
                    ...event,
                    address: value,
                  };

                  onSave({
                    events: updated,
                  });
                }}
                multiline
              />

              <FieldEditor
                label="Link Google Maps"
                value={event.maps}
                onChange={(value) => {
                  const updated = [
                    ...mergedData.events,
                  ];

                  updated[index] = {
                    ...event,
                    maps: value,
                  };

                  onSave({
                    events: updated,
                  });
                }}
              />

              <FieldEditor
                label="Catatan"
                value={event.note}
                onChange={(value) => {
                  const updated = [
                    ...mergedData.events,
                  ];

                  updated[index] = {
                    ...event,
                    note: value,
                  };

                  onSave({
                    events: updated,
                  });
                }}
                multiline
              />
            </div>
          )
        )}
      </div>
    </div>
  );
}

/* ============================================================
   TAB: KUTIPAN
============================================================ */

function KutipanTab({
  mergedData,
  onSave,
}: any) {
  return (
    <div className="space-y-5">
      <h2 className="font-display text-2xl font-light italic text-ivory">
        Kutipan Ayat
      </h2>

      <FieldEditor
        label="Teks Arab"
        value={mergedData.quote.arabic}
        onChange={(value) =>
          onSave({
            quote: {
              ...mergedData.quote,
              arabic: value,
            },
          })
        }
        multiline
      />

      <FieldEditor
        label="Terjemahan"
        value={mergedData.quote.text}
        onChange={(value) =>
          onSave({
            quote: {
              ...mergedData.quote,
              text: value,
            },
          })
        }
        multiline
      />

      <FieldEditor
        label="Sumber"
        value={mergedData.quote.source}
        onChange={(value) =>
          onSave({
            quote: {
              ...mergedData.quote,
              source: value,
            },
          })
        }
      />
    </div>
  );
}

/* ============================================================
   TAB: KISAH
============================================================ */

function KisahTab({
  mergedData,
  onSave,
}: any) {
  return (
    <div className="space-y-5">
      <h2 className="font-display text-2xl font-light italic text-ivory">
        Kisah Cinta
      </h2>

      <p className="text-sm text-sage-300/70">
        Edit detail tiap bab kisah. Untuk menambah atau menghapus bab, hubungi developer.
      </p>

      {mergedData.story.map(
        (storyItem: any, index: number) => (
          <div
            key={index}
            className="space-y-4 border border-gold-500/15 bg-pine-800/40 p-5"
          >
            <FieldEditor
              label="Tahun"
              value={storyItem.year}
              onChange={(value) => {
                const updated = [
                  ...mergedData.story,
                ];

                updated[index] = {
                  ...storyItem,
                  year: value,
                };

                onSave({
                  story: updated,
                });
              }}
            />

            <FieldEditor
              label="Judul"
              value={storyItem.title}
              onChange={(value) => {
                const updated = [
                  ...mergedData.story,
                ];

                updated[index] = {
                  ...storyItem,
                  title: value,
                };

                onSave({
                  story: updated,
                });
              }}
            />

            <FieldEditor
              label="Cerita"
              value={storyItem.text}
              onChange={(value) => {
                const updated = [
                  ...mergedData.story,
                ];

                updated[index] = {
                  ...storyItem,
                  text: value,
                };

                onSave({
                  story: updated,
                });
              }}
              multiline
            />
          </div>
        )
      )}
    </div>
  );
}

/* ============================================================
   TAB: GALERI
============================================================ */

function GaleriTab({
  mergedData,
  onSave,
}: any) {
  return (
    <div className="space-y-5">
      <h2 className="font-display text-2xl font-light italic text-ivory">
        Galeri Foto
      </h2>

      <p className="text-sm text-sage-300/70">
        Edit caption dan ukuran foto. Untuk menambah atau menghapus foto, hubungi developer.
      </p>

      {mergedData.gallery.map(
        (galleryItem: any, index: number) => (
          <div
            key={index}
            className="space-y-4 border border-gold-500/15 bg-pine-800/40 p-5"
          >
            <PhotoUploader
              label={`Foto ${index + 1}`}
              currentUrl={galleryItem.src}
              onUpload={(url) => {
                const updated = [
                  ...mergedData.gallery,
                ];

                updated[index] = {
                  ...galleryItem,
                  src: url,
                };

                onSave({
                  gallery: updated,
                });
              }}
              preset="gallery"
            />

            <FieldEditor
              label="Caption"
              value={galleryItem.caption}
              onChange={(value) => {
                const updated = [
                  ...mergedData.gallery,
                ];

                updated[index] = {
                  ...galleryItem,
                  caption: value,
                };

                onSave({
                  gallery: updated,
                });
              }}
            />
          </div>
        )
      )}
    </div>
  );
}

/* ============================================================
   TAB: KADO
============================================================ */

function KadoTab({
  mergedData,
  onSave,
}: any) {
  return (
    <div className="space-y-8">
      <div>
        <h2 className="font-display text-2xl font-light italic text-ivory">
          Rekening
        </h2>

        {mergedData.gifts.map(
          (gift: any, index: number) => (
            <div
              key={index}
              className="mt-5 space-y-4 border border-gold-500/15 bg-pine-800/40 p-5"
            >
              <FieldEditor
                label="Bank"
                value={gift.bank}
                onChange={(value) => {
                  const updated = [
                    ...mergedData.gifts,
                  ];

                  updated[index] = {
                    ...gift,
                    bank: value,
                  };

                  onSave({
                    gifts: updated,
                  });
                }}
              />

              <FieldEditor
                label="Nomor Rekening"
                value={gift.number}
                onChange={(value) => {
                  const updated = [
                    ...mergedData.gifts,
                  ];

                  updated[index] = {
                    ...gift,
                    number: value,
                  };

                  onSave({
                    gifts: updated,
                  });
                }}
              />

              <FieldEditor
                label="Atas Nama"
                value={gift.holder}
                onChange={(value) => {
                  const updated = [
                    ...mergedData.gifts,
                  ];

                  updated[index] = {
                    ...gift,
                    holder: value,
                  };

                  onSave({
                    gifts: updated,
                  });
                }}
              />
            </div>
          )
        )}
      </div>

      <div className="border-t border-gold-500/15 pt-8">
        <h2 className="font-display text-2xl font-light italic text-ivory">
          Alamat Kirim Kado
        </h2>

        <div className="mt-5">
          <FieldEditor
            label="Alamat Lengkap"
            value={mergedData.giftAddress}
            onChange={(value) =>
              onSave({
                giftAddress: value,
              })
            }
            multiline
          />
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   TAB: DRESS CODE
============================================================ */

function DressCodeTab({
  mergedData,
  onSave,
}: any) {
  return (
    <div className="space-y-5">
      <h2 className="font-display text-2xl font-light italic text-ivory">
        Dress Code
      </h2>

      <p className="text-sm text-sage-300/70">
        Edit nama dan warna dress code.
      </p>

      {mergedData.dresscode.map(
        (dresscodeItem: any, index: number) => (
          <div
            key={index}
            className="flex flex-col gap-4 border border-gold-500/15 bg-pine-800/40 p-5 sm:flex-row sm:items-end"
          >
            <div className="flex-1 space-y-4">
              <FieldEditor
                label="Nama Warna"
                value={dresscodeItem.name}
                onChange={(value) => {
                  const updated = [
                    ...mergedData.dresscode,
                  ];

                  updated[index] = {
                    ...dresscodeItem,
                    name: value,
                  };

                  onSave({
                    dresscode: updated,
                  });
                }}
              />

              <FieldEditor
                label="Kode Warna (HEX)"
                value={dresscodeItem.hex}
                onChange={(value) => {
                  const updated = [
                    ...mergedData.dresscode,
                  ];

                  updated[index] = {
                    ...dresscodeItem,
                    hex: value,
                  };

                  onSave({
                    dresscode: updated,
                  });
                }}
                type="color"
              />
            </div>
          </div>
        )
      )}
    </div>
  );
}
