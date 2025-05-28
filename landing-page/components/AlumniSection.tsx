"use client"

import { motion } from "framer-motion"
import { Heart, Users, BookOpen, Target } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { featuredAlumni } from "@/data"

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

export default function AlumniSection() {
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
            Our Alumni Network
          </motion.h2>
          <motion.p
            variants={fadeInUp}
            className="text-lg text-[#5c5c5c] dark:text-[#e0e0e0] max-w-3xl mx-auto font-['Poppins']"
          >
            Meet some of our distinguished graduates who are making a significant impact in ministry and communities
            worldwide
          </motion.p>
        </motion.div>

        {/* Featured Alumni */}
        <motion.div
          initial="initial"
          whileInView="animate"
          viewport={{ once: true }}
          variants={staggerContainer}
          className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16"
        >
          {featuredAlumni.map((alumni, index: number) => (
            <motion.div key={index} variants={fadeInUp}>
              <Card className="h-full bg-[#F5F5F5] dark:bg-[#363c4e] border-[#c2c2c2] dark:border-[#9b9b9b] hover:shadow-xl transition-all duration-300 hover:scale-105">
                <CardHeader className="text-center">
                  <div className="w-24 h-24 mx-auto mb-4 rounded-full overflow-hidden bg-[#005B99] dark:bg-[#FFD700]">
                    <img
                      src={alumni.image || "/placeholder.svg"}
                      alt={alumni.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <CardTitle className="text-lg text-[#333333] dark:text-[#FFFFFF] font-['Poppins']">
                    {alumni.name}
                  </CardTitle>
                  <CardDescription className="text-[#005B99] dark:text-[#FFD700] font-semibold">
                    {alumni.title}
                  </CardDescription>
                  <Badge variant="outline" className="mx-auto">
                    {alumni.year}
                  </Badge>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="text-center">
                    <p className="text-sm font-semibold text-[#333333] dark:text-[#FFFFFF]">{alumni.church}</p>
                    <p className="text-sm text-[#5c5c5c] dark:text-[#e0e0e0]">{alumni.location}</p>
                  </div>
                  <div className="bg-[#b7e9ff] dark:bg-[#1e2436] p-3 rounded-lg">
                    <p className="text-sm font-semibold text-[#005B99] dark:text-[#FFD700] mb-1">Key Achievement:</p>
                    <p className="text-sm text-[#333333] dark:text-[#FFFFFF]">{alumni.achievement}</p>
                  </div>
                  <blockquote className="italic text-sm text-[#5c5c5c] dark:text-[#e0e0e0] border-l-4 border-[#FFD700] pl-3">
                    "{alumni.quote}"
                  </blockquote>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>

        {/* Alumni Success Stories */}
        <motion.div
          initial="initial"
          whileInView="animate"
          viewport={{ once: true }}
          variants={staggerContainer}
          className="bg-gradient-to-r from-[#F5F5F5] to-[#ebebeb] dark:from-[#363c4e] dark:to-[#1e2436] rounded-2xl p-8 md:p-12"
        >
          <motion.h3
            variants={fadeInUp}
            className="text-2xl md:text-3xl font-bold text-[#333333] dark:text-[#FFFFFF] text-center mb-8 font-['Roboto_Slab']"
          >
            Alumni Success Stories
          </motion.h3>

          <motion.div variants={fadeInUp} className="grid md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-[#005B99] dark:bg-[#FFD700] rounded-full flex items-center justify-center flex-shrink-0">
                  <Heart className="w-6 h-6 text-white dark:text-[#005B99]" />
                </div>
                <div>
                  <h4 className="font-semibold text-[#333333] dark:text-[#FFFFFF] mb-2">Church Planting Success</h4>
                  <p className="text-sm text-[#5c5c5c] dark:text-[#e0e0e0]">
                    Over 150 churches have been planted by our graduates across 25 countries, with many becoming
                    thriving community centers.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-[#005B99] dark:bg-[#FFD700] rounded-full flex items-center justify-center flex-shrink-0">
                  <Users className="w-6 h-6 text-white dark:text-[#005B99]" />
                </div>
                <div>
                  <h4 className="font-semibold text-[#333333] dark:text-[#FFFFFF] mb-2">Leadership Development</h4>
                  <p className="text-sm text-[#5c5c5c] dark:text-[#e0e0e0]">
                    85% of our graduates hold leadership positions in their churches or ministry organizations within
                    2 years of graduation.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-[#005B99] dark:bg-[#FFD700] rounded-full flex items-center justify-center flex-shrink-0">
                  <BookOpen className="w-6 h-6 text-white dark:text-[#005B99]" />
                </div>
                <div>
                  <h4 className="font-semibold text-[#333333] dark:text-[#FFFFFF] mb-2">Continued Education</h4>
                  <p className="text-sm text-[#5c5c5c] dark:text-[#e0e0e0]">
                    60% of our alumni pursue advanced theological education, with many earning master's and doctoral
                    degrees.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-[#005B99] dark:bg-[#FFD700] rounded-full flex items-center justify-center flex-shrink-0">
                  <Target className="w-6 h-6 text-white dark:text-[#005B99]" />
                </div>
                <div>
                  <h4 className="font-semibold text-[#333333] dark:text-[#FFFFFF] mb-2">Global Impact</h4>
                  <p className="text-sm text-[#5c5c5c] dark:text-[#e0e0e0]">
                    Our alumni serve in missions across Africa, Asia, Europe, and the Americas, spreading the gospel
                    worldwide.
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  )
} 