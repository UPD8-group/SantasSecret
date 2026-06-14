/**
 * Holly — Santa's Secret chat widget
 * Self-contained. No API, no backend, no dependencies.
 * Keyword-matched FAQ baked in.
 *
 * INSTALL — paste ONE line before </body> on santasecret.com.au:
 *   <script src="https://santasecret.com.au/holly.js" defer></script>
 *
 * (or wherever you host the file)
 */
(function () {
  "use strict";

  /* ============================================================
     KNOWLEDGE BASE — edit answers here anytime.
     Each entry: keywords that trigger it + the answer Holly gives.
     Matched top-to-bottom; first strong match wins.
  ============================================================ */
  var FAQ = [
    {
      k: ["open", "hours", "time", "today", "tomorrow", "saturday", "sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "when are you", "trading"],
      a: "We're open Thursday to Monday, 10am–3pm, and closed Tuesday and Wednesday. 🕐 Hours can differ on public holidays, so if you're making a special trip it's worth checking ahead."
    },
    {
      k: ["where", "located", "location", "address", "find you", "directions", "malbon", "bungendore", "how do i get"],
      a: "You'll find us at 24b Malbon St, Bungendore NSW 2621 📍 — a gorgeous village about 35 minutes east of Canberra. It's a lovely day trip: grab a coffee, browse the shops, and pop in to see us."
    },
    {
      k: ["sell", "stock", "products", "what do you have", "what kind", "items", "range", "buy"],
      a: "Kim makes beautiful handcrafted Christmas decorations — bespoke ornaments, custom and upcycled trees, oversized baubles, personalised pieces and curated gifts 🎄. There are wreaths and seasonal pieces for Easter and Halloween too. Every piece is one of a kind."
    },
    {
      k: ["wreath", "wreaths", "garland"],
      a: "Kim's wreaths are stunners 🌿 — each one handcrafted from natural materials and decorative touches, for Christmas, Easter and year-round. Custom orders are very welcome if you've something particular in mind."
    },
    {
      k: ["custom", "order", "commission", "made to order", "bespoke", "personalised", "personalized", "special request"],
      a: "Absolutely — Kim loves a custom piece. Tell us roughly what you're after and we'll make it happen. The best way is to pop in or send a message through the website so Kim can talk through the details with you. ✨"
    },
    {
      k: ["price", "prices", "cost", "how much", "expensive", "afford"],
      a: "Prices vary depending on the piece, since everything is handmade and one of a kind. The best way to get a feel is to visit in store or ask Kim about a specific item — happy to help. 🎁"
    },
    {
      k: ["christmas", "xmas", "festive", "tree", "trees", "ornament", "bauble"],
      a: "Christmas is our heart and soul 🎄 — handcrafted trees (including gorgeous upcycled ones), baubles, ornaments and decorations you won't find anywhere else. November and December are our busiest, most magical months, so come in early for the best pick."
    },
    {
      k: ["easter"],
      a: "Yes! Alongside Christmas, Kim creates lovely Easter pieces — wreaths and seasonal decorations. Pop in around the season to see what's new. 🐰"
    },
    {
      k: ["halloween", "spooky"],
      a: "We do indeed do Halloween 🎃 — seasonal handcrafted pieces and decorations. Stock changes year to year, so come have a look closer to the season."
    },
    {
      k: ["gift", "gifts", "present", "wrapping", "wrap"],
      a: "We've a lovely range of curated gifts, and complimentary gift wrapping in store 🎁. If you're stuck for ideas, come in and we'll help you find something special."
    },
    {
      k: ["who is kim", "about kim", "owner", "who made", "who runs", "kim"],
      a: "Kim is the maker and owner of Santa's Secret — every piece in the shop is handcrafted by her. She pours a lot of love into the work, and it shows. 💛"
    },
    {
      k: ["contact", "phone", "call", "email", "message", "get in touch", "reach"],
      a: "The easiest way to reach Kim is through the contact form here on the website, or pop in to the shop in person. We'd love to hear from you. 💌"
    },
    {
      k: ["dog", "dogs", "pet", "pets", "animal"],
      a: "Well-behaved furry friends on a lead are welcome to browse with you. 🐾"
    },
    {
      k: ["park", "parking"],
      a: "There's easy street parking right around Malbon St in Bungendore — you won't have any trouble. 🚗"
    },
    {
      k: ["hello", "hi", "hey", "gday", "g'day", "howdy", "morning", "afternoon"],
      a: "G'day! 🎄 Lovely to have you here. Ask me about what we sell, our opening hours, where to find us, or anything else about Santa's Secret."
    },
    {
      k: ["thank", "thanks", "cheers", "ta "],
      a: "You're very welcome! 💛 Anything else I can help you with?"
    },
    {
      k: ["bye", "goodbye", "see you", "later"],
      a: "Thanks for stopping by! Hope to see you in store soon. Take care 🎄"
    }
  ];

  var GREETING = "G'day! 🎄 I'm Holly, your guide to Santa's Secret in Bungendore. Ask me about what we sell, our hours, where to find us — anything at all!";
  var FALLBACK = "That's a good question! I might not have that exact answer — the best way is to pop in to the shop or send Kim a message through the website. In the meantime, I can help with our hours, location, products, wreaths or custom orders. 🎄";

  var QUICK = [
    { label: "🎁 What do you sell?", q: "What do you sell?" },
    { label: "🕐 Opening hours", q: "When are you open?" },
    { label: "📍 Where are you?", q: "Where are you located?" },
    { label: "🌿 Wreaths", q: "Tell me about the wreaths" }
  ];

  /* ============================================================
     MATCHING
  ============================================================ */
  function findAnswer(text) {
    var t = (" " + text.toLowerCase() + " ").replace(/[^\w\s']/g, " ");
    var best = null, bestScore = 0;
    for (var i = 0; i < FAQ.length; i++) {
      var score = 0;
      for (var j = 0; j < FAQ[i].k.length; j++) {
        if (t.indexOf(FAQ[i].k[j].toLowerCase()) !== -1) score++;
      }
      if (score > bestScore) { bestScore = score; best = FAQ[i]; }
    }
    return bestScore > 0 ? best.a : FALLBACK;
  }

  /* ============================================================
     STYLES
  ============================================================ */
  var css = ""
    + "#holly-bubble{position:fixed;bottom:22px;right:22px;width:62px;height:62px;border-radius:50%;background:linear-gradient(135deg,#c41e3a,#9e1730);box-shadow:0 10px 30px -8px rgba(196,30,58,.55);cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:30px;z-index:2147483000;transition:transform .25s,box-shadow .25s;border:3px solid #fff}"
    + "#holly-bubble:hover{transform:scale(1.07)}"
    + "#holly-bubble .badge{position:absolute;top:-3px;right:-3px;width:16px;height:16px;background:#2ecc71;border:2px solid #fff;border-radius:50%}"
    + "#holly-panel{position:fixed;bottom:96px;right:22px;width:360px;max-width:calc(100vw - 32px);height:520px;max-height:calc(100vh - 130px);background:#fff;border-radius:20px;box-shadow:0 30px 70px -20px rgba(0,0,0,.4);z-index:2147483000;display:none;flex-direction:column;overflow:hidden;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif}"
    + "#holly-panel.open{display:flex;animation:hollyup .3s cubic-bezier(.2,.8,.2,1)}"
    + "@keyframes hollyup{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:none}}"
    + ".holly-head{background:linear-gradient(135deg,#c41e3a,#9e1730);color:#fff;padding:16px 18px;display:flex;align-items:center;gap:12px}"
    + ".holly-head .av{width:40px;height:40px;border-radius:50%;background:rgba(255,255,255,.2);display:flex;align-items:center;justify-content:center;font-size:22px}"
    + ".holly-head .nm{font-weight:700;font-size:15px;line-height:1.2}"
    + ".holly-head .st{font-size:11.5px;opacity:.9;display:flex;align-items:center;gap:5px;margin-top:2px}"
    + ".holly-head .st .d{width:7px;height:7px;border-radius:50%;background:#5dffa0}"
    + ".holly-head .x{margin-left:auto;cursor:pointer;font-size:22px;line-height:1;opacity:.85;background:none;border:none;color:#fff;padding:4px}"
    + ".holly-head .x:hover{opacity:1}"
    + ".holly-msgs{flex:1;overflow-y:auto;padding:18px 16px;background:#faf7f4;display:flex;flex-direction:column;gap:10px}"
    + ".holly-msg{max-width:82%;padding:10px 14px;border-radius:15px;font-size:14px;line-height:1.5;animation:hollyin .35s ease}"
    + "@keyframes hollyin{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}"
    + ".holly-msg.bot{align-self:flex-start;background:#fff;border:1px solid #efe7e0;border-bottom-left-radius:5px;color:#2a2320}"
    + ".holly-msg.usr{align-self:flex-end;background:linear-gradient(135deg,#c41e3a,#9e1730);color:#fff;border-bottom-right-radius:5px}"
    + ".holly-typing{align-self:flex-start;background:#fff;border:1px solid #efe7e0;border-radius:15px;border-bottom-left-radius:5px;padding:12px 15px;display:none;gap:4px}"
    + ".holly-typing.show{display:flex}"
    + ".holly-typing span{width:7px;height:7px;border-radius:50%;background:#c9bdb4;animation:hollyblink 1.2s infinite}"
    + ".holly-typing span:nth-child(2){animation-delay:.2s}.holly-typing span:nth-child(3){animation-delay:.4s}"
    + "@keyframes hollyblink{0%,60%,100%{opacity:.3}30%{opacity:1}}"
    + ".holly-quick{padding:0 14px 8px;display:flex;flex-wrap:wrap;gap:7px;background:#faf7f4}"
    + ".holly-quick button{border:1px solid #e3d8cf;background:#fff;color:#7a4b3a;font-size:12.5px;padding:7px 12px;border-radius:100px;cursor:pointer;font-family:inherit;transition:background .2s,border-color .2s}"
    + ".holly-quick button:hover{background:#fff4ef;border-color:#c41e3a}"
    + ".holly-input{display:flex;gap:8px;padding:12px 14px;border-top:1px solid #f0e9e3;background:#fff;align-items:center}"
    + ".holly-input input{flex:1;border:1.5px solid #e7ddd4;border-radius:100px;padding:10px 16px;font-size:14px;outline:none;background:#faf7f4;color:#2a2320;font-family:inherit}"
    + ".holly-input input:focus{border-color:#c41e3a}"
    + ".holly-input button{width:40px;height:40px;flex-shrink:0;border:none;border-radius:50%;background:linear-gradient(135deg,#c41e3a,#9e1730);cursor:pointer;display:flex;align-items:center;justify-content:center}"
    + ".holly-input button svg{width:17px;height:17px;fill:#fff}"
    + ".holly-foot{text-align:center;font-size:10.5px;color:#b3a89f;padding:0 0 9px;background:#fff}"
    + ".holly-foot a{color:#b3a89f;text-decoration:none}";

  /* ============================================================
     BUILD UI
  ============================================================ */
  function init() {
    var style = document.createElement("style");
    style.textContent = css;
    document.head.appendChild(style);

    var bubble = document.createElement("div");
    bubble.id = "holly-bubble";
    bubble.innerHTML = "🎄<span class='badge'></span>";
    bubble.setAttribute("aria-label", "Chat with Holly");
    document.body.appendChild(bubble);

    var panel = document.createElement("div");
    panel.id = "holly-panel";
    panel.innerHTML =
      "<div class='holly-head'>"
      + "<div class='av'>🎄</div>"
      + "<div><div class='nm'>Holly</div><div class='st'><span class='d'></span>Santa's Secret · Online</div></div>"
      + "<button class='x' aria-label='Close'>&times;</button>"
      + "</div>"
      + "<div class='holly-msgs' id='holly-msgs'>"
      + "<div class='holly-typing' id='holly-typing'><span></span><span></span><span></span></div>"
      + "</div>"
      + "<div class='holly-quick' id='holly-quick'></div>"
      + "<div class='holly-input'>"
      + "<input id='holly-inp' type='text' placeholder='Ask Holly anything…' maxlength='200' autocomplete='off'>"
      + "<button id='holly-send' aria-label='Send'><svg viewBox='0 0 24 24'><path d='M2 21l21-9L2 3v7l15 2-15 2v7z'/></svg></button>"
      + "</div>"
      + "<div class='holly-foot'>Powered by <a href='https://saygday.ai' target='_blank' rel='noopener'>Say G'day</a></div>";
    document.body.appendChild(panel);

    var msgs = panel.querySelector("#holly-msgs");
    var typing = panel.querySelector("#holly-typing");
    var quick = panel.querySelector("#holly-quick");
    var inp = panel.querySelector("#holly-inp");
    var greeted = false;

    function addMsg(text, role) {
      var d = document.createElement("div");
      d.className = "holly-msg " + role;
      d.textContent = text;
      msgs.insertBefore(d, typing);
      msgs.scrollTop = msgs.scrollHeight;
    }

    function botReply(text) {
      typing.classList.add("show");
      msgs.scrollTop = msgs.scrollHeight;
      setTimeout(function () {
        typing.classList.remove("show");
        addMsg(findAnswer(text), "bot");
      }, 600 + Math.random() * 500);
    }

    function ask(text) {
      if (!text || !text.trim()) return;
      addMsg(text.trim(), "usr");
      inp.value = "";
      botReply(text.trim());
    }

    QUICK.forEach(function (item) {
      var b = document.createElement("button");
      b.textContent = item.label;
      b.addEventListener("click", function () { ask(item.q); });
      quick.appendChild(b);
    });

    function open() {
      panel.classList.add("open");
      if (!greeted) { greeted = true; setTimeout(function () { addMsg(GREETING, "bot"); }, 300); }
      setTimeout(function () { inp.focus(); }, 350);
    }
    function close() { panel.classList.remove("open"); }

    bubble.addEventListener("click", function () {
      panel.classList.contains("open") ? close() : open();
    });
    panel.querySelector(".x").addEventListener("click", close);
    panel.querySelector("#holly-send").addEventListener("click", function () { ask(inp.value); });
    inp.addEventListener("keydown", function (e) { if (e.key === "Enter") { e.preventDefault(); ask(inp.value); } });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
