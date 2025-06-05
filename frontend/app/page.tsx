import { Suspense } from 'react'
import { AuthenticationGateway } from '@/components/auth/authentication-gateway'
import { LoadingSpinner } from '@/components/ui/loading-spinner'

export default function HomePage() {
  return (
    <main className="min-h-screen bg-background">
      <Suspense fallback={<LoadingSpinner />}>
        <AuthenticationGateway />
      </Suspense>
    </main>
  )
}
