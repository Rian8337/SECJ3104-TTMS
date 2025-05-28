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

interface MobileLayoutProps {
  children: React.ReactNode
  userType: "student" | "lecturer"
  studentInfo?: StudentInfo | null
}

export function MobileLayout({ children, userType, studentInfo: initialStudentInfo }: MobileLayoutProps) {
  const router = useRouter()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [studentInfo, setStudentInfo] = useState<StudentInfo | null>(initialStudentInfo || null)

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
    }
  }, [userType, studentInfo, router])

  const handleLogout = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/logout`, {
        method: 'POST',
        credentials: 'include',
      })

      if (!response.ok) {
        console.error('Logout failed:', response.status)
      }

      localStorage.removeItem('studentInfo')
      router.push("/")
    } catch (error) {
      console.error('Error during logout:', error)
      localStorage.removeItem('studentInfo')
      router.push("/")
    }
  }

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
                    <Avatar className="h-10 w-10 mr-3">
                      <AvatarImage src="/diverse-students-studying.png" alt="User" />
                      <AvatarFallback className="bg-red-100 text-red-800">
                        {userType === "student" ? (studentInfo?.name?.split(' ').map(n => n[0]).join('') || "SS") : "AR"}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-medium">{userType === "student" ? studentInfo?.name || "Loading..." : "Dr. Ahmad Rizal"}</div>
                      <div className="text-xs text-muted-foreground">
                        {userType === "student" ? studentInfo?.matricNo || "Loading..." : "Faculty of Computing"}
                      </div>
                    </div>
                  </div>

                  <Separator />

                  <NavItem
                    icon={Calendar}
                    label="Dashboard"
                    href={`/${userType}/dashboard`}
                    onClick={() => setIsMenuOpen(false)}
                  />

                  <NavItem
                    icon={Search}
                    label="Search"
                    href={`/${userType}/dashboard?tab=search-timetable`}
                    onClick={() => setIsMenuOpen(false)}
                  />

                  {userType === "lecturer" && (
                    <>
                      <NavItem
                        icon={AlertTriangle}
                        label="Clashes"
                        href="/lecturer/clashes"
                        onClick={() => setIsMenuOpen(false)}
                      />
                      <NavItem
                        icon={BookOpen}
                        label="Analytics"
                        href="/lecturer/analytics"
                        onClick={() => setIsMenuOpen(false)}
                      />
                    </>
                  )}

                  <Separator />

                  <NavItem
                    icon={User}
                    label="Profile"
                    href={`/${userType}/profile`}
                    onClick={() => setIsMenuOpen(false)}
                  />

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
          <Avatar className="h-8 w-8 border-2 border-white/20">
            <AvatarImage src="/diverse-students-studying.png" alt="User" />
            <AvatarFallback className="bg-red-100 text-red-800">{userType === "student" ? "SS" : "AR"}</AvatarFallback>
          </Avatar>
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
