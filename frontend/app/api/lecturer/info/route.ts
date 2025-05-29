import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function GET(request: NextRequest) {
  try {
    // Get the session cookie
    const cookieStore = await cookies()
    const sessionCookie = cookieStore.get('session')

    if (!sessionCookie) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }

    // Forward the request to the backend with the session cookie
    const response = await fetch(
      `${process.env.BACKEND_URL}/lecturer/validate-session`,
      {
        headers: {
          'Cookie': `session=${sessionCookie.value}`
        },
        credentials: 'include',
      }
    )

    if (!response.ok) {
      let errorData
      try {
        errorData = await response.json()
      } catch (e) {
        errorData = { error: 'Failed to validate session' }
      }
      return NextResponse.json(
        { error: errorData.error || 'Failed to validate session' },
        { status: response.status }
      )
    }

    const lecturerData = await response.json()
    return NextResponse.json(lecturerData)
  } catch (error) {
    console.error('Error validating session:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 