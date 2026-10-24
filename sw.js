/* Cache only the public application shell. Personal schedules remain in local storage. */
const SHELL_VERSION = "4e144ad558f56e51";
const CACHE_PREFIX = `scheduler-shell:${new URL(self.registration.scope).pathname}:`;
const CACHE_NAME = CACHE_PREFIX + SHELL_VERSION;
const appURL = new URL("Application.html", self.registration.scope).href;
const shellURLs = [
  "Application.html",
  "manifest.webmanifest",
  "web/account-sync.js",
  "web/cloud-sync.js",
  "web/account.css",
  "web/study-companion.html",
  "web/study-companion.js",
  "web/glass.css",
  "web/icons/orbit-192.png",
  "web/icons/orbit-512.png",
  "web/icons/orbit-180.png",
].map((path) => new URL(path, self.registration.scope).href);

self.addEventListener("install", (event) => {
  // A failed download leaves the previous working version installed.
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(shellURLs)),
  );
  // Do not force activation or reload: a user may have unsaved notes open.
});
self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const names = await caches.keys();
      await Promise.all(
        names
          .filter(
            (name) => name.startsWith(CACHE_PREFIX) && name !== CACHE_NAME,
          )
          .map((name) => caches.delete(name)),
      );
      await self.clients.claim();
    })(),
  );
});
self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  const url = new URL(event.request.url);
  const canonical = url.origin + url.pathname;
  if (!shellURLs.includes(canonical)) return;
  event.respondWith(
    (async () => {
      const cache = await caches.open(CACHE_NAME);
      try {
        const response = await fetch(event.request);
        if (!response.ok) throw new Error("Shell unavailable");
        // Query parameters are UI shortcuts, never separate shell versions.
        // Refuse redirects so a sign-in page cannot replace the offline app.
        if (!response.redirected && response.type === "basic") {
          if (
            canonical !== appURL ||
            (await response.clone().text()).includes('id="workspace"')
          ) {
            await cache.put(canonical, response.clone()).catch(() => {});
          }
        }
        return response;
      } catch (error) {
        const saved = await cache.match(canonical);
        if (saved) return saved;
        return new Response(
          "Scheduler is not available offline yet. Open it online once, then try again.",
          {
            status: 503,
            headers: { "Content-Type": "text/plain; charset=utf-8" },
          },
        );
      }
    })(),
  );
});
