const CACHE = "uao-v1";
const CORE = ["./", "./index.html", "./manifest.json", "./icon-192.png", "./icon-512.png"];
self.addEventListener("install", function (e) {
  e.waitUntil(caches.open(CACHE).then(function (c) { return c.addAll(CORE); }).then(function () { return self.skipWaiting(); }));
});
self.addEventListener("activate", function (e) {
  e.waitUntil(caches.keys().then(function (keys) {
    return Promise.all(keys.filter(function (k) { return k !== CACHE; }).map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});
self.addEventListener("fetch", function (e) {
  var url = new URL(e.request.url);
  // API va video oqimi — faqat tarmoqdan, cache'ga olinmaydi
  if (url.pathname.indexOf("/api/") !== -1) return;
  if (e.request.url.indexOf("animed-test.fadehost.app") !== -1) return;
  var isNav = e.request.mode === "navigate" || url.pathname === "/" || url.pathname.endsWith("/index.html");
  if (isNav) {
    // Sahifa har doim tarmoqdan yangilanadi, offline bo'lsa cache'dan
    e.respondWith(
      fetch(e.request).then(function (resp) {
        var copy = resp.clone();
        caches.open(CACHE).then(function (c) { c.put(e.request, copy); });
        return resp;
      }).catch(function () { return caches.match(e.request).then(function (r) { return r || caches.match("./index.html"); }); })
    );
    return;
  }
  e.respondWith(
    caches.match(e.request).then(function (res) {
      return res || fetch(e.request).then(function (resp) {
        var copy = resp.clone();
        if (e.request.method === "GET" && url.origin === location.origin) {
          caches.open(CACHE).then(function (c) { c.put(e.request, copy); });
        }
        return resp;
      }).catch(function () { return caches.match("./index.html"); });
    })
  );
});
