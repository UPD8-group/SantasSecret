#!/usr/bin/env node
// build-posts.js
// Run during Netlify build to convert Decap CMS markdown posts → JSON
// Add to netlify.toml: command = "node build-posts.js"

const fs   = require('fs');
const path = require('path');

const POSTS_DIR  = path.join(__dirname, 'blog', 'posts');
const OUT_DIR    = path.join(__dirname, 'blog', 'posts');
const MANIFEST   = path.join(__dirname, 'blog', 'posts.json');

// Ensure dirs exist
if (!fs.existsSync(POSTS_DIR)) fs.mkdirSync(POSTS_DIR, { recursive: true });

// Parse frontmatter (simple YAML key: value only — no nested)
function parseFrontmatter(raw) {
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
  if (!match) return { data: {}, body: raw };

  const data = {};
  match[1].split('\n').forEach(line => {
    const [key, ...rest] = line.split(':');
    if (key && rest.length) {
      data[key.trim()] = rest.join(':').trim().replace(/^"(.*)"$/, '$1');
    }
  });

  return { data, body: match[2].trim() };
}

const files = fs.existsSync(POSTS_DIR)
  ? fs.readdirSync(POSTS_DIR).filter(f => f.endsWith('.md'))
  : [];

const manifest = [];

files.forEach(file => {
  const slug  = file.replace(/\.md$/, '');
  const raw   = fs.readFileSync(path.join(POSTS_DIR, file), 'utf8');
  const { data, body } = parseFrontmatter(raw);

  // Auto-excerpt: first 160 chars of body text if not set
  const excerpt = data.excerpt || body.replace(/[#*`]/g, '').slice(0, 160).trim() + '…';

  const post = {
    slug,
    title:   data.title   || slug,
    date:    data.date    || null,
    image:   data.image   || null,
    excerpt,
    body,
  };

  // Write individual post JSON
  fs.writeFileSync(
    path.join(OUT_DIR, `${slug}.json`),
    JSON.stringify(post, null, 2)
  );

  manifest.push({
    slug:    post.slug,
    title:   post.title,
    date:    post.date,
    image:   post.image,
    excerpt: post.excerpt,
  });
});

// Sort newest first
manifest.sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));

fs.writeFileSync(MANIFEST, JSON.stringify(manifest, null, 2));
console.log(`✅ Built ${manifest.length} blog post(s)`);
