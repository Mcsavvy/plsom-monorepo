"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { useTheme } from "next-themes"
import { Sun, Moon, Monitor } from "lucide-react"

export function ThemeToggle() {
  const [mounted, setMounted] = useState(false)
  const { theme, setTheme } = useTheme()

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return <div className="w-10 h-10 rounded-md bg-muted animate-pulse" />
  }

  const themes = [
    { name: "light", icon: Sun, label: "Light" },
    { name: "dark", icon: Moon, label: "Dark" },
    { name: "system", icon: Monitor, label: "System" },
  ]

  return (
    <div className="flex items-center space-x-1 p-1 bg-muted rounded-lg">
      {themes.map(({ name, icon: Icon, label }) => (
        <motion.button
          key={name}
          onClick={() => setTheme(name)}
          className={`relative p-2 rounded-md transition-colors ${
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
              className="absolute inset-0 bg-background rounded-md shadow-sm"
              layoutId="activeTheme"
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
            />
          )}
          <Icon className="w-4 h-4 relative z-10" />
        </motion.button>
      ))}
    </div>
  )
}