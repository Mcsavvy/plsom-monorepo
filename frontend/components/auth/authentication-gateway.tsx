'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import  InvitationFlow  from './invitation-flow'
import  LoginForm  from './login-form'
import  PasswordResetFlow  from './password-reset-flow'
import { PLSOMBranding } from '@/components/ui/plsom-branding'

type AuthFlowType = 'login' | 'invitation' | 'password-reset' | 'loading'

const pageVariants = {
  initial: { opacity: 0, scale: 0.95 },
  animate: { 
    opacity: 1, 
    scale: 1,
    transition: {
      duration: 0.8,
      ease: "easeOut"
    }
  },
  exit: { 
    opacity: 0, 
    scale: 1.05,
    transition: {
      duration: 0.3
    }
  }
}

const slideVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 300 : -300,
    opacity: 0
  }),
  center: {
    zIndex: 1,
    x: 0,
    opacity: 1
  },
  exit: (direction: number) => ({
    zIndex: 0,
    x: direction < 0 ? 300 : -300,
    opacity: 0
  })
}

export function AuthenticationGateway() {
  const [authFlow, setAuthFlow] = useState<AuthFlowType>('loading')
  const [direction, setDirection] = useState(0)
  const searchParams = useSearchParams()

  useEffect(() => {
    // Simulate loading delay for smooth animation
    const timer = setTimeout(() => {
      // Check URL parameters to determine entry point
      const inviteToken = searchParams.get('invite')
      const resetToken = searchParams.get('reset')
      
      if (inviteToken) {
        setAuthFlow('invitation')
      } else if (resetToken) {
        setAuthFlow('password-reset')
      } else {
        setAuthFlow('login')
      }
    }, 1000)

    return () => clearTimeout(timer)
  }, [searchParams])

  const switchFlow = (newFlow: AuthFlowType) => {
    const currentIndex = ['login', 'invitation', 'password-reset'].indexOf(authFlow)
    const newIndex = ['login', 'invitation', 'password-reset'].indexOf(newFlow)
    setDirection(newIndex > currentIndex ? 1 : -1)
    setAuthFlow(newFlow)
  }

  if (authFlow === 'loading') {
    return (
      <motion.div 
        className="min-h-screen flex items-center justify-center bg-gradient-to-br from-plsom-primary-100 via-plsom-primary-200 to-plsom-accent-100"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <motion.div 
          className="text-center"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.6 }}
        >
          <motion.div
            animate={{ 
              rotate: 360,
              scale: [1, 1.1, 1]
            }}
            transition={{ 
              rotate: { duration: 2, repeat: Infinity, ease: "linear" },
              scale: { duration: 1.5, repeat: Infinity, ease: "easeInOut" }
            }}
            className="w-20 h-20 border-4 border-white border-t-transparent rounded-full mb-4 mx-auto"
          />
          <motion.p 
            className="text-white text-lg font-heading"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.5 }}
          >
            Loading PLSOM...
          </motion.p>
        </motion.div>
      </motion.div>
    )
  }

  return (
    <motion.div 
      className="min-h-screen flex flex-col lg:flex-row overflow-hidden"
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
    >
      {/* Left Side - PLSOM Branding with animated background */}
      <motion.div 
        className="lg:w-1/2 relative overflow-hidden"
        initial={{ x: -100, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.8, delay: 0.2 }}
      >
        {/* Animated gradient background */}
        <motion.div 
          className="absolute inset-0 bg-gradient-to-br from-plsom-primary-100 via-plsom-primary-200 to-plsom-accent-100"
          animate={{
            backgroundPosition: ["0% 0%", "100% 100%", "0% 0%"]
          }}
          transition={{ 
            duration: 20, 
            repeat: Infinity, 
            ease: "linear" 
          }}
        />
        
        {/* Floating particles effect */}
        <div className="absolute inset-0">
          {[...Array(20)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-2 h-2 bg-white/20 rounded-full"
              initial={{
                x: Math.random() * window.innerWidth,
                y: Math.random() * window.innerHeight,
              }}
              animate={{
                y: [null, -20, 20],
                x: [null, Math.random() * 50 - 25],
                opacity: [0.2, 0.8, 0.2]
              }}
              transition={{
                duration: 3 + Math.random() * 4,
                repeat: Infinity,
                ease: "easeInOut",
                delay: Math.random() * 2
              }}
            />
          ))}
        </div>

        <div className="relative z-10 flex items-center justify-center h-full p-8">
          <PLSOMBranding />
        </div>
      </motion.div>

      {/* Right Side - Authentication Forms */}
      <motion.div 
        className="lg:w-1/2 flex items-center justify-center p-8 bg-background relative"
        initial={{ x: 100, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.8, delay: 0.4 }}
      >
        {/* Subtle pattern overlay */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,_var(--color-plsom-primary-100)_1px,_transparent_1px)] bg-[length:20px_20px]" />
        </div>
        
        <div className="w-full max-w-md relative z-10">
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={authFlow}
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{
                x: { type: "spring", stiffness: 300, damping: 30 },
                opacity: { duration: 0.2 }
              }}
            >
              {authFlow === 'login' && <LoginForm onSwitchFlow={switchFlow} />}
              {authFlow === 'invitation' && <InvitationFlow onSwitchFlow={switchFlow} />}
              {authFlow === 'password-reset' && <PasswordResetFlow onSwitchFlow={switchFlow} />}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Development Link - Remove in production */}
        {process.env.NODE_ENV === 'development' && (
          <motion.div
            className="absolute bottom-4 right-4"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 1, duration: 0.5 }}
          >
            <a
              href="/dev-dashboard"
              className="text-xs text-white/70 hover:text-white bg-black/20 hover:bg-black/30 px-3 py-2 rounded-full backdrop-blur-sm transition-all duration-300"
            >
              🛠️ Dev Dashboard
            </a>
          </motion.div>
        )}
      </motion.div>
    </motion.div>
  )
}