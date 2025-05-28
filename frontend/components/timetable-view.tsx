"use client"

import { useState, useMemo } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import React from "react"
import { ClassItem } from "@/types/timetable"
import { processClasses, hasClash, renderGapAndLunch, GapInfo } from "@/lib/timetable-utils"
import { useRouter } from "next/navigation"
import { API_BASE_URL } from "@/lib/config"
import { redirect } from "next/dist/server/api-utils"

interface TimetableViewProps {
  classes: ClassItem[]
  selectedDay?: string
  onDaySelect?: (day: string) => void
  showDaySelector?: boolean
  userType: "student" | "lecturer"
  onLecturerClick?: (workerNo: string) => void
}

// Constants
const WEEKDAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"] as const
type Weekday = typeof WEEKDAYS[number]

export function TimetableView({ 
  classes, 
  selectedDay: propSelectedDay,
  onDaySelect,
  showDaySelector = true,
  userType,
  onLecturerClick
}: TimetableViewProps) {
  const router = useRouter()

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

  const handleDaySelect = (day: Weekday) => {
    setSelectedDay(day)
    onDaySelect?.(day)
  }

  // Process classes using shared utility
  const processedClasses = useMemo(() => processClasses(classes), [classes])

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

  // Render gap info
  const renderGapInfo = (gapInfo: GapInfo) => {
    return (
      <div className="flex flex-col items-center justify-center gap-2">
        {gapInfo.type === 'lunch' && (
          <div className="flex items-center w-full">
            <div className="flex-grow border-t border-gray-200"></div>
            <div className="mx-4 text-sm text-green-500 font-medium">1 hr lunch break</div>
            <div className="flex-grow border-t border-gray-200"></div>
          </div>
        )}
        {gapInfo.type === 'mixed' && (
          <>
            {gapInfo.gapBeforeLunch && (
              <div className="inline-block bg-green-100 text-green-600 px-3 py-1 rounded text-xs font-medium border border-gray-200">
                {`${gapInfo.gapBeforeLunch} hr ${userType === 'student' ? 'gap' : 'free'}`}
              </div>
            )}
            <div className="flex items-center w-full">
              <div className="flex-grow border-t border-gray-200"></div>
              <div className="mx-4 text-sm text-green-500 font-medium">1 hr lunch break</div>
              <div className="flex-grow border-t border-gray-200"></div>
            </div>
            {gapInfo.gapAfterLunch && (
              <div className="inline-block bg-green-100 text-green-600 px-3 py-1 rounded text-xs font-medium border border-gray-200">
                {`${gapInfo.gapAfterLunch} hr ${userType === 'student' ? 'gap' : 'free'}`}
              </div>
            )}
          </>
        )}
        {gapInfo.type === 'after_lunch' && (
          <>
            <div className="flex items-center w-full">
              <div className="flex-grow border-t border-gray-200"></div>
              <div className="mx-4 text-sm text-green-500 font-medium">1 hr lunch break</div>
              <div className="flex-grow border-t border-gray-200"></div>
            </div>
            {gapInfo.gapAfterLunch && (
              <div className="inline-block bg-green-100 text-green-600 px-3 py-1 rounded text-xs font-medium border border-gray-200">
                {`${gapInfo.gapAfterLunch} hr ${userType === 'student' ? 'gap' : 'free'}`}
              </div>
            )}
          </>
        )}
        {gapInfo.type === 'gap' && gapInfo.duration && (
          <div className="inline-block bg-yellow-100 text-yellow-600 px-3 py-1 rounded text-xs font-medium border border-gray-200">
            {`${gapInfo.duration} hr ${userType === 'student' ? 'gap' : 'free'}`}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {renderDaySelector()}

      <div className="space-y-3">
        {processedClasses[selectedDay]?.length === 0 ? (
          <Card>
            <CardContent className="p-4 text-center text-muted-foreground">
              No classes scheduled for {selectedDay}
            </CardContent>
          </Card>
        ) : (
          processedClasses[selectedDay]
            ?.sort((a, b) => a.startTime.localeCompare(b.startTime))
            .map((classItem, index, array) => {
              const hasClashHighlight = hasClash(classItem, processedClasses[selectedDay])
              
              return (
                <React.Fragment key={classItem.id}>
                  {index > 0 && (() => {
                    const gapInfo = renderGapAndLunch(array[index - 1].endTime, classItem.startTime, userType)
                    if (!gapInfo) return null
                    return renderGapInfo(gapInfo)
                  })()}

                  <Card className={`overflow-hidden ${hasClashHighlight ? "border-red-300" : ""}`}>
                    <CardContent className="p-0">
                      <div className={`flex ${hasClashHighlight ? "bg-red-50" : "bg-white"}`}>
                        {/* Time Section */}
                        <div className="flex flex-col items-center justify-between p-4 border-r border-gray-200 min-w-[80px]">
                          <div className="font-bold text-xs text-gray-700">{formatTime(classItem.startTime)}</div>
                          <div className="relative flex-grow flex items-center justify-center w-full my-2">
                            <div className="absolute w-0.5 h-full bg-gray-200 left-1/2 transform -translate-x-1/2"></div>
                            <div className="bg-blue-100 text-blue-600 px-2 py-1 rounded text-xs font-medium border border-gray-200 z-10 scale-75">
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
                          {userType === 'student' ? (
                            <>
                              <hr className="border-gray-200 my-3" />
                              <div className="text-xs text-gray-500 mb-1">Lecturer</div>
                              <button
                                onClick={() => {
                                  const lecturer = classItem.courseSection?.lecturer
                                  if (lecturer?.workerNo) {
                                    onLecturerClick?.(String(lecturer.workerNo))
                                  }
                                }}
                                className="text-xs font-bold text-blue-600 hover:text-blue-800 hover:underline"
                              >
                                {classItem.courseSection?.lecturer?.name || 'TBA'}
                              </button>
                            </>
                          ) : null}
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