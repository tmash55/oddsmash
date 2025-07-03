import { sportsbooks } from "@/data/sportsbooks"

// Types for sportsbook parameters
export interface ParlayLeg {
  eventId?: string
  marketId?: string
  selectionId?: string
  sid?: string
  link?: string
}

export interface SportsbookLinkParams {
  state?: string
  legs?: ParlayLeg[]
  wagerAmount?: string
}

// Helper function to encode SIDs properly
const encodeSid = (sid: string): string => {
  return sid.replace(/#/g, "%23")
}

// FanDuel parlay link generator
export function createFanduelParlayLink(params: SportsbookLinkParams): string {
  const { legs = [] } = params
  const baseUrl = "https://ia.sportsbook.fanduel.com/addToBetslip"
  
  // If no legs, return base URL
  if (legs.length === 0) {
    return "https://sportsbook.fanduel.com/"
  }

  const urlParams: string[] = []
  legs.forEach((leg, index) => {
    if (leg.marketId && leg.selectionId) {
      urlParams.push(`marketId[${index}]=${leg.marketId}`)
      urlParams.push(`selectionId[${index}]=${leg.selectionId}`)
    }
  })

  return urlParams.length > 0 ? `${baseUrl}?${urlParams.join("&")}` : "https://sportsbook.fanduel.com/"
}

// DraftKings parlay link generator
export function createDraftkingsLink(params: SportsbookLinkParams): string {
  const { legs = [] } = params
  
  // If no legs, return base URL
  if (legs.length === 0) {
    return "https://sportsbook.draftkings.com/"
  }

  // Use the first leg's event ID as the base
  const baseEventId = legs[0]?.eventId || ""
  const sids = legs.map(leg => leg.sid).filter(Boolean)

  if (!baseEventId || sids.length === 0) {
    return "https://sportsbook.draftkings.com/"
  }

  return `https://sportsbook.draftkings.com/event/${baseEventId}?outcomes=${sids.map(encodeSid).join("+")}`
}

// Caesars parlay link generator
export function createCaesarsLink(params: SportsbookLinkParams): string {
  const { legs = [], state = "nj" } = params
  
  // If no legs, return base URL
  if (legs.length === 0) {
    return "https://www.caesars.com/sportsbook-and-casino"
  }

  const sids = legs
    .filter(leg => leg.sid)
    .map(leg => encodeSid(leg.sid!))

  return `https://sportsbook.caesars.com/us/${state.toLowerCase()}/bet/betslip?selectionIds=${sids.join("%2C")}`
}

// BetMGM link generator
export function createBetMGMLink(params: SportsbookLinkParams): string {
  const { state = "nj", legs = [] } = params
  
  // Base URL with state
  const baseUrl = `https://sports.${state.toLowerCase()}.betmgm.com/en/sports`
  
  // If we have legs with SIDs, try to use them for deep linking
  if (legs.length > 0) {
    const sids = legs.filter(leg => leg.sid).map(leg => leg.sid)
    
    if (sids.length > 0) {
      // BetMGM uses a different format for deep linking - this is a placeholder
      // TODO: Research BetMGM's actual deep linking format
      console.log(`🔍 BetMGM SIDs available but deep linking format unknown:`, sids)
    }
    
    // If we have a specific link for single bet, use it
    if (legs.length === 1 && legs[0].link) {
      return legs[0].link.replace(/{state}/g, state.toLowerCase())
    }
  }
  
  return baseUrl
}

// BetRivers link generator
export function createBetRiversLink(params: SportsbookLinkParams): string {
  const { state = "nj", legs = [] } = params
  
  // Base URL with state
  const baseUrl = `https://${state.toLowerCase()}.betrivers.com/?page=sportsbook`
  
  // If we have legs with SIDs, try to use them for deep linking
  if (legs.length > 0) {
    const sids = legs.filter(leg => leg.sid).map(leg => leg.sid)
    
    if (sids.length > 0) {
      // BetRivers uses a different format for deep linking - this is a placeholder
      // TODO: Research BetRivers' actual deep linking format
      console.log(`🔍 BetRivers SIDs available but deep linking format unknown:`, sids)
    }
    
    // If we have a specific event and coupon, add them
    if (legs.length === 1 && legs[0].eventId) {
      let url = `${baseUrl}#event/${legs[0].eventId}`
      if (legs[0].sid) {
        url += `?coupon=${legs[0].sid}`
      }
      return url
    }
  }
  
  return baseUrl
}

// Bally Bet link generator
export function createBallyBetLink(params: SportsbookLinkParams): string {
  const { legs = [] } = params
  
  // Base URL
  const baseUrl = "https://play.ballybet.com/"
  
  // If we have legs with SIDs, try to use them for deep linking
  if (legs.length > 0) {
    const sids = legs.filter(leg => leg.sid).map(leg => leg.sid)
    
    if (sids.length > 0) {
      // Bally Bet deep linking format - this is a placeholder until we research their format
      // TODO: Research Bally Bet's actual deep linking format
      console.log(`🔍 Bally Bet SIDs available but deep linking format unknown:`, sids)
    }
    
    // If we have a specific link for single bet, use it
    if (legs.length === 1 && legs[0].link) {
      return legs[0].link
    }
  }
  
  return baseUrl
}

// Novig link generator
export function createNovigLink(params: SportsbookLinkParams): string {
  const { legs = [] } = params
  
  // Base App Store URL for Novig
  const baseUrl = "https://apps.apple.com/us/app/novig/id6443958997?mt=8"
  
  // Since Novig is a mobile app, we'll direct users to the App Store
  // Future enhancement: If Novig provides deep linking or web interface, we can update this
  if (legs.length > 0) {
    const sids = legs.filter(leg => leg.sid).map(leg => leg.sid)
    
    if (sids.length > 0) {
      // Novig deep linking format - placeholder until we research their deep linking capabilities
      // TODO: Research Novig's deep linking format when available
      console.log(`🔍 Novig SIDs available but deep linking format unknown:`, sids)
    }
    
    // If we have a specific link for single bet, use it
    if (legs.length === 1 && legs[0].link) {
      return legs[0].link
    }
  }
  
  return baseUrl
}

// Function to get base URL for sportsbooks without deep linking
export function getBaseSportsbookUrl(bookmaker: string, state?: string): string {
  const sportsbook = sportsbooks.find(sb => sb.id === bookmaker)
  if (!sportsbook?.url) return ""

  let url = sportsbook.url

  // Handle state-specific URLs
  if (sportsbook.requiresState && state) {
    if (bookmaker === "betmgm") {
      url = url.replace(/{state}/g, state.toLowerCase())
    } else if (bookmaker === "betrivers") {
      url = url.replace("{state}", state.toLowerCase())
    } else if (bookmaker === "williamhill_us" || bookmaker === "hardrockbet") {
      url = url.replace(/{state}/g, state.toLowerCase())
    }
  }

  return url
}

// Main function to generate sportsbook links
export function generateSportsbookUrl(bookmaker: string, params: SportsbookLinkParams): string {
  switch (bookmaker) {
    case "fanduel":
      return createFanduelParlayLink(params)
    case "draftkings":
      return createDraftkingsLink(params)
    case "williamhill_us":
      return createCaesarsLink(params)
    case "betmgm":
      return createBetMGMLink(params)
    case "betrivers":
      return createBetRiversLink(params)
    case "ballybet":
      return createBallyBetLink(params)
    case "novig":
      return createNovigLink(params)
    default:
      return getBaseSportsbookUrl(bookmaker, params.state)
  }
}

// Helper function to parse FanDuel link parameters
export function parseFanduelLink(link: string): ParlayLeg {
  try {
    const url = new URL(link)
    const params = new URLSearchParams(url.search)
    return {
      marketId: params.get("marketId") || params.get("marketId[0]") || undefined,
      selectionId: params.get("selectionId") || params.get("selectionId[0]") || undefined
    }
  } catch (e) {
    console.error("Error parsing FanDuel link:", e)
    return {}
  }
}

// Helper function to parse DraftKings link parameters
export function parseDraftkingsLink(link: string): ParlayLeg {
  try {
    const url = new URL(link)
    const eventId = url.pathname.split("/").pop() || ""
    const outcomes = url.searchParams.get("outcomes") || ""
    // Get the first SID if multiple exist
    const sid = outcomes.split("+")[0]
    return { eventId, sid }
  } catch (e) {
    console.error("Error parsing DraftKings link:", e)
    return {}
  }
} 