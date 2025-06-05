'use client'

import { forwardRef, LabelHTMLAttributes } from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

interface LabelProps extends LabelHTMLAttributes<HTMLLabelElement> {}

const Label = forwardRef<HTMLLabelElement, LabelProps>(
  ({ className, ...props }, ref) => (
    <motion.label
      ref={ref}
      className={cn(
        'text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70',
        'text-foreground',
        className
      )}
      initial={{ opacity: 0, y: -5 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      {...props}
    />
  )
)
Label.displayName = 'Label'

export { Label }