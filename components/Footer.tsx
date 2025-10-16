import React from 'react';
import Link from 'next/link';

export default function Footer() {
  const footerSections = [
    {
      title: 'Browse',
      links: [
        { label: "Today's Listings", href: '/daily-cleaning' },
        { label: 'Full Index', href: '/cleaning-index' },
        { label: 'Subscribe', href: '/subscribe' },
      ],
    },
    {
      title: 'Sellers',
      links: [
        { label: 'Sell Your Business', href: '/sell' },
        { label: 'Resources', href: '/resources' },
      ],
    },
    {
      title: 'Company',
      links: [
        { label: 'About', href: '/about' },
        { label: 'Contact', href: '/contact' },
      ],
    },
    {
      title: 'Legal',
      links: [
        { label: 'Privacy Policy', href: '/privacy' },
        { label: 'Terms of Service', href: '/terms' },
      ],
    },
  ];

  return (
    <footer className="mt-16 border-t border-gray-200 bg-gray-50">
      <div className="mx-auto max-w-6xl px-4 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
          {footerSections.map((section) => (
            <div key={section.title}>
              <h3 className="font-bold text-gray-900 mb-3">{section.title}</h3>
              <ul className="space-y-2">
                {section.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-gray-600 hover:text-emerald-600 transition"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="pt-8 border-t border-gray-200 text-center">
          <p className="text-sm font-semibold text-gray-700 mb-2">
            Built for speed and signal. No fluff.
          </p>
          <p className="text-sm text-gray-500">
            © 2025 Cleaning Exits. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
