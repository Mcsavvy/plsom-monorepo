'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Mail, Phone, Send, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'

interface ForgotPasswordRequestProps {
  onSwitchFlow?: (flow: 'login' | 'invitation') => void
  onOtpSent?: (contactInfo: string, method: 'email' | 'phone') => void
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2
    }
  }
}

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: { duration: 0.5, ease: "easeOut" }
  }
}

export function ForgotPasswordRequest({ onSwitchFlow, onOtpSent }: ForgotPasswordRequestProps) {
  const [contactMethod, setContactMethod] = useState<'email' | 'phone'>('email')
  const [contactInfo, setContactInfo] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
    setSuccess(null)

    // Validate input
    if (contactMethod === 'email') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(contactInfo)) {
        setError('Please enter a valid email address')
        setIsLoading(false)
        return
      }
    } else {
      const phoneRegex = /^\+?[\d\s\-\(\)]{10,}$/
      if (!phoneRegex.test(contactInfo)) {
        setError('Please enter a valid phone number')
        setIsLoading(false)
        return
      }
    }

    try {
      // TODO: Replace with actual API call
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // Simulate success
      setSuccess(`OTP sent to your ${contactMethod}`)
      
      // Call the callback to switch to OTP verification
      setTimeout(() => {
        onOtpSent?.(contactInfo, contactMethod)
      }, 1500)
      
    } catch {
      setError(`Failed to send OTP to your ${contactMethod}. Please try again.`)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <motion.div
      className="space-y-6"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <motion.div className="text-center" variants={itemVariants}>
        <motion.div
          className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4"
          whileHover={{ scale: 1.05 }}
          transition={{ type: "spring", stiffness: 300 }}
        >
          <Send className="w-8 h-8 text-primary" />
        </motion.div>
        <h2 className="text-2xl font-heading font-bold text-foreground mb-2">
          Forgot Password?
        </h2>
        <p className="text-muted-foreground">
          Enter your email or phone number to receive an OTP
        </p>
      </motion.div>

      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          </motion.div>
        )}
        
        {success && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            <Alert variant="success">
              <AlertDescription>{success}</AlertDescription>
            </Alert>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.form onSubmit={handleSubmit} className="space-y-4" variants={itemVariants}>
        {/* Contact Method Toggle */}
        <motion.div className="space-y-3" variants={itemVariants}>
          <Label className="text-sm font-medium">Choose verification method</Label>
          <div className="flex space-x-2 p-1 bg-muted rounded-lg">
            <motion.button
              type="button"
              onClick={() => {
                setContactMethod('email')
                setContactInfo('')
                setError(null)
              }}
              className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-md text-sm font-medium transition-all ${
                contactMethod === 'email'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Mail className="w-4 h-4" />
              Email
            </motion.button>
            <motion.button
              type="button"
              onClick={() => {
                setContactMethod('phone')
                setContactInfo('')
                setError(null)
              }}
              className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-md text-sm font-medium transition-all ${
                contactMethod === 'phone'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Phone className="w-4 h-4" />
              Phone
            </motion.button>
          </div>
        </motion.div>

        {/* Contact Info Input */}
        <motion.div className="space-y-2" variants={itemVariants}>
          <Label htmlFor="contactInfo">
            {contactMethod === 'email' ? 'Email Address' : 'Phone Number'}
          </Label>
          <div className="relative">
            {contactMethod === 'email' ? (
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            ) : (
              <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            )}
            <Input
              id="contactInfo"
              name="contactInfo"
              type={contactMethod === 'email' ? 'email' : 'tel'}
              value={contactInfo}
              onChange={(e) => setContactInfo(e.target.value)}
              required
              className="pl-10"
              placeholder={
                contactMethod === 'email'
                  ? 'your.email@plsom.org'
                  : '+1 (555) 123-4567'
              }
            />
          </div>
          <p className="text-xs text-muted-foreground">
            {contactMethod === 'email'
              ? 'We\'ll send a 6-digit OTP to your email address'
              : 'We\'ll send a 6-digit OTP via SMS to your phone number'}
          </p>
        </motion.div>

        <motion.div
          variants={itemVariants}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <Button
            type="submit"
            disabled={isLoading || success !== null}
            className="btn-plsom-primary w-full"
          >
            {isLoading ? (
              <div className="flex items-center gap-2">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
                />
                Sending OTP...
              </div>
            ) : success ? (
              <div className="flex items-center gap-2">
                <Send className="w-4 h-4" />
                OTP Sent!
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Send className="w-4 h-4" />
                Send OTP
              </div>
            )}
          </Button>
        </motion.div>
      </motion.form>

      <motion.div className="text-center space-y-3" variants={itemVariants}>
        <button
          type="button"
          onClick={() => onSwitchFlow?.('login')}
          className="flex items-center gap-2 text-primary hover:underline text-sm mx-auto"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Sign In
        </button>
        
        <p className="text-xs text-muted-foreground">
          Don't have an account? Contact your administrator for an invitation.
        </p>
      </motion.div>
    </motion.div>
  )
}