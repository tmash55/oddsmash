import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/libs/supabase/server'

interface HistoryParams {
  page?: number
  limit?: number
  type?: 'all' | 'scanned' | 'created'
  status?: 'all' | 'active' | 'settled' | 'void'
  search?: string
}

export async function GET(request: NextRequest) {
  try {
    // Get authenticated user
    const supabase = createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      console.log('❌ Authentication failed for betslip history')
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    console.log(`📚 Fetching betslip history for user: ${user.id}`)

    // Parse query parameters
    const { searchParams } = new URL(request.url)
    const params: HistoryParams = {
      page: parseInt(searchParams.get('page') || '1'),
      limit: parseInt(searchParams.get('limit') || '20'),
      type: (searchParams.get('type') as 'all' | 'scanned' | 'created') || 'all',
      status: (searchParams.get('status') as 'all' | 'active' | 'settled' | 'void') || 'all',
      search: searchParams.get('search') || undefined
    }

    console.log('📋 Query parameters:', params)

    // Calculate offset for pagination
    const offset = ((params.page || 1) - 1) * (params.limit || 20)

    // Fetch both scanned and finalized betslips
    const promises = []

    // Fetch scanned betslips if type allows
    if (params.type === 'all' || params.type === 'scanned') {
      let scannedQuery = supabase
        .from('scanned_betslips')
        .select(`
          id,
          title,
          sportsbook,
          total_selections,
          scanned_at,
          is_public,
          status,
          scan_confidence,
          scanned_betslip_selections!scanned_betslip_id (
            id,
            player_name,
            market,
            line,
            bet_type
          )
        `)
        .eq('user_id', user.id)
        .order('scanned_at', { ascending: false })

      // Apply search filter
      if (params.search) {
        scannedQuery = scannedQuery.or(`title.ilike.%${params.search}%,sportsbook.ilike.%${params.search}%`)
      }

      // Apply status filter
      if (params.status && params.status !== 'all') {
        scannedQuery = scannedQuery.eq('status', params.status)
      }

      promises.push(scannedQuery)
    } else {
      promises.push(Promise.resolve({ data: [], error: null }))
    }

    // Fetch finalized betslips if type allows
    if (params.type === 'all' || params.type === 'created') {
      let finalizedQuery = supabase
        .from('finalized_betslips')
        .select(`
          id,
          title,
          total_selections,
          created_at,
          is_public,
          status,
          sportsbook,
          finalized_betslip_selections!finalized_betslip_id (
            id,
            player_name,
            market,
            line,
            selection,
            bet_type
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      // Apply search filter
      if (params.search) {
        finalizedQuery = finalizedQuery.ilike('title', `%${params.search}%`)
      }

      // Apply status filter
      if (params.status && params.status !== 'all') {
        finalizedQuery = finalizedQuery.eq('status', params.status)
      }

      promises.push(finalizedQuery)
    } else {
      promises.push(Promise.resolve({ data: [], error: null }))
    }

    // Execute queries in parallel
    const [scannedResult, finalizedResult] = await Promise.all(promises)

    if (scannedResult.error) {
      console.error('❌ Error fetching scanned betslips:', scannedResult.error)
      throw scannedResult.error
    }

    if (finalizedResult.error) {
      console.error('❌ Error fetching finalized betslips:', finalizedResult.error)
      throw finalizedResult.error
    }

    // Transform and combine results
    const scannedBetslips = (scannedResult.data || []).map(betslip => ({
      id: betslip.id,
      title: betslip.title || `Scanned Betslip (${betslip.total_selections} picks)`,
      type: 'scanned' as const,
      sportsbook: betslip.sportsbook,
      totalSelections: betslip.total_selections,
      createdAt: betslip.scanned_at,
      isPublic: betslip.is_public || false,
      status: betslip.status || 'active',
      scanConfidence: betslip.scan_confidence,
      selections: betslip.scanned_betslip_selections || []
    }))

    const finalizedBetslips = (finalizedResult.data || []).map(betslip => ({
      id: betslip.id,
      title: betslip.title || `Custom Betslip (${betslip.total_selections} picks)`,
      type: 'created' as const,
      sportsbook: betslip.sportsbook,
      totalSelections: betslip.total_selections,
      createdAt: betslip.created_at,
      isPublic: betslip.is_public || false,
      status: betslip.status || 'active',
      scanConfidence: undefined as number | undefined,
      selections: betslip.finalized_betslip_selections || []
    }))

    // Combine and sort by creation date
    const allBetslips = [...scannedBetslips, ...finalizedBetslips]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

    // Apply pagination
    const paginatedBetslips = allBetslips.slice(offset, offset + (params.limit || 20))

    console.log(`✅ Fetched ${allBetslips.length} total betslips (${scannedBetslips.length} scanned, ${finalizedBetslips.length} created)`)
    console.log(`📄 Returning page ${params.page} with ${paginatedBetslips.length} items`)

    return NextResponse.json({
      success: true,
      data: {
        betslips: paginatedBetslips,
        pagination: {
          page: params.page || 1,
          limit: params.limit || 20,
          total: allBetslips.length,
          totalPages: Math.ceil(allBetslips.length / (params.limit || 20)),
          hasNext: offset + (params.limit || 20) < allBetslips.length,
          hasPrev: (params.page || 1) > 1
        },
        summary: {
          totalBetslips: allBetslips.length,
          scannedCount: scannedBetslips.length,
          createdCount: finalizedBetslips.length,
          publicCount: allBetslips.filter(b => b.isPublic).length,
          activeCount: allBetslips.filter(b => b.status === 'active').length,
          settledCount: allBetslips.filter(b => b.status === 'settled').length
        }
      }
    })

  } catch (error) {
    console.error('❌ Error fetching betslip history:', error)
    return NextResponse.json(
      { 
        error: 'Failed to fetch betslip history',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}