"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertTriangle, Clock, Users, AlertCircle } from "lucide-react"
import { Progress } from "@/components/ui/progress"
import { ChartContainer } from "@/components/ui/chart"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"

// Add type definitions
type DepartmentCode = 'SE' | 'DE' | 'CS' | 'AI'

interface Student {
  id: string
  name: string
  hasClash: boolean
  hasBackToBack: boolean
}

interface Department {
  name: string
  students: Student[]
}

interface DepartmentDetails {
  [key: string]: Department
}

export function AnalyticsDashboard() {
  const [showBackToBackDialog, setShowBackToBackDialog] = useState(false)
  const [showClashesDialog, setShowClashesDialog] = useState(false)
  const [showDepartmentDialog, setShowDepartmentDialog] = useState(false)
  const [selectedDepartment, setSelectedDepartment] = useState<DepartmentCode | "">("")

  // Mock data for analytics with UTM courses
  const analyticsData = {
    backToBackClasses: 5,
    totalStudents: 47,
    clashes: 3,
    activeStudents: 47,
    departmentData: [
      { name: "SE", students: 18, clashes: 1, backToBack: 2 },
      { name: "DE", students: 12, clashes: 1, backToBack: 1 },
      { name: "CS", students: 10, clashes: 0, backToBack: 1 },
      { name: "AI", students: 7, clashes: 1, backToBack: 1 },
    ],
  }

  // Mock data for students with back-to-back classes
  const backToBackStudents = [
    {
      id: "A22EC4040",
      name: "Samin Sarwat",
      program: "Software Engineering",
      classes: [
        {
          day: "Monday",
          courses: [
            { id: "secp3204", name: "Software Engineering", time: "09:00 - 11:00", venue: "N28-A" },
            { id: "secj3303", name: "Internet Programming", time: "11:00 - 13:00", venue: "N28-B" },
            { id: "secj3553", name: "Artificial Intelligence", time: "14:00 - 16:00", venue: "N28-Lab" },
          ],
        },
      ],
    },
    {
      id: "A22EC4043",
      name: "Muhammad Hafiz",
      program: "Computer Science",
      classes: [
        {
          day: "Monday",
          courses: [
            { id: "secp3204", name: "Software Engineering", time: "09:00 - 11:00", venue: "N28-A" },
            { id: "secj3303", name: "Internet Programming", time: "11:00 - 13:00", venue: "N28-B" },
          ],
        },
      ],
    },
    {
      id: "A22EC4044",
      name: "Siti Aishah",
      program: "Artificial Intelligence",
      classes: [
        {
          day: "Tuesday",
          courses: [
            { id: "seci4343", name: "Artificial Intelligence", time: "09:00 - 11:00", venue: "N28-Lab" },
            { id: "seci4483", name: "Machine Learning", time: "11:00 - 13:00", venue: "P19-Lab" },
            { id: "seci4523", name: "Deep Learning", time: "14:00 - 16:00", venue: "N28-Lab" },
          ],
        },
      ],
    },
    {
      id: "A22EC4042",
      name: "Nurul Izzah",
      program: "Data Engineering",
      classes: [
        {
          day: "Thursday",
          courses: [
            { id: "secr3204", name: "Database Administration", time: "09:00 - 11:00", venue: "P19-A" },
            { id: "secr4273", name: "Data Mining", time: "11:00 - 13:00", venue: "N28-A" },
          ],
        },
      ],
    },
    {
      id: "A22EC4045",
      name: "Tan Wei Ming",
      program: "Software Engineering",
      classes: [
        {
          day: "Friday",
          courses: [
            { id: "secj4383", name: "Data Visualization", time: "09:00 - 11:00", venue: "P19-Lab" },
            { id: "secj3553", name: "Artificial Intelligence", time: "11:00 - 13:00", venue: "N28-Lab" },
          ],
        },
      ],
    },
  ]

  // Mock data for students with clashes
  const clashStudents = [
    {
      id: "A22EC4040",
      name: "Samin Sarwat",
      program: "Software Engineering",
      clashes: [
        {
          day: "Wednesday",
          courses: [
            { id: "seci4343", name: "Artificial Intelligence", time: "09:00 - 11:00", venue: "N28-Lab" },
            { id: "secj4383", name: "Data Visualization", time: "10:00 - 12:00", venue: "P19-Lab" },
          ],
        },
      ],
    },
    {
      id: "A22EC4042",
      name: "Nurul Izzah",
      program: "Data Engineering",
      clashes: [
        {
          day: "Tuesday",
          courses: [
            { id: "secj4383", name: "Data Visualization", time: "10:00 - 12:00", venue: "P19-Lab" },
            { id: "secr3204", name: "Database Administration", time: "11:00 - 13:00", venue: "P19-A" },
          ],
        },
      ],
    },
    {
      id: "A22EC4044",
      name: "Siti Aishah",
      program: "Artificial Intelligence",
      clashes: [
        {
          day: "Thursday",
          courses: [
            { id: "seci4523", name: "Deep Learning", time: "10:00 - 12:00", venue: "N28-Lab" },
            { id: "secr4273", name: "Data Mining", time: "11:00 - 13:00", venue: "N28-A" },
          ],
        },
      ],
    },
  ]

  // Mock data for department details
  const departmentDetails: DepartmentDetails = {
    SE: {
      name: "Software Engineering",
      students: [
        { id: "A22EC4040", name: "Samin Sarwat", hasClash: true, hasBackToBack: true },
        { id: "A22EC4041", name: "Ahmad Firdaus", hasClash: false, hasBackToBack: false },
        { id: "A22EC4045", name: "Tan Wei Ming", hasClash: false, hasBackToBack: true },
        { id: "A22EC4046", name: "Amirah Zainal", hasClash: false, hasBackToBack: false },
        { id: "A22EC4047", name: "Rajesh Kumar", hasClash: false, hasBackToBack: false },
      ],
    },
    DE: {
      name: "Data Engineering",
      students: [
        { id: "A22EC4042", name: "Nurul Izzah", hasClash: true, hasBackToBack: true },
        { id: "A22EC4048", name: "Nurul Huda", hasClash: false, hasBackToBack: false },
        { id: "A22EC4049", name: "Lee Chong Wei", hasClash: false, hasBackToBack: false },
      ],
    },
    CS: {
      name: "Computer Science",
      students: [
        { id: "A22EC4043", name: "Muhammad Hafiz", hasClash: false, hasBackToBack: true },
        { id: "A22EC4050", name: "Amir Hassan", hasClash: false, hasBackToBack: false },
      ],
    },
    AI: {
      name: "Artificial Intelligence",
      students: [
        { id: "A22EC4044", name: "Siti Aishah", hasClash: true, hasBackToBack: true },
        { id: "A22EC4051", name: "Zulaikha Zulkifli", hasClash: false, hasBackToBack: false },
      ],
    },
  }

  const handleDepartmentClick = (dept: DepartmentCode) => {
    setSelectedDepartment(dept)
    setShowDepartmentDialog(true)
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <Card className="cursor-pointer hover:border-red-200" onClick={() => setShowBackToBackDialog(true)}>
          <CardHeader className="p-3">
            <CardTitle className="text-sm">Back-to-Back</CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-0">
            <div className="flex items-center">
              <Clock className="h-5 w-5 mr-2 text-amber-500" />
              <div className="text-2xl font-bold">{analyticsData.backToBackClasses}</div>
            </div>
            <p className="text-xs text-muted-foreground mt-1">Students with 5+ hours back-to-back</p>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:border-red-200" onClick={() => setShowClashesDialog(true)}>
          <CardHeader className="p-3">
            <CardTitle className="text-sm">Clashes</CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-0">
            <div className="flex items-center">
              <AlertTriangle className="h-5 w-5 mr-2 text-destructive" />
              <div className="text-2xl font-bold">{analyticsData.clashes}</div>
            </div>
            <p className="text-xs text-muted-foreground mt-1">Students with timetable clashes</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="p-3">
          <CardTitle className="text-sm">Active Students</CardTitle>
        </CardHeader>
        <CardContent className="p-3 pt-0">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center">
              <Users className="h-5 w-5 mr-2 text-primary" />
              <div className="text-2xl font-bold">{analyticsData.activeStudents}</div>
            </div>
            <div className="text-sm text-muted-foreground">
              {Math.round((analyticsData.activeStudents / analyticsData.totalStudents) * 100)}%
            </div>
          </div>
          <Progress value={(analyticsData.activeStudents / analyticsData.totalStudents) * 100} className="h-2" />
          <p className="text-xs text-muted-foreground mt-1">Students with active timetables</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="p-3">
          <CardTitle className="text-sm">Department Analysis</CardTitle>
        </CardHeader>
        <CardContent className="p-3 pt-0">
          <div className="w-full overflow-x-auto pb-2">
            <div className="min-w-[300px]">
              <ChartContainer
                config={{
                  students: {
                    label: "Students",
                    color: "hsl(var(--chart-1))",
                  },
                  clashes: {
                    label: "Clashes",
                    color: "hsl(var(--chart-2))",
                  },
                  backToBack: {
                    label: "Back-to-Back",
                    color: "hsl(var(--chart-3))",
                  },
                }}
                className="h-[200px]"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={analyticsData.departmentData}
                    margin={{ top: 5, right: 10, left: 0, bottom: 5 }}
                    onClick={(data) => {
                      if (data && data.activePayload && data.activePayload[0]) {
                        handleDepartmentClick(data.activePayload[0].payload.name as DepartmentCode)
                      }
                    }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} width={30} />
                    <Tooltip contentStyle={{ fontSize: "12px" }} />
                    <Bar dataKey="students" fill="var(--color-students)" maxBarSize={30} />
                    <Bar dataKey="clashes" fill="var(--color-clashes)" maxBarSize={30} />
                    <Bar dataKey="backToBack" fill="var(--color-backToBack)" maxBarSize={30} />
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            </div>
          </div>
        </CardContent>
      </Card>

      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Attention Required</AlertTitle>
        <AlertDescription>
          {analyticsData.clashes} students have timetable clashes that need to be resolved before the semester begins.
        </AlertDescription>
      </Alert>

      {/* Back-to-Back Classes Dialog */}
      <Dialog open={showBackToBackDialog} onOpenChange={setShowBackToBackDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Students with Back-to-Back Classes</DialogTitle>
            <DialogDescription>These students have 5+ hours of consecutive classes</DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[60vh]">
            <div className="space-y-4">
              {backToBackStudents.map((student) => (
                <Card key={student.id}>
                  <CardHeader className="p-3">
                    <CardTitle className="text-sm flex justify-between items-center">
                      <span>{student.name}</span>
                      <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100">
                        {student.classes[0].courses.length} hrs
                      </Badge>
                    </CardTitle>
                    <div className="text-xs text-muted-foreground">
                      {student.id} • {student.program}
                    </div>
                  </CardHeader>
                  <CardContent className="p-3 pt-0">
                    <div className="text-xs font-medium mb-1">{student.classes[0].day}</div>
                    <div className="space-y-1">
                      {student.classes[0].courses.map((course, index) => (
                        <div key={course.id} className="text-xs p-1 rounded bg-muted flex justify-between">
                          <div>{course.name}</div>
                          <div className="text-muted-foreground">{course.time}</div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* Clashes Dialog */}
      <Dialog open={showClashesDialog} onOpenChange={setShowClashesDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Students with Timetable Clashes</DialogTitle>
            <DialogDescription>These students have overlapping classes that need to be resolved</DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[60vh]">
            <div className="space-y-4">
              {clashStudents.map((student) => (
                <Card key={student.id}>
                  <CardHeader className="p-3">
                    <CardTitle className="text-sm">{student.name}</CardTitle>
                    <div className="text-xs text-muted-foreground">
                      {student.id} • {student.program}
                    </div>
                  </CardHeader>
                  <CardContent className="p-3 pt-0">
                    <div className="text-xs font-medium mb-1">{student.clashes[0].day}</div>
                    <div className="space-y-1">
                      {student.clashes[0].courses.map((course) => (
                        <div
                          key={course.id}
                          className="text-xs p-1 rounded bg-red-50 border border-red-200 flex justify-between"
                        >
                          <div>{course.name}</div>
                          <div className="text-muted-foreground">{course.time}</div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* Department Dialog */}
      <Dialog open={showDepartmentDialog} onOpenChange={setShowDepartmentDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{selectedDepartment && departmentDetails[selectedDepartment]?.name} Students</DialogTitle>
            <DialogDescription>Student list for {selectedDepartment} program</DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[60vh]">
            <div className="space-y-2">
              {selectedDepartment &&
                departmentDetails[selectedDepartment]?.students.map((student) => (
                  <div key={student.id} className="flex justify-between items-center p-2 rounded hover:bg-muted">
                    <div>
                      <div className="text-sm font-medium">{student.name}</div>
                      <div className="text-xs text-muted-foreground">{student.id}</div>
                    </div>
                    <div className="flex gap-1">
                      {student.hasClash && (
                        <Badge variant="outline" className="text-xs bg-red-50 text-red-700 border-red-200">
                          Clash
                        </Badge>
                      )}
                      {student.hasBackToBack && (
                        <Badge variant="outline" className="text-xs bg-amber-50 text-amber-700 border-amber-200">
                          Back-to-Back
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  )
}
