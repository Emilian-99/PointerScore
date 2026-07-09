const escapeReportHtml=value=>String(value??"").replace(/[&<>"']/g,char=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[char]));

const REPORT_TEXT={
 de:{
  preparingTitle:"PointerScore Analyse wird erstellt",
  preparing:"PDF-Bericht wird vorbereitet",
  locale:"de-DE",
  notMeaningful:"nicht sinnvoll",
  structuredAnalysis:"Strukturierte Unternehmensanalyse",
  detailEvaluation:"Detailauswertung",
  createdLabel:"Analyse erstellt",
  analysisVersion:"PointerScore Analyse V1.2",
  companyValuation:"Unternehmensbewertung",
  totalScore:"Gesamtscore",
  outOf100:"VON 100",
  categoryTitle:"Bewertung nach Kategorien",
  maxPoints:"Maximal 100 Punkte",
  autoAnalysis:"Automatische Analyse",
  basedOnInput:"Auf Basis der Eingaben",
  strengths:"Stärken",
  potential:"Verbesserungspotenzial",
  noAdviceFooter:"PointerScore - Keine Anlageberatung",
  pageOne:"Seite 1 von 2",
  calculatedMetrics:"Berechnete Kennzahlen",
  detailAnalysis:"Detailanalyse",
  basis:"Nachvollziehbare Grundlage des Gesamtscores",
  metric:"Kennzahl",
  result:"Ergebnis",
  personalNote:"Persönliche Notiz",
  methodTitle:"Gewichtung der Methode V1.2",
  total100:"Gesamt 100 Punkte",
  future:"Zukunfts-<br>potenzial",
  growth:"Wachstum",
  stability:"Finanzielle<br>Stabilität",
  valuation:"Bewertung",
  quality:"Unternehmens-<br>qualität",
  noteLabel:"Hinweis:",
  disclaimer:"PointerScore ist ein vereinfachtes, strukturiertes Bewertungsmodell. Der Bericht dient ausschließlich Bildungs- und Informationszwecken, stellt keine Anlageberatung dar und ersetzt weder eigene Recherche noch eine persönliche Beratung.",
  reportFooter:"PointerScore - Analyse V1.2",
  pageTwo:"Seite 2 von 2",
  revenueGrowth12:"Umsatzwachstum Jahr 1 zu 2",
  revenueGrowth23:"Umsatzwachstum Jahr 2 zu 3",
  averageRevenueGrowth:"Durchschnittliches Umsatzwachstum",
  profitGrowth12:"Gewinnwachstum Jahr 1 zu 2",
  profitGrowth23:"Gewinnwachstum Jahr 2 zu 3",
  averageProfitGrowth:"Durchschnittliches Gewinnwachstum",
  debtRatio:"Schuldenquote",
  netMargin:"Nettomarge"
 },
 en:{
  preparingTitle:"PointerScore analysis is being created",
  preparing:"PDF report is being prepared",
  locale:"en-GB",
  notMeaningful:"not meaningful",
  structuredAnalysis:"Structured company analysis",
  detailEvaluation:"Detailed evaluation",
  createdLabel:"Analysis created",
  analysisVersion:"PointerScore Analysis V1.2",
  companyValuation:"Company valuation",
  totalScore:"Total score",
  outOf100:"OUT OF 100",
  categoryTitle:"Category evaluation",
  maxPoints:"Maximum 100 points",
  autoAnalysis:"Automatic analysis",
  basedOnInput:"Based on your inputs",
  strengths:"Strengths",
  potential:"Areas for improvement",
  noAdviceFooter:"PointerScore - Not investment advice",
  pageOne:"Page 1 of 2",
  calculatedMetrics:"Calculated metrics",
  detailAnalysis:"Detailed analysis",
  basis:"Traceable basis of the total score",
  metric:"Metric",
  result:"Result",
  personalNote:"Personal note",
  methodTitle:"Method weighting V1.2",
  total100:"Total 100 points",
  future:"Future<br>potential",
  growth:"Growth",
  stability:"Financial<br>stability",
  valuation:"Valuation",
  quality:"Company<br>quality",
  noteLabel:"Note:",
  disclaimer:"PointerScore is a simplified, structured evaluation model. This report is provided solely for educational and informational purposes, is not investment advice and does not replace your own research or personal advice.",
  reportFooter:"PointerScore - Analysis V1.2",
  pageTwo:"Page 2 of 2",
  revenueGrowth12:"Revenue growth year 1 to 2",
  revenueGrowth23:"Revenue growth year 2 to 3",
  averageRevenueGrowth:"Average revenue growth",
  profitGrowth12:"Profit growth year 1 to 2",
  profitGrowth23:"Profit growth year 2 to 3",
  averageProfitGrowth:"Average profit growth",
  debtRatio:"Debt ratio",
  netMargin:"Net margin"
 }
};

const getReportLanguage=()=>document.documentElement.lang==="en"?"en":"de";
const translateReportValue=value=>{
 const text=String(value??"");
 return window.PointerScoreI18n?.translate(text)??text;
};
const formatReportPercent=(value,copy)=>value===null?copy.notMeaningful:new Intl.NumberFormat(copy.locale,{minimumFractionDigits:1,maximumFractionDigits:1}).format(value)+" %";

async function createReportLogo(){
 return new Promise(resolve=>{
  const image=new Image();
  image.onload=()=>{
   try{const canvas=document.createElement("canvas");canvas.width=240;canvas.height=240;const context=canvas.getContext("2d");context.drawImage(image,505,818,242,242,0,0,240,240);resolve(canvas.toDataURL("image/png"))}catch(error){resolve("")}
  };
  image.onerror=()=>resolve("");
  image.src=new URL("./pointerscore-logo-source.png",document.baseURI).href;
 });
}

export async function createAnalysisReport(result){
 const language=getReportLanguage();
 const copy=REPORT_TEXT[language];
 const reportWindow=window.open("","_blank");
 if(!reportWindow)return false;
 reportWindow.document.write('<!doctype html><html lang="'+language+'"><head><meta charset="utf-8"><title>'+copy.preparingTitle+'</title><style>body{font-family:Arial,sans-serif;display:grid;place-items:center;min-height:100vh;margin:0;color:#061b35;background:#edf7ff}div{text-align:center}span{display:block;width:48px;height:48px;margin:0 auto 18px;border:5px solid #dce7f0;border-top-color:#4b97ee;border-radius:50%;animation:s .8s linear infinite}@keyframes s{to{transform:rotate(360deg)}}</style></head><body><div><span></span><strong>'+copy.preparing+'</strong></div></body></html>');
 reportWindow.document.close();

 const logo=await createReportLogo();
 const createdAt=new Intl.DateTimeFormat(copy.locale,{dateStyle:"long",timeStyle:"short"}).format(new Date());
 const company=escapeReportHtml(result.companyName);
 const signalColor=result.signal.key==="strong"?"#0b9b6d":result.signal.key==="watch"?"#d69218":"#cc5c66";
 const circumference=339.292;
 const dash=(Math.max(0,Math.min(100,result.total))/100*circumference).toFixed(2);
 const logoMarkup=logo?'<img src="'+logo+'" alt="PointerScore Logo">':'<span class="logo-fallback">PS</span>';
 const categories=result.categories.map(category=>{
  const width=Math.round(category.score/category.max*100);
  return '<div class="category-row"><div class="category-line"><strong>'+escapeReportHtml(translateReportValue(category.label))+'</strong><span>'+category.score+' / '+category.max+'</span></div><div class="category-track"><i style="width:'+width+'%"></i></div></div>';
 }).join("");
 const analysisList=(items,type)=>items.map(text=>'<li><b class="'+type+'">'+(type==="good"?"✓":"!")+'</b><span>'+escapeReportHtml(translateReportValue(text))+'</span></li>').join("");
 const metrics=[
  [copy.revenueGrowth12,formatReportPercent(result.metrics.revenueGrowth12,copy)],
  [copy.revenueGrowth23,formatReportPercent(result.metrics.revenueGrowth23,copy)],
  [copy.averageRevenueGrowth,formatReportPercent(result.metrics.averageRevenueGrowth,copy)],
  [copy.profitGrowth12,formatReportPercent(result.metrics.profitGrowth12,copy)],
  [copy.profitGrowth23,formatReportPercent(result.metrics.profitGrowth23,copy)],
  [copy.averageProfitGrowth,formatReportPercent(result.metrics.averageProfitGrowth,copy)],
  [copy.debtRatio,formatReportPercent(result.metrics.debtRatio,copy)],
  [copy.netMargin,formatReportPercent(result.metrics.netMargin,copy)]
 ].map(item=>'<tr><td>'+escapeReportHtml(item[0])+'</td><td>'+escapeReportHtml(item[1])+'</td></tr>').join("");
 const personalNote=String(result.notes||"").trim()?'<section class="personal-note-block"><h2>'+copy.personalNote+'</h2><p>'+escapeReportHtml(result.notes)+'</p></section>':"";
 const styles=[
  '*{box-sizing:border-box}html,body{margin:0;padding:0;background:#dfefff;color:#061b35;font-family:Arial,"Segoe UI",sans-serif;-webkit-print-color-adjust:exact;print-color-adjust:exact}',
  '@page{size:A4;margin:0}.page{width:210mm;min-height:297mm;padding:16mm 17mm 15mm;position:relative;overflow:hidden;background:radial-gradient(ellipse 65% 40% at 3% 3%,rgba(151,199,255,.40),transparent 72%),radial-gradient(ellipse 60% 38% at 97% 3%,rgba(174,232,255,.36),transparent 74%),linear-gradient(180deg,#e8f4ff 0%,#f3f9ff 55%,#f9fcff 100%);page-break-after:always}.page:last-child{page-break-after:auto}',
  '.header{display:flex;align-items:center;justify-content:space-between;padding-bottom:8mm;border-bottom:1px solid rgba(107,139,166,.28)}.brand{display:flex;align-items:center;gap:4mm}.brand img,.logo-fallback{width:13mm;height:13mm;border-radius:3mm}.logo-fallback{display:grid;place-items:center;color:#fff;background:#061b35;font-weight:800}.brand strong{display:block;font-size:14pt;letter-spacing:-.4pt}.brand small{display:block;margin-top:1.2mm;color:#65798d;font-size:7.5pt}.meta{text-align:right;color:#60758a;font-size:7.5pt;line-height:1.55}.meta b{display:block;color:#18324f}',
  '.title{margin:11mm 0 8mm}.kicker{margin:0 0 2.5mm;color:#3f87d3;font-size:7pt;font-weight:800;letter-spacing:1.4pt;text-transform:uppercase}.title h1{margin:0;font-size:28pt;letter-spacing:-1.2pt}.company{margin:2.5mm 0 0;color:#536b82;font-size:12pt;font-weight:700}',
  '.score-panel{display:grid;grid-template-columns:58mm 1fr;gap:9mm;align-items:center;padding:8mm;border:1px solid rgba(130,162,188,.34);border-radius:4mm;background:rgba(255,255,255,.78);box-shadow:0 5mm 12mm rgba(35,83,120,.10)}.score-svg{width:49mm;height:49mm}.score-summary h2{margin:0 0 2.5mm;font-size:18pt;letter-spacing:-.4pt}.signal{display:inline-block;padding:2mm 3mm;border-radius:99mm;color:'+signalColor+';background:'+signalColor+'18;font-size:8pt;font-weight:800}.score-summary p{margin:4mm 0 0;color:#5d7388;font-size:9pt;line-height:1.55}',
  '.section{margin-top:8mm}.section-head{display:flex;align-items:end;justify-content:space-between;margin-bottom:4mm}.section h2{margin:0;font-size:13pt}.section-head span{color:#718599;font-size:7.5pt}.category-grid{display:grid;grid-template-columns:1fr 1fr;gap:4mm 7mm}.category-row:last-child{grid-column:1/-1}.category-line{display:flex;justify-content:space-between;margin-bottom:1.6mm;font-size:8pt}.category-line span{color:#5f7589;font-weight:700}.category-track{height:2.5mm;overflow:hidden;border-radius:99mm;background:#dfe8ef}.category-track i{display:block;height:100%;border-radius:inherit;background:linear-gradient(90deg,#69b5ff,#438de7)}',
  '.analysis{display:grid;grid-template-columns:1fr 1fr;gap:5mm}.analysis-card{padding:5mm;border:1px solid rgba(130,162,188,.28);border-radius:3mm;background:rgba(255,255,255,.72)}.analysis-card h3{margin:0 0 3.5mm;font-size:9pt;text-transform:uppercase;letter-spacing:.5pt}.analysis ul{display:grid;gap:2.2mm;margin:0;padding:0;list-style:none}.analysis li{display:flex;align-items:flex-start;gap:2mm;color:#4f667b;font-size:8pt;line-height:1.4}.analysis li b{width:4mm;height:4mm;display:grid;place-items:center;flex:none;border-radius:50%;font-size:6.5pt}.good{color:#087654;background:#e0f5ed}.warn{color:#986109;background:#fff0d2}',
  '.report-table{width:100%;table-layout:fixed;border-collapse:separate;border-spacing:0;overflow:hidden;border:1px solid rgba(130,162,188,.3);border-radius:3mm;background:rgba(255,255,255,.75)}.report-table th:first-child,.report-table td:first-child{width:68%}.report-table th:last-child,.report-table td:last-child{width:32%}.report-table th,.report-table td{padding:3.1mm 4mm;border-bottom:1px solid #dde7ee;text-align:left;font-size:8.2pt;overflow-wrap:anywhere}.report-table th{color:#536b81;background:rgba(235,244,251,.85);font-size:7pt;text-transform:uppercase;letter-spacing:.5pt}.report-table td:last-child{text-align:right;font-weight:800}.report-table tr:last-child td{border-bottom:0}',
  '.personal-note-block{margin-top:5mm;padding:4mm 5mm;border:1px solid rgba(130,162,188,.28);border-radius:3mm;background:rgba(255,255,255,.7)}.personal-note-block h2{margin:0 0 2mm;font-size:9pt}.personal-note-block p{margin:0;max-width:100%;color:#536b80;font-size:7.5pt;font-weight:500;line-height:1.45;white-space:pre-wrap;overflow-wrap:anywhere;word-break:break-word}',
  '.method-grid{display:grid;grid-template-columns:repeat(5,1fr);gap:2.5mm;margin-top:5mm}.method-item{padding:4mm 2.5mm;border:1px solid rgba(130,162,188,.27);border-radius:2.5mm;background:rgba(255,255,255,.68);text-align:center}.method-item strong{display:block;font-size:13pt}.method-item span{display:block;margin-top:1.5mm;color:#60758a;font-size:6.5pt;line-height:1.35}',
  '.note{margin-top:8mm;padding:5mm;border-left:1.2mm solid #4b97ee;border-radius:0 2.5mm 2.5mm 0;background:rgba(255,255,255,.68);color:#536b80;font-size:8pt;line-height:1.55}.note strong{color:#18324f}.footer{position:absolute;left:17mm;right:17mm;bottom:10mm;display:flex;justify-content:space-between;padding-top:3mm;border-top:1px solid rgba(107,139,166,.25);color:#72869a;font-size:7pt}',
  '@media screen{body{padding:20px}.page{margin:0 auto 20px;box-shadow:0 12px 40px rgba(20,58,91,.18)}}@media print{body{background:#fff;padding:0}.page{margin:0;box-shadow:none}}'
 ].join("");
 const pageOne='<section class="page"><header class="header"><div class="brand">'+logoMarkup+'<div><strong>PointerScore</strong><small>'+copy.structuredAnalysis+'</small></div></div><div class="meta"><b>'+copy.createdLabel+'</b>'+escapeReportHtml(createdAt)+'</div></header><div class="title"><p class="kicker">'+copy.analysisVersion+'</p><h1>'+copy.companyValuation+'</h1><p class="company">'+company+'</p></div><div class="score-panel"><svg class="score-svg" viewBox="0 0 120 120" role="img" aria-label="'+copy.totalScore+' '+result.total+' '+copy.outOf100.toLowerCase()+'"><circle cx="60" cy="60" r="54" fill="none" stroke="#dfe8ef" stroke-width="9"/><circle cx="60" cy="60" r="54" fill="none" stroke="'+signalColor+'" stroke-width="9" stroke-linecap="round" stroke-dasharray="'+dash+' '+circumference+'" transform="rotate(-90 60 60)"/><text x="60" y="58" text-anchor="middle" font-size="30" font-weight="800" fill="#061b35">'+result.total+'</text><text x="60" y="76" text-anchor="middle" font-size="10" font-weight="700" fill="#718599">'+copy.outOf100+'</text></svg><div class="score-summary"><h2>'+copy.totalScore+'</h2><span class="signal">'+escapeReportHtml(translateReportValue(result.signal.label))+'</span><p>'+escapeReportHtml(translateReportValue(result.signal.copy))+'</p></div></div><section class="section"><div class="section-head"><h2>'+copy.categoryTitle+'</h2><span>'+copy.maxPoints+'</span></div><div class="category-grid">'+categories+'</div></section><section class="section"><div class="section-head"><h2>'+copy.autoAnalysis+'</h2><span>'+copy.basedOnInput+'</span></div><div class="analysis"><div class="analysis-card"><h3>'+copy.strengths+'</h3><ul>'+analysisList(result.analysis.strengths,"good")+'</ul></div><div class="analysis-card"><h3>'+copy.potential+'</h3><ul>'+analysisList(result.analysis.potential,"warn")+'</ul></div></div></section><footer class="footer"><span>'+copy.noAdviceFooter+'</span><span>'+copy.pageOne+'</span></footer></section>';
 const pageTwo='<section class="page"><header class="header"><div class="brand">'+logoMarkup+'<div><strong>PointerScore</strong><small>'+copy.detailEvaluation+'</small></div></div><div class="meta"><b>'+company+'</b>'+escapeReportHtml(createdAt)+'</div></header><div class="title"><p class="kicker">'+copy.calculatedMetrics+'</p><h1>'+copy.detailAnalysis+'</h1><p class="company">'+copy.basis+'</p></div><table class="report-table"><thead><tr><th>'+copy.metric+'</th><th>'+copy.result+'</th></tr></thead><tbody>'+metrics+'</tbody></table>'+personalNote+'<section class="section"><div class="section-head"><h2>'+copy.methodTitle+'</h2><span>'+copy.total100+'</span></div><div class="method-grid"><div class="method-item"><strong>25</strong><span>'+copy.future+'</span></div><div class="method-item"><strong>25</strong><span>'+copy.growth+'</span></div><div class="method-item"><strong>20</strong><span>'+copy.stability+'</span></div><div class="method-item"><strong>10</strong><span>'+copy.valuation+'</span></div><div class="method-item"><strong>20</strong><span>'+copy.quality+'</span></div></div></section><div class="note"><strong>'+copy.noteLabel+'</strong> '+copy.disclaimer+'</div><footer class="footer"><span>'+copy.reportFooter+'</span><span>'+copy.pageTwo+'</span></footer></section>';
 const reportHtml='<!doctype html><html lang="'+language+'"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>PointerScore '+(language==="en"?"Analysis":"Analyse")+' - '+company+'</title><style>'+styles+'</style></head><body>'+pageOne+pageTwo+'<script>window.addEventListener("load",function(){setTimeout(function(){window.print()},500)})<\/script></body></html>';
 reportWindow.document.open();reportWindow.document.write(reportHtml);reportWindow.document.close();
 return true;
}
