<div align="center">
  <img src="https://github.com/user-attachments/assets/bc206a62-4b37-4064-a1af-872e7a157463" width="200" alt="MENTARI Logo">

  # MENTARI MOD
  ### *Manajemen Terpadu Pembelajaran Daring*

  [![GitHub issues](https://img.shields.io/github/issues/Lukman754/mentari-unpam?color=green&style=for-the-badge)](https://github.com/Lukman754/mentari-unpam/issues)
  [![GitHub stars](https://img.shields.io/github/stars/Lukman754/mentari-unpam?style=for-the-badge)](https://github.com/Lukman754/mentari-unpam/stargazers)
  [![GitHub license](https://img.shields.io/github/license/Lukman754/mentari-unpam?style=for-the-badge)](https://github.com/Lukman754/mentari-unpam)
</div>

---

## Tentang MENTARI

**MENTARI** (_Manajemen Terpadu Pembelajaran Daring_) merupakan platform pembelajaran digital yang digunakan oleh civitas akademika Universitas Pamulang.

**MENTARI MOD** adalah browser extension yang dikembangkan untuk memberikan fitur tambahan pada platform MENTARI, khususnya dalam membantu mahasiswa memantau dan menindaklanjuti aktivitas forum diskusi.

Extension ini berfokus pada penyederhanaan proses pemantauan forum yang sedang berjalan sehingga mahasiswa tidak perlu mencarinya satu per satu melalui halaman e-learning.

## Fitur Utama

- Melacak forum diskusi yang belum dikerjakan.
- Menampilkan informasi forum diskusi melalui popup extension.
- Membalas forum diskusi langsung melalui popup.
- Mempercepat proses pelacakan forum.
- Menyediakan berbagai shortcut untuk mempermudah penggunaan MENTARI.
- Memusatkan informasi dan fungsi utama dalam satu popup.

## Perubahan Terakhir

Versi terakhir Mentari Mod membawa beberapa perubahan utama:

- Menghapus fitur **AI Assistant**.
- Mengoptimalkan proses pelacakan forum diskusi.
- Menambahkan fitur untuk **membalas forum diskusi langsung melalui popup**.
- Memusatkan informasi dan fitur utama ke dalam popup extension.
- Menyederhanakan alur penggunaan agar proses pemantauan dan tindak lanjut forum dapat dilakukan dari satu tempat.

Dengan perubahan tersebut, popup Mentari Mod menjadi pusat utama untuk **memantau dan menindaklanjuti forum diskusi**.

## Screenshots

<div align="center">
  <img width="863" height="452" alt="Mentari Mod Screenshot" src="https://github.com/user-attachments/assets/18a7b96d-e472-4381-9ea2-1f421a04826e" />
  <img width="863" height="452" alt="Mentari Mod Screenshot" src="https://github.com/user-attachments/assets/aecbbf0a-1be0-4b7f-abe6-0a83767992aa" />
</div>

## Download

<p align="center">
  <a href="https://github.com/lukman754/Mentari-Unpam/releases/download/v2.1/Mentari.Mod.v2.0.Sunset.zip">
    <img src="https://img.shields.io/badge/Download-Mentari%20Mod%20v2.0%20Sunset-c29e15?style=for-the-badge&logo=github&logoColor=white" alt="Download Mentari Mod">
  </a>
</p>

## Instalasi

### Windows / macOS (Chromium)

Kompatibel dengan browser berbasis Chromium seperti **Google Chrome, Microsoft Edge, dan Brave**.

1. Unduh file `Mentari.Mod.v2.0.Sunset.zip`.
2. Ekstrak file ZIP ke folder di komputer.
3. Buka browser Chromium.
4. Buka `chrome://extensions/`.
5. Aktifkan **Developer Mode / Mode Pengembang**.
6. Klik **Load unpacked**.
7. Pilih folder hasil ekstraksi.
8. Extension siap digunakan.

### Windows / macOS / Linux (Firefox, Zen Browser, LibreWolf)

Kompatibel dengan browser berbasis Gecko lewat `browser_specific_settings.gecko` di `manifest.json`.

1. Unduh dan ekstrak file ZIP ke folder di komputer.
2. Buka `about:debugging#/runtime/this-firefox`.
3. Klik **Load Temporary Add-on...**.
4. Pilih file `manifest.json` dari folder hasil ekstraksi.
5. Extension siap digunakan! (add-on sementara hilang saat browser ditutup — ulangi langkah ini, atau instal XPI yang sudah ditandatangani agar permanen)

## AI Provider: OMP (muse-spark) atau Gemini

Ekstensi mendukung dua backend AI (pengaturan di popup token → tab Pengaturan → AI Provider):

| Provider | Cara kerja | Syarat |
|---|---|---|
| **OMP** (default) | Browser → `POST http://127.0.0.1:4000/v1/chat/completions` (`model: opencode-zen/muse-spark-1.3-contributor-free`) → lokal `omp auth-gateway serve` | Jalankan `omp auth-gateway serve` (butuh `OMP_AUTH_BROKER_URL` + login broker untuk model muse-spark). Cek status via tombol **Cek Gateway** di pengaturan. |
| **Gemini** (legacy) | Langsung ke `generativelanguage.googleapis.com` | API key Google AI Studio via **Update API Key**. |

Tanpa gateway yang berjalan, provider OMP menampilkan instruksi `omp auth-gateway serve` dan tidak meminta API key. Pilih **Gemini** untuk tetap memakai API key seperti sebelumnya. Gateway membutuhkan host permission `http://127.0.0.1/*` dan `http://localhost/*` yang sudah dideklarasikan di `manifest.json`.

### Mises Browser

Mises Browser mendukung penggunaan extension pada perangkat mobile.

1. Unduh dan instal **Mises Browser** dari App Store atau Play Store.
2. Buka Mises Browser.
3. Buka menu di pojok kanan atas.
4. Pilih **Extensions**.
5. Aktifkan **Developer Mode**.
6. Pilih opsi **+ (from .zip/.crx/.user.js)**.
7. Pilih file Mentari Mod.
8. Buka atau refresh halaman MENTARI.

## FAQ

### Apakah Mentari Mod aman digunakan?

Mentari Mod dirancang sebagai alat bantu mahasiswa untuk mempermudah pemantauan forum diskusi dan penggunaan platform MENTARI melalui berbagai fitur tambahan dan shortcut.

Namun, karena proyek ini sudah tidak lagi dikembangkan secara aktif, pengguna disarankan untuk meninjau source code sebelum menggunakannya dan memahami izin yang digunakan oleh extension.

### Apakah Mentari Mod mengerjakan forum diskusi secara otomatis?

Tidak. Mentari Mod berfungsi untuk **membantu melacak dan mengelola forum diskusi yang perlu ditindaklanjuti**. Pengguna tetap bertanggung jawab atas isi dan aktivitas yang dilakukan melalui extension.

## Open Source

Mentari Mod kini tersedia sebagai proyek open source. Pengembang lain dipersilakan untuk:

- Fork dan memodifikasi proyek.
- Memperbaiki bug.
- Menambahkan fitur baru.
- Menyesuaikan extension dengan perubahan platform.
- Melanjutkan pengembangan proyek.
- Mengirimkan perubahan melalui Pull Request.

Kontribusi yang relevan dan bermanfaat dipersilakan.

## Disclaimer

Mentari Mod dibuat sebagai proyek independen untuk membantu aktivitas mahasiswa.

Proyek ini **tidak berafiliasi secara resmi dengan Universitas Pamulang maupun pengelola platform e-learning terkait**.

Penggunaan extension sepenuhnya menjadi tanggung jawab pengguna. Pastikan penggunaan extension tetap mengikuti kebijakan dan ketentuan platform yang berlaku.

## Lisensi

Proyek ini dilisensikan di bawah **[MIT License](LICENSE)**.

Lihat file [LICENSE](LICENSE) untuk informasi lebih lanjut.
## 🚀 Tentang MENTARI

**MENTARI** (*Manajemen Terpadu Pembelajaran Daring*) adalah platform pembelajaran digital modern yang dirancang untuk menggantikan [e-learning.unpam.ac.id](https://e-learning.unpam.ac.id). Platform ini menawarkan pengalaman belajar yang lebih intuitif, efisien, dan menyenangkan bagi civitas akademika Universitas Pamulang.

**MENTARI MOD** hadir sebagai ekstensi browser yang memperkaya platform ini dengan berbagai fitur tambahan untuk memaksimalkan produktivitas dalam pembelajaran daring.

<div align="center">
  <img src="https://github.com/user-attachments/assets/13180860-d3fd-4a38-8043-9171dc8d4a17" width="85%" alt="Mentari Mod Preview">
</div>

## 💫 Mengapa MENTARI MOD?

| Keunggulan | Deskripsi |
|------------|-----------|
| 🎨 **Desain Modern** | Antarmuka yang intuitif dengan tampilan yang segar dan kontemporer |
| 🔍 **Akses Cepat** | Forum diskusi dapat diakses tanpa perlu membuka setiap pertemuan |
| 🤖 **Bantuan AI** | Asisten berbasis kecerdasan buatan untuk meningkatkan produktivitas |
| 🎯 **Efisiensi** | Menghemat waktu dengan fitur otomatisasi tugas yang repetitif |

## 💎 Fitur Utama

### 🧩 Mentari Mod

- **📊 Info Profil** — Menampilkan nama dan NIM mahasiswa secara jelas dan transparan
- **💬 Pelacakan Forum** — Melihat forum aktif dan opsi menyembunyikan course yang telah selesai
- **👥 Pengelolaan Kelas** — Akses cepat ke daftar mahasiswa dalam kelas untuk kolaborasi
- **🔄 Pembagian Kelompok** — Fitur untuk mengelompokkan mahasiswa dengan jumlah yang dapat disesuaikan

### 📝 Quiz Helper

- **✅ Jawaban Otomatis** — Menjawab semua soal quiz secara otomatis tanpa intervensi manual
- **⏱️ Penghematan Waktu** — Fokus pada pemahaman materi, bukan pada mekanisme pengisian kuis

### 🤖 Gemini Assistant

- **💬 Chatbot AI** — Asisten berbasis AI menggunakan model gemini-2.0-flash-thinking
- **📋 Format Prompt** — Berbagai pilihan format respons untuk kebutuhan yang berbeda
- **📥 Paste Questions** — Ekstraksi otomatis pertanyaan dari dosen atau soal kuis
- **📤 Copy To Textarea** — Transfer jawaban AI langsung ke kotak teks respons

## 📱 Demo & Tampilan

<div align="center">
  <table>
    <tr>
      <td width="50%">
        <img src="https://github.com/user-attachments/assets/b19f5120-c127-4003-9d58-5f7d1b3d9fac" width="100%" alt="Login Page">
        <p align="center"><b>Halaman Login</b></p>
      </td>
      <td width="50%">
        <img src="https://github.com/user-attachments/assets/13180860-d3fd-4a38-8043-9171dc8d4a17" width="100%" alt="Mentari Mod">
        <p align="center"><b>Dashboard dengan Mod</b></p>
      </td>
    </tr>
  </table>
</div>

## 📦 Download
<div style="width: 100%; display: flex; gap: 10px;">
    <a href="https://github.com/lukman754/Mentari-Unpam/releases/download/v1.8.1/Mentari-Unpam-v1.8.1.zip" style="display: block; width: 60%;">
        <img src="https://img.shields.io/badge/Download-Extension%20ZIP-FFA000?style=for-the-badge&logo=googlechrome" style="width: 60%;">
    </a>
    <a href="https://github.com/lukman754/Mentari-Unpam/releases/download/v1.5/Mentari-Mod-v1.5.apk" style="display: block; width: 60%;">
        <img src="https://img.shields.io/badge/Download-Android%20APK-3DDC84?style=for-the-badge&logo=android" style="width: 60%;">
    </a>
    <a href="https://github.com/lukman754/Mentari-Unpam/releases/download/v1.5/Mentari.Mod.Setup.1.0.0.exe" style="display: block; width: 60%;">
        <img src="https://custom-icon-badges.demolab.com/badge/Download-Windows%20Setup-0078D6?style=for-the-badge&logo=windows11" style="width: 60%;">
    </a>
  
</div>

## 📥 Cara Instalasi

### 📺 Video Tutorial

<div align="center">
  <a href="https://youtu.be/4CDs7ZwEq0c" target="_blank">
    <img src="https://img.youtube.com/vi/4CDs7ZwEq0c/0.jpg" width="60%" alt="Tutorial Video">
    <p>Klik untuk menonton tutorial instalasi lengkap</p>
  </a>
</div>

### 💻 Windows/macOS (Chrome, Edge, Brave)

```
1️⃣ Unduh file ekstensi mentari-mod.zip
2️⃣ Ekstrak file zip ke folder di komputer Anda
3️⃣ Buka browser Chromium (Chrome/Edge/Brave)
4️⃣ Ketik chrome://extensions/ di address bar
5️⃣ Aktifkan "Mode Pengembang" (toggle di pojok kanan)
6️⃣ Klik "Load unpacked" dan pilih folder hasil ekstraksi
7️⃣ Ekstensi siap digunakan! ✨
```

### 📱 Mises Browser (iOS/Android)

```
1️⃣ Download Mises Browser (AppStore/PlayStore)
2️⃣ Buka Mises Browser di perangkat Anda
3️⃣ Ketuk menu (tiga titik) di pojok kanan atas
4️⃣ Pilih "Extensions"
5️⃣ Aktifkan "Developer Mode"
6️⃣ Klik "+ (from .zip/.crx/.user.js)"
7️⃣ Pilih file mentari-unpam-main.zip
8️⃣ Refresh halaman MENTARI ✨
```

## ❓ FAQ

<details>
<summary><b>🔒 Apakah ekstensi ini aman digunakan?</b></summary>
<div style="padding: 10px;">
  Ya, ekstensi ini dikembangkan khusus untuk membantu mahasiswa UNPAM dalam pembelajaran daring. Kami tidak mengumpulkan data pribadi pengguna. Semua fitur berjalan di sisi klien dan tidak mengirimkan data ke server eksternal.
</div>
</details>

<details>
<summary><b>🔄 Bagaimana cara update ke versi terbaru?</b></summary>
<div style="padding: 10px;">
  Kunjungi halaman GitHub kami secara berkala untuk mendapatkan informasi pembaruan. Untuk update, cukup hapus ekstensi lama dan instal versi terbaru dengan mengikuti langkah instalasi di atas.
</div>
</details>

<details>
<summary><b>🔮 Fitur apa yang akan datang?</b></summary>
<div style="padding: 10px;">
  <b>Punya ide untuk fitur baru?</b> Buka <a href="https://github.com/Lukman754/mentari-unpam/issues">issue baru</a> dan bagikan ide Anda!.
</div>
</details>

## 📄 Lisensi

Proyek ini dilisensikan di bawah [MIT License](LICENSE) - lihat file LICENSE untuk detail lebih lanjut.

---

<div align="center">

### Mentari Mod

Dikembangkan oleh [Lukman Muludin (ex maintainer)](https://github.com/lukman754)
Dikembangkan oleh [myamusashi](https://github.com/myamusashi)

[![GitHub](https://img.shields.io/badge/GitHub-Lukman754-181717?style=for-the-badge&logo=github)](https://github.com/lukman754)
[![Instagram](https://img.shields.io/badge/Instagram-_.chopin-E4405F?style=for-the-badge&logo=instagram)](https://instagram.com/_.chopin)
[![Support Me](https://img.shields.io/badge/Support%20with%20Coffee-FF813F?style=for-the-badge&logo=buymeacoffee&logoColor=white)](https://saweria.co/chopin)

Copyright © 2025 [Lukman Muludin](https://github.com/lukman754)

</div>
  <p>Dibuat dengan ❤️ untuk mahasiswa UNPAM</p>

  [![GitHub](https://img.shields.io/badge/Follow-GitHub-181717?style=for-the-badge&logo=github)](https://github.com/lukman754)
  [![Instagram](https://img.shields.io/badge/Follow-Instagram-E4405F?style=for-the-badge&logo=instagram)](https://instagram.com/_.chopin)
  [![Support Me](https://img.shields.io/badge/Support_with_Coffee-FF813F?style=for-the-badge&logo=buymeacoffee&logoColor=white)](https://saweria.co/chopin)

  <p>© 2025 <a href="https://instagram.com/_.chopin">Lukman Muludin</a>. All Rights Reserved.</p>
</div>
