"use server";

import { createClient } from "@/libs/supabase/server";
import { Betslip, BetslipSelection } from "@/types/betslip";

export async function createBetslipForUser(userId: string, title?: string, isDefault: boolean = false): Promise<Betslip | null> {
  try {
    const supabase = createClient();
    
    const { data, error } = await supabase
      .rpc('create_betslip_for_user', {
        p_user_id: userId,
        p_title: title,
        p_is_default: isDefault
      });

    if (error) {
      console.error("Error creating betslip:", error);
      return null;
    }

    return { ...data, selections: [] };
  } catch (err) {
    console.error("Error in createBetslipForUser:", err);
    return null;
  }
}

export async function updateBetslipTitle(betslipId: string, title: string): Promise<Betslip | null> {
  try {
    const supabase = createClient();
    
    const { data, error } = await supabase
      .rpc('update_betslip_title', {
        p_betslip_id: betslipId,
        p_title: title
      });

    if (error) {
      console.error("Error updating betslip title:", error);
      return null;
    }

    return data;
  } catch (err) {
    console.error("Error in updateBetslipTitle:", err);
    return null;
  }
}

export async function setBetslipAsDefault(betslipId: string): Promise<Betslip | null> {
  try {
    const supabase = createClient();
    
    const { data, error } = await supabase
      .rpc('set_betslip_as_default', {
        p_betslip_id: betslipId
      });

    if (error) {
      console.error("Error setting betslip as default:", error);
      return null;
    }

    return data;
  } catch (err) {
    console.error("Error in setBetslipAsDefault:", err);
    return null;
  }
}

export async function getBetslipsForUser(userId: string): Promise<Betslip[]> {
  try {
    const supabase = createClient();
    
    const { data, error } = await supabase
      .rpc('get_betslips_for_user', {
        p_user_id: userId
      });

    if (error) {
      console.error("Error fetching betslips:", error);
      return [];
    }

    return data || [];
  } catch (err) {
    console.error("Error in getBetslipsForUser:", err);
    return [];
  }
}

export async function deleteBetslip(betslipId: string): Promise<boolean> {
  try {
    const supabase = createClient();
    
    const { data, error } = await supabase
      .rpc('delete_betslip', {
        p_betslip_id: betslipId
      });

    if (error) {
      console.error("Error deleting betslip:", error);
      return false;
    }

    return data;
  } catch (err) {
    console.error("Error in deleteBetslip:", err);
    return false;
  }
}

export async function addSelectionToBetslip(
  betslipId: string,
  selection: Omit<BetslipSelection, "id" | "betslip_id" | "created_at" | "updated_at">
): Promise<BetslipSelection | null> {
  try {
    console.log("[BetslipService] Adding selection to betslip:", { betslipId, selection })
    console.log("[BetslipService] Selection odds_data:", selection.odds_data)

    const supabase = createClient();
    
    // Determine bet_type and market_type based on selection
    const bet_type = selection.player_name ? 'player_prop' : 'standard';
    const market_type = selection.player_name ? 'player_prop' : 
                       selection.market_key.includes('spread') ? 'spread' :
                       selection.market_key.includes('moneyline') ? 'moneyline' : 'total';
    
    console.log("[BetslipService] Determined bet types:", { bet_type, market_type })
    
    const { data, error } = await supabase
      .rpc('add_selection_to_betslip', {
        p_betslip_id: betslipId,
        p_event_id: selection.event_id,
        p_sport_key: selection.sport_key,
        p_commence_time: selection.commence_time,
        p_home_team: selection.home_team,
        p_away_team: selection.away_team,
        p_bet_type: bet_type,
        p_market_type: market_type,
        p_market_key: selection.market_key,
        p_market_display: selection.market_display || selection.market_key.split(',')[0],
        p_selection: selection.selection,
        p_player_name: selection.player_name,
        p_player_team: selection.player_team,
        p_line: selection.line,
        p_odds_data: selection.odds_data
      });

    if (error) {
      console.error("[BetslipService] Error adding selection to betslip:", error)
      return null;
    }

    console.log("[BetslipService] Successfully added selection. Response data:", data)
    return data;
  } catch (err) {
    console.error("[BetslipService] Error in addSelectionToBetslip:", err);
    return null;
  }
}

export async function removeSelectionFromBetslip(selectionId: string): Promise<boolean> {
  try {
    const supabase = createClient();
    
    const { data, error } = await supabase
      .rpc('remove_selection_from_betslip', {
        p_selection_id: selectionId
      });

    if (error) {
      console.error("Error removing selection from betslip:", error);
      return false;
    }

    return data;
  } catch (err) {
    console.error("Error in removeSelectionFromBetslip:", err);
    return false;
  }
}

export async function clearBetslip(betslipId: string): Promise<void> {
  try {
    const supabase = createClient();
    
    const { error } = await supabase
      .rpc('clear_betslip', {
        p_betslip_id: betslipId
      });

    if (error) {
      console.error("Error clearing betslip:", error);
      throw error;
    }
  } catch (err) {
    console.error("Error in clearBetslip:", err);
    throw err;
  }
}

export async function replaceBetslipSelection(
  oldSelectionId: string,
  betslipId: string,
  selection: Omit<BetslipSelection, "id" | "betslip_id" | "created_at" | "updated_at">
): Promise<BetslipSelection | null> {
  console.log('[BetslipService] Calling replaceBetslipSelection RPC with:', {
    oldSelectionId,
    betslipId,
    selection: {
      ...selection,
      odds_data: JSON.stringify(selection.odds_data, null, 2)
    }
  });

  try {
    const supabase = createClient();
    
    const { data, error } = await supabase
      .rpc('replace_betslip_selection', {
        p_old_selection_id: oldSelectionId,
        p_betslip_id: betslipId,
        p_event_id: selection.event_id,
        p_sport_key: selection.sport_key,
        p_commence_time: selection.commence_time,
        p_home_team: selection.home_team,
        p_away_team: selection.away_team,
        p_bet_type: selection.bet_type,
        p_market_type: selection.market_type,
        p_market_key: selection.market_key,
        p_selection: selection.selection,
        p_player_name: selection.player_name,
        p_player_team: selection.player_team,
        p_line: selection.line,
        p_odds_data: selection.odds_data
      });

    console.log('[BetslipService] RPC response:', { data, error });
    
    if (error) {
      console.error('[BetslipService] Error replacing selection:', error);
      return null;
    }
    
    return data;
  } catch (error) {
    console.error('[BetslipService] Unexpected error:', error);
    return null;
  }
} 