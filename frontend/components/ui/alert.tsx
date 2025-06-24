'use client'

import { forwardRef } from 'react'
import { motion, HTMLMotionProps } from 'framer-motion'
import { cn } from '@/lib/utils'
import { AlertCircle, CheckCircle, Info, XCircle } from 'lucide-react'

interface AlertProps extends Omit<HTMLMotionProps<'div'>, 'children'> {
  variant?: 'default' | 'destructive' | 'success' | 'warning'
  children?: React.ReactNode
}

const Alert = forwardRef<HTMLDivElement, AlertProps>(
  ({ className, variant = 'default', children, ...props }, ref) => {
    const icons = {
      default: Info,
      destructive: XCircle,
      success: CheckCircle,
      warning: AlertCircle,
    }

    const Icon = icons[variant]

    return (
      <motion.div
        ref={ref}
        role="alert"
        className={cn(
          'relative w-full rounded-lg border p-4 [&>svg~*]:pl-7 [&>svg+div]:translate-y-[-3px] [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg]:text-foreground',
          {
            'border-border text-foreground': variant === 'default',
            'border-destructive/50 text-destructive dark:border-destructive [&>svg]:text-destructive': variant === 'destructive',
            'border-green-500/50 text-green-700 dark:text-green-400 [&>svg]:text-green-600': variant === 'success',
            'border-yellow-500/50 text-yellow-700 dark:text-yellow-400 [&>svg]:text-yellow-600': variant === 'warning',
          },
          className
        )}
        initial={{ opacity: 0, scale: 0.95, y: -10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: -10 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        {...props}
      >
        <Icon className="h-4 w-4" />
        {children}
      </motion.div>
    )
  }
)
Alert.displayName = 'Alert'

const AlertDescription = forwardRef<
  HTMLParagraphElement,
  Omit<HTMLMotionProps<'div'>, 'children'> & { children?: React.ReactNode }
>(({ className, children, ...props }, ref) => (
  <motion.div
    ref={ref}
    className={cn('text-sm [&_p]:leading-relaxed', className)}
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    transition={{ delay: 0.1, duration: 0.3 }}
    {...props}
  >
    {children}
  </motion.div>
))
AlertDescription.displayName = 'AlertDescription'

export { Alert, AlertDescription }