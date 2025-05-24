"use client"

import { useState, useMemo } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

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

interface DailyClassesViewProps {
  classes: ClassItem[]
}

export function DailyClassesView({ classes }: DailyClassesViewProps) {
  // Weekdays
  const weekdays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]

  // Get current day of the week (0 = Sunday, 1 = Monday, etc.)
  const getCurrentDay = () => {
    const dayIndex = new Date().getDay()
    // If it's weekend (0 or 6), default to Monday (0)
    if (dayIndex === 0 || dayIndex === 6) return "Monday"
    return weekdays[dayIndex - 1]
  }

  const [selectedDay, setSelectedDay] = useState(getCurrentDay())

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

  // Group and merge consecutive classes
  const processClasses = useMemo(() => {
    // First, group classes by day
    const classesByDay = weekdays.reduce(
      (acc, day) => {
        acc[day] = classes.filter((c) => c.day === day)
        return acc
      },
      {} as Record<string, ClassItem[]>,
    )

    // For each day, merge consecutive classes
    Object.keys(classesByDay).forEach((day) => {
      const dayClasses = classesByDay[day]
      
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

      classesByDay[day] = mergedClasses
    })

    return classesByDay
  }, [classes])

  // Check if a class has a clash with another class on the same day
  const hasClash = (classItem: ClassItem, classes: ClassItem[]) => {
    return classes.some(
      (c) =>
        c.id !== classItem.id &&
        ((classItem.startTime >= c.startTime && classItem.startTime < c.endTime) ||
          (classItem.endTime > c.startTime && classItem.endTime <= c.endTime) ||
          (classItem.startTime <= c.startTime && classItem.endTime >= c.endTime)),
    )
  }

  return (
    <div className="space-y-4">
      {/* Horizontal list of days */}
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
              }`}              onClick={() => setSelectedDay(day)}
            >
              {/* Using img tag for CDN icon, remove text */}
              <img src={iconUrl} alt={day} className="h-10 w-10 mb-1" />
            </button>
          )
        })}
      </div>

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
            .map((classItem) => {
              const hasClashHighlight = hasClash(classItem, processClasses[selectedDay])
              return (
                <Card key={classItem.id} className={`overflow-hidden ${hasClashHighlight ? "border-red-300" : ""}`}>
                  <CardContent className="p-0">
                    <div className={`p-3 ${hasClashHighlight ? "bg-red-50 border-l-4 border-red-500" : "bg-slate-50"}`}>
                      <div className="flex justify-between items-start">
                        <h3 className="font-medium">{classItem.course}</h3>
                        {hasClashHighlight && (
                          <Badge variant="destructive" className="ml-2 text-xs">
                            Clash
                          </Badge>
                        )}
                      </div>
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
                  </CardContent>
                </Card>
              )
            })
        )}
      </div>
    </div>
  )
}
