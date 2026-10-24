// The only newsletter file that differs between vertical sites.
// Everything else in lib/newsletter/ is identical across CleaningExits, VendingExits, PestExits…
export const BRAND = {
  vertical: 'cleaning',
  firm: 'CleaningExits',
  site: 'https://cleaningexits.com',
  from: 'CleaningExits <hello@cleaningexits.com>',
  replyTo: 'hello@cleaningexits.com',
  accent: '#059669',
  noun: 'cleaning business',
  nounPlural: 'cleaning businesses',
  sellerCta: { label: 'What is your cleaning business worth?', href: '/valuation' },
};

/** The pre-checked opt-in box on the NDA form. Stored with each signup as the consent text. */
export const NDA_OPT_IN_TEXT = `Email me new ${BRAND.nounPlural} for sale and market updates from ${BRAND.firm}. Unsubscribe anytime.`;
