'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Church, GraduationCap, Heart, ChevronLeft, ChevronRight, Phone } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'

interface MinistryData {
  church: {
    name: string
    pastorName: string
    address: string
    yearsAttended: string
    phone: string
    email: string
  }
  ministry: {
    previousRoles: string[]
    yearsInMinistry: string
    areasOfInterest: string[]
    leadershipExperience: string
  }
  emergencyContact: {
    name: string
    relationship: string
    phone: string
    email: string
  }
  education: {
    highestLevel: string
    previousBibleSchool: string
  }
}

interface OnboardingMinistryBackgroundProps {
  onNext: (data: Partial<MinistryData>) => void
  onPrevious: () => void
}

const yearsOptions = Array.from({ length: 51 }, (_, i) => ({
  value: i.toString(),
  label: i === 0 ? 'Less than 1 year' : i === 1 ? '1 year' : `${i} years`
}))

const ministryRoles = [
  'Pastor', 'Assistant Pastor', 'Youth Pastor', 'Children\'s Minister', 'Worship Leader',
  'Music Director', 'Sunday School Teacher', 'Small Group Leader', 'Deacon', 'Elder',
  'Missionary', 'Evangelist', 'Chaplain', 'Church Administrator', 'Counselor', 'Other'
]

const areasOfInterest = [
  'Pastoral Ministry', 'Youth Ministry', 'Children\'s Ministry', 'Worship & Music',
  'Missions & Evangelism', 'Christian Education', 'Church Administration', 'Counseling',
  'Community Outreach', 'Church Planting', 'Biblical Studies', 'Theology', 'Other'
]

const educationLevels = [
  'High School Diploma/GED', 'Some College', 'Associate Degree', 'Bachelor\'s Degree',
  'Master\'s Degree', 'Doctoral Degree', 'Professional Degree', 'Other'
]

const relationships = [
  'Spouse', 'Parent', 'Child', 'Sibling', 'Friend', 'Pastor', 'Other Family Member', 'Other'
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

export function OnboardingMinistryBackground({ onNext, onPrevious }: OnboardingMinistryBackgroundProps) {
  const [formData, setFormData] = useState<MinistryData>({
    church: {
      name: '',
      pastorName: '',
      address: '',
      yearsAttended: '',
      phone: '',
      email: ''
    },
    ministry: {
      previousRoles: [],
      yearsInMinistry: '',
      areasOfInterest: [],
      leadershipExperience: ''
    },
    emergencyContact: {
      name: '',
      relationship: '',
      phone: '',
      email: ''
    },
    education: {
      highestLevel: '',
      previousBibleSchool: ''
    }
  })
  
  const [errors, setErrors] = useState<Record<string, string>>({})

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    // Church information (required)
    if (!formData.church.name.trim()) newErrors.churchName = 'Church name is required'
    if (!formData.church.pastorName.trim()) newErrors.pastorName = 'Pastor\'s name is required'
    if (!formData.church.yearsAttended) newErrors.yearsAttended = 'Years of attendance is required'

    // Emergency contact (required)
    if (!formData.emergencyContact.name.trim()) newErrors.emergencyName = 'Emergency contact name is required'
    if (!formData.emergencyContact.relationship) newErrors.emergencyRelationship = 'Relationship is required'
    if (!formData.emergencyContact.phone.trim()) newErrors.emergencyPhone = 'Emergency contact phone is required'

    // Education (required)
    if (!formData.education.highestLevel) newErrors.educationLevel = 'Education level is required'

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = () => {
    if (validateForm()) {
      onNext(formData)
    }
  }

  const updateChurchData = (field: keyof MinistryData['church'], value: string) => {
    setFormData(prev => ({
      ...prev,
      church: { ...prev.church, [field]: value }
    }))
    clearError(`church${field.charAt(0).toUpperCase() + field.slice(1)}`)
  }

  const updateMinistryData = (field: keyof MinistryData['ministry'], value: string | string[]) => {
    setFormData(prev => ({
      ...prev,
      ministry: { ...prev.ministry, [field]: value }
    }))
  }

  const updateEmergencyContact = (field: keyof MinistryData['emergencyContact'], value: string) => {
    setFormData(prev => ({
      ...prev,
      emergencyContact: { ...prev.emergencyContact, [field]: value }
    }))
    clearError(`emergency${field.charAt(0).toUpperCase() + field.slice(1)}`)
  }

  const updateEducation = (field: keyof MinistryData['education'], value: string) => {
    setFormData(prev => ({
      ...prev,
      education: { ...prev.education, [field]: value }
    }))
    if (field === 'highestLevel') clearError('educationLevel')
  }

  const clearError = (field: string) => {
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  const toggleMinistryRole = (role: string) => {
    setFormData(prev => ({
      ...prev,
      ministry: {
        ...prev.ministry,
        previousRoles: prev.ministry.previousRoles.includes(role)
          ? prev.ministry.previousRoles.filter(r => r !== role)
          : [...prev.ministry.previousRoles, role]
      }
    }))
  }

  const toggleAreaOfInterest = (area: string) => {
    setFormData(prev => ({
      ...prev,
      ministry: {
        ...prev.ministry,
        areasOfInterest: prev.ministry.areasOfInterest.includes(area)
          ? prev.ministry.areasOfInterest.filter(a => a !== area)
          : [...prev.ministry.areasOfInterest, area]
      }
    }))
  }

  return (
    <motion.div
      className="p-8 space-y-8"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Header */}
      <motion.div className="text-center" variants={itemVariants}>
        <div className="w-16 h-16 bg-gradient-to-br from-purple-100 to-purple-200 rounded-full flex items-center justify-center mx-auto mb-4">
          <Church className="w-8 h-8 text-purple-600" />
        </div>
        <h2 className="text-2xl font-heading font-bold text-foreground mb-2">
          Ministry & Background Information
        </h2>
        <p className="text-muted-foreground max-w-md mx-auto">
          Share your ministry experience and educational background to help us tailor your learning experience
        </p>
      </motion.div>

      <div className="max-w-4xl mx-auto space-y-6">
        {/* Church Information */}
        <motion.div variants={itemVariants}>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Church className="w-5 h-5" />
                Church Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="churchName">Church Name *</Label>
                  <Input
                    id="churchName"
                    value={formData.church.name}
                    onChange={(e) => updateChurchData('name', e.target.value)}
                    className={errors.churchName ? 'border-red-500' : ''}
                  />
                  {errors.churchName && (
                    <p className="text-sm text-red-500">{errors.churchName}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="pastorName">Pastor&apos;s Name *</Label>
                  <Input
                    id="pastorName"
                    value={formData.church.pastorName}
                    onChange={(e) => updateChurchData('pastorName', e.target.value)}
                    className={errors.pastorName ? 'border-red-500' : ''}
                  />
                  {errors.pastorName && (
                    <p className="text-sm text-red-500">{errors.pastorName}</p>
                  )}
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="churchAddress">Church Address</Label>
                  <Input
                    id="churchAddress"
                    value={formData.church.address}
                    onChange={(e) => updateChurchData('address', e.target.value)}
                    placeholder="123 Church St, City, State, ZIP"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="yearsAttended">Years of Attendance *</Label>
                  <Select value={formData.church.yearsAttended} onValueChange={(value: string) => updateChurchData('yearsAttended', value)}>
                    <SelectTrigger className={errors.yearsAttended ? 'border-red-500' : ''}>
                      <SelectValue placeholder="Select years" />
                    </SelectTrigger>
                    <SelectContent>
                      {yearsOptions.slice(0, 21).map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.yearsAttended && (
                    <p className="text-sm text-red-500">{errors.yearsAttended}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="churchPhone">Church Phone</Label>
                  <Input
                    id="churchPhone"
                    type="tel"
                    value={formData.church.phone}
                    onChange={(e) => updateChurchData('phone', e.target.value)}
                    placeholder="+1 (555) 123-4567"
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="churchEmail">Church Email</Label>
                  <Input
                    id="churchEmail"
                    type="email"
                    value={formData.church.email}
                    onChange={(e) => updateChurchData('email', e.target.value)}
                    placeholder="info@church.org"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Ministry Experience */}
        <motion.div variants={itemVariants}>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Heart className="w-5 h-5" />
                Ministry Experience
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Previous Ministry Roles */}
              <div className="space-y-3">
                <Label>Previous Ministry Roles (Select all that apply)</Label>
                <div className="grid md:grid-cols-3 gap-3">
                  {ministryRoles.map((role) => (
                    <div key={role} className="flex items-center space-x-2">
                      <Checkbox
                        id={`role-${role}`}
                        checked={formData.ministry.previousRoles.includes(role)}
                        onCheckedChange={() => toggleMinistryRole(role)}
                      />
                      <Label htmlFor={`role-${role}`} className="text-sm">
                        {role}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Years in Ministry */}
              <div className="space-y-2">
                <Label htmlFor="yearsInMinistry">Years in Ministry</Label>
                <Select value={formData.ministry.yearsInMinistry} onValueChange={(value: string) => updateMinistryData('yearsInMinistry', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select years in ministry" />
                  </SelectTrigger>
                  <SelectContent>
                    {yearsOptions.slice(0, 31).map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Areas of Interest */}
              <div className="space-y-3">
                <Label>Areas of Ministry Interest (Select all that apply)</Label>
                <div className="grid md:grid-cols-3 gap-3">
                  {areasOfInterest.map((area) => (
                    <div key={area} className="flex items-center space-x-2">
                      <Checkbox
                        id={`interest-${area}`}
                        checked={formData.ministry.areasOfInterest.includes(area)}
                        onCheckedChange={() => toggleAreaOfInterest(area)}
                      />
                      <Label htmlFor={`interest-${area}`} className="text-sm">
                        {area}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Leadership Experience */}
              <div className="space-y-2">
                <Label htmlFor="leadershipExperience">Leadership Experience (Optional)</Label>
                <Textarea
                  id="leadershipExperience"
                  value={formData.ministry.leadershipExperience}
                  onChange={(e) => updateMinistryData('leadershipExperience', e.target.value)}
                  placeholder="Describe your leadership roles and experiences..."
                  rows={4}
                />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Emergency Contact */}
        <motion.div variants={itemVariants}>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Phone className="w-5 h-5" />
                Emergency Contact
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="emergencyName">Contact Name *</Label>
                  <Input
                    id="emergencyName"
                    value={formData.emergencyContact.name}
                    onChange={(e) => updateEmergencyContact('name', e.target.value)}
                    className={errors.emergencyName ? 'border-red-500' : ''}
                  />
                  {errors.emergencyName && (
                    <p className="text-sm text-red-500">{errors.emergencyName}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="emergencyRelationship">Relationship *</Label>
                  <Select value={formData.emergencyContact.relationship} onValueChange={(value: string) => updateEmergencyContact('relationship', value)}>
                    <SelectTrigger className={errors.emergencyRelationship ? 'border-red-500' : ''}>
                      <SelectValue placeholder="Select relationship" />
                    </SelectTrigger>
                    <SelectContent>
                      {relationships.map((relationship) => (
                        <SelectItem key={relationship} value={relationship}>
                          {relationship}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.emergencyRelationship && (
                    <p className="text-sm text-red-500">{errors.emergencyRelationship}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="emergencyPhone">Phone Number *</Label>
                  <Input
                    id="emergencyPhone"
                    type="tel"
                    value={formData.emergencyContact.phone}
                    onChange={(e) => updateEmergencyContact('phone', e.target.value)}
                    className={errors.emergencyPhone ? 'border-red-500' : ''}
                    placeholder="+1 (555) 123-4567"
                  />
                  {errors.emergencyPhone && (
                    <p className="text-sm text-red-500">{errors.emergencyPhone}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="emergencyEmail">Email Address</Label>
                  <Input
                    id="emergencyEmail"
                    type="email"
                    value={formData.emergencyContact.email}
                    onChange={(e) => updateEmergencyContact('email', e.target.value)}
                    placeholder="emergency@example.com"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Educational Background */}
        <motion.div variants={itemVariants}>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <GraduationCap className="w-5 h-5" />
                Educational Background
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="educationLevel">Highest Education Level *</Label>
                  <Select value={formData.education.highestLevel} onValueChange={(value: string) => updateEducation('highestLevel', value)}>
                    <SelectTrigger className={errors.educationLevel ? 'border-red-500' : ''}>
                      <SelectValue placeholder="Select education level" />
                    </SelectTrigger>
                    <SelectContent>
                      {educationLevels.map((level) => (
                        <SelectItem key={level} value={level}>
                          {level}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.educationLevel && (
                    <p className="text-sm text-red-500">{errors.educationLevel}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="previousBibleSchool">Previous Bible School Experience</Label>
                  <Input
                    id="previousBibleSchool"
                    value={formData.education.previousBibleSchool}
                    onChange={(e) => updateEducation('previousBibleSchool', e.target.value)}
                    placeholder="Name of institution (if any)"
                  />
                </div>
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
          className="flex items-center gap-2"
        >
          <ChevronLeft className="w-4 h-4" />
          Previous
        </Button>

        <div className="text-center">
          <p className="text-sm text-muted-foreground">
            Step 4 of 5
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
