// Site signup form → this vertical's list (double opt-in: we email a confirm link).
import type { NextApiRequest, NextApiResponse } from 'next';
import { subscribe, sendConfirmEmail, looksLikeBot } from '@/lib/newsletter/subscribers';
import { BRAND } from '@/lib/newsletter/brand';

const s = (v: unknown, n = 200) => (typeof v === 'string' ? v.trim().slice(0, n) : Array.isArray(v) ? v.join(', ').slice(0, n) : '');

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const b = req.body || {};
  const email = s(b.email).toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return res.status(400).json({ error: 'Valid email is required' });

  // Bots: hidden honeypot field filled, form submitted implausibly fast, or a bot-pattern name/address.
  // Answer as if it worked so they don't adapt; nothing is stored and no email goes out.
  const elapsed = Number(b.elapsed_ms);
  if (s(b.hp_ref) || (Number.isFinite(elapsed) && elapsed < 2500) || looksLikeBot(email, s(b.first_name, 80))) {
    console.warn('subscribe: bot-like signup ignored', { email, elapsed_ms: b.elapsed_ms });
    return res.status(200).json({ message: 'Check your email to confirm your subscription' });
  }

  try {
    const r = await subscribe({
      email,
      source: s(b.source) || `${BRAND.site.replace('https://', '')}/subscribe`,
      role: b.role === 'seller' ? 'seller' : 'buyer',
      confirmed: false,
      explicit: true,
      firstName: s(b.first_name, 80) || null,
      profile: {
        budget: s(b.budget), states: s(b.states), category: s(b.category), timeline: s(b.timeline),
        financing: s(b.financing), notes: s(b.notes, 1000),
      },
      consentText: `Subscribed to the ${BRAND.firm} weekly via the website signup form`,
      ip: (req.headers['x-forwarded-for'] as string | undefined)?.split(',')[0]?.trim() || null,
      userAgent: (req.headers['user-agent'] as string | undefined) || null,
    });
    if (r.confirmed) return res.status(200).json({ message: "You're already subscribed!" });
    await sendConfirmEmail(email, s(b.first_name, 80), r);
    return res.status(200).json({ message: 'Check your email to confirm your subscription' });
  } catch (error) {
    console.error('Subscribe error:', error);
    return res.status(500).json({ error: 'Failed to subscribe. Please try again.' });
  }
}
