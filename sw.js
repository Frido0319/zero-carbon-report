/* 三票互通 — 离线缓存 Service Worker v2
   修复：HTML 导航改为网络优先，内容更新后刷新即可生效；其他资产缓存优先 */
var CACHE = 'sanpiao-v2';
var ASSETS = [
  './san-piao-interchange.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png'
];

self.addEventListener('install', function(e){
  e.waitUntil(
    caches.open(CACHE).then(function(c){ return c.addAll(ASSETS); })
      .then(function(){ return self.skipWaiting(); })
  );
});

self.addEventListener('activate', function(e){
  e.waitUntil(
    caches.keys().then(function(keys){
      return Promise.all(keys.filter(function(k){ return k !== CACHE; })
        .map(function(k){ return caches.delete(k); }));
    }).then(function(){ return self.clients.claim(); })
  );
});

self.addEventListener('fetch', function(e){
  if (e.request.method !== 'GET') return;
  // 页面导航：网络优先，保证内容更新立即生效；断网回退缓存
  if (e.request.mode === 'navigate') {
    e.respondWith(
      fetch(e.request).then(function(net){
        var clone = net.clone();
        caches.open(CACHE).then(function(c){ c.put(e.request, clone); });
        return net;
      }).catch(function(){
        return caches.match(e.request).then(function(hit){
          return hit || caches.match('./san-piao-interchange.html');
        });
      })
    );
    return;
  }
  // 其他资源：缓存优先 + 运行时缓存
  e.respondWith(
    caches.match(e.request).then(function(resp){
      return resp || fetch(e.request).then(function(net){
        var clone = net.clone();
        caches.open(CACHE).then(function(c){ c.put(e.request, clone); });
        return net;
      });
    }).catch(function(){
      return caches.match('./san-piao-interchange.html');
    })
  );
});
