import '../styles/globals.css';
import type { AppProps } from 'next/app';
import { VerticalProvider } from '../contexts/VerticalContext';
import Script from "next/script";
import { useRouter } from "next/router";
import { useEffect } from "react";

export default function App({ Component, pageProps }: AppProps) {
  const router = useRouter();
  const GA_ID = process.env.NEXT_PUBLIC_GA_ID;

  // Track route changes for SPA navigation
  useEffect(() => {
    if (!GA_ID) return;

    const handleRouteChange = (url: string) => {
      if (typeof window !== "undefined" && (window as any).gtag) {
        (window as any).gtag('config', GA_ID, {
          page_path: url,
        });
      }
    };

    router.events.on("routeChangeComplete", handleRouteChange);
    return () => router.events.off("routeChangeComplete", handleRouteChange);
  }, [router.events, GA_ID]);

  return (
    <>
      {/* Google Analytics */}
      {GA_ID && (
        <>
          <Script
            src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
            strategy="afterInteractive"
          />
          <Script id="ga-init" strategy="afterInteractive">
            {`
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', '${GA_ID}', {
                page_path: window.location.pathname,
              });
            `}
          </Script>
        </>
      )}

      <VerticalProvider initialVertical={pageProps.vertical}>
        <Component {...pageProps} />
      </VerticalProvider>
    </>
  );
}
