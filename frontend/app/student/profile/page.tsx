import { MobileLayout } from "@/components/mobile-layout"
import { StudentProfile } from "@/components/student/student-profile"

export default function StudentProfilePage() {
  return (
    <MobileLayout userType="student">
      <StudentProfile />
    </MobileLayout>
  )
}
