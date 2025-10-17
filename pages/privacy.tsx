// pages/privacy.tsx
import Head from 'next/head';
import Link from 'next/link';
import Header from '../components/Header';
import Footer from '../components/Footer';

export default function Privacy() {
  return (
    <>
      <Head>
        <title>Privacy Policy | Cleaning Exits</title>
        <meta name="description" content="Privacy Policy for Cleaning Exits" />
      </Head>

      <Header />

      <main className="mx-auto max-w-4xl px-4 py-12">
        <h1 className="text-4xl font-bold mb-6">Privacy Policy</h1>
        
        <div className="prose prose-lg max-w-none bg-white rounded-xl border p-8">
          <p className="text-sm text-gray-600 mb-6">Last updated: October 17, 2025</p>

          <h2 className="text-2xl font-bold mt-8 mb-4">Introduction</h2>
          <p>
            Cleaning Exits ("we," "our," or "us") respects your privacy. This Privacy Policy explains 
            how we collect, use, and protect your personal information when you use our website at 
            cleaningexits.com (the "Site").
          </p>

          <h2 className="text-2xl font-bold mt-8 mb-4">Information We Collect</h2>
          <h3 className="text-xl font-semibold mt-6 mb-3">Information You Provide</h3>
          <p>We collect information you provide directly to us, including:</p>
          <ul>
            <li>Name and email address when you subscribe to our newsletter</li>
            <li>Contact information when you inquire about listings</li>
            <li>Any other information you choose to provide</li>
          </ul>

          <h3 className="text-xl font-semibold mt-6 mb-3">Automatically Collected Information</h3>
          <p>When you visit our Site, we automatically collect certain information, including:</p>
          <ul>
            <li>IP address and browser type</li>
            <li>Pages visited and time spent on our Site</li>
            <li>Referring website</li>
          </ul>

          <h2 className="text-2xl font-bold mt-8 mb-4">How We Use Your Information</h2>
          <p>We use the information we collect to:</p>
          <ul>
            <li>Send you our weekly newsletter and updates about cleaning business listings</li>
            <li>Respond to your inquiries and provide customer service</li>
            <li>Connect you with relevant business opportunities</li>
            <li>Improve and optimize our Site</li>
            <li>Comply with legal obligations</li>
          </ul>

          <h2 className="text-2xl font-bold mt-8 mb-4">Information Sharing</h2>
          <p>We do not sell your personal information. We may share your information with:</p>
          <ul>
            <li><strong>Business brokers</strong> - When you express interest in a specific listing, 
            we may share your contact information with the listing broker</li>
            <li><strong>Service providers</strong> - Third parties who help us operate our Site 
            and send emails (e.g., email service providers)</li>
            <li><strong>Legal requirements</strong> - When required by law or to protect our rights</li>
          </ul>

          <h2 className="text-2xl font-bold mt-8 mb-4">Your Choices</h2>
          <p>You have the following rights regarding your information:</p>
          <ul>
            <li><strong>Unsubscribe</strong> - You can unsubscribe from our emails at any time by 
            clicking the unsubscribe link in any email</li>
            <li><strong>Access and deletion</strong> - You can request access to or deletion of 
            your personal information by contacting us at hello@cleaningexits.com</li>
          </ul>

          <h2 className="text-2xl font-bold mt-8 mb-4">Cookies</h2>
          <p>
            We use cookies and similar tracking technologies to improve your experience on our Site. 
            You can control cookies through your browser settings.
          </p>

          <h2 className="text-2xl font-bold mt-8 mb-4">Data Security</h2>
          <p>
            We implement reasonable security measures to protect your personal information. However, 
            no method of transmission over the internet is 100% secure.
          </p>

          <h2 className="text-2xl font-bold mt-8 mb-4">Children's Privacy</h2>
          <p>
            Our Site is not intended for children under 13. We do not knowingly collect information 
            from children under 13.
          </p>

          <h2 className="text-2xl font-bold mt-8 mb-4">Changes to This Policy</h2>
          <p>
            We may update this Privacy Policy from time to time. We will notify you of any material 
            changes by posting the new policy on this page and updating the "Last updated" date.
          </p>

          <h2 className="text-2xl font-bold mt-8 mb-4">Contact Us</h2>
          <p>
            If you have questions about this Privacy Policy, please contact us at:
          </p>
          <p>
            <strong>Email:</strong> hello@cleaningexits.com
          </p>
        </div>

        <div className="text-center mt-8">
          <Link href="/" className="text-emerald-600 hover:text-emerald-700 font-semibold">
            ← Back to Home
          </Link>
        </div>
      </main>

      <Footer />
    </>
  );
}
