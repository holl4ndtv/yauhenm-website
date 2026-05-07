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

Output goes to `blog/`, `sitemap.xml`, `rss.xml`.

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
