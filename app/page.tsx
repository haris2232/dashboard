"use client"

import { useAuth } from "@/lib/auth-context"
import { LoginForm } from "@/components/login-form"
import { DashboardLayout } from "@/components/dashboard-layout"
import { LoadingSpinner } from "@/components/ui/loading-spinner"

export default function Home() {
  const { user, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (!user) {
    return <LoginForm />
  }

  return <DashboardLayout />
}
