import { NextRequest, NextResponse } from 'next/server';
import { logInbound, SITE } from '@/lib/crmInbound';

export const dynamic = 'force-dynamic';

// Seller and contact form submissions → CRM inbound queue + a heads-up email.

const NOTIFY_FROM = 'CleaningExits <notifications@cleaningexits.com>';
const NOTIFY_TO = ['john@atmbrokerage.com', 'hello@cleaningexits.com'];
const BRAND = 'CleaningExits';

const str = (v: unknown, max = 200) => (typeof v === 'string' ? v.trim().slice(0, max) : '');

function esc(s: string) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

export async function POST(req: NextRequest) {
  try {
    const b = (await req.json()) as Record<string, unknown>;
    if (str(b.website)) return NextResponse.json({ success: true }); // honeypot

    const kind = b.kind === 'seller' ? 'seller_lead' : 'buyer_question';
    const name = str(b.name, 120);
    const email = str(b.email);
    const phone = str(b.phone, 40);
    const business = str(b.business);
    const location = str(b.location);
    const revenue = str(b.revenue, 60);
    const message = str(b.message, 2000);

    if (name.length < 2) return NextResponse.json({ error: 'Please enter your name.' }, { status: 400 });
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      return NextResponse.json({ error: 'Please enter a valid email address.' }, { status: 400 });
    if (kind === 'buyer_question' && !message)
      return NextResponse.json({ error: 'Please include a message.' }, { status: 400 });

    const sourceUrl = str(b.source_url, 500) || req.headers.get('referer') || null;
    const logged = await logInbound({ kind, name, email, phone, business, location, revenue, message, sourceUrl });
    if (!logged.ok) console.error('CRM inbound insert failed:', logged.error);

    const key = process.env.RESEND_API_KEY;
    if (key) {
      const rows = [
        ['Name', name], ['Email', email], ['Phone', phone], ['Business', business],
        ['Location', location], ['Revenue', revenue],
      ].filter(([, v]) => v);
      const html = `<div style="font-family:Arial,sans-serif;max-width:600px;padding:24px;">
<p style="text-transform:uppercase;font-size:11px;letter-spacing:.1em;color:#b45309;margin:0;">${kind === 'seller_lead' ? 'New seller lead' : 'New inquiry'} – ${SITE}</p>
<h2 style="margin:8px 0 16px;">${esc(name)}${business ? ` – ${esc(business)}` : ''}</h2>
<table style="font-size:14px;">${rows.map(([k, v]) => `<tr><td style="padding:4px 16px 4px 0;color:#666;">${k}:</td><td>${esc(v)}</td></tr>`).join('')}</table>
${message ? `<div style="background:#fef7ed;border-left:3px solid #b45309;padding:12px 16px;margin-top:16px;white-space:pre-wrap;">${esc(message)}</div>` : ''}
<p style="color:#999;font-size:12px;margin-top:24px;">${logged.ok ? 'Logged to the CRM inbound queue.' : 'CRM logging FAILED – add this lead by hand.'}</p></div>`;
      const send = (payload: Record<string, unknown>) =>
        fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        }).catch((e) => console.error('Resend error', e));
      await send({
        from: NOTIFY_FROM, to: NOTIFY_TO, reply_to: email,
        subject: `[${kind === 'seller_lead' ? 'Seller' : 'Inquiry'}] ${name}${business ? ` – ${business}` : ''}`,
        html,
      });
      await send({
        from: NOTIFY_FROM, to: [email], reply_to: 'hello@cleaningexits.com',
        subject: `Thanks for reaching out to ${BRAND}`,
        text: `Hi ${name.split(' ')[0]},\n\nThanks for reaching out. We've got your note and will be in touch within one business day.\n\n– The ${BRAND} Team\n${SITE} · hello@cleaningexits.com · 888-430-5535\n`,
      });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('inquiry POST error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
