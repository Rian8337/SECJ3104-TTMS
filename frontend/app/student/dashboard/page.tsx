"use client"

import { Suspense, useState, useEffect } from "react"
import { StudentDashboard } from "@/components/student/dashboard"
import { MobileLayout } from "@/components/mobile-layout"
import { API_BASE_URL } from "@/lib/config"
import { useRouter } from "next/navigation"

interface StudentInfo {
  name: string
  matricNo: string
  facultyCode: string
}

export default function StudentDashboardPage() {
  const [studentInfo, setStudentInfo] = useState<StudentInfo | null>(null)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  // Get student information from localStorage
  useEffect(() => {
    const storedInfo = localStorage.getItem('studentInfo')
    if (!storedInfo) {
      router.push('/')
      return
    }

    try {
      const info = JSON.parse(storedInfo)
      setStudentInfo(info)
    } catch (err) {
      console.error('Error parsing student info:', err)
      setError('Failed to load student information')
      localStorage.removeItem('studentInfo')
      router.push('/')
    }
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
