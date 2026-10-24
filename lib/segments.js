// lib/segments.js
// Spoke pages under /valuation/{slug}. Copy only: every number on these pages
// comes from DealLedger (market_multiple_by_segment) at build time, and a
// segment below MIN_SAMPLE returns 404 rather than a thin page.
//
// `segment` is the key in market_multiple_by_segment; `slug` is the URL.

export const SEGMENTS = {
  cleaning: {
    residential: {
      segment: 'residential',
      label: 'Residential cleaning',
      noun: 'residential cleaning business',
      h1: 'What is a residential cleaning business worth?',
      title: 'Residential Cleaning Business Valuation: What Maid Services Sell For',
      lede:
        'House cleaning and maid services are valued on owner earnings, the same as the rest of the industry, but buyers read the numbers differently. Here is where listed residential businesses are priced, and why.',
      keyQuestion: 'What multiple does a residential cleaning business sell for?',
      sections: [
        {
          heading: 'Why residential multiples look the way they do',
          body: [
            'Residential revenue is many small, recurring clients rather than a few contracts. That spreads risk, which buyers like: losing one home barely moves the numbers. It also means there is usually no written agreement behind the revenue, so a buyer is paying for client habits rather than signed terms.',
            'Recurring frequency is the asset. A book of weekly and biweekly clients on autopay is worth far more than the same revenue made up of one-time deep cleans and move-outs. Expect a buyer to ask for revenue split by visit frequency.',
            'Residential businesses are mostly smaller, and smaller businesses trade at lower multiples across every industry. Compare against the size bands on the main valuation page, not just the segment median.',
            'Read the asking multiple above with care. Residential owners tend to list high: the residential listings that come off the market unsold were priced far lower, at around two times earnings. Commercial businesses are worth more, in total price and in what buyers actually pay per dollar of earnings.',
          ],
        },
        {
          heading: 'What raises a residential valuation',
          body: [
            'Client retention you can show: month-by-month active client counts for two years, and how many of today’s clients were on the books a year ago.',
            'Booking and payment run through software, with card-on-file billing. It proves the revenue and shows the business runs without the owner chasing invoices.',
            'Cleaners who are properly classified, with an office manager or lead who handles scheduling. If the owner still answers every call and fills every gap, the buyer is buying a job.',
            'Reviews and a lead source that does not depend on the owner personally: search rankings, a referral program, or a booking site that keeps producing new clients.',
          ],
        },
        {
          heading: 'What lowers it',
          body: [
            'Cash payments that do not appear in the books. Unrecorded revenue cannot be valued or financed.',
            'Independent-contractor crews treated like employees. Buyers and SBA lenders discount misclassification risk.',
            'A client list concentrated in one neighborhood or one referral source that could disappear with the owner.',
          ],
        },
      ],
      faqs: [
        {
          q: 'How is a house cleaning business valued?',
          a: 'Usually as a multiple of seller’s discretionary earnings: net profit plus the owner’s salary, personal expenses run through the business, interest, depreciation and one-time costs. The multiple then moves with recurring client share, retention and how dependent the business is on the owner.',
        },
        {
          q: 'Is a residential cleaning business worth less than a commercial one?',
          a: 'Yes. Commercial cleaning businesses are worth more: they are typically about twice the size in earnings, and in closed deals buyers pay more per dollar of earnings for contracted commercial revenue than for residential client lists. Residential asking multiples can look high, but residential listings that come off the market without a sale were priced well below where commercial ones were.',
        },
        {
          q: 'Can a buyer use an SBA loan for a maid service?',
          a: 'Yes. Residential cleaning businesses are financed with SBA 7(a) loans regularly. Lenders want earnings they can verify from tax returns, so revenue that never reached the books does not count toward the price a buyer can borrow against.',
        },
      ],
    },

    commercial: {
      segment: 'commercial',
      label: 'Commercial & janitorial',
      noun: 'commercial cleaning business',
      h1: 'What is a commercial cleaning or janitorial business worth?',
      title: 'Commercial Cleaning & Janitorial Business Valuation: Current Multiples',
      lede:
        'Commercial cleaning and janitorial companies are valued on the contracts behind the revenue. Here is where listed commercial businesses are priced, and what moves a buyer up or down the range.',
      keyQuestion: 'What multiple does a commercial cleaning business sell for?',
      sections: [
        {
          heading: 'Commercial and janitorial are one market here',
          body: [
            'Brokers use “commercial cleaning” and “janitorial” for the same businesses: recurring contract cleaning for offices, medical facilities, schools and industrial sites. The figures on this page combine them, because splitting them would only split the sample.',
          ],
        },
        {
          heading: 'Contracts are the asset',
          body: [
            'A buyer is purchasing contracted monthly revenue. Written agreements with defined scope, pricing and term, and that can be assigned to a new owner, are what the multiple is paid on. Handshake accounts are valued, but at a discount.',
            'Customer concentration is the most common reason a commercial deal reprices. One account above roughly a quarter of revenue makes the business a bet on that customer, and buyers will price it that way.',
            'Contract length and renewal history matter as much as the current list. Accounts that have renewed several times tell a buyer the revenue survives a change in who is doing the work.',
          ],
        },
        {
          heading: 'What raises a commercial valuation',
          body: [
            'A spread of accounts across industries and buildings, with no single client dominating.',
            'Supervisors or area managers who handle the accounts day to day, so client relationships do not leave with the seller.',
            'Documented labor: legal classification, stable crews, and wages that leave room for margin if rates rise.',
            'Margins and pricing that can be shown per account, so a buyer can see which contracts carry the business and which lose money.',
          ],
        },
      ],
      faqs: [
        {
          q: 'Is a commercial cleaning business worth more than a residential one?',
          a: 'Yes. Commercial businesses are usually larger, and buyers pay more per dollar of earnings for revenue that sits under written, assignable contracts than for a residential client list. That is why commercial companies sell for more in total and, in closed deals, at higher multiples.',
        },
        {
          q: 'How are janitorial businesses valued?',
          a: 'As a multiple of seller’s discretionary earnings for owner-operated companies, or of EBITDA for larger ones with management in place. Where a business sits in the range comes down to contract quality, customer concentration and how much the owner still does.',
        },
        {
          q: 'Do commercial cleaning contracts transfer to a buyer?',
          a: 'Only if they allow assignment or the customer agrees. Buyers check every major contract for change-of-control and assignment terms during diligence, so it pays to know the answer before listing.',
        },
        {
          q: 'Why do larger janitorial companies get higher multiples?',
          a: 'Larger companies usually have managers between the owner and the customers, more accounts, and audited or reviewed financials. That lowers the risk a buyer takes on and widens the pool of buyers, including private equity.',
        },
      ],
    },
  },
};

export function segmentsFor(vertical) {
  return SEGMENTS[vertical] || {};
}

/** slug for a segment key, or null if it has no spoke page. */
export function slugForSegment(vertical, segmentKey) {
  const entries = Object.entries(segmentsFor(vertical));
  const hit = entries.find(([, cfg]) => cfg.segment === segmentKey);
  return hit ? hit[0] : null;
}
