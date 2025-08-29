"use client";

import { useEffect } from "react";

export function ServiceWorkerRegister() {
  useEffect(() => {
    if (
      typeof window !== "undefined" &&
      "serviceWorker" in navigator &&
      process.env.NODE_ENV === "production"
    ) {
      // Register the service worker
      navigator.serviceWorker
        .register("/sw.js", {
          scope: "/",
        })
        .then((registration) => {
          console.log("✅ Service Worker registered successfully:", registration);
          
          // Check for updates
          registration.addEventListener("updatefound", () => {
            const newWorker = registration.installing;
            if (newWorker) {
              newWorker.addEventListener("statechange", () => {
                if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
                  // New content is available
                  console.log("🔄 New content available! Please refresh.");
                  
                  // Optionally show a toast or notification to user
                  if (confirm("New version available! Would you like to update?")) {
                    window.location.reload();
                  }
                }
              });
            }
          });
        })
        .catch((error) => {
          console.error("❌ Service Worker registration failed:", error);
        });

      // Listen for service worker messages
      navigator.serviceWorker.addEventListener("message", (event) => {
        const { type, payload } = event.data;
        
        switch (type) {
          case "NETWORK_STATUS_CHANGED":
            // Handle network status changes
            console.log(`📶 Network status: ${payload.online ? "Online" : "Offline"}`);
            
            // Dispatch custom event for network status
            window.dispatchEvent(
              new CustomEvent("networkstatuschange", {
                detail: payload,
              })
            );
            break;
            
          default:
            console.log("📨 SW Message:", type, payload);
        }
      });

      // Handle service worker controller change
      navigator.serviceWorker.addEventListener("controllerchange", () => {
        console.log("🔄 Service Worker controller changed");
        window.location.reload();
      });
    }
  }, []);

  return null;
}

export default ServiceWorkerRegister;



