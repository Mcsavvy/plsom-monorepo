"use client";

import { useState, useEffect } from "react";
import { usePWA } from "@/hooks/use-pwa";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle,
  Download,
  Smartphone,
  Monitor,
  Tablet,
  Share,
  Plus,
  ExternalLink,
} from "lucide-react";
import { Separator } from "@/components/ui/separator";

export default function InstallPage() {
  const {
    isInstallable,
    isInstalled,
    isStandalone,
    isIOS,
    isOnline,
    install,
    getInstallInstructions,
    canInstall,
  } = usePWA();

  const [deviceType, setDeviceType] = useState<"mobile" | "desktop" | "tablet">(
    "desktop"
  );
  const [browserType, setBrowserType] = useState<string>("unknown");

  useEffect(() => {
    // Detect device type
    const userAgent = navigator.userAgent;
    if (
      /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent)
    ) {
      if (/iPad|Android.*Tablet|Tablet/i.test(userAgent)) {
        setDeviceType("tablet");
      } else {
        setDeviceType("mobile");
      }
    } else {
      setDeviceType("desktop");
    }

    // Detect browser type
    if (userAgent.includes("Chrome")) {
      setBrowserType("chrome");
    } else if (userAgent.includes("Safari") && !userAgent.includes("Chrome")) {
      setBrowserType("safari");
    } else if (userAgent.includes("Firefox")) {
      setBrowserType("firefox");
    } else if (userAgent.includes("Edge")) {
      setBrowserType("edge");
    } else {
      setBrowserType("other");
    }
  }, []);

  const handleInstall = async () => {
    const success = await install();
    if (success) {
      // Show success message or redirect
      console.log("PWA installed successfully!");
    }
  };

  const getDeviceIcon = () => {
    switch (deviceType) {
      case "mobile":
        return <Smartphone className="h-8 w-8" />;
      case "tablet":
        return <Tablet className="h-8 w-8" />;
      default:
        return <Monitor className="h-8 w-8" />;
    }
  };

  const getInstallSteps = () => {
    if (isIOS) {
      return [
        {
          step: 1,
          icon: <Share className="h-5 w-5" />,
          title: "Open Safari Menu",
          description: "Tap the Share button (⬆️) at the bottom of Safari",
        },
        {
          step: 2,
          icon: <Plus className="h-5 w-5" />,
          title: "Add to Home Screen",
          description: "Scroll down and tap 'Add to Home Screen'",
        },
        {
          step: 3,
          icon: <CheckCircle className="h-5 w-5" />,
          title: "Confirm Installation",
          description: "Tap 'Add' to install the app",
        },
      ];
    }

    if (browserType === "chrome" || browserType === "edge") {
      return [
        {
          step: 1,
          icon: <Download className="h-5 w-5" />,
          title: "Click Install Button",
          description: "Tap the install button below when it appears",
        },
        {
          step: 2,
          icon: <ExternalLink className="h-5 w-5" />,
          title: "Browser Menu Alternative",
          description: "Or use the browser menu (⋮) → 'Install PLSOM LMS'",
        },
      ];
    }

    if (browserType === "firefox") {
      return [
        {
          step: 1,
          icon: <ExternalLink className="h-5 w-5" />,
          title: "Open Browser Menu",
          description: "Click the menu button (☰) in Firefox",
        },
        {
          step: 2,
          icon: <Plus className="h-5 w-5" />,
          title: "Add to Home Screen",
          description: "Select 'Add to Home Screen' or 'Install'",
        },
      ];
    }

    return [
      {
        step: 1,
        icon: <ExternalLink className="h-5 w-5" />,
        title: "Use Browser Menu",
        description:
          "Look for 'Add to Home Screen' or 'Install App' in your browser menu",
      },
    ];
  };

  const getBrowserSpecificInstructions = () => {
    switch (browserType) {
      case "chrome":
        return {
          title: "Chrome Installation",
          description:
            "Chrome will show an install prompt or you can use the browser menu.",
          icon: "🟢",
        };
      case "safari":
        return {
          title: "Safari Installation",
          description:
            "Use the Share button to add to home screen on iOS devices.",
          icon: "🔵",
        };
      case "firefox":
        return {
          title: "Firefox Installation",
          description: "Use the browser menu to install the app.",
          icon: "🟠",
        };
      case "edge":
        return {
          title: "Edge Installation",
          description:
            "Edge supports PWA installation through the browser menu.",
          icon: "🔷",
        };
      default:
        return {
          title: "Browser Installation",
          description: "Check your browser's menu for installation options.",
          icon: "🌐",
        };
    }
  };

  if (isInstalled || isStandalone) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-indigo-50 to-purple-50 p-4 dark:from-gray-900 dark:to-gray-800">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900">
              <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
            </div>
            <CardTitle className="text-2xl">App Installed!</CardTitle>
            <CardDescription>
              PLSOM LMS is already installed on your device.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Button
              onClick={() => (window.location.href = "/")}
              className="w-full"
            >
              Open App
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-indigo-100 dark:bg-indigo-900">
            {getDeviceIcon()}
          </div>
          <h1 className="mb-4 text-4xl font-bold text-gray-900 dark:text-white">
            Install PLSOM LMS
          </h1>
          <p className="mx-auto max-w-2xl text-xl text-gray-600 dark:text-gray-300">
            Get quick access to your learning management system with our
            Progressive Web App
          </p>
        </div>

        {/* Status Cards */}
        <div className="mb-8 grid gap-6 md:grid-cols-3">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <div className="h-2 w-2 rounded-full bg-green-500"></div>
                Device
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3">
                {getDeviceIcon()}
                <div>
                  <p className="font-medium capitalize">{deviceType}</p>
                  <p className="text-sm text-gray-500">Detected</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <div className="h-2 w-2 rounded-full bg-blue-500"></div>
                Browser
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3">
                <span className="text-2xl">
                  {getBrowserSpecificInstructions().icon}
                </span>
                <div>
                  <p className="font-medium capitalize">{browserType}</p>
                  <p className="text-sm text-gray-500">Detected</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <div
                  className={`h-2 w-2 rounded-full ${isOnline ? "bg-green-500" : "bg-red-500"}`}
                ></div>
                Connection
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3">
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-full ${isOnline ? "bg-green-100 dark:bg-green-900" : "bg-red-100 dark:bg-red-900"}`}
                >
                  <div
                    className={`h-3 w-3 rounded-full ${isOnline ? "bg-green-500" : "bg-red-500"}`}
                  ></div>
                </div>
                <div>
                  <p className="font-medium">
                    {isOnline ? "Online" : "Offline"}
                  </p>
                  <p className="text-sm text-gray-500">Status</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Installation Instructions */}
        <div className="grid gap-8 lg:grid-cols-2">
          {/* Main Installation Card */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Download className="h-6 w-6" />
                Installation Steps
              </CardTitle>
              <CardDescription>
                Follow these steps to install PLSOM LMS on your device
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {getInstallSteps().map((step, index) => (
                <div key={index} className="flex gap-4">
                  <div className="flex-shrink-0">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-100 dark:bg-indigo-900">
                      <span className="text-sm font-semibold text-indigo-600 dark:text-indigo-400">
                        {step.step}
                      </span>
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="mb-1 flex items-center gap-2">
                      {step.icon}
                      <h3 className="font-semibold">{step.title}</h3>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {step.description}
                    </p>
                  </div>
                </div>
              ))}

              <Separator />

              {/* Install Button */}
              {isInstallable && (
                <div className="text-center">
                  <Button onClick={handleInstall} size="lg" className="w-full">
                    <Download className="mr-2 h-5 w-5" />
                    Install PLSOM LMS
                  </Button>
                </div>
              )}

              {!isInstallable && !isIOS && (
                <div className="rounded-lg bg-gray-50 p-4 text-center dark:bg-gray-800">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Install button will appear when your browser supports it.
                    Use the browser menu as an alternative.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Browser Specific Instructions */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="text-2xl">
                  {getBrowserSpecificInstructions().icon}
                </span>
                {getBrowserSpecificInstructions().title}
              </CardTitle>
              <CardDescription>
                {getBrowserSpecificInstructions().description}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* iOS Safari Special Instructions */}
                {isIOS && (
                  <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-900/20">
                    <h4 className="mb-2 font-semibold text-blue-900 dark:text-blue-100">
                      iOS Safari Instructions
                    </h4>
                    <ul className="space-y-1 text-sm text-blue-800 dark:text-blue-200">
                      <li>• Make sure you're using Safari browser</li>
                      <li>• The Share button is at the bottom center</li>
                      <li>• Look for "Add to Home Screen" option</li>
                      <li>
                        • You can customize the app name before installing
                      </li>
                    </ul>
                  </div>
                )}

                {/* Android Chrome Instructions */}
                {deviceType === "mobile" &&
                  browserType === "chrome" &&
                  !isIOS && (
                    <div className="rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-800 dark:bg-green-900/20">
                      <h4 className="mb-2 font-semibold text-green-900 dark:text-green-100">
                        Android Chrome Instructions
                      </h4>
                      <ul className="space-y-1 text-sm text-green-800 dark:text-green-200">
                        <li>• Chrome will show an install banner</li>
                        <li>• Or use Chrome menu (⋮) → "Install app"</li>
                        <li>• The app will appear on your home screen</li>
                        <li>• You can uninstall anytime from app settings</li>
                      </ul>
                    </div>
                  )}

                {/* Desktop Instructions */}
                {deviceType === "desktop" && (
                  <div className="rounded-lg border border-purple-200 bg-purple-50 p-4 dark:border-purple-800 dark:bg-purple-900/20">
                    <h4 className="mb-2 font-semibold text-purple-900 dark:text-purple-100">
                      Desktop Installation
                    </h4>
                    <ul className="space-y-1 text-sm text-purple-800 dark:text-purple-200">
                      <li>• Look for install icon in address bar</li>
                      <li>• Or use browser menu → "Install PLSOM LMS"</li>
                      <li>• App will open in its own window</li>
                      <li>• Access from desktop or taskbar</li>
                    </ul>
                  </div>
                )}

                {/* Benefits */}
                <div className="rounded-lg border border-indigo-200 bg-indigo-50 p-4 dark:border-indigo-800 dark:bg-indigo-900/20">
                  <h4 className="mb-2 font-semibold text-indigo-900 dark:text-indigo-100">
                    App Benefits
                  </h4>
                  <ul className="space-y-1 text-sm text-indigo-800 dark:text-indigo-200">
                    <li>• Faster loading and offline access</li>
                    <li>• Native app-like experience</li>
                    <li>• Push notifications support</li>
                    <li>• Works without internet connection</li>
                    <li>• Easy access from home screen</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Footer */}
        <div className="mt-12 text-center">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Having trouble installing? Try refreshing the page or using a
            different browser.
          </p>
          <div className="mt-4">
            <Button
              variant="outline"
              onClick={() => (window.location.href = "/")}
            >
              Back to App
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
