"use client"

import { motion } from "framer-motion"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { videoShowcase } from "@/data"

const fadeInUp = {
  initial: { opacity: 0, y: 60 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6, ease: "easeOut" },
}

const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.1,
    },
  },
}

export default function VideoShowcase() {
  return (
    <section className="py-20 bg-white dark:bg-[#1e2436]">
      <div className="container mx-auto px-6">
        <motion.div
          initial="initial"
          whileInView="animate"
          viewport={{ once: true }}
          variants={staggerContainer}
          className="text-center mb-16"
        >
          <motion.h2
            variants={fadeInUp}
            className="text-3xl md:text-4xl font-bold text-[#333333] dark:text-[#FFFFFF] mb-6 font-['Roboto_Slab']"
          >
            Experience PLSOM
          </motion.h2>
          <motion.p
            variants={fadeInUp}
            className="text-lg text-[#5c5c5c] dark:text-[#e0e0e0] max-w-3xl mx-auto font-['Poppins']"
          >
            Get a glimpse into our vibrant learning community and transformative ministry training programs
          </motion.p>
        </motion.div>

        <motion.div
          initial="initial"
          whileInView="animate"
          viewport={{ once: true }}
          variants={staggerContainer}
          className="grid md:grid-cols-2 lg:grid-cols-3 gap-8"
        >
          {videoShowcase.map((video, index) => (
            <motion.div key={index} variants={fadeInUp}>
              <Card className="bg-[#F5F5F5] dark:bg-[#363c4e] border-[#c2c2c2] dark:border-[#9b9b9b] hover:shadow-xl transition-all duration-300 hover:scale-105 group cursor-pointer">
                <div className="relative overflow-hidden rounded-t-lg">
                  <img
                    src={video.thumbnail || "/placeholder.svg"}
                    alt={video.title}
                    className="w-full h-48 object-cover group-hover:scale-110 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-colors duration-300 flex items-center justify-center">
                    <div className="w-16 h-16 bg-[#FFD700] rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-lg">
                      <svg className="w-6 h-6 text-[#005B99] ml-1" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M8 5v14l11-7z" />
                      </svg>
                    </div>
                  </div>
                  <div className="absolute top-4 left-4 bg-[#005B99] text-white px-2 py-1 rounded text-xs font-semibold">
                    {video.category}
                  </div>
                  <div className="absolute bottom-4 right-4 bg-black/70 text-white px-2 py-1 rounded text-xs">
                    {video.duration}
                  </div>
                </div>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg text-[#333333] dark:text-[#FFFFFF] font-['Poppins'] group-hover:text-[#005B99] dark:group-hover:text-[#FFD700] transition-colors duration-300">
                    {video.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-[#5c5c5c] dark:text-[#e0e0e0] font-['Poppins'] text-sm">
                    {video.description}
                  </CardDescription>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
} 