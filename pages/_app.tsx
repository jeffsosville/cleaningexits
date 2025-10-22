import '../styles/globals.css';
import type { AppProps } from 'next/app';
import { VerticalProvider } from '../contexts/VerticalContext';

/**
 * Main App Component
 *
 * Wraps the entire application with the VerticalProvider to make
 * vertical configuration available to all pages and components.
 *
 * The vertical context is automatically detected based on the incoming
 * domain and can be accessed anywhere in the app using the useVertical() hook.
 */
export default function App({ Component, pageProps }: AppProps) {
  return (
    <VerticalProvider initialVertical={pageProps.vertical}>
      <Component {...pageProps} />
    </VerticalProvider>
  );
}