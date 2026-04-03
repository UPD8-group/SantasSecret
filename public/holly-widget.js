/**
 * Holly Chat Widget — Santa's Secret
 * Floating AI chat assistant for santasecret.com.au
 * Drop this script tag into the site HTML before </body>
 */
(function () {
  'use strict';

  // ── Config ──
  const CONFIG = {
    endpoint: '/.netlify/functions/holly-chat',
    botName: 'Holly',
    businessName: "Santa's Secret",
    greeting:
      "G'day! 🎄 I'm Holly, your guide to Santa's Secret in Bungendore. Ask me about Kim's handcrafted decorations, wreaths, opening hours — anything at all!",
    placeholder: 'Ask Holly anything…',
    quickReplies: [
      { label: '🎁 What do you sell?', text: 'What kind of things do you sell?' },
      { label: '🌿 Wreaths', text: 'Tell me about the wreaths' },
      { label: '🕐 Hours', text: 'When are you open?' },
      { label: '📍 Location', text: 'Where are you located?' },
    ],
    maxMessages: 30,
    maxMessageLength: 500,
  };

  // ── State ──
  let isOpen = false;
  let isLoading = false;
  let history = [];

  // ── Styles ──
  const css = document.createElement('style');
  css.textContent = `
    #hw-wrap, #hw-wrap * { box-sizing: border-box; margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, sans-serif; }

    /* ── Bubble ── */
    #hw-bubble {
      position: fixed; bottom: 24px; right: 24px; z-index: 99999;
      width: 60px; height: 60px; border-radius: 50%;
      background: linear-gradient(135deg, #c41e3a 0%, #a01830 100%);
      border: none; cursor: pointer;
      box-shadow: 0 4px 20px rgba(196, 30, 58, 0.4), 0 2px 8px rgba(0,0,0,0.15);
      display: flex; align-items: center; justify-content: center;
      transition: transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.25s ease;
      -webkit-tap-highlight-color: transparent;
    }
    #hw-bubble:hover { transform: scale(1.08); box-shadow: 0 6px 28px rgba(196, 30, 58, 0.5), 0 3px 12px rgba(0,0,0,0.2); }
    #hw-bubble:active { transform: scale(0.95); }
    #hw-bubble .hw-ico-chat, #hw-bubble .hw-ico-close { width: 26px; height: 26px; fill: #fff; transition: opacity 0.2s, transform 0.25s; position: absolute; }
    #hw-bubble .hw-ico-close { opacity: 0; transform: rotate(-90deg) scale(0.6); }
    #hw-bubble.open .hw-ico-chat { opacity: 0; transform: rotate(90deg) scale(0.6); }
    #hw-bubble.open .hw-ico-close { opacity: 1; transform: rotate(0) scale(1); }

    /* ── Badge ── */
    #hw-badge {
      position: fixed; bottom: 92px; right: 24px; z-index: 99998;
      background: #fff; color: #3d2b1f; padding: 8px 14px;
      border-radius: 10px; font-size: 13px; font-weight: 500;
      box-shadow: 0 3px 14px rgba(0,0,0,0.12); pointer-events: none;
      opacity: 0; transform: translateY(6px);
      animation: hw-badge-in 0.4s 2.5s ease forwards;
    }
    #hw-badge::after {
      content: ''; position: absolute; bottom: -6px; right: 26px;
      width: 12px; height: 12px; background: #fff;
      transform: rotate(45deg); box-shadow: 3px 3px 6px rgba(0,0,0,0.06);
    }
    @keyframes hw-badge-in { to { opacity: 1; transform: translateY(0); } }

    /* ── Window ── */
    #hw-window {
      position: fixed; bottom: 96px; right: 24px; z-index: 99999;
      width: 370px; max-width: calc(100vw - 32px);
      height: 520px; max-height: calc(100vh - 130px);
      background: #faf8f5; border-radius: 18px;
      box-shadow: 0 12px 48px rgba(0,0,0,0.18), 0 4px 16px rgba(0,0,0,0.08);
      display: flex; flex-direction: column; overflow: hidden;
      opacity: 0; transform: translateY(16px) scale(0.96);
      pointer-events: none;
      transition: opacity 0.3s ease, transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
    }
    #hw-window.open {
      opacity: 1; transform: translateY(0) scale(1); pointer-events: auto;
    }

    /* ── Header ── */
    #hw-header {
      background: linear-gradient(135deg, #c41e3a 0%, #9e1528 100%);
      padding: 16px 18px; display: flex; align-items: center; gap: 12px;
      flex-shrink: 0;
    }
    #hw-avatar {
      width: 42px; height: 42px; background: rgba(255,255,255,0.18);
      border-radius: 50%; display: flex; align-items: center; justify-content: center;
      font-size: 22px; flex-shrink: 0;
    }
    #hw-header-text { flex: 1; }
    #hw-header-name { color: #fff; font-size: 15px; font-weight: 600; }
    #hw-header-sub { color: rgba(255,255,255,0.7); font-size: 12px; margin-top: 1px; }
    #hw-status {
      width: 10px; height: 10px; background: #4ade80;
      border-radius: 50%; border: 2px solid rgba(255,255,255,0.3);
      flex-shrink: 0; animation: hw-pulse 2.5s ease-in-out infinite;
    }
    @keyframes hw-pulse { 0%,100%{ opacity:1 } 50%{ opacity:0.5 } }

    /* ── Messages ── */
    #hw-messages {
      flex: 1; overflow-y: auto; padding: 16px 14px;
      display: flex; flex-direction: column; gap: 10px;
      scroll-behavior: smooth;
      -webkit-overflow-scrolling: touch;
      overscroll-behavior: contain;
    }
    #hw-messages::-webkit-scrollbar { width: 4px; }
    #hw-messages::-webkit-scrollbar-track { background: transparent; }
    #hw-messages::-webkit-scrollbar-thumb { background: #ddd; border-radius: 2px; }

    .hw-msg {
      max-width: 85%; padding: 11px 15px; border-radius: 16px;
      font-size: 14px; line-height: 1.55; word-wrap: break-word;
      animation: hw-msg-in 0.25s ease;
    }
    @keyframes hw-msg-in { from { opacity:0; transform:translateY(6px); } to { opacity:1; transform:translateY(0); } }
    .hw-msg.bot {
      align-self: flex-start; background: #fff;
      color: #2c1810; border: 1px solid #f0ece6;
      border-bottom-left-radius: 4px;
    }
    .hw-msg.user {
      align-self: flex-end;
      background: linear-gradient(135deg, #c41e3a 0%, #a01830 100%);
      color: #fff; border-bottom-right-radius: 4px;
    }
    .hw-msg.bot a { color: #c41e3a; text-decoration: underline; }

    /* ── Typing ── */
    #hw-typing {
      align-self: flex-start; background: #fff; border: 1px solid #f0ece6;
      border-radius: 16px; border-bottom-left-radius: 4px;
      padding: 12px 18px; display: none; gap: 5px; align-items: center;
    }
    #hw-typing.show { display: flex; }
    .hw-dot {
      width: 7px; height: 7px; background: #ccc; border-radius: 50%;
      animation: hw-bounce 1.2s ease-in-out infinite;
    }
    .hw-dot:nth-child(2) { animation-delay: 0.15s; }
    .hw-dot:nth-child(3) { animation-delay: 0.3s; }
    @keyframes hw-bounce { 0%,100%{transform:translateY(0);opacity:0.4} 50%{transform:translateY(-5px);opacity:1} }

    /* ── Quick replies ── */
    #hw-quick {
      padding: 4px 14px 10px; display: flex; flex-wrap: wrap; gap: 6px;
      flex-shrink: 0;
    }
    .hw-qr {
      background: #fff; border: 1.5px solid #e5ddd5; border-radius: 100px;
      padding: 6px 13px; font-size: 12.5px; color: #4a3f38; cursor: pointer;
      transition: border-color 0.15s, color 0.15s, background 0.15s;
      -webkit-tap-highlight-color: transparent; white-space: nowrap;
    }
    .hw-qr:hover { border-color: #c41e3a; color: #c41e3a; }
    .hw-qr:active { background: #fff5f5; }

    /* ── Input ── */
    #hw-input-area {
      padding: 12px 14px; background: #fff;
      border-top: 1px solid #f0ece6;
      display: flex; gap: 8px; align-items: center; flex-shrink: 0;
    }
    #hw-input {
      flex: 1; border: 1.5px solid #e5ddd5; border-radius: 100px;
      padding: 10px 16px; font-size: 16px; outline: none;
      background: #faf8f5; color: #1a1816;
      -webkit-appearance: none; transition: border-color 0.15s;
    }
    #hw-input:focus { border-color: #c41e3a; }
    #hw-input::placeholder { color: #b5ada5; }
    #hw-send {
      width: 40px; height: 40px;
      background: linear-gradient(135deg, #c41e3a 0%, #a01830 100%);
      border: none; border-radius: 50%; cursor: pointer;
      display: flex; align-items: center; justify-content: center;
      flex-shrink: 0; transition: opacity 0.15s, transform 0.15s;
      -webkit-tap-highlight-color: transparent;
    }
    #hw-send:hover { transform: scale(1.06); }
    #hw-send:active { transform: scale(0.94); }
    #hw-send:disabled { opacity: 0.4; cursor: default; transform: none; }
    #hw-send svg { width: 16px; height: 16px; fill: #fff; }

    /* ── Footer ── */
    #hw-footer {
      text-align: center; padding: 8px; font-size: 10.5px;
      color: #b5ada5; background: #fff; border-top: 1px solid #f0ece6;
      flex-shrink: 0;
    }
    #hw-footer a { color: #c41e3a; text-decoration: none; font-weight: 600; }
    #hw-footer a:hover { text-decoration: underline; }

    /* ── Header close button ── */
    #hw-close {
      background: rgba(255,255,255,0.15); border: none; color: #fff;
      width: 32px; height: 32px; border-radius: 50%; cursor: pointer;
      font-size: 20px; display: flex; align-items: center; justify-content: center;
      flex-shrink: 0; transition: background 0.2s;
      -webkit-tap-highlight-color: transparent; line-height: 1;
    }
    #hw-close:hover { background: rgba(255,255,255,0.3); }
    @media (max-width: 440px) {
      #hw-close { width: 36px; height: 36px; font-size: 22px; }
    }

    /* ── Mobile ── */
    @media (max-width: 440px) {
      #hw-window {
        bottom: 0; right: 0; left: 0;
        width: 100%; max-width: 100%;
        height: 100vh; max-height: 100vh;
        height: 100dvh; max-height: 100dvh;
        border-radius: 0;
      }
      #hw-bubble { bottom: 16px; right: 16px; }
      #hw-bubble.open { display: none; }
      #hw-badge { display: none; }
    }
  `;
  document.head.appendChild(css);

  // ── Build DOM ──
  const wrap = document.createElement('div');
  wrap.id = 'hw-wrap';
  wrap.innerHTML = `
    <div id="hw-badge">🧝‍♀️ Chat with Holly!</div>

    <div id="hw-window">
      <div id="hw-header">
        <button id="hw-close" aria-label="Close chat">×</button>
        <div id="hw-avatar">🧝‍♀️</div>
        <div id="hw-header-text">
          <div id="hw-header-name">${CONFIG.botName} · ${CONFIG.businessName}</div>
          <div id="hw-header-sub">Typically replies in seconds</div>
        </div>
        <div id="hw-status"></div>
      </div>
      <div id="hw-messages">
        <div id="hw-typing"><div class="hw-dot"></div><div class="hw-dot"></div><div class="hw-dot"></div></div>
      </div>
      <div id="hw-quick"></div>
      <div id="hw-input-area">
        <input id="hw-input" type="text" placeholder="${CONFIG.placeholder}" maxlength="${CONFIG.maxMessageLength}" autocomplete="off" />
        <button id="hw-send" aria-label="Send">
          <svg viewBox="0 0 24 24"><path d="M2 21l21-9L2 3v7l15 2-15 2v7z"/></svg>
        </button>
      </div>
      <div id="hw-footer">Powered by <a href="https://upd8.group" target="_blank" rel="noopener">the UPD8 Group</a></div>
    </div>

    <button id="hw-bubble" aria-label="Chat with Holly">
      <svg class="hw-ico-chat" viewBox="0 0 24 24"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-2 12H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z"/></svg>
      <svg class="hw-ico-close" viewBox="0 0 24 24"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>
    </button>
  `;
  document.body.appendChild(wrap);

  // ── Refs ──
  const bubble = document.getElementById('hw-bubble');
  const win = document.getElementById('hw-window');
  const badge = document.getElementById('hw-badge');
  const messagesEl = document.getElementById('hw-messages');
  const typingEl = document.getElementById('hw-typing');
  const quickEl = document.getElementById('hw-quick');
  const input = document.getElementById('hw-input');
  const sendBtn = document.getElementById('hw-send');

  // ── Helpers ──
  function addMessage(text, role) {
    const div = document.createElement('div');
    div.className = `hw-msg ${role}`;
    // Sanitise but allow basic formatting
    div.innerHTML = text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/\n/g, '<br>')
      .replace(
        /(https?:\/\/[^\s<]+)/g,
        '<a href="$1" target="_blank" rel="noopener">$1</a>'
      );
    messagesEl.insertBefore(div, typingEl);
    messagesEl.scrollTop = messagesEl.scrollHeight;
  }

  function showTyping() {
    typingEl.classList.add('show');
    messagesEl.scrollTop = messagesEl.scrollHeight;
  }

  function hideTyping() {
    typingEl.classList.remove('show');
  }

  function renderQuickReplies() {
    quickEl.innerHTML = CONFIG.quickReplies
      .map(
        (qr) =>
          `<button class="hw-qr" data-text="${qr.text.replace(/"/g, '&quot;')}">${qr.label}</button>`
      )
      .join('');
  }

  function hideQuickReplies() {
    quickEl.style.display = 'none';
  }

  function showQuickReplies() {
    renderQuickReplies();
    quickEl.style.display = '';
    messagesEl.scrollTop = messagesEl.scrollHeight;
  }

  // ── Send message ──
  async function sendMessage(text) {
    if (isLoading || !text.trim()) return;
    isLoading = true;
    sendBtn.disabled = true;

    const clean = text.trim().slice(0, CONFIG.maxMessageLength);
    addMessage(clean, 'user');
    hideQuickReplies();
    input.value = '';
    showTyping();

    history.push({ role: 'user', content: clean });

    try {
      const res = await fetch(CONFIG.endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: clean, history: history.slice(-20) }),
      });

      hideTyping();

      if (res.status === 429) {
        const data = await res.json().catch(() => ({}));
        addMessage(
          data.error || "You've sent quite a few messages! Please try again in a little while, or call Kim on 0480 784 317. 🎄",
          'bot'
        );
        return;
      }

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const data = await res.json();
      const reply = data.reply || "Sorry, something went wrong. Please try again!";

      addMessage(reply, 'bot');
      history.push({ role: 'assistant', content: reply });

      // Keep history lean
      if (history.length > 30) history = history.slice(-20);
    } catch (err) {
      hideTyping();
      addMessage(
        "Sorry, I'm having a little trouble right now. Please try again, or call Kim directly on 0480 784 317! 🎄",
        'bot'
      );
      console.error('Holly chat error:', err);
    } finally {
      isLoading = false;
      sendBtn.disabled = false;
      showQuickReplies();
      input.focus();
    }
  }

  // ── Events ──
  const closeBtn = document.getElementById('hw-close');

  function toggleChat() {
    isOpen = !isOpen;
    bubble.classList.toggle('open', isOpen);
    win.classList.toggle('open', isOpen);
    badge.style.display = 'none';
    // Prevent background scroll on mobile when chat is open
    if (window.innerWidth <= 440) {
      document.body.style.overflow = isOpen ? 'hidden' : '';
    }
    // Only auto-focus on desktop — mobile keyboard is intrusive
    if (isOpen && window.innerWidth > 440) input.focus();
  }

  bubble.addEventListener('click', toggleChat);
  closeBtn.addEventListener('click', toggleChat);

  sendBtn.addEventListener('click', () => sendMessage(input.value));

  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input.value);
    }
  });

  quickEl.addEventListener('click', (e) => {
    const btn = e.target.closest('.hw-qr');
    if (btn) sendMessage(btn.dataset.text);
  });

  // ── Init ──
  addMessage(CONFIG.greeting, 'bot');
  renderQuickReplies();

  // iOS keyboard handling — resize chat window when keyboard opens/closes
  if (window.visualViewport) {
    window.visualViewport.addEventListener('resize', () => {
      if (isOpen && window.innerWidth <= 440) {
        win.style.height = window.visualViewport.height + 'px';
        messagesEl.scrollTop = messagesEl.scrollHeight;
      }
    });
    window.visualViewport.addEventListener('scroll', () => {
      if (isOpen && window.innerWidth <= 440) {
        win.style.transform = `translateY(0)`;
      }
    });
  }

  // Reset height when input loses focus (keyboard closes)
  input.addEventListener('blur', () => {
    if (window.innerWidth <= 440) {
      win.style.height = '';
    }
  });

  // Auto-hide badge after 8s
  setTimeout(() => {
    if (!isOpen && badge) {
      badge.style.transition = 'opacity 0.5s';
      badge.style.opacity = '0';
      setTimeout(() => (badge.style.display = 'none'), 500);
    }
  }, 8000);
})();
