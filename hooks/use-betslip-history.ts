import { useQuery } from '@tanstack/react-query'
import { useAuth } from '@/components/auth/auth-provider'

interface BetslipSelection {
  id: string
  player_name: string
  market: string
  line: number
  selection?: string
  bet_type: string
}

interface BetslipHistoryItem {
  id: string
  title: string
  type: 'scanned' | 'created'
  sportsbook?: string
  totalSelections: number
  createdAt: string
  isPublic: boolean
  status: 'active' | 'settled' | 'void'
  scanConfidence?: number
  selections: BetslipSelection[]
}

interface BetslipHistoryParams {
  page?: number
  limit?: number
  type?: 'all' | 'scanned' | 'created'
  status?: 'all' | 'active' | 'settled' | 'void'
  search?: string
}

interface BetslipHistoryResponse {
  success: boolean
  data: {
    betslips: BetslipHistoryItem[]
    pagination: {
      page: number
      limit: number
      total: number
      totalPages: number
      hasNext: boolean
      hasPrev: boolean
    }
    summary: {
      totalBetslips: number
      scannedCount: number
      createdCount: number
      publicCount: number
      activeCount: number
      settledCount: number
    }
  }
}

async function fetchBetslipHistory(params: BetslipHistoryParams): Promise<BetslipHistoryResponse> {
  const searchParams = new URLSearchParams()
  
  if (params.page) searchParams.append('page', params.page.toString())
  if (params.limit) searchParams.append('limit', params.limit.toString())
  if (params.type && params.type !== 'all') searchParams.append('type', params.type)
  if (params.status && params.status !== 'all') searchParams.append('status', params.status)
  if (params.search) searchParams.append('search', params.search)

  const response = await fetch(`/api/user/betslip-history?${searchParams.toString()}`)
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.error || `HTTP error! status: ${response.status}`)
  }
  
  return response.json()
}

export function useBetslipHistory(params: BetslipHistoryParams) {
  const { user } = useAuth()
  
  return useQuery({
    queryKey: ['betslipHistory', user?.id, params],
    queryFn: () => fetchBetslipHistory(params),
    enabled: !!user,
    staleTime: 1000 * 60 * 2, // 2 minutes
    gcTime: 1000 * 60 * 10, // 10 minutes
    refetchOnWindowFocus: false,
  })
}

export type { BetslipHistoryItem, BetslipHistoryParams, BetslipHistoryResponse, BetslipSelection } 