"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { WeeklyTimetable } from "@/components/timetable/weekly-timetable"
import { SearchStudentForm } from "@/components/student/search-student-form"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertTriangle } from "lucide-react"
import { ClashesView } from "@/components/lecturer/clashes-view"
import { AnalyticsDashboard } from "@/components/lecturer/analytics-dashboard"
import { useRouter } from "next/navigation"

interface TimetableEntry {
  id: string
  course: string
  day: string
  startTime: string
  endTime: string
  venue: string
  lecturer: string
}

interface LecturerInfo {
  name: string
  workerNo: number
}

export function LecturerDashboard() {
  const [activeTab, setActiveTab] = useState("my-timetable")
  const [timetable, setTimetable] = useState<TimetableEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lecturerInfo, setLecturerInfo] = useState<LecturerInfo | null>(null)
  const router = useRouter()

  // Fetch lecturer information
  useEffect(() => {
    const fetchLecturerInfo = async () => {
      try {
        const response = await fetch('/api/lecturer/info', {
          credentials: 'include'
        })
        
        if (!response.ok) {
          if (response.status === 401) {
            // Redirect to login if not authenticated
            router.push('/')
            return
          }
          throw new Error('Failed to fetch lecturer information')
        }
        
        const data = await response.json()
        setLecturerInfo(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch lecturer information')
      }
    }

    fetchLecturerInfo()
  }, [router])

  // Fetch timetable data
  useEffect(() => {
    const fetchTimetable = async () => {
      if (!lecturerInfo?.workerNo) return

      try {
        setLoading(true)
        const response = await fetch(
          `/api/lecturer/timetable?session=2023/2024&semester=2&worker_no=${lecturerInfo.workerNo}`,
          {
            credentials: 'include'
          }
        )
        
        if (!response.ok) {
          throw new Error('Failed to fetch timetable')
        }

        const data = await response.json()
        // Transform the data to match the expected format
        const formattedTimetable = data.map((entry: any) => ({
          id: `${entry.courseSection.course.code}-${entry.courseSection.section}`,
          course: `${entry.courseSection.course.code} - ${entry.courseSection.course.name}`,
          day: entry.day,
          startTime: entry.time.split(' - ')[0],
          endTime: entry.time.split(' - ')[1],
          venue: entry.venue?.shortName || 'TBA',
          lecturer: entry.courseSection.lecturer?.name || 'TBA'
        }))
        setTimetable(formattedTimetable)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch timetable')
      } finally {
        setLoading(false)
      }
    }

    fetchTimetable()
  }, [lecturerInfo?.workerNo])

  if (!lecturerInfo) {
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Welcome, {lecturerInfo.name}</h2>
          <p className="text-muted-foreground">Lecturer Dashboard</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="my-timetable">My Timetable</TabsTrigger>
          <TabsTrigger value="search-student">Search Student</TabsTrigger>
          <TabsTrigger value="clashes">Clashes</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="my-timetable" className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {loading ? (
            <div className="text-center py-8">
              <div className="text-lg font-medium">Loading timetable...</div>
              <div className="text-muted-foreground">Please wait while we fetch your schedule</div>
            </div>
          ) : (
            <WeeklyTimetable classes={timetable} showClashes={true} />
          )}
        </TabsContent>

        <TabsContent value="search-student">
          <SearchStudentForm />
        </TabsContent>

        <TabsContent value="clashes">
          <ClashesView />
        </TabsContent>

        <TabsContent value="analytics">
          <AnalyticsDashboard />
        </TabsContent>
      </Tabs>
    </div>
  )
}
