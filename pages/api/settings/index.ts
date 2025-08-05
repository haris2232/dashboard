import { NextRequest, NextResponse } from 'next/server'

// Mock settings data - in a real app, this would come from a database
let settings = {
  currency: "USD"
}

export async function GET() {
  // Try to get settings from backend first
  try {
    const response = await fetch('http://34.18.0.53/api/settings/public')
    if (response.ok) {
      const backendSettings = await response.json()
      settings = { ...settings, ...backendSettings }
    }
  } catch (error) {
    console.error('Failed to fetch from backend:', error)
  }

  return NextResponse.json(settings, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  })
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Update local settings
    settings = { ...settings, ...body }
    
    // Also update the backend
    try {
      const backendResponse = await fetch('http://34.18.0.53/api/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          settingsData: JSON.stringify(body)
        }),
      })
      
      if (backendResponse.ok) {
        console.log('Successfully synced currency to backend')
      } else {
        console.error('Failed to sync to backend:', backendResponse.status)
      }
    } catch (error) {
      console.error('Failed to sync with backend:', error)
    }
    
    return NextResponse.json(settings, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to update settings' },
      { status: 500 }
    )
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  })
} 