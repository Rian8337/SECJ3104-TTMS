"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Clock, MapPin, Users } from "lucide-react"
import { API_BASE_URL } from "@/lib/config"

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
    }
  }
}

export function CurrentClassesView() {
  const [selectedTime, setSelectedTime] = useState("now")
  const [currentClasses, setCurrentClasses] = useState<TimetableEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchCurrentClasses = async () => {
      try {
        setLoading(true)
        const storedInfo = localStorage.getItem('lecturerInfo')
        if (!storedInfo) {
          throw new Error('No lecturer information found')
        }
        
        const lecturerInfo = JSON.parse(storedInfo)
        
        const response = await fetch(
          `${API_BASE_URL}/lecturer/timetable?session=2024/2025&semester=1&worker_no=${lecturerInfo.workerNo}`,
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
          lecturer: entry.courseSection.lecturer?.name || 'TBA',
          courseCode: entry.courseSection.course.code,
          section: entry.courseSection.section,
          courseSection: {
            lecturer: entry.courseSection.lecturer
          }
        }))

        // Filter classes based on current time
        const now = new Date()
        const currentDay = now.toLocaleDateString('en-US', { weekday: 'long' })
        const currentTime = now.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' })

        const filteredClasses = formattedTimetable.filter((classItem) => {
          if (classItem.day !== currentDay) return false
          return classItem.startTime <= currentTime && classItem.endTime >= currentTime
        })

        setCurrentClasses(filteredClasses)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch current classes')
      } finally {
        setLoading(false)
      }
    }

    fetchCurrentClasses()
    // Refresh every minute
    const interval = setInterval(fetchCurrentClasses, 60000)
    return () => clearInterval(interval)
  }, [])

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="text-lg font-medium">Loading current classes...</div>
        <div className="text-muted-foreground">Please wait while we fetch your schedule</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <div className="text-lg font-medium text-red-600">Error</div>
        <div className="text-muted-foreground">{error}</div>
      </div>
    )
  }

  if (currentClasses.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="text-lg font-medium">No Current Classes</div>
        <div className="text-muted-foreground">You don't have any classes at the moment</div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-2">
        <Select value={selectedTime} onValueChange={setSelectedTime}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select time" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="now">Current Time</SelectItem>
            <SelectItem value="09:00">09:00 AM</SelectItem>
            <SelectItem value="11:00">11:00 AM</SelectItem>
            <SelectItem value="13:00">01:00 PM</SelectItem>
            <SelectItem value="15:00">03:00 PM</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-4">
        {currentClasses.map((classItem) => (
          <Card key={classItem.id} className="overflow-hidden">
            <CardContent className="p-0">
              <div className="bg-red-50 p-3">
                <h3 className="font-medium">{classItem.course}</h3>
                <div className="flex items-center text-sm text-muted-foreground mt-1">
                  <Clock className="h-3.5 w-3.5 mr-1" />
                  <span>{classItem.startTime} - {classItem.endTime}</span>
                  <span className="mx-2">•</span>
                  <MapPin className="h-3.5 w-3.5 mr-1" />
                  <span>{classItem.venue}</span>
                </div>
              </div>

              <div className="p-3">
                <div className="flex items-center mb-2">
                  <Users className="h-4 w-4 mr-2 text-muted-foreground" />
                  <span className="text-sm font-medium">Section {classItem.section}</span>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-medium">{classItem.lecturer}</div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
