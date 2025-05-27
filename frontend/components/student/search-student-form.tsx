"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { API_BASE_URL } from "@/lib/config"
import { TimetableView } from "@/components/student/timetable-view"

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

const AnimatedPlaceholder = ({ text }: { text: string }) => {
  const [displayText, setDisplayText] = useState("")
  const [isDeleting, setIsDeleting] = useState(false)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [currentText, setCurrentText] = useState(text)
  const [isComplete, setIsComplete] = useState(false)

  // Get the common prefix and changing part based on the text
  const getTextParts = (text: string) => {
    if (text.startsWith("Search student by")) {
      return {
        prefix: "Search student by ",
        changingPart: text.replace("Search student by ", "")
      }
    }
    return {
      prefix: "Search ",
      changingPart: text.replace("Search ", "")
    }
  }

  useEffect(() => {
    if (isComplete) {
      setCurrentText(text)
      setCurrentIndex(0)
      const { prefix } = getTextParts(text)
      setDisplayText(prefix)
      setIsDeleting(false)
      setIsComplete(false)
    }
  }, [text, isComplete])

  useEffect(() => {
    const { prefix, changingPart } = getTextParts(currentText)
    const timeout = setTimeout(() => {
      if (!isDeleting && currentIndex < changingPart.length) {
        setDisplayText(prefix + changingPart.slice(0, currentIndex + 1))
        setCurrentIndex(currentIndex + 1)
      } else if (isDeleting && currentIndex > 0) {
        setDisplayText(prefix + changingPart.slice(0, currentIndex - 1))
        setCurrentIndex(currentIndex - 1)
      } else if (!isDeleting && currentIndex === changingPart.length) {
        setTimeout(() => setIsDeleting(true), 1000)
      } else if (isDeleting && currentIndex === 0) {
        setIsDeleting(false)
        setIsComplete(true)
      }
    }, isDeleting ? 50 : 100)

    return () => clearTimeout(timeout)
  }, [currentIndex, isDeleting, currentText])

  return (
    <span className="text-muted-foreground">
      {displayText}
      <span className="animate-blink">|</span>
    </span>
  )
}

export function SearchStudentForm() {
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<StudentSearchResult[]>([])
  const [selectedStudent, setSelectedStudent] = useState<StudentSearchResult | null>(null)
  const [isSearching, setIsSearching] = useState(false)
  const [selectedDay, setSelectedDay] = useState("Monday")
  const [timetable, setTimetable] = useState<TimetableEntry[]>([])
  const [loadingTimetable, setLoadingTimetable] = useState(false)
  const [searchError, setSearchError] = useState<string | null>(null)
  const [placeholderIndex, setPlaceholderIndex] = useState(0)

  const placeholders = [
    "Search student by name",
    "Search student by matric no",
    "Search lecturer by name"
  ]

  useEffect(() => {
    const interval = setInterval(() => {
      setPlaceholderIndex((prevIndex) => (prevIndex + 1) % placeholders.length)
    }, 100) // Very short interval, actual timing controlled by animation completion

    return () => clearInterval(interval)
  }, [])

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

      setTimetable(formattedTimetable)
    } catch (error) {
      console.error('Error fetching timetable:', error)
    } finally {
      setLoadingTimetable(false)
    }
  }

  return (
    <div className="mt-6 space-y-4">
      <form onSubmit={handleSearch} className="flex gap-2">
        <div className="relative flex-1">
          <Input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1"
          />
          <div className="absolute inset-0 flex items-center px-3 pointer-events-none">
            {searchQuery === "" && (
              <AnimatedPlaceholder text={placeholders[placeholderIndex]} />
            )}
          </div>
        </div>
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

          {loadingTimetable ? (
            <div className="text-center py-4">Loading timetable...</div>
          ) : (
            <TimetableView 
              classes={timetable} 
              selectedDay={selectedDay}
              onDaySelect={setSelectedDay}
            />
          )}
        </div>
      )}
    </div>
  )
}
