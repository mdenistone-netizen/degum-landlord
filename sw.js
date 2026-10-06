/* Degum Landlord service worker (separate from Degum Water Manager). Offline-first: the cached app opens instantly and refreshes in the background; a new version applies on the next open. */
const CACHE='degum-landlord-v3.0.0';
const SHELL=['/','/index.html','/manifest.json','/icon-192.png','/icon-512.png'];
self.addEventListener('install',e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(SHELL.map(u=>new Request(u,{cache:'reload'})))).then(()=>self.skipWaiting())));
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(n=>(n.startsWith('degum-fms-')||n.startsWith('degum-landlord-'))&&n!==CACHE).map(n=>caches.delete(n)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',e=>{const r=e.request;if(r.method!=='GET'||new URL(r.url).origin!==location.origin)return;
 const net=fetch(r,{cache:'no-store'}).then(res=>{if(res.ok){const c=res.clone();caches.open(CACHE).then(x=>x.put(r,c))}return res}).catch(()=>null);
 e.respondWith(caches.match(r).then(m=>m||net.then(res=>res||(r.mode==='navigate'?caches.match('/index.html'):Response.error()))));e.waitUntil(net)});
