// pages/why.tsx
// DROP THIS FILE INTO YOUR REPO AT: pages/why.tsx
// THEN ADD THE TWO SCREENSHOT IMAGES TO: public/images/

import Head from 'next/head';
import Link from 'next/link';
import Image from 'next/image';

export default function Why() {
  return (
    <>
      <Head>
        <title>Why We Built CleaningExits | The BizBuySell Problem</title>
        <meta 
          name="description" 
          content="We analyzed 327 BizBuySell listings. 75% were fake. Here's the data, the broken business model, and why we built CleaningExits to fix it." 
        />
        <link rel="canonical" href="https://cleaningexits.com/why" />
      </Head>

      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white border-b">
          <div className="max-w-4xl mx-auto px-4 py-4">
            <Link href="/" className="text-emerald-600 hover:text-emerald-700 font-semibold">
              ← Back to CleaningExits
            </Link>
          </div>
        </header>

        {/* Hero */}
        <div className="bg-gradient-to-br from-gray-900 to-gray-800 text-white py-20">
          <div className="max-w-4xl mx-auto px-4">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              BizBuySell Has a Problem.<br />
              We're Fixing It.
            </h1>
            <p className="text-xl text-gray-300 leading-relaxed">
              We analyzed all 981 cleaning business listings on BizBuySell. Only 280 (29%) are legitimate. 
              Here's the data that exposes a fundamentally broken marketplace.
            </p>
          </div>
        </div>

        {/* Main Content */}
        <main className="max-w-4xl mx-auto px-4 py-16">
          
          {/* The Data */}
          <section className="mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">The Data</h2>
            
            <div className="bg-white rounded-lg border-2 border-gray-200 p-8 mb-8">
              <div className="grid md:grid-cols-3 gap-8 text-center mb-8">
                <div>
                  <div className="text-5xl font-bold text-gray-900 mb-2">981</div>
                  <div className="text-gray-600">Total Listings Analyzed</div>
                </div>
                <div>
                  <div className="text-5xl font-bold text-emerald-600 mb-2">280</div>
                  <div className="text-gray-600">Verified Real (29%)</div>
                </div>
                <div>
                  <div className="text-5xl font-bold text-red-600 mb-2">319</div>
                  <div className="text-gray-600">Confirmed Garbage (33%)</div>
                </div>
              </div>
              
              <div className="border-t pt-6">
                <p className="text-gray-700 text-lg leading-relaxed">
                  We analyzed every single cleaning business listing on BizBuySell — all 981 of them. 
                  We verified broker accounts against our database of 75,000 brokers, analyzed financials, 
                  and checked multiples. The result? Only 280 listings (29%) are legitimate businesses 
                  with real brokers and verifiable financials. 319 (33%) are definite garbage—impossible 
                  multiples, franchise spam, and lead-gen traps. The remaining 382 need manual review.
                </p>
              </div>
            </div>

            <div className="prose prose-lg max-w-none text-gray-700">
              <p>
                <strong>What we found in the garbage pile:</strong>
              </p>
              <ul className="space-y-2">
                <li><strong>141 listings with scam multiples</strong> (below 1.5x) — Including 64 from VERIFIED brokers</li>
                <li><strong>177 franchise spam listings</strong> with no real financials</li>
                <li><strong>Multiple fake account farms</strong> posting identical listings across different cities</li>
                <li><strong>Verified brokers using fake names</strong> to post impossible deals</li>
              </ul>
              
              <p className="mt-6">
                <strong>On a typical day:</strong> We tracked 9 new cleaning business listings posted 
                yesterday. Only 2 were real (22%). The other 7 were fake accounts, impossible multiples, 
                or franchise spam.
              </p>
            </div>
          </section>

          {/* The Evidence */}
          <section className="mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">The Evidence</h2>
            
            <p className="text-gray-700 text-lg mb-8 leading-relaxed">
              Here are two examples from our analysis. These listings have been active for months with 
              impossible financials. The worst part? One is from a VERIFIED broker using a fake name.
            </p>

            {/* Junk Listing 1 */}
            <div className="bg-yellow-50 border-2 border-yellow-400 rounded-lg p-6 mb-6">
              <div className="mb-4">
                <Image 
                  src="/images/bizbuysell-junk-1.png" 
                  alt="BizBuySell listing showing impossible 0.82x multiple"
                  width={600}
                  height={400}
                  className="w-full max-w-2xl mx-auto rounded border border-gray-300"
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
                  width={600}
                  height={400}
                  className="w-full max-w-2xl mx-auto rounded border border-gray-300"
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

          {/* The Scandal */}
          <section className="mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">The Scandal: Verified Brokers Posting Fakes</h2>
            
            <div className="bg-red-50 border-2 border-red-400 rounded-lg p-8 mb-8">
              <p className="text-gray-700 text-lg mb-6 leading-relaxed">
                The junk listings aren't just from anonymous scammers. We found something worse:
              </p>
              
              <div className="bg-white rounded-lg p-6 mb-6">
                <p className="text-2xl font-bold text-red-600 mb-4">
                  64 VERIFIED brokers are posting listings with impossible multiples (below 1.5x)
                </p>
                <p className="text-gray-700 text-lg">
                  These aren't random spam accounts. These are legitimate, verified business brokers 
                  with real accounts posting deals that mathematically don't make sense. They're using 
                  BizBuySell as a lead generation tool, not selling actual businesses.
                </p>
              </div>

              <p className="text-gray-700 text-lg mb-4">
                <strong>Example from our data:</strong>
              </p>
              <ul className="text-gray-700 space-y-2 mb-6">
                <li>• <strong>Account 45895</strong> - Verified broker John Harris / The Acquisition Pros</li>
                <li>• Posted under fake name "Julian Sloane, JS Associates"</li>
                <li>• Hartford, CT listing: $410K asking / $502K cashflow = 0.8x multiple</li>
                <li>• This broker has a verified account but posted an impossible deal</li>
              </ul>

              <p className="text-gray-700 text-lg italic">
                When legitimate brokers start posting fake deals for lead generation, the entire 
                marketplace becomes worthless.
              </p>
            </div>
          </section>

          {/* The Problem */}
          <section className="mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">The Problem: Follow the Money</h2>
            
            <div className="bg-red-50 border-2 border-red-200 rounded-lg p-8 mb-8">
              <h3 className="text-2xl font-bold text-gray-900 mb-4">
                BizBuySell's Business Model Creates Perverse Incentives
              </h3>
              
              <div className="space-y-6 text-gray-700 text-lg">
                <p>
                  BizBuySell charges <strong>$100-$400 per month</strong> for listing fees. 
                  Anyone can post anything. There's no verification process. No quality control.
                </p>
                
                <div className="bg-white rounded-lg p-6">
                  <p className="font-semibold text-gray-900 mb-3">Here's the math:</p>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center border-b pb-2">
                      <span>10 legitimate listings × $300/month</span>
                      <span className="font-bold">= $3,000</span>
                    </div>
                    <div className="flex justify-between items-center border-b pb-2">
                      <span>100 fake/franchise listings × $200/month</span>
                      <span className="font-bold text-red-600">= $20,000</span>
                    </div>
                  </div>
                </div>

                <p className="text-xl font-bold text-red-600">
                  BizBuySell makes MORE money from fake listings than real ones.
                </p>

                <p>
                  If they verified listings and rejected the junk, they'd lose 75% of their revenue. 
                  That's not a bug in their system. <strong>That IS their system.</strong>
                </p>
              </div>
            </div>

            <div className="prose prose-lg max-w-none text-gray-700">
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
                  <strong>The industry</strong> — When 75% of listings are junk, everyone's reputation suffers.
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
                  <strong>Lead generation scammers</strong> — Farm contact info, sell to "opportunity" lists
                </li>
              </ul>
            </div>
          </section>

          {/* The Solution */}
          <section className="mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Our Solution: Flip the Model</h2>
            
            <div className="bg-emerald-50 border-2 border-emerald-200 rounded-lg p-8 mb-8">
              <h3 className="text-2xl font-bold text-gray-900 mb-6">
                We Built CleaningExits the Way It Should Have Been Built
              </h3>

              <div className="grid md:grid-cols-2 gap-8">
                <div>
                  <h4 className="font-bold text-gray-900 mb-3 text-lg">❌ BizBuySell's Model</h4>
                  <ul className="space-y-2 text-gray-700">
                    <li>• Charges listing fees</li>
                    <li>• No verification</li>
                    <li>• Profits from volume</li>
                    <li>• Incentive to accept junk</li>
                    <li>• 50,000+ listings (mostly spam)</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-bold text-gray-900 mb-3 text-lg">✅ CleaningExits Model</h4>
                  <ul className="space-y-2 text-emerald-800">
                    <li>• Free for legitimate brokers</li>
                    <li>• Manual verification against 75K broker database</li>
                    <li>• Co-brokering revenue model</li>
                    <li>• We only win when YOU close</li>
                    <li>• 280 verified listings (not 981 spam-filled)</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="space-y-6 text-gray-700 text-lg">
              <p>
                <strong>Here's the key difference:</strong>
              </p>
              
              <p>
                We don't charge listing fees. We co-broker on closed deals. That means our incentives 
                are perfectly aligned with yours. We make money when you successfully acquire a business, 
                not when scammers post fake listings.
              </p>

              <div className="bg-white rounded-lg border-2 border-emerald-200 p-6">
                <h4 className="font-bold text-gray-900 mb-4 text-xl">Our Verification Process</h4>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <span className="text-emerald-600 text-xl flex-shrink-0">✓</span>
                    <div>
                      <strong>Real broker verification</strong> — We verify every listing against our 
                      database of 75,000 business brokers. Fake accounts and phantom brokers don't make it through.
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="text-emerald-600 text-xl flex-shrink-0">✓</span>
                    <div>
                      <strong>Financial analysis</strong> — We check that multiples make sense 
                      (2.5x-4x for cleaning businesses) and flag impossible numbers
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="text-emerald-600 text-xl flex-shrink-0">✓</span>
                    <div>
                      <strong>Franchise filter</strong> — We automatically exclude franchise 
                      opportunities and lead-gen traps
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="text-emerald-600 text-xl flex-shrink-0">✓</span>
                    <div>
                      <strong>Ongoing monitoring</strong> — We remove dead listings and verify 
                      businesses are still available
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* The Track Record */}
          <section className="mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">We've Done This Before</h2>
            
            <div className="bg-gray-50 rounded-lg border p-8">
              <div className="prose prose-lg max-w-none text-gray-700">
                <p className="text-lg">
                  In 2013, I built <strong>ATM Brokerage</strong> using this exact model. Everyone said the 
                  ATM market was too small to specialize. I ignored them.
                </p>
                
                <p className="text-lg">
                  For 12 years, we showed up at trade shows, built relationships with legitimate operators, 
                  and refused to list questionable businesses—even when it meant turning away easy money.
                </p>

                <div className="bg-white rounded-lg p-6 my-6">
                  <p className="text-2xl font-bold text-emerald-600 mb-2">90% Market Share</p>
                  <p className="text-gray-600 mb-0">
                    Over 200 transactions totaling $75-100M in ATM business sales
                  </p>
                </div>

                <p className="text-lg">
                  We became the dominant player by doing one thing: cutting through the BS. 
                  Quality over quantity. Trust over revenue. Results over listings.
                </p>

                <p className="text-lg font-semibold">
                  Now we're doing it again with CleaningExits.
                </p>
              </div>
            </div>
          </section>

          {/* Why This Matters */}
          <section className="mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Why This Matters</h2>
            
            <div className="prose prose-lg max-w-none text-gray-700">
              <p className="text-lg">
                This isn't just about building a better business listing site. This is about fixing 
                a fundamentally broken marketplace that hurts everyone except the scammers.
              </p>

              <p className="text-lg">
                When 75% of listings are fake, buyers stop trusting the entire market. Legitimate 
                brokers can't compete. Good businesses sit unsold while franchise traps get all the attention.
              </p>

              <p className="text-lg">
                <strong>That's not how it should work.</strong>
              </p>

              <p className="text-lg">
                We built CleaningExits because buyers deserve a marketplace they can trust. Because 
                legitimate brokers deserve qualified leads. Because the commercial cleaning industry 
                deserves better than BizBuySell's broken model.
              </p>
            </div>
          </section>

          {/* The Commitment */}
          <section className="mb-16">
            <div className="bg-gradient-to-br from-emerald-600 to-emerald-700 text-white rounded-lg p-8">
              <h2 className="text-3xl font-bold mb-4">Our Commitment</h2>
              <div className="space-y-4 text-lg">
                <p>
                  <strong>We will never charge listing fees.</strong> Our incentive is closing deals, 
                  not collecting monthly payments from scammers.
                </p>
                <p>
                  <strong>We will manually verify every listing.</strong> If we can't confirm it's legitimate, 
                  it doesn't go on the site. Period.
                </p>
                <p>
                  <strong>We will call out the junk.</strong> Every week, we'll expose fake listings and 
                  teach buyers how to spot red flags.
                </p>
                <p>
                  <strong>We will build the marketplace cleaning businesses deserve.</strong> Quality over 
                  quantity. Trust over revenue. Always.
                </p>
              </div>
            </div>
          </section>

          {/* CTA */}
          <section className="text-center">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Ready to See the Difference?</h2>
            <p className="text-xl text-gray-600 mb-8">
              Browse 280 verified cleaning businesses. No franchise spam. No fake listings. No impossible multiples.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link 
                href="/"
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-4 px-8 rounded-lg text-lg transition"
              >
                Browse Verified Listings →
              </Link>
              <Link 
                href="/subscribe"
                className="bg-white hover:bg-gray-50 text-emerald-700 font-bold py-4 px-8 rounded-lg border-2 border-emerald-600 text-lg transition"
              >
                Get Weekly Top 10 →
              </Link>
            </div>

            <div className="mt-12 pt-12 border-t">
              <p className="text-gray-600 italic">
                Questions about this analysis? Want to share your BizBuySell horror story?
              </p>
              <p className="text-gray-600 mt-2">
                <Link href="/contact" className="text-emerald-600 hover:text-emerald-700 font-semibold">
                  Get in touch →
                </Link>
              </p>
            </div>
          </section>
        </main>

        {/* Footer */}
        <footer className="bg-gray-900 text-gray-400 py-12">
          <div className="max-w-4xl mx-auto px-4 text-center">
            <p className="text-sm">
              © 2024 Cleaning Exits. Built by people who actually give a damn about buyers.
            </p>
          </div>
        </footer>
      </div>
    </>
  );
}

