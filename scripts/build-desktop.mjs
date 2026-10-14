import {cp,mkdir,readFile,writeFile,rm} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {bundleSupabase} from './bundle-supabase.mjs';
import {appEntries,legalAliases} from './site-layout.mjs';
import './generate-config.mjs';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
export const renderer=path.join(root,'desktop','renderer');
// Fixed generated directory only, never installed user data.
await rm(renderer,{recursive:true,force:true});
await mkdir(renderer,{recursive:true});
for(const entry of [...appEntries,'assets','pages','style.css','i18n.js','legal-pages.js','legal-content.js','privacy.html','favicon.ico','site.webmanifest']) {
  await cp(path.join(root,entry),path.join(renderer,entry),{recursive:true});
}
await cp(path.join(root,'public','pdfs'),path.join(renderer,'pdfs'),{recursive:true});
await mkdir(path.join(renderer,'vendor'),{recursive:true});
await bundleSupabase(root,path.join(renderer,'vendor','supabase.js'),'chrome126');
const client=await readFile(path.join(root,'auth-client.js'),'utf8');
await writeFile(path.join(renderer,'auth-client.js'),client.replace('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm','./vendor/supabase.js'));
await cp(path.join(root,'node_modules','@supabase','supabase-js','LICENSE'),path.join(renderer,'vendor','SUPABASE-LICENSE'));
for(const [old,current]of Object.entries(legalAliases))await writeFile(path.join(renderer,'pages',old),`<!doctype html><meta http-equiv="refresh" content="0;url=${current}"><a href="${current}">PointerScore</a>`);
await writeFile(path.join(renderer,'index.html'),'<!doctype html><meta charset="utf-8"><meta http-equiv="refresh" content="0;url=auth.html"><a href="auth.html">PointerScore</a>');
console.log('Standalone desktop renderer built locally, including fonts and Supabase client.');
