"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Label } from "@/components/ui/label"
import { API_BASE_URL } from "@/lib/config"
import { useRouter } from "next/navigation"

interface StudentInfo {
  matricNo: string
  name: string
  courseCode: string
  facultyCode: string
  kpNo: string;
}

export function StudentProfile() {
  const [studentInfo, setStudentInfo] = useState<StudentInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

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
    } finally {
      setLoading(false)
    }
  }, [router])

  if (loading) {
    return <div className="text-center">Loading profile...</div>
  }

  if (error) {
    return <div className="text-center text-red-500">Error: {error}</div>
  }

  if (!studentInfo) {
    return <div className="text-center">No profile data available.</div>
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">My Profile</h1>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle>Personal Information</CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="flex flex-col items-center mb-6">
            <Avatar className="h-24 w-24 mb-4">
              <AvatarImage src="/diverse-students-studying.png" alt={studentInfo.name} />
              <AvatarFallback className="text-2xl bg-red-100 text-red-800">{studentInfo.name.charAt(0).toUpperCase()}{studentInfo.name.split(' ')[1]?.charAt(0).toUpperCase() || ''}</AvatarFallback>
            </Avatar>
            <h2 className="text-xl font-bold">{studentInfo.name}</h2>
            <p className="text-muted-foreground">{studentInfo.courseCode}</p>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-muted-foreground text-xs">Matric Number</Label>
                <p className="font-medium">{studentInfo.matricNo}</p>
              </div>
              <div>
                <Label className="text-muted-foreground text-xs">Faculty Code</Label>
                <p className="font-medium">{studentInfo.facultyCode}</p>
              </div>
            </div>

            <div>
              <Label className="text-muted-foreground text-xs">KP Number</Label>
              <p className="font-medium">{studentInfo.kpNo}</p>
            </div>

            {/* Add other relevant fields if available in the API response */}
            {/* <div>
              <Label className="text-muted-foreground text-xs">Email</Label>
              <p className="font-medium">saminsarwat@graduate.utm.my</p>
            </div>

            <div>
              <Label className="text-muted-foreground text-xs">Phone</Label>
              <p className="font-medium">01137389873</p>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-muted-foreground text-xs">Current Semester</Label>
                <p className="font-medium">2 (2023/2024)</p>
              </div>
              <div>
                <Label className="text-muted-foreground text-xs">Status</Label>
                <p className="font-medium">Active</p>
              </div>
            </div>

            <div>
              <Label className="text-muted-foreground text-xs">Address</Label>
              <p className="font-medium">Kolej Tun Hussein Onn, UTM Skudai, 81310 Johor Bahru, Johor</p>
            </div> */}
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 