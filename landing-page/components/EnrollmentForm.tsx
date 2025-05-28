"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { CheckCircle, User, Send } from "lucide-react"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"

// Zod schema for form validation - simplified to match actual PLSOM form
const enrollmentSchema = z.object({
  fullName: z.string().min(1, "Full name is required").min(2, "Full name must be at least 2 characters"),
  fatherName: z.string().min(1, "Father's name is required").min(2, "Father's name must be at least 2 characters"),
  motherName: z.string().min(1, "Mother's name is required").min(2, "Mother's name must be at least 2 characters"),
  gender: z.string().min(1, "Gender is required"),
  phone: z.string().min(1, "Phone number is required").min(10, "Phone number must be at least 10 digits"),
  email: z.string().min(1, "Email is required").email("Invalid email format"),
  address: z.string().min(1, "Full residential address is required").min(10, "Please provide a complete address"),
  nationality: z.string().min(1, "Nationality is required"),
  employmentStatus: z.string().min(1, "Employment status is required"),
  programType: z.string().min(1, "Program type is required"),
  programInterest: z.string().min(1, "Please tell us about your interest in the program").min(20, "Please provide more details about your interest"),
})

type FormData = z.infer<typeof enrollmentSchema>

const STORAGE_KEY = "plsom_enrollment_form"
const SUBMISSION_KEY = "plsom_enrollment_submitted"

export default function EnrollmentForm() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)

  const form = useForm<FormData>({
    resolver: zodResolver(enrollmentSchema),
    defaultValues: {
      fullName: "",
      fatherName: "",
      motherName: "",
      gender: "",
      phone: "",
      email: "",
      address: "",
      nationality: "",
      employmentStatus: "",
      programType: "",
      programInterest: "",
    },
    mode: "onChange",
  })

  const { control, handleSubmit, formState: { errors }, watch, setValue } = form

  // Load form data from localStorage on component mount
  useEffect(() => {
    const savedData = localStorage.getItem(STORAGE_KEY)
    const submissionStatus = localStorage.getItem(SUBMISSION_KEY)
    
    if (submissionStatus === "true") {
      setIsSubmitted(true)
    }
    
    if (savedData && submissionStatus !== "true") {
      try {
        const parsedData = JSON.parse(savedData)
        Object.keys(parsedData).forEach((key) => {
          setValue(key as keyof FormData, parsedData[key])
        })
      } catch (error) {
        console.error("Error parsing saved form data:", error)
      }
    }
  }, [setValue])

  // Save form data to localStorage whenever it changes
  const watchedValues = watch()
  useEffect(() => {
    if (!isSubmitted) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(watchedValues))
    }
  }, [watchedValues, isSubmitted])

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true)
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // Mark as submitted
      localStorage.setItem(SUBMISSION_KEY, "true")
      localStorage.removeItem(STORAGE_KEY) // Clear form data
      setIsSubmitted(true)
      
      console.log("Form submitted:", data)
    } catch (error) {
      console.error("Submission error:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isSubmitted) {
    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-6">
        <Card className="bg-white dark:bg-[#1e2436] border-[#c2c2c2] dark:border-[#363c4e] shadow-xl">
          <CardContent className="p-6 sm:p-8 text-center">
            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-6 h-6 sm:w-8 sm:h-8 text-green-600 dark:text-green-400" />
            </div>
            <h3 className="text-xl sm:text-2xl font-bold text-[#333333] dark:text-[#FFFFFF] mb-4">
              Application Submitted Successfully!
            </h3>
            <p className="text-[#5c5c5c] dark:text-[#e0e0e0] mb-6 text-sm sm:text-base">
              Thank you for your application to PLSOM. We have received your enrollment form and will review it within a few days. You will receive an email confirmation shortly.
            </p>
            <Button 
              onClick={() => window.location.reload()} 
              className="bg-[#005B99] hover:bg-[#4e88ca] text-white w-full sm:w-auto"
            >
              Return to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6">
      <Card className="bg-white dark:bg-[#1e2436] border-[#c2c2c2] dark:border-[#363c4e] shadow-xl">
        <CardHeader className="pb-4 sm:pb-6">
          <div className="flex items-center justify-center space-x-3 mb-4">
            <User className="w-6 h-6 sm:w-8 sm:h-8 text-[#005B99] dark:text-[#FFD700]" />
            <CardTitle className="text-xl sm:text-2xl text-[#333333] dark:text-[#FFFFFF] font-['Roboto_Slab'] text-center">
              Enrollment Form
            </CardTitle>
          </div>
          <CardDescription className="text-center text-[#5c5c5c] dark:text-[#e0e0e0] text-sm sm:text-base">
            If you are looking to progress into Ministry as a Pastor, Worker, Evangelist, Missionary and require a practical, spirit inspired training, then you are at the right place.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 sm:space-y-6 px-4 sm:px-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 sm:space-y-6">
            {/* Full Name */}
            <div className="space-y-2">
              <Label htmlFor="fullName" className="text-sm font-medium">Full Name *</Label>
              <Controller
                name="fullName"
                control={control}
                render={({ field }) => (
                  <Input
                    {...field}
                    id="fullName"
                    className={`h-11 ${errors.fullName ? "border-red-500" : ""}`}
                    placeholder="Enter your full name"
                  />
                )}
              />
              {errors.fullName && <p className="text-red-500 text-xs">{errors.fullName.message}</p>}
            </div>

            {/* Father's Name */}
            <div className="space-y-2">
              <Label htmlFor="fatherName" className="text-sm font-medium">Father's Name *</Label>
              <Controller
                name="fatherName"
                control={control}
                render={({ field }) => (
                  <Input
                    {...field}
                    id="fatherName"
                    className={`h-11 ${errors.fatherName ? "border-red-500" : ""}`}
                    placeholder="Enter your father's name"
                  />
                )}
              />
              {errors.fatherName && <p className="text-red-500 text-xs">{errors.fatherName.message}</p>}
            </div>

            {/* Mother's Name */}
            <div className="space-y-2">
              <Label htmlFor="motherName" className="text-sm font-medium">Mother's Name *</Label>
              <Controller
                name="motherName"
                control={control}
                render={({ field }) => (
                  <Input
                    {...field}
                    id="motherName"
                    className={`h-11 ${errors.motherName ? "border-red-500" : ""}`}
                    placeholder="Enter your mother's name"
                  />
                )}
              />
              {errors.motherName && <p className="text-red-500 text-xs">{errors.motherName.message}</p>}
            </div>

            {/* Gender */}
            <div className="space-y-2">
              <Label htmlFor="gender" className="text-sm font-medium">Gender *</Label>
              <Controller
                name="gender"
                control={control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className={`h-11 ${errors.gender ? "border-red-500" : ""}`}>
                      <SelectValue placeholder="Select gender" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="MALE">MALE</SelectItem>
                      <SelectItem value="FEMALE">FEMALE</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.gender && <p className="text-red-500 text-xs">{errors.gender.message}</p>}
            </div>

            {/* Phone and Email */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div className="space-y-2">
                <Label htmlFor="phone" className="text-sm font-medium">Phone *</Label>
                <Controller
                  name="phone"
                  control={control}
                  render={({ field }) => (
                    <Input
                      {...field}
                      id="phone"
                      type="tel"
                      className={`h-11 ${errors.phone ? "border-red-500" : ""}`}
                      placeholder="Enter phone number"
                    />
                  )}
                />
                {errors.phone && <p className="text-red-500 text-xs">{errors.phone.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium">Email *</Label>
                <Controller
                  name="email"
                  control={control}
                  render={({ field }) => (
                    <Input
                      {...field}
                      id="email"
                      type="email"
                      className={`h-11 ${errors.email ? "border-red-500" : ""}`}
                      placeholder="Enter email address"
                    />
                  )}
                />
                {errors.email && <p className="text-red-500 text-xs">{errors.email.message}</p>}
              </div>
            </div>

            {/* Full Residential Address */}
            <div className="space-y-2">
              <Label htmlFor="address" className="text-sm font-medium">Full Residential Address *</Label>
              <Controller
                name="address"
                control={control}
                render={({ field }) => (
                  <Textarea
                    {...field}
                    id="address"
                    className={`min-h-[80px] resize-none ${errors.address ? "border-red-500" : ""}`}
                    placeholder="Enter your complete residential address"
                  />
                )}
              />
              {errors.address && <p className="text-red-500 text-xs">{errors.address.message}</p>}
            </div>

            {/* Nationality */}
            <div className="space-y-2">
              <Label htmlFor="nationality" className="text-sm font-medium">Nationality *</Label>
              <Controller
                name="nationality"
                control={control}
                render={({ field }) => (
                  <Input
                    {...field}
                    id="nationality"
                    className={`h-11 ${errors.nationality ? "border-red-500" : ""}`}
                    placeholder="Enter your nationality"
                  />
                )}
              />
              {errors.nationality && <p className="text-red-500 text-xs">{errors.nationality.message}</p>}
            </div>

            {/* Employment Status */}
            <div className="space-y-2">
              <Label htmlFor="employmentStatus" className="text-sm font-medium">Employment Status *</Label>
              <Controller
                name="employmentStatus"
                control={control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className={`h-11 ${errors.employmentStatus ? "border-red-500" : ""}`}>
                      <SelectValue placeholder="Select employment status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Employed">Employed</SelectItem>
                      <SelectItem value="Unemployed">Unemployed</SelectItem>
                      <SelectItem value="Student">Student</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.employmentStatus && <p className="text-red-500 text-xs">{errors.employmentStatus.message}</p>}
            </div>

            {/* Program Type */}
            <div className="space-y-2">
              <Label htmlFor="programType" className="text-sm font-medium">Program Type *</Label>
              <Controller
                name="programType"
                control={control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className={`h-11 ${errors.programType ? "border-red-500" : ""}`}>
                      <SelectValue placeholder="Select program type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Certificate">Certificate (7 months)</SelectItem>
                      <SelectItem value="Diploma">Diploma (14 months)</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.programType && <p className="text-red-500 text-xs">{errors.programType.message}</p>}
            </div>

            {/* Tell us about your interest in the program */}
            <div className="space-y-2">
              <Label htmlFor="programInterest" className="text-sm font-medium">Tell us about your interest in the program *</Label>
              <Controller
                name="programInterest"
                control={control}
                render={({ field }) => (
                  <Textarea
                    {...field}
                    id="programInterest"
                    className={`min-h-[100px] resize-none ${errors.programInterest ? "border-red-500" : ""}`}
                    placeholder="Please describe your interest in the program, your ministry goals, and what you hope to achieve..."
                  />
                )}
              />
              {errors.programInterest && <p className="text-red-500 text-xs">{errors.programInterest.message}</p>}
            </div>

            {/* Submit Button */}
            <div className="pt-4 border-t border-[#c2c2c2] dark:border-[#363c4e]">
              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-[#005B99] hover:bg-[#4e88ca] text-white h-12 text-base font-semibold"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    Submitting Application...
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5 mr-2" />
                    Submit Application
                  </>
                )}
              </Button>
            </div>

            {/* Auto-save indicator */}
            <div className="text-center text-xs text-[#5c5c5c] dark:text-[#e0e0e0]">
              Your progress is automatically saved as you type
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
