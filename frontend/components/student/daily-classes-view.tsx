"use client"

import { TimetableView } from "./timetable-view"

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
  return <TimetableView classes={classes} />
}
