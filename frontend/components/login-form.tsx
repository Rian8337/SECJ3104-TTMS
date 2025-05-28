"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertCircle, Loader2 } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { API_BASE_URL } from "@/lib/config"
import { motion, AnimatePresence } from "framer-motion"

export function LoginForm() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setIsLoading(true)
    setError("")

    const formData = new FormData(event.currentTarget)
    const login = formData.get("login") as string
    const password = formData.get("password") as string

    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ login, password }),
        credentials: 'include',
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Login failed')
      }

      // Store student info from login response
      localStorage.setItem('studentInfo', JSON.stringify({
        name: data.name,
        matricNo: data.matricNo,
        facultyCode: data.facultyCode
      }))

      // Check if response has workerNo to determine if it's a lecturer
      if ('workerNo' in data) {
        router.push("/lecturer/dashboard")
      } else {
        router.push("/student/dashboard")
      }
    } catch (err) {
      console.error('Login error:', err)
      setError(err instanceof Error ? err.message : 'An error occurred during login')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card className="w-full border-0 shadow-lg">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl text-center">Login to UTM TMS</CardTitle>
          <CardDescription className="text-center">Access your timetable and course information</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="login">Login</Label>
                <Input
                  id="login"
                  name="login"
                  placeholder="A12345678"
                  type="text"
                  autoCapitalize="none"
                  autoComplete="off"
                  autoCorrect="off"
                  maxLength={9}
                  required
                  disabled={isLoading}
                  className="transition-all duration-200"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="KP1234567890"
                  autoCapitalize="none"
                  autoComplete="current-password"
                  maxLength={12}
                  required
                  disabled={isLoading}
                  className="transition-all duration-200"
                />
              </div>
              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  </motion.div>
                )}
              </AnimatePresence>
              <div className="text-sm text-muted-foreground">
                <p><b>Students:</b> Log in with your Matric Number & I/C Number.</p>
                <p><b>Lecturers:</b> Log in with your Worker ID & password.</p>
              </div>
              <Button
                type="submit"
                className={`w-full bg-red-700 hover:bg-red-800 transition-all duration-300 relative ${isLoading ? 'opacity-90 cursor-not-allowed' : ''
                  }`}
                disabled={isLoading}
              >
                <motion.div
                  initial={false}
                  animate={{ opacity: isLoading ? 0 : 1 }}
                  transition={{ duration: 0.2 }}
                >
                  Login
                </motion.div>
                {isLoading && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.2 }}
                    className="absolute inset-0 flex items-center justify-center"
                  >
                    <Loader2 className="h-5 w-5 animate-spin" />
                  </motion.div>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col">
          <div className="text-sm text-muted-foreground text-center">
            <a href="#" className="underline underline-offset-4 hover:text-primary transition-colors duration-200">
              Forgot your password?
            </a>
          </div>
        </CardFooter>
      </Card>
    </motion.div>
  )
}
