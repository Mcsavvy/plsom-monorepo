"use client"

import { motion } from "framer-motion"
import { CheckCircle } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { programFeatures } from "@/data"
import Link from "next/link"
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

export default function ProgramFeatures() {
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
            Program Features
          </motion.h2>
          <motion.p
            variants={fadeInUp}
            className="text-lg text-[#5c5c5c] dark:text-[#e0e0e0] max-w-3xl mx-auto font-['Poppins']"
          >
            Our programs are designed to provide a comprehensive learning experience that combines theoretical
            knowledge with practical application.
          </motion.p>
        </motion.div>

        <motion.div
          initial="initial"
          whileInView="animate"
          viewport={{ once: true }}
          variants={staggerContainer}
          className="grid md:grid-cols-2 lg:grid-cols-4 gap-8"
        >
          {programFeatures.map((feature, index) => (
            <motion.div key={index} variants={fadeInUp}>
              <Card className="h-full bg-[#F5F5F5] dark:bg-[#363c4e] border-[#c2c2c2] dark:border-[#9b9b9b] hover:shadow-lg transition-all duration-300 hover:scale-105 group">
                <CardHeader className="text-center pb-4">
                  <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-[#005B99] to-[#4e88ca] dark:from-[#FFD700] dark:to-[#e9aa2b] rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <feature.icon className="w-8 h-8 text-white dark:text-[#005B99]" />
                  </div>
                  <CardTitle className="text-xl text-[#333333] dark:text-[#FFFFFF] font-['Poppins'] mb-2">
                    {feature.title}
                  </CardTitle>
                  <CardDescription className="text-[#5c5c5c] dark:text-[#e0e0e0] font-['Poppins']">
                    {feature.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {feature.details.map((detail, idx) => (
                      <li key={idx} className="flex items-start text-sm text-[#5c5c5c] dark:text-[#e0e0e0]">
                        <CheckCircle className="w-4 h-4 text-[#FFD700] mt-0.5 mr-2 flex-shrink-0" />
                        {detail}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>

        {/* Call to Action */}
        <motion.div
          initial="initial"
          whileInView="animate"
          viewport={{ once: true }}
          variants={fadeInUp}
          className="text-center mt-16"
        >
          <div className="bg-gradient-to-r from-[#005B99] to-[#4e88ca] dark:from-[#1e2436] dark:to-[#363c4e] rounded-2xl p-8 md:p-12">
            <h3 className="text-2xl md:text-3xl font-bold text-white mb-4 font-['Roboto_Slab']">
              Ready to Transform Your Ministry?
            </h3>
            <p className="text-white/90 mb-6 max-w-2xl mx-auto font-['Poppins']">
              Join hundreds of ministers who have been equipped and empowered through our comprehensive programs.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
                asChild
                size="lg"
                className="bg-[#FFD700] hover:bg-[#e9aa2b] text-[#005B99] font-semibold px-8 py-4 text-lg rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
              >
                <Link href="#enroll">
                  Apply Now
                </Link>
              </Button>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
} 