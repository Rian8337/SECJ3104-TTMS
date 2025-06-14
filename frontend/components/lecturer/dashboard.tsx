"use client"

import { useState, useEffect } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { SearchStudentForm } from "@/components/search-student-form"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertTriangle } from "lucide-react"
import { ClashesView } from "@/components/lecturer/clashes-view"
import { AnalyticsDashboard } from "@/components/lecturer/analytics-dashboard"
import { VenueAvailabilityView } from "@/components/lecturer/venue-availability-view"
import { useRouter, useSearchParams } from "next/navigation"
import { API_BASE_URL } from "@/lib/config"
import { DailyClassesView } from "@/components/lecturer/daily-classes-view"
import { motion } from "framer-motion"
import { formatTimetableData, getTimetableClashes, getClashSummary } from "@/lib/timetable-utils"
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

interface LecturerInfo {
  name: string
  workerNo: string
  facultyCode?: string
}

export function LecturerDashboard() {
  const searchParams = useSearchParams()
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || "my-timetable")
  const [activeSubTab, setActiveSubTab] = useState(searchParams.get('subtab') || "analytics-dashboard")
  const [timetable, setTimetable] = useState<TimetableEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lecturerInfo, setLecturerInfo] = useState<LecturerInfo | null>(null)
  const router = useRouter()

  // Detect clashes in timetable
  const clashes = getTimetableClashes(timetable)
  const clashSummary = getClashSummary(clashes)

  // Update activeTab and activeSubTab when URL changes
  useEffect(() => {
    const tab = searchParams.get('tab')
    const subtab = searchParams.get('subtab')
    
    if (tab) {
      setActiveTab(tab)
    }
    
    // Only update subtab if we're in the analytics tab
    if (tab === 'analytics' && subtab) {
      setActiveSubTab(subtab)
    } else if (tab === 'analytics') {
      setActiveSubTab('analytics-dashboard')
    }
  }, [searchParams])

  // Handle tab changes
  const handleTabChange = (value: string) => {
    setActiveTab(value)
    if (value === 'analytics') {
      router.push(`/lecturer/dashboard?tab=analytics&subtab=analytics-dashboard`)
    } else {
      router.push(`/lecturer/dashboard?tab=${value}`)
    }
  }

  // Handle subtab changes
  const handleSubTabChange = (value: string) => {
    setActiveSubTab(value)
    router.push(`/lecturer/dashboard?tab=analytics&subtab=${value}`)
  }

  // Get lecturer information from localStorage
  useEffect(() => {
    console.log('Fetching lecturer info from localStorage')
    const storedInfo = localStorage.getItem('lecturerInfo')
    if (!storedInfo) {
      console.log('No lecturer info found in localStorage')
      router.push('/')
      return
    }

    try {
      const info = JSON.parse(storedInfo)
      console.log('Parsed lecturer info:', info)
      setLecturerInfo(info)
    } catch (err) {
      console.error('Error parsing lecturer info:', err)
      setError('Failed to load lecturer information')
      localStorage.removeItem('lecturerInfo')
      router.push('/')
    }
  }, [router])

  // Fetch timetable data
  useEffect(() => {
    const fetchTimetable = async () => {
      if (!lecturerInfo?.workerNo) {
        console.log('No worker number available, skipping timetable fetch')
        return
      }

      try {
        console.log('Fetching timetable for worker:', lecturerInfo.workerNo)
        setLoading(true)
        const response = await fetch(
          `${API_BASE_URL}/lecturer/timetable?worker_no=${lecturerInfo.workerNo}&session=2024/2025&semester=2`,
          {
            credentials: 'include'
          }
        )
        
        if (!response.ok) {
          throw new Error('Failed to fetch timetable')
        }

        const data = await response.json()
        console.log('Received timetable data:', data)

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
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.5 }}
        className="flex flex-col w-full mb-2"
      >
        <h2 className="text-2xl font-bold font-cursive">Welcome,</h2>
        <h3 className="text-2xl font-cursive text-center mt-2">{lecturerInfo.name}</h3>
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

      <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
        <TabsList className="border #000000 w-full">
          <TabsTrigger value="my-timetable">My Timetable</TabsTrigger>
          <TabsTrigger value="search">Search</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="venues">Venues</TabsTrigger>
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
            <DailyClassesView classes={timetable} />
          )}
        </TabsContent>

        <TabsContent value="search">
          <SearchStudentForm />
        </TabsContent>

        <TabsContent value="analytics">
          <Tabs value={activeSubTab} onValueChange={handleSubTabChange} className="space-y-4">
            <TabsList className="border #000000 w-full" >
              <TabsTrigger value="analytics-dashboard">Analytics</TabsTrigger>
              <TabsTrigger value="clashes">Clashes</TabsTrigger>
            </TabsList>
            
            <TabsContent value="analytics-dashboard">
              <AnalyticsDashboard />
            </TabsContent>
            
            <TabsContent value="clashes">
              <ClashesView />
            </TabsContent>
          </Tabs>
        </TabsContent>

        <TabsContent value="venues">
          <VenueAvailabilityView />
        </TabsContent>
      </Tabs>
    </motion.div>
  )
}
