"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { API_BASE_URL } from "@/lib/config"

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

    // // Validate matric number format (9 characters)
    // if (login.length !== 9) {
    //   setError("Matric number must be 9 characters long")
    //   setIsLoading(false)
    //   return
    // }

    // // Validate KP number format (12 characters)
    // if (password.length !== 12) {
    //   setError("KP number must be 12 characters long")
    //   setIsLoading(false)
    //   return
    // }

    try {
      console.log('Attempting login with:', { login, password })
      
      const response = await fetch(`${API_BASE_URL}/student/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ login, password }),
        credentials: 'include',
      })

      console.log('Response status:', response.status)
      const data = await response.json()
      console.log('Response data:', data)

      if (!response.ok) {
        throw new Error(data.error || 'Login failed')
      }

      // Store credentials for future use
      localStorage.setItem('matricNo', login)
      localStorage.setItem('password', password)

      // Redirect to student dashboard since this is student login
      router.push("/student/dashboard")
    } catch (err) {
      console.error('Login error:', err)
      setError(err instanceof Error ? err.message : 'An error occurred during login')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="w-full border-0 shadow-lg">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl text-center">Login to UTM TMS</CardTitle>
        <CardDescription className="text-center">Access your timetable and course information</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="login">Matric Number</Label>
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
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">KP Number</Label>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="KP1234567890"
                autoCapitalize="none"
                autoComplete="current-password"
                maxLength={12}
                required
              />
            </div>
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <div className="text-sm text-muted-foreground">
              <p>Please use your Matric Number (9 characters) and KP Number (12 characters) to login</p>
            </div>
            <Button type="submit" className="w-full bg-red-700 hover:bg-red-800" disabled={isLoading}>
              {isLoading ? "Logging in..." : "Login"}
            </Button>
          </div>
        </form>
      </CardContent>
      <CardFooter className="flex flex-col">
        <div className="text-sm text-muted-foreground text-center">
          <a href="#" className="underline underline-offset-4 hover:text-primary">
            Forgot your password?
          </a>
        </div>
      </CardFooter>
    </Card>
  )
}
