"use client";

import { motion } from "framer-motion";
import { usePathname } from "next/navigation";
import { ReactNode, useEffect, useState } from "react";

interface GlobalTransitionsProps {
  children: ReactNode;
}

// Add global CSS for smoother transitions
export function GlobalTransitions({ children }: GlobalTransitionsProps) {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Prevent flash of unstyled content
  if (!mounted) {
    return <div style={{ visibility: "hidden" }}>{children}</div>;
  }

  return (
    <>
      {/* Global transition styles */}
      <style jsx global>{`
        html {
          scroll-behavior: smooth;
        }

        * {
          transition:
            background-color 0.2s ease,
            border-color 0.2s ease,
            color 0.2s ease,
            fill 0.2s ease,
            stroke 0.2s ease,
            opacity 0.2s ease,
            box-shadow 0.2s ease,
            transform 0.2s ease;
        }

        /* Prevent layout shift during transitions */
        body {
          overflow-x: hidden;
        }

        /* Optimize for 60fps animations */
        [data-framer-motion] {
          transform-style: preserve-3d;
          backface-visibility: hidden;
          will-change: transform;
        }

        /* Improve font rendering during animations */
        * {
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
          text-rendering: optimizeLegibility;
        }

        /* Smooth focus transitions */
        :focus {
          outline: 2px solid hsl(var(--ring));
          outline-offset: 2px;
          transition: outline 0.2s ease;
        }

        /* Loading states optimization */
        .loading {
          pointer-events: none;
          user-select: none;
        }
      `}</style>

      {/* Route change indicator */}
      <RouteChangeIndicator />

      {children}
    </>
  );
}

// Route change loading indicator
function RouteChangeIndicator() {
  const pathname = usePathname();
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setIsLoading(true);
    const timer = setTimeout(() => setIsLoading(false), 300);
    return () => clearTimeout(timer);
  }, [pathname]);

  return (
    <motion.div
      className="bg-primary fixed top-0 right-0 left-0 z-50 h-1"
      initial={{ scaleX: 0 }}
      animate={{ scaleX: isLoading ? 1 : 0 }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
      style={{ transformOrigin: "left" }}
    />
  );
}
