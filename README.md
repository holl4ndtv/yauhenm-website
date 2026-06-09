# yauhenm.com

Static personal site + blog. Live at https://yauhenm.com.

## Layout

```
.
├── index.html          # homepage (V4)
├── _assets/            # images, logos, video thumbnails
├── blog/               # generated blog posts (do not edit by hand)
├── blog-source/        # markdown source for blog posts
│   └── posts/<date>-<slug>.md
├── scripts/
│   ├── build-blog.mjs  # markdown → HTML build
│   └── update-content.sh  # pulls latest YT/TT into homepage
├── sitemap.xml         # generated
├── rss.xml             # generated
└── robots.txt
```

## Local build

```bash
cd scripts && npm install && npm run build
```

Output goes to `blog/`, `sitemap.xml`, `video-sitemap.xml`, `rss.xml`.
Unpublishing works: set `draft: true` in a post's frontmatter (or delete the .md) and rebuild — the generated page is pruned.

## Refresh homepage videos

```bash
bash scripts/update-content.sh   # pulls latest 2 YouTube + 4 TikToks, converts thumbs to WebP, patches index.html
git add -A && git commit -m "Refresh videos" && git push
```

Needs `yt-dlp` (+ `cwebp` or `ffmpeg` for WebP). If TikTok scraping fails, YouTube still updates.
Rewritten 2026-06-09 — the old version targeted deleted `v4-deploy/` paths and silently did nothing.

## Newsletter (NOT fully wired — signups currently go to logs only)

`api/subscribe.js` persists subscribers to Resend **only if** these Vercel env vars exist (none are set as of 2026-06-09, checked via `vercel env ls`):

| var | what |
|---|---|
| `RESEND_API_KEY` | Resend API key |
| `RESEND_AUDIENCE_ID` | Resend audience to add contacts to |
| `VAULT_FROM_EMAIL` | optional — sender for the welcome email (needs verified domain in Resend) |

Until they're set, every signup is only `console.log`ged in Vercel function logs (which expire) — i.e. **effectively lost**. Set them with `vercel env add <NAME> production`, then redeploy.

## Analytics

- GA4 `G-Y3Y0WPV74V` with Consent Mode v2 (US granted, EU/UK/CH denied by default) — on homepage **and** blog pages.
- Vercel **Speed Insights**: enabled, loads fine.
- Vercel **Web Analytics**: NOT enabled for this project — its script 404'd, so the tag was removed 2026-06-09. To bring it back: enable in Vercel dashboard → Analytics, then re-add `/_vercel/insights/script.js` in `index.html` + `scripts/build-blog.mjs`.
- Google Search Console: verification token still TODO (see comment in `index.html` head).

## Deploy

Vercel auto-deploys `main` branch on push. Build command (set in `vercel.json`):
`cd scripts && npm install --silent && npm run build`.

## How posts get here

1. Hub on Vultr writes a markdown file to `blog-source/posts/`
2. Hub commits + pushes to this repo
3. Vercel sees the push, runs the build, redeploys
4. New post appears at `https://yauhenm.com/blog/<slug>` ~15 sec later

## Revert path

- **Vercel** — https://vercel.com/yaus-projects-fb053b5f/yauhenm-site/deployments → find an earlier deployment → Promote to Production
- **Old Next.js source** — `~/projects/personal/47-yauhen-brand/yauhenm-com-launch-2026-05-01/old-site-backup/yauhen-massalski-site-source.zip`

<!-- 2026-05-07: GitHub-Vercel auto-deploy wired -->
