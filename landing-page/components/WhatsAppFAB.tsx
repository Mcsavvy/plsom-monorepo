"use client"

import { useState, useEffect } from "react"
import { MessageCircle, ChevronUp } from "lucide-react"
import { Button } from "@/components/ui/button"
import { companyInfo } from "@/data"
import { motion, AnimatePresence } from "framer-motion"

export default function WhatsAppFAB() {
  const [isVisible, setIsVisible] = useState(false)
  const [showWhatsAppTooltip, setShowWhatsAppTooltip] = useState(false)
  const [showScrollTooltip, setShowScrollTooltip] = useState(false)

  useEffect(() => {
    const toggleVisibility = () => {
      if (window.pageYOffset > 300) {
        setIsVisible(true)
      } else {
        setIsVisible(false)
      }
    }

    window.addEventListener("scroll", toggleVisibility)
    return () => window.removeEventListener("scroll", toggleVisibility)
  }, [])

  const handleWhatsAppClick = () => {
    const message = encodeURIComponent(
      "Hello! I'm interested in learning more about PLSOM programs. Could you please provide me with more information?"
    )
    const whatsappUrl = `https://wa.me/${companyInfo.phoneWhatsApp.replace(/\s+/g, "").replace(/\+/g, "")}?text=${message}`
    window.open(whatsappUrl, "_blank")
  }

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth"
    })
  }

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.8, y: 20 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className="fixed bottom-6 right-6 z-50 flex flex-col items-center gap-3"
        >
          {/* Scroll to Top Button */}
          <div className="relative">
            {/* Scroll to Top Tooltip */}
            <AnimatePresence>
              {showScrollTooltip && (
                <motion.div
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  className="absolute right-16 top-1/2 transform -translate-y-1/2 bg-plsom-text-100 dark:bg-plsom-dark-bg-200 text-white dark:text-plsom-dark-text-100 px-3 py-2 rounded-lg text-sm whitespace-nowrap shadow-lg"
                >
                  Back to top
                  <div className="absolute right-0 top-1/2 transform translate-x-1 -translate-y-1/2 w-0 h-0 border-l-4 border-l-plsom-text-100 dark:border-l-plsom-dark-bg-200 border-y-4 border-y-transparent"></div>
                </motion.div>
              )}
            </AnimatePresence>

            <Button
              onClick={scrollToTop}
              onMouseEnter={() => setShowScrollTooltip(true)}
              onMouseLeave={() => setShowScrollTooltip(false)}
              className="w-8 h-8 rounded-full bg-plsom-primary-100 hover:bg-plsom-primary-200 dark:bg-plsom-accent-100 dark:hover:bg-plsom-accent-200 text-white dark:text-plsom-primary-100 shadow-lg hover:shadow-xl transition-all duration-300 border-0 p-0 group"
            >
              <ChevronUp className="w-3 h-3 group-hover:scale-110 transition-transform duration-200" />
            </Button>
          </div>

          {/* WhatsApp FAB */}
          <div className="relative">
            {/* WhatsApp Tooltip */}
            <AnimatePresence>
              {showWhatsAppTooltip && (
                <motion.div
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  className="absolute right-16 top-1/2 transform -translate-y-1/2 bg-plsom-text-100 dark:bg-plsom-dark-bg-200 text-white dark:text-plsom-dark-text-100 px-3 py-2 rounded-lg text-sm whitespace-nowrap shadow-lg"
                >
                  Chat with us on WhatsApp
                  <div className="absolute right-0 top-1/2 transform translate-x-1 -translate-y-1/2 w-0 h-0 border-l-4 border-l-plsom-text-100 dark:border-l-plsom-dark-bg-200 border-y-4 border-y-transparent"></div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* FAB Button */}
            <Button
              onClick={handleWhatsAppClick}
              onMouseEnter={() => setShowWhatsAppTooltip(true)}
              onMouseLeave={() => setShowWhatsAppTooltip(false)}
              className="w-14 h-14 rounded-full bg-plsom-primary-100 hover:bg-plsom-primary-200 text-white shadow-lg hover:shadow-xl transition-all duration-300 border-0 p-0 group"
            >
              <MessageCircle strokeWidth={1.5} className="w-10 h-10 group-hover:scale-110 transition-transform duration-200" />
            </Button>

            {/* Pulse animation */}
            <div className="absolute inset-0 rounded-full bg-plsom-primary-100 animate-ping opacity-20"></div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
} 