const CACHE_NAME = 'vinyl-vault-cache-v1';
const ASSETS = [
  './',
  './index.html',
  './style.css',
  './script.js',
  './manifest.json'
];

self.addEventListener('install', e=>{
  e.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS)).then(()=>self.skipWaiting()));
});

self.addEventListener('activate', e=>{
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.map(k => { if(k !== CACHE_NAME) return caches.delete(k);}))));
  self.clients.claim();
});

self.addEventListener('fetch', e=>{
  e.respondWith(caches.match(e.request).then(r => r || fetch(e.request)));
});
