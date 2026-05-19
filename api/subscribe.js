// yauhenm.com vault signup — defense in depth + identical responses
//
// Pipeline:
//   1. Method/CORS gate
//   2. Origin lock (own domain + Vercel preview)
//   3. Honeypot drop (silent)
//   4. Email validation (regex + length cap)
//   5. Rate limit (3 per 10 min by hashed IP, in-memory)
//   6. Persist:
//      - Resend Audience if RESEND_API_KEY + RESEND_AUDIENCE_ID set
//      - Welcome email if VAULT_FROM_EMAIL set on verified domain
//      - Otherwise: console.log only (signup still acknowledged)
//
// Every code path returns the SAME {success:true} JSON so spam/error/success
// look identical to the caller. Enumeration attacks get nothing.

const ALLOWED_ORIGINS = [
  'https://yauhenm.com',
  'https://www.yauhenm.com',
];
const OK_RESPONSE = { success: true };

const RATE_WINDOW_MS = 10 * 60 * 1000;
const RATE_LIMIT = 3;
const seen = new Map(); // ip-hash -> [timestamps]

function hashIp(ip) {
  let h = 5381;
  for (let i = 0; i < ip.length; i++) h = ((h << 5) + h + ip.charCodeAt(i)) | 0;
  return String(h);
}

function isValidEmail(e) {
  if (typeof e !== 'string') return false;
  const v = e.trim();
  if (v.length < 5 || v.length > 254) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v);
}

function isAllowedOrigin(origin) {
  if (!origin) return false;
  if (ALLOWED_ORIGINS.includes(origin)) return true;
  return /^https:\/\/[\w-]+-yauhen.*\.vercel\.app$/i.test(origin)
      || /^https:\/\/yauhenm-(site|com)-[\w-]+\.vercel\.app$/i.test(origin);
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');

  // CORS preflight
  if (req.method === 'OPTIONS') {
    const origin = req.headers.origin || '';
    if (isAllowedOrigin(origin)) {
      res.setHeader('Access-Control-Allow-Origin', origin);
      res.setHeader('Access-Control-Allow-Methods', 'POST');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    }
    return res.status(204).end();
  }

  if (req.method !== 'POST') {
    return res.status(200).json(OK_RESPONSE);
  }

  const origin = req.headers.origin || '';
  if (!isAllowedOrigin(origin)) {
    return res.status(200).json(OK_RESPONSE);
  }

  let body = req.body;
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch { body = {}; }
  }
  if (!body || typeof body !== 'object') body = {};

  // Honeypot — bots fill hidden fields. Drop silent.
  if (body.website || body.url || body.company) {
    return res.status(200).json(OK_RESPONSE);
  }

  const email = (body.email || '').trim().toLowerCase();
  if (!isValidEmail(email)) {
    return res.status(200).json(OK_RESPONSE);
  }

  // Rate limit
  const xff = (req.headers['x-forwarded-for'] || '').split(',')[0].trim();
  const ip = xff || req.socket?.remoteAddress || 'unknown';
  const key = hashIp(ip);
  const now = Date.now();
  const arr = (seen.get(key) || []).filter(t => now - t < RATE_WINDOW_MS);
  if (arr.length >= RATE_LIMIT) {
    return res.status(200).json(OK_RESPONSE);
  }
  arr.push(now);
  seen.set(key, arr);

  // Resend integration (gated on env vars — works progressively as keys arrive)
  const RESEND_API_KEY = process.env.RESEND_API_KEY;
  const RESEND_AUDIENCE_ID = process.env.RESEND_AUDIENCE_ID;
  const FROM_EMAIL = process.env.VAULT_FROM_EMAIL;

  if (RESEND_API_KEY && RESEND_AUDIENCE_ID) {
    try {
      await fetch(`https://api.resend.com/audiences/${RESEND_AUDIENCE_ID}/contacts`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, unsubscribed: false }),
      });
    } catch (e) {
      console.error('resend-audience-fail', e?.message || e);
    }
  }

  if (RESEND_API_KEY && FROM_EMAIL) {
    try {
      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: FROM_EMAIL,
          to: email,
          subject: "You're on the list.",
          text: [
            "When I ship something, you get the receipt.",
            "Build, cost, the files I used. Maybe twice a month.",
            "",
            "Reply to this email anytime.",
            "",
            "— Yauhen",
            "https://yauhenm.com",
          ].join('\n'),
        }),
      });
    } catch (e) {
      console.error('resend-welcome-fail', e?.message || e);
    }
  }

  if (!RESEND_API_KEY) {
    console.log('vault-signup-pending', { email });
  }

  return res.status(200).json(OK_RESPONSE);
}
