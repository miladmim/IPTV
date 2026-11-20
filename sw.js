/* Parto TV - Service Worker for GitHub / GitLab Pages & PWA Offline Shell */
var CACHE = 'parto-tv-static-v1';
var SHELL = [
  './',
  'index.html',
  'style.css',
  'app.js',
  'favicon.svg',
  'manifest.webmanifest',
  'vendor/hls.min.js',
  'data/channels.json'
];

self.addEventListener('install', function (e) {
  e.waitUntil(
    caches.open(CACHE).then(function (c) {
      return c.addAll(SHELL);
    }).then(function () {
      return self.skipWaiting();
    })
  );
});

self.addEventListener('activate', function (e) {
  e.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(
        keys.filter(function (k) { return k !== CACHE; }).map(function (k) { return caches.delete(k); })
      );
    }).then(function () {
      return self.clients.claim();
    })
  );
});

self.addEventListener('fetch', function (e) {
  var req = e.request, url = new URL(req.url);
  // Never intercept video segments or live m3u8 requests
  if (req.method !== 'GET' || url.origin !== location.origin) return;
  if (/\.(m3u8?|ts|mp4|aac|mp3)$/i.test(url.pathname)) return;

  e.respondWith(
    caches.match(req).then(function (cached) {
      if (cached) {
        // Fetch fresh version in background
        fetch(req).then(function (res) {
          if (res && res.ok) {
            caches.open(CACHE).then(function (c) { c.put(req, res); });
          }
        }).catch(function () {});
        return cached;
      }
      return fetch(req).then(function (res) {
        if (res.ok && SHELL.some(function (p) { return url.pathname.slice(-p.length) === p.replace('./', ''); })) {
          var copy = res.clone();
          caches.open(CACHE).then(function (c) { c.put(req, copy); });
        }
        return res;
      });
    })
  );
});
