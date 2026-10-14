import {build} from 'esbuild';
import {readFile,readdir,writeFile} from 'node:fs/promises';
import path from 'node:path';

export async function bundleSupabase(root,outfile,target='es2020') {
  const result=await build({stdin:{contents:'export { createClient } from "@supabase/supabase-js";',resolveDir:root,sourcefile:'supabase-entry.js'},bundle:true,format:'esm',platform:'browser',target,minify:true,legalComments:'eof',metafile:true,outfile});
  const packages=new Set();
  for(const name of Object.keys(result.metafile.inputs)) {
    if(!name.includes('node_modules/'))continue;
    const parts=name.split('node_modules/').at(-1).split('/');
    packages.add(parts.slice(0,parts[0].startsWith('@')?2:1).join('/'));
  }
  const notices=[];
  for(const name of [...packages].sort()) {
    const directory=path.join(root,'node_modules',name);
    const meta=JSON.parse(await readFile(path.join(directory,'package.json'),'utf8'));
    notices.push(`${meta.name} ${meta.version}\nLicense: ${meta.license || 'See license text'}`);
    for(const file of await readdir(directory))if(/^(?:licen[sc]e|notice)(?:\.|$)/i.test(file))notices.push(await readFile(path.join(directory,file),'utf8'));
  }
  await writeFile(path.join(path.dirname(outfile),'THIRD_PARTY_NOTICES.txt'),notices.join('\n\n--------------------\n\n'));
}
