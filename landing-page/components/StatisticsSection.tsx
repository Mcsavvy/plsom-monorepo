"use client"

import { motion } from "framer-motion"
import { Card, CardContent } from "@/components/ui/card"
import { statistics, additionalStats } from "@/data"
import { useCountUp } from "@/hooks/use-countup"

// Helper function to extract numeric value and suffix from strings like "500+", "95%", etc.
function parseStatNumber(numberString: string) {
  const match = numberString.match(/^(\d+)(.*)$/)
  if (match) {
    return {
      value: parseInt(match[1], 10),
      suffix: match[2],
    }
  }
  return { value: 0, suffix: "" }
}

// Individual statistic component with countup animation
function StatCard({ stat, index }: { stat: any; index: number }) {
  const { value, suffix } = parseStatNumber(stat.number)
  
  const { countUpRef } = useCountUp<HTMLHeadingElement>({
    end: value,
    duration: 2.5,
    suffix: suffix,
    enableScrollSpy: true,
    scrollSpyOnce: true,
    scrollSpyDelay: index * 200, // Stagger the animations
  })

  return (
    <motion.div variants={fadeInUp}>
      <Card className="bg-white/10 backdrop-blur-md border-white/20 hover:bg-white/20 transition-all duration-300 hover:scale-105 text-center p-6">
        <CardContent className="space-y-4">
          <div className="w-16 h-16 mx-auto bg-[#FFD700] rounded-full flex items-center justify-center">
            <stat.icon className="w-8 h-8 text-[#005B99]" />
          </div>
          <div>
            <h3 
              ref={countUpRef}
              className="text-4xl font-bold text-white mb-2 font-['Roboto_Slab']"
            >
              {stat.number}
            </h3>
            <h4 className="text-xl font-semibold text-[#FFD700] mb-2 font-['Poppins']">{stat.label}</h4>
            <p className="text-white/80 text-sm font-['Poppins']">{stat.description}</p>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

// Individual additional stat component with countup animation
function AdditionalStatCard({ item, index }: { item: any; index: number }) {
  // const { value, suffix } = parseStatNumber(item.value)
  
  // const { countUpRef } = useCountUp<HTMLHeadingElement>({
  //   end: value,
  //   duration: 2.5,
  //   suffix: suffix,
  //   enableScrollSpy: true,
  //   scrollSpyOnce: true,
  //   scrollSpyDelay: index * 200, // Stagger the animations
  // })

  return (
    <motion.div variants={fadeInUp} className="text-center">
      <h3
        className="text-3xl font-bold text-[#FFD700] mb-2 font-['Roboto_Slab']"
      >
        {item.value}
      </h3>
      <h4 className="text-lg font-semibold text-white mb-2 font-['Poppins']">{item.title}</h4>
      <p className="text-white/80 text-sm font-['Poppins']">{item.description}</p>
    </motion.div>
  )
}

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

export default function StatisticsSection() {
  return (
    <section className="py-20 bg-gradient-to-br from-[#005B99] to-[#4e88ca] dark:from-[#1e2436] dark:to-[#363c4e]">
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
            className="text-3xl md:text-4xl font-bold text-white mb-6 font-['Roboto_Slab']"
          >
            Our Impact in Numbers
          </motion.h2>
          <motion.p variants={fadeInUp} className="text-lg text-white/90 max-w-3xl mx-auto font-['Poppins']">
            See the transformative impact of PLSOM's ministry training programs across the globe
          </motion.p>
        </motion.div>

        <motion.div
          initial="initial"
          whileInView="animate"
          viewport={{ once: true }}
          variants={staggerContainer}
          className="grid md:grid-cols-2 lg:grid-cols-4 gap-8"
        >
          {statistics.map((stat, index: number) => (
            <StatCard key={index} stat={stat} index={index} />
          ))}
        </motion.div>

        {/* Additional Stats */}
        <motion.div
          initial="initial"
          whileInView="animate"
          viewport={{ once: true }}
          variants={staggerContainer}
          className="mt-16 grid md:grid-cols-3 gap-8"
        >
          {additionalStats.map((item, index: number) => (
            <AdditionalStatCard key={index} item={item} index={index} />
          ))}
        </motion.div>
      </div>
    </section>
  )
} 