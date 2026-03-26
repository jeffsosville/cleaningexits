# CLAUDE.md — CleaningExits

## What this project is
CleaningExits is a vertical marketplace for buying and selling cleaning businesses. It is the first and most mature vertical in a planned 15-20 vertical portfolio. The broader architecture lives in this codebase — new verticals are spun up by extending the vertical config system here.

- Live site: cleaningexits.com
- Repo location: ~/cleaningexits
- Deploys to: Vercel (Next.js App Router)

---

## Supabase Project

| Project | ID | Purpose |
|---|---|---|
| CleaningExits / business-listings | `ctvrauiiskucinibnfaj` | Hosts `cleaning_listings_merge`, frontend data |

Always use `SUPABASE_URL` and `SUPABASE_SERVICE_KEY` env vars. Never hardcode credentials.

---

## Key Tables

- `cleaning_listings_merge` — primary listings table, 3,427 cleaning-vertical listings synced from DealLedger
- LQS scores and tiers are present on listings (synced from DealLedger pipeline)

---

## Vertical Config Architecture

CleaningExits is the template. New verticals are created by adding a config file and setting the `NEXT_PUBLIC_VERTICAL` env var.

### Config files
- `pest.vertical.ts`
- `plumbing.vertical.ts`
- `registry.ts` — vertical registry, import all verticals here

### Active vertical repos (all on Vercel)
- `pestcontrolexits`
- `plumbingexits`
- `hvacexits`
- `landscapeexits`
- `vendingexits` — live at vendingexits.com, 486 listings

### Critical env var rule
`NEXT_PUBLIC_VERTICAL` must be **lowercase**. This has caused silent failures before — always verify casing when spinning up a new vertical.

---

## Email Infrastructure

### Resend
- Workspace: `dealranker`
- Sending address: `hello@cleaningexits.com`
- Used for: buyer reactivation blasts, weekly Top 10 emails
- Last blast: 498 subscribers, 349 delivered, 97.21% deliverability

### Mailchimp
- ATM Brokerage list: ~10,868 subscribers
- ConnectATM list: ~8,313 subscribers
- Tag taxonomy: role/status/source/geo prefixes (keep consistent)

### Instantly
- Used for cold outreach / broker campaigns
- 105-contact broker outreach loaded from `instantly_broker_outreach.csv`

---

## Lead Capture System
Buyer emails are captured before broker contact info is revealed. Do not bypass or remove this gate — it is the core list-building mechanism.

---

## Programmatic SEO
- State and city pages are generated programmatically
- Sitemap generation is automated
- JSON-LD structured data is in place (fixes were applied — don't regress)
- Deep-dive analysis pages exist (Utah janitorial deal is the template)

---

## Listing Quality Score (LQS)
Synced from DealLedger. Four tiers: Verified, Likely Real, Unverified, Likely Junk.

Components in this repo:
- `QualityBadge.tsx`
- `QualityFilter.tsx`
- `QualityStatBanner.tsx`

Do not modify LQS scoring logic here — scoring happens upstream in DealLedger pipeline.

---

## VA Responsibilities
- **Sanny** handles front-end QA and page updates
- Loop Sanny in on any frontend changes that affect visible pages before deploying

---

## Common Mistakes to Avoid
- Do NOT set `NEXT_PUBLIC_VERTICAL` with uppercase — always lowercase
- Do NOT remove the lead capture gate before broker contact info
- Do NOT modify LQS scoring logic in this repo — it lives in DealLedger
- Do NOT regress JSON-LD structured data fixes
- Do NOT create new vertical configs without adding them to `registry.ts`

---

## Deployment Checklist for New Verticals
1. Create `[vertical].vertical.ts` config
2. Register in `registry.ts`
3. Create new Vercel project from this repo
4. Set `NEXT_PUBLIC_VERTICAL` env var (lowercase)
5. Set `SUPABASE_URL` and `SUPABASE_SERVICE_KEY` for the correct project
6. QA with Sanny before going live

---

## Strategic Context (for AI reasoning)
CleaningExits is both a standalone marketplace and a proof-of-concept for the vertical rollup strategy. The playbook: identify a fragmented vertical, build a comprehensive data layer, dominate through superior data and direct relationships. Each new vertical (vending, pest, plumbing, HVAC, landscaping) follows the same template. Prioritize anything that makes buyer-seller matching faster and more trustworthy. The lead capture gate and LQS display are the two most important trust/conversion levers — protect them.
