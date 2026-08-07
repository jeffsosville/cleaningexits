// pages/resources/index.tsx
import Head from 'next/head';
import Link from 'next/link';
import Header from '../../components/Header';
import Footer from '../../components/Footer';

type Resource = {
  title: string;
  description: string;
  href: string;
  tag: string;
  readTime?: string;
  // ready: false renders as "Coming soon" and is not clickable.
  // PLACEHOLDER CONTENT — swap copy + href, then flip ready to true.
  ready: boolean;
};

type Section = {
  heading: string;
  blurb: string;
  items: Resource[];
};

const featured: Resource = {
  title: 'This Week\u2019s Deal: Why the Utah Janitorial Company is Hot',
  description:
    'Deep-dive on a $2.5M revenue cleaning business with $600K in cash flow. Valuation, financing structure, the risks nobody flags, and what we\u2019d pay.',
  href: '/resources/utah-janitorial-deal',
  tag: 'Deal Breakdown',
  readTime: '12 min read',
  ready: true,
};

const sections: Section[] = [
  {
    heading: 'Guides',
    blurb: 'The long-form stuff. Start here if you\u2019re early.',
    items: [
      {
        title: 'Cleaning Business Valuation Guide',
        description:
          'How commercial cleaning businesses actually get valued — SDE vs. EBITDA, where the multiples land, and what moves them.',
        href: '/cleaning-business-valuation-guide',
        tag: 'Valuation',
        readTime: '15 min read',
        ready: true,
      },
      {
        title: 'The Definitive Guide to Prepping Your Business for Sale',
        description:
          'Twelve months of prep compressed into one document: cleaning up books, de-risking customer concentration, and timing the listing.',
        href: '/selling-your-cleaning-business',
        tag: 'Sellers',
        readTime: '20 min read',
        ready: true,
      },
      {
        title: 'Commercial Cleaning Industry Overview',
        description:
          'Market size, fragmentation, consolidation pressure, and where the acquisition activity is concentrated.',
        href: '/commercial-cleaning-industry-overview',
        tag: 'Market',
        readTime: '10 min read',
        ready: true,
      },
      {
        title: 'The First-Time Buyer\u2019s Field Guide',
        description:
          'What to look at in the first 48 hours after an NDA, and the five things that should make you walk immediately.',
        href: '#',
        tag: 'Buyers',
        readTime: '14 min read',
        ready: false,
      },
      {
        title: 'SBA 7(a) Financing for Cleaning Acquisitions',
        description:
          'Down payment expectations, seller note structures, personal guarantees, and how long the process really takes.',
        href: '#',
        tag: 'Financing',
        readTime: '18 min read',
        ready: false,
      },
    ],
  },
  {
    heading: 'Tools & Templates',
    blurb: 'Things you can download and actually use on a deal.',
    items: [
      {
        title: 'SDE Add-Back Worksheet',
        description:
          'A spreadsheet for normalizing owner comp, personal vehicles, and one-time expenses without overstating your own earnings.',
        href: '#',
        tag: 'Spreadsheet',
        ready: false,
      },
      {
        title: 'Customer Concentration Calculator',
        description:
          'Enter your top ten accounts and get the concentration risk profile a buyer will build anyway.',
        href: '#',
        tag: 'Calculator',
        ready: false,
      },
      {
        title: 'Buyer Diligence Checklist',
        description:
          'Eighty-one line items across financials, contracts, employees, equipment, and insurance. Print it.',
        href: '#',
        tag: 'Checklist',
        ready: false,
      },
      {
        title: 'LOI Template for Small Acquisitions',
        description:
          'A plain-English letter of intent with the exclusivity, diligence window, and escrow terms filled in as defaults.',
        href: '#',
        tag: 'Template',
        ready: false,
      },
      {
        title: 'Route Density & Margin Model',
        description:
          'Model gross margin by drive time and square footage per contract. Useful for janitorial roll-ups.',
        href: '#',
        tag: 'Spreadsheet',
        ready: false,
      },
      {
        title: 'Employee Transition Letter Pack',
        description:
          'Three drafts for announcing a sale to staff — day of close, week after, and the one for your key supervisor.',
        href: '#',
        tag: 'Template',
        ready: false,
      },
    ],
  },
  {
    heading: 'Data & Research',
    blurb: 'What we see in the listing data that nobody publishes.',
    items: [
      {
        title: '30-Day BizBuySell Listing Audit',
        description:
          'We tracked every cleaning listing for a month and documented the stale listings, duplicate posts, and phantom inventory.',
        href: '/audit',
        tag: 'Live Data',
        ready: true,
      },
      {
        title: 'Why CleaningExits Exists',
        description:
          'The data quality argument, with screenshots. This is the short version of everything we believe.',
        href: '/why',
        tag: 'Position',
        ready: true,
      },
      {
        title: 'Quarterly Cleaning Multiples Report',
        description:
          'Median asking multiple by revenue band, updated every quarter from live listing data. No survey, no self-reporting.',
        href: '#',
        tag: 'Report',
        ready: false,
      },
      {
        title: 'Days on Market by State',
        description:
          'How long cleaning businesses actually sit, broken out by geography and price band.',
        href: '#',
        tag: 'Report',
        ready: false,
      },
      {
        title: 'The Relist Index',
        description:
          'Businesses that came back to market after a failed deal, and what that pattern tells you about pricing.',
        href: '#',
        tag: 'Report',
        ready: false,
      },
    ],
  },
];

function ResourceCard({ item }: { item: Resource }) {
  const inner = (
    <>
      <div className="flex items-center gap-3 mb-3">
        <span className="inline-block px-3 py-1 bg-emerald-100 text-emerald-800 text-xs font-semibold rounded-full">
          {item.tag}
        </span>
        {!item.ready && (
          <span className="inline-block px-3 py-1 bg-gray-100 text-gray-500 text-xs font-semibold rounded-full">
            Coming soon
          </span>
        )}
      </div>
      <h3
        className={`text-lg font-semibold mb-2 ${
          item.ready ? 'text-gray-900' : 'text-gray-500'
        }`}
      >
        {item.title}
      </h3>
      <p className="text-sm text-gray-600 mb-3">{item.description}</p>
      {item.readTime && (
        <p className="text-xs text-gray-400">{item.readTime}</p>
      )}
    </>
  );

  if (!item.ready) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6 opacity-70">
        {inner}
      </div>
    );
  }

  return (
    <Link
      href={item.href}
      className="block bg-white rounded-xl border border-gray-200 p-6 hover:border-emerald-500 hover:shadow-sm transition"
    >
      {inner}
    </Link>
  );
}

export default function Resources() {
  return (
    <>
      <Head>
        <title>Resources | Cleaning Exits</title>
        <meta
          name="description"
          content="Guides, templates, calculators, and original listing data for buying and selling commercial cleaning businesses."
        />
      </Head>

      <Header />

      <main className="mx-auto max-w-6xl px-4 py-12">
        <div className="max-w-3xl mb-12">
          <h1 className="text-4xl font-bold mb-4">Resources</h1>
          <p className="text-lg text-gray-700">
            Everything we know about buying and selling cleaning businesses, written
            down. Guides, working spreadsheets, and original research from our own
            listing data — not recycled blog filler.
          </p>
        </div>

        {/* Featured */}
        <Link
          href={featured.href}
          className="block bg-white rounded-xl border-2 border-emerald-500 p-8 mb-14 hover:shadow-md transition"
        >
          <div className="flex items-center gap-3 mb-4">
            <span className="inline-block px-3 py-1 bg-emerald-600 text-white text-xs font-semibold rounded-full">
              Featured
            </span>
            <span className="inline-block px-3 py-1 bg-emerald-100 text-emerald-800 text-xs font-semibold rounded-full">
              {featured.tag}
            </span>
          </div>
          <h2 className="text-2xl md:text-3xl font-bold mb-3">{featured.title}</h2>
          <p className="text-gray-700 mb-4">{featured.description}</p>
          <span className="text-emerald-600 font-semibold">
            Read the breakdown &rarr;
          </span>
        </Link>

        {sections.map((section) => (
          <section key={section.heading} className="mb-14">
            <h2 className="text-2xl font-bold mb-1">{section.heading}</h2>
            <p className="text-gray-600 mb-6">{section.blurb}</p>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {section.items.map((item) => (
                <ResourceCard key={item.title} item={item} />
              ))}
            </div>
          </section>
        ))}

        <div className="bg-gray-50 border border-gray-200 rounded-xl p-8 text-center">
          <h2 className="text-2xl font-bold mb-3">
            Get the Top 10 every Monday
          </h2>
          <p className="text-gray-700 mb-6 max-w-xl mx-auto">
            The ten best cleaning businesses on the market this week, with our notes
            on why they made the list. Free, and you can leave whenever.
          </p>
          <Link
            href="/subscribe"
            className="inline-block px-6 py-3 bg-emerald-600 text-white font-semibold rounded-lg hover:bg-emerald-700 transition"
          >
            Subscribe
          </Link>
        </div>
      </main>

      <Footer />
    </>
  );
}
