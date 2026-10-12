/* Degum Landlord service worker (separate from Degum Water Manager). Offline-first: the cached app opens instantly and refreshes in the background; a new version applies on the next open.
   access-control.js is network-first. A failed, non-OK, empty or unparseable network answer NEVER replaces a good cached copy; the cached copy is used instead (marked x-dg-cache so the app knows it was not freshly verified). */
const CACHE='degum-landlord-v3.1.0';
const AC='/access-control.js';
const SHELL=['/','/index.html','/manifest.json',AC,'/icon-192.png','/icon-512.png'];
self.addEventListener('install',e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(SHELL.map(u=>new Request(u,{cache:'reload'})))).then(()=>self.skipWaiting())));
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(n=>(n.startsWith('degum-fms-')||n.startsWith('degum-landlord-'))&&n!==CACHE).map(n=>caches.delete(n)))).then(()=>self.clients.claim())));
function fromCache(bad){return caches.match(AC).then(m=>{if(!m)return bad||Response.error();const h=new Headers(m.headers);h.set('x-dg-cache','1');return m.blob().then(b=>new Response(b,{status:200,headers:h}))})}
async function goodAccessFile(res){if(!res.ok)return false;const t=await res.clone().text();if(t.indexOf('DEGUM_CUSTOMERS')<0)return false;try{new Function(t)}catch(e){return false}return true}
self.addEventListener('fetch',e=>{const r=e.request;if(r.method!=='GET'||new URL(r.url).origin!==location.origin)return;
 if(new URL(r.url).pathname===AC){e.respondWith(fetch(r,{cache:'no-store'}).then(async res=>{if(await goodAccessFile(res)){const c=await caches.open(CACHE);await c.put(AC,res.clone());return res}return fromCache(res)}).catch(()=>fromCache(null)));return}
 const net=fetch(r,{cache:'no-store'}).then(res=>{if(res.ok){const c=res.clone();caches.open(CACHE).then(x=>x.put(r,c))}return res}).catch(()=>null);
 e.respondWith(caches.match(r).then(m=>m||net.then(res=>res||(r.mode==='navigate'?caches.match('/index.html'):Response.error()))));e.waitUntil(net)});
