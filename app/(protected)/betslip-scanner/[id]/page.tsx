import { Metadata } from "next"
import { notFound, redirect } from "next/navigation"
import { createClient } from "@/libs/supabase/server"
import { ScannedBetslipView } from "@/components/betslip-scanner/scanned-betslip-view"

interface ScannedBetslipPageProps {
  params: {
    id: string
  }
}

export async function generateMetadata({ params }: ScannedBetslipPageProps): Promise<Metadata> {
  const supabase = createClient()
  
  // Get betslip data for metadata
  const { data: betslip } = await supabase
    .from('scanned_betslips')
    .select('sportsbook, total_selections, is_public')
    .eq('id', params.id)
    .single()

  if (!betslip) {
    return {
      title: "Betslip Not Found | OddSmash",
    }
  }

  const baseTitle = `${betslip.sportsbook} Betslip (${betslip.total_selections} picks)`
  const title = betslip.is_public 
    ? `${baseTitle} | OddSmash`
    : `Private ${baseTitle} | OddSmash`

  return {
    title,
    description: betslip.is_public 
      ? `View this shared ${betslip.sportsbook} betslip with ${betslip.total_selections} selections and compare odds across sportsbooks.`
      : `View this private ${betslip.sportsbook} betslip with ${betslip.total_selections} selections.`,
    openGraph: betslip.is_public ? {
      title: baseTitle,
      description: `Check out this ${betslip.sportsbook} betslip with ${betslip.total_selections} picks on OddSmash`,
      type: 'website',
    } : undefined,
  }
}

export default async function ScannedBetslipPage({ params }: ScannedBetslipPageProps) {
  const supabase = createClient()
  
  // Check authentication (but don't require it for public betslips)
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  // Fetch betslip data with selections
  const { data: betslip, error: betslipError } = await supabase
    .from('scanned_betslips')
    .select(`
      *,
      scanned_betslip_selections (*)
    `)
    .eq('id', params.id)
    .single()

  if (betslipError || !betslip) {
    console.error('Error fetching betslip:', betslipError)
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

  return (
    <ScannedBetslipView 
      betslip={betslip}
      selections={betslip.scanned_betslip_selections}
      user={user}
      hitRatesData={betslip.hit_rates_data}
      isOwner={isOwner}
      isPublic={isPublic}
    />
  )
} 