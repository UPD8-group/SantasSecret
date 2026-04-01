# 🎄 Holly Goes Live — Deploy Guide

## What's in this package

```
data/santas-secret.json          ← Holly's brain (knowledge base)
netlify/functions/holly-chat.js  ← Serverless function (calls Claude API)
public/holly-widget.js           ← The floating chat widget
netlify.toml                     ← Netlify config (may need merging)
```

---

## Step 1: Add files to your santasecret.com.au GitHub repo

Copy these files/folders into the **root** of your existing santasecret repo:

- `data/` folder (with `santas-secret.json` inside)
- `netlify/functions/` folder (with `holly-chat.js` inside)
- `holly-widget.js` → put this wherever your other JS/assets live (e.g. root, or `public/`)

### ⚠️ netlify.toml

If you already have a `netlify.toml`, **don't replace it**. Instead, make sure it includes:

```toml
[functions]
  directory = "netlify/functions"
```

If you don't have one, use the one provided.

---

## Step 2: Add the API key in Netlify

1. Go to **Netlify Dashboard → your santasecret site**
2. **Site configuration → Environment variables**
3. Add:

| Key                 | Value                |
|---------------------|----------------------|
| `ANTHROPIC_API_KEY` | Your Claude API key  |

That's the only env var needed.

---

## Step 3: Replace the old Holly "Coming Soon" widget in your HTML

Find the old Holly widget code in your `index.html`. It's the block that shows "✨ Coming Soon" and "G'day! Holly here 👋" with the waitlist form.

**Delete that entire block** (the chat bubble, overlay, and all the associated CSS/JS).

Then add this single line **just before `</body>`**:

```html
<script src="/holly-widget.js"></script>
```

(Adjust the path if you put the file somewhere else, e.g. `/js/holly-widget.js`)

That's it. The widget injects its own HTML, CSS, and handles everything.

---

## Step 4: Push and deploy

```bash
git add .
git commit -m "🎄 Holly goes live"
git push
```

Netlify will auto-deploy. Wait for the deploy to finish (check the Netlify dashboard).

---

## Step 5: Test it

1. Visit santasecret.com.au
2. You should see a **red chat bubble** in the bottom-right corner
3. A "Chat with Holly!" badge appears after 2.5 seconds
4. Click the bubble → Holly's chat window opens
5. Try the quick reply buttons or type a question
6. Holly should respond with real AI-powered answers about the shop

---

## Troubleshooting

**Holly says "something went wrong"**
→ Check ANTHROPIC_API_KEY is set in Netlify env vars
→ Check Netlify Functions logs: Dashboard → Functions → holly-chat

**Widget doesn't appear**
→ Check the `<script>` tag path matches where you put holly-widget.js
→ Hard refresh: Ctrl+Shift+R (Win) or Cmd+Shift+R (Mac)
→ Try incognito mode to rule out cache

**404 on the function**
→ Make sure `netlify/functions/holly-chat.js` is in the right folder
→ Check netlify.toml has the functions directory set

**Old widget still showing**
→ Make sure you deleted ALL the old Holly HTML/CSS/JS from index.html
→ Force redeploy in Netlify: Deploys → Trigger deploy

---

## How it works

```
Visitor clicks chat bubble on santasecret.com.au
        ↓
holly-widget.js opens chat window
        ↓
User types a question → POST to /.netlify/functions/holly-chat
        ↓
holly-chat.js:
  1. Reads santas-secret.json knowledge base
  2. Builds Holly's system prompt (personality + business info + safety rules)
  3. Sends conversation to Claude API (Sonnet)
  4. Returns Holly's reply
        ↓
Widget displays the response
```

No database. No auth. No complexity. Just a JSON file, a function, and Claude.

---

## Updating Holly's knowledge

To update what Holly knows, just edit `data/santas-secret.json` and push. 
Add new Q&A pairs to the `knowledge_base` array — Holly will know about them immediately after deploy.

---

## Cost

Claude API usage at this scale (small business chat widget) will be very low — 
expect well under $5/month unless the site gets extremely heavy traffic.
Each conversation costs roughly $0.01-0.03 in API calls.
