export async function getServerSideProps() {
  // Last 90 days
  const DAYS_90_MS = 90 * 24 * 60 * 60 * 1000;
  const days90agoISO = new Date(Date.now() - DAYS_90_MS).toISOString();

  // Broader cleaning-related keywords
  const includeOr = [
    "title.ilike.%cleaning%",
    "title.ilike.%janitorial%",
    "title.ilike.%maid%",
    "title.ilike.%carpet cleaning%",
    "title.ilike.%window cleaning%",
    "title.ilike.%pressure wash%",
    "title.ilike.%floor care%",
    "title.ilike.%sanitation%",
    "description.ilike.%cleaning service%",
    "description.ilike.%janitorial service%",
    "category.ilike.%cleaning%",
    "category.ilike.%janitorial%"
  ].join(",");

  const EXCLUDES = [
    "%dry clean%",
    "%insurance%",
    "%franchise fee%",
    "%restaurant%",
    "%pharmacy%",
    "%convenience store%",
    "%grocery%",
    "%bakery%",
    "%laundromat%",
    "%automotive%"
  ];

  // Build query with exclusions
  let q = supabase
    .from("listings")
    .select(
      "id, title, price, revenue, cash_flow, description, listing_url, image_url, city, state, scraped_at, category"
    )
    .eq("is_active", true)
    .or(includeOr)
    .gte("scraped_at", days90agoISO)
    .not("price", "is", null)
    .gte("price", 50000);

  for (const x of EXCLUDES) {
    q = q.not("title", "ilike", x);
  }

  // Single query - let PostgreSQL handle the prioritization
  // Order by: cash_flow first (nulls last), then revenue (nulls last), then price
  const { data, error } = await q
    .order("cash_flow", { ascending: false, nullsFirst: false })
    .order("revenue", { ascending: false, nullsFirst: false })
    .order("price", { ascending: false })
    .limit(10);

  const top10 = (data ?? []).map((r: any) => ({
    id: String(r.id),
    header: r.title ?? null,
    city: r.city ?? null,
    state: r.state ?? null,
    price: toNum(r.price),
    revenue: toNum(r.revenue),
    cashflow: toNum(r.cash_flow),
    ebitda: null,
    url: r.listing_url ?? null,
    picked_on: null,
    notes: r.description ?? null,
  }));

  return {
    props: {
      top10,
      kpis: null as KPI,
      errorAuto: error?.message || null,
    },
  };
}
