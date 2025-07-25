'use client'

import { forwardRef, HTMLAttributes } from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

const Card = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { onDrag, onDragEnd, onDragStart, onAnimationStart, onAnimationEnd, ...safeProps } = props
    
    return (
      <motion.div
        ref={ref}
        className={cn(
          'rounded-lg border bg-card text-card-foreground shadow-sm',
          'transition-all duration-300 hover:shadow-md',
          className
        )}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        whileHover={{ scale: 1.02 }}
        {...safeProps}
      />
    )
  }
)
Card.displayName = 'Card'

const CardHeader = forwardRef<
  HTMLDivElement,
  HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { onDrag, onDragEnd, onDragStart, onAnimationStart, onAnimationEnd, ...safeProps } = props

  return (
    <motion.div
      ref={ref}
      className={cn('flex flex-col space-y-1.5 p-6', className)}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.1, duration: 0.3 }}
      {...safeProps}
    />
  )
})
CardHeader.displayName = 'CardHeader'

const CardTitle = forwardRef<
  HTMLParagraphElement,
  HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { onDrag, onDragEnd, onDragStart, onAnimationStart, onAnimationEnd, ...safeProps } = props

  return (
    <motion.h3
      ref={ref}
      className={cn(
        'text-2xl font-semibold leading-none tracking-tight',
        'text-foreground font-heading',
        className
      )}
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.2, duration: 0.3 }}
      {...safeProps}
    />
  )
})
CardTitle.displayName = 'CardTitle'

const CardDescription = forwardRef<
  HTMLParagraphElement,
  HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { onDrag, onDragEnd, onDragStart, onAnimationStart, onAnimationEnd, ...safeProps } = props

  return (
    <motion.p
      ref={ref}
      className={cn('text-sm text-muted-foreground', className)}
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.3, duration: 0.3 }}
      {...safeProps}
    />
  )
})
CardDescription.displayName = 'CardDescription'

const CardContent = forwardRef<
  HTMLDivElement,
  HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { onDrag, onDragEnd, onDragStart, onAnimationStart, onAnimationEnd, ...safeProps } = props

  return (
    <motion.div
      ref={ref}
      className={cn('p-6 pt-0', className)}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2, duration: 0.3 }}
      {...safeProps}
    />
  )
})
CardContent.displayName = 'CardContent'

const CardFooter = forwardRef<
  HTMLDivElement,
  HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { onDrag, onDragEnd, onDragStart, onAnimationStart, onAnimationEnd, ...safeProps } = props

  return (
    <motion.div
      ref={ref}
      className={cn('flex items-center p-6 pt-0', className)}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4, duration: 0.3 }}
      {...safeProps}
    />
  )
})
CardFooter.displayName = 'CardFooter'

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent }