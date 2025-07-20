import { Metadata } from "next"
import { notFound, redirect } from "next/navigation"
import { createClient } from "@/libs/supabase/server"
import { BetslipView } from "@/components/betslip/betslip-view"
import { fetchHitRatesForSelections } from "@/lib/hit-rates-utils"

interface BetslipPageProps {
  params: {
    slug: string
  }
}

export async function generateMetadata({ params }: BetslipPageProps): Promise<Metadata> {
  const supabase = createClient()
  
  // First try to find a scanned betslip
  let { data: scannedBetslip } = await supabase
    .from('scanned_betslips')
    .select('sportsbook, total_selections, is_public')
    .eq('id', params.slug)
    .single()

  // If not found, try finalized betslips
  if (!scannedBetslip) {
    const { data: finalizedBetslip } = await supabase
      .from('finalized_betslips')
      .select('title, total_selections, is_public')
      .eq('id', params.slug)
      .single()

    if (finalizedBetslip) {
      const baseTitle = finalizedBetslip.title || `Custom Betslip (${finalizedBetslip.total_selections} picks)`
      const title = finalizedBetslip.is_public 
        ? `${baseTitle} | OddSmash`
        : `Private ${baseTitle} | OddSmash`

      return {
        title,
        description: finalizedBetslip.is_public 
          ? `View this shared betslip with ${finalizedBetslip.total_selections} selections and compare odds across sportsbooks.`
          : `View this private betslip with ${finalizedBetslip.total_selections} selections.`,
        openGraph: finalizedBetslip.is_public ? {
          title: baseTitle,
          description: `Check out this betslip with ${finalizedBetslip.total_selections} picks on OddSmash`,
          type: 'website',
        } : undefined,
      }
    }
  }

  if (scannedBetslip) {
    const baseTitle = `${scannedBetslip.sportsbook} Betslip (${scannedBetslip.total_selections} picks)`
    const title = scannedBetslip.is_public 
      ? `${baseTitle} | OddSmash`
      : `Private ${baseTitle} | OddSmash`

    return {
      title,
      description: scannedBetslip.is_public 
        ? `View this shared ${scannedBetslip.sportsbook} betslip with ${scannedBetslip.total_selections} selections and compare odds across sportsbooks.`
        : `View this private ${scannedBetslip.sportsbook} betslip with ${scannedBetslip.total_selections} selections.`,
      openGraph: scannedBetslip.is_public ? {
        title: baseTitle,
        description: `Check out this ${scannedBetslip.sportsbook} betslip with ${scannedBetslip.total_selections} picks on OddSmash`,
        type: 'website',
      } : undefined,
    }
  }

  return {
    title: "Betslip Not Found | OddSmash",
  }
}

export default async function BetslipPage({ params }: BetslipPageProps) {
  const supabase = createClient()
  
  // Check authentication (but don't require it for public betslips)
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  // Try to fetch scanned betslip first
  let { data: scannedBetslip, error: scannedError } = await supabase
    .from('scanned_betslips')
    .select(`
      *,
      scanned_betslip_selections (*)
    `)
    .eq('id', params.slug)
    .single()

  let isScanned = true
  let betslip = scannedBetslip
  let selections = scannedBetslip?.scanned_betslip_selections || []

  // If not a scanned betslip, try finalized betslips
  if (!scannedBetslip) {
    const { data: finalizedBetslip, error: finalizedError } = await supabase
      .from('finalized_betslips')
      .select(`
        *,
        finalized_betslip_selections (*)
      `)
      .eq('id', params.slug)
      .single()

    if (finalizedBetslip) {
      isScanned = false
      betslip = finalizedBetslip
      selections = finalizedBetslip.finalized_betslip_selections || []
    }
  }

  if (!betslip) {
    console.error('Error fetching betslip:', scannedError)
    notFound()
  }

  // Check access permissions
  const isOwner = user && betslip.user_id === user.id
  const isPublic = betslip.is_public === true

  if (!isOwner && !isPublic) {
    // Private betslip and not the owner
    if (!user) {
      // Redirect to sign-in for private betslips
      redirect('/sign-in')
    }
    
    console.log(`Access denied: User ${user.id} tried to access private betslip owned by ${betslip.user_id}`)
    notFound()
  }

  // Get hit rates data - use existing data if available, otherwise fetch dynamically
  let hitRatesData = betslip.hit_rates_data
  
  if (!hitRatesData && selections.length > 0) {
    try {
      console.log('🔄 Fetching hit rates dynamically for betslip:', params.slug)
      hitRatesData = await fetchHitRatesForSelections(selections)
      console.log('✅ Dynamic hit rates fetched:', Object.keys(hitRatesData).length, 'players')
    } catch (error) {
      console.error('❌ Error fetching dynamic hit rates:', error)
      hitRatesData = {}
    }
  }

  return (
    <BetslipView 
      betslip={betslip}
      selections={selections}
      user={user}
      hitRatesData={hitRatesData}
      isOwner={isOwner}
      isPublic={isPublic}
      isScanned={isScanned}
    />
  )
} 