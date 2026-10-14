import test from 'node:test';
import assert from 'node:assert/strict';
import {build} from 'esbuild';
import {fetchCompanyData} from '../company-data-client.js';

const bundle=await build({entryPoints:['supabase/functions/fetch-company-data/index.ts'],bundle:true,write:false,format:'esm',platform:'neutral'});
let handler;
globalThis.Deno={env:{get:key=>({SUPABASE_URL:'https://test.invalid',SUPABASE_ANON_KEY:'test-only',SUPABASE_SERVICE_ROLE_KEY:'test-only'}[key])},serve:fn=>{handler=fn;}};
await import('data:text/javascript;base64,'+Buffer.from(bundle.outputFiles[0].text).toString('base64'));
const originalFetch=globalThis.fetch;
const json=(value,status=200)=>new Response(JSON.stringify(value),{status});
const request=body=>new Request('https://test.invalid/functions/v1/fetch-company-data',{method:'POST',headers:{Authorization:'Bearer test-only','Content-Type':'application/json'},body:JSON.stringify(body)});
const fact=val=>({units:{USD:[{val,form:'10-K',fy:2025,fp:'FY',start:'2025-01-01',end:'2025-12-31',filed:'2026-02-01'}]}});
function mock(mode='ok'){
 globalThis.fetch=async(url)=>{
  url=String(url);
  if(url.endsWith('/auth/v1/user'))return json({id:'test-user'});
  if(url.endsWith('company_tickers.json'))return json({0:{ticker:'MSFT',title:'Microsoft',cik_str:789019}});
  if(url.includes('/companyfacts/'))return mode==='sec-failure'?json({},503):json({entityName:'Microsoft',facts:{'us-gaap':{Revenues:fact(100),NetIncomeLoss:fact(20),StockholdersEquity:fact(50)}}});
  if(url.includes('stooq.com')){if(mode==='quote-failure')throw new Error('Quote unavailable');return new Response('Symbol,Date,Time,Open,High,Low,Close,Volume\nMSFT.US,2026-10-14,16:00,400,410,390,405,100');}
  if(url.includes('/rpc/company_selection_issue_v1'))return json([{selectionId:'11111111-1111-4111-8111-111111111111'}]);
  throw new Error('Unexpected test URL');
 };
}
test('SEC function preserves authentication, search, selection, financial values and failures',async()=>{
 try{
  mock();
  assert.equal((await handler(new Request('https://test.invalid',{method:'OPTIONS'}))).status,204);
  assert.equal((await handler(new Request('https://test.invalid',{method:'POST'}))).status,401);
  assert.equal((await handler(request({ticker:'!'}))).status,404);
  assert.equal((await handler(request({ticker:'ZZZZZZ'}))).status,404);
  const search=await(await handler(request({action:'search',query:'MSFT'}))).json();assert.equal(search.companies[0].ticker,'MSFT');
  const select=await(await handler(request({action:'select',ticker:'MSFT'}))).json();assert.match(select.selectionId,/^11111111-/);
  const financials=await(await handler(request({ticker:'MSFT'}))).json();assert.equal(financials.revenue,100);assert.equal(financials.roe,40);assert.equal(financials.assets,null);
  mock('quote-failure');const partial=await handler(request({ticker:'MSFT'}));assert.equal(partial.status,200);assert.equal((await partial.json()).marketPrice,null);
  mock('sec-failure');const failed=await handler(request({ticker:'MSFT'}));assert.equal(failed.status,503);assert.equal((await failed.json()).code,'sec_unavailable');
 }finally{globalThis.fetch=originalFetch;delete globalThis.Deno;}
});
test('upstream deadlines include a stalled body and abort network work',async()=>{
 const compiled=await build({entryPoints:['supabase/functions/fetch-company-data/upstream.ts'],bundle:true,write:false,format:'esm'});
 const {upstream}=await import('data:text/javascript;base64,'+Buffer.from(compiled.outputFiles[0].text).toString('base64'));
 let signal;
 try{
  globalThis.fetch=async(_url,init)=>{signal=init.signal;return new Response('');};
  await assert.rejects(upstream('test','https://test.invalid',{},20,()=>new Promise(()=>{})),{code:'upstream_timeout'});
  assert.equal(signal.aborted,true);
 }finally{globalThis.fetch=originalFetch;}
});
test('client shows timeouts even if session refresh never completes, and normalizes errors',async()=>{
 let signal;
 await assert.rejects(fetchCompanyData({functions:{invoke:(_name,options)=>{signal=options.signal;return new Promise(()=>{});}}},'MSFT',{timeoutMs:20}),{code:'request_timeout'});
 assert.equal(signal.aborted,true);
 const failure=status=>({functions:{invoke:async()=>({error:{context:new Response('',{status})}})}});
 await assert.rejects(fetchCompanyData(failure(401),'MSFT'),{code:'authentication_required'});
 await assert.rejects(fetchCompanyData(failure(429),'MSFT'),{code:'rate_limited'});
 const success={functions:{invoke:async()=>({data:{ticker:'MSFT',revenue:100},error:null})}};
 assert.equal((await fetchCompanyData(success,'MSFT')).revenue,100);
});
