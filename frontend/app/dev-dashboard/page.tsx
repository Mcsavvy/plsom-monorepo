'use client'

import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Code, Eye, ArrowRight } from 'lucide-react'

export default function DevDashboardPage() {
  const devRoutes = [
    {
      title: "Onboarding Flow",
      description: "Complete 5-step onboarding process with token validation and error handling",
      path: "/onboard",
      icon: "🚀"
    },
    {
      title: "Onboarding (No Token)",
      description: "Test onboarding flow without token (development mode)",
      path: "/onboard?dev=true",
      icon: "🧪"
    },
    {
      title: "Password Reset",
      description: "Test the password reset flow with OTP verification",
      path: "/reset-password",
      icon: "🔐"
    },
    {
      title: "Main Login",
      description: "Go to the main login page",
      path: "/",
      icon: "🏠"
    },
    {
      title: "Student Dashboard",
      description: "Preview the student learning dashboard",
      path: "/student/dashboard",
      icon: "📚"
    }
  ]

  return (
    <main className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8 text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Code className="w-8 h-8 text-primary" />
            <h1 className="text-3xl font-bold">PLSOM Development Dashboard</h1>
          </div>
          <p className="text-muted-foreground">
            Quick access to various pages and flows for development testing
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {devRoutes.map((route, index) => (
            <Card key={index} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <span className="text-2xl">{route.icon}</span>
                  {route.title}
                </CardTitle>
                <CardDescription>
                  {route.description}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Link href={route.path}>
                  <Button className="w-full" variant="outline">
                    <Eye className="w-4 h-4 mr-2" />
                    Open
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-12 p-6 bg-muted/50 rounded-lg">
          <h2 className="text-xl font-semibold mb-3 flex items-center gap-2">
            <Code className="w-5 h-5" />
            Development Notes
          </h2>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>• <strong>Onboarding Flow:</strong> Complete 5-step process: Welcome → Security → Profile → Ministry → Completion</li>
            <li>• <strong>Token Validation:</strong> In development, works with or without tokens (uses mock data)</li>
            <li>• <strong>Error Handling:</strong> Test invalid/expired tokens by modifying URL parameters</li>
            <li>• <strong>Password Reset:</strong> Complete flow for password reset including OTP verification</li>
            <li>• <strong>Features:</strong> Progress indicator, form validation, file upload, security setup, ministry background</li>
            <li>• <strong>Responsive Design:</strong> All flows optimized for mobile, tablet, and desktop</li>
            <li>• <strong>Animations:</strong> Smooth Framer Motion animations throughout all components</li>
          </ul>
        </div>

        <div className="mt-6 text-center">
          <p className="text-xs text-muted-foreground">
            🚧 Development Environment - Ready for production deployment when complete
          </p>
        </div>
      </div>
    </main>
  )
}
