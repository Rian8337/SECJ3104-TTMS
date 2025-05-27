"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { SearchStudentForm } from "@/components/student/search-student-form"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertTriangle } from "lucide-react"
import { DailyClassesView } from "@/components/student/daily-classes-view"
import { useSearchParams, useRouter } from "next/navigation"
import { API_BASE_URL } from "@/lib/config"
import { motion } from "framer-motion"

interface TimetableEntry {
  id: string
  course: string
  day: string
  startTime: string
  endTime: string
  venue: string
  lecturer: string
  courseCode: string
  section: string
}

interface StudentInfo {
  name: string
  matricNo: string
  facultyCode?: string
}

interface StudentDashboardProps {
  studentInfo: StudentInfo
}

export function StudentDashboard({ studentInfo }: StudentDashboardProps) {
  const searchParams = useSearchParams()
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || "my-timetable")
  const [timetable, setTimetable] = useState<TimetableEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  // Update activeTab when URL changes
  useEffect(() => {
    const tab = searchParams.get('tab')
    if (tab) {
      setActiveTab(tab)
    }
  }, [searchParams])

  // Fetch timetable data
  useEffect(() => {
    const fetchTimetable = async () => {
      if (!studentInfo?.matricNo) {
        console.log('No matric number available, skipping timetable fetch')
        return
      }

      try {
        console.log('Fetching timetable for student:', studentInfo.matricNo)
        setLoading(true)
        const response = await fetch(
          `${API_BASE_URL}/student/timetable?session=2024/2025&semester=2&matric_no=${studentInfo.matricNo}`,
          {
            credentials: 'include'
          }
        )
        
        if (!response.ok) {
          throw new Error('Failed to fetch timetable')
        }

        const data = await response.json()
        console.log('Raw timetable data:', data)

        // Transform the data to match the expected format
        const formattedTimetable = data.map((entry: any) => {
          console.log('Processing timetable entry:', entry)
          
          // Convert day number to string
          const dayMap: { [key: number]: string } = {
            1: 'Sunday',
            2: 'Monday',
            3: 'Tuesday',
            4: 'Wednesday',
            5: 'Thursday',
            6: 'Friday',
            7: 'Saturday'
          }

          // Convert time number to actual time
          const timeMap: { [key: number]: string } = {
            1: '07:00 - 07:50',
            2: '08:00 - 08:50',
            3: '09:00 - 09:50',
            4: '10:00 - 10:50',
            5: '11:00 - 11:50',
            6: '12:00 - 12:50',
            7: '13:00 - 13:50',
            8: '14:00 - 14:50',
            9: '15:00 - 15:50',
            10: '16:00 - 16:50',
            11: '17:00 - 17:50',
            12: '18:00 - 18:50',
            13: '19:00 - 19:50',
            14: '20:00 - 20:50',
            15: '21:00 - 21:50',
            16: '22:00 - 22:50'
          }

          const timeRange = timeMap[entry.time] || 'TBA'
          const [startTime, endTime] = timeRange.split(' - ')

          return {
            id: `${entry.courseSection?.course?.code || 'UNKNOWN'}-${entry.courseSection?.section || 'UNKNOWN'}`,
            course: `${entry.courseSection?.course?.code || 'UNKNOWN'} - ${entry.courseSection?.course?.name || 'Unknown Course'}`,
            day: dayMap[entry.day] || 'Unknown',
            startTime,
            endTime,
            venue: entry.venue?.shortName || 'TBA',
            lecturer: entry.lecturer?.name || 'TBA',
            courseCode: entry.courseSection?.course?.code || 'UNKNOWN',
            section: entry.courseSection?.section || 'UNKNOWN'
          }
        })

        console.log('Formatted timetable:', formattedTimetable)
        setTimetable(formattedTimetable)
      } catch (err) {
        console.error('Error fetching timetable:', err)
        setError(err instanceof Error ? err.message : 'Failed to fetch timetable')
      } finally {
        setLoading(false)
      }
    }

    fetchTimetable()
  }, [studentInfo?.matricNo])

  // Detect clashes in timetable
  const clashes = timetable.filter((class1) =>
    timetable.some(
      (class2) =>
        class1.id !== class2.id &&
        class1.day === class2.day &&
        ((class1.startTime >= class2.startTime && class1.startTime < class2.endTime) ||
          (class1.endTime > class2.startTime && class1.endTime <= class2.endTime) ||
          (class1.startTime <= class2.startTime && class1.endTime >= class2.endTime)),
    ),
  )

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
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-4"
    >
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.5 }}
        className="flex items-center justify-between mb-2"
      >
        <h1 className="text-xl font-bold">Welcome, {studentInfo.name}</h1>
        {/* <div className="text-sm text-muted-foreground">{studentInfo.matricNo}</div> */}
      </motion.div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="my-timetable">Dashboard</TabsTrigger>
          <TabsTrigger value="search-timetable">Search Timetable</TabsTrigger>
        </TabsList>

        <TabsContent value="my-timetable" className="space-y-4 mt-4">
          {error && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {clashes.length > 0 && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Timetable Clashes Detected</AlertTitle>
              <AlertDescription>You have {clashes.length} class conflicts in your schedule.</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <p className="text-sm text-muted-foreground text-center p-4">
              {studentInfo.facultyCode ? `Faculty of ${studentInfo.facultyCode}` : ''}
            </p>
            {loading ? (
              <div className="text-center py-4">Loading timetable...</div>
            ) : (
              <DailyClassesView classes={timetable} />
            )}
          </div>
        </TabsContent>

        <TabsContent value="search-timetable">
          <SearchStudentForm />
        </TabsContent>
      </Tabs>
    </motion.div>
  )
}
