"use client"

import type React from "react"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { AlertTriangle, BookOpen, Calendar, LogOut, Menu, Search, User } from "lucide-react"
import { useRouter } from "next/navigation"
import { API_BASE_URL } from "@/lib/config"

interface StudentInfo {
  name: string
  matricNo: string
  facultyCode?: string
}

interface LecturerInfo {
  name: string
  workerNo: string
  facultyCode?: string
}

interface MobileLayoutProps {
  children: React.ReactNode
  userType: "student" | "lecturer"
  studentInfo?: StudentInfo | null
  lecturerInfo?: LecturerInfo | null
}

export function MobileLayout({ children, userType, studentInfo: initialStudentInfo, lecturerInfo: initialLecturerInfo }: MobileLayoutProps) {
  const router = useRouter()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [studentInfo, setStudentInfo] = useState<StudentInfo | null>(initialStudentInfo || null)
  const [lecturerInfo, setLecturerInfo] = useState<LecturerInfo | null>(initialLecturerInfo || null)

  useEffect(() => {
    if (userType === "student" && !studentInfo) {
      const storedInfo = localStorage.getItem('studentInfo')
      if (!storedInfo) {
        router.push('/')
        return
      }

      try {
        const info = JSON.parse(storedInfo)
        setStudentInfo(info)
      } catch (err) {
        console.error('Error parsing student info:', err)
        localStorage.removeItem('studentInfo')
        router.push('/')
      }
    } else if (userType === "lecturer" && !lecturerInfo) {
      const storedInfo = localStorage.getItem('lecturerInfo')
      if (!storedInfo) {
        router.push('/')
        return
      }

      try {
        const info = JSON.parse(storedInfo)
        setLecturerInfo(info)
      } catch (err) {
        console.error('Error parsing lecturer info:', err)
        localStorage.removeItem('lecturerInfo')
        router.push('/')
      }
    }
  }, [userType, studentInfo, lecturerInfo, router])

  const handleLogout = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/logout`, {
        method: 'POST',
        credentials: 'include',
      })

      if (!response.ok) {
        console.error('Logout failed:', response.status)
      }

      localStorage.removeItem(userType === 'student' ? 'studentInfo' : 'lecturerInfo')
      router.push("/")
    } catch (error) {
      console.error('Error during logout:', error)
      localStorage.removeItem(userType === 'student' ? 'studentInfo' : 'lecturerInfo')
      router.push("/")
    }
  }

  const userInfo = userType === 'student' ? studentInfo : lecturerInfo
  const userInitials = userInfo?.name?.split(' ').map(n => n[0]).join('') || ''

  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      <header className="sticky top-0 z-10 bg-red-800 text-white border-b border-red-900">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center">
            <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="text-white hover:bg-red-700">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-64 border-r-red-100">
                <SheetHeader className="text-left">
                  <SheetTitle className="text-red-800">UTM TMS</SheetTitle>
                </SheetHeader>
                <div className="flex flex-col gap-1 mt-6">
                  <div className="flex items-center p-2">
                    {userType === "lecturer" ? (
                      <img src="/lecturer.png" alt="Lecturer" style={{ objectFit: 'contain' }} className="h-10 w-10 mr-3" />
                    ) : studentInfo ? (
                      <Avatar className="h-10 w-10 mr-3">
                        <AvatarImage src="/diverse-students-studying.png" alt={studentInfo.name} style={{ objectFit: 'contain' }} />
                        <AvatarFallback className="bg-red-100 text-red-800">
                          {studentInfo.name.split(' ').map(n => n[0]).join('') || "SS"}
                        </AvatarFallback>
                      </Avatar>
                    ) : (
                      <Avatar className="h-10 w-10 mr-3">
                        <AvatarFallback className="bg-red-100 text-red-800">SS</AvatarFallback>
                      </Avatar>
                    )}
                    <div>
                      <div className="font-medium">{userInfo?.name || "Loading..."}</div>
                      <div className="text-xs text-muted-foreground">
                        {userType === "student" 
                          ? (userInfo as StudentInfo)?.matricNo 
                          : (userInfo as LecturerInfo)?.workerNo || "Loading..."}
                      </div>
                    </div>
                  </div>

                  <Separator />

                  <NavItem
                    icon={Calendar}
                    label="Dashboard"
                    href={`/${userType}/dashboard?tab=my-timetable`}
                    onClick={() => setIsMenuOpen(false)}
                  />

                  <NavItem
                    icon={Search}
                    label="Search"
                    href={`/${userType}/dashboard?tab=${userType === "student" ? "search-timetable" : "search-student"}`}
                    onClick={() => setIsMenuOpen(false)}
                  />

                  {userType === "lecturer" && (
                    <NavItem
                      icon={BookOpen}
                      label="Analytics"
                      href="/lecturer/dashboard?tab=analytics"
                      onClick={() => setIsMenuOpen(false)}
                    />
                  )}

                  <Separator />

                  {userType === "student" && (
                    <NavItem
                      icon={User}
                      label="Profile"
                      href="/student/profile"
                      onClick={() => setIsMenuOpen(false)}
                    />
                  )}

                  <NavItem
                    icon={LogOut}
                    label="Logout"
                    onClick={() => {
                      setIsMenuOpen(false)
                      handleLogout()
                    }}
                  />
                </div>
              </SheetContent>
            </Sheet>
            <h1 className="text-lg font-semibold ml-2">
              UTM TMS | {userType === "student" ? "Student Portal" : "Lecturer Portal"}
            </h1>
          </div>
          {userType === "lecturer" ? (
            <img src="/lecturer.png" alt="Lecturer" style={{ objectFit: 'contain' }} className="h-10 w-10 ml-2" />
          ) : studentInfo ? (
            <Avatar className="h-10 w-10 ml-2">
              <AvatarImage src="/diverse-students-studying.png" alt={studentInfo.name} style={{ objectFit: 'contain' }} />
              <AvatarFallback className="bg-red-100 text-red-800">{studentInfo.name.split(' ').map(n => n[0]).join('') || "SS"}</AvatarFallback>
            </Avatar>
          ) : (
            <Avatar className="h-10 w-10 ml-2">
              <AvatarFallback className="bg-red-100 text-red-800">SS</AvatarFallback>
            </Avatar>
          )}
        </div>
      </header>

      <main className="flex-1 p-4">{children}</main>
    </div>
  )
}

function Separator() {
  return <div className="h-px bg-border my-2" />
}

interface NavItemProps {
  icon: React.ElementType
  label: string
  href?: string
  onClick?: () => void
}

function NavItem({ icon: Icon, label, href, onClick }: NavItemProps) {
  const content = (
    <div className="flex items-center py-2 px-3 rounded-md hover:bg-muted cursor-pointer" onClick={onClick}>
      <Icon className="h-4 w-4 mr-3" />
      <span>{label}</span>
    </div>
  )

  if (href) {
    return <Link href={href}>{content}</Link>
  }

  return content
}
