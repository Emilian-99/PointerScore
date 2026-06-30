/** PointerScore V1.2 calculation engine – independent of the UI. */
export const INDUSTRIES=[
 {value:"ai",label:"Künstliche Intelligenz",points:10},{value:"semiconductor",label:"Halbleiter",points:9},
 {value:"cybersecurity",label:"Cybersecurity",points:9},{value:"cloud",label:"Cloud / Software",points:9},
 {value:"payments",label:"Zahlungsdienstleister",points:9},{value:"medtech",label:"Medizintechnik",points:8},
 {value:"health",label:"Pharma / Gesundheit",points:8},{value:"renewables",label:"Erneuerbare Energien",points:8},
 {value:"luxury",label:"Luxus / starke Marken",points:7},{value:"finance",label:"Vermögensverwaltung / Finanzplattformen",points:7},
 {value:"industry",label:"Industrie",points:6},{value:"consumer",label:"Konsumgüter / Lebensmittel / Getränke",points:5},
 {value:"utilities",label:"Versorger",points:4},{value:"tobacco",label:"Tabak",points:2}
];
export const MARKET_POSITIONS=[
 {value:"leader",label:"Klarer Marktführer",points:15},{value:"top",label:"Einer der größten Anbieter",points:12},
 {value:"established",label:"Etabliertes Unternehmen",points:9},{value:"small",label:"Kleiner Wettbewerber",points:5},
 {value:"new",label:"Neuer oder sehr kleiner Anbieter",points:2}
];

/* The public V1.2 document names qualitative tiers. These values make the
   tier-to-score conversion deterministic and reproduce its sample (ca. 80+). */
const SCORE_TABLES={
 revenueGrowth:[12,10,9,8,6,4,2,0],profitGrowth:[13,11,10,9,7,5,2,0],
 debtRatio:[10,9,8,7,6,5,3,0],netMargin:[10,9,8,7,6,5,2,0],
 peRatio:[10,9,8,7,6,4,2,0],quality:[20,17,14,10,7,3,0]
};
const pick=(value,rules,fallback=0)=>{const index=rules.findIndex(test=>test(value));return index===-1?fallback:index};

export function parseGermanNumber(value){
 if(typeof value==="number")return Number.isFinite(value)?value:NaN;
 const clean=String(value??"").trim().replace(/\s/g,"");if(!clean)return NaN;
 const comma=clean.lastIndexOf(","),dot=clean.lastIndexOf(".");let normalized=clean;
 if(comma>dot)normalized=clean.replace(/\./g,"").replace(",",".");
 else if(dot>comma&&comma!==-1)normalized=clean.replace(/,/g,"");
 else if(comma!==-1)normalized=clean.replace(",",".");
 else if(/^-?\d{1,3}(\.\d{3})+$/.test(clean))normalized=clean.replace(/\./g,"");
 return Number(normalized);
}
export function growthRate(previous,current){
 if(!Number.isFinite(previous)||!Number.isFinite(current)||previous===0)return null;
 return((current-previous)/previous)*100;
}
export function validateInputs(input){
 const errors={};
 if(!INDUSTRIES.some(item=>item.value===input.industry))errors.industry="Bitte wähle eine Branche aus.";
 if(!MARKET_POSITIONS.some(item=>item.value===input.marketPosition))errors.marketPosition="Bitte wähle die Marktposition aus.";
 const required=["revenue1","revenue2","revenue3","profit1","profit2","profit3","totalDebt","totalAssets","currentRevenue","currentProfit","peRatio","qualityMetric"];
 required.forEach(field=>{if(!Number.isFinite(input[field]))errors[field]="Bitte gib eine gültige Zahl ein."});
 ["revenue1","revenue2","revenue3","totalAssets","currentRevenue"].forEach(field=>{if(Number.isFinite(input[field])&&input[field]<=0)errors[field]="Der Wert muss größer als 0 sein."});
 if(Number.isFinite(input.totalDebt)&&input.totalDebt<0)errors.totalDebt="Schulden können hier nicht negativ sein.";
 return errors;
}

export function buildAutomaticAnalysis(input,metrics,categories){
 const strengths=[],potential=[];
 const market=MARKET_POSITIONS.find(item=>item.value===input.marketPosition);
 if(metrics.averageRevenueGrowth>=15)strengths.push("Starkes Umsatzwachstum");
 else if(metrics.averageRevenueGrowth>=5)strengths.push("Solides Umsatzwachstum");
 else potential.push(metrics.averageRevenueGrowth<0?"Rückläufige Umsatzentwicklung":"Umsatzwachstum ausbaufähig");
 if(metrics.profitGrowthMeaningful&&metrics.averageProfitGrowth>=15)strengths.push("Dynamisches Gewinnwachstum");
 else if(!metrics.profitGrowthMeaningful)potential.push("Gewinnwachstum derzeit nicht sinnvoll bewertbar");
 else if(metrics.averageProfitGrowth<5)potential.push("Gewinnentwicklung mit Verbesserungspotenzial");
 if(metrics.netMargin>=20)strengths.push("Hohe Profitabilität");
 else if(metrics.netMargin>=10)strengths.push("Solide Profitabilität");
 else potential.push(metrics.netMargin<0?"Aktuell negative Nettomarge":"Nettomarge unter 10 %");
 if(metrics.debtRatio<30)strengths.push("Solide Bilanz");
 else if(metrics.debtRatio>=50)potential.push("Erhöhte Schuldenquote");
 if(input.peRatio>0&&input.peRatio<25)strengths.push("Moderate Bewertung nach KGV");
 else if(input.peRatio>=35)potential.unshift("Bewertung relativ hoch");
 else if(input.peRatio<=0)potential.unshift("KGV nicht sinnvoll interpretierbar");
 if(input.qualityMetric>=20)strengths.push("Hohe Kapitaleffizienz");
 else if(input.qualityMetric<10)potential.push("Kapitaleffizienz ausbaufähig");
 if(market.points>=12)strengths.unshift("Starke Marktposition");
 else if(market.points<=9)potential.unshift("Marktposition mit Ausbaupotenzial");
 if(!strengths.length){const best=[...categories].sort((a,b)=>(b.score/b.max)-(a.score/a.max))[0];strengths.push(best.label+" ist die stärkste Kategorie")}
 if(!potential.length)potential.push("Keine deutliche Schwäche im gewählten Datenbild");
 return{strengths:strengths.slice(0,5),potential:potential.slice(0,5)};
}

export function calculatePointerScore(input){
 const errors=validateInputs(input);if(Object.keys(errors).length)return{ok:false,errors};
 const revenueGrowth12=growthRate(input.revenue1,input.revenue2);
 const revenueGrowth23=growthRate(input.revenue2,input.revenue3);
 const averageRevenueGrowth=(revenueGrowth12+revenueGrowth23)/2;
 const profitGrowthMeaningful=input.profit1>0&&input.profit2>0&&input.profit3>0;
 const profitGrowth12=profitGrowthMeaningful?growthRate(input.profit1,input.profit2):null;
 const profitGrowth23=profitGrowthMeaningful?growthRate(input.profit2,input.profit3):null;
 const averageProfitGrowth=profitGrowthMeaningful?(profitGrowth12+profitGrowth23)/2:null;
 const debtRatio=(input.totalDebt/input.totalAssets)*100;
 const netMargin=(input.currentProfit/input.currentRevenue)*100;
 const industryPoints=INDUSTRIES.find(item=>item.value===input.industry).points;
 const marketPoints=MARKET_POSITIONS.find(item=>item.value===input.marketPosition).points;
 const growthRules=[v=>v>=30,v=>v>=25,v=>v>=20,v=>v>=15,v=>v>=10,v=>v>=5,v=>v>=0,v=>v<0];
 const revenuePoints=SCORE_TABLES.revenueGrowth[pick(averageRevenueGrowth,growthRules)];
 const profitPoints=profitGrowthMeaningful?SCORE_TABLES.profitGrowth[pick(averageProfitGrowth,growthRules)]:0;
 const debtPoints=SCORE_TABLES.debtRatio[pick(debtRatio,[v=>v<10,v=>v<20,v=>v<30,v=>v<40,v=>v<50,v=>v<60,v=>v<70,v=>v>=70])];
 const marginPoints=SCORE_TABLES.netMargin[pick(netMargin,[v=>v>30,v=>v>=25,v=>v>=20,v=>v>=15,v=>v>=10,v=>v>=5,v=>v>=0,v=>v<0])];
 const pePoints=input.peRatio<=0?0:SCORE_TABLES.peRatio[pick(input.peRatio,[v=>v<15,v=>v<20,v=>v<25,v=>v<35,v=>v<50,v=>v<70,v=>v<=100,v=>v>100])];
 const qualityPoints=SCORE_TABLES.quality[pick(input.qualityMetric,[v=>v>=25,v=>v>=20,v=>v>=15,v=>v>=10,v=>v>=5,v=>v>=0,v=>v<0])];
 const categories=[
  {key:"future",label:"Zukunftspotenzial",score:industryPoints+marketPoints,max:25},
  {key:"growth",label:"Wachstum",score:revenuePoints+profitPoints,max:25},
  {key:"stability",label:"Finanzielle Stabilität",score:debtPoints+marginPoints,max:20},
  {key:"valuation",label:"Bewertung",score:pePoints,max:10},
  {key:"quality",label:"Unternehmensqualität",score:qualityPoints,max:20}
 ];
 const total=categories.reduce((sum,category)=>sum+category.score,0);
 const signal=total>=80?{key:"strong",label:"Starkes PointerScore-Signal",copy:"Das Unternehmen wirkt nach den gewählten PointerScore-Kriterien stark."}:
  total>=60?{key:"watch",label:"Beobachten",copy:"Das Unternehmen zeigt Stärken, sollte aber genauer geprüft werden."}:
  {key:"weak",label:"Schwächeres Signal",copy:"Nach PointerScore bestehen Schwächen oder offene Fragen."};
 const metrics={revenueGrowth12,revenueGrowth23,averageRevenueGrowth,profitGrowth12,profitGrowth23,averageProfitGrowth,profitGrowthMeaningful,debtRatio,netMargin};
 const analysis=buildAutomaticAnalysis(input,metrics,categories);
 return{ok:true,total,signal,categories,metrics,analysis};
}
