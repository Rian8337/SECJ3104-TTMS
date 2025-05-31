"use client"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer } from "@/components/ui/chart"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { API_BASE_URL } from "@/lib/config"
import { dayMap, formatTime, timeMap } from "@/lib/timetable-utils"
import { AlertCircle, AlertTriangle, BarChart2, Building2, Clock, PieChart, Users } from "lucide-react"
import { Fragment, useEffect, useState } from "react"
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart as RechartsPieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"

// Add type definitions
type DepartmentCode = 'SE' | 'DE' | 'CS' | 'AI'

interface Student {
  id: string
  name: string
  hasClash: boolean
  hasBackToBack: boolean
}

interface VenueClash {
  courseSections: {
    section: string
    course: {
      code: string
      name: string
    }
    lecturer: {
      name: string
      workerNo: string | number
    }
  }[]
  day: number
  time: number
  venue: {
    shortName: string
  }
}

interface AnalyticsData {
  activeStudents: number
  backToBackStudents: {
    matricNo: string
    name: string
    courseCode: string
    schedules: {
      day: number
      time: number
      section: string
      course: {
        code: string
        name: string
      }
      venue: { shortName: string } | null
    }[][]
  }[]
  clashingStudents: {
    matricNo: string
    name: string
    courseCode: string
    clashes: {
      day: number
      time: number
      courses: {
        course: {
          code: string
          name: string
        }
        section: string
        venue: { shortName: string } | null
      }[]
    }[]
  }[]
  departments: {
    code: string
    totalStudents: number
    totalClashes: number
    totalBackToBack: number
  }[]
  venueClashes: VenueClash[]
}

type VisualizationType = 'stacked-bar' | 'pie'

interface PieChartData {
  name: string
  value: number
  clashes: number
  backToBack: number
  departments?: string[]
}

const contentsPerPage = 10

function Paging(props: {
  data: unknown[]
  page: number
  setPage: React.Dispatch<React.SetStateAction<number>>
}) {
  const { data, page, setPage } = props

  return (
    <div className="flex items-center justify-between mt-4">
      <div className="text-sm text-muted-foreground">
        Showing {Math.min((page - 1) * contentsPerPage + 1, data.length)} to {Math.min(page * contentsPerPage, data.length)} of {data.length} entries
      </div>
      <div className="flex gap-2">
        <button
          onClick={() => setPage(prev => Math.max(1, prev - 1))}
          disabled={page === 1}
          className="px-3 py-1 text-sm rounded-md border disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Previous
        </button>
        <button
          onClick={() => setPage(prev => Math.min(Math.ceil(data.length / contentsPerPage), prev + 1))}
          disabled={page >= Math.ceil(data.length / contentsPerPage)}
          className="px-3 py-1 text-sm rounded-md border disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Next
        </button>
      </div>
    </div>
  )
}

export function AnalyticsDashboard() {
  const [showBackToBackDialog, setShowBackToBackDialog] = useState(false)
  const [showClashesDialog, setShowClashesDialog] = useState(false)
  const [showVenueClashesDialog, setShowVenueClashesDialog] = useState(false)
  const [showDepartmentDialog, setShowDepartmentDialog] = useState(false)
  const [selectedDepartment, setSelectedDepartment] = useState<DepartmentCode | "">("")
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [visualizationType, setVisualizationType] = useState<VisualizationType>('pie')
  const [showPieDetails, setShowPieDetails] = useState(false)
  const [selectedPieData, setSelectedPieData] = useState<PieChartData | null>(null)
  const [backToBackPage, setBackToBackPage] = useState(1)

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setLoading(true)
        const response = await fetch(`${API_BASE_URL}/analytics/generate?session=2024/2025&semester=2`, {
          credentials: 'include'
        })

        if (!response.ok) {
          throw new Error('Failed to fetch analytics data')
        }

        const data = await response.json()
        console.log('Analytics data:', data) // Debug log
        setAnalyticsData(data)
      } catch (err) {
        console.error('Error fetching analytics:', err)
        setError(err instanceof Error ? err.message : 'Failed to fetch analytics data')
      } finally {
        setLoading(false)
      }
    }

    fetchAnalytics()
  }, [])

  const handleDepartmentClick = (dept: DepartmentCode) => {
    setSelectedDepartment(dept)
    setShowDepartmentDialog(true)
  }

  // Helper function to format time slot
  const formatTimeSlot = (time: number) => {
    const timeRange = timeMap[time]
    if (!timeRange) return 'Unknown'
    const [startTime, endTime] = timeRange.split(' - ')
    return `${formatTime(startTime)} - ${formatTime(endTime)}`
  }

  // Helper function to format day
  const formatDay = (day: number) => dayMap[day] || 'Unknown'

  // Helper function to prepare pie chart data
  const preparePieChartData = (departments: AnalyticsData['departments']): PieChartData[] => {
    // Sort departments by total students
    const sortedDepts = [...departments].sort((a, b) => b.totalStudents - a.totalStudents)
    
    // Take top 4 departments
    const topDepts = sortedDepts.slice(0, 4)
    
    // Group remaining departments
    const otherDepts = sortedDepts.slice(4)
    const otherData: PieChartData = {
      name: "Others",
      value: otherDepts.reduce((sum, dept) => sum + dept.totalStudents, 0),
      clashes: otherDepts.reduce((sum, dept) => sum + dept.totalClashes, 0),
      backToBack: otherDepts.reduce((sum, dept) => sum + dept.totalBackToBack, 0),
      departments: otherDepts.map(dept => dept.code)
    }

    return [
      ...topDepts.map(dept => ({
        name: dept.code,
        value: dept.totalStudents,
        clashes: dept.totalClashes,
        backToBack: dept.totalBackToBack
      })),
      otherData
    ]
  }

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="text-lg font-medium">Loading analytics...</div>
        <div className="text-muted-foreground">Please wait while we fetch the data</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <div className="text-lg font-medium text-red-600">Error</div>
        <div className="text-muted-foreground">{error}</div>
      </div>
    )
  }

  if (!analyticsData) {
    return (
      <div className="text-center py-8">
        <div className="text-lg font-medium">No Data Available</div>
        <div className="text-muted-foreground">Analytics data is not available for this session</div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <Card className="cursor-pointer hover:border-red-200" onClick={() => {
          setBackToBackPage(1)
          setShowBackToBackDialog(true)
        }}>
          <CardHeader className="p-3">
            <CardTitle className="text-sm">Back-to-Back</CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-0">
            <div className="flex items-center">
              <Clock className="h-5 w-5 mr-2 text-amber-500" />
              <div className="text-2xl font-bold">{analyticsData.backToBackStudents.length}</div>
            </div>
            <p className="text-xs text-muted-foreground mt-1">Students with at least 5 hours of consecutive classes</p>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:border-red-200" onClick={() => {
          setBackToBackPage(1)
          setShowClashesDialog(true)
        }}>
          <CardHeader className="p-3">
            <CardTitle className="text-sm">Timetable Clashes</CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-0">
            <div className="flex items-center">
              <AlertTriangle className="h-5 w-5 mr-2 text-destructive" />
              <div className="text-2xl font-bold">{analyticsData.clashingStudents.length}</div>
            </div>
            <p className="text-xs text-muted-foreground mt-1">Students with timetable clashes</p>
          </CardContent>
        </Card>

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
            {/* <div className="text-sm text-muted-foreground">
                {Math.round((analyticsData.activeStudents / totalStudents) * 100)}%
              </div> */}
            </div>
            {/* <Progress value={(analyticsData.activeStudents / totalStudents) * 100} className="h-2" /> */}
          <p className="text-xs text-muted-foreground mt-1">Students with active timetables in this semester</p>
        </CardContent>
      </Card>

        <Card className="cursor-pointer hover:border-red-200" onClick={() => {
          setBackToBackPage(1)
          setShowVenueClashesDialog(true)
        }}>
          <CardHeader className="p-3">
            <CardTitle className="text-sm">Venue Clashes</CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-0">
            <div className="flex items-center">
              <Building2 className="h-5 w-5 mr-2 text-blue-500" />
              <div className="text-2xl font-bold">{analyticsData?.venueClashes.length || 0}</div>
            </div>
            <p className="text-xs text-muted-foreground mt-1">Venues with overlapping classes</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="p-3">
          <div className="flex justify-between items-center">
            <CardTitle className="text-sm">Department Analysis</CardTitle>
            <Select
              value={visualizationType}
              onValueChange={(value) => setVisualizationType(value as VisualizationType)}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select visualization" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pie">
                  <div className="flex items-center">
                    <PieChart className="w-4 h-4 mr-8" />
                    Pie Chart
                  </div>
                </SelectItem>
                <SelectItem value="stacked-bar">
                  <div className="flex items-center">
                    <BarChart2 className="w-4 h-4 mr-2" />
                    Stacked Bar
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="p-3 pt-0">
          <div className="w-full overflow-x-auto">
            <div className="min-w-[800px]">
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
                className="h-[400px]"
              >
                <ResponsiveContainer width="100%" height="100%">
                  {visualizationType === 'pie' && (
                    <RechartsPieChart>
                      <Pie
                        data={preparePieChartData(analyticsData.departments)}
                        cx="25%"
                        cy="50%"
                        outerRadius={90}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, value }) => `${name}: ${value}`}
                        onClick={(data) => {
                          setSelectedPieData(data)
                          setShowPieDetails(true)
                        }}
                      >
                        {preparePieChartData(analyticsData.departments).map((entry, index) => (
                          <Cell 
                            key={`cell-${index}`} 
                            fill={`hsl(var(--chart-${(index % 3) + 1}))`} 
                          />
                        ))}
                      </Pie>
                      <Tooltip 
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            const data = payload[0].payload
                            return (
                              <div className="bg-white p-2 border rounded shadow">
                                <p className="font-medium">{data.name}</p>
                                <p className="text-sm">Students: {data.value}</p>
                                <p className="text-sm">Clashes: {data.clashes}</p>
                                <p className="text-sm">Back-to-Back: {data.backToBack}</p>
                              </div>
                            )
                          }
                          return null
                        }}
                      />
                    </RechartsPieChart>
                  )}

                  {visualizationType === 'stacked-bar' && (
                    <BarChart
                      data={analyticsData.departments.map(dept => ({
                        name: dept.code,
                        students: dept.totalStudents,
                        clashes: dept.totalClashes,
                        backToBack: dept.totalBackToBack
                      }))}
                      margin={{ top: 20, right: 30, left: 0, bottom: 20 }}
                    onClick={(data) => {
                      if (data && data.activePayload && data.activePayload[0]) {
                        handleDepartmentClick(data.activePayload[0].payload.name as DepartmentCode)
                      }
                    }}
                      barGap={0}
                      barCategoryGap={40}
                    >
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis 
                        dataKey="name" 
                        tick={{ fontSize: 12 }}
                        tickLine={false}
                        axisLine={false}
                        padding={{ left: 20, right: 20 }}
                      />
                      <YAxis 
                        tick={{ fontSize: 12 }} 
                        width={40}
                        tickLine={false}
                        axisLine={false}
                      />
                      <Tooltip 
                        contentStyle={{ 
                          fontSize: "12px",
                          backgroundColor: "white",
                          border: "1px solid #e2e8f0",
                          borderRadius: "6px",
                          boxShadow: "0 2px 4px rgba(0,0,0,0.1)"
                        }}
                        cursor={{ fill: 'rgba(0,0,0,0.05)' }}
                      />
                      <Bar 
                        dataKey="students" 
                        fill="var(--color-students)" 
                        maxBarSize={80}
                        radius={[4, 4, 0, 0]}
                        stackId="a"
                      />
                      <Bar 
                        dataKey="clashes" 
                        fill="var(--color-clashes)" 
                        maxBarSize={80}
                        radius={[4, 4, 0, 0]}
                        stackId="a"
                      />
                      <Bar 
                        dataKey="backToBack" 
                        fill="var(--color-backToBack)" 
                        maxBarSize={80}
                        radius={[4, 4, 0, 0]}
                        stackId="a"
                      />
                    </BarChart>
                  )}
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
          {analyticsData.clashingStudents.length} students have timetable clashes that need to be resolved before the semester begins.
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
              {analyticsData.backToBackStudents
                .slice((backToBackPage - 1) * contentsPerPage, backToBackPage * contentsPerPage)
                .map((student) => (
                <Card key={student.matricNo}>
                  <CardHeader className="p-3">
                    <CardTitle className="text-sm">
                      <span>{student.name}</span>
                    </CardTitle>
                    <div className="text-xs text-muted-foreground">
                      {student.matricNo} • {student.courseCode}
                    </div>
                  </CardHeader>
                  {student.schedules.map((schedule, index) => (
                    <Fragment key={`${student.matricNo}-schedule${index}`}>
                      <CardHeader className="p-3">
                        <CardTitle className="text-xs flex justify-between items-center">
                          <span>{formatDay(schedule[0].day)}</span>
                          <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100">
                            {schedule.length} hrs
                          </Badge>
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="p-3 pt-0">
                        <div className="space-y-1">
                          {schedule.map((s, index) => (
                            <div key={`${student.matricNo}-${s.course.code}-${s.section}-${s.day}-${s.time}`} className="text-xs p-1 rounded bg-muted flex justify-between">
                              <div className="w-[70%] break-words">{s.course.name}</div>
                              <div className="text-muted-foreground w-[30%] text-right shrink-0">
                                {formatTimeSlot(s.time)}
                                {/* {s.venue && ` • ${s.venue.shortName}`} */}
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Fragment>
                  ))}
                </Card>
              ))}
            </div>
          </ScrollArea>
          <Paging data={analyticsData.backToBackStudents} page={backToBackPage} setPage={setBackToBackPage} />
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
              {analyticsData.clashingStudents
                .slice((backToBackPage - 1) * contentsPerPage, backToBackPage * contentsPerPage)
                .map((student) => (
                <Card key={student.matricNo}>
                  <CardHeader className="p-3">
                    <CardTitle className="text-sm">{student.name}</CardTitle>
                    <div className="text-xs text-muted-foreground">
                      {student.matricNo} • {student.courseCode}
                    </div>
                  </CardHeader>
                  <CardContent className="p-3 pt-0">
                    <div className="text-xs font-medium mb-1">{formatDay(student.clashes[0].day)}</div>
                    <div className="space-y-1">
                      {student.clashes[0].courses.map((course, index) => (
                        <div
                          key={index}
                          className="text-xs p-1 rounded bg-red-50 border border-red-200 flex justify-between"
                        >
                          <div>{course.course.name} ({course.section})</div>
                          <div className="text-muted-foreground">
                            {formatTimeSlot(student.clashes[0].time)}
                            {course.venue && ` • ${course.venue.shortName}`}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </ScrollArea>
          <Paging data={analyticsData.clashingStudents} page={backToBackPage} setPage={setBackToBackPage} />
        </DialogContent>
      </Dialog>

      {/* Venue Clashes Dialog */}
      <Dialog open={showVenueClashesDialog} onOpenChange={setShowVenueClashesDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Venue Clashes</DialogTitle>
            <DialogDescription>Venues with overlapping classes that need to be resolved</DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[60vh]">
            <div className="space-y-4">
              {analyticsData.venueClashes
                .slice((backToBackPage - 1) * contentsPerPage, backToBackPage * contentsPerPage)
                .map((clash, index) => (
                <Card key={index}>
                  <CardHeader className="p-3">
                    <CardTitle className="text-sm flex justify-between items-center">
                      <span>{clash.venue.shortName}</span>
                      <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">
                        {clash.courseSections.length} classes
                      </Badge>
                    </CardTitle>
                    <div className="text-xs text-muted-foreground">
                      {formatDay(clash.day)} • {formatTimeSlot(clash.time)}
                    </div>
                  </CardHeader>
                  <CardContent className="p-3 pt-0">
                    <div className="space-y-1">
                      {clash.courseSections.map((section, idx) => (
                        <div
                          key={idx}
                          className="text-xs p-1 rounded bg-blue-50 border border-blue-200"
                        >
                          <div className="font-medium">{section.course.name}</div>
                          <div className="text-muted-foreground">
                            Section {section.section} • {section.lecturer.name}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </ScrollArea>
          <Paging data={analyticsData.venueClashes} page={backToBackPage} setPage={setBackToBackPage} />
        </DialogContent>
      </Dialog>

      {/* Department Dialog */}
      <Dialog open={showDepartmentDialog} onOpenChange={setShowDepartmentDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{selectedDepartment} Department Statistics</DialogTitle>
            <DialogDescription>Analytics for {selectedDepartment} program</DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[60vh]">
            <div className="space-y-4">
              {selectedDepartment &&
                (() => {
                  const dept = analyticsData.departments.find(d => d.code === selectedDepartment)
                  if (!dept) return null
                  
                  return (
                    <div className="space-y-4">
                      <Card>
                        <CardHeader className="p-3">
                          <CardTitle className="text-sm">Total Students</CardTitle>
                        </CardHeader>
                        <CardContent className="p-3 pt-0">
                          <div className="text-2xl font-bold">{dept.totalStudents}</div>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader className="p-3">
                          <CardTitle className="text-sm">Students with Clashes</CardTitle>
                        </CardHeader>
                        <CardContent className="p-3 pt-0">
                          <div className="text-2xl font-bold">{dept.totalClashes}</div>
                          <p className="text-xs text-muted-foreground mt-1">
                            {Math.round((dept.totalClashes / dept.totalStudents) * 100)}% of students
                          </p>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader className="p-3">
                          <CardTitle className="text-sm">Students with Back-to-Back Classes</CardTitle>
                        </CardHeader>
                        <CardContent className="p-3 pt-0">
                          <div className="text-2xl font-bold">{dept.totalBackToBack}</div>
                          <p className="text-xs text-muted-foreground mt-1">
                            {Math.round((dept.totalBackToBack / dept.totalStudents) * 100)}% of students
                          </p>
                        </CardContent>
                      </Card>
                    </div>
                  )
                })()}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* Pie Chart Details Dialog */}
      <Dialog open={showPieDetails} onOpenChange={setShowPieDetails}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {selectedPieData?.name === "Others" 
                ? "Other Departments Summary" 
                : `${selectedPieData?.name} Department Details`}
            </DialogTitle>
            <DialogDescription>
              {selectedPieData?.name === "Others" 
                ? "Combined statistics for smaller departments" 
                : "Detailed department statistics"}
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[60vh]">
            <div className="space-y-4">
              {selectedPieData?.name === "Others" ? (
                <>
                  <Card>
                    <CardHeader className="p-3">
                      <CardTitle className="text-sm">Included Departments</CardTitle>
                    </CardHeader>
                    <CardContent className="p-3 pt-0">
                      <div className="flex flex-wrap gap-2">
                        {selectedPieData.departments?.map((dept) => (
                          <Badge key={dept} variant="outline">{dept}</Badge>
                        ))}
                  </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="p-3">
                      <CardTitle className="text-sm">Total Students</CardTitle>
                    </CardHeader>
                    <CardContent className="p-3 pt-0">
                      <div className="text-2xl font-bold">{selectedPieData.value}</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="p-3">
                      <CardTitle className="text-sm">Total Clashes</CardTitle>
                    </CardHeader>
                    <CardContent className="p-3 pt-0">
                      <div className="text-2xl font-bold">{selectedPieData.clashes}</div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {Math.round((selectedPieData.clashes / selectedPieData.value) * 100)}% of students
                      </p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="p-3">
                      <CardTitle className="text-sm">Total Back-to-Back Classes</CardTitle>
                    </CardHeader>
                    <CardContent className="p-3 pt-0">
                      <div className="text-2xl font-bold">{selectedPieData.backToBack}</div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {Math.round((selectedPieData.backToBack / selectedPieData.value) * 100)}% of students
                      </p>
                    </CardContent>
                  </Card>
                </>
              ) : (
                <>
                  <Card>
                    <CardHeader className="p-3">
                      <CardTitle className="text-sm">Total Students</CardTitle>
                    </CardHeader>
                    <CardContent className="p-3 pt-0">
                      <div className="text-2xl font-bold">{selectedPieData?.value}</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="p-3">
                      <CardTitle className="text-sm">Students with Clashes</CardTitle>
                    </CardHeader>
                    <CardContent className="p-3 pt-0">
                      <div className="text-2xl font-bold">{selectedPieData?.clashes}</div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {Math.round((selectedPieData?.clashes || 0) / (selectedPieData?.value || 1) * 100)}% of students
                      </p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="p-3">
                      <CardTitle className="text-sm">Students with Back-to-Back Classes</CardTitle>
                    </CardHeader>
                    <CardContent className="p-3 pt-0">
                      <div className="text-2xl font-bold">{selectedPieData?.backToBack}</div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {Math.round((selectedPieData?.backToBack || 0) / (selectedPieData?.value || 1) * 100)}% of students
                      </p>
                    </CardContent>
                  </Card>
                </>
              )}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  )
}
