# 🚀 MDFlow — Visual Markdown Workspace & Project Hub

> **MDFlow** adalah aplikasi web visual workspace berbasis **Local-First & Privacy-Focused** yang mengubah dokumen `.md` (Markdown) lokal Anda menjadi **5 tampilan visual interaktif** (Mindmap, Kanban, Tabel Database, Kalender, & Raw Editor) secara real-time 100% di browser tanpa mengunggah file Anda ke server cloud manapun.

Developed with ❤️ by **SpawnEra Studio**

---

## ✨ Fitur Utama (Key Features)

- 🧠 **Mindmap Canvas Interaktif**: Visualisasi hierarki heading (`#`, `##`, `###`) dalam bentuk pohon ideasi dengan fitur drag & drop untuk memindahkan parent node, pan/zoom, serta kustomisasi badge metadata.
- 📋 **Kanban Sprint Board**: Tarik & geser (drag & drop) kartu tugas antar kolom status (`Todo`, `Progress`, `Done`, `Review`), atau kelompokkan kartu berdasarkan Prioritas, PIC, dan Tipe.
- 📊 **Database Metadata Table**: Tabel dinamis yang mendukung pencarian instant auto-complete, filter status/prioritas, pengurutan, serta pembuatan kolom metadata kustom.
- 📅 **Milestone & Deadline Calendar**: Pantau rilis rilis fitur dan tenggat pengerjaan proyek secara terstruktur dalam tampilan kalender bulanan.
- 📝 **Raw Markdown Source Editor**: Edit sumber teks Markdown Anda secara langsung dengan pratinjau real-time dan auto-sync dua arah.
- 🌐 **Dual Language (i18n ID & EN)**: Dukungan penuh Bahasa Indonesia (ID) & English (EN) yang tersinkronisasi otomatis antara Landing Page dan Dashboard Workspace.
- 🎨 **Sistem Mode Tema & Token Visual**: Pilihan tema **Auto (Sistem)**, **Dark Mode**, **Light Mode**, dan **Midnight Blue** dengan visual premium dan kontras tinggi.
- 💾 **Disk Sync (File System Access API)**: Tersinkron langsung dengan file `.md` di komputer Anda, memudahkan kolaborasi bersama IDE seperti VS Code dan AI Assistant (Cursor/AG).

---

## 🛠️ Teknologi & Stack (Tech Stack)

- **Core Framework**: React 18 + TypeScript + Vite
- **Styling**: Vanilla CSS with CSS Custom Properties (Design Tokens) + TailwindCSS Utilities
- **Animations**: Framer Motion
- **Icons**: Lucide React Icons
- **UI Components**: Radix UI (Dropdown Menu, Dialogs)
- **Mindmap Engine**: Markmap View & Lib (`markmap-view`, `markmap-lib`)
- **Export Engine**: HTML5 Blob, PDF Canvas (`html2canvas`, `jspdf`), CSV Export

---

## 📝 Format Metadata Markdown

MDFlow membaca metadata yang ditulis tepat di bawah heading fitur dalam format baris tunggal:

```markdown
# Proyek Sistem Game 2026

## 🎵 Music Player & Sound FX
Sistem audio background dan efek suara langkah kaki.

**Status:** 🟢 Done
**Priority:** 🔴 High
**Type:** System
**PIC:** @audiodev
**Deadline:** 2026-08-25

### Playlist Custom Player
Fitur daftar lagu favorit pemain.

**Status:** 🟡 Progress
**Priority:** 🟡 Medium
**PIC:** @uidev
```

---

## 🚀 Memulai Pengembangan (Local Development)

### 1. Prasyarat (Prerequisites)
Pastikan Anda telah menginstal **Node.js** (v18+) dan **npm**.

### 2. Instalasi (Installation)
Clone repositori dan install dependensi:

```bash
git clone https://github.com/spawnera/Markdown-Project.git
cd Markdown-Project
npm install
```

### 3. Jalankan Dev Server (Run Dev)
```bash
npm run dev
```
Buka browser di `http://localhost:5173`.

### 4. Build untuk Produksi (Production Build)
```bash
npm run build
```
Hasil build akan tersimpan di direktori `dist/`.

---

## 🌐 Komunitas & Kontak

- 🔗 **Live Demo Web App**: [https://mdflow.spawnera.com](https://mdflow.spawnera.com)
- 💬 **Discord Community**: [https://discord.gg/4QUZzuUJzt](https://discord.gg/4QUZzuUJzt)
- 🎵 **TikTok**: [@spawnerastudio](https://tiktok.com/@spawnerastudio)
- 🏢 **Studio**: SpawnEra Studio

---

## 🚀 Panduan Publish ke Netlify (Deploy via CLI)

MDFlow dapat dengan mudah di-deploy ke Netlify menggunakan terminal. Ikuti langkah step-by-step berikut:

1. **Install Netlify CLI secara global:**
   ```bash
   npm install -g netlify-cli
   ```

2. **Login ke akun Netlify Anda:**
   ```bash
   netlify login
   ```
   *Perintah ini akan membuka browser agar Anda dapat login/otorisasi Netlify CLI.*

3. **Build proyek Anda:**
   ```bash
   npm run build
   ```
   *Langkah ini sangat penting untuk memastikan kode terbaru ter-compile ke dalam folder `dist/`.*

4. **Deploy hasil build (Draft URL):**
   ```bash
   netlify deploy --dir=dist
   ```
   *Anda dapat meninjau hasilnya melalui "Draft URL" yang diberikan di terminal.*

5. **Publish ke Production (Live URL):**
   ```bash
   netlify deploy --dir=dist --prod
   ```
   *Website Anda sekarang live! Anda dapat mengonfigurasi domain khusus langsung di dashboard Netlify.*
