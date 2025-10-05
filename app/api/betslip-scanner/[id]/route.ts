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
    const { is_public, title } = body

    // Validate input
    if (is_public !== undefined && typeof is_public !== 'boolean') {
      return NextResponse.json(
        { error: 'is_public must be a boolean value' },
        { status: 400 }
      )
    }

    if (title !== undefined && (typeof title !== 'string' || title.trim().length === 0)) {
      return NextResponse.json(
        { error: 'title must be a non-empty string' },
        { status: 400 }
      )
    }

    // Ensure at least one field is being updated
    if (is_public === undefined && title === undefined) {
      return NextResponse.json(
        { error: 'At least one field (is_public or title) must be provided' },
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
        { error: 'Access denied - only the owner can update betslip settings' },
        { status: 403 }
      )
    }

    // Prepare update object with only the fields being updated
    const updateData: any = {
      updated_at: new Date().toISOString()
    }

    if (is_public !== undefined) {
      updateData.is_public = is_public
    }

    if (title !== undefined) {
      updateData.title = title.trim()
    }

    // Update the betslip
    const { error: updateError } = await supabase
      .from('scanned_betslips')
      .update(updateData)
      .eq('id', betslipId)

    if (updateError) {
      console.error('Error updating betslip:', updateError)
      return NextResponse.json(
        { error: 'Failed to update betslip' },
        { status: 500 }
      )
    }

    const updateMessages = []
    if (is_public !== undefined) {
      updateMessages.push(`privacy to ${is_public ? 'public' : 'private'}`)
    }
    if (title !== undefined) {
      updateMessages.push(`title to "${title.trim()}"`)
    }

    console.log(`✅ Updated betslip ${betslipId} ${updateMessages.join(' and ')}`)

    return NextResponse.json({
      success: true,
      data: {
        betslipId,
        ...updateData
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