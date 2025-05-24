import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const query = searchParams.get('query')

  if (!query) {
    return NextResponse.json(
      { error: 'Query parameter is required' },
      { status: 400 }
    )
  }

  try {
    // Get the session cookie
    const cookieStore = cookies()
    const sessionCookie = cookieStore.get('session')

    if (!sessionCookie) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }

    const response = await fetch(
      `${process.env.BACKEND_URL}/student/search?query=${encodeURIComponent(query)}`,
      {
        headers: {
          'Cookie': `session=${sessionCookie.value}`
        },
        credentials: 'include',
      }
    )

    if (!response.ok) {
      const data = await response.json()
      return NextResponse.json(
        { error: data.error || 'Failed to search students' },
        { status: response.status }
      )
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('Error searching students:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 