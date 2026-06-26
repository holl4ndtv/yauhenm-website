---
title: "The exact Shopify schema that makes AI read your products"
slug: exact-shopify-schema-that-makes-ai-read-your-products
date: 2026-06-21
lastUpdated: 2026-06-21
lane: ai-search
description: "The two JSON-LD blocks every Shopify store needs so AI search can read who you are and what you sell — a Person/Organization identity block and a Product/Offer block."
tags: [ai-search, schema, shopify, seo]
---

*Last updated: June 21, 2026*

**You need two JSON-LD blocks. First, a `Person` or `Organization` block with `knowsAbout` and `hasOccupation` to define who you are. Second, a `Product` block with `Offer`, `price`, and `reviewCount` to define what you sell. This explicit structure is the most reliable way to stop AI from guessing — or mislabeling — your business.**

## Why does AI mislabel my D2C brand?

I learned this the hard way. I used to think content was enough — great blogs, a strong story. It didn't work. AI search engines saw "Yauhen Massalski" and "basketball" and ignored my consulting work entirely. I was invisible to the clients who actually pay me.

I fixed it with structured data. Not keywords. Not backlinks. Code. Here's the exact pattern I used on yauhenm.com — clear instructions for a machine, nothing magic.

## What schema do I need for my store?

Two blocks: one for your identity, one for your products.

**1. The identity block (Person / Organization)** — tells AI who owns the site. Founder-operator → use `Person`. Agency → use `Organization`.
- `name`, `url`
- `hasOccupation`: list both roles honestly — e.g. "Pro basketball player" and "AI-search & growth consultant." This bridges who you are.
- `knowsAbout`: your expertise — "AI search," "SEO," "D2C growth."
- `makesOffer`: link your identity to the service you sell.

**2. The product block (Product / Offer)** — tells AI what you sell. Don't rely on plain text; AI needs structure to extract price and availability.
- `@type`: `Product`, `name`, `image`, `description`
- `offers`: nested → `price`, `priceCurrency`, `availability` (e.g. `https://schema.org/InStock`)
- `aggregateRating` (optional but powerful): `reviewCount` + `ratingValue` — only if the reviews are real.

## Does schema alone get me cited?

No. Schema is necessary, not sufficient. It hands the AI the right answer to copy — but it doesn't make the AI care enough to cite you. You still need relevance and authority. Without schema, though, you're asking the AI to read your mind, and it usually guesses wrong.

## Where does this go on Shopify?

Pick one approach, don't mix them:

1. **Theme editor (Online Store 2.0):** most modern themes (Dawn, Prestige) let you add JSON-LD via the editor or a metafield.
2. **An app** like "JSON-LD for SEO" — auto-generates the code. Easy, less control.
3. **Manual:** edit `theme.liquid`, add the script in `<head>`. My preference — full control, no bloat.

## Which fields actually matter?

| Field | Purpose | Example |
| :--- | :--- | :--- |
| `@type` | The entity | `Person` or `Product` |
| `name` | The label | "Yauhen Massalski" / a product title |
| `hasOccupation` | Your role(s) | Pro athlete + consultant |
| `knowsAbout` | Your expertise | AI search, D2C growth |
| `offers` | Sales data | nested price / availability |
| `availability` | In stock? | `schema.org/InStock` |
| `reviewCount` | Social proof | only if real |

## How do I test it?

Never trust it blind. Use Google's free **Rich Results Test**: paste your URL or code, check for errors. No errors → AI can read it. Warnings → fix them. Nothing detected → you have nothing.

One honest caveat: schema getting read isn't the same as getting cited, and a citation isn't a sale. Cited ≠ clicks ≠ revenue. But it's the floor — skip it and you're invisible to the machines.

If you want me to audit and fix your store's structured data, [here's what I do for D2C brands](/#work).

## FAQ

### What schema type does a Shopify store need?
Two: a `Person` or `Organization` identity block (`knowsAbout`, `hasOccupation`, `makesOffer`) and a `Product`/`Offer` block (`price`, `availability`, and `aggregateRating` if reviews are real).

### Can I just use a schema app?
Yes, and it's a fine start — but generic apps generate generic code and miss your specific `knowsAbout` and `hasOccupation`. Check the output in the Rich Results Test after every change.

### Do I need reviews in my schema?
Only real ones. `aggregateRating` makes AI trust your product data more — but faking it is worse than leaving it out, because inconsistencies get detected.

### Does schema replace SEO?
No. Classic SEO chases keywords; schema defines entities — who you are and what you sell. You need both: keywords bring traffic, entities earn the AI's trust as a source.
