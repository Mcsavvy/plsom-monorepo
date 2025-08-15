"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useTheme } from "next-themes";
import { Sun, Moon, Monitor } from "lucide-react";

export function ThemeToggle() {
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className="bg-muted h-10 w-10 animate-pulse rounded-md" />;
  }

  const themes = [
    { name: "light", icon: Sun, label: "Light" },
    { name: "dark", icon: Moon, label: "Dark" },
    { name: "system", icon: Monitor, label: "System" },
  ];

  return (
    <div className="bg-muted flex items-center space-x-1 rounded-lg p-1">
      {themes.map(({ name, icon: Icon, label }) => (
        <motion.button
          key={name}
          onClick={() => setTheme(name)}
          className={`relative rounded-md p-2 transition-colors ${
            theme === name
              ? "text-primary"
              : "text-muted-foreground hover:text-foreground"
          }`}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          title={label}
        >
          {theme === name && (
            <motion.div
              className="bg-background absolute inset-0 rounded-md shadow-sm"
              layoutId="activeTheme"
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
            />
          )}
          <Icon className="relative z-10 h-4 w-4" />
        </motion.button>
      ))}
    </div>
  );
}
