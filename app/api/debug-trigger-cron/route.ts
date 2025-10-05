import { NextResponse } from 'next/server'

export async function POST() {
  try {
    console.log('🚀 Manually triggering mispriced odds cron job...')
    
    // Call the cron endpoint internally
    const baseUrl = process.env.VERCEL_URL 
      ? `https://${process.env.VERCEL_URL}` 
      : process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'
    
    const cronSecret = process.env.CRON_SECRET
    if (!cronSecret) {
      return NextResponse.json({ 
        error: 'CRON_SECRET not configured',
        message: 'Cannot trigger cron job without secret'
      }, { status: 500 })
    }
    
    const response = await fetch(`${baseUrl}/api/cron/mispriced-odds`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${cronSecret}`,
        'Content-Type': 'application/json'
      }
    })
    
    const data = await response.json()
    
    return NextResponse.json({ 
      success: response.ok,
      cron_response: data,
      triggered_at: new Date().toISOString(),
      message: response.ok 
        ? 'Cron job triggered successfully' 
        : 'Cron job failed to run'
    })
    
  } catch (error) {
    console.error('Error triggering cron job:', error)
    return NextResponse.json({ 
      success: false,
      error: 'Failed to trigger cron job',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
} 