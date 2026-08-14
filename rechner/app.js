import {INDUSTRIES,MARKET_POSITIONS,calculatePointerScore,parseGermanNumber} from "./logic.js";
import {createAnalysisReport} from "./report.js";
import{getVerifiedUser,revealProtectedPage,supabase}from"../auth-client.js";
import{friendlyAnalysisError,getAnalysis,readAnalysisCache,saveAnalysis as saveCloudAnalysis,saveAnalysisCache}from"../analysis-store.js?v=2";
import{companyDataMetricLabels,companyDataToPointerScoreInput,fetchCompanyData,formatCompanyDataMetric}from"../company-data-client.js?v=2";
const isLocalPreview=["localhost","127.0.0.1"].includes(window.location.hostname)&&new URLSearchParams(window.location.search).get("preview")==="1";
const user=isLocalPreview?{id:"preview",email:"demo@pointerscore.com"}:await getVerifiedUser();
const isGuest=!user;
revealProtectedPage();
if(isLocalPreview)document.querySelectorAll('a[href="../dashboard.html"]').forEach(link=>{link.href="../dashboard.html?preview=1"});
const t=value=>{
 const text=String(value??"");
 const translated=window.PointerScoreI18n?.translate(text)??text;
 if(translated!==text)return translated;
 if(document.documentElement.lang==="en"&&text.endsWith(" ist die stärkste Kategorie"))return t(text.replace(/ ist die stärkste Kategorie$/,""))+" is the strongest category";
 return text;
};
function authUrl(mode="register"){
 const url=new URL("../auth.html",window.location.href);
 url.searchParams.set("mode",mode);
 url.searchParams.set("redirect","/rechner/");
 return url.href;
}
function openGuestAuthDialog(){
 const dialog=document.querySelector("[data-guest-auth-dialog]");
 if(!dialog){window.location.href=authUrl("register");return}
 if(!dialog.open&&typeof dialog.showModal==="function"){dialog.showModal();return}
 if(typeof dialog.showModal!=="function")window.location.href=authUrl("register");
}
function requireLoginForGuest(){
 if(!isGuest)return false;
 openGuestAuthDialog();
 return true;
}
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
const scrollSaveButton=document.querySelector("#result-scroll-save");
const noteToggle=document.querySelector("#analysis-note-toggle");
const noteEditor=document.querySelector("#analysis-note-editor");
const noteInput=document.querySelector("#analysis-note");
const saveNote=document.querySelector("#save-note");
const moneyUnitLabels=document.querySelectorAll("[data-money-unit-label]");
const tickerInput=document.querySelector("#companyTicker");
const findCompanyDataButton=document.querySelector("#find-company-data");
const secHelperOpen=document.querySelector("#sec-helper-open");
const secImportDialog=document.querySelector("#sec-import-dialog");
const secDialogClose=document.querySelector("#sec-dialog-close");
const secImportPanel=document.querySelector("#sec-import-panel");
const secImportTitle=document.querySelector("#sec-import-title");
const secImportMessage=document.querySelector("#sec-import-message");
const secImportValues=document.querySelector("#sec-import-values");
const secImportSource=document.querySelector("#sec-import-source");
const secImportApply=document.querySelector("#sec-import-apply");
const secImportClose=document.querySelector("#sec-import-close");
const reduceMotion=window.matchMedia("(prefers-reduced-motion: reduce)");
let qualityMetricType="ROE";
let moneyUnit="Mio.";
let scoreAnimationFrame=0;
let lastResult=null;
let currentNotes="";
let currentCreatedAt=null;
let calculationTimer=0;
let pendingCompanyData=null;

function appendOptions(select,options){options.forEach(item=>select.add(new Option(t(item.label),item.value)))}
appendOptions(industry,INDUSTRIES);appendOptions(marketPosition,MARKET_POSITIONS);
function refreshSelectOptions(select,options){const value=select.value;while(select.options.length>1)select.remove(1);appendOptions(select,options);select.value=value}

document.querySelectorAll(".toggle-button").forEach(button=>button.addEventListener("click",()=>{
 if(!button.dataset.metric)return;
 qualityMetricType=button.dataset.metric;
 document.querySelectorAll("[data-metric]").forEach(item=>{const selected=item===button;item.classList.toggle("active",selected);item.setAttribute("aria-pressed",String(selected))});
 qualityLabelText.textContent=qualityMetricType;
}));

const numberFields=["revenue1","revenue2","revenue3","profit1","profit2","profit3","totalDebt","totalAssets","currentRevenue","currentProfit","peRatio","qualityMetric"];
function setMoneyUnit(unit){
 moneyUnit=unit==="Mrd."?"Mrd.":"Mio.";
 moneyUnitLabels.forEach(label=>{label.textContent=moneyUnit;label.setAttribute("aria-label","Einheit wechseln, aktuell "+moneyUnit)});
}
moneyUnitLabels.forEach(label=>label.setAttribute("title","Zwischen Mio. und Mrd. wechseln"));
document.addEventListener("click",event=>{
 if(!event.target.closest("[data-money-unit-label]"))return;
 event.preventDefault();
 setMoneyUnit(moneyUnit==="Mio."?"Mrd.":"Mio.");
});
function collectInput(){const data={companyName:form.elements.companyName.value.trim(),industry:industry.value,marketPosition:marketPosition.value,qualityMetricType,moneyUnit};numberFields.forEach(field=>data[field]=parseGermanNumber(form.elements[field].value));return data}

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
 if(field.name==="companyTicker")return !field.value.trim()||/^[A-Za-z0-9.-]{1,12}$/.test(field.value.trim());
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
 if(field.name==="companyTicker"&&!valid&&revealError){showFieldError(field,errorText||"Bitte gib einen gültigen US-Ticker ein.");return}
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
const secMetricOrder=["revenue","netIncome","assets","liabilities","equity","cash","longTermDebt","currentAssets","currentLiabilities","operatingIncome","marketPrice","peRatio","roe","roic","eps","sharesOutstanding"];
const secErrorMessages={
 ticker_not_found:"Ticker nicht gefunden.",
 company_not_supported:"Dieses Unternehmen wird von SEC Company Facts nicht unterstützt.",
 sec_unavailable:"SEC ist gerade nicht erreichbar. Bitte versuche es später erneut.",
 authentication_required:"Bitte melde dich an, um SEC-Unternehmensdaten abzurufen.",
 company_data_failed:"Unternehmensdaten konnten nicht geladen werden."
};
function formNumber(value){return new Intl.NumberFormat(currentLocale(),{useGrouping:false,maximumFractionDigits:2}).format(value)}
function secMetaText(meta){
 if(!meta)return t("Kennzahl nicht verfügbar.");
 if(meta.source||meta.formula){
  return [meta.source,meta.formula?t(meta.formula):null,meta.priceDate,meta.fiscalYear?"FY"+meta.fiscalYear:null,meta.periodEndDate].filter(Boolean).join(" · ");
 }
 return [meta.form,meta.fiscalYear?"FY"+meta.fiscalYear:null,meta.periodEndDate,meta.filingDate?t("Filing")+": "+meta.filingDate:null].filter(Boolean).join(" · ");
}
function setSecPanelState(text,type="info"){
 if(!secImportPanel)return;
 secImportPanel.hidden=false;
 secImportPanel.dataset.state=type;
 secImportMessage.textContent=t(text);
}
function renderCompanyData(companyData){
 pendingCompanyData=companyData;
 const labels=companyDataMetricLabels();
 const locale=currentLocale();
 secImportTitle.textContent=(companyData.companyName||companyData.ticker)+" · "+t("Company data found");
 secImportSource.textContent=[companyData.source,companyData.period].filter(Boolean).join(" · ");
 secImportValues.innerHTML=secMetricOrder.map(key=>{
  const rawValue=companyData[key];
  const formatted=formatCompanyDataMetric(key,rawValue,locale);
  const unavailable=formatted===null;
  return '<div class="sec-import-value '+(unavailable?"is-unavailable":"")+'"><dt>'+t(labels[key]||key)+'</dt><dd><strong>'+t(formatted||"Kennzahl nicht verfügbar.")+'</strong><span>'+secMetaText(companyData.metadata?.[key])+'</span></dd></div>';
 }).join("");
 setSecPanelState("Daten erfolgreich geladen. Bitte prüfe die Werte vor dem Import.",companyData.unavailableMetrics?.length?"warning":"success");
 secImportPanel.scrollIntoView({behavior:reduceMotion.matches?"auto":"smooth",block:"nearest"});
}
async function hasSignedInSession(){
 const {data}=await supabase.auth.getSession();
 return Boolean(data?.session?.access_token);
}
async function handleFindCompanyData(){
 const ticker=tickerInput?.value.trim().toUpperCase().replace(".","-")||"";
 if(!ticker){setSecPanelState("Bitte gib zuerst einen US-Ticker ein.","error");tickerInput?.focus();return}
 if(isGuest||!(await hasSignedInSession())){openGuestAuthDialog();return}
 findCompanyDataButton.disabled=true;
 findCompanyDataButton.textContent=t("SEC-Daten werden geladen …");
 setSecPanelState("SEC-Daten werden geladen …","loading");
 try{
  const data=await fetchCompanyData(supabase,ticker);
  renderCompanyData(data);
 }catch(error){
  const code=error?.code||"company_data_failed";
  pendingCompanyData=null;
  secImportValues.innerHTML="";
  secImportTitle.textContent=t("Company data import");
  secImportSource.textContent="SEC EDGAR";
  setSecPanelState(secErrorMessages[code]||secErrorMessages.company_data_failed,"error");
 }finally{
  findCompanyDataButton.disabled=false;
  findCompanyDataButton.textContent=t("Find company data");
 }
}
function applyCompanyData(){
 if(!pendingCompanyData)return;
 const values=companyDataToPointerScoreInput(pendingCompanyData);
 const entries=Object.entries(values).filter(([name,value])=>(name==="moneyUnit"||name==="qualityMetricType"||form.elements[name])&&value!==""&&value!==null&&value!==undefined);
 if(entries.length<=1){setSecPanelState("Keine passenden Formularwerte verfügbar.","warning");return}
 const conflicts=entries.filter(([name,value])=>{
  if(name==="moneyUnit")return false;
  if(name==="qualityMetricType")return false;
  const field=form.elements[name];
  return field?.value.trim()&&field.value.trim()!==String(value);
 });
 if(conflicts.length&&!window.confirm(t("Bestehende Werte überschreiben?")))return;
 if(values.moneyUnit)setMoneyUnit(values.moneyUnit);
 entries.forEach(([name,value])=>{
  if(name==="moneyUnit")return;
  if(name==="qualityMetricType"){
   qualityMetricType=value==="ROIC"?"ROIC":"ROE";
   document.querySelectorAll("[data-metric]").forEach(button=>{const selected=button.dataset.metric===qualityMetricType;button.classList.toggle("active",selected);button.setAttribute("aria-pressed",String(selected))});
   qualityLabelText.textContent=qualityMetricType;
   return;
  }
  const field=form.elements[name];
  if(!field)return;
  field.value=typeof value==="number"?formNumber(value):String(value);
  updateFieldVisual(field);
 });
 updateCompletion();
 setSecPanelState("SEC-Daten wurden übernommen. Bitte prüfe die Werte und ergänze fehlende Kennzahlen.","success");
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
async function saveAnalysis(){
 if(!lastResult)return;
 if(requireLoginForGuest())return;
 saveButton.disabled=true;saveNote.textContent=t("Analyse wird in der Cloud gespeichert …");
 currentNotes=noteInput.value.trim();
 const analysis={id:currentAnalysisId||crypto.randomUUID(),company:lastResult.companyName,score:lastResult.total,notes:currentNotes,createdAt:currentCreatedAt,input:collectInput(),result:lastResult};
 try{
  const saved=isLocalPreview?saveAnalysisCache(user.id,analysis):await saveCloudAnalysis(user.id,analysis);
  currentAnalysisId=saved.id;
  currentCreatedAt=saved.createdAt||currentCreatedAt;
  const url=new URL(window.location.href);url.searchParams.set("analysis",saved.id);history.replaceState({},"",url);
  saveNote.textContent=t("Analyse sicher in der Cloud gespeichert.");
  window.setTimeout(()=>{saveNote.textContent=""},2400);
 }catch(error){saveNote.textContent=friendlyAnalysisError(error,t("Analyse konnte nicht gespeichert werden. Bitte versuche es erneut."))}
 finally{saveButton.disabled=false}
}
async function openSavedAnalysis(){
 if(!currentAnalysisId)return;
 if(!user){openGuestAuthDialog();return}
 saveNote.textContent=t("Analyse wird geladen …");
 let analysis;
 try{
  analysis=isLocalPreview?readAnalysisCache(user.id).find(item=>item.id===currentAnalysisId):await getAnalysis(user.id,currentAnalysisId);
 }catch(error){
  analysis=readAnalysisCache(user.id).find(item=>item.id===currentAnalysisId);
  saveNote.textContent=friendlyAnalysisError(error,t("Cloud-Analyse konnte nicht geladen werden."));
 }
 if(!analysis){saveNote.textContent=t("Analyse wurde nicht gefunden oder du hast keinen Zugriff.");return}
 if(!analysis?.input)return;
 currentNotes=String(analysis.notes||"");
 currentCreatedAt=analysis.createdAt||null;
 noteInput.value=currentNotes;
 noteToggle.textContent=t(currentNotes?"Notiz bearbeiten":"Notiz hinzufügen");
 Object.entries(analysis.input).forEach(([name,value])=>{const field=form.elements[name];if(field&&name!=="qualityMetricType")field.value=value??""});
 if(analysis.input.moneyUnit)setMoneyUnit(analysis.input.moneyUnit);else setMoneyUnit("Mio.");
 if(analysis.input.qualityMetricType){
  qualityMetricType=analysis.input.qualityMetricType;
  document.querySelectorAll("[data-metric]").forEach(button=>{const selected=button.dataset.metric===qualityMetricType;button.classList.toggle("active",selected);button.setAttribute("aria-pressed",String(selected))});
  qualityLabelText.textContent=qualityMetricType;
 }
 updateCompletion();
 const result=calculatePointerScore(analysis.input);
 if(result.ok)renderResult(result);
 saveNote.textContent="";
}
form.addEventListener("submit",event=>{event.preventDefault();clearTimeout(calculationTimer);clearErrors();if(requireLoginForGuest())return;const result=calculatePointerScore(collectInput());if(!result.ok)return showErrors(result.errors);showCalculationLoading();calculationTimer=setTimeout(()=>renderResult(result),1500)});
form.addEventListener("input",event=>{clearFieldError(event.target);updateFieldVisual(event.target);updateCompletion()});
form.addEventListener("change",event=>{updateFieldVisual(event.target);updateCompletion()});
form.addEventListener("focusout",event=>{if(event.target.matches("input,select"))updateFieldVisual(event.target,true)});

async function exportAnalysisPdf(){
 if(!lastResult)return;
 if(requireLoginForGuest())return;
 exportNote.textContent=t("Der hochwertige PDF-Bericht wird vorbereitet …");exportNote.hidden=false;
 currentNotes=noteInput.value.trim();
 try{
  const report=await createAnalysisReport({...lastResult,notes:currentNotes},{language:window.PointerScoreI18n?.language||localStorage.getItem("pointerscore-language")||document.documentElement.lang});
  if(report?.ok&&report.mode==="desktop"){
   exportNote.textContent=t("PDF wurde gespeichert.");
   return;
  }
  if(report?.ok){
   exportNote.textContent=t("PDF-Bericht geöffnet. Wähle im Druckdialog „Als PDF speichern“.");
   return;
  }
  if(report?.canceled){
   exportNote.textContent=t("PDF-Speichern wurde abgebrochen.");
   return;
  }
  exportNote.textContent=t("Bitte erlaube Pop-ups, um den PDF-Bericht zu öffnen.");
 }catch(error){
  exportNote.textContent=t("PDF konnte nicht erstellt werden. Bitte versuche es erneut.");
 }
}
function printAnalysis(){
 if(!lastResult)return;
 if(requireLoginForGuest())return;
 const previousTitle=document.title;document.title="PointerScore-Analyse-"+lastResult.total+"-Punkte";
 document.body.classList.add("printing-analysis");setTimeout(()=>window.print(),80);
 window.addEventListener("afterprint",()=>{document.body.classList.remove("printing-analysis");document.title=previousTitle},{once:true});
}
document.querySelector("#pdf-button").addEventListener("click",exportAnalysisPdf);
document.querySelector("#print-button").addEventListener("click",printAnalysis);
findCompanyDataButton?.addEventListener("click",()=>{void handleFindCompanyData()});
tickerInput?.addEventListener("keydown",event=>{if(event.key==="Enter"){event.preventDefault();void handleFindCompanyData()}});
secHelperOpen?.addEventListener("click",()=>{
 if(typeof secImportDialog?.showModal==="function"){secImportDialog.showModal();tickerInput?.focus();return}
 secImportDialog?.setAttribute("open","");
 tickerInput?.focus();
});
secDialogClose?.addEventListener("click",()=>{if(secImportDialog?.open)secImportDialog.close();else secImportDialog?.removeAttribute("open")});
secImportApply?.addEventListener("click",applyCompanyData);
secImportClose?.addEventListener("click",()=>{secImportPanel.hidden=true;if(secImportDialog?.open)secImportDialog.close()});
saveButton.addEventListener("click",()=>{void saveAnalysis()});
noteToggle.addEventListener("click",()=>{
 const open=noteEditor.hidden;
 noteEditor.hidden=!open;
 noteToggle.setAttribute("aria-expanded",String(open));
 if(open)noteInput.focus();
});
noteInput.addEventListener("input",()=>{
 currentNotes=noteInput.value;
 noteToggle.textContent=t(currentNotes.trim()?"Notiz bearbeiten":"Notiz hinzufügen");
});
scrollSaveButton.addEventListener("click",()=>{
 saveButton.scrollIntoView({behavior:reduceMotion.matches?"auto":"smooth",block:"center"});
 window.setTimeout(()=>saveButton.focus({preventScroll:true}),reduceMotion.matches?0:650);
});
document.querySelectorAll("[data-guest-auth-close]").forEach(button=>button.addEventListener("click",()=>{
 const dialog=document.querySelector("[data-guest-auth-dialog]");
 if(dialog?.open)dialog.close();
}));
document.querySelectorAll("[data-logout]").forEach(button=>{
 if(isGuest){
  button.textContent=t("Anmelden");
  button.addEventListener("click",()=>{window.location.href=authUrl("login")});
  return;
 }
 button.addEventListener("click",async()=>{button.disabled=true;await supabase.auth.signOut({scope:"local"});window.location.replace("../index.html")});
});
if(isGuest){
 document.body.classList.add("is-guest");
 document.querySelectorAll('a[href="../profile.html"]').forEach(link=>link.addEventListener("click",event=>{event.preventDefault();openGuestAuthDialog()}));
}

window.addEventListener("pointerscore:languagechange",()=>{
 refreshSelectOptions(industry,INDUSTRIES);refreshSelectOptions(marketPosition,MARKET_POSITIONS);
 updateCompletion();
 if(pendingCompanyData&&!secImportPanel.hidden)renderCompanyData(pendingCompanyData);
 if(lastResult)renderResult(lastResult);
});

updateCompletion();
await openSavedAnalysis();
