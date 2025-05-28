"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Moon, Sun, Menu, X } from "lucide-react"
import { useTheme } from "next-themes"
import { navItems } from "@/data"

export default function Navigation() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)
  const [mounted, setMounted] = useState(false)
  const { theme, setTheme } = useTheme()

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY
      setIsScrolled(scrollTop > 50) // Change background after scrolling 50px
    }

    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark")
  }

  // Prevent hydration mismatch
  if (!mounted) {
    return null
  }

  const isDark = theme === "dark"

  return (
    <nav 
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled 
          ? "bg-white/95 dark:bg-[#1e2436]/95 backdrop-blur-md border-b border-[#c2c2c2] dark:border-[#363c4e] shadow-lg" 
          : "bg-transparent"
      }`}
    >
      <div className="container mx-auto px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center space-x-3"
          >
            <img src="/logo.png" alt="PLSOM Logo" className="w-10 h-10" />
            <span 
              className={`text-xl font-bold font-['Roboto_Slab'] transition-colors duration-300 ${
                isScrolled 
                  ? "text-[#005B99] dark:text-[#FFD700]" 
                  : "text-white drop-shadow-lg"
              }`}
            >
              PLSOM
            </span>
          </motion.div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {navItems.map((item, index) => (
              <motion.a
                key={item.name}
                href={item.href}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`font-['Poppins'] font-medium transition-colors duration-300 ${
                  isScrolled
                    ? "text-[#333333] dark:text-[#FFFFFF] hover:text-[#005B99] dark:hover:text-[#FFD700]"
                    : "text-white hover:text-[#FFD700] drop-shadow-lg"
                }`}
              >
                {item.name}
              </motion.a>
            ))}
          </div>

          {/* Theme Toggle & Mobile Menu */}
          <div className="flex items-center space-x-4">
            <motion.button
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              onClick={toggleTheme}
              className={`p-2 rounded-full hover:scale-110 transition-all duration-300 ${
                isScrolled
                  ? "bg-[#F5F5F5] dark:bg-[#363c4e]"
                  : "bg-white/20 backdrop-blur-sm hover:bg-white/30"
              }`}
              aria-label="Toggle theme"
            >
              {isDark ? (
                <Sun className={`w-5 h-5 ${isScrolled ? "text-[#FFD700]" : "text-white"}`} />
              ) : (
                <Moon className={`w-5 h-5 ${isScrolled ? "text-[#005B99]" : "text-white"}`} />
              )}
            </motion.button>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className={`md:hidden p-2 rounded-lg transition-all duration-300 ${
                isScrolled
                  ? "bg-[#F5F5F5] dark:bg-[#363c4e]"
                  : "bg-white/20 backdrop-blur-sm hover:bg-white/30"
              }`}
              aria-label="Toggle menu"
            >
              {isMenuOpen ? (
                <X className={`w-5 h-5 ${isScrolled ? "text-[#333333] dark:text-white" : "text-white"}`} />
              ) : (
                <Menu className={`w-5 h-5 ${isScrolled ? "text-[#333333] dark:text-white" : "text-white"}`} />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        <AnimatePresence>
          {isMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className={`md:hidden py-4 transition-all duration-300 ${
                isScrolled
                  ? "border-t border-[#c2c2c2] dark:border-[#363c4e]"
                  : "border-t border-white/20 bg-black/20 backdrop-blur-sm rounded-b-lg"
              }`}
            >
              {navItems.map((item, index) => (
                <motion.a
                  key={item.name}
                  href={item.href}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  onClick={() => setIsMenuOpen(false)}
                  className={`block py-2 font-['Poppins'] transition-colors duration-300 ${
                    isScrolled
                      ? "text-[#333333] dark:text-[#FFFFFF] hover:text-[#005B99] dark:hover:text-[#FFD700]"
                      : "text-white hover:text-[#FFD700]"
                  }`}
                >
                  {item.name}
                </motion.a>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </nav>
  )
} 