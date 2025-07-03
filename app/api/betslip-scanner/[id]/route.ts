import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/libs/supabase/server'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient()
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    const betslipId = params.id

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(betslipId)) {
      return NextResponse.json(
        { error: 'Invalid betslip ID format' },
        { status: 400 }
      )
    }

    // Fetch betslip with selections
    const { data: betslip, error: betslipError } = await supabase
      .from('scanned_betslips')
      .select(`
        *,
        scanned_betslip_selections (*)
      `)
      .eq('id', betslipId)
      .single()

    if (betslipError) {
      console.error('Database error fetching betslip:', betslipError)
      return NextResponse.json(
        { error: 'Failed to fetch betslip' },
        { status: 500 }
      )
    }

    if (!betslip) {
      return NextResponse.json(
        { error: 'Betslip not found' },
        { status: 404 }
      )
    }

    // Check access permissions
    const isOwner = user && betslip.user_id === user.id
    const isPublic = betslip.is_public === true

    if (!isOwner && !isPublic) {
      // Private betslip and not the owner
      if (!user) {
        return NextResponse.json(
          { 
            error: 'Authentication required',
            message: 'You must be signed in to view private betslips'
          },
          { status: 401 }
        )
      }
      
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      )
    }

    // Return the betslip data
    return NextResponse.json({
      success: true,
      data: {
        betslip,
        selections: betslip.scanned_betslip_selections,
        canEdit: isOwner,
        isPublic: betslip.is_public,
        viewerIsOwner: isOwner
      }
    })

  } catch (error) {
    console.error('Error in GET /api/betslip-scanner/[id]:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient()
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { 
          error: 'Authentication required',
          message: 'You must be signed in to update betslips'
        },
        { status: 401 }
      )
    }

    const betslipId = params.id

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(betslipId)) {
      return NextResponse.json(
        { error: 'Invalid betslip ID format' },
        { status: 400 }
      )
    }

    // Parse request body
    const body = await request.json()
    const { is_public } = body

    if (typeof is_public !== 'boolean') {
      return NextResponse.json(
        { error: 'is_public must be a boolean value' },
        { status: 400 }
      )
    }

    // Check ownership
    const { data: betslip, error: fetchError } = await supabase
      .from('scanned_betslips')
      .select('user_id')
      .eq('id', betslipId)
      .single()

    if (fetchError || !betslip) {
      return NextResponse.json(
        { error: 'Betslip not found' },
        { status: 404 }
      )
    }

    if (betslip.user_id !== user.id) {
      return NextResponse.json(
        { error: 'Access denied - only the owner can update privacy settings' },
        { status: 403 }
      )
    }

    // Update the privacy status
    const { error: updateError } = await supabase
      .from('scanned_betslips')
      .update({ 
        is_public,
        updated_at: new Date().toISOString()
      })
      .eq('id', betslipId)

    if (updateError) {
      console.error('Error updating betslip privacy:', updateError)
      return NextResponse.json(
        { error: 'Failed to update privacy setting' },
        { status: 500 }
      )
    }

    console.log(`✅ Updated betslip ${betslipId} privacy to ${is_public ? 'public' : 'private'}`)

    return NextResponse.json({
      success: true,
      data: {
        betslipId,
        is_public,
        updated_at: new Date().toISOString()
      }
    })

  } catch (error) {
    console.error('Error in PATCH /api/betslip-scanner/[id]:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
} 