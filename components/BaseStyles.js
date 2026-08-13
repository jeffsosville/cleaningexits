// components/BaseStyles.js
// Global tokens. Accent is injected per-vertical from siteConfig.

export default function BaseStyles({ accent = '#0F6B4F' }) {
  return (
    <style jsx global>{`
      @import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Inter:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500;600&display=swap');

      :root {
        --ink: #0e1a24;
        --paper: #ffffff;
        --wash: #eef2f1;
        --rule: #d5dedb;
        --muted: #5c6b72;
        --accent: ${accent};
        --hot: #c2451e;
        --display: 'Instrument Serif', Georgia, serif;
        --body: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
        --data: 'IBM Plex Mono', ui-monospace, Menlo, monospace;
        --measure: 68ch;
      }

      * { box-sizing: border-box; }

      html, body {
        margin: 0;
        padding: 0;
        background: var(--paper);
        color: var(--ink);
        font-family: var(--body);
        font-size: 17px;
        line-height: 1.6;
        -webkit-font-smoothing: antialiased;
      }

      a { color: var(--accent); text-decoration: none; }
      a:hover { text-decoration: underline; }
      a:focus-visible,
      button:focus-visible,
      input:focus-visible {
        outline: 2px solid var(--accent);
        outline-offset: 2px;
      }

      .wrap { max-width: 1080px; margin: 0 auto; padding: 0 24px; }
      .narrow { max-width: var(--measure); }

      h1, h2, h3 { font-family: var(--display); font-weight: 400; letter-spacing: -0.01em; }
      h1 { font-size: clamp(2.4rem, 6vw, 4rem); line-height: 1.04; margin: 0 0 20px; }
      h2 { font-size: clamp(1.7rem, 3.4vw, 2.4rem); line-height: 1.14; margin: 0 0 16px; }
      h3 { font-size: 1.2rem; margin: 0 0 8px; font-family: var(--body); font-weight: 600; }

      .eyebrow {
        font-family: var(--data);
        font-size: 0.7rem;
        letter-spacing: 0.14em;
        text-transform: uppercase;
        color: var(--muted);
        margin: 0 0 14px;
      }

      .lede { font-size: 1.18rem; color: var(--muted); max-width: var(--measure); }

      /* Numbers are the product. Tabular mono everywhere. */
      .num {
        font-family: var(--data);
        font-variant-numeric: tabular-nums;
        font-weight: 500;
        letter-spacing: -0.02em;
      }

      .sample {
        font-family: var(--data);
        font-size: 0.68rem;
        color: var(--muted);
        letter-spacing: 0.04em;
      }

      .rule { border: 0; border-top: 1px solid var(--rule); margin: 0; }

      section { padding: 64px 0; }
      section + section { border-top: 1px solid var(--rule); }

      @media (prefers-reduced-motion: reduce) {
        *, *::before, *::after {
          animation-duration: 0.01ms !important;
          transition-duration: 0.01ms !important;
        }
      }
    `}</style>
  );
}
