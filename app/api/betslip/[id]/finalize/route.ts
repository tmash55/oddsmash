import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/libs/supabase/server"

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient()
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const betslipId = params.id

    // Fetch the betslip with its selections
    const { data: betslip, error: betslipError } = await supabase
      .from('betslips')
      .select(`
        *,
        betslip_selections (*)
      `)
      .eq('id', betslipId)
      .eq('user_id', user.id)
      .single()

    if (betslipError || !betslip) {
      return NextResponse.json({ error: "Betslip not found" }, { status: 404 })
    }

    if (!betslip.betslip_selections || betslip.betslip_selections.length === 0) {
      return NextResponse.json({ error: "No selections to finalize" }, { status: 400 })
    }

    // For now, we'll use the existing odds data and simulate live odds fetching
    // In production, you'd fetch live odds from your odds API
    const selectionsWithLiveOdds = betslip.betslip_selections.map((selection: any) => ({
      ...selection,
      live_odds_data: selection.odds_data, // Using current odds as "live" odds for now
      original_odds_data: selection.odds_data
    }))

    // Create finalized betslip record
    const { data: finalizedBetslip, error: finalizedError } = await supabase
      .from('finalized_betslips')
      .insert({
        user_id: user.id,
        original_betslip_id: betslipId,
        title: betslip.title,
        notes: betslip.notes,
        total_selections: betslip.betslip_selections.length,
        finalized_at: new Date().toISOString(),
        last_odds_refresh: new Date().toISOString(),
        status: 'active',
        is_public: true // Default to public for finalized betslips
      })
      .select()
      .single()

    if (finalizedError) {
      console.error('Error creating finalized betslip:', finalizedError)
      return NextResponse.json({ error: "Failed to create finalized betslip" }, { status: 500 })
    }

    // Create finalized selections
    const finalizedSelections = selectionsWithLiveOdds.map((selection: any) => ({
      finalized_betslip_id: finalizedBetslip.id,
      event_id: selection.event_id,
      sport_key: selection.sport_key,
      commence_time: selection.commence_time,
      home_team: selection.home_team,
      away_team: selection.away_team,
      bet_type: selection.bet_type,
      market_type: selection.market_type,
      market_key: selection.market_key,
      selection: selection.selection,
      player_name: selection.player_name,
      player_team: selection.player_team,
      line: selection.line,
      finalized_odds_data: selection.live_odds_data,
      original_odds_data: selection.original_odds_data,
      status: 'active'
    }))

    const { data: insertedSelections, error: selectionsError } = await supabase
      .from('finalized_betslip_selections')
      .insert(finalizedSelections)
      .select()

    if (selectionsError) {
      console.error('Error creating finalized selections:', selectionsError)
      // Clean up the finalized betslip if selections failed
      await supabase
        .from('finalized_betslips')
        .delete()
        .eq('id', finalizedBetslip.id)
      
      return NextResponse.json({ error: "Failed to create finalized selections" }, { status: 500 })
    }

    // Calculate snapshot total odds
    let snapshotTotalOdds = null
    try {
      const odds = insertedSelections.map((sel: any) => {
        const oddsData = sel.finalized_odds_data
        if (oddsData && typeof oddsData === 'object') {
          // Find the best odds across all sportsbooks
          const allOdds = Object.values(oddsData).filter((odds: any) => 
            odds && typeof odds.odds === 'number'
          ).map((odds: any) => odds.odds)
          
          if (allOdds.length > 0) {
            return Math.max(...allOdds)
          }
        }
        return null
      }).filter(odds => odds !== null)

      if (odds.length === insertedSelections.length && odds.length > 0) {
        // Calculate parlay odds
        const totalDecimalOdds = odds.reduce((acc: number, americanOdds: number) => {
          const decimalOdds = americanOdds > 0 ? (americanOdds / 100) + 1 : (100 / Math.abs(americanOdds)) + 1
          return acc * decimalOdds
        }, 1)
        
        snapshotTotalOdds = totalDecimalOdds >= 2 
          ? Math.round((totalDecimalOdds - 1) * 100) 
          : Math.round(-100 / (totalDecimalOdds - 1))
      }
    } catch (error) {
      console.error('Error calculating snapshot odds:', error)
    }

    // Update finalized betslip with snapshot odds
    if (snapshotTotalOdds !== null) {
      await supabase
        .from('finalized_betslips')
        .update({ snapshot_total_odds: snapshotTotalOdds })
        .eq('id', finalizedBetslip.id)
    }

    return NextResponse.json({
      success: true,
      finalizedBetslipId: finalizedBetslip.id,
      selectionsCount: insertedSelections.length,
      snapshotOdds: snapshotTotalOdds
    })

  } catch (error) {
    console.error('Error finalizing betslip:', error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
} 