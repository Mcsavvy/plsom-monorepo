import type { PrecacheEntry, SerwistGlobalConfig } from "serwist";
import { Serwist, NetworkFirst, CacheFirst, StaleWhileRevalidate } from "serwist";

// This declares the value of `injectionPoint` to TypeScript.
// `injectionPoint` is the string that will be replaced by the
// actual precache manifest. By default, this string is set to
// `"self.__SW_MANIFEST"`.
declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}

declare const self: ServiceWorkerGlobalScope;

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  disableDevLogs: true,
  runtimeCaching: [
    // Cache API routes
    {
      matcher: /^https?:\/\/.*\/api\/.*/i,
      handler: new NetworkFirst({
        cacheName: "api-cache",
        networkTimeoutSeconds: 10,
        plugins: [
          {
            cacheKeyWillBeUsed: async ({ request }: { request: Request }) => {
              return `${request.url}?${new Date().toDateString()}`;
            },
          },
        ],
      }),
    },
    // Cache static assets (images, fonts, etc.)
    {
      matcher: /\.(?:png|jpg|jpeg|svg|gif|webp|ico|woff|woff2|ttf|otf)$/i,
      handler: new CacheFirst({
        cacheName: "static-assets",
      }),
    },
    // Cache CSS and JS files
    {
      matcher: /\.(?:js|css)$/i,
      handler: new StaleWhileRevalidate({
        cacheName: "static-resources",
      }),
    },
    // Cache Google Fonts
    {
      matcher: /^https:\/\/fonts\.(?:gstatic)\.com\/.*/i,
      handler: new CacheFirst({
        cacheName: "google-fonts-webfonts",
      }),
    },
    {
      matcher: /^https:\/\/fonts\.(?:googleapis)\.com\/.*/i,
      handler: new StaleWhileRevalidate({
        cacheName: "google-fonts-stylesheets",
      }),
    },
    // Cache pages with NetworkFirst strategy for better offline experience
    {
      matcher: /^https?:\/\/.*\/(courses|classes|profile|tests|submissions).*/i,
      handler: new NetworkFirst({
        cacheName: "pages-cache",
        networkTimeoutSeconds: 5,
      }),
    },
    // Cache other pages with NetworkFirst
    {
      matcher: ({ request }: { request: Request }) => request.mode === "navigate",
      handler: new NetworkFirst({
        cacheName: "navigation-cache",
        networkTimeoutSeconds: 3,
      }),
    },
  ],
  fallbacks: {
    entries: [
      {
        url: "/offline",
        matcher: ({ request }: { request: Request }) => request.destination === "document",
      },
    ],
  },
});

serwist.addEventListeners();

// Enhanced offline detection and sync
self.addEventListener("online", () => {
  console.log("📶 Back online!");
  // Notify all clients about online status
  self.clients.matchAll().then((clients) => {
    clients.forEach((client) => {
      client.postMessage({
        type: "NETWORK_STATUS_CHANGED",
        payload: { online: true },
      });
    });
  });
});

self.addEventListener("offline", () => {
  console.log("📵 Gone offline!");
  // Notify all clients about offline status
  self.clients.matchAll().then((clients) => {
    clients.forEach((client) => {
      client.postMessage({
        type: "NETWORK_STATUS_CHANGED",
        payload: { online: false },
      });
    });
  });
});

// Handle background sync for form submissions
self.addEventListener("sync", (event) => {
  if (event.tag === "form-sync") {
    event.waitUntil(syncForms());
  }
});

async function syncForms() {
  try {
    // Retrieve pending form submissions from IndexedDB or cache
    const pendingSubmissions = await getPendingSubmissions();
    
    for (const submission of pendingSubmissions) {
      try {
        const response = await fetch(submission.url, {
          method: submission.method,
          headers: submission.headers,
          body: submission.body,
        });
        
        if (response.ok) {
          // Remove successful submission from queue
          await removePendingSubmission(submission.id);
        }
      } catch (error) {
        console.log("Failed to sync form submission:", error);
      }
    }
  } catch (error) {
    console.log("Background sync failed:", error);
  }
}

// Types for form sync
interface PendingSubmission {
  id: string;
  url: string;
  method: string;
  headers: Record<string, string>;
  body: string;
}

// Placeholder functions for form sync (to be implemented based on needs)
async function getPendingSubmissions(): Promise<PendingSubmission[]> {
  // Implement IndexedDB or cache retrieval logic
  return [];
}

async function removePendingSubmission(id: string) {
  // Implement removal logic
  console.log("Removing pending submission:", id);
}

// Handle push notifications (if needed in the future)
self.addEventListener("push", (event) => {
  if (!event.data) return;

  const data = event.data.json();
  const { title, body, icon, badge, tag, url } = data;

  event.waitUntil(
    self.registration.showNotification(title, {
      body,
      icon: icon || "/icon-192x192.png",
      badge: badge || "/icon-192x192.png",
      tag,
      data: { url },
      actions: [
        {
          action: "open",
          title: "Open",
        },
        {
          action: "close",
          title: "Close",
        },
      ],
    } as NotificationOptions)
  );
});

// Handle notification click
self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  if (event.action === "open" || event.action === "") {
    const url = event.notification.data?.url || "/";
    event.waitUntil(
      self.clients.matchAll({ type: "window" }).then((clients) => {
        // Check if there is already a window/tab open with the target URL
        for (const client of clients) {
          if (client.url === url && "focus" in client) {
            return client.focus();
          }
        }
        // If no window/tab is already open, open a new one
        if (self.clients.openWindow) {
          return self.clients.openWindow(url);
        }
      })
    );
  }
});

console.log("🔧 Service Worker loaded with enhanced caching and offline support");
