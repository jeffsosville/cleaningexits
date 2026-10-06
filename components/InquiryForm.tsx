import { useState } from 'react';

type Props = { mode: 'seller' | 'contact'; accent?: 'amber' | 'emerald' };

const ACCENTS = {
  amber: { btn: 'bg-amber-600 hover:bg-amber-700', ring: 'focus:ring-amber-500' },
  emerald: { btn: 'bg-emerald-600 hover:bg-emerald-700', ring: 'focus:ring-emerald-500' },
};

export default function InquiryForm({ mode, accent = 'emerald' }: Props) {
  const [state, setState] = useState<'idle' | 'sending' | 'done'>('idle');
  const [error, setError] = useState('');
  const a = ACCENTS[accent];
  const input = `w-full rounded-lg border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 ${a.ring}`;

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');
    setState('sending');
    const f = Object.fromEntries(new FormData(e.currentTarget).entries());
    try {
      const res = await fetch('/api/inquiry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...f, kind: mode, source_url: window.location.href }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j.error || 'Something went wrong. Please try again.');
      setState('done');
    } catch (err: any) {
      setError(err.message);
      setState('idle');
    }
  }

  if (state === 'done') {
    return (
      <div className="rounded-lg border bg-white p-6 text-center">
        <h3 className="text-xl font-bold mb-2">Thanks — we've got it.</h3>
        <p className="text-gray-600">We'll be in touch within one business day.</p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4 text-left">
      <input type="text" name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden="true" />
      <div className="grid gap-4 sm:grid-cols-2">
        <input name="name" required placeholder="Your name" className={input} />
        <input name="email" type="email" required placeholder="Email" className={input} />
        <input name="phone" type="tel" placeholder="Phone" className={input} />
        {mode === 'seller' ? (
          <input name="business" placeholder="Business name" className={input} />
        ) : (
          <input name="business" placeholder="Company (optional)" className={input} />
        )}
        {mode === 'seller' && (
          <>
            <input name="location" placeholder="City / state" className={input} />
            <input name="revenue" placeholder="Approx. annual revenue" className={input} />
          </>
        )}
      </div>
      <textarea
        name="message"
        rows={4}
        required={mode === 'contact'}
        placeholder={mode === 'seller' ? 'Anything else we should know? (optional)' : 'How can we help?'}
        className={input}
      />
      {error && <p className="text-red-600 text-sm">{error}</p>}
      <button
        type="submit"
        disabled={state === 'sending'}
        className={`w-full sm:w-auto px-8 py-4 text-white font-bold text-lg rounded-lg transition disabled:opacity-60 ${a.btn}`}
      >
        {state === 'sending' ? 'Sending…' : mode === 'seller' ? 'Get My Free Valuation' : 'Send Message'}
      </button>
    </form>
  );
}
