import { MobileLayout } from "@/components/mobile-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ClashesView } from "@/components/lecturer/clashes-view"

export default function LecturerClashesPage() {
  return (
    <MobileLayout userType="lecturer">
      <div className="space-y-4">
        <h1 className="text-2xl font-bold">Timetable Clashes</h1>
        <p className="text-muted-foreground">View and resolve lecturer and venue conflicts</p>

        <Card>
          <CardHeader className="">
            <CardTitle>Clashes Detection</CardTitle>
            <CardDescription>Identify and resolve scheduling conflicts</CardDescription>
          </CardHeader>
          <CardContent>
            <ClashesView />
          </CardContent>
        </Card>
      </div>
    </MobileLayout>
  )
}
