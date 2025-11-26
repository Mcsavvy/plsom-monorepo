"use client";

import { motion, AnimatePresence } from "framer-motion";
import { usePathname } from "next/navigation";
import { ReactNode } from "react";

interface PageTransitionProps {
  children: ReactNode;
}

const pageVariants = {
  initial: {
    opacity: 0,
    y: 20,
    scale: 0.98,
  },
  in: {
    opacity: 1,
    y: 0,
    scale: 1,
  },
  out: {
    opacity: 0,
    y: -20,
    scale: 0.98,
  },
};

const pageTransition = {
  type: "tween" as const,
  ease: [0.25, 0.25, 0.25, 0.75] as const, // Custom easing for smooth transitions
  duration: 0.3,
};

export function PageTransition({ children }: PageTransitionProps) {
  const pathname = usePathname();

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={pathname}
        initial="initial"
        animate="in"
        exit="out"
        variants={pageVariants}
        transition={pageTransition}
        className="w-full flex-1"
        style={{
          // Prevent layout shift during transitions
          minHeight: "100vh",
          willChange: "transform, opacity",
        }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}

// Alternative transition for mobile layouts
const mobilePageVariants = {
  initial: {
    opacity: 0,
    x: 20,
  },
  in: {
    opacity: 1,
    x: 0,
  },
  out: {
    opacity: 0,
    x: -20,
  },
};

interface MobilePageTransitionProps {
  children: ReactNode;
}

export function MobilePageTransition({ children }: MobilePageTransitionProps) {
  const pathname = usePathname();

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={pathname}
        initial="initial"
        animate="in"
        exit="out"
        variants={mobilePageVariants}
        transition={{
          type: "tween",
          ease: "easeInOut",
          duration: 0.25,
        }}
        className="w-full flex-1"
        style={{
          minHeight: "100vh",
          willChange: "transform, opacity",
        }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}

// Loading transition for better perceived performance
interface LoadingTransitionProps {
  isLoading: boolean;
  children: ReactNode;
}

export function LoadingTransition({
  isLoading,
  children,
}: LoadingTransitionProps) {
  return (
    <AnimatePresence mode="wait">
      {isLoading ? (
        <motion.div
          key="loading"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="flex min-h-[200px] items-center justify-center"
        >
          <div className="flex items-center space-x-2">
            <div className="bg-primary h-2 w-2 animate-pulse rounded-full"></div>
            <div className="bg-primary h-2 w-2 animate-pulse rounded-full delay-75"></div>
            <div className="bg-primary h-2 w-2 animate-pulse rounded-full delay-150"></div>
          </div>
        </motion.div>
      ) : (
        <motion.div
          key="content"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
