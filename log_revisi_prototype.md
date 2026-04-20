# Log Revisi Pengembangan Prototype

Dokumen ini berisi log analisis terhadap revisi purwarupa (prototype) yang mencatat perubahan struktural maupun perbaikan tampilan antarmuka (UI/UX). Data ini disusun berdasarkan siklus tahapan evaluasi dan pembaruan struktur *codebase*.

### Tabel Log Evaluasi dan Revisi

| No | Bagian | Iterasi | Masalah / Hasil Evaluasi | Tindakan Perbaikan (Solusi) | Status |
|:---|:---|:---:|:---|:---|:---:|
| **1** | **Layout & Header** <br/>(`app/component/header.js`) | 1 | Pada saat evaluasi *User Interface*, tata letak ujung bagian kiri dari header tertimpa (overlap) oleh rentangan sidebar. Tampilan tidak konsisten dengan tata letak konten utama (kartu dan grafik). | Menyelaraskan struktur tata letak (grid/flex) dari header supaya dirender persis bersebelahan di sisi kanan sidebar sehingga menyesuaikan bentang *width* konten sekitarnya. | ✅ Selesai |
| **2** | **Logic Data Sensor** <br/>(`app/component/grafik.js` & `kartu.js`) | 1 | Ditemukan penulisan kode berulang (*Code Duplication*) untuk menangani logika batas ambang sensor seperti fungsi `getLevel`, warna status `getStatusColor`, serta label `getStatusLabel` pada komponen yang berbeda. | Melakukan abstraksi (*Refactoring*) sentral dengan memindahkan konfigurasi ambang batas (*threshold*) tersebut ke dalam sebuah modul utilitas sistem yang independen (yakni `utils/sensorUtils.js`). | ✅ Selesai |
| **3** | **Struktur UI Grafik** <br/>(`app/component/grafik.js`) | 1 | Pembacaan dan modifikasi kode pada fungsi *Radar Chart*  sangat rumit dikarenakan deklarasi perenderan diagram yang menumpuk panjang menjadi satu di modul utama fungsi komponen. | Memecah bagian-bagian elemen visual yang spesifik menjadi sub-komponen terpisah, dalam hal ini seperti pembuatan fungsi terpisah untuk `StatusLegend`, `RadarDotMarker`, dan `RadarTickLabel`. | ✅ Selesai |
| **4** | **Responsivitas Dimensi** <br/>(`app/component/grafik.js`) | 1 | Pelacakan dan re-render ketika window browser berubah ukurannya (*resize*) digabungkan secara langsung dengan manajemen state komponen visualisasi grafik (`useEffect` yang repetitif). | Membangun dan melampirkan sebuah pola desain *Custom Hook* bernama `useWindowWidth` untuk manajemen _event listener_ perenderan ukuran layar yang lebih stabil. | ✅ Selesai |
| **5** | **Format Waktu Sinkronisasi** <br/>(`utils/sensorUtils.js`) | 1 | Tidak ada konsistensi terpusat terkait pemformatan pembacaan *timestamp* sensor dari server ke dalam format bahasa yang *human-readable*, sering memunculkan celah *bug* saat *rendering*. | Menyempurnakan utilitas pemformatan waktu (`formatSyncTs` menjadi utilitas `formatTimestamp`) pada modul dasar aplikasi agar fungsi-fungsi terkait tidak memproses mentahan string API secara manual lagi. | ✅ Selesai |

---

> [!NOTE]
> **Metodologi Prototype:** Log di atas merupakan ikhtisar perputaran (iterasi) *feedback* dari pengujian fungsional dan pengamatan tampilan visual, di mana perbaikan (_Refactoring_ & perbaikan _Layout_) sudah diintegrasikan langsung ke dalam baris kode.
