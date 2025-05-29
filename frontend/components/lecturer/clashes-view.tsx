"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { AlertTriangle, Clock, MapPin, Users } from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { API_BASE_URL } from "@/lib/config"

interface TimetableCourseSection {
  course: {
    code: string;
    name: string;
  };
  section: string;
  lecturer?: {
    name: string;
    workerNo: string;
  };
}

interface TimetableVenue {
  shortName: string;
  name: string;
}

interface TimetableLecturer {
  name: string;
  workerNo: string;
}

interface ClashTimetable {
  id: string;
  day: string;
  time: string;
  venue: TimetableVenue | null;
  courseSections: TimetableCourseSection[];
  lecturer: TimetableLecturer | null;
}

interface Clash {
  id: string;
  day: string;
  type: 'lecturer' | 'venue';
  classes: ClashTimetable[];
}

export function ClashesView() {
  console.log('ClashesView component mounted')
  const [activeTab, setActiveTab] = useState("lecturer")
  const [showLecturerClashDetails, setShowLecturerClashDetails] = useState(false)
  const [showVenueClashDetails, setShowVenueClashDetails] = useState(false)
  const [selectedClash, setSelectedClash] = useState<Clash | null>(null)
  const [timetable, setTimetable] = useState<ClashTimetable[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  console.log('Current state:', { activeTab, loading, error, timetableLength: timetable.length })

  useEffect(() => {
    console.log('ClashesView useEffect triggered')
    const fetchTimetable = async () => {
      try {
        setLoading(true)
        const storedInfo = localStorage.getItem('lecturerInfo')
        console.log('Stored lecturer info:', storedInfo)
        
        if (!storedInfo) {
          throw new Error('No lecturer information found')
        }
        
        const lecturerInfo = JSON.parse(storedInfo)
        console.log('Parsed lecturer info:', lecturerInfo)
        
        const url = `${API_BASE_URL}/lecturer/clashing-timetable?session=2024/2025&semester=2&worker_no=${lecturerInfo.workerNo}`
        console.log('Fetching from URL:', url)
        
        const response = await fetch(url, {
          credentials: 'include'
        })
        
        if (!response.ok) {
          console.error('Response not OK:', response.status, response.statusText)
          throw new Error('Failed to fetch clashing timetables')
        }

        const data = await response.json()
        console.log('Received timetable data:', data)
        setTimetable(data)
      } catch (err) {
        console.error('Error in fetchTimetable:', err)
        setError(err instanceof Error ? err.message : 'Failed to fetch data')
      } finally {
        setLoading(false)
      }
    }

    fetchTimetable()
  }, [])

  // Detect lecturer clashes
  const lecturerClashes = timetable.reduce<Clash[]>((clashes, class1) => {
    console.log('Processing class for lecturer clashes:', class1)
    const dayClashes = timetable.filter(
      (class2) =>
        class1.day === class2.day &&
        class1.lecturer?.workerNo === class2.lecturer?.workerNo &&
        ((class1.time.split(' - ')[0] >= class2.time.split(' - ')[0] && 
          class1.time.split(' - ')[0] < class2.time.split(' - ')[1]) ||
         (class1.time.split(' - ')[1] > class2.time.split(' - ')[0] && 
          class1.time.split(' - ')[1] <= class2.time.split(' - ')[1]) ||
         (class1.time.split(' - ')[0] <= class2.time.split(' - ')[0] && 
          class1.time.split(' - ')[1] >= class2.time.split(' - ')[1]))
    )
    console.log('Found day clashes for lecturer:', dayClashes)

    if (dayClashes.length > 0) {
      const existingClash = clashes.find(
        (clash) =>
          clash.day === class1.day &&
          clash.type === 'lecturer' &&
          clash.classes.some((c) => c.lecturer?.workerNo === class1.lecturer?.workerNo)
      )

      if (!existingClash) {
        const newClash = {
          id: `lecturer-${class1.day}-${class1.lecturer?.workerNo}`,
          day: class1.day,
          type: 'lecturer' as const,
          classes: [class1, ...dayClashes],
        }
        console.log('Adding new lecturer clash:', newClash)
        clashes.push(newClash)
      }
    }

    return clashes
  }, [])

  console.log('Final lecturer clashes:', lecturerClashes)

  // Detect venue clashes
  const venueClashes = timetable.reduce<Clash[]>((clashes, class1) => {
    console.log('Processing class for venue clashes:', class1)
    const dayClashes = timetable.filter(
      (class2) =>
        class1.day === class2.day &&
        class1.venue?.shortName === class2.venue?.shortName &&
        ((class1.time.split(' - ')[0] >= class2.time.split(' - ')[0] && 
          class1.time.split(' - ')[0] < class2.time.split(' - ')[1]) ||
         (class1.time.split(' - ')[1] > class2.time.split(' - ')[0] && 
          class1.time.split(' - ')[1] <= class2.time.split(' - ')[1]) ||
         (class1.time.split(' - ')[0] <= class2.time.split(' - ')[0] && 
          class1.time.split(' - ')[1] >= class2.time.split(' - ')[1]))
    )
    console.log('Found day clashes for venue:', dayClashes)

    if (dayClashes.length > 0) {
      const existingClash = clashes.find(
        (clash) =>
          clash.day === class1.day &&
          clash.type === 'venue' &&
          clash.classes.some((c) => c.venue?.shortName === class1.venue?.shortName)
      )

      if (!existingClash) {
        const newClash = {
          id: `venue-${class1.day}-${class1.venue?.shortName}`,
          day: class1.day,
          type: 'venue' as const,
          classes: [class1, ...dayClashes],
        }
        console.log('Adding new venue clash:', newClash)
        clashes.push(newClash)
      }
    }

    return clashes
  }, [])

  console.log('Final venue clashes:', venueClashes)

  const handleLecturerClashClick = (clash: Clash) => {
    setSelectedClash(clash)
    setShowLecturerClashDetails(true)
  }

  const handleVenueClashClick = (clash: Clash) => {
    setSelectedClash(clash)
    setShowVenueClashDetails(true)
  }

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="text-lg font-medium">Loading clashes...</div>
        <div className="text-muted-foreground">Please wait while we analyze your timetable</div>
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

  return (
    <div className="space-y-4">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="lecturer">Lecturer Clashes</TabsTrigger>
          <TabsTrigger value="venue">Venue Clashes</TabsTrigger>
        </TabsList>

        <TabsContent value="lecturer" className="space-y-4">
          {lecturerClashes.length === 0 ? (
            <Card>
              <CardContent className="p-6 text-center">
                <div className="text-muted-foreground">No lecturer clashes found</div>
              </CardContent>
            </Card>
          ) : (
            lecturerClashes.map((clash) => (
              <Card
                key={clash.id}
                className="cursor-pointer hover:bg-slate-50"
                onClick={() => handleLecturerClashClick(clash)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">{clash.day}</div>
                      <div className="text-sm text-muted-foreground">
                        {clash.classes.length} conflicting classes
                      </div>
                    </div>
                    <Badge variant="destructive">Clash</Badge>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="venue" className="space-y-4">
          {venueClashes.length === 0 ? (
            <Card>
              <CardContent className="p-6 text-center">
                <div className="text-muted-foreground">No venue clashes found</div>
              </CardContent>
            </Card>
          ) : (
            venueClashes.map((clash) => (
              <Card
                key={clash.id}
                className="cursor-pointer hover:bg-slate-50"
                onClick={() => handleVenueClashClick(clash)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">{clash.day}</div>
                      <div className="text-sm text-muted-foreground">
                        {clash.classes.length} conflicting classes
                      </div>
                    </div>
                    <Badge variant="destructive">Clash</Badge>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>

      {/* Lecturer Clash Details Dialog */}
      <Dialog open={showLecturerClashDetails} onOpenChange={setShowLecturerClashDetails}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Lecturer Clash Details</DialogTitle>
            <DialogDescription>
              These classes have overlapping times with the same lecturer
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[60vh]">
            <div className="space-y-4">
              {selectedClash?.classes.map((classItem) => (
                <Card key={classItem.id}>
                  <CardHeader className="p-3">
                    <CardTitle className="text-sm">{classItem.courseSections[0].course.name}</CardTitle>
                    <div className="text-xs text-muted-foreground">
                      Section {classItem.courseSections[0].section}
                    </div>
                  </CardHeader>
                  <CardContent className="p-3 pt-0">
                    <div className="space-y-1">
                      <div className="text-xs p-1 rounded bg-muted flex justify-between">
                        <div className="flex items-center">
                          <Clock className="h-3 w-3 mr-1" />
                          <span>{classItem.time.split(' - ')[0]} - {classItem.time.split(' - ')[1]}</span>
                        </div>
                        <div className="flex items-center">
                          <MapPin className="h-3 w-3 mr-1" />
                          <span>{classItem.venue?.shortName || 'TBA'}</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* Venue Clash Details Dialog */}
      <Dialog open={showVenueClashDetails} onOpenChange={setShowVenueClashDetails}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Venue Clash Details</DialogTitle>
            <DialogDescription>
              These classes have overlapping times in the same venue
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[60vh]">
            <div className="space-y-4">
              {selectedClash?.classes.map((classItem) => (
                <Card key={classItem.id}>
                  <CardHeader className="p-3">
                    <CardTitle className="text-sm">{classItem.courseSections[0].course.name}</CardTitle>
                    <div className="text-xs text-muted-foreground">
                      Section {classItem.courseSections[0].section}
                    </div>
                  </CardHeader>
                  <CardContent className="p-3 pt-0">
                    <div className="space-y-1">
                      <div className="text-xs p-1 rounded bg-muted flex justify-between">
                        <div className="flex items-center">
                          <Clock className="h-3 w-3 mr-1" />
                          <span>{classItem.time.split(' - ')[0]} - {classItem.time.split(' - ')[1]}</span>
                        </div>
                        <div className="flex items-center">
                          <Users className="h-3 w-3 mr-1" />
                          <span>{classItem.lecturer?.name || 'TBA'}</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  )
}
