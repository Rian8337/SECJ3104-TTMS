import { redirect } from "next/navigation"
import { LoginForm } from "@/components/login-form"

export default function Home() {
  // If user is already logged in, redirect to dashboard
  // This would normally check a session/token
  const isLoggedIn = false

  if (isLoggedIn) {
    redirect("/dashboard")
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 bg-gradient-to-b from-red-800 to-red-900">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center mb-6">
          <h1 className="text-3xl font-bold text-white mb-2">UTM TMS</h1>
          <p className="text-white/80 text-center">Timetable Management System</p>
        </div>
        <LoginForm />
      </div>
    </main>
  )
}
