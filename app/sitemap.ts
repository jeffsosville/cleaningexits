import { MetadataRoute } from 'next'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://www.cleaningexits.com'
  
  // Static pages
  const staticPages = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 1,
    },
    {
      url: `${baseUrl}/top-10`,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 0.9,
    },
  ]

  // TODO: When Supabase is back up, fetch your listings
  // Example of how to add dynamic listings:
  /*
  const { data: listings } = await supabase
    .from('listings')
    .select('id, updated_at')
    .limit(1000)
  
  const listingPages = listings.map((listing) => ({
    url: `${baseUrl}/listings/${listing.id}`,
    lastModified: new Date(listing.updated_at),
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }))
  */

  // For now, return static pages
  // Add listingPages when Supabase is back: [...staticPages, ...listingPages]
  return staticPages
}
