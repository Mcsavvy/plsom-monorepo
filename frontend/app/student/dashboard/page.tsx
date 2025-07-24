'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  BookOpen, 
  Calendar, 
  Clock, 
  Award, 
  User, 
  Settings, 
  LogOut,
  ChevronLeft,
  ChevronRight,
  Play,
  Users,
  FileText,
  TrendingUp,
  Bell,
  Search,
  Menu,
  X
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { PLSOMBranding } from '@/components/ui/plsom-branding'

// Mock data - will be replaced with real API calls
const mockUser = {
  name: "John Doe",
  email: "john.doe@plsom.org",
  role: "Student",
  program: "Certificate Level 2 Practical Ministry",
  cohort: "Fall 2025 Cohort",
  profileImage: null,
  progress: 65,
  completedCourses: 3,
  totalCourses: 8,
  attendanceRate: 92
}

const mockCourses = [
  {
    id: 1,
    title: "Biblical Foundations",
    instructor: "Dr. Sarah Johnson",
    progress: 85,
    nextClass: "2024-01-15T10:00:00",
    totalModules: 12,
    completedModules: 10,
    status: "active"
  },
  {
    id: 2,
    title: "Pastoral Care & Counseling",
    instructor: "Rev. Michael Brown",
    progress: 60,
    nextClass: "2024-01-16T14:00:00",
    totalModules: 10,
    completedModules: 6,
    status: "active"
  },
  {
    id: 3,
    title: "Church Leadership",
    instructor: "Pastor Lisa Williams",
    progress: 45,
    nextClass: "2024-01-18T16:00:00",
    totalModules: 8,
    completedModules: 3,
    status: "active"
  }
]

const mockUpcomingClasses = [
  {
    id: 1,
    title: "Biblical Foundations - Module 11",
    instructor: "Dr. Sarah Johnson",
    date: "2024-01-15T10:00:00",
    duration: 90,
    zoomLink: "https://zoom.us/j/123456789",
    courseId: 1
  },
  {
    id: 2,
    title: "Pastoral Care - Counseling Techniques",
    instructor: "Rev. Michael Brown",
    date: "2024-01-16T14:00:00",
    duration: 120,
    zoomLink: "https://zoom.us/j/987654321",
    courseId: 2
  }
]

const mockAssignments = [
  {
    id: 1,
    title: "Biblical Hermeneutics Essay",
    course: "Biblical Foundations",
    dueDate: "2024-01-20T23:59:00",
    status: "pending",
    type: "essay"
  },
  {
    id: 2,
    title: "Leadership Case Study",
    course: "Church Leadership",
    dueDate: "2024-01-25T23:59:00",
    status: "pending",
    type: "case-study"
  }
]

const sidebarItems = [
  { icon: BookOpen, label: 'Dashboard', id: 'dashboard' },
  { icon: Calendar, label: 'Classes', id: 'classes' },
  { icon: FileText, label: 'Assignments', id: 'assignments' },
  { icon: TrendingUp, label: 'Progress', id: 'progress' },
  { icon: User, label: 'Profile', id: 'profile' },
  { icon: Settings, label: 'Settings', id: 'settings' }
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

export default function StudentDashboard() {
  const [activeSection, setActiveSection] = useState('dashboard')
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatTimeUntil = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = date.getTime() - now.getTime()
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24))
    
    if (diffDays === 0) return 'Today'
    if (diffDays === 1) return 'Tomorrow'
    if (diffDays < 7) return `In ${diffDays} days`
    return `In ${Math.ceil(diffDays / 7)} weeks`
  }

  const handleJoinClass = (zoomLink: string) => {
    // In production, this would handle Zoom integration
    window.open(zoomLink, '_blank')
  }

  const renderDashboardContent = () => {
    switch (activeSection) {
      case 'dashboard':
        return (
          <motion.div
            className="space-y-6"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {/* Welcome Section */}
            <motion.div variants={itemVariants}>
              <Card className="bg-gradient-to-r from-primary/10 to-accent/10 border-primary/20">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h1 className="text-2xl font-heading font-bold text-foreground mb-2">
                        Welcome back, {mockUser.name}!
                      </h1>
                      <p className="text-muted-foreground">
                        {mockUser.program} • {mockUser.cohort}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-3xl font-bold text-primary">{mockUser.progress}%</div>
                      <div className="text-sm text-muted-foreground">Overall Progress</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Quick Stats */}
            <motion.div variants={itemVariants}>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-2xl font-bold text-foreground">{mockUser.completedCourses}/{mockUser.totalCourses}</div>
                        <div className="text-sm text-muted-foreground">Courses</div>
                      </div>
                      <BookOpen className="w-8 h-8 text-primary" />
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-2xl font-bold text-foreground">{mockUser.attendanceRate}%</div>
                        <div className="text-sm text-muted-foreground">Attendance</div>
                      </div>
                      <Users className="w-8 h-8 text-primary" />
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-2xl font-bold text-foreground">{mockAssignments.length}</div>
                        <div className="text-sm text-muted-foreground">Pending</div>
                      </div>
                      <FileText className="w-8 h-8 text-primary" />
                    </div>
                  </CardContent>
                </Card>
              </div>
            </motion.div>

            {/* Upcoming Classes */}
            <motion.div variants={itemVariants}>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="w-5 h-5" />
                    Upcoming Classes
                  </CardTitle>
                  <CardDescription>Your next scheduled sessions</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {mockUpcomingClasses.map((classItem) => (
                    <div key={classItem.id} className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                      <div className="flex-1">
                        <h4 className="font-semibold text-foreground">{classItem.title}</h4>
                        <p className="text-sm text-muted-foreground">{classItem.instructor}</p>
                        <p className="text-sm text-muted-foreground">
                          {formatDate(classItem.date)} • {classItem.duration} min
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-primary">
                          {formatTimeUntil(classItem.date)}
                        </span>
                        <Button
                          size="sm"
                          onClick={() => handleJoinClass(classItem.zoomLink)}
                          className="bg-primary hover:bg-primary/90"
                        >
                          <Play className="w-4 h-4 mr-1" />
                          Join
                        </Button>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </motion.div>

            {/* Current Courses */}
            <motion.div variants={itemVariants}>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BookOpen className="w-5 h-5" />
                    Active Courses
                  </CardTitle>
                  <CardDescription>Continue your learning journey</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {mockCourses.map((course) => (
                    <div key={course.id} className="p-4 bg-muted/50 rounded-lg">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <h4 className="font-semibold text-foreground">{course.title}</h4>
                          <p className="text-sm text-muted-foreground">{course.instructor}</p>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-medium text-primary">{course.progress}%</div>
                          <div className="text-xs text-muted-foreground">
                            {course.completedModules}/{course.totalModules} modules
                          </div>
                        </div>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <motion.div
                          className="bg-primary h-2 rounded-full"
                          initial={{ width: 0 }}
                          animate={{ width: `${course.progress}%` }}
                          transition={{ duration: 1, delay: 0.5 }}
                        />
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>
        )

      case 'classes':
        return (
          <motion.div
            className="space-y-6"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            <motion.div variants={itemVariants}>
              <Card>
                <CardHeader>
                  <CardTitle>Class Schedule</CardTitle>
                  <CardDescription>Manage your class attendance and access recordings</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {mockUpcomingClasses.map((classItem) => (
                      <div key={classItem.id} className="p-4 border rounded-lg">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="font-semibold">{classItem.title}</h3>
                            <p className="text-sm text-muted-foreground">{classItem.instructor}</p>
                            <p className="text-sm text-muted-foreground">{formatDate(classItem.date)}</p>
                          </div>
                          <Button onClick={() => handleJoinClass(classItem.zoomLink)}>
                            <Play className="w-4 h-4 mr-2" />
                            Join Class
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>
        )

      case 'assignments':
        return (
          <motion.div
            className="space-y-6"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            <motion.div variants={itemVariants}>
              <Card>
                <CardHeader>
                  <CardTitle>Assignments & Assessments</CardTitle>
                  <CardDescription>Track your pending and completed assignments</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {mockAssignments.map((assignment) => (
                      <div key={assignment.id} className="p-4 border rounded-lg">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="font-semibold">{assignment.title}</h3>
                            <p className="text-sm text-muted-foreground">{assignment.course}</p>
                            <p className="text-sm text-muted-foreground">
                              Due: {formatDate(assignment.dueDate)}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs">
                              {assignment.status}
                            </span>
                            <Button size="sm">View Details</Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>
        )

      case 'profile':
        return (
          <motion.div
            className="space-y-6"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            <motion.div variants={itemVariants}>
              <Card>
                <CardHeader>
                  <CardTitle>Profile Information</CardTitle>
                  <CardDescription>Manage your account details and preferences</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center space-x-4">
                    <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                      <User className="w-8 h-8 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold">{mockUser.name}</h3>
                      <p className="text-sm text-muted-foreground">{mockUser.email}</p>
                      <p className="text-sm text-muted-foreground">{mockUser.program}</p>
                    </div>
                  </div>
                  
                  <div className="pt-4 border-t">
                    <h4 className="font-medium mb-2">Program Details</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Role:</span>
                        <span className="ml-2">{mockUser.role}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Cohort:</span>
                        <span className="ml-2">{mockUser.cohort}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Progress:</span>
                        <span className="ml-2">{mockUser.progress}%</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Attendance:</span>
                        <span className="ml-2">{mockUser.attendanceRate}%</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>
        )

      default:
        return (
          <div className="text-center text-muted-foreground">
            Select a section from the sidebar
          </div>
        )
    }
  }

  return (
    <div className="flex h-screen bg-background">
      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {mobileSidebarOpen && (
          <motion.div
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setMobileSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.aside
        className={`
          ${sidebarCollapsed ? 'w-16' : 'w-64'} 
          ${mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          fixed lg:relative h-full bg-card border-r border-border z-50 transition-all duration-300
        `}
        initial={{ x: -100 }}
        animate={{ x: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="p-4 border-b border-border">
            <div className="flex items-center justify-between">
              {!sidebarCollapsed && (
                <div className="flex items-center space-x-2">
                  <PLSOMBranding compact />
                </div>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSidebarCollapsed(!sidebarCollapsed)
                  setMobileSidebarOpen(false)
                }}
                className="lg:flex hidden"
              >
                {sidebarCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setMobileSidebarOpen(false)}
                className="lg:hidden"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4">
            <div className="space-y-2">
              {sidebarItems.map((item) => (
                <Button
                  key={item.id}
                  variant={activeSection === item.id ? "default" : "ghost"}
                  className={`w-full ${sidebarCollapsed ? 'px-2' : 'justify-start'}`}
                  onClick={() => {
                    setActiveSection(item.id)
                    setMobileSidebarOpen(false)
                  }}
                >
                  <item.icon className="w-4 h-4" />
                  {!sidebarCollapsed && <span className="ml-2">{item.label}</span>}
                </Button>
              ))}
            </div>
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-border">
            <Button
              variant="ghost"
              className={`w-full ${sidebarCollapsed ? 'px-2' : 'justify-start'} text-red-600 hover:text-red-700`}
              onClick={() => {
                // Handle logout
                window.location.href = '/'
              }}
            >
              <LogOut className="w-4 h-4" />
              {!sidebarCollapsed && <span className="ml-2">Logout</span>}
            </Button>
          </div>
        </div>
      </motion.aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <header className="bg-card border-b border-border px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setMobileSidebarOpen(true)}
                className="lg:hidden"
              >
                <Menu className="w-4 h-4" />
              </Button>
              <h1 className="text-xl font-semibold capitalize">{activeSection}</h1>
            </div>
            <div className="flex items-center space-x-4">
              <div className="relative hidden md:block">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Search courses, assignments..."
                  className="pl-10 w-64"
                />
              </div>
              <Button variant="ghost" size="sm">
                <Bell className="w-4 h-4" />
              </Button>
              <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                <User className="w-4 h-4 text-primary" />
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto p-6">
          {renderDashboardContent()}
        </main>
      </div>
    </div>
  )
} 