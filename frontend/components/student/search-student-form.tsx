"use client"

import type React from "react"

import { useState, useMemo, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Search } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { API_BASE_URL } from "@/lib/config"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertTriangle } from "lucide-react"

interface StudentSearchResult {
  matricNo: string
  name: string
  courseCode: string
  facultyCode: string
}

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

interface TimetableByDay {
  [key: string]: TimetableEntry[]
}

export function SearchStudentForm() {
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<StudentSearchResult[]>([])
  const [selectedStudent, setSelectedStudent] = useState<StudentSearchResult | null>(null)
  const [isSearching, setIsSearching] = useState(false)
  const [selectedDay, setSelectedDay] = useState("Monday")
  const [timetable, setTimetable] = useState<TimetableByDay>({})
  const [loadingTimetable, setLoadingTimetable] = useState(false)
  const [searchError, setSearchError] = useState<string | null>(null)

  // Weekdays
  const weekdays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]

  // Get current day of the week (0 = Sunday, 1 = Monday, etc.)
  const getCurrentDay = () => {
    const dayIndex = new Date().getDay()
    // If it's weekend (0 or 6), default to Monday (0)
    if (dayIndex === 0 || dayIndex === 6) return "Monday"
    return weekdays[dayIndex - 1]
  }

  // Set initial selected day to current day
  useEffect(() => {
    setSelectedDay(getCurrentDay())
  }, [])

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSearching(true)
    setSearchResults([]) // Clear previous results on new search
    setSearchError(null) // Clear previous errors

    try {
      const response = await fetch(`${API_BASE_URL}/student/search?query=${encodeURIComponent(searchQuery)}`, {
        credentials: 'include'
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to search students')
      }

      const data = await response.json()
      setSearchResults(data.map((student: any) => ({
        matricNo: student.matricNo,
        name: student.name,
        courseCode: student.courseCode,
        facultyCode: student.facultyCode
      })))
    } catch (error) {
      console.error('Error searching students:', error)
      setSearchError(error instanceof Error ? error.message : 'An unknown error occurred during search.')
      setSearchResults([])
    } finally {
      setIsSearching(false)
    }
  }

  const handleSelectStudent = async (student: StudentSearchResult) => {
    setSelectedStudent(student)
    setSearchResults([])
    setSelectedDay(getCurrentDay()) // Reset to current day when selecting a new student
    setLoadingTimetable(true)

    try {
      const response = await fetch(
        `${API_BASE_URL}/student/timetable?session=2024/2025&semester=2&matric_no=${student.matricNo}`,
        {
          credentials: 'include'
        }
      )

      if (!response.ok) {
        throw new Error('Failed to fetch timetable')
      }

      const timetableData = await response.json()
      
      // Transform the data to match the expected format
      const formattedTimetable = timetableData.map((entry: any) => {
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
          id: `${entry.courseSection?.course?.code || 'UNKNOWN'}-${entry.courseSection?.section || 'UNKNOWN'}-${entry.day}-${entry.time}`,
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

      // Process timetable to merge consecutive classes
      const processClasses = (classes: TimetableEntry[]): TimetableByDay => {
        const dayGroups = weekdays.reduce((acc, day) => {
          acc[day] = classes.filter(c => c.day === day)
          return acc
        }, {} as TimetableByDay)

        // Merge consecutive classes for each day
        Object.keys(dayGroups).forEach(day => {
          const dayClasses = dayGroups[day].sort((a, b) => a.startTime.localeCompare(b.startTime))
          const mergedClasses: TimetableEntry[] = []
          let currentClass: TimetableEntry | null = null

          dayClasses.forEach((classItem) => {
            if (!currentClass) {
              currentClass = { ...classItem }
            } else if (
              currentClass.course === classItem.course &&
              currentClass.venue === classItem.venue &&
              currentClass.lecturer === classItem.lecturer &&
              areTimesConsecutive(currentClass.endTime, classItem.startTime)
            ) {
              // Merge consecutive classes
              currentClass.endTime = classItem.endTime
              currentClass.id = `${currentClass.id}-${classItem.id}`
            } else {
              mergedClasses.push(currentClass)
              currentClass = { ...classItem }
            }
          })

          if (currentClass) {
            mergedClasses.push(currentClass)
          }

          dayGroups[day] = mergedClasses
        })

        return dayGroups
      }

      const processedTimetable = processClasses(formattedTimetable)
      setTimetable(processedTimetable)
    } catch (error) {
      console.error('Error fetching timetable:', error)
    } finally {
      setLoadingTimetable(false)
    }
  }

  // Helper function to check if two times are consecutive
  const areTimesConsecutive = (endTime: string, startTime: string): boolean => {
    // Convert times to minutes for easier comparison
    const toMinutes = (time: string) => {
      const [hours, minutes] = time.split(':').map(Number)
      return hours * 60 + minutes
    }

    const endMinutes = toMinutes(endTime)
    const startMinutes = toMinutes(startTime)

    // Classes are consecutive if they are exactly 10 minutes apart
    // (e.g., 09:50 ends and 10:00 starts)
    return startMinutes - endMinutes === 10
  }

  // Check if a class has a clash with another class on the same day
  const hasClash = (classItem: TimetableEntry, classes: TimetableEntry[]) => {
    return classes.some(
      (c) =>
        c.id !== classItem.id &&
        ((classItem.startTime >= c.startTime && classItem.startTime < c.endTime) ||
          (classItem.endTime > c.startTime && classItem.endTime <= c.endTime) ||
          (classItem.startTime <= c.startTime && classItem.endTime >= c.endTime)),
    )
  }

  return (
    //add some margin top


    <div className="mt-6 space-y-4">
      <form onSubmit={handleSearch} className="flex gap-2">
        <Input
          type="text"
          placeholder="Search by name or matric number..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="flex-1"
        />
        <Button type="submit" disabled={isSearching}>
          {isSearching ? "Searching..." : "Search"}
        </Button>
      </form>

      {searchError && (
        <div className="text-red-500 text-sm">{searchError}</div>
      )}

      {searchResults.length > 0 && (
        <div className="space-y-2">
          {searchResults.map((student) => (
            <Card
              key={student.matricNo}
              className="cursor-pointer hover:bg-gray-50"
              onClick={() => handleSelectStudent(student)}
            >
              <CardContent className="p-4">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="font-medium">{student.name}</h3>
                    <p className="text-sm text-muted-foreground">{student.matricNo}</p>
                  </div>
                  <Badge variant="outline">{student.courseCode}</Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {selectedStudent && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">{selectedStudent.name}</h3>
              <p className="text-sm text-muted-foreground">{selectedStudent.matricNo}</p>
            </div>
            <Badge variant="outline">{selectedStudent.courseCode}</Badge>
          </div>

          {/* Horizontal day selector */}
          <div className="flex space-x-2 overflow-x-auto">
            {weekdays.map((day) => {
              // Use Icon8 CDN URL directly
              const iconUrl = `https://img.icons8.com/sf-black-filled/100/9a231b/${day.toLowerCase()}.png`

              return (
                <button
                  key={day}
                  className={`flex flex-col items-center p-1 w-16 transition-all duration-200 ease-in-out ${
                    selectedDay === day
                      ? "border-b-2 border-[#9A231B] text-[#9A231B] rounded-t-md rounded-b-none"
                      : "text-gray-700 hover:bg-gray-100 rounded-md"
                  }`}
                  onClick={() => setSelectedDay(day)}
                >
                  <img src={iconUrl} alt={day} className="h-10 w-10 mb-1" />
                </button>
              )
            })}
          </div>

          {/* Classes for selected day */}
          <div className="space-y-2">
            {loadingTimetable ? (
              <div className="text-center py-4">Loading timetable...</div>
            ) : timetable[selectedDay]?.length > 0 ? (
              <div className="space-y-2">
                {timetable[selectedDay].map((classItem) => {
                  const hasClashHighlight = hasClash(classItem, timetable[selectedDay])
                  return (
                    <Card
                      key={classItem.id}
                      className={`${
                        hasClashHighlight ? "border-red-500 bg-red-50" : ""
                      }`}
                    >
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-medium">{classItem.course}</h4>
                            <div className="text-sm text-muted-foreground mt-2 space-y-1">
                              <div className="flex items-center">
                                <span className="inline-block w-16 font-medium">Time:</span>
                                <span>
                                  {classItem.startTime} - {classItem.endTime}
                                </span>
                              </div>
                              <div className="flex items-center">
                                <span className="inline-block w-16 font-medium">Venue:</span>
                                <span>{classItem.venue}</span>
                              </div>
                              <div className="flex items-center">
                                <span className="inline-block w-16 font-medium">Lecturer:</span>
                                <span>{classItem.lecturer}</span>
                              </div>
                            </div>
                          </div>
                          {hasClashHighlight && (
                            <Badge variant="destructive">Clash</Badge>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            ) : (
              <div className="text-center py-4 text-muted-foreground">
                No classes scheduled for {selectedDay}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
