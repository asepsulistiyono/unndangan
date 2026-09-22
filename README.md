# Undangan Pernikahan - Sistem Admin Lengkap

Website undangan pernikahan dengan sistem admin terintegrasi Supabase untuk pengelolaan data real-time.

## Fitur Utama

✅ **Panel Admin** - Edit semua data undangan (nama, tanggal, foto, dll)
✅ **Super Admin** - Kelola admin lain, ganti password
✅ **Upload Foto** - Kompresi otomatis agresif (WebP, <200KB)
✅ **Real-time** - Perubahan langsung tampil di website publik
✅ **Responsif** - Tampilan optimal di HP dan desktop
✅ **Kelola Tamu** - 1000+ tamu dengan link pribadi
✅ **Supabase Integration** - Database cloud + storage + auth

## Setup Supabase

### 1. Buat Project Supabase

1. Buka [supabase.com](https://supabase.com)
2. Buat project baru
3. Catat **Project URL** dan **anon public key** dari Settings → API

### 2. Setup Database

Jalankan SQL berikut di **SQL Editor** Supabase:

```sql
-- Tabel settings (menyimpan data undangan)
CREATE TABLE settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  data jsonb NOT NULL,
  updated_at timestamptz DEFAULT now(),
  updated_by uuid REFERENCES auth.users(id)
);

-- Insert row awal
INSERT INTO settings (data) VALUES ('{}'::jsonb);

-- Tabel profil admin
CREATE TABLE admin_profiles (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('admin','super_admin')),
  name text,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_profiles ENABLE ROW LEVEL SECURITY;

-- Policy: semua orang boleh baca settings
CREATE POLICY "Public read settings" ON settings
  FOR SELECT USING (true);

-- Policy: hanya admin boleh update settings
CREATE POLICY "Admin update settings" ON settings
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM admin_profiles
      WHERE user_id = auth.uid()
    )
  );

-- Policy: admin boleh baca admin_profiles
CREATE POLICY "Admin read profiles" ON admin_profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM admin_profiles
      WHERE user_id = auth.uid()
    )
  );

-- Policy: super_admin boleh insert/update/delete admin_profiles
CREATE POLICY "Super admin manage profiles" ON admin_profiles
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM admin_profiles
      WHERE user_id = auth.uid() AND role = 'super_admin'
    )
  );
```

### 3. Setup Storage

Jalankan SQL berikut untuk bucket foto:

```sql
-- Buat bucket storage
INSERT INTO storage.buckets (id, name, public) VALUES ('photos','photos', true);

-- Policy: semua orang boleh baca foto
CREATE POLICY "Public read photos" ON storage.objects
  FOR SELECT USING (bucket_id = 'photos');

-- Policy: hanya admin boleh upload
CREATE POLICY "Admin upload photos" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'photos' AND
    EXISTS (
      SELECT 1 FROM admin_profiles
      WHERE user_id = auth.uid()
    )
  );

-- Policy: admin boleh delete foto
CREATE POLICY "Admin delete photos" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'photos' AND
    EXISTS (
      SELECT 1 FROM admin_profiles
      WHERE user_id = auth.uid()
    )
  );
```

### 4. Buat Super Admin Pertama

1. Buka **Authentication** → **Users** di Supabase dashboard
2. Klik **Add user** → **Create new user**
3. Isi email dan password
4. Catat **User UID** yang muncul
5. Jalankan SQL berikut di SQL Editor (ganti `YOUR_UID` dengan UID tadi):

```sql
INSERT INTO admin_profiles (user_id, role, name)
VALUES ('YOUR_UID', 'super_admin', 'Nama Anda');
```

### 5. Konfigurasi Environment

Buat file `.env` di root proyek:

```bash
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

Ganti dengan URL dan key dari Supabase.

### 6. Jalankan Lokal

```bash
npm install
npm run dev
```

Buka `http://localhost:5173` untuk undangan publik.
Buka `http://localhost:5173/#/admin` untuk login admin.

## Deploy ke Netlify

1. Push kode ke GitHub
2. Buka [app.netlify.com](https://app.netlify.com)
3. **Add new site** → Import repository
4. Tambahkan environment variables:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
5. Klik **Deploy**

Setiap commit ke GitHub akan otomatis rebuild website.

## Akses Panel

### Undangan Publik
```
https://your-site.netlify.app/
```

### Panel Admin
```
https://your-site.netlify.app/#/admin
```

### Panel Super Admin
```
https://your-site.netlify.app/#/admin/super
```

### Kelola Tamu
```
https://your-site.netlify.app/#/tamu
```

## Struktur Data

Data undangan disimpan di tabel `settings` sebagai JSON:

```json
{
  "initials": "R·S",
  "dateLabel": "Sabtu, 12 Juni 2027",
  "groom": {
    "short": "Raka",
    "full": "Raka Adyatma Prasetya",
    "parents": "Putra pertama dari...",
    "ig": "rakaadyatma",
    "bio": "..."
  },
  "bride": { ... },
  "photos": {
    "hero": "https://.../hero.webp",
    "groom": "https://.../groom.webp",
    "bride": "https://.../bride.webp"
  },
  "events": [ ... ],
  "story": [ ... ],
  "gallery": [ ... ],
  "gifts": [ ... ],
  "dresscode": [ ... ]
}
```

## Kompresi Foto

Semua foto dikompresi otomatis sebelum upload:
- **Hero**: max 1800px, 0.25MB, WebP
- **Portrait**: max 1400px, 0.18MB, WebP
- **Gallery**: max 1500px, 0.15MB, WebP
- **Thumbnail**: max 900px, 0.08MB, WebP

## Troubleshooting

**Foto tidak tampil?**
- Cek bucket storage sudah public
- Cek RLS policy untuk storage.objects

**Admin tidak bisa login?**
- Cek user sudah ada di `admin_profiles`
- Cek role sudah diset dengan benar

**Perubahan tidak muncul di website?**
- Cek real-time subscription aktif
- Refresh halaman

**Build error?**
- Pastikan `.env` sudah diisi
- Jalankan `npm install` ulang

## Lisensi

MIT License - Bebas digunakan untuk keperluan pribadi maupun komersial.
wedding-invitation-website-b23eb


# Undangan_latihan
Anda bisa langsung mengedit undangan melalui GitHub dengan dua cara:
Cara cepat (tanpa install apa pun):
Unggah file proyek ke repository (hapus folder node_modules dulu)
Di GitHub, klik file src/lib/wedding.ts → ikon pensil → edit → Commit
Atau tekan tombol . di halaman repo untuk membuka VS Code di browser
Cara lengkap (dengan Codespaces):
Tombol <> Code → Codespaces → Create codespace, lalu jalankan npm install dan npm run dev untuk melihat hasilnya langsung di browser
Untuk menerbitkan website secara otomatis: hubungkan repository ke Netlify atau Vercel (gratis). Setiap commit akan otomatis membangun ulang website dalam ±1 menit, tanpa perlu menyentuh komputer.



cara menambahkan tamu undangan
Build sukses ✅ — fitur kelola 1000 tamu sudah jadi! Berikut cara pakainya:
Membuka panel pengelola
Tambahkan #/tamu di belakang alamat website Anda:

1
Ini halaman khusus Anda (tamu undangan tidak akan melihatnya). Klik "Lihat Undangan" untuk kembali.
Cara kerja untuk 1000 tamu
1. Tempel seluruh daftar sekaligus — di kotak "Tambahkan Tamu", tempel dari Excel/catatan Anda, satu nama per baris. Nomor WhatsApp opsional, dipisah tanda |:

1234
Klik Tambahkan — sistem menghitung baris yang terbaca saat Anda mengetik, dan otomatis melewati nama duplikat.
2. Setiap tamu langsung punya link pribadi — pola ?to=NamaTamu. Saat tamu membuka link itu, nama mereka tampil di sampul depan (nama panjang otomatis dipecah rapi: nama utama besar + keterangan "beserta keluarga" kecil di bawahnya).
3. Kirim ke tamu — tiap baris tamu punya 4 tombol:
🟢 Hijau (WhatsApp) — langsung membuka chat WA ke nomor tamu dengan pesan undangan yang sudah terisi nama & linknya (tinggal pencet kirim di WA)
🔗 Emas — salin link pribadi tamu
✏️ — ubah nama/nomor · 🗑 — hapus
4. Template pesan bisa diatur — bagian "Template Pesan WhatsApp" memakai {nama} dan {link} yang terisi otomatis, lengkap dengan pratinjau langsung.
5. Untuk broadcast massal — unduh CSV (kolom Nama, No HP, Link — bisa dipakai alat broadcast WA), TXT (daftar link), dan JSON sebagai cadangan. Ada tombol Pulihkan untuk memasukkan kembali cadangan JSON.
Yang penting diketahui
Daftar tamu tersimpan di peramban perangkat Anda (bukan di server) — jadi rutin unduh cadangan JSON, dan kelola dari perangkat yang sama.
Link tamu mandiri — nama tersandi langsung di URL, jadi tidak butuh database. Link yang sudah Anda bagikan tetap bekerja selamanya, di perangkat tamu mana pun.
Ada pencarian untuk menemukan tamu tertentu di antara 1000 nama, dan daftar dimuat bertahap agar tetap ringan.
Alur lengkap Anda nanti
Upload proyek ke GitHub (termasuk kode baru ini) → deploy ke Netlify
Buka link-anda.netlify.app/#/tamu → tempel 1000 nama
Unduh cadangan JSON (simpan baik-baik)
Bagikan link pribadi tiap tamu via tombol WhatsApp — atau salin semua link + CSV untuk broadcast
Coba buka #/tamu di pratinjau sekarang dan tempel beberapa nama untuk melihat alurnya. Kalau ada yang ingin ditambah — misalnya penanda "sudah dikirim" per tamu atau pembagian gelombang sesi — tinggal bilang!

