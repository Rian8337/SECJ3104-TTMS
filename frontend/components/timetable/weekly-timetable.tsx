"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { AlertTriangle } from "lucide-react"

interface TimeSlot {
  id: string
  course: string
  day: string
  startTime: string
  endTime: string
  venue: string
  lecturer: string
}

interface WeeklyTimetableProps {
  classes: TimeSlot[]
  showClashes?: boolean
}

export function WeeklyTimetable({ classes, showClashes = false }: WeeklyTimetableProps) {
  const [selectedDay, setSelectedDay] = useState("all")

  const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]
  const timeSlots = ["08:00", "09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00"]

  // Filter classes by selected day
  const filteredClasses = selectedDay === "all" ? classes : classes.filter((c) => c.day === selectedDay)

  // Detect clashes in timetable
  const clashes = showClashes
    ? classes.filter((class1) =>
        classes.some(
          (class2) =>
            class1.id !== class2.id &&
            class1.day === class2.day &&
            ((class1.startTime >= class2.startTime && class1.startTime < class2.endTime) ||
              (class1.endTime > class2.startTime && class1.endTime <= class2.endTime) ||
              (class1.startTime <= class2.startTime && class1.endTime >= class2.endTime)),
        ),
      )
    : []

  // Check if a class has a clash
  const hasClash = (classItem: TimeSlot) => {
    return clashes.some((clash) => clash.id === classItem.id)
  }

  // Get classes for a specific day and time
  const getClassesForTimeSlot = (day: string, time: string) => {
    return filteredClasses.filter((c) => c.day === day && c.startTime <= time && c.endTime > time)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-2">
        <Select value={selectedDay} onValueChange={setSelectedDay}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select day" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Days</SelectItem>
            {days.map((day) => (
              <SelectItem key={day} value={day}>
                {day}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-4">
        {selectedDay === "all" ? (
          days.map((day) => (
            <Card key={day} className="overflow-hidden">
              <CardContent className="p-0">
                <div className="bg-primary/10 p-2 font-medium">{day}</div>
                <div className="divide-y">
                  {filteredClasses
                    .filter((c) => c.day === day)
                    .sort((a, b) => a.startTime.localeCompare(b.startTime))
                    .map((classItem) => (
                      <TooltipProvider key={classItem.id}>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className={`p-3 ${hasClash(classItem) ? "bg-red-50 border-l-4 border-red-500" : ""}`}>
                              <div className="flex justify-between">
                                <h3 className="font-medium">{classItem.course}</h3>
                                {hasClash(classItem) && <AlertTriangle className="h-4 w-4 text-red-500" />}
                              </div>
                              <div className="text-sm text-muted-foreground mt-1">
                                {classItem.startTime} - {classItem.endTime} • {classItem.venue}
                              </div>
                              <div className="text-sm text-muted-foreground">{classItem.lecturer}</div>
                            </div>
                          </TooltipTrigger>
                          {hasClash(classItem) && (
                            <TooltipContent>
                              <p>This class overlaps with another class</p>
                            </TooltipContent>
                          )}
                        </Tooltip>
                      </TooltipProvider>
                    ))}
                  {filteredClasses.filter((c) => c.day === day).length === 0 && (
                    <div className="p-3 text-sm text-muted-foreground">No classes scheduled</div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="grid grid-cols-1 gap-2">
            {timeSlots.map((time) => {
              const classesAtTime = getClassesForTimeSlot(selectedDay, time)
              if (classesAtTime.length === 0) return null

              return (
                <div key={time} className="flex items-start">
                  <div className="w-16 text-sm text-muted-foreground pt-3">{time}</div>
                  <div className="flex-1">
                    {classesAtTime.map((classItem) => (
                      <TooltipProvider key={classItem.id}>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Card className={`mb-2 ${hasClash(classItem) ? "border-red-500" : ""}`}>
                              <CardContent className="p-3">
                                <div className="flex justify-between">
                                  <h3 className="font-medium">{classItem.course}</h3>
                                  {hasClash(classItem) && <AlertTriangle className="h-4 w-4 text-red-500" />}
                                </div>
                                <div className="text-sm text-muted-foreground mt-1">
                                  {classItem.startTime} - {classItem.endTime} • {classItem.venue}
                                </div>
                                <div className="text-sm text-muted-foreground">{classItem.lecturer}</div>
                              </CardContent>
                            </Card>
                          </TooltipTrigger>
                          {hasClash(classItem) && (
                            <TooltipContent>
                              <p>This class overlaps with another class</p>
                            </TooltipContent>
                          )}
                        </Tooltip>
                      </TooltipProvider>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
