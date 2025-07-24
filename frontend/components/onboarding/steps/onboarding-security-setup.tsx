'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Eye, EyeOff, Shield, Lock, Check, X, ChevronLeft, ChevronRight, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

interface SecurityData {
  password: string
  confirmPassword: string
  securityQuestions: Array<{ question: string; answer: string }>
  termsAccepted: boolean
}

interface OnboardingSecuritySetupProps {
  onNext: (data: Partial<SecurityData>) => void
  onPrevious: () => void
  isFirstStep: boolean
}

const passwordRequirements = [
  { id: 'length', text: 'At least 8 characters', regex: /.{8,}/ },
  { id: 'uppercase', text: 'One uppercase letter', regex: /[A-Z]/ },
  { id: 'lowercase', text: 'One lowercase letter', regex: /[a-z]/ },
  { id: 'number', text: 'One number', regex: /\d/ },
  { id: 'special', text: 'One special character', regex: /[!@#$%^&*(),.?":{}|<>]/ }
]

const securityQuestions = [
  "What was the name of your first pet?",
  "What city were you born in?",
  "What was your mother's maiden name?",
  "What was the name of your elementary school?",
  "What was your favorite childhood book?",
  "What was the first concert you attended?",
  "What was your childhood nickname?",
  "What street did you grow up on?"
]

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

export function OnboardingSecuritySetup({ onNext, onPrevious, isFirstStep }: OnboardingSecuritySetupProps) {
  const [formData, setFormData] = useState<SecurityData>({
    password: '',
    confirmPassword: '',
    securityQuestions: [
      { question: '', answer: '' },
      { question: '', answer: '' }
    ],
    termsAccepted: false
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const getPasswordStrength = (password: string) => {
    const passedRequirements = passwordRequirements.filter(req => req.regex.test(password))
    return {
      score: passedRequirements.length,
      total: passwordRequirements.length,
      percentage: (passedRequirements.length / passwordRequirements.length) * 100
    }
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.password) {
      newErrors.password = 'Password is required'
    } else if (getPasswordStrength(formData.password).score < passwordRequirements.length) {
      newErrors.password = 'Password does not meet all requirements'
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password'
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match'
    }

    if (!formData.termsAccepted) {
      newErrors.terms = 'You must accept the terms and conditions'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = () => {
    if (validateForm()) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { confirmPassword, ...dataToSubmit } = formData
      onNext(dataToSubmit)
    }
  }

  const updateFormData = (field: keyof SecurityData, value: string | boolean | Array<{ question: string; answer: string }>) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  const updateSecurityQuestion = (index: number, field: 'question' | 'answer', value: string) => {
    setFormData(prev => ({
      ...prev,
      securityQuestions: prev.securityQuestions.map((q, i) => 
        i === index ? { ...q, [field]: value } : q
      )
    }))
  }

  const passwordStrength = getPasswordStrength(formData.password)

  return (
    <motion.div
      className="p-8 space-y-8"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Header */}
      <motion.div className="text-center" variants={itemVariants}>
        <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-blue-200 rounded-full flex items-center justify-center mx-auto mb-4">
          <Shield className="w-8 h-8 text-blue-600" />
        </div>
        <h2 className="text-2xl font-heading font-bold text-foreground mb-2">
          Secure Your Account
        </h2>
        <p className="text-muted-foreground max-w-md mx-auto">
          Create a strong password and set up security preferences to protect your ministry learning account
        </p>
      </motion.div>

      <div className="max-w-2xl mx-auto space-y-6">
        {/* Password Section */}
        <motion.div variants={itemVariants}>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="w-5 h-5" />
                Password Setup
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Password Field */}
              <div className="space-y-2">
                <Label htmlFor="password">Password *</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={(e) => updateFormData('password', e.target.value)}
                    className={errors.password ? 'border-red-500' : ''}
                    placeholder="Enter your password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-sm text-red-500">{errors.password}</p>
                )}
              </div>

              {/* Password Strength Indicator */}
              {formData.password && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Password Strength</span>
                    <span className="text-sm font-medium">
                      {passwordStrength.score}/{passwordStrength.total}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full transition-all duration-300 ${
                        passwordStrength.score <= 2 ? 'bg-red-500' :
                        passwordStrength.score <= 4 ? 'bg-yellow-500' : 'bg-green-500'
                      }`}
                      style={{ width: `${passwordStrength.percentage}%` }}
                    />
                  </div>
                  <div className="space-y-1">
                    {passwordRequirements.map((req) => {
                      const isValid = req.regex.test(formData.password)
                      return (
                        <div key={req.id} className="flex items-center gap-2 text-sm">
                          {isValid ? (
                            <Check className="w-4 h-4 text-green-500" />
                          ) : (
                            <X className="w-4 h-4 text-gray-400" />
                          )}
                          <span className={isValid ? 'text-green-600' : 'text-gray-500'}>
                            {req.text}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Confirm Password */}
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password *</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={formData.confirmPassword}
                    onChange={(e) => updateFormData('confirmPassword', e.target.value)}
                    className={errors.confirmPassword ? 'border-red-500' : ''}
                    placeholder="Confirm your password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p className="text-sm text-red-500">{errors.confirmPassword}</p>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Security Questions (Optional) */}
        <motion.div variants={itemVariants}>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5" />
                Security Questions (Optional)
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Set up backup security questions to help recover your account if needed
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              {formData.securityQuestions.map((sq, index) => (
                <div key={index} className="space-y-3 p-4 bg-muted/50 rounded-lg">
                  <div className="space-y-2">
                    <Label>Security Question {index + 1}</Label>
                    <Select
                      value={sq.question}
                      onValueChange={(value: string) => updateSecurityQuestion(index, 'question', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Choose a security question" />
                      </SelectTrigger>
                      <SelectContent>
                        {securityQuestions.map((question) => (
                          <SelectItem key={question} value={question}>
                            {question}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {sq.question && (
                    <div className="space-y-2">
                      <Label>Your Answer</Label>
                      <Input
                        value={sq.answer}
                        onChange={(e) => updateSecurityQuestion(index, 'answer', e.target.value)}
                        placeholder="Enter your answer"
                      />
                    </div>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        </motion.div>

        {/* Terms and Conditions */}
        <motion.div variants={itemVariants}>
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <Checkbox
                    id="terms"
                    checked={formData.termsAccepted}
                    onCheckedChange={(checked: boolean) => updateFormData('termsAccepted', checked)}
                  />
                  <div className="space-y-1 leading-none">
                    <Label
                      htmlFor="terms"
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      I accept the Platform Terms of Use and Ministry Guidelines *
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      By checking this box, you agree to our platform usage terms and ministry conduct guidelines
                    </p>
                  </div>
                </div>
                {errors.terms && (
                  <p className="text-sm text-red-500">{errors.terms}</p>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Navigation */}
      <motion.div 
        className="flex justify-between items-center pt-6"
        variants={itemVariants}
      >
        <Button
          variant="outline"
          onClick={onPrevious}
          disabled={isFirstStep}
          className="flex items-center gap-2"
        >
          <ChevronLeft className="w-4 h-4" />
          Previous
        </Button>

        <div className="text-center">
          <p className="text-sm text-muted-foreground">
            Step 2 of 5
          </p>
        </div>

        <Button
          onClick={handleSubmit}
          className="btn-plsom-primary flex items-center gap-2"
        >
          Continue
          <ChevronRight className="w-4 h-4" />
        </Button>
      </motion.div>
    </motion.div>
  )
}
