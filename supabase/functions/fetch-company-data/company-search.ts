type CompanyEntry = { ticker: string; title: string };
/** Ranking uses only the existing SEC ticker map. No financial or quote requests. */
export function searchCompanies(entries: CompanyEntry[], query: string, limit = 10) {
  const normalized = query.trim().toUpperCase().replace(/\s+/g, " ");
  if (!normalized || normalized.length > 100) return [];
  const symbol = normalized.replace(/\./g, "-");
  const words = normalized.split(" ");
  return entries.flatMap((entry) => {
    if (typeof entry?.ticker !== "string" || typeof entry?.title !== "string") return [];
    const ticker = entry.ticker.toUpperCase();
    const name = entry.title.toUpperCase();
    const shortName = name.replace(/(?:[ ,]+)(?:INCORPORATED|INC|CORPORATION|CORP|COMPANY|CO|LIMITED|LTD|PLC|AG|SE|SA)\.?$/, "").trim();
    const rank = ticker === symbol ? 0 : (name === normalized || shortName === normalized) ? 1 : ticker.startsWith(symbol) ? 2 :
      name.startsWith(normalized) ? 3 : words.every((word) => name.split(/[^A-Z0-9]+/).some((part) => part.startsWith(word))) ? 4 :
      name.includes(normalized) ? 5 : ticker.includes(symbol) ? 6 : -1;
    return rank < 0 ? [] : [{ rank, companyName: entry.title, ticker: entry.ticker, exchange: null }];
  }).sort((a, b) => a.rank - b.rank || a.companyName.localeCompare(b.companyName, "en") || a.ticker.localeCompare(b.ticker, "en"))
    .filter((item, index, all) => all.findIndex((other) => other.ticker === item.ticker) === index)
    .slice(0, Math.min(20, Math.max(1, limit)))
    .map(({ companyName, ticker, exchange }) => ({ companyName, ticker, exchange }));
}
