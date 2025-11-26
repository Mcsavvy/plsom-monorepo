"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "./auth";
import { apiClient } from "@/lib/api-client";

interface PushSubscriptionData {
  endpoint: string;
  p256dh: string;
  auth: string;
}

export function usePushNotifications() {
  const { isAuthenticated } = useAuth();
  const [isSupported, setIsSupported] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>("default");
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Check if push notifications are supported
  useEffect(() => {
    const supported =
      "Notification" in window &&
      "serviceWorker" in navigator &&
      "PushManager" in window;
    setIsSupported(supported);

    if (supported) {
      setPermission(Notification.permission);
    }
  }, []);

  // Check subscription status
  const checkSubscription = useCallback(async () => {
    if (!isSupported || !isAuthenticated) return;

    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      setIsSubscribed(!!subscription);
    } catch (error) {
      console.error("Error checking subscription:", error);
    }
  }, [isSupported, isAuthenticated]);

  useEffect(() => {
    checkSubscription();
  }, [checkSubscription]);

  // Convert base64 string to Uint8Array (for VAPID public key)
  const urlBase64ToUint8Array = (base64String: string) => {
    const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding)
      .replace(/\-/g, "+")
      .replace(/_/g, "/");

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  };

  // Subscribe to push notifications
  const subscribe = useCallback(async () => {
    if (!isSupported || !isAuthenticated) {
      console.error("Push notifications not supported or user not authenticated");
      return false;
    }

    setIsLoading(true);

    try {
      // Request permission
      const permissionResult = await Notification.requestPermission();
      setPermission(permissionResult);

      if (permissionResult !== "granted") {
        console.log("Notification permission denied");
        return false;
      }

      // Get service worker registration
      const registration = await navigator.serviceWorker.ready;

      // Get VAPID public key from environment
      const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!vapidPublicKey) {
        console.error("VAPID public key not found in environment");
        return false;
      }

      // Subscribe to push manager
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
      });

      // Convert subscription to JSON
      const subscriptionJson = subscription.toJSON();

      // Send subscription to backend
      const subscriptionData: PushSubscriptionData = {
        endpoint: subscriptionJson.endpoint!,
        p256dh: subscriptionJson.keys!.p256dh!,
        auth: subscriptionJson.keys!.auth!,
      };

      await apiClient.post("/api/push-subscriptions/", subscriptionData);

      setIsSubscribed(true);
      console.log("Push notification subscription successful");
      return true;
    } catch (error) {
      console.error("Error subscribing to push notifications:", error);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [isSupported, isAuthenticated]);

  // Unsubscribe from push notifications
  const unsubscribe = useCallback(async () => {
    if (!isSupported || !isAuthenticated) return false;

    setIsLoading(true);

    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();

      if (!subscription) {
        setIsSubscribed(false);
        return true;
      }

      // Unsubscribe from push manager
      await subscription.unsubscribe();

      // Remove subscription from backend
      const subscriptionJson = subscription.toJSON();
      await apiClient.delete("/api/push-subscriptions/unsubscribe/", {
        data: { endpoint: subscriptionJson.endpoint },
      });

      setIsSubscribed(false);
      console.log("Push notification unsubscription successful");
      return true;
    } catch (error) {
      console.error("Error unsubscribing from push notifications:", error);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [isSupported, isAuthenticated]);

  return {
    isSupported,
    permission,
    isSubscribed,
    isLoading,
    subscribe,
    unsubscribe,
  };
}

