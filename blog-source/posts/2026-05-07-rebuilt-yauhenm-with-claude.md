---
title: "I rebuilt my own website with Claude in one morning"
slug: rebuilt-yauhenm-with-claude
date: 2026-05-07
lane: build-story
description: "How I redesigned yauhenm.com with Claude Opus in about four hours. Three rejected directions, one shipped V4, and what I'd do differently next time."
tags: [claude, personal-site, build-log, vercel, design]
videoYT: m055u82ugpM
---

The site you're reading this on didn't exist a week ago.

Or rather — there was a site at this domain, but it was the second one. Built on Next.js back when I thought a personal site needed to be a portfolio. It looked fine. It also looked like every other "athlete-turned-builder" site you've ever opened.

This is what replaced it, and how I built it on a Wednesday morning between practice and afternoon film.

## The brief I gave Claude

> *"Pro athlete + AI builder, equal weight. Personal hub, not a vault funnel. Mobile-first because that's where 80% of visits open."*

That's the whole brief. No deck. No mood board.

What I asked for next was the part most people skip: I made Claude grill **me** on the specifics before writing a single line of HTML. Eight questions. Things like — *what does the hero literally show?* and *do you sell anything on this site or no?* and *if a stranger lands here from a TikTok bio link, what's the one thing you want them to feel?*

That conversation took 20 minutes. Most of the build was already done by the end of it.

## V1, V2, V3 — all rejected

Claude shipped three variations in parallel. Editorial magazine. Tactical operator. Athlete poster.

I opened them on my phone. Killed the first two in 30 seconds.

> "Option 3 looks the best, misses a picture in the beginning. The rest look like a basic Shopify store bullshit."

The lesson there isn't that Claude got it wrong twice. It's that **showing me three options at once was the right move.** I couldn't have told you in advance what I wanted. I could tell you in two seconds what I didn't, once I saw it.

If you're using AI to build anything visual — never accept the first render. Always ask for two or three. Pick by elimination.

## V4 was the rebuild from scratch

V3 had the right energy but the content underneath was wrong. Claude had grilled me on what the site should *do*, but it had been making up the *content* — fake timeline dates, fake job titles, fake project names. I caught it because I noticed Lithuania was in the wrong year.

The fix: I told Claude to read my old site's source code.

The whole real timeline was sitting in a `TimelineSection.tsx` file that I'd written six months ago. Real dates, real teams, real jersey numbers. Once Claude pulled from that, the made-up version got replaced with the actual one in about ten minutes.

**This is the rule I'm taking forward:** if you're redesigning something that already exists, don't ask the AI for content. Point it at the source code of the old version. The truth is already there.

## What V4 has that V1–V3 didn't

- A real photo of me in the hero, not an AI render
- The Y. logo from my YouTube channel, not a generic monogram
- The actual story (three knee surgeries, not "a comeback journey")
- Brand logos with cream backplates so they don't disappear on the dark background — I had to ship V4 R2, R3, R4, R5 before noticing they were invisible
- A floating navigation bar that fades in 1.2 seconds after the page paints, instead of trying to be clever with scroll listeners that broke in three browsers

That last one took an embarrassingly long time. The first version listened for scroll events. It worked on my Mac, broke on iPhone Safari, half-worked in Chrome. The fix was to not listen for scroll at all. Just `setTimeout(showBar, 1200)`.

> Sometimes the right answer is the dumb answer. I've been writing software long enough that I should know this by now and somehow always have to relearn it.

## The actual cost

A morning of my time, including QC at three screen sizes. The Claude usage is on a Max subscription so the iterations don't bill per token. The hero photo was already on disk. The brand logos were free off the company sites. The fonts are Google's. Hosting is Vercel's free tier.

The whole site, soup to nuts, ran on tools I was already paying for.

## What I'd do differently

**Start with the existing source, not a brief.** I wasted maybe 90 minutes asking Claude questions it could have answered itself by reading my old code. The grill was useful for direction, but the *facts* were always in the repo.

**QC the boring stuff first.** Logo contrast on dark backgrounds is the kind of thing that should be checked in five seconds, not in round five.

**Build the blog before you need it.** I'm shipping that part now — what you're reading is the first post. Should have done it day one.

---

If you want the actual file structure I used, the build script, or the prompt I gave Claude for the grill — that's coming next post. I'll publish the whole template so you can run it on your own site.

The video that pairs with this post is embedded above. Same story, different format, different things in each. Watch one or read one or both.
