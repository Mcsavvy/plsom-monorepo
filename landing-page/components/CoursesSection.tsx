"use client"

import { motion } from "framer-motion"
import { BookOpen, Calendar } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { courses } from "@/data"

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

export default function CoursesSection() {
  return (
    <section id="courses" className="py-20 bg-white dark:bg-[#1e2436]">
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
            Course Catalog
          </motion.h2>
          <motion.p
            variants={fadeInUp}
            className="text-lg text-[#5c5c5c] dark:text-[#e0e0e0] max-w-3xl mx-auto font-['Poppins']"
          >
            Explore our comprehensive curriculum designed to build strong ministry foundations and advanced skills
          </motion.p>
        </motion.div>

        <motion.div
          initial="initial"
          whileInView="animate"
          viewport={{ once: true }}
          variants={staggerContainer}
          className="space-y-12"
        >
          {courses.map((category, categoryIndex) => (
            <motion.div key={categoryIndex} variants={fadeInUp}>
              <div className="mb-8">
                <h3 className="text-2xl font-bold text-[#005B99] dark:text-[#FFD700] mb-2 font-['Roboto_Slab']">
                  {category.category}
                </h3>
                <p className="text-[#5c5c5c] dark:text-[#e0e0e0] font-['Poppins']">{category.description}</p>
              </div>

              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {category.courses.map((course, courseIndex) => (
                  <Card
                    key={courseIndex}
                    className="bg-[#F5F5F5] dark:bg-[#363c4e] border-[#c2c2c2] dark:border-[#9b9b9b] hover:shadow-lg transition-all duration-300 hover:scale-105"
                  >
                    <CardHeader>
                      <div className="flex items-start justify-between mb-2">
                        <Badge variant="outline" className="text-xs">
                          {course.code}
                        </Badge>
                        <div className="flex items-center space-x-2 text-xs text-[#5c5c5c] dark:text-[#e0e0e0]">
                          <Calendar className="w-3 h-3" />
                          <span>{course.duration}</span>
                        </div>
                      </div>
                      <CardTitle className="text-lg text-[#333333] dark:text-[#FFFFFF] font-['Poppins']">
                        {course.title}
                      </CardTitle>
                      <div className="flex items-center space-x-4 text-sm text-[#5c5c5c] dark:text-[#e0e0e0]">
                        <div className="flex items-center space-x-1">
                          <BookOpen className="w-4 h-4" />
                          <span>{course.modules} modules</span>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <CardDescription className="text-[#5c5c5c] dark:text-[#e0e0e0] mb-4 font-['Poppins']">
                        {course.description}
                      </CardDescription>
                      <div>
                        <h5 className="font-medium text-[#005B99] dark:text-[#FFD700] mb-2 text-sm">Key Topics:</h5>
                        <div className="flex flex-wrap gap-1">
                          {course.topics.map((topic, topicIndex) => (
                            <Badge
                              key={topicIndex}
                              variant="secondary"
                              className="text-xs bg-[#b7e9ff] text-[#005B99]"
                            >
                              {topic}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
} 