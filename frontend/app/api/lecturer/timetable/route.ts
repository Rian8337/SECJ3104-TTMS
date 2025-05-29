import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const session = searchParams.get('session')
  const semester = searchParams.get('semester')
  const worker_no = searchParams.get('worker_no')

  if (!session || !semester || !worker_no) {
    return NextResponse.json(
      { error: 'Missing required parameters' },
      { status: 400 }
    )
  }

  try {
    const response = await fetch(
      `${process.env.BACKEND_URL}/lecturer/timetable?session=${session}&semester=${semester}&worker_no=${worker_no}`,
      { credentials: 'include' }
    )

    if (!response.ok) {
      const data = await response.json()
      return NextResponse.json(
        { error: data.error || 'Failed to fetch timetable' },
        { status: response.status }
      )
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('Error fetching timetable:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 