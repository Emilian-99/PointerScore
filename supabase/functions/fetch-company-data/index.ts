const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Content-Type": "application/json"
};

const SEC_USER_AGENT = Deno.env.get("SEC_USER_AGENT") ||
  "PointerScore Company Data Integration/1.0 (pointerscore@outlook.com)";
const SEC_CONTACT_EMAIL = Deno.env.get("SEC_CONTACT_EMAIL") || "pointerscore@outlook.com";
const TICKER_MAPPING_URL = "https://www.sec.gov/files/company_tickers.json";
const COMPANY_FACTS_URL = "https://data.sec.gov/api/xbrl/companyfacts";
const STOOQ_QUOTE_URL = "https://stooq.com/q/l/";
const CACHE_TTL_MS = 6 * 60 * 60 * 1000;

type SecTickerEntry = { cik_str: number; ticker: string; title: string };
type SecTickerMap = Record<string, SecTickerEntry>;
type SecFact = {
  val?: number;
  form?: string;
  fy?: number;
  fp?: string;
  start?: string;
  end?: string;
  filed?: string;
  accn?: string;
  frame?: string;
};
type CompanyFacts = {
  cik?: number;
  entityName?: string;
  facts?: Record<string, Record<string, { label?: string; description?: string; units?: Record<string, SecFact[]> }>>;
};
type MetricConfig = {
  namespaces?: string[];
  concepts: string[];
  units: string[];
};
type NormalizedMetric = {
  value: number | null;
  metadata: Record<string, string | number | null> | null;
};
type MarketPrice = {
  value: number | null;
  metadata: Record<string, string | number | null> | null;
};

let tickerMapCache: { expiresAt: number; data: SecTickerMap } | null = null;

const METRICS: Record<string, MetricConfig> = {
  revenue: {
    units: ["USD"],
    concepts: [
      "RevenueFromContractWithCustomerExcludingAssessedTax",
      "Revenues",
      "SalesRevenueNet",
      "SalesRevenueGoodsNet",
      "SalesRevenueServicesNet"
    ]
  },
  netIncome: {
    units: ["USD"],
    concepts: ["NetIncomeLoss", "ProfitLoss", "IncomeLossFromContinuingOperationsIncludingPortionAttributableToNoncontrollingInterest"]
  },
  assets: {
    units: ["USD"],
    concepts: ["Assets"]
  },
  liabilities: {
    units: ["USD"],
    concepts: ["Liabilities"]
  },
  equity: {
    units: ["USD"],
    concepts: [
      "StockholdersEquity",
      "StockholdersEquityIncludingPortionAttributableToNoncontrollingInterest",
      "PartnersCapital"
    ]
  },
  cash: {
    units: ["USD"],
    concepts: [
      "CashAndCashEquivalentsAtCarryingValue",
      "CashCashEquivalentsRestrictedCashAndRestrictedCashEquivalents",
      "Cash"
    ]
  },
  longTermDebt: {
    units: ["USD"],
    concepts: [
      "LongTermDebtAndFinanceLeaseObligationsNoncurrent",
      "LongTermDebtAndFinanceLeaseObligations",
      "LongTermDebtNoncurrent",
      "LongTermDebt",
      "LongTermBorrowings"
    ]
  },
  currentAssets: {
    units: ["USD"],
    concepts: ["AssetsCurrent"]
  },
  currentLiabilities: {
    units: ["USD"],
    concepts: ["LiabilitiesCurrent"]
  },
  operatingIncome: {
    units: ["USD"],
    concepts: ["OperatingIncomeLoss", "IncomeLossFromContinuingOperationsBeforeIncomeTaxesExtraordinaryItemsNoncontrollingInterest"]
  },
  eps: {
    units: ["USD/shares"],
    concepts: ["EarningsPerShareDiluted", "EarningsPerShareBasic", "IncomeLossFromContinuingOperationsPerDilutedShare"]
  },
  sharesOutstanding: {
    namespaces: ["dei", "us-gaap"],
    units: ["shares"],
    concepts: [
      "EntityCommonStockSharesOutstanding",
      "WeightedAverageNumberOfDilutedSharesOutstanding",
      "WeightedAverageNumberOfSharesOutstandingBasic"
    ]
  }
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: CORS_HEADERS });
}

function normalizeTicker(value: unknown) {
  return String(value ?? "").trim().toUpperCase().replace(".", "-");
}

function cik10(cik: number) {
  return String(cik).padStart(10, "0");
}

function isTickerValid(ticker: string) {
  return /^[A-Z0-9-]{1,12}$/.test(ticker);
}

function dateValue(value?: string) {
  const parsed = value ? Date.parse(value) : 0;
  return Number.isFinite(parsed) ? parsed : 0;
}

function fiscalYearValue(fact: SecFact) {
  return Number.isFinite(Number(fact.fy)) ? Number(fact.fy) : 0;
}

function durationDays(fact: SecFact) {
  if (!fact.start || !fact.end) return 0;
  return Math.round((dateValue(fact.end) - dateValue(fact.start)) / 86_400_000);
}

function isAnnualFact(fact: SecFact) {
  const form = String(fact.form || "").toUpperCase();
  return (form === "10-K" || form === "10-K/A") && (fact.fp === "FY" || durationDays(fact) >= 330);
}

function isQuarterFact(fact: SecFact) {
  const form = String(fact.form || "").toUpperCase();
  return (form === "10-Q" || form === "10-Q/A") && fact.fp !== "FY";
}

function sortLatestFirst(a: SecFact, b: SecFact) {
  return fiscalYearValue(b) - fiscalYearValue(a) ||
    dateValue(b.end) - dateValue(a.end) ||
    dateValue(b.filed) - dateValue(a.filed);
}

async function verifyUser(request: Request) {
  const authorization = request.headers.get("Authorization");
  if (!authorization?.startsWith("Bearer ")) return null;

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");
  if (!supabaseUrl || !supabaseAnonKey) return { id: "verified-by-edge-gateway" };

  const response = await fetch(`${supabaseUrl}/auth/v1/user`, {
    headers: { Authorization: authorization, apikey: supabaseAnonKey }
  });
  if (!response.ok) return null;
  return await response.json();
}

async function secJson<T>(url: string): Promise<T> {
  const response = await fetch(url, {
    headers: {
      "User-Agent": SEC_USER_AGENT,
      "From": SEC_CONTACT_EMAIL,
      "Accept": "application/json",
      "Accept-Encoding": "gzip, deflate"
    }
  });

  if (response.status === 404) throw Object.assign(new Error("SEC resource not found"), { code: "sec_not_found" });
  if (response.status === 429 || response.status >= 500) throw Object.assign(new Error("SEC unavailable"), { code: "sec_unavailable" });
  if (!response.ok) throw Object.assign(new Error(`SEC request failed: ${response.status}`), { code: "sec_unavailable" });
  return await response.json();
}

async function stooqLatestClose(ticker: string): Promise<MarketPrice> {
  const stooqTicker = `${ticker.toLowerCase().replace("-", ".")}.us`;
  const url = `${STOOQ_QUOTE_URL}?s=${encodeURIComponent(stooqTicker)}&f=sd2t2ohlcv&h&e=csv`;
  const response = await fetch(url, {
    headers: {
      "User-Agent": SEC_USER_AGENT,
      "From": SEC_CONTACT_EMAIL,
      "Accept": "text/csv"
    }
  });
  if (!response.ok) return { value: null, metadata: null };

  const text = await response.text();
  const [, row] = text.trim().split(/\r?\n/);
  if (!row || /N\/D/i.test(row)) return { value: null, metadata: null };

  const columns = row.split(",");
  const close = Number(columns[6]);
  if (!Number.isFinite(close) || close <= 0) return { value: null, metadata: null };

  return {
    value: close,
    metadata: {
      source: "Stooq",
      ticker: stooqTicker.toUpperCase(),
      priceDate: columns[1] || null,
      priceTime: columns[2] || null,
      currency: "USD"
    }
  };
}

async function getTickerMap() {
  if (tickerMapCache && tickerMapCache.expiresAt > Date.now()) return tickerMapCache.data;
  const data = await secJson<SecTickerMap>(TICKER_MAPPING_URL);
  tickerMapCache = { data, expiresAt: Date.now() + CACHE_TTL_MS };
  return data;
}

async function resolveTicker(ticker: string) {
  const map = await getTickerMap();
  return Object.values(map).find((entry) => entry.ticker.toUpperCase() === ticker) || null;
}

function factsForConcept(companyFacts: CompanyFacts, config: MetricConfig, concept: string, conceptRank = 0) {
  const namespaces = config.namespaces || ["us-gaap"];
  const matches: Array<SecFact & { concept: string; taxonomy: string; unit: string; conceptRank: number }> = [];
  for (const namespace of namespaces) {
    const conceptData = companyFacts.facts?.[namespace]?.[concept];
    if (!conceptData?.units) continue;
    for (const unit of config.units) {
      const unitFacts = conceptData.units[unit];
      if (!Array.isArray(unitFacts)) continue;
      for (const fact of unitFacts) {
        if (typeof fact.val !== "number" || !Number.isFinite(fact.val)) continue;
        matches.push({ ...fact, concept, taxonomy: namespace, unit, conceptRank });
      }
    }
  }
  return matches;
}

function factsForMetric(companyFacts: CompanyFacts, config: MetricConfig) {
  return config.concepts.flatMap((concept, index) => factsForConcept(companyFacts, config, concept, index));
}

function sortBestFact(a: SecFact & { conceptRank?: number }, b: SecFact & { conceptRank?: number }) {
  return sortLatestFirst(a, b) || (a.conceptRank || 0) - (b.conceptRank || 0);
}

function metadata(fact: (SecFact & { concept: string; taxonomy: string; unit: string }) | undefined) {
  if (!fact) return null;
  return {
    concept: fact.concept,
    taxonomy: fact.taxonomy,
    unit: fact.unit,
    form: fact.form || null,
    fiscalYear: fact.fy || null,
    fiscalPeriod: fact.fp || null,
    periodEndDate: fact.end || null,
    filingDate: fact.filed || null,
    accessionNumber: fact.accn || null,
    frame: fact.frame || null
  };
}

function selectMetric(companyFacts: CompanyFacts, config: MetricConfig, mode: "annual" | "quarterly" = "annual"): NormalizedMetric {
  const facts = factsForMetric(companyFacts, config);
  if (!facts.length) return { value: null, metadata: null };
  const preferred = facts
    .filter(mode === "annual" ? isAnnualFact : isQuarterFact)
    .sort(sortBestFact)[0];
  const fallback = facts.slice().sort(sortBestFact)[0];
  const selected = preferred || fallback;
  return { value: selected?.val ?? null, metadata: metadata(selected) };
}

function annualHistory(companyFacts: CompanyFacts, config: MetricConfig, count = 3) {
  const annualFacts = factsForMetric(companyFacts, config).filter(isAnnualFact);
  if (!annualFacts.length) return [];

  const grouped = new Map<string, SecFact & { concept: string; taxonomy: string; unit: string; conceptRank: number }>();
  for (const fact of annualFacts) {
    const key = `${fact.fy || ""}-${fact.end || ""}`;
    const existing = grouped.get(key);
    if (!existing || sortBestFact(fact, existing) < 0) grouped.set(key, fact);
  }

  return Array.from(grouped.values())
    .sort(sortBestFact)
    .slice(0, count)
    .reverse()
    .map((fact) => ({ value: fact.val ?? null, metadata: metadata(fact) }));
}

function periodFrom(metrics: Record<string, NormalizedMetric>) {
  const first = Object.values(metrics).find((metric) => metric.metadata?.fiscalYear);
  return first?.metadata?.fiscalYear ? `FY${first.metadata.fiscalYear}` : null;
}

function percentRatio(numerator: number | null, denominator: number | null) {
  if (typeof numerator !== "number" || typeof denominator !== "number") return null;
  if (!Number.isFinite(numerator) || !Number.isFinite(denominator) || denominator <= 0) return null;
  return (numerator / denominator) * 100;
}

function priceEarningsRatio(price: number | null, eps: number | null) {
  if (typeof price !== "number" || typeof eps !== "number") return null;
  if (!Number.isFinite(price) || !Number.isFinite(eps) || price <= 0 || eps <= 0) return null;
  return price / eps;
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: CORS_HEADERS });
  if (request.method !== "POST") return json({ error: "Method not allowed", code: "method_not_allowed" }, 405);

  const user = await verifyUser(request);
  if (!user) return json({ error: "Authentication required", code: "authentication_required" }, 401);

  let body: { ticker?: string };
  try {
    body = await request.json();
  } catch {
    return json({ error: "Invalid JSON body", code: "invalid_json" }, 400);
  }

  const ticker = normalizeTicker(body.ticker);
  if (!isTickerValid(ticker)) return json({ error: "Ticker not found", code: "ticker_not_found" }, 404);

  try {
    const tickerEntry = await resolveTicker(ticker);
    if (!tickerEntry) return json({ error: "Ticker not found", code: "ticker_not_found" }, 404);

    const cik = cik10(tickerEntry.cik_str);
    const companyFacts = await secJson<CompanyFacts>(`${COMPANY_FACTS_URL}/CIK${cik}.json`);
    if (!companyFacts.facts?.["us-gaap"]) {
      return json({ error: "Company not supported", code: "company_not_supported" }, 422);
    }

    const metricResults = Object.fromEntries(
      Object.entries(METRICS).map(([key, config]) => [key, selectMetric(companyFacts, config, "annual")])
    ) as Record<string, NormalizedMetric>;
    const quarterlyResults = Object.fromEntries(
      Object.entries(METRICS).map(([key, config]) => [key, selectMetric(companyFacts, config, "quarterly")])
    ) as Record<string, NormalizedMetric>;
    const marketPrice = await stooqLatestClose(ticker).catch(() => ({ value: null, metadata: null }));
    const peRatio = priceEarningsRatio(marketPrice.value, metricResults.eps.value);
    const roe = percentRatio(metricResults.netIncome.value, metricResults.equity.value);
    const investedCapital = typeof metricResults.equity.value === "number" && typeof metricResults.longTermDebt.value === "number"
      ? metricResults.equity.value + metricResults.longTermDebt.value - (metricResults.cash.value || 0)
      : null;
    const roic = percentRatio(metricResults.operatingIncome.value, investedCapital);

    const unavailableMetrics = Object.entries(metricResults)
      .filter(([, metric]) => metric.value === null)
      .map(([key]) => key)
      .concat([
        peRatio === null ? "peRatio" : "",
        roe === null ? "roe" : "",
        roic === null ? "roic" : ""
      ].filter(Boolean));

    return json({
      ticker,
      cik,
      companyName: companyFacts.entityName || tickerEntry.title,
      source: marketPrice.value ? "SEC EDGAR + Stooq" : "SEC EDGAR",
      period: periodFrom(metricResults),
      revenue: metricResults.revenue.value,
      netIncome: metricResults.netIncome.value,
      assets: metricResults.assets.value,
      liabilities: metricResults.liabilities.value,
      equity: metricResults.equity.value,
      cash: metricResults.cash.value,
      longTermDebt: metricResults.longTermDebt.value,
      currentAssets: metricResults.currentAssets.value,
      currentLiabilities: metricResults.currentLiabilities.value,
      operatingIncome: metricResults.operatingIncome.value,
      eps: metricResults.eps.value,
      sharesOutstanding: metricResults.sharesOutstanding.value,
      marketPrice: marketPrice.value,
      peRatio,
      roe,
      roic,
      metadata: {
        ...Object.fromEntries(Object.entries(metricResults).map(([key, metric]) => [key, metric.metadata])),
        marketPrice: marketPrice.metadata,
        peRatio: peRatio === null ? null : {
          source: "Stooq + SEC EDGAR",
          formula: "Aktienkurs / EPS",
          price: marketPrice.value,
          eps: metricResults.eps.value,
          priceDate: marketPrice.metadata?.priceDate || null,
          epsFiscalYear: metricResults.eps.metadata?.fiscalYear || null
        },
        roe: roe === null ? null : {
          source: "SEC EDGAR",
          formula: "Gewinn / Eigenkapital",
          fiscalYear: metricResults.netIncome.metadata?.fiscalYear || metricResults.equity.metadata?.fiscalYear || null,
          periodEndDate: metricResults.netIncome.metadata?.periodEndDate || metricResults.equity.metadata?.periodEndDate || null
        },
        roic: roic === null ? null : {
          source: "SEC EDGAR",
          formula: "Operatives Ergebnis / (Eigenkapital + langfristige Schulden - Cash)",
          fiscalYear: metricResults.operatingIncome.metadata?.fiscalYear || null,
          periodEndDate: metricResults.operatingIncome.metadata?.periodEndDate || null
        }
      },
      annualHistory: {
        revenue: annualHistory(companyFacts, METRICS.revenue),
        netIncome: annualHistory(companyFacts, METRICS.netIncome)
      },
      recentQuarter: {
        period: periodFrom(quarterlyResults),
        revenue: quarterlyResults.revenue.value,
        netIncome: quarterlyResults.netIncome.value,
        assets: quarterlyResults.assets.value,
        liabilities: quarterlyResults.liabilities.value,
        metadata: {
          revenue: quarterlyResults.revenue.metadata,
          netIncome: quarterlyResults.netIncome.metadata,
          assets: quarterlyResults.assets.metadata,
          liabilities: quarterlyResults.liabilities.metadata
        }
      },
      unavailableMetrics
    });
  } catch (error) {
    const code = (error as { code?: string }).code || "sec_unavailable";
    if (code === "sec_unavailable") return json({ error: "SEC unavailable", code }, 503);
    if (code === "sec_not_found") return json({ error: "Company not supported", code: "company_not_supported" }, 422);
    console.error("fetch-company-data failed", error);
    return json({ error: "Company data could not be loaded", code: "company_data_failed" }, 500);
  }
});
