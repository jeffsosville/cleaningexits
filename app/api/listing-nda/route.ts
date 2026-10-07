import { NextRequest, NextResponse } from 'next/server';
import { createNDAToken } from '@/lib/nda/createToken';
import {
  NDA_VERSION,
  NDA_AGREEMENT_TEXT,
  NDA_COOKIE_NAME,
  NDA_COOKIE_MAX_AGE,
  addTokenToCookieMap,
} from '@/lib/nda/ndaTerms';

export const dynamic = 'force-dynamic';

// Ported from atmbrokerage-next. Validation is hand-rolled rather than zod,
// since CleaningExits doesn't carry that dependency and the shape is small.

type Body = Record<string, unknown>;

const str = (v: unknown) => (typeof v === 'string' ? v.trim() : '');

function validate(b: Body): { ok: true; data: any } | { ok: false; error: string } {
  const buyer_name = str(b.buyer_name);
  const buyer_email = str(b.buyer_email);
  const buyer_phone = str(b.buyer_phone);
  const source_listing_slug = str(b.source_listing_slug);
  const listing_title = str(b.listing_title);

  if (buyer_name.length < 2 || buyer_name.length > 120)
    return { ok: false, error: 'Please enter your full name.' };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(buyer_email) || buyer_email.length > 200)
    return { ok: false, error: 'Please enter a valid email address.' };
  if (buyer_phone.length < 7 || buyer_phone.length > 40)
    return { ok: false, error: 'Please enter a valid phone number.' };
  if (!source_listing_slug || !listing_title)
    return { ok: false, error: 'Missing listing details.' };
  if (b.agree_nda !== true)
    return { ok: false, error: 'You must agree to the NDA to continue.' };

  return {
    ok: true,
    data: {
      buyer_name,
      buyer_email,
      buyer_phone,
      buyer_company: str(b.buyer_company) || null,
      buyer_budget_range: str(b.buyer_budget_range) || null,
      interest_notes: str(b.interest_notes).slice(0, 2000) || null,
      source_listing_slug,
      source_url: str(b.source_url).slice(0, 500),
      listing_title,
      listing_asking_price_display: str(b.listing_asking_price_display) || null,
    },
  };
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as Body;

    // Honeypot — bots fill hidden fields. Return success so they don't retry.
    if (str(body.website).length > 0) {
      return NextResponse.json({ success: true });
    }

    const parsed = validate(body);
    if (!parsed.ok) {
      return NextResponse.json({ error: parsed.error }, { status: 400 });
    }

    // x-forwarded-for is comma-separated on Vercel; first entry is the client.
    const ipAddress =
      req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      req.headers.get('x-real-ip') ||
      null;

    const result = await createNDAToken({
      ...parsed.data,
      referrer: req.headers.get('referer') || null,
      user_agent: req.headers.get('user-agent') || null,
      ip_address: ipAddress,
      nda_version: NDA_VERSION,
      nda_text: NDA_AGREEMENT_TEXT,
    });

    if (!result.success || !result.token) {
      console.error('NDA token creation failed:', result.error);
      return NextResponse.json(
        { error: result.error || 'Failed to create access' },
        { status: 500 }
      );
    }

    const response = NextResponse.json({
      success: true,
      dealHubUrl: result.dealHubUrl,
    });

    // Accumulate access per listing so a prior signature isn't overwritten.
    const updatedMap = addTokenToCookieMap(
      req.cookies.get(NDA_COOKIE_NAME)?.value,
      parsed.data.source_listing_slug,
      result.token
    );
    response.cookies.set(NDA_COOKIE_NAME, updatedMap, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: NDA_COOKIE_MAX_AGE,
      path: '/',
    });

    return response;
  } catch (err) {
    console.error('listing-nda POST error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
