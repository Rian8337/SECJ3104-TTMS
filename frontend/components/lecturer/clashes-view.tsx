"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { AlertTriangle, Clock, MapPin, Users } from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"

interface TimetableEntry {
  id: string
  course: string
  day: string
  startTime: string
  endTime: string
  venue: string
  lecturer: string
}

interface Clash {
  id: string
  day: string
  type: 'lecturer' | 'venue'
  classes: TimetableEntry[]
}

export function ClashesView() {
  const [activeTab, setActiveTab] = useState("lecturer")
  const [showLecturerClashDetails, setShowLecturerClashDetails] = useState(false)
  const [showVenueClashDetails, setShowVenueClashDetails] = useState(false)
  const [selectedClash, setSelectedClash] = useState<Clash | null>(null)
  const [timetable, setTimetable] = useState<TimetableEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchTimetable = async () => {
      try {
        setLoading(true)
        const response = await fetch('/api/lecturer/info', {
          credentials: 'include'
        })
        
        if (!response.ok) {
          throw new Error('Failed to fetch lecturer information')
        }
        
        const lecturerInfo = await response.json()
        
        const timetableResponse = await fetch(
          `/api/lecturer/timetable?session=2023/2024&semester=2&worker_no=${lecturerInfo.workerNo}`,
          {
            credentials: 'include'
          }
        )
        
        if (!timetableResponse.ok) {
          throw new Error('Failed to fetch timetable')
        }

        const data = await timetableResponse.json()
        setTimetable(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch data')
      } finally {
        setLoading(false)
      }
    }

    fetchTimetable()
  }, [])

  // Detect lecturer clashes
  const lecturerClashes = timetable.reduce<Clash[]>((clashes, class1) => {
    const dayClashes = timetable.filter(
      (class2) =>
        class1.id !== class2.id &&
        class1.day === class2.day &&
        class1.lecturer === class2.lecturer &&
        ((class1.startTime >= class2.startTime && class1.startTime < class2.endTime) ||
          (class1.endTime > class2.startTime && class1.endTime <= class2.endTime) ||
          (class1.startTime <= class2.startTime && class1.endTime >= class2.endTime))
    )

    if (dayClashes.length > 0) {
      const existingClash = clashes.find(
        (clash) =>
          clash.day === class1.day &&
          clash.type === 'lecturer' &&
          clash.classes.some((c) => c.id === class1.id)
      )

      if (!existingClash) {
        clashes.push({
          id: `lecturer-${class1.day}-${class1.id}`,
          day: class1.day,
          type: 'lecturer',
          classes: [class1, ...dayClashes],
        })
      }
    }

    return clashes
  }, [])

  // Detect venue clashes
  const venueClashes = timetable.reduce<Clash[]>((clashes, class1) => {
    const dayClashes = timetable.filter(
      (class2) =>
        class1.id !== class2.id &&
        class1.day === class2.day &&
        class1.venue === class2.venue &&
        ((class1.startTime >= class2.startTime && class1.startTime < class2.endTime) ||
          (class1.endTime > class2.startTime && class1.endTime <= class2.endTime) ||
          (class1.startTime <= class2.startTime && class1.endTime >= class2.endTime))
    )

    if (dayClashes.length > 0) {
      const existingClash = clashes.find(
        (clash) =>
          clash.day === class1.day &&
          clash.type === 'venue' &&
          clash.classes.some((c) => c.id === class1.id)
      )

      if (!existingClash) {
        clashes.push({
          id: `venue-${class1.day}-${class1.id}`,
          day: class1.day,
          type: 'venue',
          classes: [class1, ...dayClashes],
        })
      }
    }

    return clashes
  }, [])

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

      <Dialog open={showLecturerClashDetails} onOpenChange={setShowLecturerClashDetails}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Lecturer Clash Details</DialogTitle>
            <DialogDescription>
              {selectedClash?.day} - {selectedClash?.classes.length} conflicting classes
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[400px]">
            <div className="space-y-4">
              {selectedClash?.classes.map((classItem) => (
                <Card key={classItem.id}>
                  <CardContent className="p-4">
                    <div className="space-y-2">
                      <div className="font-medium">{classItem.course}</div>
                      <div className="flex items-center text-sm text-muted-foreground">
                        <Clock className="mr-2 h-4 w-4" />
                        {classItem.startTime} - {classItem.endTime}
                      </div>
                      <div className="flex items-center text-sm text-muted-foreground">
                        <MapPin className="mr-2 h-4 w-4" />
                        {classItem.venue}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      <Dialog open={showVenueClashDetails} onOpenChange={setShowVenueClashDetails}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Venue Clash Details</DialogTitle>
            <DialogDescription>
              {selectedClash?.day} - {selectedClash?.classes.length} conflicting classes
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[400px]">
            <div className="space-y-4">
              {selectedClash?.classes.map((classItem) => (
                <Card key={classItem.id}>
                  <CardContent className="p-4">
                    <div className="space-y-2">
                      <div className="font-medium">{classItem.course}</div>
                      <div className="flex items-center text-sm text-muted-foreground">
                        <Clock className="mr-2 h-4 w-4" />
                        {classItem.startTime} - {classItem.endTime}
                      </div>
                      <div className="flex items-center text-sm text-muted-foreground">
                        <Users className="mr-2 h-4 w-4" />
                        {classItem.lecturer}
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
