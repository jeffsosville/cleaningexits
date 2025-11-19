// pages/selling-cleaning-business-guide.tsx
import Head from "next/head";
import Link from "next/link";
import Header from '../components/Header';
import Footer from '../components/Footer';

export default function SellingGuide() {
  return (
    <>
      <Head>
        <title>The Definitive Guide to Prepping Your Cleaning Business for Sale | CleaningExits</title>
        <meta name="description" content="Maximize your cleaning business value with expert preparation strategies. Complete guide covering financials, operations, due diligence, and valuation." />
      </Head>

      <Header />

      <main className="mx-auto max-w-4xl px-4 py-8">
        {/* Hero Header */}
        <header className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4">
            The Definitive Guide to Prepping Your Cleaning Business for Sale
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Maximize your business value and attract serious buyers with proven strategies from industry experts
          </p>
        </header>

        {/* Introduction */}
        <div className="bg-white rounded-2xl border border-gray-200 p-8 mb-8">
          <p className="text-lg text-gray-700 mb-4">
            Selling your cleaning business represents the culmination of years of hard work, early mornings, and building something valuable from the ground up. Whether you're ready to retire, pursue new opportunities, or simply cash out on your investment, proper preparation can mean the difference between a mediocre sale and achieving maximum value for your life's work.
          </p>
          
          <p className="text-lg text-gray-700">
            This comprehensive guide walks you through every critical step of preparing your cleaning business for sale, from financial documentation to operational systems, helping you position your business as an attractive, turnkey operation that commands top dollar.
          </p>
        </div>

        {/* Section: Why Preparation Matters */}
        <section className="bg-white rounded-2xl border border-gray-200 p-8 mb-8">
          <h2 className="text-3xl font-bold mb-6 pb-4 border-b-2 border-emerald-600">
            Why Preparation Matters: The Value Gap
          </h2>
          
          <p className="text-gray-700 mb-6">
            The difference between a well-prepared cleaning business and one thrown on the market can be staggering. Industry data shows that properly prepared businesses sell for 30-50% more than comparable businesses with poor documentation and systems.
          </p>
          
          <div className="bg-amber-50 border-l-4 border-amber-400 p-5 rounded-r my-6">
            <p className="text-gray-700">
              <span className="font-bold text-amber-900">Real Example:</span> Two similar residential cleaning businesses, each doing $500K in annual revenue. Business A had clean books, documented processes, and organized client contracts—it sold for 3.2x SDE ($320K profit = $1.024M sale price). Business B had messy financials and verbal agreements with clients—it sold for 1.8x SDE ($300K profit = $540K sale price). That's a <span className="font-semibold">$484,000 difference</span> based purely on preparation.
            </p>
          </div>
          
          <p className="text-gray-700">
            Buyers aren't just purchasing your revenue stream; they're buying peace of mind, reduced risk, and a clear path to success. Your preparation directly addresses their fears and justifies a premium price.
          </p>
        </section>

        {/* Section: Timeline */}
        <section className="bg-white rounded-2xl border border-gray-200 p-8 mb-8">
          <h2 className="text-3xl font-bold mb-6 pb-4 border-b-2 border-emerald-600">
            Timeline: When to Start Preparing
          </h2>
          
          <p className="text-gray-700 mb-6">
            The ideal preparation timeline is 12-24 months before you plan to list your business for sale. This gives you time to address weaknesses, establish consistent performance records, and make improvements that increase value without appearing rushed.
          </p>
          
          <div className="bg-blue-50 border-l-4 border-blue-500 p-6 rounded-r my-6">
            <h3 className="font-bold text-lg text-gray-900 mb-3">12-24 Months Before Sale:</h3>
            <ul className="space-y-2 text-gray-700">
              <li className="flex items-start gap-2">
                <span className="text-emerald-600 font-bold mt-1">•</span>
                <span>Begin documenting all processes and procedures</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-600 font-bold mt-1">•</span>
                <span>Clean up financial records and implement proper accounting systems</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-600 font-bold mt-1">•</span>
                <span>Reduce owner dependence by training management team</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-600 font-bold mt-1">•</span>
                <span>Formalize client contracts and service agreements</span>
              </li>
            </ul>
          </div>
          
          <div className="bg-blue-50 border-l-4 border-blue-500 p-6 rounded-r my-6">
            <h3 className="font-bold text-lg text-gray-900 mb-3">6-12 Months Before Sale:</h3>
            <ul className="space-y-2 text-gray-700">
              <li className="flex items-start gap-2">
                <span className="text-emerald-600 font-bold mt-1">•</span>
                <span>Focus on improving profitability metrics</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-600 font-bold mt-1">•</span>
                <span>Eliminate unnecessary expenses and optimize operations</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-600 font-bold mt-1">•</span>
                <span>Strengthen key client relationships and secure renewals</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-600 font-bold mt-1">•</span>
                <span>Address any legal or compliance issues</span>
              </li>
            </ul>
          </div>
          
          <div className="bg-blue-50 border-l-4 border-blue-500 p-6 rounded-r my-6">
            <h3 className="font-bold text-lg text-gray-900 mb-3">3-6 Months Before Sale:</h3>
            <ul className="space-y-2 text-gray-700">
              <li className="flex items-start gap-2">
                <span className="text-emerald-600 font-bold mt-1">•</span>
                <span>Prepare comprehensive documentation package</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-600 font-bold mt-1">•</span>
                <span>Get business professionally valued</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-600 font-bold mt-1">•</span>
                <span>Consult with business broker or M&A advisor</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-600 font-bold mt-1">•</span>
                <span>Begin organizing data room for due diligence</span>
              </li>
            </ul>
          </div>
          
          <p className="text-gray-700">
            Even if you're planning to sell sooner, don't be discouraged. Many improvements can be made in just 3-6 months, and some preparation is always better than none.
          </p>
        </section>

        {/* Section: Financial Documentation */}
        <section className="bg-white rounded-2xl border border-gray-200 p-8 mb-8">
          <h2 className="text-3xl font-bold mb-6 pb-4 border-b-2 border-emerald-600">
            Financial Documentation: The Foundation of Value
          </h2>
          
          <p className="text-gray-700 mb-6">
            Clean, accurate financial records are the cornerstone of any successful business sale. Buyers will scrutinize every number, and inconsistencies or gaps in documentation can torpedo deals or drastically reduce your valuation.
          </p>
          
          <h3 className="text-xl font-bold text-gray-900 mb-4 mt-8">Essential Financial Documents</h3>
          <ol className="space-y-3 text-gray-700 list-decimal list-inside">
            <li><span className="font-semibold">Three Years of Tax Returns:</span> Complete business and personal returns (if operating as sole proprietor or pass-through entity)</li>
            <li><span className="font-semibold">Profit & Loss Statements:</span> Monthly P&Ls for the past 3 years, showing clear revenue and expense categorization</li>
            <li><span className="font-semibold">Balance Sheets:</span> Current and historical balance sheets showing assets, liabilities, and equity</li>
            <li><span className="font-semibold">Cash Flow Statements:</span> Detailed cash flow analysis showing actual money in and out of the business</li>
            <li><span className="font-semibold">Accounts Receivable Aging Report:</span> Current AR showing payment patterns and potential collection issues</li>
            <li><span className="font-semibold">Accounts Payable Summary:</span> Outstanding obligations and payment terms with suppliers</li>
          </ol>
          
          <h3 className="text-xl font-bold text-gray-900 mb-4 mt-8">Cleaning Up Your Books</h3>
          <p className="text-gray-700 mb-4">
            Many cleaning business owners operate with commingled personal and business expenses, cash transactions, or informal bookkeeping. Address these issues:
          </p>
          
          <ul className="space-y-3 text-gray-700 mb-6">
            <li className="flex items-start gap-2">
              <span className="text-emerald-600 font-bold mt-1">•</span>
              <div><span className="font-semibold">Separate Personal Expenses:</span> Remove any personal expenses from business accounts. If you've been running personal expenses through the business, create a clear "owner's compensation" line item and addback schedule for buyers to understand true profitability.</div>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-emerald-600 font-bold mt-1">•</span>
              <div><span className="font-semibold">Categorize Properly:</span> Ensure all income and expenses are properly categorized. Vague categories like "miscellaneous" raise red flags.</div>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-emerald-600 font-bold mt-1">•</span>
              <div><span className="font-semibold">Document Cash Transactions:</span> If you've been accepting cash payments, implement proper documentation systems moving forward. For historical cash revenue, be prepared to substantiate with deposit records.</div>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-emerald-600 font-bold mt-1">•</span>
              <div><span className="font-semibold">Reconcile Bank Statements:</span> Every month should be reconciled, showing the connection between your books and actual bank activity.</div>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-emerald-600 font-bold mt-1">•</span>
              <div><span className="font-semibold">Hire a Professional:</span> Consider having a CPA review or restate your financials. Professional statements carry more weight with buyers and lenders.</div>
            </li>
          </ul>
          
          <div className="bg-amber-50 border-l-4 border-amber-400 p-5 rounded-r my-6">
            <p className="text-gray-700">
              <span className="font-bold text-amber-900">Pro Tip:</span> Create a "Quality of Earnings" document that explains any anomalies or one-time events in your financials. This proactive transparency builds trust and speeds up due diligence.
            </p>
          </div>
          
          <h3 className="text-xl font-bold text-gray-900 mb-4 mt-8">Understanding SDE vs. EBITDA</h3>
          <p className="text-gray-700 mb-4">
            Most cleaning businesses are valued on Seller's Discretionary Earnings (SDE), not EBITDA. Understanding this distinction is crucial:
          </p>
          
          <p className="text-gray-700 mb-4">
            <span className="font-semibold">SDE includes:</span> Net profit + owner's salary + owner's benefits + interest + taxes + depreciation + amortization + one-time expenses + personal expenses run through business
          </p>
          
          <p className="text-gray-700">
            Prepare a clear SDE calculation with documentation for every addback. Buyers will challenge unsupported addbacks, but legitimate ones significantly increase your valuation.
          </p>
        </section>

        {/* Section: Client Documentation */}
        <section className="bg-white rounded-2xl border border-gray-200 p-8 mb-8">
          <h2 className="text-3xl font-bold mb-6 pb-4 border-b-2 border-emerald-600">
            Client Documentation: Proving Recurring Revenue
          </h2>
          
          <p className="text-gray-700 mb-6">
            Your client base is your most valuable asset. Buyers need confidence that revenue will continue post-sale, which requires thorough client documentation.
          </p>
          
          <h3 className="text-xl font-bold text-gray-900 mb-4">Client Contracts and Agreements</h3>
          <ul className="space-y-3 text-gray-700 mb-6">
            <li className="flex items-start gap-2">
              <span className="text-emerald-600 font-bold mt-1">•</span>
              <div><span className="font-semibold">Written Agreements:</span> Every client should have a written service agreement or contract. If you've been operating on handshake deals, begin transitioning clients to formal agreements immediately.</div>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-emerald-600 font-bold mt-1">•</span>
              <div><span className="font-semibold">Auto-Renewal Clauses:</span> Contracts with automatic renewal provisions are significantly more valuable than month-to-month arrangements.</div>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-emerald-600 font-bold mt-1">•</span>
              <div><span className="font-semibold">Clear Terms:</span> Contracts should specify services, frequency, pricing, payment terms, and termination clauses.</div>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-emerald-600 font-bold mt-1">•</span>
              <div><span className="font-semibold">Transferability:</span> Ensure contracts don't have personal service clauses that would terminate upon sale of the business.</div>
            </li>
          </ul>
          
          <h3 className="text-xl font-bold text-gray-900 mb-4">Client Roster and Revenue Analysis</h3>
          <p className="text-gray-700 mb-4">Create a comprehensive spreadsheet detailing:</p>
          <ul className="space-y-2 text-gray-700 mb-6">
            <li className="flex items-start gap-2">
              <span className="text-emerald-600 font-bold mt-1">•</span>
              <span>Client name and location</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-emerald-600 font-bold mt-1">•</span>
              <span>Services provided (residential, commercial, specialty)</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-emerald-600 font-bold mt-1">•</span>
              <span>Frequency of service (weekly, bi-weekly, monthly)</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-emerald-600 font-bold mt-1">•</span>
              <span>Monthly/annual revenue per client</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-emerald-600 font-bold mt-1">•</span>
              <span>Length of relationship</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-emerald-600 font-bold mt-1">•</span>
              <span>Contract status and expiration dates</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-emerald-600 font-bold mt-1">•</span>
              <span>Payment history (current, 30-day, etc.)</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-emerald-600 font-bold mt-1">•</span>
              <span>Profit margin by client (if available)</span>
            </li>
          </ul>
          
          <div className="bg-emerald-50 border-l-4 border-emerald-500 p-5 rounded-r my-6">
            <p className="text-gray-700">
              <span className="font-bold text-emerald-900">Client Concentration Risk:</span> If any single client represents more than 20% of revenue, this is a concentration risk that will affect valuation. Work to diversify your client base or be prepared for potential valuation reduction.
            </p>
          </div>
          
          <h3 className="text-xl font-bold text-gray-900 mb-4">Retention Metrics</h3>
          <p className="text-gray-700 mb-4">
            Calculate and document your client retention rates. Strong retention (85%+ annually) demonstrates business stability and commands premium valuations. Track:
          </p>
          <ul className="space-y-2 text-gray-700">
            <li className="flex items-start gap-2">
              <span className="text-emerald-600 font-bold mt-1">•</span>
              <span>Annual retention rate by client count</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-emerald-600 font-bold mt-1">•</span>
              <span>Revenue retention rate (accounting for upsells/downsells)</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-emerald-600 font-bold mt-1">•</span>
              <span>Average client lifespan</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-emerald-600 font-bold mt-1">•</span>
              <span>Churn rate and primary reasons for cancellations</span>
            </li>
          </ul>
        </section>

        {/* Section: Operations Documentation */}
        <section className="bg-white rounded-2xl border border-gray-200 p-8 mb-8">
          <h2 className="text-3xl font-bold mb-6 pb-4 border-b-2 border-emerald-600">
            Operations Documentation: Creating the Playbook
          </h2>
          
          <p className="text-gray-700 mb-6">
            Buyers want a business they can run without you. Comprehensive operations documentation proves the business can operate independently and reduces perceived risk.
          </p>
          
          <h3 className="text-xl font-bold text-gray-900 mb-4">Standard Operating Procedures (SOPs)</h3>
          <p className="text-gray-700 mb-4">Document every repeatable process in your business:</p>
          
          <ul className="space-y-3 text-gray-700 mb-6">
            <li className="flex items-start gap-2">
              <span className="text-emerald-600 font-bold mt-1">•</span>
              <div><span className="font-semibold">Client Onboarding:</span> Step-by-step process from initial inquiry to first service</div>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-emerald-600 font-bold mt-1">•</span>
              <div><span className="font-semibold">Service Delivery:</span> Checklists and procedures for each service type (residential deep clean, office cleaning, specialty services)</div>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-emerald-600 font-bold mt-1">•</span>
              <div><span className="font-semibold">Quality Control:</span> Inspection procedures, quality standards, and follow-up protocols</div>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-emerald-600 font-bold mt-1">•</span>
              <div><span className="font-semibold">Scheduling and Dispatch:</span> How work is assigned, scheduled, and communicated to teams</div>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-emerald-600 font-bold mt-1">•</span>
              <div><span className="font-semibold">Supply Ordering:</span> Inventory management, preferred vendors, reorder points</div>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-emerald-600 font-bold mt-1">•</span>
              <div><span className="font-semibold">Invoicing and Collections:</span> Billing procedures, payment processing, collections process</div>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-emerald-600 font-bold mt-1">•</span>
              <div><span className="font-semibold">Employee Management:</span> Hiring, training, scheduling, performance reviews, termination</div>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-emerald-600 font-bold mt-1">•</span>
              <div><span className="font-semibold">Customer Service:</span> How complaints are handled, response protocols, escalation procedures</div>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-emerald-600 font-bold mt-1">•</span>
              <div><span className="font-semibold">Marketing and Lead Generation:</span> Lead sources, conversion processes, marketing calendar</div>
            </li>
          </ul>
          
          <div className="bg-amber-50 border-l-4 border-amber-400 p-5 rounded-r my-6">
            <p className="text-gray-700">
              <span className="font-bold text-amber-900">Format Tip:</span> Create SOPs as simple Word documents or better yet, use a system like Trainual or Process Street. Video tutorials of key processes are even more valuable.
            </p>
          </div>
          
          <h3 className="text-xl font-bold text-gray-900 mb-4 mt-8">Technology and Systems</h3>
          <p className="text-gray-700 mb-4">Document all technology platforms and how they're used:</p>
          <ul className="space-y-2 text-gray-700 mb-6">
            <li className="flex items-start gap-2">
              <span className="text-emerald-600 font-bold mt-1">•</span>
              <span>Scheduling/routing software (Jobber, Housecall Pro, ServiceTitan)</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-emerald-600 font-bold mt-1">•</span>
              <span>Accounting software (QuickBooks, Xero)</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-emerald-600 font-bold mt-1">•</span>
              <span>CRM or client management system</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-emerald-600 font-bold mt-1">•</span>
              <span>Payroll platform</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-emerald-600 font-bold mt-1">•</span>
              <span>Communication tools (email, text, Slack)</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-emerald-600 font-bold mt-1">•</span>
              <span>Website and booking system</span>
            </li>
          </ul>
          
          <p className="text-gray-700">
            Ensure all accounts are under business email addresses (not personal) and document login credentials in a secure password manager for transition.
          </p>
        </section>

        {/* Section: Reducing Owner Dependence */}
        <section className="bg-white rounded-2xl border border-gray-200 p-8 mb-8">
          <h2 className="text-3xl font-bold mb-6 pb-4 border-b-2 border-emerald-600">
            Reducing Owner Dependence
          </h2>
          
          <p className="text-gray-700 mb-6">
            The biggest obstacle to a successful cleaning business sale is excessive owner involvement. Buyers want a business, not a job that requires them to be on-site daily.
          </p>
          
          <h3 className="text-xl font-bold text-gray-900 mb-4">Signs of Excessive Owner Dependence</h3>
          <ul className="space-y-2 text-gray-700 mb-6">
            <li className="flex items-start gap-2">
              <span className="text-red-500 font-bold mt-1">✗</span>
              <span>Owner performs regular cleaning jobs</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-red-500 font-bold mt-1">✗</span>
              <span>Owner is the primary client contact</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-red-500 font-bold mt-1">✗</span>
              <span>Owner handles all sales and marketing</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-red-500 font-bold mt-1">✗</span>
              <span>Owner manages all scheduling and dispatch</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-red-500 font-bold mt-1">✗</span>
              <span>Key vendor or client relationships exist only with owner</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-red-500 font-bold mt-1">✗</span>
              <span>Owner is required for daily operational decisions</span>
            </li>
          </ul>
          
          <h3 className="text-xl font-bold text-gray-900 mb-4">Building a Management Team</h3>
          <p className="text-gray-700 mb-4">Even small cleaning businesses should have basic management structure:</p>
          
          <ul className="space-y-3 text-gray-700 mb-6">
            <li className="flex items-start gap-2">
              <span className="text-emerald-600 font-bold mt-1">•</span>
              <div><span className="font-semibold">Operations Manager:</span> Oversees day-to-day cleaning operations, scheduling, quality control</div>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-emerald-600 font-bold mt-1">•</span>
              <div><span className="font-semibold">Office Manager/Administrator:</span> Handles invoicing, client communications, basic HR</div>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-emerald-600 font-bold mt-1">•</span>
              <div><span className="font-semibold">Team Leads:</span> Senior cleaners who can manage crews and train new employees</div>
            </li>
          </ul>
          
          <p className="text-gray-700 mb-6">
            Document each role's responsibilities and demonstrate they've been operating independently for at least 6 months before sale. Include organizational chart showing reporting structure.
          </p>
          
          <div className="bg-emerald-50 border-l-4 border-emerald-500 p-5 rounded-r my-6">
            <p className="text-gray-700">
              <span className="font-bold text-emerald-900">Best Case Scenario:</span> Ideally, you've been "semi-absentee" for 6-12 months before sale, working only 10-15 hours per week on strategic activities. This dramatically increases buyer pool and valuation.
            </p>
          </div>
        </section>

        {/* Section: Due Diligence Preparation */}
        <section className="bg-white rounded-2xl border border-gray-200 p-8 mb-8">
          <h2 className="text-3xl font-bold mb-6 pb-4 border-b-2 border-emerald-600">
            Due Diligence Preparation
          </h2>
          
          <p className="text-gray-700 mb-6">
            Once you have a buyer, they'll conduct extensive due diligence. Being prepared accelerates the process and maintains deal momentum.
          </p>
          
          <h3 className="text-xl font-bold text-gray-900 mb-4">Creating Your Data Room</h3>
          <p className="text-gray-700 mb-6">
            Organize all documentation in a secure digital data room (Dropbox, Google Drive, or specialized platforms like DealRoom):
          </p>
          
          <div className="bg-gray-50 rounded-lg p-6 mb-6">
            <h4 className="font-bold text-gray-900 mb-3">Financial Documents Folder</h4>
            <ul className="space-y-2 text-gray-700 text-sm">
              <li className="flex items-start gap-2">
                <span className="text-emerald-600 font-bold mt-0.5">✓</span>
                <span>3 years of tax returns</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-600 font-bold mt-0.5">✓</span>
                <span>3 years of P&L statements (monthly)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-600 font-bold mt-0.5">✓</span>
                <span>3 years of balance sheets</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-600 font-bold mt-0.5">✓</span>
                <span>Current year P&L (up to date)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-600 font-bold mt-0.5">✓</span>
                <span>Accounts receivable aging</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-600 font-bold mt-0.5">✓</span>
                <span>Accounts payable summary</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-600 font-bold mt-0.5">✓</span>
                <span>SDE calculation with addback schedule</span>
              </li>
            </ul>
          </div>
          
          <div className="bg-gray-50 rounded-lg p-6 mb-6">
            <h4 className="font-bold text-gray-900 mb-3">Client Documents Folder</h4>
            <ul className="space-y-2 text-gray-700 text-sm">
              <li className="flex items-start gap-2">
                <span className="text-emerald-600 font-bold mt-0.5">✓</span>
                <span>Client roster with revenue details</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-600 font-bold mt-0.5">✓</span>
                <span>Sample client contracts</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-600 font-bold mt-0.5">✓</span>
                <span>Client retention analysis</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-600 font-bold mt-0.5">✓</span>
                <span>Top 20 clients by revenue</span>
              </li>
            </ul>
          </div>
          
          <div className="bg-gray-50 rounded-lg p-6 mb-6">
            <h4 className="font-bold text-gray-900 mb-3">Operations Documents Folder</h4>
            <ul className="space-y-2 text-gray-700 text-sm">
              <li className="flex items-start gap-2">
                <span className="text-emerald-600 font-bold mt-0.5">✓</span>
                <span>Standard operating procedures</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-600 font-bold mt-0.5">✓</span>
                <span>Employee handbook</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-600 font-bold mt-0.5">✓</span>
                <span>Training materials</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-600 font-bold mt-0.5">✓</span>
                <span>Technology system documentation</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-600 font-bold mt-0.5">✓</span>
                <span>Vendor list and contracts</span>
              </li>
            </ul>
          </div>
          
          <div className="bg-gray-50 rounded-lg p-6 mb-6">
            <h4 className="font-bold text-gray-900 mb-3">Legal Documents Folder</h4>
            <ul className="space-y-2 text-gray-700 text-sm">
              <li className="flex items-start gap-2">
                <span className="text-emerald-600 font-bold mt-0.5">✓</span>
                <span>Articles of incorporation/organization</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-600 font-bold mt-0.5">✓</span>
                <span>Operating agreement or bylaws</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-600 font-bold mt-0.5">✓</span>
                <span>Business licenses</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-600 font-bold mt-0.5">✓</span>
                <span>Insurance certificates</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-600 font-bold mt-0.5">✓</span>
                <span>Leases (office, equipment, vehicles)</span>
              </li>
            </ul>
          </div>
        </section>

        {/* Section: Valuation */}
        <section className="bg-white rounded-2xl border border-gray-200 p-8 mb-8">
          <h2 className="text-3xl font-bold mb-6 pb-4 border-b-2 border-emerald-600">
            Getting a Professional Valuation
          </h2>
          
          <p className="text-gray-700 mb-6">
            Before listing your business, get a professional valuation from a qualified business appraiser or experienced broker specializing in cleaning businesses.
          </p>
          
          <h3 className="text-xl font-bold text-gray-900 mb-4">Why Professional Valuation Matters</h3>
          <ul className="space-y-2 text-gray-700 mb-6">
            <li className="flex items-start gap-2">
              <span className="text-emerald-600 font-bold mt-1">•</span>
              <span>Sets realistic price expectations</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-emerald-600 font-bold mt-1">•</span>
              <span>Identifies value drivers and gaps</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-emerald-600 font-bold mt-1">•</span>
              <span>Provides defensible number for negotiations</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-emerald-600 font-bold mt-1">•</span>
              <span>May be required for SBA loans (which finance 70%+ of cleaning business sales)</span>
            </li>
          </ul>
          
          <h3 className="text-xl font-bold text-gray-900 mb-4">Valuation Multiples for Cleaning Businesses</h3>
          <p className="text-gray-700 mb-4">
            Cleaning businesses typically sell for <span className="font-semibold">2.0x to 4.0x Seller's Discretionary Earnings (SDE)</span>, with the multiple depending on:
          </p>
          
          <ul className="space-y-3 text-gray-700">
            <li className="flex items-start gap-2">
              <span className="text-emerald-600 font-bold mt-1">•</span>
              <div><span className="font-semibold">Size:</span> Larger businesses (&gt;$1M revenue) command higher multiples</div>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-emerald-600 font-bold mt-1">•</span>
              <div><span className="font-semibold">Contract Type:</span> Commercial contracts typically valued higher than residential</div>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-emerald-600 font-bold mt-1">•</span>
              <div><span className="font-semibold">Contract Length:</span> Long-term contracts with auto-renewal worth premium</div>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-emerald-600 font-bold mt-1">•</span>
              <div><span className="font-semibold">Recurring Revenue:</span> Higher percentage of recurring revenue increases multiple</div>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-emerald-600 font-bold mt-1">•</span>
              <div><span className="font-semibold">Owner Involvement:</span> Absentee or semi-absentee operations valued higher</div>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-emerald-600 font-bold mt-1">•</span>
              <div><span className="font-semibold">Systems and Documentation:</span> Turnkey operations command premium multiples</div>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-emerald-600 font-bold mt-1">•</span>
              <div><span className="font-semibold">Growth Trajectory:</span> Growing businesses worth more than flat or declining</div>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-emerald-600 font-bold mt-1">•</span>
              <div><span className="font-semibold">Client Concentration:</span> Diversified client base reduces risk, increases value</div>
            </li>
          </ul>
        </section>

        {/* Section: Common Mistakes */}
        <section className="bg-white rounded-2xl border border-gray-200 p-8 mb-8">
          <h2 className="text-3xl font-bold mb-6 pb-4 border-b-2 border-emerald-600">
            Common Mistakes to Avoid
          </h2>
          
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">1. Waiting Until You're Burned Out</h3>
              <p className="text-gray-700">Many owners decide to sell only after they're exhausted and the business has started declining. Sell while you're still engaged and the business is thriving.</p>
            </div>
            
            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">2. No Financial Cleanup</h3>
              <p className="text-gray-700">Commingled expenses, missing documentation, and inconsistent bookkeeping torpedo valuations. Start cleaning up your books 12-24 months before sale.</p>
            </div>
            
            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">3. Verbal Client Agreements</h3>
              <p className="text-gray-700">Handshake deals and verbal agreements dramatically reduce value. Get everything in writing well before listing the business.</p>
            </div>
            
            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">4. Everything Depends on the Owner</h3>
              <p className="text-gray-700">If the business can't run without you, you're severely limiting your buyer pool and value. Build systems and delegate.</p>
            </div>
            
            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">5. Neglecting Minor Legal Issues</h3>
              <p className="text-gray-700">Expired licenses, lapsed insurance, or missing employee documents seem small but can derail deals. Address all compliance issues upfront.</p>
            </div>
            
            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">6. Unrealistic Pricing</h3>
              <p className="text-gray-700">Overpricing based on emotion rather than market comparables means your business sits unsold while competitors get snapped up. Trust professional valuations.</p>
            </div>
            
            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">7. Poor Communication During Sale</h3>
              <p className="text-gray-700">Keeping the sale secret from key employees can backfire if they find out from buyers. Plan your communication strategy carefully.</p>
            </div>
            
            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">8. Not Using a Broker</h3>
              <p className="text-gray-700">While brokers charge 10-15% commission, they typically achieve 20-30% higher sale prices, handle complex negotiations, and ensure deals close. For most cleaning businesses, a qualified broker pays for themselves.</p>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-2xl p-8 md:p-12 text-white text-center mb-8">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Ready to Maximize Your Cleaning Business Value?
          </h2>
          <p className="text-lg md:text-xl mb-6 opacity-95">
            Whether you're planning to sell in 6 months or 2 years, the time to start preparing is now. Every month of preparation can translate to tens of thousands of dollars in additional value.
          </p>
          <p className="text-lg mb-8 opacity-95">
            List your cleaning business for free on CleaningExits.com and connect with qualified buyers actively looking for businesses like yours.
          </p>
          <Link
            href="/"
            className="inline-block bg-white text-emerald-600 font-bold px-8 py-4 rounded-lg hover:bg-gray-50 transition text-lg"
          >
            List Your Business Free →
          </Link>
        </section>

        {/* Final Thoughts */}
        <section className="bg-white rounded-2xl border border-gray-200 p-8 mb-8">
          <h2 className="text-3xl font-bold mb-6 pb-4 border-b-2 border-emerald-600">
            Final Thoughts
          </h2>
          
          <p className="text-gray-700 mb-4">
            Selling your cleaning business represents a significant life transition and financial event. The difference between a mediocre sale and achieving maximum value often comes down to preparation, documentation, and timing.
          </p>
          
          <p className="text-gray-700 mb-4">
            By following this guide and taking the time to properly prepare your business for sale, you're not just increasing your valuation—you're making your business more attractive to serious buyers, speeding up the sale process, and increasing the likelihood of a successful closing.
          </p>
          
          <p className="text-gray-700 mb-4">
            Remember, buyers are purchasing peace of mind and a clear path to continued success. Every hour you invest in preparation pays dividends in reduced buyer risk, stronger negotiations, and ultimately, more money in your pocket.
          </p>
          
          <p className="text-gray-700 font-semibold">
            Start today. Your future self will thank you.
          </p>
        </section>
      </main>

      <Footer />
    </>
  );
}
