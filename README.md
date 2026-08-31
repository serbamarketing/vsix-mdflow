# MD Flow (VS Code Extension)

![MD Flow Logo](assets/logo.png)

MD Flow adalah ekstensi VS Code yang menyediakan berbagai _view mode_ untuk dokumen Markdown, termasuk **Mindmap**, **Table**, **Kanban**, dan **Calendar**. Ekstensi ini membantu memvisualisasikan dan mengelola konten Markdown dengan lebih interaktif.

## Fitur
- **Mindmap View**: Visualisasikan struktur markdown dalam bentuk mindmap.
- **Table View**: Kelola data tabular dari markdown dengan mudah.
- **Kanban View**: Atur _task_ atau item markdown dalam gaya papan Kanban.
- **Calendar View**: Tinjau tenggat waktu atau _event_ dari markdown.

## Cara Penggunaan
- **Buka Dokumen**: Klik kanan pada file berakhiran `.md` di dalam *Explorer* VS Code.
- **Pilih Menu**: Pilih opsi **"MD Flow SE : View Mode"** yang ada di bagian bawah *context menu*.
- **Tampilan Interaktif**: Sebuah Webview akan muncul di samping dokumen Anda yang menampilkan pilihan (Mindmap, Table, Kanban, Calendar) untuk berinteraksi dengan isi dokumen Markdown.

> [!TIP]
> Kami telah menyediakan folder `docs/` di dalam repositori ini sebagai sampel/contoh dokumen `.md` untuk Anda uji coba.

---

## 🛠️ Panduan Developer (Step-by-Step)

Jika Anda men-_clone_ proyek ini di _device_ baru, ikuti langkah-langkah berikut:

### 1. Persiapan Awal (Setup)
Pastikan Anda sudah menginstal **Node.js** dan **npm**.
Buka terminal di folder proyek (`vsix-mdflow`) lalu jalankan:
```bash
# Install dependencies untuk extension
npm install

# Install dependencies untuk webview UI (React)
cd webview-ui
npm install
cd ..
```

### 2. Menjalankan Mode Development (Dev)
Untuk menjalankan ekstensi di VS Code secara lokal:
1. Jalankan perintah kompilasi:
   ```bash
   npm run compile
   # atau untuk auto-recompile saat ada perubahan:
   npm run watch
   ```
2. Buka proyek ini di VS Code, lalu tekan **`F5`** untuk membuka *Extension Development Host*.
3. Di VS Code yang baru terbuka, buka _Command Palette_ (`Ctrl+Shift+P` atau `Cmd+Shift+P`), lalu jalankan perintah **`Mdflow: Open View`**.
4. Jika Anda mengubah UI React di folder `webview-ui`, Anda perlu mem-_build_ ulang webview-nya dengan:
   ```bash
   npm run build:webview
   ```
   Lalu _reload_ VS Code Extension Host Anda (`Ctrl+R` / `Cmd+R`).

### 3. Mem-build untuk Production (VSIX)
Untuk mem-package ekstensi ini menjadi file `.vsix` yang dapat dibagikan atau di-install secara offline:
1. Pastikan Anda memiliki `@vscode/vsce` terinstal secara global (atau jalankan via `npx`):
   ```bash
   npm install -g @vscode/vsce
   ```
2. Jalankan perintah package:
   ```bash
   vsce package
   ```
   > Perintah ini akan otomatis menjalankan skrip `vscode:prepublish` (yang menjalankan `npm run package` di proyek ini, mem-build webview dan extension).
3. Hasilnya adalah file dengan format `mdflow-x.x.x.vsix` di direktori proyek Anda.

### 4. Upload ke Open VSX Registry
Bagi Anda yang berencana untuk mendistribusikan ke [open-vsx.org](https://open-vsx.org/), berikut adalah langkahnya:
1. Buat akun di Open VSX dan buat _access token_ dari halaman profil Anda.
2. Pastikan properti `publisher` di `package.json` sudah diatur dan sesuai dengan nama *namespace* Anda di Open VSX.
   ```json
   "publisher": "nama-publisher-anda"
   ```
3. Install `ovsx` CLI:
   ```bash
   npm install -g ovsx
   ```
4. _Publish_ ekstensi:
   ```bash
   ovsx publish mdflow-x.x.x.vsix -p <TOKEN_ANDA>
   ```
   *(Ganti `mdflow-x.x.x.vsix` dengan nama file `.vsix` Anda).*

---
_Note: Folder ini telah disiapkan agar bisa dipisah menjadi repositori Git mandiri kapan saja._

## 🌐 Dokumentasi (GitHub Pages)
Terdapat juga folder `sites/` di dalam repositori ini. Folder tersebut nantinya akan digunakan untuk mem-*publish* situs web dokumentasi mandiri terkait MD Flow ke **GitHub Pages**.
