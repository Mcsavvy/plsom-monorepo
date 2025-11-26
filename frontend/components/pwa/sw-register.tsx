"use client";

import { useEffect } from "react";

export function ServiceWorkerRegister() {
  useEffect(() => {
    if (
      typeof window !== "undefined" &&
      "serviceWorker" in navigator &&
      process.env.NODE_ENV === "production"
    ) {
      // Check if service worker is already registered
      navigator.serviceWorker
        .getRegistrations()
        .then(registrations => {
          if (registrations.length > 0) {
            console.log("✅ Service Worker already registered");
            return;
          }

          // Add a small delay to ensure the page is fully loaded
          setTimeout(() => {
            // Register the service worker with proper error handling
            const registerSW = async () => {
              try {
                // First check if the service worker file exists
                const response = await fetch("/sw.js", { method: "HEAD" });
                if (!response.ok) {
                  console.warn(
                    "⚠️ Service Worker file not found, skipping registration"
                  );
                  return;
                }

                const registration = await navigator.serviceWorker.register(
                  "/sw.js",
                  {
                    scope: "/",
                  }
                );

                console.log(
                  "✅ Service Worker registered successfully:",
                  registration
                );

                // Check for updates
                registration.addEventListener("updatefound", () => {
                  const newWorker = registration.installing;
                  if (newWorker) {
                    newWorker.addEventListener("statechange", () => {
                      if (
                        newWorker.state === "installed" &&
                        navigator.serviceWorker.controller
                      ) {
                        // New content is available
                        console.log(
                          "🔄 New content available! Please refresh."
                        );

                        // Optionally show a toast or notification to user
                        if (
                          confirm(
                            "New version available! Would you like to update?"
                          )
                        ) {
                          window.location.reload();
                        }
                      }
                    });
                  }
                });
              } catch (error: any) {
                console.error("❌ Service Worker registration failed:", error);

                // Handle specific error types
                if (error.name === "SecurityError") {
                  console.error(
                    "Service Worker registration blocked by security policy"
                  );
                } else if (error.name === "InvalidStateError") {
                  console.error("Service Worker registration in invalid state");
                } else if (error.name === "NetworkError") {
                  console.error(
                    "Service Worker file not found or network error"
                  );
                } else {
                  console.error(
                    "Unknown Service Worker registration error:",
                    error
                  );
                }

                // Don't rethrow the error to prevent unhandled promise rejection
              }
            };

            registerSW();
          }, 1000); // 1 second delay
        })
        .catch(error => {
          console.error("❌ Failed to check existing registrations:", error);
        });

      // Listen for service worker messages
      navigator.serviceWorker.addEventListener("message", event => {
        const { type, payload } = event.data;

        switch (type) {
          case "NETWORK_STATUS_CHANGED":
            // Handle network status changes
            console.log(
              `📶 Network status: ${payload.online ? "Online" : "Offline"}`
            );

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

      // Add global error handler for unhandled promise rejections
      const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
        // Check if it's a service worker related error
        if (event.reason && typeof event.reason === "object") {
          const error = event.reason;
          if (error.message && error.message.includes("service worker")) {
            console.warn(
              "🚫 Caught Service Worker related unhandled rejection:",
              error
            );
            event.preventDefault(); // Prevent the error from being logged to console
            return;
          }
        }
      };

      window.addEventListener("unhandledrejection", handleUnhandledRejection);

      // Cleanup
      return () => {
        window.removeEventListener(
          "unhandledrejection",
          handleUnhandledRejection
        );
      };
    }
  }, []);

  return null;
}

export default ServiceWorkerRegister;
