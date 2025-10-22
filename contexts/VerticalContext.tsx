import React, { createContext, useContext, useEffect, useState } from 'react';
import { VerticalConfig } from '../config/types';
import { getCurrentVerticalClient } from '../config/verticals/utils';

/**
 * Context for accessing vertical configuration throughout the app
 */
interface VerticalContextType {
  vertical: VerticalConfig | null;
  isLoading: boolean;
}

const VerticalContext = createContext<VerticalContextType | undefined>(undefined);

/**
 * Props for VerticalProvider
 */
interface VerticalProviderProps {
  children: React.ReactNode;
  initialVertical?: VerticalConfig;
}

/**
 * VerticalProvider Component
 *
 * Provides vertical configuration to all child components
 * Automatically detects the current vertical based on the hostname
 *
 * @example
 * ```tsx
 * // In _app.tsx
 * <VerticalProvider>
 *   <Component {...pageProps} />
 * </VerticalProvider>
 * ```
 */
export function VerticalProvider({ children, initialVertical }: VerticalProviderProps) {
  const [vertical, setVertical] = useState<VerticalConfig | null>(initialVertical || null);
  const [isLoading, setIsLoading] = useState(!initialVertical);

  useEffect(() => {
    // Only run on client-side
    if (typeof window !== 'undefined' && !vertical) {
      try {
        const currentVertical = getCurrentVerticalClient();
        setVertical(currentVertical);
      } catch (error) {
        console.error('Error loading vertical configuration:', error);
      } finally {
        setIsLoading(false);
      }
    }
  }, [vertical]);

  return (
    <VerticalContext.Provider value={{ vertical, isLoading }}>
      {children}
    </VerticalContext.Provider>
  );
}

/**
 * Custom hook to access vertical configuration
 *
 * @returns The current vertical configuration and loading state
 * @throws Error if used outside of VerticalProvider
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { vertical, isLoading } = useVertical();
 *
 *   if (isLoading) return <div>Loading...</div>;
 *
 *   return (
 *     <div style={{ color: vertical.info.brandColor }}>
 *       <h1>{vertical.info.name}</h1>
 *       <p>Domain: {vertical.info.domain}</p>
 *     </div>
 *   );
 * }
 * ```
 */
export function useVertical(): VerticalContextType {
  const context = useContext(VerticalContext);

  if (context === undefined) {
    throw new Error('useVertical must be used within a VerticalProvider');
  }

  return context;
}

/**
 * Higher-order component to inject vertical configuration as props
 *
 * @param Component - The component to wrap
 * @returns A new component with vertical injected as a prop
 *
 * @example
 * ```tsx
 * interface MyComponentProps {
 *   vertical: VerticalConfig;
 * }
 *
 * function MyComponent({ vertical }: MyComponentProps) {
 *   return <div>{vertical.info.name}</div>;
 * }
 *
 * export default withVertical(MyComponent);
 * ```
 */
export function withVertical<P extends { vertical: VerticalConfig }>(
  Component: React.ComponentType<P>
) {
  return function WrappedComponent(props: Omit<P, 'vertical'>) {
    const { vertical } = useVertical();

    if (!vertical) {
      return null;
    }

    return <Component {...(props as P)} vertical={vertical} />;
  };
}
