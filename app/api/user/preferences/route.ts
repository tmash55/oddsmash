import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/libs/supabase/server";

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();
    
    // Get the current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch user preferences
    const { data: preferences, error } = await supabase
      .from("user_preferences")
      .select("*")
      .eq("id", user.id)
      .single();

    if (error && error.code !== "PGRST116") { // PGRST116 is "not found"
      console.error("Error fetching user preferences:", error);
      return NextResponse.json({ error: "Failed to fetch preferences" }, { status: 500 });
    }

    // If no preferences exist, return defaults
    if (!preferences) {
      return NextResponse.json({
        state_code: null,
        preferred_sportsbooks: [],
        onboarding_completed: false,
        favorite_sports: [],
        betting_style: null,
        experience_level: null,
        sportsbooks: []
      });
    }

    return NextResponse.json(preferences);
  } catch (error) {
    console.error("Error in GET /api/user/preferences:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = createClient();
    
    // Get the current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      state_code,
      preferred_sportsbooks,
      onboarding_completed,
      favorite_sports,
      betting_style,
      experience_level,
      sportsbooks
    } = body;

    // Upsert user preferences
    const { data, error } = await supabase
      .from("user_preferences")
      .upsert({
        id: user.id,
        state_code,
        preferred_sportsbooks: preferred_sportsbooks || [],
        onboarding_completed: onboarding_completed || false,
        favorite_sports: favorite_sports || [],
        betting_style,
        experience_level,
        sportsbooks: sportsbooks || [],
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error("Error updating user preferences:", error);
      return NextResponse.json({ error: "Failed to update preferences" }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error in PUT /api/user/preferences:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
} 