"use client";

import { motion } from "framer-motion";
import Image from "next/image";

export function LoadingSpinner() {
  return (
    <div className="from-plsom-primary-100 via-plsom-primary-200 to-plsom-accent-100 flex min-h-screen items-center justify-center bg-gradient-to-br">
      <motion.div
        className="flex flex-col items-center space-y-6"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8 }}
      >
        {/* Logo with themed ring */}
        <div className="relative h-20 w-20">
          <div className="absolute inset-0 rounded-full bg-plsom-primary-200/30 backdrop-blur-sm" />
          <div className="absolute inset-2 flex items-center justify-center rounded-full bg-plsom-primary-300/40 backdrop-blur-sm">
            <Image
              src="/logo.png"
              alt="PLSOM Logo"
              width={40}
              height={40}
              className="h-10 w-10 object-contain"
            />
          </div>

          {/* Spinning ring */}
          <motion.div
            className="absolute inset-0 rounded-full border-4 border-plsom-primary-300/60 border-t-plsom-primary-600"
            animate={{ rotate: 360 }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
          />
        </div>

        <motion.p
          className="font-heading text-center text-lg text-foreground"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          Loading PLSOM...
        </motion.p>

        {/* Progress dots */}
        <motion.div className="flex space-x-2">
          {[0, 1, 2].map(i => (
            <motion.div
              key={i}
              className="h-2 w-2 rounded-full bg-foreground"
              animate={{
                scale: [1, 1.5, 1],
                opacity: [0.5, 1, 0.5],
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                delay: i * 0.2,
              }}
            />
          ))}
        </motion.div>
      </motion.div>
    </div>
  );
}
