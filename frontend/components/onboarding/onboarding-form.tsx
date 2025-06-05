'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { UserPlus, Upload, X, User, Phone, Mail, GraduationCap } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import Image from 'next/image'

interface OnboardingFormProps {
  invitationData: any
  onComplete: () => void
}

interface OnboardingFormData {
  firstName: string
  lastName: string
  phoneNumber: string
  profileImage?: File | null
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

export default function OnboardingForm({ invitationData, onComplete }: OnboardingFormProps) {
  const [formData, setFormData] = useState<OnboardingFormData>({
    firstName: '',
    lastName: '',
    phoneNumber: '',
    profileImage: null
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError('Image file size must be less than 5MB')
        return
      }

      // Validate file type
      if (!file.type.startsWith('image/')) {
        setError('Please upload a valid image file')
        return
      }

      setFormData(prev => ({ ...prev, profileImage: file }))
      
      // Create preview
      const reader = new FileReader()
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string)
      }
      reader.readAsDataURL(file)
      setError(null)
    }
  }

  const removeImage = () => {
    setFormData(prev => ({ ...prev, profileImage: null }))
    setImagePreview(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    // Validate required fields
    if (!formData.firstName.trim() || !formData.lastName.trim() || !formData.phoneNumber.trim()) {
      setError('Please fill in all required fields')
      setIsLoading(false)
      return
    }

    // Validate phone number format
    const phoneRegex = /^\+?[\d\s\-\(\)]{10,}$/
    if (!phoneRegex.test(formData.phoneNumber)) {
      setError('Please enter a valid phone number')
      setIsLoading(false)
      return
    }

    try {
      // TODO: Replace with actual API call
      const formDataToSend = new FormData()
      formDataToSend.append('firstName', formData.firstName)
      formDataToSend.append('lastName', formData.lastName)
      formDataToSend.append('phoneNumber', formData.phoneNumber)
      formDataToSend.append('email', invitationData.email)
      if (formData.profileImage) {
        formDataToSend.append('profileImage', formData.profileImage)
      }

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      onComplete()
    } catch {
      setError('Failed to complete onboarding. Please try again.')
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
          <UserPlus className="w-8 h-8 text-primary" />
        </motion.div>
        <h2 className="text-2xl font-heading font-bold text-foreground mb-2">
          Welcome to PLSOM!
        </h2>
        <p className="text-muted-foreground text-sm">
          Complete your profile to get started
        </p>
      </motion.div>

      {/* Invitation Details Card */}
      <motion.div variants={itemVariants}>
        <Card className="bg-primary/5 border-primary/20">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-3">
              <Mail className="w-5 h-5 text-primary" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground">
                  {invitationData.email}
                </p>
                <p className="text-xs text-muted-foreground">
                  Invited as {invitationData.role} • {invitationData.program}
                </p>
              </div>
            </div>
          </CardHeader>
        </Card>
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
      </AnimatePresence>

      <motion.form onSubmit={handleSubmit} className="space-y-4" variants={itemVariants}>
        {/* Profile Image Upload */}
        <motion.div className="space-y-3" variants={itemVariants}>
          <Label className="text-sm font-medium">Profile Picture (Optional)</Label>
          
          {imagePreview ? (
            <motion.div 
              className="relative w-24 h-24 mx-auto"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200 }}
            >
              <Image
                src={imagePreview}
                alt="Profile preview"
                fill
                className="rounded-full object-cover"
              />
              <motion.button
                type="button"
                onClick={removeImage}
                className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-xs hover:bg-red-600 transition-colors"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <X className="w-3 h-3" />
              </motion.button>
            </motion.div>
          ) : (
            <motion.div 
              className="w-24 h-24 mx-auto border-2 border-dashed border-muted-foreground/30 rounded-full flex items-center justify-center cursor-pointer hover:border-primary/50 transition-colors"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <label htmlFor="profileImage" className="cursor-pointer flex flex-col items-center">
                <Upload className="w-6 h-6 text-muted-foreground mb-1" />
                <span className="text-xs text-muted-foreground">Upload</span>
              </label>
              <input
                id="profileImage"
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
            </motion.div>
          )}
          
          <p className="text-xs text-muted-foreground text-center">
            Maximum 5MB • You can change this later in settings
          </p>
        </motion.div>

        {/* Name Fields */}
        <div className="grid grid-cols-2 gap-4">
          <motion.div className="space-y-2" variants={itemVariants}>
            <Label htmlFor="firstName">First Name *</Label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                id="firstName"
                name="firstName"
                value={formData.firstName}
                onChange={handleInputChange}
                required
                className="pl-10"
                placeholder="John"
              />
            </div>
          </motion.div>
          
          <motion.div className="space-y-2" variants={itemVariants}>
            <Label htmlFor="lastName">Last Name *</Label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                id="lastName"
                name="lastName"
                value={formData.lastName}
                onChange={handleInputChange}
                required
                className="pl-10"
                placeholder="Doe"
              />
            </div>
          </motion.div>
        </div>

        {/* Phone Number */}
        <motion.div className="space-y-2" variants={itemVariants}>
          <Label htmlFor="phoneNumber">Phone Number *</Label>
          <div className="relative">
            <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              id="phoneNumber"
              name="phoneNumber"
              type="tel"
              value={formData.phoneNumber}
              onChange={handleInputChange}
              required
              className="pl-10"
              placeholder="+1 (555) 123-4567"
            />
          </div>
          <p className="text-xs text-muted-foreground">
            We'll use this for important notifications and updates
          </p>
        </motion.div>

        <motion.div
          variants={itemVariants}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="pt-4"
        >
          <Button
            type="submit"
            disabled={isLoading}
            className="btn-plsom-primary w-full"
          >
            {isLoading ? (
              <div className="flex items-center gap-2">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
                />
                Setting up your account...
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <GraduationCap className="w-4 h-4" />
                Complete Setup
              </div>
            )}
          </Button>
        </motion.div>
      </motion.form>

      <motion.div className="text-center text-xs text-muted-foreground" variants={itemVariants}>
        By completing setup, you agree to our terms of service and privacy policy
      </motion.div>
    </motion.div>
  )
}