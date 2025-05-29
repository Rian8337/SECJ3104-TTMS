import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const session = searchParams.get('session')
  const semester = searchParams.get('semester')
  const matric_no = searchParams.get('matric_no')

  if (!session || !semester || !matric_no) {
    return NextResponse.json(
      { error: 'Missing required parameters' },
      { status: 400 }
    )
  }

  try {
    const response = await fetch(
      `${process.env.BACKEND_URL}/student/timetable?session=${session}&semester=${semester}&matric_no=${matric_no}`,
      { credentials: 'include' }
    )

    const data = await response.json()

    if (!response.ok) {
      return NextResponse.json(
        { error: data.error || 'Failed to fetch timetable' },
        { status: response.status }
      )
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('Error fetching timetable:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 