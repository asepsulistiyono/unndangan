import { useState } from "react";
import { useWedding } from "../../lib/WeddingContext";
import { signOut, type AdminProfile } from "../../lib/auth";
import { Monogram } from "../Decor";
import { IconArrowLeft, IconCheck, IconClose, IconPencil, IconTrash, IconUsers } from "../Icons";
import FieldEditor from "./FieldEditor";
import PhotoUploader from "./PhotoUploader";
import ThemeSelector from "./ThemeSelector";
import OrnamentSelector from "./OrnamentSelector";
import LanguageSelector from "./LanguageSelector";
import ReligiousFormatSelector from "./ReligiousFormatSelector";
import TemplateSelector from "./TemplateSelector";

type Tab = "pengantin" | "acara" | "kutipan" | "kisah" | "galeri" | "kado" | "dresscode" | "tema" | "ornamen" | "bahasa" | "agama" | "template";

export default function AdminPanel({ profile, userName }: { profile: AdminProfile; userName: string | null }) {
  const { mergedData, updateData, refetch } = useWedding();
  const [tab, setTab] = useState<Tab>("pengantin");
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState("");

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(""), 2600);
  };

  const handleSave = async (patch: any) => {
  setSaving(true);

  try {
    await updateData(patch);
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

    if (profile?.user_id) {
      saveSlugMapping(
        slug,
        profile.user_id
      );
    }

    /**
     * Ambil ulang data setelah penyimpanan
     * agar tampilan admin langsung sinkron.
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
  const tabs: { id: Tab; label: string }[] = [
    { id: "template", label: "Template" },
    { id: "bahasa", label: "Bahasa" },
    { id: "agama", label: "Format Agama" },
    { id: "tema", label: "Tema" },
    { id: "ornamen", label: "Ornamen" },
    { id: "pengantin", label: "Pengantin" },
    { id: "acara", label: "Acara" },
    { id: "kutipan", label: "Kutipan" },
    { id: "kisah", label: "Kisah" },
    { id: "galeri", label: "Galeri" },
    { id: "kado", label: "Kado" },
    { id: "dresscode", label: "Dress Code" },
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
        {/* Header */}
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
                  Halo, <span className="font-semibold text-gold-300">{userName}</span>
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
              href={`#/${generateSlug(mergedData.groom.short, mergedData.bride.short)}`}
              className="inline-flex items-center gap-2 border border-gold-500/40 px-4 py-2.5 text-[10px] font-bold uppercase tracking-[0.18em] text-gold-300 transition-all hover:bg-gold-500 hover:text-pine-950"
            >
              <IconArrowLeft className="size-4" />
              Lihat Undangan
            </a>
            <button
              onClick={() => signOut()}
              className="border border-rose-400/30 px-4 py-2.5 text-[10px] font-bold uppercase tracking-[0.18em] text-rose-300 transition-colors hover:bg-rose-400 hover:text-pine-950"
            >
              Keluar
            </button>
          </div>
        </header>

        {/* Info URL Undangan Personal */}
        <div className="mt-6 border border-gold-500/25 bg-pine-800/50 p-4">
          <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-gold-400">
            URL Undangan Personal Anda
          </p>
          <div className="mt-2 flex items-center gap-2">
            <code className="flex-1 truncate rounded-[3px] bg-pine-900/80 px-3 py-2 font-mono text-xs text-gold-200">
              {window.location.origin}/#/{generateSlug(mergedData.groom.short, mergedData.bride.short)}
            </code>
            <button
              onClick={() => {
                const url = `${window.location.origin}/#/${generateSlug(mergedData.groom.short, mergedData.bride.short)}`;
                navigator.clipboard.writeText(url);
                showToast("URL undangan disalin!");
              }}
              className="shrink-0 rounded-[3px] bg-gold-500 px-3 py-2 text-[10px] font-bold uppercase tracking-[0.18em] text-pine-950 transition-all hover:bg-gold-400"
            >
              Salin
            </button>
          </div>
          <p className="mt-2 text-[10px] text-sage-300/60">
            Bagikan URL ini kepada tamu undangan Anda. URL akan otomatis berubah saat Anda mengubah nama mempelai.
          </p>
        </div>

        {/* Tabs */}
        <div className="mt-6 flex flex-wrap gap-2 border-b border-gold-500/15 pb-4">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`rounded-[3px] px-4 py-2 text-[11px] font-bold uppercase tracking-[0.18em] transition-all ${
                tab === t.id
                  ? "bg-gold-500 text-pine-950"
                  : "border border-gold-500/25 text-gold-300 hover:bg-pine-800"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Konten tab */}
        <div className="mt-8 space-y-6">
          {tab === "template" && <TemplateSelector />}
          {tab === "bahasa" && <LanguageSelector />}
          {tab === "agama" && <ReligiousFormatSelector />}
          {tab === "tema" && <ThemeSelector />}
          {tab === "ornamen" && <OrnamentSelector />}
          {tab === "pengantin" && (
            <PengantinTab mergedData={mergedData} onSave={handleSave} />
          )}
          {tab === "acara" && <AcaraTab mergedData={mergedData} onSave={handleSave} />}
          {tab === "kutipan" && <KutipanTab mergedData={mergedData} onSave={handleSave} />}
          {tab === "kisah" && <KisahTab mergedData={mergedData} onSave={handleSave} />}
          {tab === "galeri" && <GaleriTab mergedData={mergedData} onSave={handleSave} />}
          {tab === "kado" && <KadoTab mergedData={mergedData} onSave={handleSave} />}
          {tab === "dresscode" && <DressCodeTab mergedData={mergedData} onSave={handleSave} />}
        </div>
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

/* ===== Tab: Pengantin ===== */
function PengantinTab({ mergedData, onSave }: any) {
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
            onChange={(v) => onSave({ groom: { ...mergedData.groom, short: v } })}
          />
          <FieldEditor
            label="Nama Lengkap"
            value={mergedData.groom.full}
            onChange={(v) => onSave({ groom: { ...mergedData.groom, full: v } })}
          />
          <FieldEditor
            label="Orang Tua"
            value={mergedData.groom.parents}
            onChange={(v) => onSave({ groom: { ...mergedData.groom, parents: v } })}
            multiline
          />
          <FieldEditor
            label="Instagram (tanpa @)"
            value={mergedData.groom.ig}
            onChange={(v) => onSave({ groom: { ...mergedData.groom, ig: v } })}
          />
          <FieldEditor
            label="Bio"
            value={mergedData.groom.bio}
            onChange={(v) => onSave({ groom: { ...mergedData.groom, bio: v } })}
            multiline
          />
          <PhotoUploader
            label="Foto Mempelai Pria"
            currentUrl={mergedData.photos?.groom}
            onUpload={(url) => onSave({ photos: { ...mergedData.photos, groom: url } })}
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
            onChange={(v) => onSave({ bride: { ...mergedData.bride, short: v } })}
          />
          <FieldEditor
            label="Nama Lengkap"
            value={mergedData.bride.full}
            onChange={(v) => onSave({ bride: { ...mergedData.bride, full: v } })}
          />
          <FieldEditor
            label="Orang Tua"
            value={mergedData.bride.parents}
            onChange={(v) => onSave({ bride: { ...mergedData.bride, parents: v } })}
            multiline
          />
          <FieldEditor
            label="Instagram (tanpa @)"
            value={mergedData.bride.ig}
            onChange={(v) => onSave({ bride: { ...mergedData.bride, ig: v } })}
          />
          <FieldEditor
            label="Bio"
            value={mergedData.bride.bio}
            onChange={(v) => onSave({ bride: { ...mergedData.bride, bio: v } })}
            multiline
          />
          <PhotoUploader
            label="Foto Mempelai Wanita"
            currentUrl={mergedData.photos?.bride}
            onUpload={(url) => onSave({ photos: { ...mergedData.photos, bride: url } })}
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
            onChange={(v) => onSave({ initials: v })}
            description="Contoh: R·S"
          />
          <PhotoUploader
            label="Foto Hero (Sampul)"
            currentUrl={mergedData.photos?.hero}
            onUpload={(url) => onSave({ photos: { ...mergedData.photos, hero: url } })}
            preset="hero"
            description="Foto prewedding utama, ukuran ideal: 16:9 atau 4:3"
          />
        </div>
      </div>
    </div>
  );
}

/* ===== Tab: Acara ===== */
function AcaraTab({ mergedData, onSave }: any) {
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
            onChange={(v) => onSave({ dateLabel: v })}
            description="Contoh: Sabtu, 12 Juni 2027"
          />
          <FieldEditor
            label="Tanggal (singkat)"
            value={mergedData.dateShort}
            onChange={(v) => onSave({ dateShort: v })}
            description="Contoh: 12 · 06 · 2027"
          />
          <FieldEditor
            label="Tanggal (ISO)"
            value={mergedData.dateISO}
            onChange={(v) => onSave({ dateISO: v })}
            description="Format: 2027-06-12T08:00:00+07:00"
          />
          <FieldEditor
            label="Kota"
            value={mergedData.city}
            onChange={(v) => onSave({ city: v })}
          />
          <FieldEditor
            label="Gedung Utama"
            value={mergedData.venueMain}
            onChange={(v) => onSave({ venueMain: v })}
          />
        </div>
      </div>

      <div className="border-t border-gold-500/15 pt-8">
        <h2 className="font-display text-2xl font-light italic text-ivory">
          Rangkaian Acara
        </h2>
        <p className="mt-2 text-sm text-sage-300/70">
          Edit detail tiap acara di bawah. Untuk menambah/menghapus acara, hubungi developer.
        </p>
        {mergedData.events.map((ev: any, i: number) => (
          <div key={i} className="mt-6 space-y-4 border border-gold-500/15 bg-pine-800/40 p-5">
            <h3 className="font-display text-lg italic text-gold-300">{ev.name}</h3>
            <FieldEditor
              label="Nama Acara"
              value={ev.name}
              onChange={(v) => {
                const updated = [...mergedData.events];
                updated[i] = { ...ev, name: v };
                onSave({ events: updated });
              }}
            />
            <FieldEditor
              label="Tanggal"
              value={ev.date}
              onChange={(v) => {
                const updated = [...mergedData.events];
                updated[i] = { ...ev, date: v };
                onSave({ events: updated });
              }}
            />
            <FieldEditor
              label="Waktu"
              value={ev.time}
              onChange={(v) => {
                const updated = [...mergedData.events];
                updated[i] = { ...ev, time: v };
                onSave({ events: updated });
              }}
            />
            <FieldEditor
              label="Venue"
              value={ev.venue}
              onChange={(v) => {
                const updated = [...mergedData.events];
                updated[i] = { ...ev, venue: v };
                onSave({ events: updated });
              }}
            />
            <FieldEditor
              label="Alamat"
              value={ev.address}
              onChange={(v) => {
                const updated = [...mergedData.events];
                updated[i] = { ...ev, address: v };
                onSave({ events: updated });
              }}
              multiline
            />
            <FieldEditor
              label="Link Google Maps"
              value={ev.maps}
              onChange={(v) => {
                const updated = [...mergedData.events];
                updated[i] = { ...ev, maps: v };
                onSave({ events: updated });
              }}
            />
            <FieldEditor
              label="Catatan"
              value={ev.note}
              onChange={(v) => {
                const updated = [...mergedData.events];
                updated[i] = { ...ev, note: v };
                onSave({ events: updated });
              }}
              multiline
            />
          </div>
        ))}
      </div>
    </div>
  );
}

/* ===== Tab: Kutipan ===== */
function KutipanTab({ mergedData, onSave }: any) {
  return (
    <div className="space-y-5">
      <h2 className="font-display text-2xl font-light italic text-ivory">
        Kutipan Ayat
      </h2>
      <FieldEditor
        label="Teks Arab"
        value={mergedData.quote.arabic}
        onChange={(v) => onSave({ quote: { ...mergedData.quote, arabic: v } })}
        multiline
      />
      <FieldEditor
        label="Terjemahan"
        value={mergedData.quote.text}
        onChange={(v) => onSave({ quote: { ...mergedData.quote, text: v } })}
        multiline
      />
      <FieldEditor
        label="Sumber"
        value={mergedData.quote.source}
        onChange={(v) => onSave({ quote: { ...mergedData.quote, source: v } })}
      />
    </div>
  );
}

/* ===== Tab: Kisah ===== */
function KisahTab({ mergedData, onSave }: any) {
  return (
    <div className="space-y-5">
      <h2 className="font-display text-2xl font-light italic text-ivory">
        Kisah Cinta
      </h2>
      <p className="text-sm text-sage-300/70">
        Edit detail tiap bab kisah. Untuk menambah/menghapus bab, hubungi developer.
      </p>
      {mergedData.story.map((s: any, i: number) => (
        <div key={i} className="space-y-4 border border-gold-500/15 bg-pine-800/40 p-5">
          <FieldEditor
            label="Tahun"
            value={s.year}
            onChange={(v) => {
              const updated = [...mergedData.story];
              updated[i] = { ...s, year: v };
              onSave({ story: updated });
            }}
          />
          <FieldEditor
            label="Judul"
            value={s.title}
            onChange={(v) => {
              const updated = [...mergedData.story];
              updated[i] = { ...s, title: v };
              onSave({ story: updated });
            }}
          />
          <FieldEditor
            label="Cerita"
            value={s.text}
            onChange={(v) => {
              const updated = [...mergedData.story];
              updated[i] = { ...s, text: v };
              onSave({ story: updated });
            }}
            multiline
          />
        </div>
      ))}
    </div>
  );
}

/* ===== Tab: Galeri ===== */
function GaleriTab({ mergedData, onSave }: any) {
  return (
    <div className="space-y-5">
      <h2 className="font-display text-2xl font-light italic text-ivory">
        Galeri Foto
      </h2>
      <p className="text-sm text-sage-300/70">
        Edit caption dan ukuran foto. Untuk menambah/menghapus foto, hubungi developer.
      </p>
      {mergedData.gallery.map((g: any, i: number) => (
        <div key={i} className="space-y-4 border border-gold-500/15 bg-pine-800/40 p-5">
          <PhotoUploader
            label={`Foto ${i + 1}`}
            currentUrl={g.src}
            onUpload={(url) => {
              const updated = [...mergedData.gallery];
              updated[i] = { ...g, src: url };
              onSave({ gallery: updated });
            }}
            preset="gallery"
          />
          <FieldEditor
            label="Caption"
            value={g.caption}
            onChange={(v) => {
              const updated = [...mergedData.gallery];
              updated[i] = { ...g, caption: v };
              onSave({ gallery: updated });
            }}
          />
        </div>
      ))}
    </div>
  );
}

/* ===== Tab: Kado ===== */
function KadoTab({ mergedData, onSave }: any) {
  return (
    <div className="space-y-8">
      <div>
        <h2 className="font-display text-2xl font-light italic text-ivory">
          Rekening
        </h2>
        {mergedData.gifts.map((g: any, i: number) => (
          <div key={i} className="mt-5 space-y-4 border border-gold-500/15 bg-pine-800/40 p-5">
            <FieldEditor
              label="Bank"
              value={g.bank}
              onChange={(v) => {
                const updated = [...mergedData.gifts];
                updated[i] = { ...g, bank: v };
                onSave({ gifts: updated });
              }}
            />
            <FieldEditor
              label="Nomor Rekening"
              value={g.number}
              onChange={(v) => {
                const updated = [...mergedData.gifts];
                updated[i] = { ...g, number: v };
                onSave({ gifts: updated });
              }}
            />
            <FieldEditor
              label="Atas Nama"
              value={g.holder}
              onChange={(v) => {
                const updated = [...mergedData.gifts];
                updated[i] = { ...g, holder: v };
                onSave({ gifts: updated });
              }}
            />
          </div>
        ))}
      </div>

      <div className="border-t border-gold-500/15 pt-8">
        <h2 className="font-display text-2xl font-light italic text-ivory">
          Alamat Kirim Kado
        </h2>
        <div className="mt-5">
          <FieldEditor
            label="Alamat Lengkap"
            value={mergedData.giftAddress}
            onChange={(v) => onSave({ giftAddress: v })}
            multiline
          />
        </div>
      </div>
    </div>
  );
}

/* ===== Tab: Dress Code ===== */
function DressCodeTab({ mergedData, onSave }: any) {
  return (
    <div className="space-y-5">
      <h2 className="font-display text-2xl font-light italic text-ivory">
        Dress Code
      </h2>
      <p className="text-sm text-sage-300/70">
        Edit nama dan warna dress code.
      </p>
      {mergedData.dresscode.map((d: any, i: number) => (
        <div key={i} className="flex flex-col gap-4 border border-gold-500/15 bg-pine-800/40 p-5 sm:flex-row sm:items-end">
          <div className="flex-1 space-y-4">
            <FieldEditor
              label="Nama Warna"
              value={d.name}
              onChange={(v) => {
                const updated = [...mergedData.dresscode];
                updated[i] = { ...d, name: v };
                onSave({ dresscode: updated });
              }}
            />
            <FieldEditor
              label="Kode Warna (HEX)"
              value={d.hex}
              onChange={(v) => {
                const updated = [...mergedData.dresscode];
                updated[i] = { ...d, hex: v };
                onSave({ dresscode: updated });
              }}
              type="color"
            />
          </div>
        </div>
      ))}
    </div>
  );
}
