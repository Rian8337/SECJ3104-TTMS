"use client"

import { Suspense, useState, useEffect } from "react"
import { StudentDashboard } from "@/components/student/dashboard"
import { MobileLayout } from "@/components/mobile-layout"
import { API_BASE_URL } from "@/lib/config"
import { useRouter } from "next/navigation"

interface StudentInfo {
  name: string
  matricNo: string
}

export default function StudentDashboardPage() {
  const [studentInfo, setStudentInfo] = useState<StudentInfo | null>(null)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  // Fetch student information
  useEffect(() => {
    const fetchStudentInfo = async () => {
      try {
        console.log('Fetching student info...')
        const response = await fetch(`${API_BASE_URL}/auth/login`, {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            login: localStorage.getItem('matricNo'),
            password: localStorage.getItem('password')
          })
        })
        
        if (!response.ok) {
          if (response.status === 401) {
            console.log('Not authenticated, redirecting to login...')
            router.push('/')
            return
          }
          throw new Error('Failed to fetch student information')
        }
        
        const data = await response.json()
        console.log('Student info received:', data)
        setStudentInfo({
          name: data.name,
          matricNo: data.matricNo
        })
      } catch (err) {
        console.error('Error fetching student info:', err)
        setError(err instanceof Error ? err.message : 'Failed to fetch student information')
      }
    }

    fetchStudentInfo()
  }, [router])

  if (!studentInfo) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="text-xl font-semibold mb-2">Loading...</div>
          <div className="text-muted-foreground">Please wait while we fetch your information</div>
        </div>
      </div>
    )
  }

  return (
    <MobileLayout userType="student" studentInfo={studentInfo}>
      <Suspense fallback={<div>Loading timetable...</div>}>
        <StudentDashboard studentInfo={studentInfo} />
      </Suspense>
    </MobileLayout>
  )
}
