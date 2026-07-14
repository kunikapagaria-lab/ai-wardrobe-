export interface ProductMatch {
  image: string;
  shopUrl: string;
  title?: string;
}

export function fallbackShopUrl(itemName: string) {
  return `https://www.google.co.in/search?tbm=shop&gl=in&q=${encodeURIComponent(itemName)}`;
}

interface SerpApiShoppingResult {
  title?: string;
  thumbnail?: string;
  link?: string;
  product_link?: string;
}

// India-region shopping searches can take 10-60s+ on a cache miss (SerpApi does
// a live scrape for queries it hasn't seen before) — inherent to the free-tier
// API, not something we can speed up. Errors/timeouts are NOT swallowed here —
// callers decide whether to surface them (interactive search) or stay silent
// (best-effort background lookups).
async function rawSearch(query: string, timeoutMs: number): Promise<SerpApiShoppingResult[]> {
  const apiKey = process.env.SERPAPI_KEY;
  if (!apiKey) throw new Error("Product search isn't configured (missing SERPAPI_KEY)");

  const url = `https://serpapi.com/search.json?engine=google_shopping&q=${encodeURIComponent(query)}&google_domain=google.co.in&gl=in&api_key=${apiKey}`;
  let res: Response;
  try {
    res = await fetch(url, { signal: AbortSignal.timeout(timeoutMs) });
  } catch (err) {
    if (err instanceof Error && (err.name === "TimeoutError" || err.name === "AbortError")) {
      throw new Error("Search is taking longer than usual — try again in a moment");
    }
    throw err;
  }
  if (!res.ok) throw new Error(`SerpApi error ${res.status}`);

  const data = await res.json();
  return (data.shopping_results ?? []) as SerpApiShoppingResult[];
}

function toMatch(result: SerpApiShoppingResult): ProductMatch | null {
  const shopUrl = result.product_link ?? result.link;
  if (!result.thumbnail || !shopUrl) return null;
  return { image: result.thumbnail, shopUrl, title: result.title };
}

// Best-effort, non-blocking single lookup (used for background image prefetch
// on Shop suggestion cards) — stays silent on any failure, including timeout.
export async function findProduct(query: string): Promise<ProductMatch | null> {
  try {
    const results = await rawSearch(query, 15000);
    for (const r of results) {
      const match = toMatch(r);
      if (match) return match;
    }
    return null;
  } catch {
    return null;
  }
}

// Interactive lookup for the search-and-pick dialog — the user is actively
// waiting with a visible loading state, so it gets a longer timeout, and
// errors propagate so the caller can show a real message instead of a
// misleading "No results" for what was actually a timeout.
export async function findProducts(query: string, count = 12): Promise<ProductMatch[]> {
  const results = await rawSearch(query, 35000);
  const matches: ProductMatch[] = [];
  for (const r of results) {
    const match = toMatch(r);
    if (match) matches.push(match);
    if (matches.length >= count) break;
  }
  return matches;
}
