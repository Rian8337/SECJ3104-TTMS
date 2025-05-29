"use client"

import { TimetableView } from "@/components/timetable-view"
import { ClassItem } from "@/types/timetable"

interface DailyClassesViewProps {
  classes: ClassItem[]
}

export function DailyClassesView({ classes }: DailyClassesViewProps) {
  return <TimetableView classes={classes} userType="lecturer" />
} 