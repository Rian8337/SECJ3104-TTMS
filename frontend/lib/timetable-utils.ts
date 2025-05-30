import { ClassItem } from "@/types/timetable"

// Constants
export const WEEKDAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"] as const
export type Weekday = typeof WEEKDAYS[number]

// Day mapping
export const dayMap: { [key: number]: string } = {
  1: 'Sunday',
  2: 'Monday',
  3: 'Tuesday',
  4: 'Wednesday',
  5: 'Thursday',
  6: 'Friday',
  7: 'Saturday'
}

// Time slot mapping
export const timeMap: { [key: number]: string } = {
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

export interface TimetableEntry {
  id: string
  course: string
  day: string
  startTime: string
  endTime: string
  venue: string
  lecturer: string
  courseCode: string
  section: string
  courseSection: {
    lecturer?: {
      name: string
      workerNo: string
    }
  }
}

// Get current day of the week (0 = Sunday, 1 = Monday, etc.)
export const getCurrentDay = (): Weekday => {
  const dayIndex = new Date().getDay()
  // If it's weekend (0 or 6), default to Monday (0)
  if (dayIndex === 0 || dayIndex === 6) return "Monday"
  return WEEKDAYS[dayIndex - 1]
}

// Format time with AM/PM
export const formatTime = (time: string): string => {
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

// Calculate duration between two times
export const calculateDuration = (startTime: string, endTime: string): number => {
  const start = new Date(`2000-01-01T${startTime}`)
  const end = new Date(`2000-01-01T${endTime}`)
  const diffMinutes = (end.getTime() - start.getTime()) / (1000 * 60)
  return Math.round(diffMinutes / 60)
}

export function formatTimetableData(data: any[]): TimetableEntry[] {
  // console.log('Raw data received:', JSON.stringify(data, null, 2))
  
  return data.map((entry: any) => {
    const timeRange = timeMap[entry.time]
    if (!timeRange) {
      console.error('Invalid time value:', entry.time)
      return null
    }

    const [startTime, endTime] = timeRange.split(' - ')

    // Ensure we have the lecturer data
    const lecturer = entry.courseSection?.lecturer
    // console.log('Raw lecturer data:', {
    //   raw: entry.courseSection?.lecturer,
    //   name: lecturer?.name,
    //   workerNo: lecturer?.workerNo,
    //   workerNoType: typeof lecturer?.workerNo
    // })

    if (!lecturer) {
      console.log('No lecturer data found for entry:', entry)
    }

    // Create the formatted entry
    const formattedEntry: TimetableEntry = {
      id: `${entry.courseSection.course.code}-${entry.courseSection.section}`,
      course: `${entry.courseSection.course.code} - ${entry.courseSection.course.name}`,
      day: dayMap[entry.day] || 'Unknown',
      startTime,
      endTime,
      venue: entry.venue?.shortName || 'TBA',
      lecturer: lecturer?.name || 'TBA',
      courseCode: entry.courseSection.course.code,
      section: entry.courseSection.section,
      courseSection: {
        lecturer: lecturer ? {
          name: lecturer.name,
          workerNo: lecturer.workerNo // Keep the original type (string or number)
        } : undefined
      }
    }

    // Log the formatted entry for debugging
    // console.log('Formatted entry lecturer data:', {
    //   name: formattedEntry.courseSection.lecturer?.name,
    //   workerNo: formattedEntry.courseSection.lecturer?.workerNo,
    //   workerNoType: typeof formattedEntry.courseSection.lecturer?.workerNo
    // })

    return formattedEntry
  }).filter(Boolean) as TimetableEntry[]
}

export interface GapInfo {
  type: 'lunch' | 'gap' | 'mixed' | 'after_lunch'
  duration?: number
  gapBeforeLunch?: number
  gapAfterLunch?: number
}

// Helper function to check if two times are consecutive
export const areTimesConsecutive = (endTime: string, startTime: string): boolean => {
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
export const processClasses = (classes: ClassItem[]) => {
  const WEEKDAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"] as const
  type Weekday = typeof WEEKDAYS[number]

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
          id: `${key}-${group[0].startTime}-${group[0].endTime}`,
          courseSection: {
            ...group[0].courseSection,
            lecturer: group[0].courseSection?.lecturer ? {
              name: group[0].courseSection.lecturer.name,
              workerNo: group[0].courseSection.lecturer.workerNo
            } : undefined
          }
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
          prevClass.courseSection?.lecturer?.name === currentClass.courseSection?.lecturer?.name &&
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
            id: `${key}-${sequence[0].startTime}-${sequence[0].endTime}`,
            courseSection: {
              ...sequence[0].courseSection,
              lecturer: sequence[0].courseSection?.lecturer ? {
                name: sequence[0].courseSection.lecturer.name,
                workerNo: sequence[0].courseSection.lecturer.workerNo
              } : undefined
            }
          }
        }

        return {
          ...sequence[0],
          endTime: sequence[sequence.length - 1].endTime,
          id: `${key}-${sequence[0].startTime}-${sequence[sequence.length - 1].endTime}`,
          courseSection: {
            ...sequence[0].courseSection,
            lecturer: sequence[0].courseSection?.lecturer ? {
              name: sequence[0].courseSection.lecturer.name,
              workerNo: sequence[0].courseSection.lecturer.workerNo
            } : undefined
          }
        }
      })
    }).flat()

    classesByDay[day as Weekday] = mergedClasses
  })

  return classesByDay
}

// Check if a class has a clash with another class on the same day
export const hasClash = (classItem: ClassItem, classes: ClassItem[]): boolean => {
  return classes.some(
    (c) =>
      c.id !== classItem.id &&
      ((classItem.startTime >= c.startTime && classItem.startTime < c.endTime) ||
        (classItem.endTime > c.startTime && classItem.endTime <= c.endTime) ||
        (classItem.startTime <= c.startTime && classItem.endTime >= c.endTime)),
  )
}

// Render gap and lunch break
export const renderGapAndLunch = (prevEnd: string, currStart: string, userType: 'student' | 'lecturer'): GapInfo | null => {
  const prevEndDate = new Date(`2000-01-01T${prevEnd}`)
  const currStartDate = new Date(`2000-01-01T${currStart}`)
  
  // If the gap is exactly 1 hour and crosses lunch time (1-2), it's just lunch break
  if (prevEnd === "13:00" && currStart === "14:00") {
    return {
      type: 'lunch'
    }
  }
  
  // If there's a gap before lunch
  if (prevEndDate.getHours() < 13 && currStartDate.getHours() >= 14) {
    const gapBeforeLunch = Math.round((new Date(`2000-01-01T13:00`).getTime() - prevEndDate.getTime()) / (1000 * 60 * 60))
    const gapAfterLunch = Math.round((currStartDate.getTime() - new Date(`2000-01-01T14:00`).getTime()) / (1000 * 60 * 60))
    
    return {
      type: 'mixed',
      gapBeforeLunch: gapBeforeLunch > 0 ? gapBeforeLunch : undefined,
      gapAfterLunch: gapAfterLunch > 0 ? gapAfterLunch : undefined
    }
  }
  
  // If there's a gap after lunch
  if (prevEndDate.getHours() === 13 && currStartDate.getHours() > 14) {
    const gapAfterLunch = Math.round((currStartDate.getTime() - new Date(`2000-01-01T14:00`).getTime()) / (1000 * 60 * 60))
    
    return {
      type: 'after_lunch',
      gapAfterLunch: gapAfterLunch > 0 ? gapAfterLunch : undefined
    }
  }
  
  // Regular gap
  const diffMinutes = (currStartDate.getTime() - prevEndDate.getTime()) / (1000 * 60)
  const hours = Math.round(diffMinutes / 60)
  
  return hours > 0 ? {
    type: 'gap',
    duration: hours
  } : null
} 