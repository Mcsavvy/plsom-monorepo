"use client";

import Image from "next/image";
import { useState } from "react";
import { cn } from "@/lib/utils";

type Size = "xs" | "sm" | "md" | "lg" | "xl";

interface PLSOMBrandingProps {
  size?: Size;
  showName?: boolean;
  showSubtitle?: boolean;
  className?: string;
  orientation?: "horizontal" | "vertical";
}

const sizeConfigs = {
  xs: {
    logo: 20,
    container: "space-y-1",
    name: "text-sm font-semibold",
    subtitle: "text-xs text-muted-foreground",
  },
  sm: {
    logo: 32,
    container: "space-y-1",
    name: "text-base font-semibold",
    subtitle: "text-sm text-muted-foreground",
  },
  md: {
    logo: 48,
    container: "space-y-2",
    name: "text-lg font-bold",
    subtitle: "text-sm text-muted-foreground",
  },
  lg: {
    logo: 64,
    container: "space-y-2",
    name: "text-xl font-bold",
    subtitle: "text-base text-muted-foreground",
  },
  xl: {
    logo: 96,
    container: "space-y-3",
    name: "text-2xl font-bold",
    subtitle: "text-lg text-muted-foreground",
  },
};

export function PLSOMBranding({
  size = "md",
  showName = true,
  showSubtitle = false,
  className,
  orientation = "vertical",
}: PLSOMBrandingProps) {
  const [logoError, setLogoError] = useState(false);
  const config = sizeConfigs[size];

  const LogoComponent = () => {
    if (logoError) {
      // Fallback logo design
      return (
        <div
          className="bg-primary/20 border-primary/30 flex items-center justify-center rounded-full border"
          style={{ width: config.logo, height: config.logo }}
        >
          <div className="text-center">
            <div
              className={cn(
                "text-primary font-bold",
                size === "xs"
                  ? "text-xs"
                  : size === "sm"
                    ? "text-sm"
                    : size === "md"
                      ? "text-lg"
                      : size === "lg"
                        ? "text-xl"
                        : "text-2xl"
              )}
            >
              P
            </div>
            {config.logo >= 32 && (
              <div
                className={cn(
                  "text-primary/80 leading-none",
                  size === "sm"
                    ? "text-xs"
                    : size === "md"
                      ? "text-xs"
                      : size === "lg"
                        ? "text-sm"
                        : "text-sm"
                )}
              >
                LSOM
              </div>
            )}
          </div>
        </div>
      );
    }

    return (
      <Image
        src="/logo.png"
        alt="PLSOM Logo"
        width={config.logo}
        height={config.logo}
        className="rounded-full object-contain"
        style={{ width: config.logo, height: config.logo }}
        priority
        onError={() => setLogoError(true)}
      />
    );
  };

  const TextContent = () => {
    if (!showName && !showSubtitle) return null;

    return (
      <div className={config.container}>
        {showName && <div className={config.name}>PLSOM</div>}
        {showSubtitle && (
          <div className={config.subtitle}>Perfect Love School of Ministry</div>
        )}
      </div>
    );
  };

  if (orientation === "horizontal") {
    return (
      <div className={cn("flex items-center space-x-3", className)}>
        <LogoComponent />
        <TextContent />
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col items-center text-center", className)}>
      <LogoComponent />
      <TextContent />
    </div>
  );
}
