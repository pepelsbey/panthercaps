/* Service worker: precache the app shell, then serve it cache-first so the app works with no network. Icons
   aren't precached: they're only fetched online, when adding to the Home Screen.
   VERSION and FILES are stamped into dist/sw.js by tools/build.js: the version is a hash of the app files, and a new
   version replaces the old cache. */
var VERSION = "dev";
var CACHE = "prompter-" + VERSION;
var FILES = [];

self.addEventListener("install", function (e) {
	e.waitUntil(
		caches.open(CACHE).then(function (c) {
			return c.addAll(FILES.map(function (f) { return new Request(f, { cache: "reload" }); }));
		}).then(function () { return self.skipWaiting(); })
	);
});

self.addEventListener("activate", function (e) {
	e.waitUntil(
		caches.keys().then(function (keys) {
			return Promise.all(keys.filter(function (k) { return k.indexOf("prompter-") === 0 && k !== CACHE; })
				.map(function (k) { return caches.delete(k); }));
		}).then(function () { return self.clients.claim(); })
	);
});

self.addEventListener("fetch", function (e) {
	if (e.request.method !== "GET") return;
	e.respondWith(
		caches.match(e.request, { ignoreSearch: true }).then(function (hit) {
			if (hit) return hit;
			return fetch(e.request).catch(function () {
				if (e.request.mode === "navigate") return caches.match("./");
				return Response.error();
			});
		})
	);
});
