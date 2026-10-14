import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFile} from 'node:fs/promises';
import {createRequire} from 'node:module';
import path from 'node:path';
import {routePage,appRoutes} from './site-layout.mjs';
const require=createRequire(import.meta.url);
const {resolveAsset,isAppURL,callbackURL,safeExternalURL,serveLocal}=require('../desktop/local-renderer.cjs');

function navigate(value,desktop=false){
 const url=new URL(value,'https://pointerscore.com');let destination=null;
 vm.runInNewContext(routePage().match(/<script>([\s\S]*?)<\/script>/)[1],{URL,window:{PointerScoreDesktop:desktop?{isDesktopApp:true}:undefined},location:{href:url.href,replace:next=>{destination=next;}}});
 return destination;
}
test('Website routes contain no app UI, browsers see app information, old desktop gets update notice',()=>{
 for(const route of appRoutes){
  assert.equal(navigate('/'+route+'?desktopApp=1'),'/#apps');
  assert.equal(navigate('/'+route,true),null);
 }
 assert.match(routePage(),/Installiere bitte die neue Desktop-Version/);
 assert.doesNotMatch(routePage(),/<form|score-form|runtime-config/);
});
test('Email callbacks reach dedicated page without publishing a calculator',()=>{
 for(const value of ['/dashboard.html?code=sample','/auth.html?mode=recovery&code=sample','/auth.html#access_token=sample&refresh_token=sample&type=recovery']){
  const url=new URL(value,'https://pointerscore.com');
  assert.equal(navigate(value),'/auth-callback/'+url.search+url.hash);
 }
});
test('Local asset resolver cannot escape the packaged renderer',()=>{
 const root=path.resolve('desktop/renderer');
 assert.equal(resolveAsset(root,'https://pointerscore.com/rechner/?x=1'),path.join(root,'rechner','index.html'));
 assert.equal(resolveAsset(root,'https://pointerscore.com/app/dashboard.html'),path.join(root,'dashboard.html'));
 for(const url of ['https://evil.example/dashboard.html','http://pointerscore.com/dashboard.html','https://pointerscore.com:9000/dashboard.html','https://user@pointerscore.com/dashboard.html','https://pointerscore.com/.env.local','https://pointerscore.com/%2e%2e%2fsecret','https://pointerscore.com/a%5c..%5csecret']){
  assert.equal(resolveAsset(root,url),null,url);
 }
 assert.equal(isAppURL('https://pointerscore.com.evil.example/'),false);
});
test('Missing local files return 404 without falling back to the live website',async()=>{
 const response=await serveLocal(path.resolve('desktop/renderer'),new Request('https://pointerscore.com/missing-never-published.js'));
 assert.equal(response.status,404);
 assert.equal((await serveLocal(path.resolve('desktop/renderer'),new Request('https://pointerscore.com/dashboard.html',{method:'POST'}))).status,405);
});
test('Only safe explicit desktop auth callbacks are accepted; redirects cannot be injected',()=>{
 assert.equal(callbackURL('pointerscore://auth/callback?code=sample&redirect=https://evil.example'),'https://pointerscore.com/auth.html?code=sample');
 assert.equal(callbackURL('pointerscore://auth/callback?mode=recovery&code=sample'),'https://pointerscore.com/auth.html?mode=recovery&code=sample');
 assert.match(callbackURL('pointerscore://auth/callback#access_token=sample&refresh_token=sample&type=recovery'),/^https:\/\/pointerscore.com\/auth.html\?mode=recovery#/);
 for(const url of ['pointerscore://evil/callback?code=x','pointerscore://auth/not-callback?code=x','pointerscore://user@auth/callback?code=x','pointerscore://auth/callback?redirect=dashboard','file:///etc/passwd','https://pointerscore.com/auth.html?code=x'])assert.equal(callbackURL(url),null);
 for(const url of ['javascript:alert(1)','file:///c:/secret','pointerscore://evil/callback'])assert.equal(safeExternalURL(url),false);
 assert.equal(safeExternalURL('https://apps.microsoft.com/detail/9PJQQX25V0C7'),true);
});
test('Information website has no paid checkout or functional calculator',async()=>{
 const html=await readFile(new URL('../dist/index.html',import.meta.url),'utf8');
 assert.doesNotMatch(html,/<form\b|href="auth\.html|data-calculator-demo|0 €|dauerhaft kostenlos|ohne Abo/);
 assert.match(html,/id="apps"/);assert.match(html,/Google-Play-Link folgt/);assert.match(html,/9PJQQX25V0C7/);
});
async function callback(value,{fail=false,verify=true}={}){
 const source=(await readFile(new URL('auth-callback.js',import.meta.url),'utf8')).replace(/^import[^\n]+\n/,'');
 const nodes=new Map();const calls=[];
 const node=selector=>{if(!nodes.has(selector))nodes.set(selector,{hidden:true,textContent:'',addEventListener(event,fn){this[event]=fn;}});return nodes.get(selector);};
 const context={URL,URLSearchParams,console,window:{location:{href:'https://pointerscore.com'+value}},document:{querySelector:node},history:{replaceState:(a,b,url)=>calls.push(['clean',url])},supabase:{auth:{
  exchangeCodeForSession:async code=>{calls.push(['exchange',code]);return {error:fail?new Error('expired'):null,data:{session:fail?null:{}}};},
  setSession:async()=>({error:null,data:{session:{}}}),
  getUser:async()=>{calls.push(['user']);return {data:{user:{id:'test'}},error:null};}
 }}};
 await vm.runInNewContext('(async()=>{'+source+'})()',context);
 if(verify)await node('[data-verify-browser]').click();
 return {message:node('[data-callback-message]').textContent,visible:!node('[data-recovery-form]').hidden,calls,app:node('[data-open-desktop]')};
}
test('Public callbacks offer native deep link first and do not consume a desktop PKCE code',async()=>{
 const result=await callback('/auth-callback/?mode=recovery&code=sample',{verify:false});
 assert.equal(result.calls.length,0);assert.equal(result.app.hidden,false);assert.match(result.app.href,/^pointerscore:\/\/auth\/callback\?code=sample&mode=recovery/);
});
test('Browser fallback verifies code before allowing a password change',async()=>{
 assert.match((await callback('/auth-callback/?code=sample')).message,/E-Mail-Adresse ist bestätigt/);
 assert.equal((await callback('/auth-callback/?mode=recovery&code=sample')).visible,true);
 for(const [value,options]of [['/auth-callback/?mode=recovery',{}],['/auth-callback/?mode=recovery&code=expired',{fail:true}],['/auth-callback/?mode=recovery#error=expired',{}]]){
  const result=await callback(value,options);assert.equal(result.visible,false);assert.match(result.message,/nicht bestätigt/);assert.equal(result.calls.filter(c=>c[0]==='user').length,0);assert.ok(result.calls.some(c=>c[0]==='clean'&&c[1]==='/auth-callback/'));
 }
});
