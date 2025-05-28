"use client"

import { motion } from "framer-motion"
import { CheckCircle } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { aboutSections, whyChooseUs } from "@/data"

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

export default function AboutSection() {

  return (
    <section id="about" className="py-20 bg-white dark:bg-[#1e2436]">
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
            About Perfect Love School of Ministry
          </motion.h2>
          <motion.p
            variants={fadeInUp}
            className="text-lg text-[#5c5c5c] dark:text-[#e0e0e0] max-w-3xl mx-auto font-['Poppins']"
          >
            We are committed to raising competent, productive ministers who are equipped not only spiritually but also
            practically for various roles in ministry and society.
          </motion.p>
        </motion.div>

        <motion.div
          initial="initial"
          whileInView="animate"
          viewport={{ once: true }}
          variants={staggerContainer}
          className="mb-16"
        >
          <motion.h3
            variants={fadeInUp}
            className="text-2xl font-bold text-[#333333] dark:text-[#FFFFFF] mb-6 text-center font-['Roboto_Slab']"
          >
            Why Choose Us?
          </motion.h3>
          <motion.ul
            variants={fadeInUp}
            className="max-w-3xl mx-auto space-y-4 text-lg text-[#5c5c5c] dark:text-[#e0e0e0] font-['Poppins'] flex flex-col items-start sm:items-center"
          >
            {whyChooseUs.map((reason, index) => (
              <li key={index} className="flex items-center">
                <CheckCircle className="w-6 h-6 mr-2 text-[#FFD700] shrink-0" />
                {reason}
              </li>
            ))}
          </motion.ul>
        </motion.div>

        <motion.div
          initial="initial"
          whileInView="animate"
          viewport={{ once: true }}
          variants={staggerContainer}
          className="grid md:grid-cols-2 gap-8"
        >
          {aboutSections.map((section, index) => (
            <motion.div key={section.id} variants={fadeInUp}>
              <Card className="h-full bg-[#F5F5F5] dark:bg-[#363c4e] border-[#c2c2c2] dark:border-[#9b9b9b] hover:shadow-lg transition-all duration-300">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-[#005B99] dark:bg-[#FFD700] rounded-full flex items-center justify-center shrink-0">
                        <section.icon className="w-6 h-6 text-white dark:text-[#005B99] shrink-0" />
                      </div>
                      <CardTitle className="text-[#333333] dark:text-[#FFFFFF] font-['Poppins']">
                        {section.title}
                      </CardTitle>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-[#5c5c5c] dark:text-[#e0e0e0] mb-4 font-['Poppins']">
                    <blockquote className="text-[#5c5c5c] dark:text-[#e0e0e0] mb-4 font-['Poppins'] italic border-l-2 border-[#FFD700] pl-4">
                      {section.content}
                      <cite className="text-[#FFD700] font-semibold text-sm block my-2">{section.verse}</cite>
                    </blockquote>
                    <p className="text-[#5c5c5c] dark:text-[#e0e0e0] mb-4 font-['Poppins']">
                      {section.details}
                    </p>
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