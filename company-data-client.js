const METRIC_LABELS = {
  revenue: "Umsatz",
  netIncome: "Gewinn",
  assets: "Gesamtvermögen",
  liabilities: "Gesamtschulden",
  equity: "Eigenkapital",
  cash: "Cash und Zahlungsmittel",
  longTermDebt: "Langfristige Schulden",
  currentAssets: "Umlaufvermögen",
  currentLiabilities: "Kurzfristige Verbindlichkeiten",
  operatingIncome: "Operatives Ergebnis",
  marketPrice: "Aktienkurs",
  peRatio: "KGV",
  roe: "ROE",
  roic: "ROIC",
  eps: "EPS",
  sharesOutstanding: "Aktien ausstehend"
};

const FORM_FIELDS = {
  companyName: "companyName",
  revenue1: "revenue1",
  revenue2: "revenue2",
  revenue3: "revenue3",
  profit1: "profit1",
  profit2: "profit2",
  profit3: "profit3",
  totalDebt: "totalDebt",
  totalAssets: "totalAssets",
  currentRevenue: "currentRevenue",
  currentProfit: "currentProfit",
  peRatio: "peRatio",
  qualityMetric: "qualityMetric"
};

function toMillions(value) {
  if (typeof value !== "number" || !Number.isFinite(value)) return null;
  return Math.round((value / 1_000_000) * 100) / 100;
}

function formatNumber(value, locale = "de-DE", options = {}) {
  if (typeof value !== "number" || !Number.isFinite(value)) return null;
  return new Intl.NumberFormat(locale, options).format(value);
}

async function normalizeError(error) {
  const context = error?.context;
  if (context && typeof context.json === "function") {
    try {
      const parsed = await context.json();
      if (parsed?.code) return parsed;
    } catch {
      // Some failed responses are not JSON.
    }
  }
  const raw = context?.body || error?.message || "";
  if (typeof raw === "object" && raw?.code) return raw;
  try {
    const parsed = JSON.parse(String(raw));
    if (parsed?.code) return parsed;
  } catch {
    // Supabase can return plain text for failed function calls.
  }
  return { code: error?.code || "company_data_failed", error: String(raw || "Company data could not be loaded") };
}

export async function fetchCompanyData(supabase, ticker) {
  const { data, error } = await supabase.functions.invoke("fetch-company-data", {
    body: { ticker }
  });
  if (error) throw await normalizeError(error);
  return data;
}

export function companyDataToPointerScoreInput(companyData) {
  const revenueHistory = Array.isArray(companyData?.annualHistory?.revenue) ? companyData.annualHistory.revenue : [];
  const profitHistory = Array.isArray(companyData?.annualHistory?.netIncome) ? companyData.annualHistory.netIncome : [];
  const values = {
    [FORM_FIELDS.companyName]: companyData?.companyName || "",
    moneyUnit: "Mio."
  };

  revenueHistory.slice(-3).forEach((item, index) => {
    const field = [FORM_FIELDS.revenue1, FORM_FIELDS.revenue2, FORM_FIELDS.revenue3][index];
    const value = toMillions(item?.value);
    if (field && value !== null) values[field] = value;
  });

  profitHistory.slice(-3).forEach((item, index) => {
    const field = [FORM_FIELDS.profit1, FORM_FIELDS.profit2, FORM_FIELDS.profit3][index];
    const value = toMillions(item?.value);
    if (field && value !== null) values[field] = value;
  });

  const totalDebt = toMillions(companyData?.longTermDebt ?? companyData?.liabilities);
  const totalAssets = toMillions(companyData?.assets);
  const currentRevenue = toMillions(companyData?.revenue);
  const currentProfit = toMillions(companyData?.netIncome);

  if (totalDebt !== null) values[FORM_FIELDS.totalDebt] = totalDebt;
  if (totalAssets !== null) values[FORM_FIELDS.totalAssets] = totalAssets;
  if (currentRevenue !== null) values[FORM_FIELDS.currentRevenue] = currentRevenue;
  if (currentProfit !== null) values[FORM_FIELDS.currentProfit] = currentProfit;
  if (typeof companyData?.peRatio === "number" && Number.isFinite(companyData.peRatio)) {
    values[FORM_FIELDS.peRatio] = Math.round(companyData.peRatio * 10) / 10;
  }
  if (typeof companyData?.roe === "number" && Number.isFinite(companyData.roe)) {
    values.qualityMetricType = "ROE";
    values[FORM_FIELDS.qualityMetric] = Math.round(companyData.roe * 10) / 10;
  } else if (typeof companyData?.roic === "number" && Number.isFinite(companyData.roic)) {
    values.qualityMetricType = "ROIC";
    values[FORM_FIELDS.qualityMetric] = Math.round(companyData.roic * 10) / 10;
  }
  return values;
}

export function formatCompanyDataMetric(key, value, locale = "de-DE") {
  if (value === null || value === undefined) return null;
  if (key === "marketPrice") return `${formatNumber(value, locale, { maximumFractionDigits: 2 })} USD`;
  if (key === "peRatio") return `${formatNumber(value, locale, { maximumFractionDigits: 1 })}x`;
  if (key === "roe" || key === "roic") return `${formatNumber(value, locale, { maximumFractionDigits: 1 })} %`;
  if (key === "eps") return `${formatNumber(value, locale, { maximumFractionDigits: 2 })} USD`;
  if (key === "sharesOutstanding") return `${formatNumber(value, locale, { maximumFractionDigits: 0 })} shares`;
  return `${formatNumber(value / 1_000_000, locale, { maximumFractionDigits: 1 })} Mio. USD`;
}

export function companyDataMetricLabels() {
  return { ...METRIC_LABELS };
}

export function availableCompanyDataFields(companyData) {
  return Object.keys(METRIC_LABELS).filter((key) => companyData?.[key] !== null && companyData?.[key] !== undefined);
}
