// pages/why.tsx
import Head from 'next/head';
import Link from 'next/link';
import Image from 'next/image';
import Header from '../components/Header';
import Footer from '../components/Footer';

export default function Why() {
  return (
    <>
      <Head>
        <title>Why CleaningExits | The BizBuySell Problem</title>
        <meta name="description" content="We analyzed 1,000+ cleaning businesses on BizBuySell. Only 39% are legitimate. Here's the data that exposes a broken marketplace." />
      </Head>

      <Header />

      <main className="min-h-screen bg-white">
        {/* Hero Section */}
        <section className="py-20 px-4 bg-gradient-to-b from-gray-50 to-white">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
              Why CleaningExits Exists
            </h1>
            <p className="text-xl text-gray-700 leading-relaxed">
              We analyzed over 1,000 cleaning business listings on BizBuySell. In the past 30 days alone, 
              139 new listings appeared. Only 54 (39%) are legitimate. Here's the data that exposes a 
              fundamentally broken marketplace.
            </p>
          </div>
        </section>

        {/* Credibility Anchor */}
        <section className="py-8 px-4 bg-blue-50">
          <div className="max-w-4xl mx-auto">
            <div className="p-6 bg-white border-2 border-blue-400 rounded-lg">
              <p className="text-gray-800 text-lg">
                <strong>Who built this?</strong> We run ATM Brokerage — achieved 90% market share and facilitated 
                $75-100M in transactions over 10+ years by becoming the trusted specialist in a fragmented vertical. 
                We're applying the same playbook to cleaning businesses.
              </p>
            </div>
          </div>
        </section>

        {/* Main Content */}
        <section className="py-16 px-4 bg-white">
          <div className="max-w-4xl mx-auto">
            
            {/* The Data */}
            <div className="bg-white rounded-lg border-2 border-gray-200 p-8 mb-8">
              <div className="grid md:grid-cols-3 gap-8 text-center mb-8">
                <div>
                  <div className="text-5xl font-bold text-gray-900 mb-2">1,000+</div>
                  <div className="text-gray-600">Total Listings Analyzed</div>
                </div>
                <div>
                  <div className="text-5xl font-bold text-blue-600 mb-2">139</div>
                  <div className="text-gray-600">New in Past 30 Days</div>
                </div>
                <div>
                  <div className="text-5xl font-bold text-red-600 mb-2">39%</div>
                  <div className="text-gray-600">Are Verifiably Real</div>
                </div>
              </div>
              
              <div className="border-t pt-6">
                <p className="text-gray-700 text-lg leading-relaxed">
                  We've analyzed over 1,000 cleaning business listings on BizBuySell over time. In the past 
                  30 days alone, 139 new commercial and residential cleaning listings appeared. We verified 
                  broker accounts against our database of 2,500 business brokers, analyzed financials, and 
                  checked multiples. The result? Only 54 of the recent 139 listings (39%) are legitimate 
                  businesses with real brokers and verifiable financials. 56 (40%) are confirmed junk—impossible 
                  multiples, franchise spam, and listings with no financial data. The remaining 29 need manual review.
                </p>
              </div>
            </div>

            <div className="prose prose-lg max-w-none text-gray-700 bg-white rounded-lg p-8 mb-12">
              <p>
                <strong>What we found in the past 30 days:</strong>
              </p>
              <ul className="space-y-2">
                <li><strong>40 listings with impossible multiples</strong> (below 1.5x) — Including 20 from VERIFIED brokers</li>
                <li><strong>42 listings with no financial data</strong> to evaluate the business</li>
                <li><strong>9 fake "aircraft cleaning" account farms</strong> posting identical listings across different cities</li>
                <li><strong>27 dry cleaning businesses</strong> incorrectly categorized as commercial cleaning</li>
              </ul>
              
              <p className="mt-6">
                <strong>What we excluded from our analysis:</strong> We focus on commercial and residential 
                cleaning businesses. We excluded dry cleaning (different industry entirely), aircraft/aviation 
                "cleaning" (confirmed scam category), and franchise recruitment ads.
              </p>
              
              <p className="mt-6 bg-blue-50 border-l-4 border-blue-600 p-4 rounded">
                <strong>The pattern holds across time:</strong> Whether we analyze the past 30 days or the 
                past year, roughly 60% of BizBuySell's cleaning listings have serious red flags or can't be 
                verified. The marketplace isn't getting better—it's consistently broken.
              </p>
            </div>

            {/* Examples Section */}
            <section className="mb-16">
              <h2 className="text-3xl font-bold text-gray-900 mb-6">Here's What "Junk" Looks Like</h2>
              
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
                <p className="text-lg text-gray-700 mb-4">
                  These are REAL listings from BizBuySell's cleaning section. Both have mathematically 
                  impossible financials. The worst part? 20 of them are from VERIFIED brokers.
                </p>
              </div>

              {/* Junk Listing 1 */}
              <div className="bg-yellow-50 border-2 border-yellow-400 rounded-lg p-6 mb-6">
                <div className="mb-4">
                  <Image 
                    src="/images/bizbuysell-junk-1.png" 
                    alt="BizBuySell listing showing impossible 0.82x multiple"
                    width={400}
                    height={267}
                    className="w-full max-w-md mx-auto rounded border border-gray-300"
                  />
                </div>
                
                <div className="bg-white rounded p-4">
                  <p className="text-sm text-gray-600 mb-2"><strong>Why this is a red flag:</strong></p>
                  <p className="text-gray-700 mb-3">
                    <strong>$409,900 asking price ÷ $502,135 cashflow = 0.82x multiple</strong>
                  </p>
                  <p className="text-gray-700">
                    This listing claims the business generates $502K in annual cashflow but is only 
                    asking $410K. That means you'd get your money back in less than 10 months and 
                    the seller would be LOSING money on the deal. This is mathematically impossible 
                    for a legitimate business sale.
                  </p>
                </div>
              </div>

              {/* Junk Listing 2 */}
              <div className="bg-yellow-50 border-2 border-yellow-400 rounded-lg p-6 mb-8">
                <div className="mb-4">
                  <Image 
                    src="/images/bizbuysell-junk-2.png" 
                    alt="BizBuySell listing showing impossible 1.07x multiple"
                    width={400}
                    height={267}
                    className="w-full max-w-md mx-auto rounded border border-gray-300"
                  />
                </div>
                
                <div className="bg-white rounded p-4">
                  <p className="text-sm text-gray-600 mb-2"><strong>Another example:</strong></p>
                  <p className="text-gray-700 mb-3">
                    <strong>$375,000 asking price ÷ $350,268 cashflow = 1.07x multiple</strong>
                  </p>
                  <p className="text-gray-700">
                    You'd get your entire investment back in 13 months. If this business actually 
                    generated $350K in annual cash flow, why would anyone sell it for $375K? 
                    Real commercial cleaning businesses sell for 2.5x-4x multiples, not 1.07x.
                  </p>
                  <p className="text-gray-700 mt-3">
                    <strong>The pattern:</strong> Both listings have "No photo available," generic 
                    descriptions, and multiples under 1.5x. These aren't real businesses being sold—they're 
                    lead generation traps or franchise funnels.
                  </p>
                </div>
              </div>

              <p className="text-gray-700 italic">
                These listings stayed active for months. BizBuySell never removed them.
              </p>
            </section>

            {/* The Real Problem */}
            <section className="mb-16">
              <h2 className="text-3xl font-bold text-gray-900 mb-6">The Real Problem: The Numbers Don't Work</h2>
              
              <div className="bg-red-50 border-2 border-red-400 rounded-lg p-8 mb-8">
                <p className="text-gray-700 text-lg mb-6 leading-relaxed">
                  The junk listings aren't just low-quality or poorly written. They have mathematically impossible financials:
                </p>
                
                <div className="bg-white rounded-lg p-6 mb-6">
                  <p className="text-2xl font-bold text-red-600 mb-4">
                    40 listings have multiples below 1.5x
                  </p>
                  <p className="text-gray-700 text-lg">
                    This means you'd supposedly get your entire investment back in under 18 months. That's not how 
                    legitimate service businesses are priced. Real commercial cleaning companies trade at 2.5x-4x 
                    multiples because that reflects the actual risk, effort, and time required to operate them.
                  </p>
                </div>

                <p className="text-gray-700 text-lg mb-4">
                  <strong>Examples of impossible deals:</strong>
                </p>
                <ul className="text-gray-700 space-y-2 mb-6">
                  <li>• <strong>Account 45893</strong> - $19,900 asking / $497,313 cashflow = 0.04x (15-day payback)</li>
                  <li>• <strong>Account 45895</strong> - $409,900 asking / $502,135 cashflow = 0.82x (10-month payback)</li>
                  <li>• <strong>Account 44397</strong> - Posted 3 different listings, all with 0.91x-1.36x multiples</li>
                </ul>

                <div className="bg-yellow-50 border-l-4 border-yellow-600 p-4 rounded">
                  <p className="text-gray-700 text-lg mb-3">
                    <strong>Why this matters:</strong>
                  </p>
                  <p className="text-gray-700 mb-3">
                    If a business really generated $497K in annual cashflow, no rational seller would accept $19,900 
                    for it. You'd recover your investment in 15 days. The seller would be giving away a money-printing 
                    machine for pocket change.
                  </p>
                  <p className="text-gray-700">
                    These aren't distressed sales or special situations. They're listings that stay active for months, 
                    collect buyer contact information, and never result in actual transactions at the stated prices.
                  </p>
                </div>

                <p className="text-gray-700 text-lg mt-6 italic">
                  When 40 out of 139 listings (29%) have mathematically impossible multiples, and they stay active 
                  for months without being removed, the platform has stopped functioning as a legitimate marketplace.
                </p>
              </div>
            </section>

            {/* How We Know - Methodology */}
            <section className="mb-16">
              <h2 className="text-3xl font-bold text-gray-900 mb-6">How We Know This</h2>
              
              <div className="bg-gray-50 rounded-lg p-8 mb-8">
                <p className="text-gray-700 text-lg mb-6 leading-relaxed">
                  We didn't just guess. We built the infrastructure to systematically research and analyze 
                  BizBuySell's marketplace over time:
                </p>
                
                <div className="space-y-6">
                  <div className="bg-white rounded-lg p-6">
                    <h3 className="font-bold text-gray-900 mb-3 text-xl">1. Built a Database of 2,500 Business Brokers</h3>
                    <p className="text-gray-700 leading-relaxed mb-3">
                      Over the past year, we diligently built a database of the top 2,500 business brokers in 
                      the United States. For each broker, we attempted to verify their legitimacy through 
                      multiple signals:
                    </p>
                    <ul className="text-gray-700 space-y-2 ml-4">
                      <li>• Active web presence (professional website)</li>
                      <li>• LinkedIn profile with broker credentials</li>
                      <li>• Verifiable business registration</li>
                      <li>• Professional associations and licenses</li>
                    </ul>
                    <p className="text-gray-700 mt-3 leading-relaxed">
                      <strong>Red flags we tracked:</strong> No web presence, no LinkedIn profile, no verifiable 
                      business registration, or no signs they're actually operating as a business broker. These 
                      signals help us distinguish legitimate brokers from suspicious accounts.
                    </p>
                  </div>

                  <div className="bg-white rounded-lg p-6">
                    <h3 className="font-bold text-gray-900 mb-3 text-xl">2. Analyzed Over 1,000 Listings</h3>
                    <p className="text-gray-700 leading-relaxed">
                      We've systematically reviewed over 1,000 cleaning business listings on BizBuySell over time. 
                      For our most recent analysis, we examined the 139 commercial and residential cleaning 
                      listings that appeared in the past 30 days. For each listing, we extracted the asking price, 
                      cash flow, broker account, and contact information.
                    </p>
                  </div>

                  <div className="bg-white rounded-lg p-6">
                    <h3 className="font-bold text-gray-900 mb-3 text-xl">3. Calculated the Multiples</h3>
                    <p className="text-gray-700 leading-relaxed">
                      We calculated price-to-cashflow multiples for every listing with financial data. 
                      Industry standard for service businesses: 2.5x-4x. Anything below 1.5x is mathematically 
                      suspicious—you'd get your money back in under 18 months.
                    </p>
                  </div>

                  <div className="bg-white rounded-lg p-6">
                    <h3 className="font-bold text-gray-900 mb-3 text-xl">4. Cross-Referenced Against Our Database</h3>
                    <p className="text-gray-700 leading-relaxed">
                      We matched broker accounts against our database of 2,500 verified brokers. This revealed 
                      which listings came from legitimate brokers, which were from unverified accounts, and 
                      critically—which verified brokers were posting impossible deals.
                    </p>
                  </div>

                  <div className="bg-white rounded-lg p-6">
                    <h3 className="font-bold text-gray-900 mb-3 text-xl">5. Identified Patterns Over Time</h3>
                    <p className="text-gray-700 leading-relaxed">
                      Through ongoing research, we found fake account farms posting identical "aircraft cleaning" 
                      listings across different cities, franchise spam with no real financials, and verified 
                      brokers systematically posting deals with impossible multiples for lead generation. The 
                      pattern is consistent month after month—roughly 60% of listings have serious problems.
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 border-2 border-blue-400 rounded-lg p-6">
                <p className="text-gray-700 text-lg font-medium mb-2">
                  The Result:
                </p>
                <p className="text-gray-700 leading-relaxed">
                  In the past 30 days, 54 out of 139 new listings (39%) passed our verification. The rest had 
                  serious red flags: impossible multiples, no financial data, fake account patterns, or were 
                  incorrectly categorized. We have the receipts for every single one. And this pattern holds 
                  true whether we analyze the past month or the past year—BizBuySell's marketplace is consistently 
                  broken.
                </p>
              </div>
            </section>

            {/* The Problem - Market for Lemons */}
            <section className="mb-16">
              <h2 className="text-3xl font-bold text-gray-900 mb-6">The Problem: A Market for Lemons</h2>
              
              <div className="bg-blue-50 border-2 border-blue-400 rounded-lg p-8 mb-8">
                <p className="text-gray-700 text-lg italic mb-4">
                  "When quality cannot be verified, bad products drive out good ones."
                </p>
                <p className="text-gray-700 text-sm">
                  — George Akerlof, "The Market for Lemons" (Nobel Prize in Economics, 2001)
                </p>
              </div>

              <div className="prose prose-lg max-w-none text-gray-700 mb-8 bg-gray-50 border border-gray-200 rounded-lg p-8">
                <p>
                  In 1970, economist George Akerlof described what happens when buyers can't distinguish quality products 
                  from junk. He called it "The Market for Lemons." When sellers know more than buyers (asymmetric information), 
                  and there's no way to verify quality, bad products flood the market and good ones disappear.
                </p>
                <p>
                  <strong>This is exactly what's happening on BizBuySell:</strong>
                </p>
                <ul className="space-y-3">
                  <li>
                    <strong>Buyers can't verify quality</strong> — Is the cashflow real? Is the broker legitimate? 
                    There's no easy way to know.
                  </li>
                  <li>
                    <strong>Bad listings flood the market</strong> — When 60% of listings have serious problems, 
                    buyers waste months chasing fake deals.
                  </li>
                  <li>
                    <strong>Good listings get buried</strong> — Legitimate brokers with real businesses can't compete 
                    with impossible multiples and franchise spam.
                  </li>
                  <li>
                    <strong>Trust collapses</strong> — Eventually, serious buyers stop looking. Why spend time on a 
                    marketplace where most listings are worthless?
                  </li>
                </ul>
              </div>
              
              <div className="bg-red-50 border-2 border-red-200 rounded-lg p-8 mb-8">
                <h3 className="text-2xl font-bold text-gray-900 mb-4">
                  BizBuySell's Business Model Creates the Problem
                </h3>
                
                <div className="space-y-6 text-gray-700 text-lg">
                  <p>
                    BizBuySell charges <strong>$100-$400 per month</strong> for listing fees. 
                    Anyone can post anything. There's no quality verification. No financial validation.
                  </p>
                  
                  <div className="bg-white rounded-lg p-6">
                    <p className="font-semibold text-gray-900 mb-3">Here's the math:</p>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center border-b pb-2">
                        <span>10 legitimate listings × $300/month</span>
                        <span className="font-bold">= $3,000</span>
                      </div>
                      <div className="flex justify-between items-center border-b pb-2">
                        <span>100 junk/franchise listings × $200/month</span>
                        <span className="font-bold text-red-600">= $20,000</span>
                      </div>
                    </div>
                  </div>

                  <p className="text-xl font-bold text-red-600">
                    BizBuySell makes MORE money from junk listings than real ones.
                  </p>

                  <p>
                    If they verified listings and rejected the garbage, they'd lose 60% of their revenue. 
                    That's not a bug in their system. <strong>That IS their system.</strong>
                  </p>
                </div>
              </div>

              <div className="prose prose-lg max-w-none text-gray-700 bg-gray-50 border border-gray-200 rounded-lg p-8">
                <h3 className="text-2xl font-bold text-gray-900 mb-4">Who Loses?</h3>
                <ul className="space-y-3">
                  <li>
                    <strong>Legitimate brokers</strong> — Their real listings get buried in spam. 
                    Qualified buyers never see them.
                  </li>
                  <li>
                    <strong>Serious buyers</strong> — They waste months chasing fake leads, lose trust 
                    in the entire market, and often give up.
                  </li>
                  <li>
                    <strong>The industry</strong> — When 60% of listings are junk, everyone's reputation suffers.
                  </li>
                </ul>

                <h3 className="text-2xl font-bold text-gray-900 mb-4 mt-8">Who Wins?</h3>
                <ul className="space-y-3">
                  <li>
                    <strong>BizBuySell</strong> — Collects monthly fees from everyone, real or fake
                  </li>
                  <li>
                    <strong>Franchise companies</strong> — Pay $200/month, capture 100 emails, sell $500K franchises
                  </li>
                  <li>
                    <strong>Lead generation accounts</strong> — Farm contact info, sell to "opportunity" lists
                  </li>
                </ul>
              </div>
            </section>

            {/* The Proof - Screenshots */}
            <section className="mb-16">
              <h2 className="text-3xl font-bold text-gray-900 mb-6">The Proof: Screenshots from BizBuySell</h2>
              
              <div className="bg-red-50 border-2 border-red-400 rounded-lg p-8">
                <p className="text-gray-700 mb-6">
                  These aren't typos. These aren't glitches. These are VERIFIED broker accounts on BizBuySell 
                  posting deals with impossible multiples that no rational seller would accept.
                </p>
                
                <div className="space-y-8">
                  {/* Screenshot 1 */}
                  <div className="bg-white rounded-lg p-6 border-2 border-red-300">
                    <div className="mb-4">
                      <span className="inline-block bg-red-600 text-white px-3 py-1 rounded text-sm font-bold">
                        Account #45893 - VERIFIED BROKER
                      </span>
                    </div>
                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <h4 className="font-bold text-gray-900 mb-3">The Listing:</h4>
                        <ul className="space-y-2 text-gray-700">
                          <li>• <strong>Asking Price:</strong> $19,900</li>
                          <li>• <strong>Annual Cash Flow:</strong> $497,313</li>
                          <li>• <strong>Multiple:</strong> 0.04x</li>
                          <li>• <strong>Payback Period:</strong> 15 days</li>
                        </ul>
                      </div>
                      <div className="bg-gray-50 p-4 rounded">
                        <p className="text-sm text-gray-600 mb-2"><strong>The Math:</strong></p>
                        <p className="text-sm text-gray-700">
                          If this business generates $497,313 per year in cash flow, and you can buy it for $19,900, 
                          you'd recover your entire investment in 15 days.
                        </p>
                        <p className="text-sm text-red-600 font-bold mt-3">
                          Why would ANY owner sell a business generating $500K/year for $20K?
                        </p>
                      </div>
                    </div>
                    <div className="mt-4 p-3 bg-gray-100 rounded text-xs text-gray-600">
                      <strong>BizBuySell Listing ID:</strong> [View actual screenshot at launch]
                    </div>
                  </div>
                  
                  {/* Screenshot 2 */}
                  <div className="bg-white rounded-lg p-6 border-2 border-red-300">
                    <div className="mb-4">
                      <span className="inline-block bg-red-600 text-white px-3 py-1 rounded text-sm font-bold">
                        Account #45895 - VERIFIED BROKER
                      </span>
                    </div>
                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <h4 className="font-bold text-gray-900 mb-3">The Listing:</h4>
                        <ul className="space-y-2 text-gray-700">
                          <li>• <strong>Asking Price:</strong> $409,900</li>
                          <li>• <strong>Annual Cash Flow:</strong> $502,135</li>
                          <li>• <strong>Multiple:</strong> 0.82x</li>
                          <li>• <strong>Payback Period:</strong> 10 months</li>
                        </ul>
                      </div>
                      <div className="bg-gray-50 p-4 rounded">
                        <p className="text-sm text-gray-600 mb-2"><strong>The Marketing:</strong></p>
                        <p className="text-sm text-gray-700">
                          Beautiful copy. Talks about "recession-proof," "proprietary software," "established client base."
                        </p>
                        <p className="text-sm text-red-600 font-bold mt-3">
                          But if the numbers were real, institutional buyers would pay 3-4x this price.
                        </p>
                      </div>
                    </div>
                    <div className="mt-4 p-3 bg-gray-100 rounded text-xs text-gray-600">
                      <strong>BizBuySell Listing ID:</strong> [View actual screenshot at launch]
                    </div>
                  </div>
                  
                  {/* Pattern */}
                  <div className="bg-yellow-50 border-2 border-yellow-400 rounded-lg p-6">
                    <h4 className="font-bold text-gray-900 mb-3">This Is Not Isolated</h4>
                    <p className="text-gray-700 mb-4">
                      In the past 30 days alone, we found:
                    </p>
                    <ul className="space-y-2 text-gray-700">
                      <li>• <strong>40 listings (29%)</strong> with multiples below 1.5x</li>
                      <li>• <strong>20 different verified broker accounts</strong> posting impossible deals</li>
                      <li>• <strong>9 aircraft cleaning scam accounts</strong> posting fake listings</li>
                      <li>• <strong>42 listings (30%)</strong> with no financial data at all</li>
                    </ul>
                    <p className="text-gray-700 mt-4 font-bold">
                      This pattern holds across all 824 listings we analyzed.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* Verification Methodology */}
            <section className="mb-16">
              <h2 className="text-3xl font-bold text-gray-900 mb-6">Our Verification Methodology</h2>
              
              <div className="bg-blue-50 border-2 border-blue-400 rounded-lg p-8 mb-8">
                <h3 className="text-xl font-bold text-gray-900 mb-4">
                  How We Verify Listings (Simple + Transparent)
                </h3>
                
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">1</div>
                    <div>
                      <h4 className="font-bold text-gray-900 mb-1">Financial Data Required</h4>
                      <p className="text-gray-700">Listing must include revenue AND cash flow or EBITDA. We calculate the multiple and flag anything below 1.5x as impossible.</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">2</div>
                    <div>
                      <h4 className="font-bold text-gray-900 mb-1">Commercial Cleaning Only</h4>
                      <p className="text-gray-700">We remove dry cleaning (different industry), aircraft cleaning (confirmed scam category), and franchise recruitment listings (not real businesses for sale).</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">3</div>
                    <div>
                      <h4 className="font-bold text-gray-900 mb-1">Verified Broker with Real Contact Info</h4>
                      <p className="text-gray-700">Cross-referenced against our database of 2,500 brokers. Must have web presence, business registration, or LinkedIn profile. Phone and email must work.</p>
                    </div>
                  </div>
                </div>
                
                <div className="mt-6 p-4 bg-white rounded-lg">
                  <p className="text-sm text-gray-600">
                    <strong>Process:</strong> Automated scraping + ML pattern detection + manual review of flagged listings. 
                    We run this daily on all new listings from 1,500+ broker websites.
                  </p>
                </div>
              </div>
            </section>

            {/* The Solution */}
            <section className="mb-16">
              <h2 className="text-3xl font-bold text-gray-900 mb-6">The Solution: CleaningExits</h2>
              
              <div className="bg-emerald-50 border-2 border-emerald-400 rounded-lg p-8 mb-8">
                <h3 className="text-2xl font-bold text-gray-900 mb-6">
                  We Built What BizBuySell Should Have Been
                </h3>
                
                <div className="grid md:grid-cols-2 gap-8 mb-8">
                  <div className="bg-red-50 border-2 border-red-400 rounded-lg p-6">
                    <h4 className="font-bold text-gray-900 mb-3 text-lg">❌ BizBuySell</h4>
                    <ul className="space-y-2 text-red-800">
                      <li>• 1,000+ "cleaning" listings</li>
                      <li>• 65% are junk, wrong category, or spam</li>
                      <li>• Pay $100-400/month to list anything</li>
                      <li>• No quality verification</li>
                      <li>• Makes MORE from junk listings</li>
                    </ul>
                  </div>
                  
                  <div className="bg-emerald-50 border-2 border-emerald-400 rounded-lg p-6">
                    <h4 className="font-bold text-gray-900 mb-3 text-lg">✅ CleaningExits</h4>
                    <ul className="space-y-2 text-emerald-800">
                      <li>• 291 verified commercial cleaning businesses</li>
                      <li>• Analyzed 824 listings, kept only the best</li>
                      <li>• Free for legitimate brokers</li>
                      <li>• Co-brokering revenue model</li>
                      <li>• We only win when YOU close</li>
                    </ul>
                  </div>
                </div>

                <div className="bg-white rounded-lg p-6">
                  <h4 className="font-bold text-gray-900 mb-3">How We're Different:</h4>
                  <ul className="space-y-3 text-gray-700">
                    <li>
                      <strong>Curated, not cluttered</strong> — We analyzed 824 BizBuySell listings over time 
                      and removed 533 (65%) as dry cleaning, aircraft scams, franchises, or junk. Only 291 
                      legitimate commercial cleaning businesses made the cut.
                    </li>
                    <li>
                      <strong>Verified brokers</strong> — Cross-referenced against our database of 2,500 brokers 
                      with web presence, LinkedIn, and business registration.
                    </li>
                    <li>
                      <strong>Financial validation</strong> — We calculate multiples and flag impossible deals. 
                      If the numbers don't make sense, it doesn't get listed.
                    </li>
                    <li>
                      <strong>Aligned incentives</strong> — We make money through co-brokering when deals close, 
                      not from monthly listing fees. Your success is our success.
                    </li>
                  </ul>
                </div>
              </div>
            </section>

            {/* For Brokers Section - NEW */}
            <section className="mb-16">
              <h2 className="text-3xl font-bold text-gray-900 mb-6">A Note to Brokers</h2>
              
              <div className="bg-emerald-50 border-2 border-emerald-400 rounded-lg p-8">
                <p className="text-lg text-gray-800 mb-4">
                  <strong>You're not the problem. The platform incentives are.</strong>
                </p>
                
                <p className="text-gray-700 mb-4">
                  BizBuySell penalizes accuracy and rewards volume. They charge you $100-400/month regardless 
                  of listing quality, so their revenue goes UP when junk listings flood the platform.
                </p>
                
                <p className="text-gray-700 mb-4">
                  Your legitimate listings get buried. Buyers waste time on garbage. And the serious operators 
                  (like you) lose credibility by association.
                </p>
                
                <div className="bg-white rounded-lg p-6 mt-6">
                  <h3 className="font-bold text-gray-900 mb-3">What CleaningExits Does for You:</h3>
                  <ul className="space-y-3 text-gray-700">
                    <li className="flex items-start gap-2">
                      <span className="text-emerald-600 font-bold">✓</span>
                      <span><strong>Free listing</strong> for verified brokers (no monthly fees)</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-emerald-600 font-bold">✓</span>
                      <span><strong>Quality buyers only</strong> — no tire-kickers wasting your time on fake deals</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-emerald-600 font-bold">✓</span>
                      <span><strong>Co-brokering opportunities</strong> — we bring you qualified buyers and split commission</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-emerald-600 font-bold">✓</span>
                      <span><strong>Your listings stand out</strong> — no junk to compete with</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-emerald-600 font-bold">✓</span>
                      <span><strong>Direct contact info displayed</strong> — buyers can reach you immediately</span>
                    </li>
                  </ul>
                </div>
                
                <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                  <p className="text-gray-700">
                    <strong>We built this because we're brokers too.</strong> We ran ATM Brokerage for 10+ years and 
                    facilitated $75-100M in transactions by becoming the trusted specialist. We know what legitimate 
                    brokers need: quality buyers, clean data, and aligned incentives.
                  </p>
                </div>
              </div>
            </section>

            {/* CTA */}
            <div className="bg-white rounded-xl border-2 border-emerald-600 p-8 text-center">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Ready to Find a Real Cleaning Business?
              </h2>
              <p className="text-gray-700 text-lg mb-8">
                Browse our curated database of 291 verified commercial cleaning businesses. 
                No junk. No franchises. No dry cleaning. No impossible deals.
              </p>
              <div className="flex flex-wrap gap-4 justify-center">
                <Link
                  href="/cleaning-index"
                  className="inline-block px-8 py-4 bg-emerald-600 text-white font-bold rounded-lg hover:bg-emerald-700 transition text-lg"
                >
                  Browse Verified Listings
                </Link>
                <Link
                  href="/subscribe"
                  className="inline-block px-8 py-4 bg-gray-200 text-gray-800 font-bold rounded-lg hover:bg-gray-300 transition text-lg"
                >
                  Get Weekly Top 10
                </Link>
              </div>
            </div>

            <div className="text-center mt-12">
              <Link href="/" className="text-emerald-600 hover:text-emerald-700 font-semibold text-lg">
                ← Back to Home
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}






