import React from "react"
import { Check } from "lucide-react"
import { cn } from "@/lib/utils"

interface Step {
  id: string
  title: string
  description?: string
}

interface StepperProps {
  steps: Step[]
  currentStep: number
  className?: string
}

export function Stepper({ steps, currentStep, className }: StepperProps) {
  return (
    <div className={cn("w-full", className)}>
      <div className="flex items-center justify-between">
        {steps.map((step, index) => {
          const stepNumber = index + 1
          const isCompleted = stepNumber < currentStep
          const isCurrent = stepNumber === currentStep
          const isUpcoming = stepNumber > currentStep

          return (
            <React.Fragment key={step.id}>
              <div className="flex flex-col items-center flex-1 min-w-0">
                <div
                  className={cn(
                    "flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-full border-2 text-xs sm:text-sm font-semibold transition-colors flex-shrink-0",
                    {
                      "border-[#005B99] bg-[#005B99] text-white": isCompleted,
                      "border-[#FFD700] bg-[#FFD700] text-[#005B99]": isCurrent,
                      "border-[#c2c2c2] bg-white text-[#5c5c5c] dark:border-[#9b9b9b] dark:bg-[#363c4e] dark:text-[#e0e0e0]": isUpcoming,
                    }
                  )}
                >
                  {isCompleted ? (
                    <Check className="h-3 w-3 sm:h-5 sm:w-5" />
                  ) : (
                    <span>{stepNumber}</span>
                  )}
                </div>
                <div className="mt-1 sm:mt-2 text-center px-1">
                  <div
                    className={cn(
                      "text-xs sm:text-sm font-medium leading-tight",
                      {
                        "text-[#005B99] dark:text-[#FFD700]": isCompleted || isCurrent,
                        "text-[#5c5c5c] dark:text-[#e0e0e0]": isUpcoming,
                      }
                    )}
                  >
                    {step.title}
                  </div>
                  {step.description && (
                    <div className="text-xs text-[#5c5c5c] dark:text-[#e0e0e0] mt-0.5 hidden sm:block">
                      {step.description}
                    </div>
                  )}
                </div>
              </div>
              {index < steps.length - 1 && (
                <div
                  className={cn(
                    "h-0.5 flex-1 mx-2 sm:mx-4 transition-colors min-w-[20px]",
                    {
                      "bg-[#005B99]": stepNumber < currentStep,
                      "bg-[#FFD700]": stepNumber === currentStep,
                      "bg-[#c2c2c2] dark:bg-[#9b9b9b]": stepNumber > currentStep,
                    }
                  )}
                />
              )}
            </React.Fragment>
          )
        })}
      </div>
    </div>
  )
} 