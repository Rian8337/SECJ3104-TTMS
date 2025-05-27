"use client"

import { useState, useMemo } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import React from "react"

// Types
interface ClassItem {
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

interface TimetableViewProps {
  classes: ClassItem[]
  selectedDay?: string
  onDaySelect?: (day: string) => void
  showDaySelector?: boolean
}

// Constants
const WEEKDAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"] as const
type Weekday = typeof WEEKDAYS[number]

export function TimetableView({ 
  classes, 
  selectedDay: propSelectedDay,
  onDaySelect,
  showDaySelector = true 
}: TimetableViewProps) {
  // Get current day of the week (0 = Sunday, 1 = Monday, etc.)
  const getCurrentDay = (): Weekday => {
    const dayIndex = new Date().getDay()
    // If it's weekend (0 or 6), default to Monday (0)
    if (dayIndex === 0 || dayIndex === 6) return "Monday"
    return WEEKDAYS[dayIndex - 1]
  }

  const [selectedDay, setSelectedDay] = useState<Weekday>(propSelectedDay as Weekday || getCurrentDay())

  // Helper function to format time with AM/PM
  const formatTime = (time: string): string => {
    const [hours, minutes] = time.split(':').map(Number)
    const period = hours >= 12 ? 'PM' : 'AM'
    const displayHours = hours % 12 || 12
    
    // If minutes are 50 or more, round up to next hour
    if (minutes >= 50) {
      const nextHour = (hours + 1) % 24
      const nextDisplayHour = nextHour % 12 || 12
      const nextPeriod = nextHour >= 12 ? 'PM' : 'AM'
      return `${nextDisplayHour} ${nextPeriod}`
    }
    
    // If minutes are 0, just show the hour
    if (minutes === 0) {
      return `${displayHours} ${period}`
    }
    
    // Otherwise show the time with minutes
    return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`
  }

  // Helper function to check if two times are consecutive
  const areTimesConsecutive = (endTime: string, startTime: string): boolean => {
    const toMinutes = (time: string): number => {
      const [hours, minutes] = time.split(':').map(Number)
      return hours * 60 + minutes
    }

    const endMinutes = toMinutes(endTime)
    const startMinutes = toMinutes(startTime)

    // Classes are consecutive if they are exactly 10 minutes apart
    return startMinutes - endMinutes === 10
  }

  // Group and merge consecutive classes
  const processClasses = useMemo(() => {
    // First, group classes by day
    const classesByDay = WEEKDAYS.reduce(
      (acc, day) => {
        acc[day] = classes.filter((c) => c.day === day)
        return acc
      },
      {} as Record<Weekday, ClassItem[]>,
    )

    // For each day, merge consecutive classes
    Object.keys(classesByDay).forEach((day) => {
      const dayClasses = classesByDay[day as Weekday]
      
      // Sort by start time
      dayClasses.sort((a, b) => a.startTime.localeCompare(b.startTime))

      // Group by course code and section
      const groupedClasses = dayClasses.reduce((acc, curr) => {
        const key = `${curr.courseCode}-${curr.section}`
        if (!acc[key]) {
          acc[key] = []
        }
        acc[key].push(curr)
        return acc
      }, {} as Record<string, ClassItem[]>)

      // Merge consecutive classes
      const mergedClasses = Object.entries(groupedClasses).map(([key, group]) => {
        if (group.length === 1) {
          return {
            ...group[0],
            id: `${key}-${group[0].startTime}-${group[0].endTime}`
          }
        }

        // Sort by start time
        group.sort((a, b) => a.startTime.localeCompare(b.startTime))

        // Find consecutive sequences
        const sequences: ClassItem[][] = []
        let currentSequence: ClassItem[] = [group[0]]

        for (let i = 1; i < group.length; i++) {
          const prevClass = currentSequence[currentSequence.length - 1]
          const currentClass = group[i]

          if (
            prevClass.courseCode === currentClass.courseCode &&
            prevClass.section === currentClass.section &&
            prevClass.venue === currentClass.venue &&
            prevClass.lecturer === currentClass.lecturer &&
            areTimesConsecutive(prevClass.endTime, currentClass.startTime)
          ) {
            currentSequence.push(currentClass)
          } else {
            sequences.push([...currentSequence])
            currentSequence = [currentClass]
          }
        }
        sequences.push(currentSequence)

        // Convert sequences to merged classes
        return sequences.map(sequence => {
          if (sequence.length === 1) {
            return {
              ...sequence[0],
              id: `${key}-${sequence[0].startTime}-${sequence[0].endTime}`
            }
          }

          return {
            ...sequence[0],
            endTime: sequence[sequence.length - 1].endTime,
            id: `${key}-${sequence[0].startTime}-${sequence[sequence.length - 1].endTime}`
          }
        })
      }).flat()

      classesByDay[day as Weekday] = mergedClasses
    })

    return classesByDay
  }, [classes])

  // Check if a class has a clash with another class on the same day
  const hasClash = (classItem: ClassItem, classes: ClassItem[]): boolean => {
    return classes.some(
      (c) =>
        c.id !== classItem.id &&
        ((classItem.startTime >= c.startTime && classItem.startTime < c.endTime) ||
          (classItem.endTime > c.startTime && classItem.endTime <= c.endTime) ||
          (classItem.startTime <= c.startTime && classItem.endTime >= c.endTime)),
    )
  }

  const handleDaySelect = (day: Weekday) => {
    setSelectedDay(day)
    onDaySelect?.(day)
  }

  // Render day selector
  const renderDaySelector = () => {
    if (!showDaySelector) return null

    return (
      <div className="flex space-x-2 overflow-x-auto">
        {WEEKDAYS.map((day) => {
          const iconUrl = `https://img.icons8.com/sf-black-filled/100/9a231b/${day.toLowerCase()}.png`

          return (
            <button
              key={day}
              className={`flex flex-col items-center p-1 w-16 transition-all duration-200 ease-in-out ${
                selectedDay === day
                  ? "border-b-2 border-[#9A231B] text-[#9A231B] rounded-t-md rounded-b-none"
                  : "text-gray-700 hover:bg-gray-100 rounded-md"
              }`}
              onClick={() => handleDaySelect(day)}
            >
              <img src={iconUrl} alt={day} className="h-10 w-10 mb-1" />
            </button>
          )
        })}
      </div>
    )
  }

  // Render gap and lunch break
  const renderGapAndLunch = (prevEnd: string, currStart: string) => {
    const prevEndDate = new Date(`2000-01-01T${prevEnd}`)
    const currStartDate = new Date(`2000-01-01T${currStart}`)
    
    // If the gap is exactly 1 hour and crosses lunch time (1-2), it's just lunch break
    if (prevEnd === "13:00" && currStart === "14:00") {
      return (
        <div className="flex items-center w-full">
          <div className="flex-grow border-t border-gray-200"></div>
          <div className="mx-4 text-sm text-green-500 font-medium">1 hr lunch break</div>
          <div className="flex-grow border-t border-gray-200"></div>
        </div>
      )
    }
    
    // If there's a gap before lunch
    if (prevEndDate.getHours() < 13 && currStartDate.getHours() >= 14) {
      const gapBeforeLunch = Math.round((new Date(`2000-01-01T13:00`).getTime() - prevEndDate.getTime()) / (1000 * 60 * 60))
      const gapAfterLunch = Math.round((currStartDate.getTime() - new Date(`2000-01-01T14:00`).getTime()) / (1000 * 60 * 60))
      
      return (
        <div className="flex flex-col items-center justify-center gap-2">
          {gapBeforeLunch > 0 && (
            <div className="inline-block bg-green-100 text-green-600 px-3 py-1 rounded text-xs font-medium border border-gray-200">
              {`${gapBeforeLunch} hr gap`}
            </div>
          )}
          {gapBeforeLunch > 0 && (
            <span className="text-green-400">+</span>
          )}
          <div className="flex items-center w-full">
            <div className="flex-grow border-t border-gray-200"></div>
            <div className="mx-4 text-sm text-green-500 font-medium">1 hr lunch break</div>
            <div className="flex-grow border-t border-gray-200"></div>
          </div>
          {gapAfterLunch > 0 && (
            <span className="text-green-400">+</span>
          )}
          {gapAfterLunch > 0 && (
            <div className="inline-block bg-green-100 text-green-600 px-3 py-1 rounded text-xs font-medium border border-gray-200">
              {`${gapAfterLunch} hr gap`}
            </div>
          )}
        </div>
      )
    }
    
    // If there's a gap after lunch
    if (prevEndDate.getHours() === 13 && currStartDate.getHours() > 14) {
      const gapAfterLunch = Math.round((currStartDate.getTime() - new Date(`2000-01-01T14:00`).getTime()) / (1000 * 60 * 60))
      
      return (
        <div className="flex flex-col items-center justify-center gap-2">
          <div className="flex items-center w-full">
            <div className="flex-grow border-t border-gray-200"></div>
            <div className="mx-4 text-sm text-green-500 font-medium">1 hr lunch break</div>
            <div className="flex-grow border-t border-gray-200"></div>
          </div>
          {gapAfterLunch > 0 && (
            <span className="text-green-400">+</span>
          )}
          {gapAfterLunch > 0 && (
            <div className="inline-block bg-green-100 text-green-600 px-3 py-1 rounded text-xs font-medium border border-gray-200">
              {`${gapAfterLunch} hr gap`}
            </div>
          )}
        </div>
      )
    }
    
    // Regular gap
    const diffMinutes = (currStartDate.getTime() - prevEndDate.getTime()) / (1000 * 60)
    const hours = Math.round(diffMinutes / 60)
    
    return hours > 0 ? (
      <div className="flex justify-center">
        <div className="inline-block bg-yellow-100 text-yellow-600 px-3 py-1 rounded text-xs font-medium border border-gray-200">
          {`${hours} hr gap`}
        </div>
      </div>
    ) : null;
    
  }

  return (
    <div className="space-y-4">
      {renderDaySelector()}

      <div className="space-y-3">
        {processClasses[selectedDay]?.length === 0 ? (
          <Card>
            <CardContent className="p-4 text-center text-muted-foreground">
              No classes scheduled for {selectedDay}
            </CardContent>
          </Card>
        ) : (
          processClasses[selectedDay]
            ?.sort((a, b) => a.startTime.localeCompare(b.startTime))
            .map((classItem, index, array) => {
              const hasClashHighlight = hasClash(classItem, processClasses[selectedDay])
              
              return (
                <React.Fragment key={classItem.id}>
                  {index > 0 && renderGapAndLunch(array[index - 1].endTime, classItem.startTime)}

                  <Card className={`overflow-hidden ${hasClashHighlight ? "border-red-300" : ""}`}>
                    <CardContent className="p-0">
                      <div className={`flex ${hasClashHighlight ? "bg-red-50" : "bg-white"}`}>
                        {/* Time Section */}
                        <div className="flex flex-col items-center justify-between p-4 border-r border-gray-200 min-w-[80px]">
                          <div className="font-bold text-xs text-gray-700">{formatTime(classItem.startTime)}</div>
                          <div className="relative flex-grow flex items-center justify-center w-full my-2">
                            <div className="absolute w-0.5 h-full bg-gray-200 left-1/2 transform -translate-x-1/2"></div>
                            <div className="bg-blue-100 text-blue-600 px-2 py-1 rounded text-xs font-medium border border-gray-200 z-10">
                              {(() => {
                                const start = new Date(`2000-01-01T${classItem.startTime}`)
                                const end = new Date(`2000-01-01T${classItem.endTime}`)
                                const diffMinutes = (end.getTime() - start.getTime()) / (1000 * 60)
                                const hours = Math.round(diffMinutes / 60)
                                return `${hours} hr`
                              })()}
                            </div>
                          </div>
                          <div className="font-bold text-xs text-gray-700">{formatTime(classItem.endTime)}</div>
                        </div>

                        {/* Details Section */}
                        <div className="flex-grow p-4">
                          <h4 className="text-sm font-bold text-gray-800 mb-3">
                            {classItem.course.split(' - ')[1] || classItem.course}
                          </h4>
                          <div className="flex gap-5 mb-3">
                            <span className="text-sm text-gray-600">{classItem.courseCode}-{classItem.section.padStart(2, '0')}</span>
                            <span className="text-sm text-gray-600">{classItem.venue}</span>
                          </div>
                          <hr className="border-gray-200 my-3" />
                          <div className="text-xs text-gray-500 mb-1">Lecturer</div>
                          <div className="text-sm font-bold text-gray-700">{classItem.lecturer}</div>
                          {hasClashHighlight && (
                            <Badge variant="destructive" className="absolute top-4 right-4 text-xs">
                              Clash
                            </Badge>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </React.Fragment>
              )
            })
        )}
      </div>
    </div>
  )
} 