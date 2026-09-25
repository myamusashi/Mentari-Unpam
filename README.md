<div align="center">
  <img src="https://github.com/user-attachments/assets/bc206a62-4b37-4064-a1af-872e7a157463" width="200" alt="MENTARI Logo">
  
  # MENTARI MOD
  ### *Manajemen Terpadu Pembelajaran Daring*
  
  [![GitHub issues](https://img.shields.io/github/issues/Lukman754/mentari-unpam?color=green&style=for-the-badge)](https://github.com/Lukman754/mentari-unpam/issues)
  [![GitHub stars](https://img.shields.io/github/stars/Lukman754/mentari-unpam?style=for-the-badge)](https://github.com/Lukman754/mentari-unpam/stargazers)
  [![GitHub license](https://img.shields.io/github/license/Lukman754/mentari-unpam?style=for-the-badge)](https://github.com/Lukman754/mentari-unpam)
</div>

## Tentang MENTARI

**MENTARI** (*Manajemen Terpadu Pembelajaran Daring*) adalah platform pembelajaran digital modern yang dirancang untuk menggantikan [e-learning.unpam.ac.id](https://e-learning.unpam.ac.id). Platform ini menawarkan pengalaman belajar yang lebih intuitif, efisien, dan menyenangkan bagi civitas akademika Universitas Pamulang.

**MENTARI MOD** hadir sebagai ekstensi browser yang memperkaya platform ini dengan berbagai fitur tambahan untuk memaksimalkan produktivitas dalam pembelajaran daring.

<div align="center">
  <img src="https://github.com/user-attachments/assets/27c2d68e-c8c7-44b8-8113-52dd61c5b957" width="100%" alt="Mentari Mod Preview">
  <img src="https://github.com/user-attachments/assets/5dddf84e-2da9-4a6d-900d-2ed5f3a99b5d" width="100%" alt="Mentari Mod Preview">
</div>

## AI Provider: OMP (muse-spark) atau Gemini

Ekstensi mendukung dua backend AI (pengaturan di popup Start Tracking → AI Provider):

| Provider | Cara kerja | Syarat |
|---|---|---|
| **OMP** (default) | Browser → `POST http://127.0.0.1:4000/v1/chat/completions` (`model: opencode-zen/muse-spark-1.3-contributor-free`) → lokal `omp auth-gateway serve` | Jalankan `omp auth-gateway serve` (butuh `OMP_AUTH_BROKER_URL` + login broker untuk model muse-spark). Cek status via tombol **Cek Gateway** di pengaturan. |
| **Gemini** (legacy) | Langsung ke `generativelanguage.googleapis.com` | API key Google AI Studio via **Update API Key**. |

Tanpa gateway yang berjalan, provider OMP menampilkan instruksi `omp auth-gateway serve` dan tidak meminta API key. Pilih **Gemini** untuk tetap memakai API key seperti sebelumnya.

## Fitur Utama
### Mentari Mod
- **Pelacakan Forum Diskusi** — Melacak Forum Diskusi yang diupload oleh dosen dan harus dikerjakan oleh mahasiswa.
- **Pengelompokan Mahasiswa** — Mengelompokan mahasiswa dengan sistem acak, dapat menentukan jumlah kelompok sesuai kebutuhan.
- **Notifikasi** — Menampilkan notifikasi balasan dosen di forum diskusi.
- **Setting** — Menu pusat pengaturan, seperti mengganti Apikey, pemeriksaan update Mentari Mod, mengaktifkan Gemini Assistant dan Auto Finish Quiz.

### Quiz Helper
- **Jawaban Otomatis** — Menjawab semua soal quiz secara otomatis tanpa intervensi manual dalam waktu kurang dari 10 detik

### Gemini Assistant
- **Chatbot AI** — Asisten berbasis AI menggunakan model gemini-2.0-flash-thinking
- **Format Prompt** — Berbagai pilihan format respons untuk kebutuhan yang berbeda
- **Paste Questions** — Ekstraksi otomatis pertanyaan dari dosen atau soal kuis
- **Copy To Textarea** — Transfer jawaban AI langsung ke kotak teks Reply

## 📦 Download
<div style="width: 100%; display: flex; gap: 10px;">
    <a href="https://github.com/lukman754/Mentari-Unpam/releases/download/v1.9/Mentari-Unpam-v1.9.zip" style="display: block; width: 60%;">
        <img src="https://img.shields.io/badge/Download-Extension%20ZIP-FFA000?style=for-the-badge&logo=googlechrome" style="width: 60%;">
    </a>
</div>

## Cara Instalasi
### Windows/macOS (Chrome, Edge, Brave)
```
1️. Unduh file ekstensi mentari-mod.zip
2️. Ekstrak file zip ke folder di komputer Anda
3️. Buka browser Chromium (Chrome/Edge/Brave)
4️. Ketik chrome://extensions/ di address bar
5️. Aktifkan "Mode Pengembang" (toggle di pojok kanan)
6️. Klik "Load unpacked" dan pilih folder hasil ekstraksi
7️. Ekstensi siap digunakan! 
```

### Windows/macOS/Linux (Firefox, Zen-browser, Librewolf)
```
1️. Unduh file ekstensi mentari-firefox.zip (build Firefox) atau mentari-mod.zip
2️. Buka about:debugging#/runtime/this-firefox
3️. Klik "Load Temporary Add-on..."
4️. Pilih file manifest.json dari folder hasil ekstraksi (atau file .zip/.xpi hasil build)
5️. Ekstensi siap digunakan! (add-on sementara hilang saat browser ditutup — ulangi langkah ini, atau instal XPI yang sudah ditandatangani agar permanen)
```

### Mises Browser (iOS/Android)
```
1️. Download Mises Browser (AppStore/PlayStore)
2️. Buka Mises Browser di perangkat Anda
3️. Ketuk menu (tiga titik) di pojok kanan atas
4️. Pilih "Extensions"
5️. Aktifkan "Developer Mode"
6️. Klik "+ (from .zip/.crx/.user.js)"
7️. Pilih file Mentari od.zip
8️. Refresh halaman MENTARI 
```

## FAQ

<details>
<summary><b>Apakah ekstensi ini aman digunakan?</b></summary>
<div style="padding: 10px;">
  Ya, ekstensi ini dikembangkan khusus untuk membantu mahasiswa UNPAM dalam pembelajaran daring. Kami tidak mengumpulkan data pribadi pengguna. Semua fitur berjalan di sisi klien dan tidak mengirimkan data ke server eksternal.
</div>
</details>

<details>
<summary><b>Bagaimana cara update ke versi terbaru?</b></summary>
<div style="padding: 10px;">
  Kunjungi halaman GitHub kami secara berkala untuk mendapatkan informasi pembaruan. Untuk update, cukup hapus ekstensi lama dan instal versi terbaru dengan mengikuti langkah instalasi di atas.
</div>
</details>

<details>
<summary><b>Fitur apa yang akan datang?</b></summary>
<div style="padding: 10px;">
  <b>Punya ide untuk fitur baru?</b> Buka <a href="https://github.com/Lukman754/mentari-unpam/issues">issue baru</a> dan bagikan ide Anda!.
</div>
</details>

## 📄 Lisensi

Proyek ini dilisensikan di bawah [MIT License](LICENSE) - lihat file LICENSE untuk detail lebih lanjut.

---

<div align="center">
  <p>Dibuat dengan ❤️ untuk mahasiswa UNPAM</p>

  [![GitHub](https://img.shields.io/badge/Follow-GitHub-181717?style=for-the-badge&logo=github)](https://github.com/lukman754)
  [![Instagram](https://img.shields.io/badge/Follow-Instagram-E4405F?style=for-the-badge&logo=instagram)](https://instagram.com/_.chopin)
  [![Support Me](https://img.shields.io/badge/Support_with_Coffee-FF813F?style=for-the-badge&logo=buymeacoffee&logoColor=white)](https://saweria.co/chopin)

  <p>© 2025 <a href="https://instagram.com/_.chopin">Lukman Muludin</a>. All Rights Reserved.</p>
</div>

