"use client"

import { motion } from "framer-motion"
import { GraduationCap, Clock, CheckCircle, Users } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { enrollmentSteps, enrollmentRequirements } from "@/data"
import EnrollmentForm from "./EnrollmentForm"

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

export default function EnrollmentSection() {
  return (
    <section id="enroll" className="py-20 bg-[#F5F5F5] dark:bg-[#363c4e]">
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
            Enroll Today
          </motion.h2>
          <motion.p
            variants={fadeInUp}
            className="text-lg text-[#5c5c5c] dark:text-[#e0e0e0] max-w-3xl mx-auto font-['Poppins']"
          >
            Take the first step towards your ministry calling. Our enrollment process is designed to be simple and supportive.
          </motion.p>
        </motion.div>

        {/* Enrollment Steps */}
        <motion.div
          initial="initial"
          whileInView="animate"
          viewport={{ once: true }}
          variants={staggerContainer}
          className="mb-16"
        >
          <motion.h3
            variants={fadeInUp}
            className="text-2xl font-bold text-[#005B99] dark:text-[#FFD700] text-center mb-12 font-['Roboto_Slab']"
          >
            Enrollment Process
          </motion.h3>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {enrollmentSteps.map((step, index) => (
              <motion.div key={index} variants={fadeInUp}>
                <Card className="bg-white dark:bg-[#1e2436] border-[#c2c2c2] dark:border-[#9b9b9b] h-full hover:shadow-lg transition-all duration-300">
                  <CardContent className="p-6 text-center">
                    <div className="w-16 h-16 bg-[#005B99] dark:bg-[#FFD700] rounded-full flex items-center justify-center mx-auto mb-4">
                      <step.icon className="w-8 h-8 text-white dark:text-[#005B99]" />
                    </div>
                    <h4 className="font-semibold text-[#333333] dark:text-[#FFFFFF] mb-3 font-['Poppins']">
                      {step.title}
                    </h4>
                    <p className="text-[#5c5c5c] dark:text-[#e0e0e0] text-sm mb-3 font-['Poppins']">
                      {step.description}
                    </p>
                    <div className="text-xs text-[#005B99] dark:text-[#FFD700] font-semibold">
                      {step.timeline}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Requirements */}
        <motion.div
          initial="initial"
          whileInView="animate"
          viewport={{ once: true }}
          variants={staggerContainer}
          className="mb-16"
        >
          <motion.h3
            variants={fadeInUp}
            className="text-2xl font-bold text-[#005B99] dark:text-[#FFD700] text-center mb-8 font-['Roboto_Slab']"
          >
            Enrollment Requirements
          </motion.h3>

          <motion.div variants={fadeInUp} className="max-w-3xl mx-auto">
            <Card className="bg-white dark:bg-[#1e2436] border-[#c2c2c2] dark:border-[#9b9b9b]">
              <CardHeader>
                <CardTitle className="text-[#333333] dark:text-[#FFFFFF] font-['Poppins'] flex items-center">
                  <CheckCircle className="w-5 h-5 text-[#005B99] dark:text-[#FFD700] mr-2" />
                  Requirements Checklist
                </CardTitle>
                <CardDescription className="text-[#5c5c5c] dark:text-[#e0e0e0] font-['Poppins']">
                  Please ensure you meet all requirements before applying
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-4">
                  {enrollmentRequirements.map((requirement, index) => (
                    <div key={index} className="flex items-start space-x-3">
                      <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                      <span className="text-[#333333] dark:text-[#FFFFFF] text-sm font-['Poppins']">
                        {requirement}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>

        {/* Enrollment Form */}
        <motion.div
          initial="initial"
          whileInView="animate"
          viewport={{ once: true }}
          variants={fadeInUp}
        >
          <EnrollmentForm />
        </motion.div>
      </div>
    </section>
  )
} 