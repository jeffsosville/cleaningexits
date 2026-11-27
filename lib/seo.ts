// lib/seo.ts
// Small helpers shared by listing pages.

/**
 * Trim text for a meta description at a word boundary, never mid-word or
 * mid-sentence with a dangling comma. Prefers ending on a full sentence when
 * one fits in the limit.
 */
export function metaDescription(text: string | null | undefined, max = 155): string {
  const s = (text || '').replace(/\s+/g, ' ').trim();
  if (s.length <= max) return s;
  const cut = s.slice(0, max);
  const sentenceEnd = Math.max(cut.lastIndexOf('. '), cut.lastIndexOf('! '), cut.lastIndexOf('? '));
  if (sentenceEnd > max * 0.6) return cut.slice(0, sentenceEnd + 1);
  const space = cut.lastIndexOf(' ');
  return cut.slice(0, space > 0 ? space : max).replace(/[\s,;:–—-]+$/, '') + '…';
}

/** "$350,000" -> "$350K", "$1,250,000" -> "$1.25M". */
export function compactMoney(n: number | null | undefined): string | null {
  if (n == null || !isFinite(n)) return null;
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2).replace(/\.?0+$/, '')}M`;
  if (n >= 1_000) return `$${Math.round(n / 1_000)}K`;
  return `$${n}`;
}

export const DEFAULT_OG_IMAGE = 'https://cleaningexits.com/og-default.png';
