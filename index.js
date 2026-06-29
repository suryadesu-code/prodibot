require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { GoogleGenerativeAI } = require("@google/generative-ai");

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static("public"));

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Store chat histories per session (in-memory)
const chatSessions = new Map();

// System instruction for productivity assistant persona
const SYSTEM_INSTRUCTION = `Kamu adalah "ProdiBot" — asisten produktivitas personal yang cerdas, ramah, dan penuh semangat.

Peranmu:
- Membantu pengguna mengatur tugas, jadwal, dan prioritas harian mereka.
- Memberikan tips produktivitas, manajemen waktu, dan fokus kerja.
- Memotivasi pengguna dengan kata-kata penyemangat.
- Membantu brainstorming ide, membuat to-do list, dan perencanaan proyek.
- Menjawab pertanyaan umum seputar produktivitas dan pengembangan diri.

Gaya komunikasi:
- Gunakan bahasa Indonesia yang santai tapi tetap profesional.
- Gunakan emoji secukupnya untuk membuat percakapan lebih hidup 🎯✨📋
- Berikan jawaban yang terstruktur dan mudah dipahami.
- Jika pengguna bertanya di luar topik produktivitas, jawab dengan singkat lalu arahkan kembali ke topik produktivitas.

Format jawaban:
- Gunakan bullet points atau numbered list jika diperlukan.
- Berikan contoh konkret jika memungkinkan.
- Batasi jawaban agar tidak terlalu panjang (maksimal 300 kata) kecuali diminta detail.`;

// POST /api/chat — Send a message and get a response
app.post("/api/chat", async (req, res) => {
  try {
    const { message, sessionId } = req.body;

    if (!message) {
      return res.status(400).json({ error: "Message is required" });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({
        error: "Gemini API key belum dikonfigurasi. Silakan isi GEMINI_API_KEY di file .env",
      });
    }

    const sid = sessionId || "default";

    // Get or create chat session
    if (!chatSessions.has(sid)) {
      const model = genAI.getGenerativeModel({
        model: "gemini-2.5-flash",
        systemInstruction: SYSTEM_INSTRUCTION,
      });

      const chat = model.startChat({
        history: [],
        generationConfig: {
          maxOutputTokens: 2048,
          temperature: 0.7,
        },
      });

      chatSessions.set(sid, chat);
    }

    const chat = chatSessions.get(sid);
    const result = await chat.sendMessage(message);
    const response = result.response.text();

    res.json({ reply: response });
  } catch (error) {
    console.error("Gemini API Error:", error);
    res.status(500).json({
      error: "Terjadi kesalahan saat menghubungi Gemini API. Pastikan API key valid.",
    });
  }
});

// POST /api/reset — Reset chat session
app.post("/api/reset", (req, res) => {
  const { sessionId } = req.body;
  const sid = sessionId || "default";
  chatSessions.delete(sid);
  res.json({ message: "Chat session telah direset." });
});

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Start server
app.listen(PORT, () => {
  console.log(`\n🚀 ProdiBot server running at http://localhost:${PORT}`);
  console.log(`📋 Personal Productivity Assistant siap membantu!\n`);
});
