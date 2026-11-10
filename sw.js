'use strict';
const VERSION='2026.11.final.1';
const SHELL='nkfuen-final-shell-'+VERSION;
const MEDIA='nkfuen-final-media-'+VERSION;
const BASE=new URL('./',self.location).href;
const FILES=['./','index.html','style.css?v='+VERSION,'app.js?v='+VERSION,'data.js?v='+VERSION,'state.js?v='+VERSION,'migration.js?v='+VERSION,'manifest.webmanifest','icon-192.png','icon-512.png','icon-maskable.png','apple-touch-icon.png'];
self.addEventListener('install',event=>event.waitUntil((async()=>{
  const cache=await caches.open(SHELL);await cache.addAll(FILES.map(p=>new URL(p,BASE).href));await self.skipWaiting();
})()));
self.addEventListener('activate',event=>event.waitUntil((async()=>{
  const keys=await caches.keys();
  await Promise.all(keys.filter(k=>k.startsWith('nkfuen-')&&k!==SHELL&&k!==MEDIA).map(k=>caches.delete(k)));
  await self.clients.claim();
})()));
self.addEventListener('fetch',event=>{
  const request=event.request,url=new URL(request.url);
  if(request.method!=='GET'||url.origin!==self.location.origin||!url.href.startsWith(BASE))return;
  if(request.mode==='navigate'){
    event.respondWith((async()=>{
      try{const response=await fetch(request);if(response.ok)return response;throw new Error('navigation');}
      catch{return await caches.match(new URL('index.html',BASE).href)||new Response('暂时离线。请先联网打开一次日本旅记。',{status:503,headers:{'Content-Type':'text/plain;charset=utf-8'}});}
    })());return;
  }
  event.respondWith((async()=>{
    const cached=await caches.match(request);if(cached)return cached;
    try{
      const response=await fetch(request);
      if(response.ok){try{const cache=await caches.open(/\.(png|jpe?g|webp)$/i.test(url.pathname)?MEDIA:SHELL);await cache.put(request,response.clone());}catch{/* A full cache must not interrupt an online response. */}}
      return response;
    }catch{return new Response('Offline asset unavailable',{status:503,headers:{'Content-Type':'text/plain;charset=utf-8'}});}
  })());
});
