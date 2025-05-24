import { Suspense } from "react"
import { LecturerDashboard } from "@/components/lecturer/dashboard"
import { MobileLayout } from "@/components/mobile-layout"

export default function LecturerDashboardPage() {
  return (
    <MobileLayout userType="lecturer">
      <Suspense fallback={<div>Loading...</div>}>
        <LecturerDashboard />
      </Suspense>
    </MobileLayout>
  )
}
