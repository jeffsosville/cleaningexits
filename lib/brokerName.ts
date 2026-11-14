// "gregg kunz, cbi, m&ami" -> "Gregg Kunz, CBI, M&AMI". Scraped broker names arrive
// lowercase; keep short credential tokens upper-case and leave mixed-case names alone.
const UPPER = new Set(['cbi', 'm&ami', 'cba', 'cpa', 'mba', 'llc', 'inc', 'ibba', 'abi', 'bcb', 'cvb', 'jd', 'ii', 'iii', 'usa']);
export function brokerName(raw?: string | null): string {
  const s = (raw || '').trim();
  if (!s || /[A-Z]/.test(s)) return s;
  return s.replace(/[^\s,]+/g, (w) => {
    const bare = w.replace(/[.]/g, '').toLowerCase();
    if (UPPER.has(bare)) return w.toUpperCase();
    return w.charAt(0).toUpperCase() + w.slice(1);
  });
}
