[English](../README.md) · [한국어](README.ko.md) · [简体中文](README.zh-Hans.md) · [繁體中文](README.zh-Hant.md) · [日本語](README.ja.md) · [Español](README.es.md) · [Français](README.fr.md) · [Bahasa Indonesia](README.id.md) · [ไทย](README.th.md)

# choboza-pack

Dua mod kecil untuk Claude Code, dibuat untuk pemula. Mod ini berjalan sebagai kode lokal di PC Anda.

## Isi

| Mod | Fungsinya |
|---|---|
| **usage-line** | Satu baris di atas kotak prompt: pemakaian 5 jam dan mingguan, model saat ini, effort, dan konteks. Di Windows juga menampilkan beban CPU, RAM, GPU, dan NPU. |
| **lab-panel** | Panel di samping dengan daftar file berwarna. File yang dibaca atau diubah Claude akan menyala sebentar. Tab ulang menampilkan perubahan dari giliran terakhir. Tab catatan bisa Anda pakai untuk catatan sendiri. Di Windows ada juga tab sketsa untuk menggambar di atas gambar. |

## Instalasi

Ketik ini di Claude Code:

```
/plugin marketplace add miguel-a-mir-ctrl/choboza-pack
/plugin install usage-line@choboza-pack
/plugin install lab-panel@choboza-pack
```

Lalu mulai ulang Claude Code (atau jalankan `/reload-plugins`). Buka panel dengan `/panel`.

## Pengaturan

Ubah di pengaturan plugin (`/plugin`).

| Mod | Pengaturan | Nilai |
|---|---|---|
| keduanya | `language` | `auto` (bahasa sistem Anda), `ko`, `en`, `zh-Hans`, `zh-Hant`, `ja`, `es`, `fr`, `id`, `th` |
| lab-panel | `icons` | `nerd` (ikon jenis file, bawaan), `plain` (huruf sederhana) |
| lab-panel | `autoOpen` | `true` = buka panel saat sesi dimulai (bawaan `false`) |
| lab-panel | `tabsDir` | Folder untuk tab catatan. Kosong = `~/.claude/choboza-pack/panel` |

## Ikon tampil sebagai kotak?

Daftar file memakai ikon [Nerd Font](https://www.nerdfonts.com/font-downloads). Jika Anda melihat □ alih-alih ikon, lakukan salah satu:

- pasang Nerd Font dan pilih di pengaturan font terminal Anda
- ubah `icons` menjadi `plain`

## Catatan

- Hampir nol token: mod berjalan di PC Anda dan tidak menambahkan apa pun ke yang dibaca Claude, kecuali satu catatan singkat (sekitar 20 token) saat konteks melewati 100k, yang menyarankan `/compact` atau sesi baru. Diukur 2026-11-01: token input sama dengan dan tanpa paket ini (dalam selisih normal antar percobaan).
- Tab sketsa dan indikator CPU/GPU hanya untuk Windows. Sisanya bisa dipakai di mana saja.
- Terjemahan selain bahasa Korea dan Inggris dibuat oleh mesin. Perbaikan sangat diterima.

## Lisensi

[MIT](../LICENSE)
