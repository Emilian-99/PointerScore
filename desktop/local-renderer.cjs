const fs = require("node:fs/promises");
const path = require("node:path");

const APP_ORIGIN = "https://pointerscore.com";
const LOCAL_HOSTS = new Set(["pointerscore.com", "www.pointerscore.com"]);
const TYPES = {".html":"text/html; charset=utf-8",".js":"application/javascript; charset=utf-8",".css":"text/css; charset=utf-8",".json":"application/json",".webmanifest":"application/manifest+json",".png":"image/png",".svg":"image/svg+xml",".ico":"image/x-icon",".woff2":"font/woff2",".pdf":"application/pdf"};

function isAppURL(value) {
  try { const url=new URL(value);return url.protocol==="https:" && LOCAL_HOSTS.has(url.hostname) && !url.port && !url.username && !url.password; }
  catch {return false;}
}

function resolveAsset(root, value) {
  const url=new URL(value);
  if(!isAppURL(url)) return null;
  let name=decodeURIComponent(url.pathname);
  if(name.includes("\\") || name.includes("\0") || name.split("/").some(part=>part.startsWith("."))) return null;
  // Previously prepared /app/ routes are also resolved from the installed bundle.
  name=name.replace(/^\/app(?=\/|$)/, "");
  if(!name || name.endsWith("/")) name+="index.html";
  const target=path.resolve(root,"."+name);
  const relative=path.relative(root,target);
  return relative && !relative.startsWith("..") && !path.isAbsolute(relative) ? target : null;
}

async function serveLocal(root, request) {
  if(!["GET","HEAD"].includes(request.method)) return new Response("Method not allowed",{status:405});
  let target;
  try {target=resolveAsset(root,request.url);}catch{return new Response("Bad request",{status:400});}
  if(!target)return new Response("Not found",{status:404});
  try {
    const content=await fs.readFile(target);
    return new Response(request.method==="HEAD"?null:content,{headers:{"Content-Type":TYPES[path.extname(target)]||"application/octet-stream","Cache-Control":"no-store","X-Content-Type-Options":"nosniff","X-PointerScore-Renderer":"bundled"}});
  } catch {
    // Deliberately no fallback to the website, even for missing assets or offline startup.
    return new Response("This file is not included in the installed PointerScore version.",{status:404});
  }
}

async function installLocalRenderer(session, root, fetchRemote = request => session.fetch(request,{bypassCustomProtocolHandlers:true})) {
  await fs.access(path.join(root,"dashboard.html"));
  await fs.access(path.join(root,"vendor","supabase.js"));
  session.protocol.handle("https",request=>isAppURL(request.url)
    ? serveLocal(root,request)
    : fetchRemote(request));
}

function callbackURL(value) {
  try {
    if(typeof value!=="string" || value.length>20000)return null;
    const input=new URL(value);
    if(input.protocol!=="pointerscore:" || input.hostname!=="auth" || input.pathname!=="/callback" || input.username || input.password || input.port)return null;
    const output=new URL("/auth.html",APP_ORIGIN);
    if(input.searchParams.get("mode")==="recovery")output.searchParams.set("mode","recovery");
    const code=input.searchParams.get("code");
    const fragment=new URLSearchParams(input.hash.slice(1));
    if(code)output.searchParams.set("code",code);
    else if(fragment.get("access_token") && fragment.get("refresh_token")) {
      const hash=new URLSearchParams();
      for(const key of ["access_token","refresh_token","type","expires_in","expires_at","token_type"]){if(fragment.has(key))hash.set(key,fragment.get(key));}
      output.hash=hash.toString();
      if(fragment.get("type")==="recovery")output.searchParams.set("mode","recovery");
    } else return null;
    return output.href;
  }catch{return null;}
}

function safeExternalURL(value) {
  try {const url=new URL(value);return ["https:","http:","mailto:"].includes(url.protocol)&&!url.username&&!url.password;}
  catch{return false;}
}

module.exports={APP_ORIGIN,isAppURL,resolveAsset,serveLocal,installLocalRenderer,callbackURL,safeExternalURL};
