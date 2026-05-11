---
title: "I built a $0 customer service bot for a taco shop"
slug: zero-dollar-bot-for-a-taco-shop
date: 2026-05-11
lane: build-story
description: "Crack Taco needed a customer service bot. I had a $20 Claude Max subscription. Here's the loop that trained it to 50/50 accuracy for zero dollars — and the side hustle anyone with the same subscription can run."
tags: [claude-max, customer-service-bot, side-hustle, ai-build, small-business]
---

A taco shop in town needed a customer service bot.

Hours, menu, allergens, "do you do catering" — same forty questions every week, taking up the owner's time. He'd looked at the off-the-shelf options. They started at a couple hundred bucks a month and locked him into someone else's platform.

I had a $20 Claude Max subscription. So I built him one for zero dollars.

Not "cheap." Not "almost free." **Zero.** Same subscription I was already paying for. Final score: 50 out of 50 on the training set, 14 out of 15 on the validation set. The taco shop now has a bot that answers the forty questions, and the owner has his evenings back.

This post is the receipt — the actual loop, what each piece does, and why I'm telling you about it. Because if you have a Max subscription, you have the same lab on your laptop right now. Most people are using it to write code. Almost nobody is using it to build paid products for the small businesses two blocks from their apartment.

That's the hustle.

## What Crack Taco actually needed

I want to start here because the technical part is the boring part. The interesting part is the shape of the problem.

The owner gets DMs on Instagram, calls during the lunch rush, walk-ins asking what's gluten-free, third-party delivery support tickets. Every channel, same handful of questions. He's not asking for a chatbot to talk to customers like a person — he's asking for a system that can answer the obvious stuff so he can focus on the food.

That's the bar. Answer the forty questions accurately. Refuse to make up answers about anything else.

Which means the whole problem is: do you have a knowledge base that's tight enough, and a model small enough, to answer those forty questions on a phone for a few cents an hour?

Yes. That's all this is.

## The three-model loop

The actual technique is called adversarial training. Sounds intimidating. It's not.

You have three jobs:

- Someone has to **mutate** the knowledge base — rewrite weak answers, find edge cases, stress-test things. This needs the smartest model available.
- Someone has to **judge** every mutation. Thumbs up, thumbs down. Did the rewrite actually make it better?
- Someone has to **run the bot in production** — fast, cheap, good enough.

Three jobs, three models. I used Claude.

**Opus does the mutating.** Opus is expensive when you pay by the token. But I'm on the Max subscription, so I'm not paying by the token — I'm paying twenty bucks a month flat. Opus is allowed to be picky and verbose and rewrite everything four times.

**Sonnet does the judging.** Mid-cost model, very good at saying "this version is better than that version." It looks at the old answer and the new answer and picks one. Sonnet is the quality bouncer.

**Haiku runs the actual bot.** Cheapest, fastest model in the lineup. The one customers will eventually talk to. Once the knowledge base is good enough, Haiku can answer the forty questions reliably and the cost per conversation is fractions of a cent.

Each iteration of the loop does this:

1. Run 50 probe questions against the current knowledge base using Haiku. See what fails.
2. Opus reads the failures and rewrites the weak parts of the knowledge base.
3. Sonnet compares old answers vs new answers, accepts the wins, rejects the regressions.
4. Re-run the 50 probes. Score.
5. Repeat until the score plateaus.

Plus a **held-out validation set** of 15 different questions Opus and Sonnet never saw — so I know it's actually learning, not just memorizing the probes.

That's the whole thing.

## The cost, before and after

Before the Max subscription, the same loop on the regular Anthropic API would have cost me roughly seven dollars per run on credits. Not a lot of money. But not zero. And every time I tweaked the prompt or added a new question, that was another seven dollars.

With the Max subscription, I run the same pipeline using `claude -p --model opus` (or sonnet, or haiku) right from the terminal. No API key. No metered billing. Same models, same quality. Just running through the CLI instead of the console.

Twenty bucks a month covers as many runs as I want. It covers Crack Taco. It covers the next ten clients. It covers experiments I haven't started yet.

This is the part nobody talks about. The Max subscription is marketed as "Claude for coding." It is. But it's also a free machine-learning training lab if you point it at the right job.

## The hustle anyone can run

Here's why this is the actual story.

Every small business owner in your town has the same forty questions problem. The barbershop. The dentist. The taco shop. The yoga studio. The roofing company. They get the same DMs and the same calls every week, and they're either ignoring them or hiring someone part-time to answer them.

You can solve that for them in a weekend.

You need three things:

- A Claude Max subscription. Twenty bucks a month.
- A list of the forty questions and the correct answers. The owner gives you this — it's an hour of his time, max.
- The adversarial loop above, pointed at that knowledge base.

That's it. No infrastructure. No API budget. No platform lock-in. The output is a knowledge base file and a thin Haiku wrapper they can embed in their website, hook to their Instagram, or run on their phone.

Charge them what the off-the-shelf platforms charge. Three hundred a month, four hundred a month, whatever the local market bears. Your cost is twenty bucks total because the same subscription serves every client.

I'm not telling you to undercut software companies. I'm telling you that if you're already paying for a Max sub to write code, you're sitting on a tool that pays for itself ten times over the first month you point it at a real local business.

## What this looks like in practice

The Crack Taco bot is running now. The owner pasted the knowledge base into the system prompt, plugged the bot into his Instagram DMs through a simple webhook, and called me to say his lunch rush was quieter.

The bot doesn't replace him. It buys him back the hours he was spending typing the same answers.

I'll put the actual scripts up next post — the probe runner, the Opus mutation prompt, the Sonnet judge prompt, the Haiku production wrapper. Anyone with a Max subscription can clone it and run it on their first client this week.

If you want the prompts before I get around to publishing them, send me a message on [TikTok](https://www.tiktok.com/@y.massalski) or [LinkedIn](https://www.linkedin.com/in/yauhen-massalski/). I'll send them over.

The build, the cost, the receipt.

That's the whole loop.
