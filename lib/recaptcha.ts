// Server-side reCAPTCHA v3 verification.
// Env: RECAPTCHA_SECRET_KEY (server), NEXT_PUBLIC_RECAPTCHA_SITE_KEY (client).
// With no secret configured, verification is skipped so forms keep working until keys are added.

const MIN_SCORE = Number(process.env.RECAPTCHA_MIN_SCORE || 0.5);

export type RecaptchaResult = { ok: boolean; skipped?: boolean; score?: number; reason?: string };

export async function verifyRecaptcha(token: unknown, action: string, ip?: string | null): Promise<RecaptchaResult> {
  const secret = process.env.RECAPTCHA_SECRET_KEY;
  if (!secret) {
    console.warn('RECAPTCHA_SECRET_KEY not set; skipping reCAPTCHA check');
    return { ok: true, skipped: true };
  }
  if (typeof token !== 'string' || !token) return { ok: false, reason: 'missing-token' };

  const body = new URLSearchParams({ secret, response: token });
  if (ip) body.set('remoteip', ip);

  try {
    const res = await fetch('https://www.google.com/recaptcha/api/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
    });
    const j = (await res.json()) as { success?: boolean; score?: number; action?: string; 'error-codes'?: string[] };
    if (!j.success) return { ok: false, reason: (j['error-codes'] || ['failed']).join(',') };
    if (j.action !== action) return { ok: false, score: j.score, reason: `action-mismatch:${j.action}` };
    if (typeof j.score === 'number' && j.score < MIN_SCORE) return { ok: false, score: j.score, reason: 'low-score' };
    return { ok: true, score: j.score };
  } catch (e) {
    // Google unreachable: let the lead through rather than lose it.
    console.error('reCAPTCHA verify error', e);
    return { ok: true, skipped: true, reason: 'verify-error' };
  }
}
