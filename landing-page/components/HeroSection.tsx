"use client"

import { motion, useScroll, useTransform } from "framer-motion"
import { ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import Image from "next/image"

export default function HeroSection() {
  const { scrollYProgress } = useScroll()
  const y = useTransform(scrollYProgress, [0, 1], ["0%", "50%"])

  return (
    <section id="home" className="relative min-h-screen flex items-center justify-center overflow-hidden pt-16">
      <motion.div style={{ y }} className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-br from-[#0F1626]/90 via-[#1e2436]/80 to-[#363c4e]/70 dark:from-[#0F1626]/90 dark:via-[#1e2436]/80 dark:to-[#363c4e]/70 z-10" />
        <Image fill src="/hero.jpeg" alt="Students learning at PLSOM" className="w-full h-full object-cover object-[center_top]" />
      </motion.div>

      <div className="relative z-20 container mx-auto px-6 text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="mb-8"
        >
          <div className="w-32 h-32 mx-auto mb-6 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center shadow-2xl">
            <Image fill priority src="/logo.png" alt="PLSOM Logo" className="w-24 h-24" />
          </div>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.8 }}
          className="text-4xl md:text-6xl font-bold text-white mb-6 font-['Roboto_Slab']"
        >
          Perfect Love School of Ministry
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.8 }}
          className="text-xl md:text-2xl text-white/90 mb-10 max-w-3xl mx-auto font-['Poppins']"
        >
          We are devoted to training and guiding the next generation of Ministry leaders and  empowering them to shape the society to the glory of <span className="text-[#FFD700]">JESUS CHRIST</span>.
          Guided by the Holy Spirit; this generation will fearlessly proclaim the message of the Kingdom of God with unwavering conviction.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7, duration: 0.8 }}
          className="flex flex-col sm:flex-row gap-4 justify-center mb-4 sm:mb-0"
        >
          <Button
            size="lg"
            asChild
            className="bg-[#FFD700] hover:bg-[#e9aa2b] text-[#005B99] font-semibold px-8 py-4 text-lg rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
          >
            <Link href="#enroll">
              Start Your Journey
            </Link>
          </Button>
          <Button
            variant="outline"
            size="lg"
            asChild
            className="border-2 border-white text-black dark:text-white hover:bg-white hover:text-[#005B99] dark:hover:bg-white dark:hover:text-[#005B99] px-8 py-4 text-lg rounded-lg transition-all duration-300 hover:scale-105"
          >
            <Link href="#programs">
              Explore Programs
            </Link>
          </Button>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2, duration: 0.8 }}
          className="hidden sm:block absolute bottom-10 left-1/2 transform -translate-x-1/2"
        >
          <ChevronDown className="w-8 h-8 text-white animate-bounce" />
        </motion.div>
      </div>
    </section>
  )
} 