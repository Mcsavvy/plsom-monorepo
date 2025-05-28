"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Clock, BookOpen, CheckCircle, Award, GraduationCap, Plus, Minus } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { programs } from "@/data"
import Image from "next/image"
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

export default function ProgramsSection() {
  const [expandedProgram, setExpandedProgram] = useState<string | null>(null)

  return (
    <section id="programs" className="py-20 bg-[#F5F5F5] dark:bg-[#0F1626]">
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
            Our Programs
          </motion.h2>
          <motion.p
            variants={fadeInUp}
            className="text-lg text-[#5c5c5c] dark:text-[#e0e0e0] max-w-3xl mx-auto font-['Poppins']"
          >
            Choose from our comprehensive programs designed to equip you for effective ministry
          </motion.p>
        </motion.div>

        <motion.div
          initial="initial"
          whileInView="animate"
          viewport={{ once: true }}
          variants={staggerContainer}
          className="grid md:grid-cols-2 gap-8 max-w-6xl mx-auto"
        >
          {programs.map((program, index: number) => (
            <motion.div key={index} variants={fadeInUp} id={`program-${program.id}`}>
              <Card className="h-full bg-white dark:bg-[#1e2436] border-[#c2c2c2] dark:border-[#363c4e] hover:shadow-xl transition-all duration-300">
                <div className="relative">
                  <Image
                    src={program.image || "/placeholder.svg"}
                    alt={program.title}
                    width={400}
                    height={300}
                    className="w-full h-60 object-cover object-right-top rounded-t-lg"
                  />
                  <div className="absolute top-4 right-4 bg-[#FFD700] text-[#005B99] px-3 py-1 rounded-full text-sm font-semibold">
                    {program.duration}
                  </div>
                  <div className="absolute bottom-4 left-4 bg-[#005B99] text-white px-3 py-1 rounded-full text-sm font-semibold">
                    FREE
                  </div>
                  <div className="absolute bottom-4 right-4 bg-white/90 dark:bg-[#1e2436]/90 px-3 py-1 rounded-full text-sm font-semibold">
                    {program.format}
                  </div>
                </div>
                <CardHeader>
                  <CardTitle className="text-[#333333] dark:text-[#FFFFFF] font-['Roboto_Slab']">
                    {program.title}
                  </CardTitle>
                  <div className="flex flex-wrap gap-2 mt-2">
                    <Badge variant="secondary" className="bg-[#b7e9ff] text-[#005B99]">
                      <Clock className="w-3 h-3 mr-1" />
                      {program.estimatedTime}
                    </Badge>
                    <Badge variant="secondary" className="bg-[#b7e9ff] text-[#005B99]">
                      <BookOpen className="w-3 h-3 mr-1" />
                      {program.totalModules} modules
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <AnimatePresence>
                    <motion.div
                      id={`program-${program.id}`}
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.3 }}
                      className="space-y-4"
                    >
                      {program.modules.length > 3 && (
                        <div>
                          <h5 className="font-medium text-[#005B99] dark:text-[#FFD700] mb-2">Course Content:</h5>
                          <ul className="space-y-1 text-sm text-[#5c5c5c] dark:text-[#e0e0e0]">
                            {program.modules.map((module, idx) => (
                              <li key={idx} className="flex items-start">
                                <span className="w-2 h-2 bg-[#FFD700] rounded-full mt-2 mr-2 flex-shrink-0"></span>
                                {module}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      <div>
                        <h5 className="font-medium text-[#005B99] dark:text-[#FFD700] mb-2">Assessment Methods:</h5>
                        <ul className="space-y-1 text-sm text-[#5c5c5c] dark:text-[#e0e0e0]">
                          {program.assessment.map((item, idx) => (
                            <li key={idx} className="flex items-start">
                              <Award className="w-3 h-3 text-[#FFD700] mt-1 mr-2 flex-shrink-0" />
                              {item}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </motion.div>
                  </AnimatePresence>

                  <Button asChild className="w-full bg-[#005B99] hover:bg-[#4e88ca] text-white font-semibold rounded-lg transition-all duration-300 hover:scale-105">
                    <Link href={`#enroll`}>Apply Now</Link>
                  </Button>
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