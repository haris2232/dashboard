"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { useToast } from "@/components/ui/use-toast"

interface User {
  id: string
  name: string
  email: string
  role: "admin" | "manager" | "viewer"
}

interface AuthContextType {
  user: User | null
  login: (email: string, password: string) => Promise<void>
  logout: () => void
  isLoading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Mock users for demo
const mockUsers: User[] = [
  { id: "1", name: "Admin User", email: "admin@example.com", role: "admin" },
  { id: "2", name: "Manager User", email: "manager@example.com", role: "manager" },
  { id: "3", name: "Viewer User", email: "viewer@example.com", role: "viewer" },
]

const mockCredentials = {
  "admin@example.com": "admin123",
  "manager@example.com": "manager123",
  "viewer@example.com": "viewer123",
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    // Check for stored user on mount
    const storedUser = localStorage.getItem("user")
    if (storedUser) {
      setUser(JSON.parse(storedUser))
    }
    setIsLoading(false)
  }, [])

  const login = async (email: string, password: string) => {
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 1000))

    const expectedPassword = mockCredentials[email as keyof typeof mockCredentials]

    if (!expectedPassword || expectedPassword !== password) {
      toast({
        title: "Login Failed",
        description: "Invalid email or password",
        variant: "destructive",
      })
      throw new Error("Invalid credentials")
    }

    const user = mockUsers.find((u) => u.email === email)
    if (user) {
      setUser(user)
      localStorage.setItem("user", JSON.stringify(user))
      toast({
        title: "Welcome!",
        description: `Logged in as ${user.name}`,
      })
    }
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem("user")
    toast({
      title: "Logged out",
      description: "You have been successfully logged out",
    })
  }

  return <AuthContext.Provider value={{ user, login, logout, isLoading }}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
