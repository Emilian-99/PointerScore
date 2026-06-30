/**
 * Prefilled public demo inputs.
 * Financial statement values are in millions. ROE is calculated from latest
 * attributable net income divided by average attributable equity.
 * Trailing P/E values use the market close from 2026-06-26.
 */
export const companies = {
  apple: {
    name: "Apple",
    classification: { de: "Technologie · Marktführer / sehr stark", en: "Technology · market leader / very strong" },
    qualityMetricDisplay: { de: "ca. 146–152 %", en: "approx. 146–152%" },
    scoreOverride: {
      categories: { future: 23, growth: 12, stability: 19, valuation: 6, quality: 20 },
      analysis: {
        de: {
          strengths: [
            "Sehr starke Marktposition, Ökosystem, Services, KI-Potenzial und hohe Markenstärke",
            "Sehr hohe Margen, enorme Cashflows und eine ausgezeichnete Bilanz",
            "Weltklasse-Management, hoher Burggraben und ausgezeichnete Kapitalrendite"
          ],
          potential: [
            "Umsatz und Gewinn wachsen solide, aber nur moderat",
            "Apple ist aktuell eher hoch bewertet"
          ]
        },
        en: {
          strengths: [
            "Very strong market position, ecosystem, services, AI potential and brand strength",
            "Very high margins, substantial cash flows and an excellent balance sheet",
            "World-class management, a strong moat and excellent returns on capital"
          ],
          potential: [
            "Revenue and profit are growing solidly, but only moderately",
            "Apple currently appears rather highly valued"
          ]
        }
      }
    },
    years: [2023, 2024, 2025],
    period: { de: "GJ 2023–2025", en: "FY 2023–2025" },
    balanceDate: "27.09.2025",
    peDate: "26.06.2026",
    sourceUrl: "https://www.apple.com/newsroom/pdfs/fy2025-q4/FY25_Q4_Consolidated_Financial_Statements.pdf",
    input: {
      industry: "luxury", marketPosition: "leader",
      revenue1: 383285, revenue2: 391035, revenue3: 416161,
      profit1: 96995, profit2: 93736, profit3: 112010,
      totalDebt: 98657, totalAssets: 359241,
      currentRevenue: 416161, currentProfit: 112010,
      peRatio: 34.3,
      qualityMetric: 149
    }
  },
  microsoft: {
    name: "Microsoft",
    years: [2023, 2024, 2025],
    period: { de: "GJ 2023–2025", en: "FY 2023–2025" },
    balanceDate: "30.06.2025",
    peDate: "26.06.2026",
    sourceUrl: "https://www.microsoft.com/investor/reports/ar25/index.html",
    input: {
      industry: "cloud", marketPosition: "leader",
      revenue1: 211915, revenue2: 245122, revenue3: 281724,
      profit1: 72361, profit2: 88136, profit3: 101832,
      totalDebt: 43151, totalAssets: 619003,
      currentRevenue: 281724, currentProfit: 101832,
      peRatio: 22.21,
      qualityMetric: (101832 / ((343479 + 268477) / 2)) * 100
    }
  },
  cocaCola: {
    name: "Coca-Cola",
    years: [2023, 2024, 2025],
    period: { de: "GJ 2023–2025", en: "FY 2023–2025" },
    balanceDate: "31.12.2025",
    peDate: "26.06.2026",
    sourceUrl: "https://investors.coca-colacompany.com/filings-reports/all-sec-filings/content/0001628280-26-010047/ko-20251231.htm",
    input: {
      industry: "consumer", marketPosition: "leader",
      revenue1: 45754, revenue2: 47061, revenue3: 47941,
      profit1: 10714, profit2: 10631, profit3: 13107,
      totalDebt: 45492, totalAssets: 104816,
      currentRevenue: 47941, currentProfit: 13107,
      peRatio: 25.98,
      qualityMetric: (13107 / ((32169 + 24856) / 2)) * 100
    }
  },
  bmw: {
    name: "BMW",
    years: [2023, 2024, 2025],
    period: { de: "GJ 2023–2025", en: "FY 2023–2025" },
    balanceDate: "31.12.2025",
    peDate: "26.06.2026",
    sourceUrl: "https://www.bmwgroup.com/en/report/2025/financial-statements/income-statement/index.html",
    input: {
      industry: "industry", marketPosition: "top",
      revenue1: 155498, revenue2: 142380, revenue3: 133453,
      profit1: 12165, profit2: 7678, profit3: 7451,
      totalDebt: 110469, totalAssets: 265967,
      currentRevenue: 133453, currentProfit: 7451,
      peRatio: 5.38,
      qualityMetric: (7294 / ((95697 + 92315) / 2)) * 100
    }
  },
  nvidia: {
    name: "NVIDIA",
    years: [2024, 2025, 2026],
    period: { de: "GJ 2024–2026", en: "FY 2024–2026" },
    balanceDate: "25.01.2026",
    peDate: "26.06.2026",
    sourceUrl: "https://investor.nvidia.com/news/press-release-details/2026/NVIDIA-Announces-Financial-Results-for-Fourth-Quarter-and-Fiscal-2026/",
    input: {
      industry: "semiconductor", marketPosition: "leader",
      revenue1: 60922, revenue2: 130497, revenue3: 215938,
      profit1: 29760, profit2: 72880, profit3: 120067,
      totalDebt: 8468, totalAssets: 206803,
      currentRevenue: 215938, currentProfit: 120067,
      peRatio: 29.48,
      qualityMetric: (120067 / ((157293 + 79327) / 2)) * 100
    }
  }
};
