export interface ClassItem {
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
      workerNo: string | number
    }
  }
} 