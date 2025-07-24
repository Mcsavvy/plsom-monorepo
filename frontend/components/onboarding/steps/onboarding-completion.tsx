'use client'

import { motion } from 'framer-motion'
import { CheckCircle, Edit, ArrowRight, BookOpen, Users, Zap, Shield } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface CompletionData {
  // All the collected data from previous steps
  firstName?: string
  lastName?: string
  email?: string
  church?: { name: string }
  ministry?: { areasOfInterest: string[] }
}

interface OnboardingCompletionProps {
  invitationData: { email: string; program: string }
  onboardingData: CompletionData
  onNext: (data: Record<string, never>) => void
  onPrevious: () => void
}

const quickTips = [
  {
    icon: BookOpen,
    title: "Access Your Courses",
    description: "Find your assigned courses in the Learning Dashboard",
    color: "from-blue-100 to-blue-200"
  },
  {
    icon: Users,
    title: "Connect with Your Cohort", 
    description: "Join discussion forums and study groups",
    color: "from-green-100 to-green-200"
  },
  {
    icon: Zap,
    title: "Track Your Progress",
    description: "Monitor your learning journey and achievements",
    color: "from-purple-100 to-purple-200"
  },
  {
    icon: Shield,
    title: "Get Support",
    description: "Access help resources and contact support anytime",
    color: "from-orange-100 to-orange-200"
  }
]

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.3
    }
  }
}

const itemVariants = {
  hidden: { y: 30, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: { duration: 0.6, ease: "easeOut" }
  }
}

const celebrationVariants = {
  hidden: { scale: 0, rotate: -180 },
  visible: {
    scale: 1,
    rotate: 0,
    transition: {
      type: "spring",
      stiffness: 200,
      damping: 12,
      duration: 1.2
    }
  }
}

export function OnboardingCompletion({ invitationData, onboardingData, onNext, onPrevious }: OnboardingCompletionProps) {
  const handleComplete = () => {
    onNext({}) // This will trigger the final completion in the parent
  }

  const formatName = () => {
    const firstName = onboardingData.firstName || 'Student'
    const lastName = onboardingData.lastName || ''
    return `${firstName} ${lastName}`.trim()
  }

  return (
    <motion.div
      className="p-8 space-y-8"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Celebration Header */}
      <motion.div className="text-center" variants={itemVariants}>
        <motion.div
          className="w-24 h-24 bg-gradient-to-br from-green-100 to-green-200 rounded-full flex items-center justify-center mx-auto mb-6"
          variants={celebrationVariants}
        >
          <CheckCircle className="w-12 h-12 text-green-600" />
        </motion.div>
        
        <motion.h2
          className="text-3xl font-heading font-bold text-foreground mb-4"
          variants={itemVariants}
        >
          🎉 Congratulations, {formatName()}!
        </motion.h2>
        
        <motion.p
          className="text-lg text-muted-foreground max-w-2xl mx-auto"
          variants={itemVariants}
        >
          Your onboarding is complete! You&apos;re now ready to begin your transformative ministry journey with PLSOM.
        </motion.p>
      </motion.div>

      <div className="max-w-4xl mx-auto space-y-6">
        {/* Profile Summary */}
        <motion.div variants={itemVariants}>
          <Card className="bg-gradient-to-br from-plsom-primary-100/10 to-plsom-accent-100/10 border-plsom-primary-100/20">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Profile Summary
                <Button variant="ghost" size="sm" onClick={onPrevious}>
                  <Edit className="w-4 h-4 mr-2" />
                  Edit
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-muted-foreground">Name</p>
                    <p className="font-semibold">{formatName()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Email</p>
                    <p className="font-semibold">{invitationData.email}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Program</p>
                    <p className="font-semibold">{invitationData.program}</p>
                  </div>
                </div>
                <div className="space-y-3">
                  {onboardingData.church?.name && (
                    <div>
                      <p className="text-sm text-muted-foreground">Church</p>
                      <p className="font-semibold">{onboardingData.church.name}</p>
                    </div>
                  )}
                  {onboardingData.ministry?.areasOfInterest && onboardingData.ministry.areasOfInterest.length > 0 && (
                    <div>
                      <p className="text-sm text-muted-foreground">Ministry Interests</p>
                      <p className="font-semibold">
                        {onboardingData.ministry.areasOfInterest.slice(0, 3).join(', ')}
                        {onboardingData.ministry.areasOfInterest.length > 3 && ` +${onboardingData.ministry.areasOfInterest.length - 3} more`}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Welcome Message */}
        <motion.div variants={itemVariants}>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center space-y-4">
                <h3 className="text-xl font-heading font-semibold text-foreground">
                  Welcome to the PLSOM Family!
                </h3>
                <p className="text-muted-foreground max-w-2xl mx-auto">
                  You&apos;ve joined a community of passionate ministry leaders committed to growing in faith, 
                  knowledge, and service. Your journey of theological education and spiritual formation begins now.
                </p>
                <div className="bg-plsom-primary-100/10 rounded-lg p-4 mt-4">
                  <p className="text-plsom-primary-100 font-medium">
                    &quot;Study to show yourself approved unto God, a workman that needs not to be ashamed, 
                    rightly dividing the word of truth.&quot; - 2 Timothy 2:15
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Getting Started Guide */}
        <motion.div variants={itemVariants}>
          <Card>
            <CardHeader>
              <CardTitle>Quick Start Guide</CardTitle>
              <p className="text-muted-foreground">
                Here&apos;s how to make the most of your PLSOM experience
              </p>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-4">
                {quickTips.map((tip, index) => (
                  <motion.div
                    key={index}
                    className={`bg-gradient-to-br ${tip.color} rounded-lg p-4 border border-gray-200`}
                    variants={itemVariants}
                    whileHover={{ scale: 1.02 }}
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 bg-white/80 rounded-full flex items-center justify-center flex-shrink-0">
                        <tip.icon className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-foreground text-sm">
                          {tip.title}
                        </h4>
                        <p className="text-xs text-muted-foreground mt-1">
                          {tip.description}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Support Information */}
        <motion.div variants={itemVariants}>
          <Card className="bg-muted/50">
            <CardContent className="pt-6">
              <div className="text-center space-y-3">
                <h4 className="font-semibold text-foreground">Need Help Getting Started?</h4>
                <p className="text-sm text-muted-foreground">
                  Our support team is here to help you succeed in your studies
                </p>
                <div className="flex flex-wrap justify-center gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                    <span>Email: support@plsom.org</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                    <span>Phone: +1 (555) 123-4567</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
                    <span>Live Chat: Available 9AM-5PM EST</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Final Action */}
      <motion.div 
        className="text-center pt-6"
        variants={itemVariants}
      >
        <motion.div
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <Button
            onClick={handleComplete}
            size="lg"
            className="btn-plsom-primary px-8 py-4 text-lg"
          >
            Enter Learning Platform
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
        </motion.div>
        
        <motion.p 
          className="text-sm text-muted-foreground mt-4"
          variants={itemVariants}
        >
          You&apos;ll be redirected to your personalized learning dashboard
        </motion.p>
      </motion.div>

      {/* Celebration Animation */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {[...Array(12)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 rounded-full"
            style={{
              background: `linear-gradient(45deg, var(--color-plsom-primary-100), var(--color-plsom-accent-100))`
            }}
            initial={{
              x: '50%',
              y: '50%',
              scale: 0,
              opacity: 0
            }}
            animate={{
              x: `${50 + (Math.random() - 0.5) * 100}%`,
              y: `${50 + (Math.random() - 0.5) * 100}%`,
              scale: [0, 1.5, 0],
              opacity: [0, 1, 0],
              rotate: [0, 360]
            }}
            transition={{
              duration: 3,
              delay: i * 0.2,
              ease: "easeOut"
            }}
          />
        ))}
      </div>
    </motion.div>
  )
}
