import {INDUSTRIES,MARKET_POSITIONS,calculatePointerScore,parseGermanNumber} from "./logic.js";
import {createAnalysisReport} from "./report.js";
import{requireUser,revealProtectedPage,supabase}from"../auth-client.js";
const isLocalPreview=["localhost","127.0.0.1"].includes(window.location.hostname)&&new URLSearchParams(window.location.search).get("preview")==="1";
const user=isLocalPreview?{id:"preview",email:"demo@pointerscore.com"}:await requireUser();
if(!user)throw new Error("Authentication required.");
revealProtectedPage();
const STORAGE_KEY="pointerscore-analyses";
const t=value=>{
 const text=String(value??"");
 const translated=window.PointerScoreI18n?.translate(text)??text;
 if(translated!==text)return translated;
 if(document.documentElement.lang==="en"&&text.endsWith(" ist die stärkste Kategorie"))return t(text.replace(/ ist die stärkste Kategorie$/,""))+" is the strongest category";
 return text;
};
const currentLocale=()=>document.documentElement.lang==="en"?"en-GB":"de-DE";
let currentAnalysisId=new URLSearchParams(window.location.search).get("analysis");
const form=document.querySelector("#score-form");
const industry=document.querySelector("#industry");
const marketPosition=document.querySelector("#marketPosition");
const message=document.querySelector("#form-message");
const emptyResult=document.querySelector("#result-empty");
const loadingResult=document.querySelector("#result-loading");
const resultContent=document.querySelector("#result-content");
const resultCompany=document.querySelector("#result-company");
const completionText=document.querySelector("#completion-text");
const completionFill=document.querySelector("#completion-fill");
const completionCard=document.querySelector(".completion-card");
const submitButton=form.querySelector('button[type="submit"]');
const submitDefaultHtml=submitButton.innerHTML;
const qualityLabelText=document.querySelector("#quality-label-text");
const exportNote=document.querySelector("#export-note");
const saveButton=document.querySelector("#save-button");
const saveNote=document.querySelector("#save-note");
const reduceMotion=window.matchMedia("(prefers-reduced-motion: reduce)");
let qualityMetricType="ROE";
let scoreAnimationFrame=0;
let lastResult=null;
let calculationTimer=0;

function appendOptions(select,options){options.forEach(item=>select.add(new Option(t(item.label),item.value)))}
appendOptions(industry,INDUSTRIES);appendOptions(marketPosition,MARKET_POSITIONS);
function refreshSelectOptions(select,options){const value=select.value;while(select.options.length>1)select.remove(1);appendOptions(select,options);select.value=value}

document.querySelectorAll(".toggle-button").forEach(button=>button.addEventListener("click",()=>{
 qualityMetricType=button.dataset.metric;
 document.querySelectorAll(".toggle-button").forEach(item=>{const selected=item===button;item.classList.toggle("active",selected);item.setAttribute("aria-pressed",String(selected))});
 qualityLabelText.textContent=qualityMetricType;
}));

const numberFields=["revenue1","revenue2","revenue3","profit1","profit2","profit3","totalDebt","totalAssets","currentRevenue","currentProfit","peRatio","qualityMetric"];
function collectInput(){const data={companyName:form.elements.companyName.value.trim(),industry:industry.value,marketPosition:marketPosition.value,qualityMetricType};numberFields.forEach(field=>data[field]=parseGermanNumber(form.elements[field].value));return data}

function updateCompletion(){
 const value=name=>parseGermanNumber(form.elements[name].value);
 const finite=name=>Number.isFinite(value(name));
 const positive=name=>finite(name)&&value(name)>0;
 const sections=[
  Boolean(form.elements.companyName.value.trim().length>=2&&industry.value&&marketPosition.value),
  positive("revenue1")&&positive("revenue2")&&positive("revenue3")&&finite("profit1")&&finite("profit2")&&finite("profit3"),
  finite("totalDebt")&&value("totalDebt")>=0&&positive("totalAssets")&&positive("currentRevenue")&&finite("currentProfit"),
  finite("peRatio"),
  finite("qualityMetric")
 ];
 const completed=sections.filter(Boolean).length;
 completionText.textContent=completed+" "+t("von 5 abgeschlossen");
 completionFill.style.width=(completed/5*100)+"%";
 completionCard.classList.toggle("is-complete",completed===5);
}
function setCalculating(active){
 form.classList.toggle("is-calculating",active);
 Array.from(form.elements).forEach(control=>control.disabled=active);
 submitButton.innerHTML=active?t("Score wird berechnet")+' <span class="button-loading-dots">•••</span>':t("PointerScore berechnen");
}
function showCalculationLoading(){
 emptyResult.hidden=true;resultContent.hidden=true;loadingResult.hidden=false;setCalculating(true);
 if(window.matchMedia("(max-width: 900px)").matches)loadingResult.scrollIntoView({behavior:reduceMotion.matches?"auto":"smooth",block:"start"});
}


const positiveFields=new Set(["revenue1","revenue2","revenue3","totalAssets","currentRevenue"]);
function fieldIsValid(field){
 if(!field||!field.name)return false;
 if(field.name==="companyName")return field.value.trim().length>=2;
 if(field.tagName==="SELECT")return Boolean(field.value);
 const value=parseGermanNumber(field.value);
 if(!Number.isFinite(value))return false;
 if(positiveFields.has(field.name))return value>0;
 if(field.name==="totalDebt")return value>=0;
 return true;
}
function clearFieldError(field){
 const wrapper=field?.closest(".field");if(!wrapper)return;
 wrapper.classList.remove("invalid");field.classList.remove("invalid");field.removeAttribute("aria-invalid");field.removeAttribute("aria-describedby");
 wrapper.querySelector(".field-error")?.remove();
}
function showFieldError(field,text){
 const wrapper=field?.closest(".field");if(!wrapper)return;
 clearFieldError(field);wrapper.classList.remove("is-valid");wrapper.classList.add("invalid");field.classList.add("invalid");field.setAttribute("aria-invalid","true");
 const error=document.createElement("span");error.className="field-error";error.id=field.name+"-error";error.textContent=t(text||"Bitte eine gültige Eingabe machen.");wrapper.appendChild(error);field.setAttribute("aria-describedby",error.id);
}
function updateFieldVisual(field,revealError=false,errorText=""){
 if(!field?.name)return;const wrapper=field.closest(".field");if(!wrapper)return;
 const valid=fieldIsValid(field);wrapper.classList.toggle("is-valid",valid);
 if(valid)clearFieldError(field);else if(revealError)showFieldError(field,errorText||(field.name==="companyName"?"Bitte mindestens 2 Zeichen eingeben.":(field.tagName==="SELECT"?"Bitte eine Auswahl treffen.":"Bitte eine gültige Zahl eingeben.")));
}
function clearErrors(){
 message.hidden=true;message.textContent="";
 form.querySelectorAll(".field-error").forEach(element=>element.remove());
 form.querySelectorAll(".invalid").forEach(element=>element.classList.remove("invalid"));
 form.querySelectorAll("[aria-invalid]").forEach(element=>{element.removeAttribute("aria-invalid");element.removeAttribute("aria-describedby")});
}
function showErrors(errors){
 message.innerHTML="<strong>"+t("Bitte alle benötigten Felder ausfüllen.")+"</strong><span> "+t("Prüfe die dezent markierten Eingaben.")+"</span>";
 message.hidden=false;
 Object.keys(errors).forEach(name=>{const field=form.elements[name];if(field)updateFieldVisual(field,true,errors[name])});
 message.scrollIntoView({behavior:reduceMotion.matches?"auto":"smooth",block:"center"});
}
function formatPercent(value){return value===null?t("nicht sinnvoll"):new Intl.NumberFormat(currentLocale(),{minimumFractionDigits:1,maximumFractionDigits:1}).format(value)+" %"}

function animateScore(target){
 cancelAnimationFrame(scoreAnimationFrame);
 const score=document.querySelector("#total-score"),ring=document.querySelector("#score-ring");
 const duration=reduceMotion.matches?0:950,start=performance.now();
 ring.style.setProperty("--score","0%");
 function frame(now){
  const progress=duration===0?1:Math.min((now-start)/duration,1);
  const eased=1-Math.pow(1-progress,3);
  const current=Math.round(target*eased);
  score.textContent=current;ring.style.setProperty("--score",current+"%");
  if(progress<1)scoreAnimationFrame=requestAnimationFrame(frame);
 }
 scoreAnimationFrame=requestAnimationFrame(frame);
}
function renderAnalysis(analysis){
 const item=(text,type)=>'<li><span class="analysis-icon '+type+'" aria-hidden="true">'+(type==="positive"?"✓":"!")+"</span><span>"+text+"</span></li>";
 document.querySelector("#analysis-strengths").innerHTML=analysis.strengths.map(text=>item(t(text),"positive")).join("");
 document.querySelector("#analysis-potential").innerHTML=analysis.potential.map(text=>item(t(text),"warning")).join("");
}
function renderResult(result){
 lastResult=result;loadingResult.hidden=true;emptyResult.hidden=true;resultContent.hidden=false;exportNote.hidden=true;setCalculating(false);resultCompany.textContent=result.companyName;
 const ring=document.querySelector("#score-ring");
 ring.style.setProperty("--ring-color",result.signal.key==="strong"?"#0ea875":result.signal.key==="watch"?"#df9311":"#d95757");
 const badge=document.querySelector("#signal-badge");badge.className="signal-badge "+result.signal.key;badge.textContent=t(result.signal.label);
 document.querySelector("#signal-copy").textContent=t(result.signal.copy);
 document.querySelector("#category-results").innerHTML=result.categories.map(category=>
  '<div class="category-result"><div class="category-result-head"><span>'+t(category.label)+'</span><span>'+category.score+" / "+category.max+'</span></div><div class="bar"><span data-width="'+((category.score/category.max)*100)+'%"></span></div></div>'
 ).join("");
 renderAnalysis(result.analysis);
 const metrics=[
  ["Umsatzwachstum J1 → J2",formatPercent(result.metrics.revenueGrowth12)],["Umsatzwachstum J2 → J3",formatPercent(result.metrics.revenueGrowth23)],
  ["Ø Umsatzwachstum",formatPercent(result.metrics.averageRevenueGrowth)],["Gewinnwachstum J1 → J2",formatPercent(result.metrics.profitGrowth12)],
  ["Gewinnwachstum J2 → J3",formatPercent(result.metrics.profitGrowth23)],["Ø Gewinnwachstum",formatPercent(result.metrics.averageProfitGrowth)],
  ["Schuldenquote",formatPercent(result.metrics.debtRatio)],["Nettomarge",formatPercent(result.metrics.netMargin)]
 ];
 document.querySelector("#calculated-metrics").innerHTML=metrics.map(item=>"<dt>"+t(item[0])+"</dt><dd>"+item[1]+"</dd>").join("");
 animateScore(result.total);
 requestAnimationFrame(()=>requestAnimationFrame(()=>document.querySelectorAll(".bar span").forEach(bar=>bar.style.width=bar.dataset.width)));
 if(window.matchMedia("(max-width: 900px)").matches)resultContent.scrollIntoView({behavior:reduceMotion.matches?"auto":"smooth",block:"start"});
}
function readSavedAnalyses(){
 try{const value=JSON.parse(localStorage.getItem(STORAGE_KEY)||"[]");return Array.isArray(value)?value:[]}catch{return[]}
}
function saveAnalysis(){
 if(!lastResult)return;
 const analyses=readSavedAnalyses();
 const existing=analyses.find(item=>item.id===currentAnalysisId);
 const now=new Date().toISOString();
 const analysis={id:existing?.id||crypto.randomUUID(),company:lastResult.companyName,score:lastResult.total,createdAt:existing?.createdAt||now,updatedAt:now,input:collectInput(),result:lastResult};
 const next=existing?analyses.map(item=>item.id===analysis.id?analysis:item):[...analyses,analysis];
 localStorage.setItem(STORAGE_KEY,JSON.stringify(next));
 currentAnalysisId=analysis.id;
 const url=new URL(window.location.href);url.searchParams.set("analysis",analysis.id);history.replaceState({},"",url);
 saveNote.textContent=t("Analyse gespeichert.");
 window.setTimeout(()=>{saveNote.textContent=""},2400);
}
function openSavedAnalysis(){
 if(!currentAnalysisId)return;
 const analysis=readSavedAnalyses().find(item=>item.id===currentAnalysisId);
 if(!analysis?.input)return;
 Object.entries(analysis.input).forEach(([name,value])=>{const field=form.elements[name];if(field&&name!=="qualityMetricType")field.value=value??""});
 if(analysis.input.qualityMetricType){
  qualityMetricType=analysis.input.qualityMetricType;
  document.querySelectorAll(".toggle-button").forEach(button=>{const selected=button.dataset.metric===qualityMetricType;button.classList.toggle("active",selected);button.setAttribute("aria-pressed",String(selected))});
  qualityLabelText.textContent=qualityMetricType;
 }
 updateCompletion();
 const result=calculatePointerScore(analysis.input);
 if(result.ok)renderResult(result);
}
form.addEventListener("submit",event=>{event.preventDefault();clearTimeout(calculationTimer);clearErrors();const result=calculatePointerScore(collectInput());if(!result.ok)return showErrors(result.errors);showCalculationLoading();calculationTimer=setTimeout(()=>renderResult(result),1500)});
form.addEventListener("input",event=>{clearFieldError(event.target);updateFieldVisual(event.target);updateCompletion()});
form.addEventListener("change",event=>{updateFieldVisual(event.target);updateCompletion()});
form.addEventListener("focusout",event=>{if(event.target.matches("input,select"))updateFieldVisual(event.target,true)});

async function exportAnalysisPdf(){
 if(!lastResult)return;
 exportNote.textContent=t("Der hochwertige PDF-Bericht wird vorbereitet …");exportNote.hidden=false;
 const opened=await createAnalysisReport(lastResult);
 exportNote.textContent=opened?t("PDF-Bericht geöffnet. Wähle im Druckdialog „Als PDF speichern“."):t("Bitte erlaube Pop-ups, um den PDF-Bericht zu öffnen.");
}
function printAnalysis(){
 if(!lastResult)return;
 const previousTitle=document.title;document.title="PointerScore-Analyse-"+lastResult.total+"-Punkte";
 document.body.classList.add("printing-analysis");setTimeout(()=>window.print(),80);
 window.addEventListener("afterprint",()=>{document.body.classList.remove("printing-analysis");document.title=previousTitle},{once:true});
}
document.querySelector("#pdf-button").addEventListener("click",exportAnalysisPdf);
document.querySelector("#print-button").addEventListener("click",printAnalysis);
saveButton.addEventListener("click",saveAnalysis);
document.querySelectorAll("[data-logout]").forEach(button=>button.addEventListener("click",async()=>{button.disabled=true;await supabase.auth.signOut({scope:"local"});window.location.replace("../index.html")}));

window.addEventListener("pointerscore:languagechange",()=>{
 refreshSelectOptions(industry,INDUSTRIES);refreshSelectOptions(marketPosition,MARKET_POSITIONS);
 updateCompletion();
 if(lastResult)renderResult(lastResult);
});

updateCompletion();
openSavedAnalysis();
