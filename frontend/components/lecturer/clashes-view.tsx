"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Clock, MapPin, Users } from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { API_BASE_URL } from "@/lib/config"
import { dayMap, timeMap, formatTime } from "@/lib/timetable-utils"

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
  const [venueClashes, setVenueClashes] = useState<Clash[]>([])
  const [lecturerClashes, setLecturerClashes] = useState<Clash[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  console.log('Current state:', { activeTab, loading, error, venueClashesLength: venueClashes.length, lecturerClashesLength: lecturerClashes.length })

  useEffect(() => {
    console.log('ClashesView useEffect triggered')
    const fetchClashes = async () => {
      try {
        setLoading(true)
        const storedInfo = localStorage.getItem('lecturerInfo')
        console.log('Stored lecturer info:', storedInfo)
        
        if (!storedInfo) {
          throw new Error('No lecturer information found')
        }
        
        const lecturerInfo = JSON.parse(storedInfo)
        console.log('Parsed lecturer info:', lecturerInfo)
        
        // Fetch venue clashes
        const venueClashUrl = `${API_BASE_URL}/lecturer/venue-clash?session=2024/2025&semester=2&worker_no=${lecturerInfo.workerNo}`
        console.log('Fetching venue clashes from URL:', venueClashUrl)
        
        const venueResponse = await fetch(venueClashUrl, {
          credentials: 'include'
        })
        
        if (!venueResponse.ok) {
          console.error('Venue response not OK:', venueResponse.status, venueResponse.statusText)
          throw new Error('Failed to fetch venue clashes')
        }

        const venueData = await venueResponse.json()
        console.log('Received venue clash data:', venueData)
        
        // Validate and transform venue clash data
        if (!Array.isArray(venueData)) {
          console.error('Invalid venue data format:', venueData)
          setVenueClashes([])
          return
        }
        
        // Transform venue clash data into the expected format
        const transformedVenueClashes = venueData.map((clash: any) => ({
          id: `venue-${clash.day}-${clash.venue?.shortName || 'unknown'}`,
          day: dayMap[clash.day] || 'Unknown',
          type: 'venue' as const,
          classes: Array.isArray(clash.courseSections) ? clash.courseSections.map((section: any) => ({
            id: `${section.course.code}-${section.section}`,
            day: dayMap[clash.day] || 'Unknown',
            time: timeMap[clash.time] || 'Time not specified',
            venue: clash.venue || null,
            courseSections: [{
              course: {
                code: section.course.code || 'Unknown',
                name: section.course.name || 'Unknown Course'
              },
              section: section.section || 'Unknown',
              lecturer: section.lecturer || null
            }],
            lecturer: section.lecturer || null
          })) : []
        }))
        
        setVenueClashes(transformedVenueClashes)

        // TODO: Implement lecturer clash fetching when the API is available
        setLecturerClashes([])
      } catch (err) {
        console.error('Error in fetchClashes:', err)
        setError(err instanceof Error ? err.message : 'Failed to fetch data')
        setVenueClashes([])
        setLecturerClashes([])
      } finally {
        setLoading(false)
      }
    }

    fetchClashes()
  }, [])

  const handleLecturerClashClick = (clash: Clash) => {
    setSelectedClash(clash)
    setShowLecturerClashDetails(true)
  }

  const handleVenueClashClick = (clash: Clash) => {
    setSelectedClash(clash)
    setShowVenueClashDetails(true)
  }

  const formatTimeSlot = (timeSlot: string) => {
    const [startTime, endTime] = timeSlot.split(' - ')
    return `${formatTime(startTime)} - ${formatTime(endTime)}`
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
        <TabsList className="border #000000 w-full">
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
              <Card key={clash.id} className="border-red-200">
                <CardHeader className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-lg">{clash.day}</div>
                      <div className="text-sm text-muted-foreground">
                        {clash.classes.length} conflicting classes
                      </div>
                    </div>
                    <Badge variant="destructive">Lecturer Clash</Badge>
                  </div>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  <div className="space-y-3">
                    {clash.classes.map((classItem) => (
                      <div key={classItem.id} className="p-3 bg-red-50 rounded-lg border border-red-100">
                        <div className="flex flex-col">
                          <div>
                            <h3 className="font-medium">{classItem.courseSections[0].course.name}</h3>
                            <div className="text-sm text-muted-foreground">
                              {classItem.courseSections[0].course.code} - Section {classItem.courseSections[0].section}
                            </div>
                          </div>
                          <div className="text-sm text-muted-foreground mt-2">
                            <div className="flex items-center">
                              <Clock className="h-4 w-4 mr-1" />
                              {formatTimeSlot(classItem.time)}
                            </div>
                          </div>
                        </div>
                        <div className="mt-2 flex items-center gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center">
                            <MapPin className="h-4 w-4 mr-1" />
                            <span>{classItem.venue?.shortName || 'TBA'}</span>
                          </div>
                          <div className="flex items-center">
                            <Users className="h-4 w-4 mr-1" />
                            <span>{classItem.lecturer?.name || 'TBA'}</span>
                          </div>
                        </div>
                      </div>
                    ))}
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
              <Card key={clash.id} className="border-blue-200">
                <CardHeader className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-lg">{clash.day}</div>
                      <div className="text-sm text-muted-foreground">
                        {clash.classes.length} conflicting classes
                      </div>
                    </div>
                    <Badge variant="destructive">Venue Clash</Badge>
                  </div>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  <div className="mb-3 p-2 bg-blue-50 rounded-lg border border-blue-100">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-blue-600" />
                      <span className="font-medium">{clash.classes[0]?.venue?.shortName || 'Unknown Venue'}</span>
                    </div>
                  </div>
                  <div className="space-y-3">
                    {clash.classes.map((classItem) => (
                      <div key={classItem.id} className="p-3 bg-blue-50 rounded-lg border border-blue-100">
                        <div className="flex flex-col">
                          <div>
                            <h3 className="font-medium">{classItem.courseSections[0].course.name}</h3>
                            <div className="text-sm text-muted-foreground">
                              {classItem.courseSections[0].course.code} - Section {classItem.courseSections[0].section}
                            </div>
                          </div>
                          <div className="text-sm text-muted-foreground mt-2">
                            <div className="flex items-center">
                              <Clock className="h-4 w-4 mr-1" />
                              {formatTimeSlot(classItem.time)}
                            </div>
                          </div>
                        </div>
                        <div className="mt-2 flex items-center gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center">
                            <Users className="h-4 w-4 mr-1" />
                            <span>{classItem.lecturer?.name || 'TBA'}</span>
                          </div>
                        </div>
                      </div>
                    ))}
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
                          <span>{classItem.time}</span>
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
                          <span>{classItem.time}</span>
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
