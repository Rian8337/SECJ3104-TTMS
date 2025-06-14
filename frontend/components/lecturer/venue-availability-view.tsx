"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { API_BASE_URL } from "@/lib/config"
import { Building2, ChevronLeft, ChevronRight, Users } from "lucide-react"
import { WEEKDAYS, dayMap, timeMap, getCurrentDay, formatTime } from "@/lib/timetable-utils"
import type { Weekday } from "@/lib/timetable-utils"
import Image from "next/image"

interface Venue {
  code: string
  name: string
  shortName: string
  capacity: number
  type: number
}

const VENUES_PER_PAGE = 5

// Convert hour to time slot number
const hourToTimeSlot = (hour: number): string => {
  // Time slots start at 7:00 (slot 1)
  // Each slot is 50 minutes
  const slot = Math.floor((hour - 7) * 2) + 1
  return Math.max(1, Math.min(16, slot)).toString()
}

export function VenueAvailabilityView() {
  const [venues, setVenues] = useState<Venue[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedDay, setSelectedDay] = useState<Weekday>(getCurrentDay())
  
  // Get current hour and set default time slots
  const currentHour = new Date().getHours()
  const defaultStartSlot = hourToTimeSlot(currentHour)
  const defaultEndSlot = hourToTimeSlot(currentHour + 2) // Default to 2 hours later
  
  const [startTimeSlot, setStartTimeSlot] = useState(defaultStartSlot)
  const [endTimeSlot, setEndTimeSlot] = useState(defaultEndSlot)
  const [currentPage, setCurrentPage] = useState(1)

  // Get time slots between start and end time
  const getTimeSlots = () => {
    const start = parseInt(startTimeSlot)
    const end = parseInt(endTimeSlot)
    const slots = Array.from(
      { length: end - start + 1 },
      (_, i) => (start + i).toString()
    )
    console.log('Generated time slots:', slots)
    return slots
  }

  const fetchVenues = async () => {
    try {
      setLoading(true)
      setError(null)
      
      // Convert selected day to number (1-7)
      const dayNumber = Object.entries(dayMap).find(([_, name]) => name === selectedDay)?.[0] || "2"
      console.log('Selected day:', selectedDay, 'Day number:', dayNumber)
      
      const timeSlots = getTimeSlots()
      const timesParam = timeSlots.join(",")
      console.log('Time slots param:', timesParam)
      
      const url = `${API_BASE_URL}/venue/available-venues?session=2024/2025&semester=2&day=${dayNumber}&times=${timesParam}`
      console.log('Fetching from URL:', url)
      
      const response = await fetch(url, {
        credentials: 'include'
      })

      if (!response.ok) {
        throw new Error('Failed to fetch available venues')
      }

      const data = await response.json()
      console.log('Fetched venues:', data)
      setVenues(data)
      setCurrentPage(1) // Reset to first page when new results arrive
    } catch (err) {
      console.error('Error fetching venues:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch venues')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    console.log('Effect triggered with:', {
      selectedDay,
      startTimeSlot,
      endTimeSlot,
      timeMap: timeMap[parseInt(startTimeSlot)],
      timeMapEnd: timeMap[parseInt(endTimeSlot)]
    })
    fetchVenues()
  }, [selectedDay, startTimeSlot, endTimeSlot])

  const getVenueTypeLabel = (type: number) => {
    const label = type === 1 ? "Laboratory" : type === 2 ? "Lecture Room" : "Unidentified"
    console.log('Venue type:', type, 'Label:', label)
    return label
  }

  const getVenueTypeIcon = (type: number) => {
    switch (type) {
      case 1: // Laboratory
        return "https://img.icons8.com/ios-filled/100/9a231b/workstation.png"
      case 2: // Lecture Room
        return "https://img.icons8.com/ios/100/9a231b/auditorium.png"
      default:
        return "https://img.icons8.com/ios/100/9a231b/building.png"
    }
  }

  // Render day selector with icons
  const renderDaySelector = () => {
    console.log('Rendering day selector with selected day:', selectedDay)
    return (
      <div className="flex space-x-2 overflow-x-auto pb-2">
        {WEEKDAYS.map((day) => {
          const iconUrl = `https://img.icons8.com/sf-black-filled/100/9a231b/${day.toLowerCase()}.png`
          console.log('Day icon URL:', iconUrl)

          return (
            <button
              key={day}
              className={`flex flex-col items-center p-1 w-16 transition-all duration-200 ease-in-out ${
                selectedDay === day
                  ? "border-b-2 border-[#9A231B] text-[#9A231B] rounded-t-md rounded-b-none"
                  : "text-gray-700 hover:bg-gray-100 rounded-md"
              }`}
              onClick={() => {
                console.log('Day selected:', day)
                setSelectedDay(day)
              }}
            >
              <img src={iconUrl} alt={day} className="h-10 w-10 mb-1" />
            </button>
          )
        })}
      </div>
    )
  }

  // Calculate pagination
  const totalPages = Math.ceil(venues.length / VENUES_PER_PAGE)
  const startIndex = (currentPage - 1) * VENUES_PER_PAGE
  const endIndex = startIndex + VENUES_PER_PAGE
  const currentVenues = venues.slice(startIndex, endIndex)
  console.log('Pagination:', {
    totalPages,
    currentPage,
    startIndex,
    endIndex,
    venuesCount: venues.length,
    currentVenuesCount: currentVenues.length
  })

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4">
        <div>
          {/* <label className="text-sm font-medium mb-2 block">Select Day</label> */}
          {renderDaySelector()}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Start Time</label>
            <Select 
              value={startTimeSlot} 
              onValueChange={(value) => {
                console.log('Start time selected:', value, timeMap[parseInt(value)])
                setStartTimeSlot(value)
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select start time" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(timeMap).map(([value, label]) => {
                  console.log('Time slot option:', { value, label })
                  return (
                    <SelectItem key={value} value={value}>
                      {formatTime(label.split(' - ')[0])}
                    </SelectItem>
                  )
                })}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-sm font-medium mb-2 block">End Time</label>
            <Select 
              value={endTimeSlot} 
              onValueChange={(value) => {
                console.log('End time selected:', value, timeMap[parseInt(value)])
                setEndTimeSlot(value)
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select end time" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(timeMap).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {formatTime(label.split(' - ')[1])}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="text-sm text-muted-foreground">
          Showing venues available from {formatTime(timeMap[parseInt(startTimeSlot)]?.split(' - ')[0] || '')} to {formatTime(timeMap[parseInt(endTimeSlot)]?.split(' - ')[1] || '')}
        </div>
      </div>

      {error && (
        <div className="text-red-500 text-sm">{error}</div>
      )}

      {loading ? (
        <div className="text-center py-8">
          <div className="text-lg font-medium">Loading venues...</div>
          <div className="text-muted-foreground">Please wait while we fetch available venues</div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {currentVenues.map(venue => {
              console.log('Rendering venue card:', venue)
              return (
                <Card key={venue.code} className="transition-colors">
                  <CardHeader className="p-4">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Image 
                        src={getVenueTypeIcon(venue.type)}
                        alt={getVenueTypeLabel(venue.type)}
                        width={24}
                        height={24}
                      />
                      {venue.shortName}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 pt-0">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between bg-[#9A231B]/10 p-2 rounded-md">
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-[#9A231B]" />
                          <span className="font-medium text-[#9A231B]">{venue.capacity} seats</span>
                        </div>
                        <span className="text-sm text-[#9A231B]">{getVenueTypeLabel(venue.type)}</span>
                      </div>
                      <div className="text-sm text-gray-600">
                        <div className="flex items-center gap-2">
                          <span>{venue.name}</span>
                          <span className="text-xs text-gray-500">•</span>
                          <span className="text-xs text-gray-500">{venue.code}</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>

          {venues.length > VENUES_PER_PAGE && (
            <div className="flex items-center justify-center gap-4 mt-4">
              <button
                onClick={() => {
                  const newPage = Math.max(1, currentPage - 1)
                  console.log('Previous page clicked:', newPage)
                  setCurrentPage(newPage)
                }}
                disabled={currentPage === 1}
                className="p-2 rounded-md border disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="text-sm">
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() => {
                  const newPage = Math.min(totalPages, currentPage + 1)
                  console.log('Next page clicked:', newPage)
                  setCurrentPage(newPage)
                }}
                disabled={currentPage === totalPages}
                className="p-2 rounded-md border disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
} 