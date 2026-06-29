# prodibot

## Apa itu ProdiBot? 🤖

**ProdiBot** adalah **chatbot asisten produktivitas personal** yang dibangun dengan teknologi:

| Komponen | Teknologi |
|---|---|
| **Backend** | Node.js + Express |
| **AI Engine** | Google Gemini API (`gemini-2.5-flash`) |
| **Frontend** | HTML/CSS/JS (static files) |

### Fungsi Utama

ProdiBot dirancang untuk membantu pengguna dalam hal:

- 📋 **Manajemen tugas** — mengatur to-do list, jadwal, dan prioritas harian
- ⏰ **Tips produktivitas** — manajemen waktu dan fokus kerja
- 💪 **Motivasi** — memberikan kata-kata penyemangat
- 💡 **Brainstorming** — membantu ide dan perencanaan proyek
- 🌱 **Pengembangan diri** — menjawab pertanyaan seputar produktivitas

### Cara Kerja

1. User mengirim pesan via frontend → `POST /api/chat`
2. Server meneruskan pesan ke **Gemini API** dengan system instruction (persona ProdiBot)
3. Gemini merespons dan server mengirim balasan ke user
4. Chat history disimpan **in-memory** per session (hilang saat server restart)

### API Endpoints

| Endpoint | Method | Fungsi |
|---|---|---|
| `/api/chat` | POST | Kirim pesan dan terima balasan |
| `/api/reset` | POST | Reset sesi chat |
| `/api/health` | GET | Health check server |

---
