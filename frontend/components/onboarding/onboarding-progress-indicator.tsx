'use client'

import { motion } from 'framer-motion'
import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ProgressStep {
  id: string
  title: string
  subtitle: string
}

interface OnboardingProgressIndicatorProps {
  steps: ProgressStep[]
  currentStep: string
  className?: string
}

export function OnboardingProgressIndicator({ steps, currentStep, className }: OnboardingProgressIndicatorProps) {
  const currentIndex = steps.findIndex(step => step.id === currentStep)

  return (
    <div className={cn("w-full", className)}>
      <div className="flex items-center justify-between relative">
        {/* Progress Line */}
        <div className="absolute top-6 left-6 right-6 h-0.5 bg-gray-200 dark:bg-gray-700 z-0">
          <motion.div
            className="h-full bg-gradient-to-r from-plsom-primary-100 to-plsom-accent-100"
            initial={{ width: '0%' }}
            animate={{ 
              width: `${(currentIndex / (steps.length - 1)) * 100}%` 
            }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          />
        </div>

        {/* Steps */}
        {steps.map((step, index) => {
          const isCompleted = index < currentIndex
          const isCurrent = index === currentIndex
          const isUpcoming = index > currentIndex

          return (
            <div key={step.id} className="flex flex-col items-center relative z-10">
              {/* Step Circle */}
              <motion.div
                className={cn(
                  "w-12 h-12 rounded-full border-2 flex items-center justify-center transition-all duration-300",
                  {
                    "bg-gradient-to-r from-plsom-primary-100 to-plsom-accent-100 border-plsom-primary-100 text-white": isCompleted,
                    "bg-plsom-primary-100 border-plsom-primary-100 text-white shadow-lg": isCurrent,
                    "bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-400": isUpcoming
                  }
                )}
                initial={{ scale: 0.8 }}
                animate={{ 
                  scale: isCurrent ? 1.1 : 1,
                }}
                transition={{ duration: 0.3 }}
              >
                {isCompleted ? (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2, duration: 0.3 }}
                  >
                    <Check className="w-6 h-6" />
                  </motion.div>
                ) : (
                  <span className="text-sm font-semibold">{index + 1}</span>
                )}
              </motion.div>

              {/* Step Info */}
              <div className="mt-3 text-center max-w-[120px]">
                <motion.h3
                  className={cn(
                    "text-sm font-semibold transition-colors duration-300",
                    {
                      "text-plsom-primary-100": isCompleted || isCurrent,
                      "text-gray-400": isUpcoming
                    }
                  )}
                  animate={{
                    scale: isCurrent ? 1.05 : 1
                  }}
                >
                  {step.title}
                </motion.h3>
                <p className={cn(
                  "text-xs mt-1 transition-colors duration-300",
                  {
                    "text-plsom-primary-200": isCompleted || isCurrent,
                    "text-gray-400": isUpcoming
                  }
                )}>
                  {step.subtitle}
                </p>
              </div>

              {/* Current Step Indicator */}
              {isCurrent && (
                <motion.div
                  className="absolute -bottom-2 w-2 h-2 bg-plsom-primary-100 rounded-full"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.3, duration: 0.3 }}
                />
              )}
            </div>
          )
        })}
      </div>

      {/* Current Step Description */}
      <motion.div
        className="mt-6 text-center"
        key={currentStep}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <h2 className="text-xl font-heading font-bold text-foreground">
          {steps[currentIndex]?.title} - {steps[currentIndex]?.subtitle}
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Step {currentIndex + 1} of {steps.length}
        </p>
      </motion.div>
    </div>
  )
}
