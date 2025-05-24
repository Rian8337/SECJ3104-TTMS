"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Clock, MapPin, Users } from "lucide-react"

export function CurrentClassesView() {
  const [selectedTime, setSelectedTime] = useState("now")

  // Mock data for current classes with UTM courses
  const currentClasses = [
    {
      id: "secp3204",
      course: "SECP3204 - Software Engineering",
      time: "09:00 - 11:00",
      venue: "N28-A",
      students: [
        { id: "A22EC4040", name: "Samin Sarwat" },
        { id: "A22EC4043", name: "Muhammad Hafiz" },
        { id: "A22EC4045", name: "Tan Wei Ming" },
        { id: "A22EC4046", name: "Amirah Zainal" },
        { id: "A22EC4047", name: "Rajesh Kumar" },
      ],
    },
    {
      id: "secj3303",
      course: "SECJ3303 - Internet Programming",
      time: "11:00 - 13:00",
      venue: "N28-B",
      students: [
        { id: "A22EC4040", name: "Samin Sarwat" },
        { id: "A22EC4041", name: "Ahmad Firdaus" },
        { id: "A22EC4048", name: "Nurul Huda" },
      ],
    },
  ]

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-2">
        <Select value={selectedTime} onValueChange={setSelectedTime}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select time" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="now">Current Time</SelectItem>
            <SelectItem value="09:00">09:00 AM</SelectItem>
            <SelectItem value="11:00">11:00 AM</SelectItem>
            <SelectItem value="13:00">01:00 PM</SelectItem>
            <SelectItem value="15:00">03:00 PM</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-4">
        {currentClasses.map((classItem) => (
          <Card key={classItem.id} className="overflow-hidden">
            <CardContent className="p-0">
              <div className="bg-red-50 p-3">
                <h3 className="font-medium">{classItem.course}</h3>
                <div className="flex items-center text-sm text-muted-foreground mt-1">
                  <Clock className="h-3.5 w-3.5 mr-1" />
                  <span>{classItem.time}</span>
                  <span className="mx-2">•</span>
                  <MapPin className="h-3.5 w-3.5 mr-1" />
                  <span>{classItem.venue}</span>
                </div>
              </div>

              <div className="p-3">
                <div className="flex items-center mb-2">
                  <Users className="h-4 w-4 mr-2 text-muted-foreground" />
                  <span className="text-sm font-medium">Students ({classItem.students.length})</span>
                </div>

                <div className="space-y-2">
                  {classItem.students.map((student) => (
                    <div key={student.id} className="flex justify-between items-center">
                      <div>
                        <div className="text-sm font-medium">{student.name}</div>
                        <div className="text-xs text-muted-foreground">{student.id}</div>
                      </div>
                      <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                        Present
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
