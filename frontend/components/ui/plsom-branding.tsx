'use client'

import Image from 'next/image'
import { motion } from 'framer-motion'

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.3,
      delayChildren: 0.2
    }
  }
}

const itemVariants = {
  hidden: { y: 30, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: { duration: 0.8, ease: "easeOut" }
  }
}

const logoVariants = {
  hidden: { scale: 0, rotate: -180 },
  visible: {
    scale: 1,
    rotate: 0,
    transition: {
      type: "spring",
      stiffness: 150,
      damping: 12,
      duration: 1.2
    }
  }
}

export function PLSOMBranding() {
  return (
    <motion.div 
      className="text-center text-white"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <motion.div 
        className="mb-8"
        variants={itemVariants}
      >
        {/* Animated logo container */}
        <motion.div 
          className="relative w-32 h-32 mx-auto mb-6"
          variants={logoVariants}
        >
          {/* Glowing ring effect */}
          <motion.div 
            className="absolute inset-0 rounded-full bg-gradient-to-r from-plsom-accent-100 to-white opacity-30"
            animate={{ 
              scale: [1, 1.1, 1],
              opacity: [0.3, 0.6, 0.3]
            }}
            transition={{ 
              duration: 3, 
              repeat: Infinity, 
              ease: "easeInOut" 
            }}
          />
          
          {/* Logo */}
          <motion.div
            className="relative w-full h-full bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center shadow-2xl border border-white/20"
            whileHover={{ scale: 1.05 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            <Image
              src="/logo.png"
              alt="PLSOM Logo"
              width={96}
              height={96}
              className="w-24 h-24 object-contain"
              priority
            />
          </motion.div>

          {/* Orbiting elements */}
          {[...Array(3)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-3 h-3 bg-plsom-accent-100 rounded-full"
              style={{
                top: '50%',
                left: '50%',
                transformOrigin: '0 0'
              }}
              animate={{
                rotate: [0, 360],
                scale: [1, 1.2, 1]
              }}
              transition={{
                rotate: { duration: 10 + i * 2, repeat: Infinity, ease: "linear" },
                scale: { duration: 2, repeat: Infinity, ease: "easeInOut", delay: i * 0.5 }
              }}
              initial={{
                x: 80 + i * 10,
                y: -6
              }}
            />
          ))}
        </motion.div>

        <motion.h1
          className="text-3xl md:text-4xl font-heading font-bold mb-3"
          variants={itemVariants}
        >
          <motion.span
            className="inline-block"
            whileHover={{ scale: 1.05 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            Perfect Love School of Ministry
          </motion.span>
        </motion.h1>
        
        <motion.div
          className="relative"
          variants={itemVariants}
        >
          <motion.p 
            className="text-lg md:text-xl opacity-90 font-body"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.9 }}
            transition={{ delay: 1, duration: 0.8 }}
          >
            Learning Management System
          </motion.p>
          
          {/* Underline animation */}
          <motion.div
            className="absolute bottom-0 left-1/2 h-0.5 bg-plsom-accent-100"
            initial={{ width: 0, x: '-50%' }}
            animate={{ width: '60%' }}
            transition={{ delay: 1.5, duration: 0.8, ease: "easeOut" }}
          />
        </motion.div>
      </motion.div>
      
      <motion.div 
        className="space-y-6 text-sm opacity-80"
        variants={itemVariants}
      >
        <motion.div
          className="space-y-2"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 0.8, y: 0 }}
          transition={{ delay: 2, duration: 0.8 }}
        >
          <motion.p
            whileHover={{ scale: 1.05, opacity: 1 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            Empowering Ministry Leaders Through Quality Education
          </motion.p>
          
          <motion.div 
            className="flex items-center justify-center space-x-2 mt-4"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 2.5, duration: 0.5 }}
          >
            {['🕊️', '🌍', '❤️', '📖'].map((emoji, i) => (
              <motion.span
                key={i}
                className="text-xl"
                animate={{ 
                  y: [0, -5, 0],
                  scale: [1, 1.1, 1]
                }}
                transition={{ 
                  duration: 2,
                  repeat: Infinity,
                  delay: i * 0.3,
                  ease: "easeInOut"
                }}
              >
                {emoji}
              </motion.span>
            ))}
          </motion.div>
        </motion.div>
        
        <motion.div 
          className="border-t border-white/20 pt-4"
          initial={{ opacity: 0, scaleX: 0 }}
          animate={{ opacity: 0.8, scaleX: 1 }}
          transition={{ delay: 3, duration: 0.8 }}
        >
          <p className="font-body">&copy; 2024 PLSOM. Private Learning Platform.</p>
        </motion.div>
      </motion.div>
    </motion.div>
  )
}