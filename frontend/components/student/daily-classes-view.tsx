"use client"

import { TimetableView } from "../timetable-view"
import { ClassItem } from "@/types/timetable"

interface DailyClassesViewProps {
  classes: ClassItem[]
  onLecturerClick?: (workerNo: string, name: string) => void
}

export function DailyClassesView({ classes, onLecturerClick }: DailyClassesViewProps) {
  return <TimetableView 
    classes={classes} 
    userType="student" 
    onLecturerClick={onLecturerClick}
  />
}
