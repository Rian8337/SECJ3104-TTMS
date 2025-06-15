"use client"

import { useState, useEffect } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { SearchStudentForm } from "@/components/search-student-form"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertTriangle } from "lucide-react"
import { DailyClassesView } from "@/components/student/daily-classes-view"
import { useSearchParams, useRouter } from "next/navigation"
import { API_BASE_URL } from "@/lib/config"
import { motion } from "framer-motion"
import { formatTimetableData, getTimetableClashes, getClashSummary } from "@/lib/timetable-utils"
import { TimetableView } from "@/components/timetable-view"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"

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
  courseSection: {
    lecturer?: {
      name: string
      workerNo: string | number
    }
  }
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
  const [showLecturerTimetable, setShowLecturerTimetable] = useState(false)
  const [lecturerTimetable, setLecturerTimetable] = useState<TimetableEntry[]>([])
  const [lecturerLoading, setLecturerLoading] = useState(false)
  const [lecturerError, setLecturerError] = useState<string | null>(null)
  const [lecturerName, setLecturerName] = useState<string>("")
  const router = useRouter()

  // Detect clashes in timetable
  const clashes = getTimetableClashes(timetable)
  const clashSummary = getClashSummary(clashes)

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

        // Use the shared formatTimetableData function
        const formattedTimetable = formatTimetableData(data)
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

  // Add new function to fetch lecturer timetable
  const fetchLecturerTimetable = async (workerNo: string, name: string) => {
    try {
      setLecturerLoading(true)
      setLecturerError(null)
      setLecturerName(name)
      const response = await fetch(
        `${process.env.BACKEND_URL}/lecturer/timetable?worker_no=${encodeURIComponent(workerNo)}&session=2024/2025&semester=2`,
        {
          credentials: 'include'
        }
      )
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to fetch lecturer timetable')
      }

      const data = await response.json()
      const formattedTimetable = formatTimetableData(data)
      setLecturerTimetable(formattedTimetable)
    } catch (err) {
      console.error('Error in fetchLecturerTimetable:', err)
      setLecturerError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLecturerLoading(false)
    }
  }

  // Add function to handle lecturer name click
  const handleLecturerClick = (workerNo: string, name: string) => {
    setShowLecturerTimetable(true)
    fetchLecturerTimetable(workerNo, name)
  }

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
        className="flex flex-col w-full mb-2"
      >
        <h1 className="text-2xl font-bold font-cursive">Welcome,</h1> 
        <h3 className="text-2xl font-cursive text-center mt-2">{studentInfo.name}</h3> 
      </motion.div>

      {clashSummary.count > 0 && (
        <Alert variant="destructive" className="mb-4">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Timetable Clashes Detected</AlertTitle>
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="clash-details" className="border-none">
              <AccordionTrigger className="py-2 hover:no-underline">
                View Clash Details
              </AccordionTrigger>
              <AccordionContent>
                <AlertDescription className="whitespace-pre-line">
                  {clashSummary.description}
                </AlertDescription>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </Alert>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 border #000000">
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

          {showLecturerTimetable ? (
            <div className="space-y-4">
              <div className="flex justify-center items-center">
                <button
                onClick={() => setShowLecturerTimetable(false)}
                className="flex items-center justify-center gap-2 px-4 py-2 bg-white text-black border rounded hover:bg-gray-100 transition-colors"
                style={{ borderColor: '#000000' }}
              >
                <img
                  src="https://img.icons8.com/pastel-glyph/100/u-turn-to-left.png"
                  alt="Back Icon"
                  className="w-8 h-8"
                />
                Return
              </button>
              </div>
              <h2 className="text-l font-semibold text-blue-700 text-center">{lecturerName}'s Timetable</h2>
              {lecturerLoading ? (
                <div className="text-center py-4">Loading lecturer timetable...</div>
              ) : lecturerError ? (
                <div className="text-center py-4 text-red-500">{lecturerError}</div>
              ) : (
                <TimetableView 
                  classes={lecturerTimetable} 
                  userType="lecturer"
                  showDaySelector={true}
                />
              )}
            </div>
          ) : (
            loading ? (
              <div className="text-center py-4">Loading timetable...</div>
            ) : (
              <DailyClassesView 
                classes={timetable} 
                onLecturerClick={handleLecturerClick}
              />
            )
          )}
        </TabsContent>

        <TabsContent value="search-timetable">
          <SearchStudentForm />
        </TabsContent>
      </Tabs>
    </motion.div>
  )
}
