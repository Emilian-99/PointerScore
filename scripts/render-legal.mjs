import {readFile} from 'node:fs/promises';
import vm from 'node:vm';
const sandbox={window:{}};vm.runInNewContext(await readFile(new URL('../legal-content.js',import.meta.url),'utf8'),sandbox,{timeout:1000});
const docs=sandbox.window.PointerScoreLegalDocuments;
const escape=text=>text.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const body=text=>text.split('\n\n').map(p=>'<p>'+escape(p).replace(/https:\/\/[^\s<>]+|[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,t=>`<a href="${t.includes('@')&&!t.startsWith('https://')?'mailto:':''}${t}">${t}</a>`).replaceAll('\n','<br>')+'</p>').join('\n');
let patch='*** Begin Patch\n';const changed=[];
for(const [key,locales]of Object.entries(docs))for(const [file,lang]of [[`pages/${key}.html`,'de'],...(key==='datenschutz'?[['privacy.html','en']]:[])]){
 const old=await readFile(new URL('../'+file,import.meta.url),'utf8');const data=locales[lang];
 const content=`<main class="legal-page">\n    <div class="shell legal-content legal-document">\n      <p class="eyebrow">${lang==='de'?'Rechtliches':'Legal'}</p>\n      <h1>${escape(data.title)}</h1>\n      <p class="legal-date">${lang==='de'?'Stand':'Last updated'}: 14.10.2026</p>\n`+data.sections.map(([title,text],i)=>`      <section class="legal-section" id="${key}-${lang}-${i+1}">\n        <h2>${escape(title)}</h2>\n        ${body(text)}\n      </section>`).join('\n')+'\n    </div>\n  </main>';
 const next=old.replace(/\r\n/g,'\n').replace(/<main class="legal-page">[\s\S]*?<\/main>/,content);
 if(next.trim()===old.replace(/\r\n/g,'\n').trim())continue;changed.push(file);
 patch+=`*** Update File: ${file}\n@@\n`+old.trimEnd().split(/\r?\n/).map(l=>'-'+l).join('\n')+'\n'+next.trimEnd().split('\n').map(l=>'+'+l).join('\n')+'\n';
}
if(process.argv.includes('--patch'))console.log(patch+'*** End Patch');
else{console.log(changed.length?'Static legal HTML differs: '+changed.join(', '):'Static DE/EN legal documents match the shared source.');if(changed.length)process.exitCode=1;}
