// ===================================================
// ProdiBot — Frontend Chat Logic
// Personal Productivity Assistant
// ===================================================

const DOM = {
  chatContainer: document.getElementById("chatContainer"),
  messages: document.getElementById("messages"),
  welcomeScreen: document.getElementById("welcomeScreen"),
  messageInput: document.getElementById("messageInput"),
  sendBtn: document.getElementById("sendBtn"),
  resetBtn: document.getElementById("resetBtn"),
  newChatBtn: document.getElementById("newChatBtn"),
  themeCheckbox: document.getElementById("themeCheckbox"),
  sidebar: document.getElementById("sidebar"),
  sidebarOverlay: document.getElementById("sidebarOverlay"),
  menuBtn: document.getElementById("menuBtn"),
  sidebarCloseBtn: document.getElementById("sidebarCloseBtn"),
  statusBadge: document.getElementById("statusBadge"),
};

// ── State ──
let isLoading = false;
const sessionId = crypto.randomUUID ? crypto.randomUUID() : Date.now().toString();

// ── Theme Management ──
function initTheme() {
  const saved = localStorage.getItem("prodibot-theme");
  if (saved === "dark") {
    document.documentElement.setAttribute("data-theme", "dark");
    DOM.themeCheckbox.checked = true;
  }
}

function toggleTheme() {
  const isDark = DOM.themeCheckbox.checked;
  document.documentElement.setAttribute("data-theme", isDark ? "dark" : "light");
  localStorage.setItem("prodibot-theme", isDark ? "dark" : "light");
}

// ── Sidebar ──
function openSidebar() {
  DOM.sidebar.classList.add("open");
  DOM.sidebarOverlay.classList.add("active");
}

function closeSidebar() {
  DOM.sidebar.classList.remove("open");
  DOM.sidebarOverlay.classList.remove("active");
}

// ── Chat Helpers ──
function getCurrentTime() {
  return new Date().toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatMarkdown(text) {
  // Convert markdown-like formatting to HTML
  let html = text;

  // Bold: **text**
  html = html.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");

  // Italic: *text*
  html = html.replace(/(?<!\*)\*(?!\*)(.*?)(?<!\*)\*(?!\*)/g, "<em>$1</em>");

  // Code blocks: ```code```
  html = html.replace(/```([\s\S]*?)```/g, "<pre><code>$1</code></pre>");

  // Inline code: `code`
  html = html.replace(/`([^`]+)`/g, "<code>$1</code>");

  // Headers
  html = html.replace(/^### (.*$)/gm, "<h3>$1</h3>");
  html = html.replace(/^## (.*$)/gm, "<h2>$1</h2>");
  html = html.replace(/^# (.*$)/gm, "<h1>$1</h1>");

  // Numbered lists
  html = html.replace(/^\d+\.\s+(.*$)/gm, "<li>$1</li>");

  // Bullet lists
  html = html.replace(/^[-•]\s+(.*$)/gm, "<li>$1</li>");

  // Wrap consecutive <li> in <ul>
  html = html.replace(/((?:<li>.*<\/li>\n?)+)/g, "<ul>$1</ul>");

  // Line breaks → paragraphs
  html = html
    .split("\n\n")
    .map((para) => {
      para = para.trim();
      if (!para) return "";
      if (
        para.startsWith("<h") ||
        para.startsWith("<ul") ||
        para.startsWith("<ol") ||
        para.startsWith("<pre")
      ) {
        return para;
      }
      return `<p>${para}</p>`;
    })
    .join("");

  // Single line breaks within paragraphs
  html = html.replace(/(?<!<\/p>|<\/li>|<\/h[1-3]>|<\/pre>|<\/ul>|<\/ol>)\n(?!<)/g, "<br>");

  return html;
}

function addMessage(content, role, isError = false) {
  // Hide welcome screen
  DOM.welcomeScreen.style.display = "none";

  const messageDiv = document.createElement("div");
  messageDiv.className = `message ${role}`;

  const avatar = document.createElement("div");
  avatar.className = "message-avatar";
  avatar.textContent = role === "bot" ? "⚡" : "👤";

  const bubbleWrapper = document.createElement("div");

  const bubble = document.createElement("div");
  bubble.className = `message-bubble${isError ? " error-bubble" : ""}`;

  if (role === "bot") {
    bubble.innerHTML = formatMarkdown(content);
  } else {
    bubble.textContent = content;
  }

  const time = document.createElement("div");
  time.className = "message-time";
  time.textContent = getCurrentTime();

  bubbleWrapper.appendChild(bubble);
  bubbleWrapper.appendChild(time);

  messageDiv.appendChild(avatar);
  messageDiv.appendChild(bubbleWrapper);

  DOM.messages.appendChild(messageDiv);
  scrollToBottom();
}

function showTypingIndicator() {
  const indicator = document.createElement("div");
  indicator.className = "typing-indicator";
  indicator.id = "typingIndicator";

  indicator.innerHTML = `
    <div class="message-avatar">⚡</div>
    <div class="typing-dots">
      <span></span>
      <span></span>
      <span></span>
    </div>
  `;

  DOM.messages.appendChild(indicator);
  scrollToBottom();
}

function removeTypingIndicator() {
  const indicator = document.getElementById("typingIndicator");
  if (indicator) indicator.remove();
}

function scrollToBottom() {
  requestAnimationFrame(() => {
    DOM.chatContainer.scrollTop = DOM.chatContainer.scrollHeight;
  });
}

function setLoading(loading) {
  isLoading = loading;
  DOM.sendBtn.disabled = loading || !DOM.messageInput.value.trim();
  DOM.messageInput.disabled = loading;

  if (loading) {
    DOM.messageInput.placeholder = "ProdiBot sedang berpikir...";
  } else {
    DOM.messageInput.placeholder = "Tanyakan sesuatu tentang produktivitas...";
    DOM.messageInput.focus();
  }
}

// ── API Communication ──
async function sendMessage(text) {
  if (!text.trim() || isLoading) return;

  // Add user message
  addMessage(text, "user");
  DOM.messageInput.value = "";
  DOM.messageInput.style.height = "auto";
  DOM.sendBtn.disabled = true;

  // Show loading
  setLoading(true);
  showTypingIndicator();

  try {
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: text, sessionId }),
    });

    const data = await response.json();

    removeTypingIndicator();

    if (!response.ok) {
      addMessage(data.error || "Terjadi kesalahan. Silakan coba lagi.", "bot", true);
    } else {
      addMessage(data.reply, "bot");
    }
  } catch (error) {
    removeTypingIndicator();
    addMessage("Tidak dapat terhubung ke server. Pastikan server berjalan.", "bot", true);
    console.error("Fetch error:", error);
  } finally {
    setLoading(false);
  }
}

async function resetChat() {
  try {
    await fetch("/api/reset", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId }),
    });
  } catch (e) {
    // ignore
  }

  DOM.messages.innerHTML = "";
  DOM.welcomeScreen.style.display = "flex";
  DOM.messageInput.value = "";
  DOM.messageInput.style.height = "auto";
  DOM.sendBtn.disabled = true;
  closeSidebar();
}

// ── Event Listeners ──
function init() {
  initTheme();

  // Send message
  DOM.sendBtn.addEventListener("click", () => {
    sendMessage(DOM.messageInput.value);
  });

  // Textarea enter to send, shift+enter for newline
  DOM.messageInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(DOM.messageInput.value);
    }
  });

  // Auto-resize textarea
  DOM.messageInput.addEventListener("input", () => {
    DOM.messageInput.style.height = "auto";
    DOM.messageInput.style.height = Math.min(DOM.messageInput.scrollHeight, 120) + "px";
    DOM.sendBtn.disabled = !DOM.messageInput.value.trim() || isLoading;
  });

  // Theme toggle
  DOM.themeCheckbox.addEventListener("change", toggleTheme);

  // Sidebar controls
  DOM.menuBtn.addEventListener("click", openSidebar);
  DOM.sidebarCloseBtn.addEventListener("click", closeSidebar);
  DOM.sidebarOverlay.addEventListener("click", closeSidebar);

  // Reset / New chat
  DOM.resetBtn.addEventListener("click", resetChat);
  DOM.newChatBtn.addEventListener("click", resetChat);

  // Suggestion cards on welcome screen
  document.querySelectorAll(".suggestion-card").forEach((card) => {
    card.addEventListener("click", () => {
      const prompt = card.getAttribute("data-prompt");
      if (prompt) sendMessage(prompt);
    });
  });

  // Sidebar quick action nav items
  document.querySelectorAll(".nav-item[data-prompt]").forEach((item) => {
    item.addEventListener("click", () => {
      const prompt = item.getAttribute("data-prompt");
      if (prompt) {
        closeSidebar();
        sendMessage(prompt);
      }
    });
  });
}

// ── Start ──
document.addEventListener("DOMContentLoaded", init);
