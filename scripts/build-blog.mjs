#!/usr/bin/env node
// Build script: blog-source/posts/*.md -> v4-deploy/blog/<slug>/index.html + index + sitemap + rss
// Run: cd scripts && npm install && npm run build
//
// Frontmatter shape:
//   ---
//   title: "Post title"
//   slug: optional-override-slug  (defaults to filename without date prefix)
//   date: 2026-05-07
//   lane: build-story | ai-news | seo-evergreen
//   description: "150-160 char SEO description"
//   hero: /_assets/blog/<slug>/hero.jpg  (optional)
//   tags: [tag1, tag2]
//   videoYT: youtube-id  (optional, embeds at top)
//   ---

import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import matter from 'gray-matter';
import { marked } from 'marked';

// __dirname = v4-deploy/scripts/  →  ROOT = v4-deploy/  (the website root)
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const SRC = path.join(ROOT, 'blog-source/posts');
const SRC_IMG = path.join(ROOT, 'blog-source/images');
const OUT = path.join(ROOT, 'blog');
const OUT_IMG = path.join(ROOT, '_assets/blog');
const SITE = 'https://yauhenm.com';

marked.setOptions({ gfm: true, breaks: false });

// ---------- helpers ----------
const esc = (s = '') => String(s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;').replace(/'/g, '&#39;');

const slugFromFilename = (fn) => fn
  .replace(/\.md$/, '')
  .replace(/^\d{4}-\d{2}-\d{2}-/, '');

const readingTime = (text) => {
  const words = text.split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 220));
};

const fmtDate = (iso) => {
  const d = new Date(iso);
  // timeZone UTC: "2026-05-11" parses as UTC midnight — local (PDT) rendering shifts it a day early
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' });
};

const laneLabel = (lane) => ({
  'build-story': 'Build story',
  'ai-news': 'AI take',
  'seo-evergreen': 'Guide',
}[lane] || 'Post');

// ---------- shared CSS (matches V4) ----------
const sharedCSS = `
:root{
  --bg:#0E0C0A;--bg-soft:#16130F;--bg-warm:#1F1B16;
  --bone:#F2EDE3;--bone-mute:#A89F92;--mute:#6B6258;
  --gold:#C9A961;--gold-bright:#E5C987;--rust:#C7593C;
  --rule:rgba(242,237,227,0.10);--rule-strong:rgba(242,237,227,0.22);
}
*{box-sizing:border-box;margin:0;padding:0}
html{-webkit-text-size-adjust:100%;scroll-behavior:smooth}
@media(prefers-reduced-motion:reduce){html{scroll-behavior:auto}*,*::before,*::after{transition-duration:.01ms!important;animation-duration:.01ms!important}}
body{background:var(--bg);color:var(--bone);font-family:'Inter',sans-serif;font-size:16px;line-height:1.55;-webkit-font-smoothing:antialiased;text-rendering:optimizeLegibility}
img{max-width:100%;display:block}
a{color:inherit;text-decoration:none}
.display{font-family:'Anton','Archivo Black',sans-serif;font-weight:400;letter-spacing:0;text-transform:uppercase;line-height:0.92}

.wrap{max-width:1200px;margin:0 auto;padding:0 24px}
.wrap-narrow{max-width:720px;margin:0 auto;padding:0 24px}

/* Nav (matches v4-deploy/index.html exactly) */
.nav{display:flex;justify-content:space-between;align-items:center;padding:22px 0;border-bottom:1px solid var(--rule)}
.nav-logo{display:inline-flex;align-items:center;gap:12px;font-family:'Inter',sans-serif;font-weight:600;font-size:13px;letter-spacing:.02em;color:var(--bone)}
.nav-mark{width:30px;height:30px;border-radius:50%;background:var(--gold);color:var(--bg);display:inline-flex;align-items:center;justify-content:center;font-family:'Anton',sans-serif;font-size:15px;padding-bottom:2px;flex-shrink:0}
.nav-mark::before{content:"Y."}
.nav-links{display:none;gap:30px;font-family:'JetBrains Mono',monospace;font-size:11px;letter-spacing:0.1em;text-transform:uppercase;color:var(--bone);align-items:center}
.nav-links a{transition:color .2s;opacity:0.8}
.nav-links a:hover{color:var(--gold);opacity:1}
.nav-links a.is-active{color:var(--gold);opacity:1}
.nav-cta{border:1px solid var(--bone);padding:10px 16px;color:var(--bone);transition:background .2s,color .2s;opacity:1!important}
.nav-cta:hover{background:var(--bone);color:var(--bg)!important}
.nav-mobile{font-family:'JetBrains Mono',monospace;font-size:11px;letter-spacing:0.1em;text-transform:uppercase;color:var(--gold)}
@media(min-width:768px){.nav-links{display:flex}.nav-mobile{display:none}}

/* Article */
.article-head{padding:64px 0 40px;border-bottom:1px solid var(--rule)}
.lane-pill{display:inline-block;font-size:11px;letter-spacing:.18em;text-transform:uppercase;color:var(--gold);padding:6px 12px;border:1px solid var(--gold);border-radius:999px;margin-bottom:24px}
.article-h1{font-family:'Anton',sans-serif;text-transform:uppercase;font-size:clamp(40px,8vw,84px);line-height:0.95;letter-spacing:-0.01em;margin-bottom:24px}
.article-meta{display:flex;gap:16px;flex-wrap:wrap;font-size:13px;color:var(--bone-mute);align-items:center}
.article-meta .dot{width:3px;height:3px;border-radius:50%;background:var(--bone-mute)}
.article-desc{font-family:'Fraunces',serif;font-style:italic;font-size:clamp(18px,3vw,22px);color:var(--bone-mute);margin-top:24px;line-height:1.4;max-width:680px}

.hero-img{margin:48px 0 0;border-radius:12px;overflow:hidden;border:1px solid var(--rule);background:var(--bg-warm)}
.hero-img img{width:100%;height:auto;display:block}

.yt-embed{position:relative;padding-bottom:56.25%;height:0;border-radius:12px;overflow:hidden;margin:48px 0 0;background:var(--bg-warm);border:1px solid var(--rule)}
.yt-embed iframe{position:absolute;top:0;left:0;width:100%;height:100%;border:0}

/* Article body */
.article-body{padding:48px 0 80px;font-size:18px;line-height:1.7;color:var(--bone)}
.article-body > *{margin-bottom:1.4em}
.article-body h2{font-family:'Anton',sans-serif;text-transform:uppercase;font-size:clamp(28px,5vw,40px);letter-spacing:0;line-height:1.05;margin:2em 0 0.6em;color:var(--bone)}
.article-body h3{font-family:'Inter',sans-serif;font-weight:700;font-size:22px;margin:1.6em 0 0.4em;color:var(--bone);letter-spacing:-0.01em}
.article-body p{color:var(--bone)}
.article-body a{color:var(--gold);text-decoration:underline;text-decoration-thickness:1px;text-underline-offset:3px}
.article-body a:hover{color:var(--gold-bright)}
.article-body strong{color:var(--bone);font-weight:600}
.article-body em{font-family:'Fraunces',serif;font-style:italic;color:var(--bone)}
.article-body code{font-family:'JetBrains Mono',monospace;font-size:0.88em;background:var(--bg-warm);padding:2px 6px;border-radius:4px;color:var(--gold-bright);border:1px solid var(--rule)}
.article-body pre{font-family:'JetBrains Mono',monospace;font-size:14px;line-height:1.6;background:var(--bg-soft);border:1px solid var(--rule);border-radius:8px;padding:20px;overflow-x:auto;color:var(--bone)}
.article-body pre code{background:none;border:0;padding:0;color:inherit;font-size:inherit}
.article-body blockquote{border-left:3px solid var(--gold);padding:8px 0 8px 20px;color:var(--bone-mute);font-family:'Fraunces',serif;font-style:italic;font-size:1.1em}
.article-body ul,.article-body ol{padding-left:1.4em;color:var(--bone)}
.article-body li{margin-bottom:.4em}
.article-body img{margin:2em 0;border-radius:8px;border:1px solid var(--rule)}
.article-body img + em{display:block;text-align:center;font-size:13px;color:var(--mute);margin-top:-1em}
.article-body hr{border:0;border-top:1px solid var(--rule-strong);margin:3em 0}
.article-body table{width:100%;border-collapse:collapse;font-size:15px}
.article-body th,.article-body td{padding:10px 14px;border-bottom:1px solid var(--rule);text-align:left}
.article-body th{font-weight:600;color:var(--bone-mute);font-size:12px;text-transform:uppercase;letter-spacing:.08em}

.tags{margin-top:48px;padding-top:24px;border-top:1px solid var(--rule);display:flex;gap:8px;flex-wrap:wrap}
.tag{font-size:12px;color:var(--bone-mute);background:var(--bg-warm);padding:6px 12px;border-radius:999px;border:1px solid var(--rule)}

.share-row{margin-top:32px;display:flex;gap:16px;align-items:center;font-size:13px;color:var(--bone-mute)}
.share-row a{color:var(--gold);text-decoration:underline;text-underline-offset:3px}

/* Footer */
.foot{padding:64px 0 96px;border-top:1px solid var(--rule);font-size:13px;color:var(--bone-mute);text-align:center;margin-top:80px}
.foot a{color:var(--bone)}
.foot a:hover{color:var(--gold)}

/* Index page */
.index-head{padding:80px 0 32px}
.index-h1{font-family:'Anton',sans-serif;text-transform:uppercase;font-size:clamp(48px,10vw,120px);line-height:0.9;letter-spacing:-0.02em}
.index-sub{font-family:'Fraunces',serif;font-style:italic;font-size:20px;color:var(--bone-mute);max-width:560px;margin-top:16px;line-height:1.45}
.index-list{padding:48px 0 80px;display:grid;gap:24px}
.post-card{padding:28px 0;border-top:1px solid var(--rule);display:grid;gap:8px;transition:transform .2s}
.post-card:hover{transform:translateX(4px)}
.post-card:hover .post-title{color:var(--gold)}
.post-card-meta{display:flex;gap:14px;align-items:center;font-size:12px;letter-spacing:.1em;text-transform:uppercase;color:var(--bone-mute)}
.post-card-meta .lane{color:var(--gold)}
.post-title{font-family:'Anton',sans-serif;text-transform:uppercase;font-size:clamp(28px,5vw,44px);line-height:1.0;letter-spacing:-0.01em;transition:color .2s}
.post-desc{font-family:'Fraunces',serif;font-style:italic;color:var(--bone-mute);font-size:17px;line-height:1.4;max-width:680px;margin-top:6px}

/* Back link */
.back-link{display:inline-flex;align-items:center;gap:6px;font-size:13px;color:var(--bone-mute);margin-top:32px;letter-spacing:.04em}
.back-link:hover{color:var(--gold)}
`.trim();

// ---------- google fonts link ----------
const fontsLink = `<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link href="https://fonts.googleapis.com/css2?family=Anton&family=Fraunces:ital,opsz,wght@0,9..144,400;0,9..144,500;0,9..144,600;1,9..144,400;1,9..144,500&family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">`;

// ---------- analytics block (matches index.html, incl. GA Consent Mode v2) ----------
// Keep in lockstep with index.html: same consent defaults, or EU visitors get cookies
// on blog pages that the homepage carefully denies.
const analyticsBlock = `
<!-- Vercel Speed Insights (Web Analytics script intentionally absent — not enabled for this project) -->
<script defer src="/_vercel/speed-insights/script.js"></script>
<!-- Google Analytics 4 with Consent Mode v2 — same defaults as the homepage -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-Y3Y0WPV74V"></script>
<script>
  window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}
  gtag('js',new Date());
  gtag('consent','default',{'ad_storage':'denied','ad_user_data':'denied','ad_personalization':'denied','analytics_storage':'granted','region':['US']});
  gtag('consent','default',{'ad_storage':'denied','ad_user_data':'denied','ad_personalization':'denied','analytics_storage':'denied','region':['BE','BG','CZ','DK','DE','EE','IE','GR','ES','FR','HR','IT','CY','LV','LT','LU','HU','MT','NL','AT','PL','PT','RO','SI','SK','FI','SE','GB','CH','IS','NO','LI']});
  gtag('config','G-Y3Y0WPV74V',{'anonymize_ip':true});
</script>
`.trim();

// ---------- shared head links (favicon + RSS discovery) ----------
const headLinks = `<link rel="icon" type="image/svg+xml" href="/_assets/favicon.svg">
<link rel="alternate" type="application/rss+xml" title="Yauhen Massalski — Blog" href="/rss.xml">`;

// ---------- shared header ----------
const header = `
<header class="wrap">
  <nav class="nav">
    <a class="nav-logo" href="/"><span class="nav-mark"></span>Yauhen Massalski</a>
    <div class="nav-links">
      <a href="/#story">Story</a>
      <a href="/#youtube">Watch</a>
      <a href="/#ventures">Ventures</a>
      <a class="is-active" href="/blog">Blog</a>
      <a class="nav-cta" href="/#work">Work with me</a>
    </div>
    <a class="nav-mobile" href="/blog">Blog →</a>
  </nav>
</header>
`.trim();

const footer = `
<footer class="foot">
  <div class="wrap">
    <p>© ${new Date().getFullYear()} Yauhen Massalski · <a href="/">yauhenm.com</a> · <a href="https://www.youtube.com/@yauhenm">YouTube</a> · <a href="https://www.tiktok.com/@y.massalski">TikTok</a> · <a href="https://www.linkedin.com/in/yauhen-massalski/">LinkedIn</a></p>
  </div>
</footer>
`.trim();

// ---------- post page ----------
function postHTML(post) {
  const url = `${SITE}/blog/${post.slug}`;
  const ogImg = post.hero ? `${SITE}${post.hero}` : `${SITE}/_assets/og-image.jpg`;
  const heroBlock = post.videoYT
    ? `<div class="yt-embed"><iframe src="https://www.youtube-nocookie.com/embed/${esc(post.videoYT)}" title="${esc(post.title)}" allowfullscreen loading="lazy"></iframe></div>`
    : (post.hero ? `<div class="hero-img"><img src="${esc(post.hero)}" alt="${esc(post.title)}" loading="eager"></div>` : '');
  const tags = (post.tags || []).map(t => `<span class="tag">${esc(t)}</span>`).join('');
  const xShare = `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(post.title)}`;
  const liShare = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${esc(post.title)} — Yauhen Massalski</title>
<meta name="description" content="${esc(post.description)}">
<meta name="author" content="Yauhen Massalski">
<link rel="canonical" href="${url}">
${headLinks}
<meta property="og:type" content="article">
<meta property="og:url" content="${url}">
<meta property="og:title" content="${esc(post.title)}">
<meta property="og:description" content="${esc(post.description)}">
<meta property="og:image" content="${ogImg}">
<meta property="article:published_time" content="${post.date}">
<meta property="article:author" content="Yauhen Massalski">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(post.title)}">
<meta name="twitter:description" content="${esc(post.description)}">
<meta name="twitter:image" content="${ogImg}">
<script type="application/ld+json">
${JSON.stringify({
  "@context": "https://schema.org",
  "@type": "BlogPosting",
  "headline": post.title,
  "description": post.description,
  "image": ogImg,
  "datePublished": post.date,
  "author": {"@type": "Person", "name": "Yauhen Massalski", "url": SITE},
  "publisher": {"@type": "Person", "name": "Yauhen Massalski", "url": SITE},
  "mainEntityOfPage": url,
})}
</script>
${post.videoYT ? `<script type="application/ld+json">
${JSON.stringify({
  "@context": "https://schema.org",
  "@type": "VideoObject",
  "name": post.title,
  "description": post.description,
  "thumbnailUrl": [
    `https://i.ytimg.com/vi/${post.videoYT}/maxresdefault.jpg`,
    `https://i.ytimg.com/vi/${post.videoYT}/hqdefault.jpg`,
  ],
  "uploadDate": post.date,
  "embedUrl": `https://www.youtube-nocookie.com/embed/${post.videoYT}`,
  "publisher": {
    "@type": "Person",
    "name": "Yauhen Massalski",
    "url": SITE,
  },
})}
</script>` : ''}
${fontsLink}
<style>${sharedCSS}</style>
${analyticsBlock}
</head>
<body>
${header}
<article>
  <div class="article-head wrap-narrow">
    <span class="lane-pill">${laneLabel(post.lane)}</span>
    <h1 class="article-h1">${esc(post.title)}</h1>
    <div class="article-meta">
      <span>${fmtDate(post.date)}</span>
      <span class="dot"></span>
      <span>${post.readMin} min read</span>
    </div>
    <p class="article-desc">${esc(post.description)}</p>
  </div>
  ${heroBlock ? `<div class="wrap-narrow">${heroBlock}</div>` : ''}
  <div class="article-body wrap-narrow">
    ${post.html}
    ${tags ? `<div class="tags">${tags}</div>` : ''}
    <div class="share-row">
      <span>Share:</span>
      <a href="${xShare}" target="_blank" rel="noopener">X / Twitter</a>
      <a href="${liShare}" target="_blank" rel="noopener">LinkedIn</a>
    </div>
    <a class="back-link" href="/blog">← All posts</a>
  </div>
</article>
${footer}
</body>
</html>`;
}

// ---------- index page ----------
function indexHTML(posts) {
  const cards = posts.map(p => `
    <a class="post-card" href="/blog/${p.slug}">
      <div class="post-card-meta">
        <span class="lane">${laneLabel(p.lane)}</span>
        <span>${fmtDate(p.date)}</span>
        <span>${p.readMin} min</span>
      </div>
      <h2 class="post-title">${esc(p.title)}</h2>
      <p class="post-desc">${esc(p.description)}</p>
    </a>`).join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>Blog — Yauhen Massalski</title>
<meta name="description" content="Build stories, AI takes, and guides from a pro athlete who ships AI things. The build, the cost, the receipt.">
<link rel="canonical" href="${SITE}/blog">
${headLinks}
<meta property="og:type" content="website">
<meta property="og:url" content="${SITE}/blog">
<meta property="og:title" content="Blog — Yauhen Massalski">
<meta property="og:description" content="Build stories, AI takes, and guides. The build, the cost, the receipt.">
<meta property="og:image" content="${SITE}/_assets/og-image.jpg">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="Blog — Yauhen Massalski">
<meta name="twitter:description" content="Build stories, AI takes, and guides. The build, the cost, the receipt.">
<meta name="twitter:image" content="${SITE}/_assets/og-image.jpg">
${fontsLink}
<style>${sharedCSS}</style>
${analyticsBlock}
</head>
<body>
${header}
<main>
  <section class="index-head wrap">
    <h1 class="index-h1">Blog</h1>
    <p class="index-sub">The build, the cost, the receipt. Real stories from shipping AI things while playing pro ball in France.</p>
  </section>
  <section class="index-list wrap">
    ${cards || '<p style="color:var(--bone-mute);font-style:italic">No posts yet — first one ships soon.</p>'}
  </section>
</main>
${footer}
</body>
</html>`;
}

// ---------- sitemap.xml ----------
// URLs deliberately slash-less (except root): vercel.json trailingSlash:false 308s
// /blog/ -> /blog, and a sitemap should never list redirecting URLs.
function sitemapXML(posts) {
  const newest = posts[0]?.date; // posts arrive sorted newest-first
  const urls = [
    { loc: `${SITE}/`, priority: '1.0', changefreq: 'weekly', lastmod: newest },
    { loc: `${SITE}/blog`, priority: '0.9', changefreq: 'weekly', lastmod: newest },
    ...posts.map(p => ({
      loc: `${SITE}/blog/${p.slug}`,
      priority: '0.8',
      changefreq: 'monthly',
      lastmod: p.date,
    })),
  ];
  const items = urls.map(u => `  <url>
    <loc>${u.loc}</loc>${u.lastmod ? `
    <lastmod>${u.lastmod}</lastmod>` : ''}
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>
  </url>`).join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${items}
</urlset>`;
}

// ---------- video-sitemap.xml ----------
// Lists posts that embed a YouTube video so Google's "Discovered videos" picks them up.
// Spec: https://developers.google.com/search/docs/crawling-indexing/sitemaps/video-sitemaps
function videoSitemapXML(posts) {
  const videoPosts = posts.filter(p => p.videoYT);
  const items = videoPosts.map(p => {
    const pageUrl = `${SITE}/blog/${p.slug}`;
    const thumb = `https://i.ytimg.com/vi/${p.videoYT}/maxresdefault.jpg`;
    const player = `https://www.youtube-nocookie.com/embed/${p.videoYT}`;
    return `  <url>
    <loc>${pageUrl}</loc>
    <video:video>
      <video:thumbnail_loc>${thumb}</video:thumbnail_loc>
      <video:title>${esc(p.title)}</video:title>
      <video:description>${esc(p.description)}</video:description>
      <video:player_loc allow_embed="yes">${player}</video:player_loc>
      <video:publication_date>${p.date}T00:00:00+00:00</video:publication_date>
      <video:family_friendly>yes</video:family_friendly>
      <video:platform relationship="allow">web mobile tv</video:platform>
    </video:video>
  </url>`;
  }).join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:video="http://www.google.com/schemas/sitemap-video/1.1">
${items}
</urlset>`;
}

// ---------- rss.xml ----------
function rssXML(posts) {
  const items = posts.map(p => `    <item>
      <title>${esc(p.title)}</title>
      <link>${SITE}/blog/${p.slug}</link>
      <guid>${SITE}/blog/${p.slug}</guid>
      <pubDate>${new Date(p.date).toUTCString()}</pubDate>
      <description>${esc(p.description)}</description>
    </item>`).join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>Yauhen Massalski — Blog</title>
    <link>${SITE}/blog</link>
    <description>Build stories, AI takes, and guides.</description>
    <language>en-us</language>
    <atom:link xmlns:atom="http://www.w3.org/2005/Atom" href="${SITE}/rss.xml" rel="self" type="application/rss+xml" />
${items}
  </channel>
</rss>`;
}

// ---------- copy images ----------
async function copyImages() {
  try {
    const slugs = await fs.readdir(SRC_IMG, { withFileTypes: true });
    for (const dirent of slugs) {
      if (!dirent.isDirectory()) continue;
      const slug = dirent.name;
      const srcDir = path.join(SRC_IMG, slug);
      const destDir = path.join(OUT_IMG, slug);
      await fs.mkdir(destDir, { recursive: true });
      const files = await fs.readdir(srcDir);
      for (const f of files) {
        if (f.startsWith('.')) continue;
        await fs.copyFile(path.join(srcDir, f), path.join(destDir, f));
      }
    }
  } catch (e) {
    if (e.code !== 'ENOENT') throw e;
  }
}

// ---------- main ----------
async function main() {
  const t0 = Date.now();
  console.log('▸ Building blog...');

  await fs.mkdir(OUT, { recursive: true });
  await fs.mkdir(OUT_IMG, { recursive: true });

  // Read all markdown posts
  let files = [];
  try {
    files = (await fs.readdir(SRC)).filter(f => f.endsWith('.md'));
  } catch (e) {
    if (e.code === 'ENOENT') {
      console.log('  No blog-source/posts/ directory yet. Creating.');
      await fs.mkdir(SRC, { recursive: true });
    } else {
      throw e;
    }
  }

  const posts = [];
  for (const file of files) {
    const raw = await fs.readFile(path.join(SRC, file), 'utf8');
    const { data, content } = matter(raw);

    if (data.draft === true) {
      console.log(`  ⊘ skip draft: ${file}`);
      continue;
    }

    const slug = data.slug || slugFromFilename(file);
    // Slug becomes a filesystem path and a URL — reject anything that isn't kebab-case.
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
      throw new Error(`Bad slug "${slug}" in ${file} — use lowercase letters, digits, hyphens only.`);
    }
    const html = marked.parse(content);

    posts.push({
      slug,
      title: data.title || slug,
      description: data.description || '',
      date: data.date instanceof Date ? data.date.toISOString().slice(0, 10) : (data.date || '2026-01-01'),
      lane: data.lane || 'build-story',
      hero: data.hero || null,
      videoYT: data.videoYT || null,
      tags: data.tags || [],
      readMin: readingTime(content),
      html,
    });
  }

  // sort newest first
  posts.sort((a, b) => b.date.localeCompare(a.date));

  // Write each post
  for (const post of posts) {
    const dir = path.join(OUT, post.slug);
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(path.join(dir, 'index.html'), postHTML(post));
    console.log(`  ✓ /blog/${post.slug}  (${post.readMin} min, ${laneLabel(post.lane)})`);
  }

  // Prune generated pages whose source is gone or now draft:true —
  // otherwise "unpublishing" a post leaves it live forever.
  const keep = new Set(posts.map(p => p.slug));
  for (const d of await fs.readdir(OUT, { withFileTypes: true })) {
    if (d.isDirectory() && !keep.has(d.name)) {
      await fs.rm(path.join(OUT, d.name), { recursive: true });
      console.log(`  ⊗ pruned stale /blog/${d.name}`);
    }
  }

  // Index, sitemap, video sitemap, rss
  await fs.writeFile(path.join(OUT, 'index.html'), indexHTML(posts));
  await fs.writeFile(path.join(ROOT, 'sitemap.xml'), sitemapXML(posts));
  await fs.writeFile(path.join(ROOT, 'video-sitemap.xml'), videoSitemapXML(posts));
  await fs.writeFile(path.join(ROOT, 'rss.xml'), rssXML(posts));

  // Copy images
  await copyImages();

  const videoCount = posts.filter(p => p.videoYT).length;
  const t = ((Date.now() - t0) / 1000).toFixed(2);
  console.log(`▸ Built ${posts.length} post${posts.length === 1 ? '' : 's'} in ${t}s`);
  console.log(`  index:         /blog/index.html`);
  console.log(`  sitemap:       /sitemap.xml`);
  console.log(`  video-sitemap: /video-sitemap.xml  (${videoCount} video${videoCount === 1 ? '' : 's'})`);
  console.log(`  rss:           /rss.xml`);
}

main().catch(e => { console.error(e); process.exit(1); });
