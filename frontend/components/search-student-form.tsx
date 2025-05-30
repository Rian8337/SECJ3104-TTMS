"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { API_BASE_URL } from "@/lib/config"
import { TimetableView } from "@/components/timetable-view"
import { ClassItem } from "@/types/timetable"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { formatTimetableData, getCurrentDay, type Weekday } from "@/lib/timetable-utils"

interface StudentSearchResult {
  matricNo: string
  name: string
  courseCode: string
  facultyCode: string
}

interface LecturerSearchResult {
  workerNo: string
  name: string
  department: string
  facultyCode: string
}

const AnimatedPlaceholder = ({ text }: { text: string }) => {
  const [displayText, setDisplayText] = useState("")
  const [isDeleting, setIsDeleting] = useState(false)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [currentText, setCurrentText] = useState(text)
  const [isComplete, setIsComplete] = useState(false)

  // Get the common prefix and changing part based on the text
  const getTextParts = (text: string) => {
    return {
      prefix: "Search student by ",
      changingPart: text.replace("Search student by ", "")
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
  const [lecturerResults, setLecturerResults] = useState<LecturerSearchResult[]>([])
  const [selectedStudent, setSelectedStudent] = useState<StudentSearchResult | null>(null)
  const [selectedLecturer, setSelectedLecturer] = useState<LecturerSearchResult | null>(null)
  const [isSearching, setIsSearching] = useState(false)
  const [selectedDay, setSelectedDay] = useState<Weekday>(getCurrentDay())
  const [timetable, setTimetable] = useState<ClassItem[]>([])
  const [loadingTimetable, setLoadingTimetable] = useState(false)
  const [searchError, setSearchError] = useState<string | null>(null)
  const [placeholderIndex, setPlaceholderIndex] = useState(0)
  const [showLecturerTimetable, setShowLecturerTimetable] = useState(false)
  const [lecturerTimetable, setLecturerTimetable] = useState<ClassItem[]>([])
  const [lecturerLoading, setLecturerLoading] = useState(false)
  const [lecturerError, setLecturerError] = useState<string | null>(null)
  const [currentLecturerName, setCurrentLecturerName] = useState<string>("")
  const [activeTab, setActiveTab] = useState("students")

  const placeholders = {
    students: [
      "Search student by name",
      "Search student by matric no"
    ],
    lecturers: "Search lecturer by name"
  }

  useEffect(() => {
    const interval = setInterval(() => {
      if (activeTab === "students") {
        setPlaceholderIndex((prevIndex) => (prevIndex + 1) % placeholders.students.length)
      }
    }, 200)

    return () => clearInterval(interval)
  }, [activeTab])

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSearching(true)
    setSearchResults([])
    setLecturerResults([])
    setSearchError(null)

    try {
      if (activeTab === "students") {
        const response = await fetch(
          `${API_BASE_URL}/student/search?query=${encodeURIComponent(searchQuery.trim())}&session=2024/2025&semester=2`,
          {
            credentials: 'include'
          }
        )

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
      } else {
        const response = await fetch(
          `${API_BASE_URL}/lecturer/search?query=${encodeURIComponent(searchQuery.trim())}&session=2024/2025&semester=2`,
          {
            credentials: 'include'
          }
        )

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || 'Failed to search lecturers')
        }

        const data = await response.json()
        setLecturerResults(data.map((lecturer: any) => ({
          workerNo: lecturer.workerNo,
          name: lecturer.name,
          department: lecturer.department,
          facultyCode: lecturer.facultyCode
        })))
      }
    } catch (error) {
      console.error('Error searching:', error)
      setSearchError(error instanceof Error ? error.message : 'An unknown error occurred during search.')
      setSearchResults([])
      setLecturerResults([])
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
      const formattedTimetable = formatTimetableData(timetableData)
      setTimetable(formattedTimetable)
    } catch (error) {
      console.error('Error fetching timetable:', error)
    } finally {
      setLoadingTimetable(false)
    }
  }

  const handleSelectLecturer = async (lecturer: LecturerSearchResult) => {
    setSelectedLecturer(lecturer)
    setLecturerResults([])
    setSelectedDay(getCurrentDay())
    setLoadingTimetable(true)

    try {
      const response = await fetch(
        `${API_BASE_URL}/lecturer/timetable?worker_no=${lecturer.workerNo}&session=2024/2025&semester=2`,
        {
          credentials: 'include'
        }
      )

      if (!response.ok) {
        throw new Error('Failed to fetch timetable')
      }

      const timetableData = await response.json()
      const formattedTimetable = formatTimetableData(timetableData)
      setTimetable(formattedTimetable)
    } catch (error) {
      console.error('Error fetching timetable:', error)
    } finally {
      setLoadingTimetable(false)
    }
  }

  // Add function to handle lecturer name click
  const handleLecturerClick = async (workerNo: string, lecturerName: string) => {
    setShowLecturerTimetable(true)
    setCurrentLecturerName(lecturerName)
    setLecturerLoading(true)
    setLecturerError(null)

    try {
      const response = await fetch(
        `${API_BASE_URL}/lecturer/timetable?worker_no=${workerNo}&session=2024/2025&semester=2`,
        {
          credentials: 'include'
        }
      )

      if (!response.ok) {
        throw new Error('Failed to fetch lecturer timetable')
      }

      const timetableData = await response.json()
      const formattedTimetable = formatTimetableData(timetableData)
      setLecturerTimetable(formattedTimetable)
    } catch (error) {
      console.error('Error fetching lecturer timetable:', error)
      setLecturerError(error instanceof Error ? error.message : 'Failed to fetch lecturer timetable')
    } finally {
      setLecturerLoading(false)
    }
  }

  return (
    <div className="mt-2 space-y-4">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="border #000000 w-full">
          <TabsTrigger value="students">Students</TabsTrigger>
          <TabsTrigger value="lecturers">Lecturers</TabsTrigger>
        </TabsList>

        <TabsContent value="students" className="space-y-4">
          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="relative flex-1">
              <Input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1"
              />
              <div className="absolute inset-0 flex items-center px-3 pointer-events-none">
                {searchQuery === "" && activeTab === "students" && (
                  <AnimatedPlaceholder text={placeholders.students[placeholderIndex]} />
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
                  <CardContent className="p-4 border-2 border-gray-200 rounded-md">
                    <div className="flex flex-col gap-2">
                      <h4 className="text-xs font-semibold">{student.name}</h4>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-500">{student.matricNo}</span>
                        <span className="text-sm text-gray-500">{student.courseCode}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {selectedStudent && (
            <div className="space-y-4 border-2  rounded-md p-4">
              <div className="flex flex-col gap-2 text-[#9A231B]">
                <h4 className="text-xs font-semibold">{`${selectedStudent.name}'s timetable`}</h4>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-[#9A231B]">{selectedStudent.matricNo}</span>
                  <span className="text-sm text-[#9A231B]">{selectedStudent.courseCode}</span>
                </div>
              </div>

              <hr className="border-t border-[#9A231B]/20" />

              {loadingTimetable ? (
                <div className="text-center py-4">Loading timetable...</div>
              ) : showLecturerTimetable ? (
                <div className="space-y-4">
                  <div className="flex flex-col items-center gap-2">
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
                  {lecturerLoading ? (
                    <div className="text-center py-4">Loading lecturer timetable...</div>
                  ) : lecturerError ? (
                    <div className="text-center py-4 text-red-500">{lecturerError}</div>
                  ) : (
                    <TimetableView 
                      classes={lecturerTimetable} 
                      userType="lecturer"
                      showDaySelector={true}
                      lecturerName={currentLecturerName}
                    />
                  )}
                </div>
              ) : (
                <TimetableView 
                  classes={timetable} 
                  selectedDay={selectedDay}
                  onDaySelect={setSelectedDay}
                  userType="student"
                  onLecturerClick={handleLecturerClick}
                />
              )}
            </div>
          )}
        </TabsContent>

        <TabsContent value="lecturers" className="space-y-4">
          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="relative flex-1">
              <Input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1"
              />
              <div className="absolute inset-0 flex items-center px-3 pointer-events-none">
                {searchQuery === "" && activeTab === "lecturers" && (
                  <span className="text-muted-foreground">{placeholders.lecturers}</span>
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

          {lecturerResults.length > 0 && (
            <div className="space-y-2">
              {lecturerResults.map((lecturer) => (
                <Card
                  key={lecturer.workerNo}
                  className="cursor-pointer hover:bg-gray-50"
                  onClick={() => handleSelectLecturer(lecturer)}
                >
                  <CardContent className="p-4 border-2 border-gray-200 rounded-md">
                    <div className="flex flex-col gap-2">
                      <h4 className="text-xs font-semibold">{lecturer.name}</h4>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-500">{lecturer.workerNo}</span>
                        <span className="text-sm text-gray-500">{lecturer.department}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {selectedLecturer && (
            <div className="space-y-4 border-2  rounded-md p-4">
              <div className="flex flex-col gap-2 text-[#9A231B]">
                <h4 className="text-xs font-semibold">{`${selectedLecturer.name}'s timetable`}</h4>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-[#9A231B]">{selectedLecturer.workerNo}</span>
                  <span className="text-sm text-[#9A231B]">{selectedLecturer.department}</span>
                </div>
              </div>

              <hr className="border-t border-[#9A231B]/20" />

              {loadingTimetable ? (
                <div className="text-center py-4">Loading timetable...</div>
              ) : (
                <TimetableView 
                  classes={timetable} 
                  selectedDay={selectedDay}
                  onDaySelect={setSelectedDay}
                  userType="lecturer"
                  lecturerName={selectedLecturer.name}
                />
              )}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
