import { GetServerSidePropsContext } from 'next';
import Head from 'next/head';
import { useVertical } from '../contexts/VerticalContext';
import { withVerticalSSR } from '../lib/verticalServerUtils';

/**
 * Demo page showing how to use the multi-domain routing system
 *
 * This page demonstrates:
 * 1. Server-side vertical detection with withVerticalSSR
 * 2. Client-side vertical access with useVertical hook
 * 3. Dynamic styling based on vertical brand colors
 * 4. Accessing vertical-specific data (categories, SEO, etc.)
 */

interface VerticalDemoProps {
  serverTime: string;
}

export default function VerticalDemo({ serverTime }: VerticalDemoProps) {
  const { vertical, isLoading } = useVertical();

  if (isLoading || !vertical) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl">Loading vertical configuration...</div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Vertical Demo - {vertical.seo.metaTitle}</title>
        <meta name="description" content={vertical.seo.metaDescription} />
      </Head>

      <div className="min-h-screen bg-gray-50 py-12 px-4">
        <div className="max-w-4xl mx-auto">
          {/* Header with dynamic branding */}
          <div
            className="rounded-lg shadow-lg p-8 mb-8 text-white"
            style={{ backgroundColor: vertical.info.brandColor }}
          >
            <h1 className="text-4xl font-bold mb-2">
              Multi-Domain Routing Demo
            </h1>
            <p className="text-xl opacity-90">
              Currently viewing: {vertical.info.name}
            </p>
          </div>

          {/* Basic Info Section */}
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-2xl font-bold mb-4">Basic Information</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-gray-600">Name:</p>
                <p className="font-semibold">{vertical.info.name}</p>
              </div>
              <div>
                <p className="text-gray-600">Slug:</p>
                <p className="font-semibold">{vertical.info.slug}</p>
              </div>
              <div>
                <p className="text-gray-600">Domain:</p>
                <p className="font-semibold">{vertical.info.domain}</p>
              </div>
              <div>
                <p className="text-gray-600">Brand Color:</p>
                <div className="flex items-center gap-2">
                  <div
                    className="w-6 h-6 rounded border"
                    style={{ backgroundColor: vertical.info.brandColor }}
                  />
                  <p className="font-semibold">{vertical.info.brandColor}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Categories Section */}
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-2xl font-bold mb-4">Categories</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {vertical.categories.map((category) => (
                <div
                  key={category.id}
                  className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start gap-3">
                    {category.icon && (
                      <div
                        className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold text-lg"
                        style={{ backgroundColor: vertical.info.brandColor }}
                      >
                        {category.icon.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg mb-1">
                        {category.name}
                      </h3>
                      <p className="text-gray-600 text-sm">
                        {category.description}
                      </p>
                      <span
                        className="inline-block mt-2 text-xs px-2 py-1 rounded"
                        style={{
                          backgroundColor: `${vertical.info.brandColor}20`,
                          color: vertical.info.brandColor,
                        }}
                      >
                        ID: {category.id}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* SEO Data Section */}
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-2xl font-bold mb-4">SEO Metadata</h2>
            <div className="space-y-3">
              <div>
                <p className="text-gray-600 text-sm">Meta Title:</p>
                <p className="font-semibold">{vertical.seo.metaTitle}</p>
              </div>
              <div>
                <p className="text-gray-600 text-sm">Meta Description:</p>
                <p className="text-gray-700">{vertical.seo.metaDescription}</p>
              </div>
              <div>
                <p className="text-gray-600 text-sm">Keywords:</p>
                <div className="flex flex-wrap gap-2 mt-1">
                  {vertical.seo.keywords.map((keyword) => (
                    <span
                      key={keyword}
                      className="text-xs px-2 py-1 bg-gray-100 rounded"
                    >
                      {keyword}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Valuation Multiples Section */}
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-2xl font-bold mb-4">Valuation Multiples</h2>
            <div className="grid grid-cols-3 gap-6">
              {/* Revenue */}
              <div>
                <p className="text-gray-600 text-sm mb-2">Revenue Multiple</p>
                <div className="space-y-1">
                  <p className="text-xs">
                    Min: <span className="font-semibold">{vertical.valuationMultiples.revenueMin}x</span>
                  </p>
                  <p className="text-xs">
                    Median: <span className="font-semibold">{vertical.valuationMultiples.revenueMedian}x</span>
                  </p>
                  <p className="text-xs">
                    Max: <span className="font-semibold">{vertical.valuationMultiples.revenueMax}x</span>
                  </p>
                </div>
              </div>

              {/* SDE */}
              <div>
                <p className="text-gray-600 text-sm mb-2">SDE Multiple</p>
                <div className="space-y-1">
                  <p className="text-xs">
                    Min: <span className="font-semibold">{vertical.valuationMultiples.sdeMin}x</span>
                  </p>
                  <p className="text-xs">
                    Median: <span className="font-semibold">{vertical.valuationMultiples.sdeMedian}x</span>
                  </p>
                  <p className="text-xs">
                    Max: <span className="font-semibold">{vertical.valuationMultiples.sdeMax}x</span>
                  </p>
                </div>
              </div>

              {/* EBITDA */}
              <div>
                <p className="text-gray-600 text-sm mb-2">EBITDA Multiple</p>
                <div className="space-y-1">
                  <p className="text-xs">
                    Min: <span className="font-semibold">{vertical.valuationMultiples.ebitdaMin}x</span>
                  </p>
                  <p className="text-xs">
                    Median: <span className="font-semibold">{vertical.valuationMultiples.ebitdaMedian}x</span>
                  </p>
                  <p className="text-xs">
                    Max: <span className="font-semibold">{vertical.valuationMultiples.ebitdaMax}x</span>
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Server Info */}
          <div className="bg-gray-100 rounded-lg p-6">
            <h2 className="text-2xl font-bold mb-4">Server Information</h2>
            <p className="text-gray-700">
              This page was rendered on the server at: <span className="font-mono font-semibold">{serverTime}</span>
            </p>
            <p className="text-sm text-gray-600 mt-2">
              The vertical was detected server-side using <code className="bg-white px-1 rounded">withVerticalSSR</code> helper.
            </p>
          </div>

          {/* Usage Example */}
          <div className="mt-8 bg-blue-50 border-l-4 border-blue-500 p-6">
            <h3 className="font-bold text-lg mb-2">How This Works</h3>
            <ul className="space-y-2 text-sm text-gray-700">
              <li><strong>1. Middleware:</strong> Detects the domain and injects vertical into request headers</li>
              <li><strong>2. Server-Side:</strong> Uses <code className="bg-white px-1 rounded">withVerticalSSR</code> to get vertical in getServerSideProps</li>
              <li><strong>3. Context Provider:</strong> Makes vertical available to all components via React Context</li>
              <li><strong>4. useVertical Hook:</strong> Access vertical data anywhere in your components</li>
            </ul>
          </div>
        </div>
      </div>
    </>
  );
}

/**
 * Server-side data fetching with automatic vertical injection
 */
export const getServerSideProps = withVerticalSSR(async (context, vertical) => {
  // The vertical parameter is automatically injected by withVerticalSSR
  // You can use it to fetch vertical-specific data

  return {
    props: {
      serverTime: new Date().toISOString(),
      // vertical is automatically added to props by withVerticalSSR
    },
  };
});
