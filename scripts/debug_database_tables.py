import os
from supabase import create_client

# ── ENV VARS ────────────────────────────────────────────────────
SUPABASE_URL = os.environ["SUPABASE_URL"]
SUPABASE_KEY = os.environ["SUPABASE_KEY"]

# ── INIT CLIENTS ─────────────────────────────────────────
supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

def check_tables():
    """Check what tables exist in the database"""
    print("🔍 Checking available tables...")
    
    try:
        # Check if mlb_games table exists by trying to get its structure
        print("\n1. Checking mlb_games table:")
        result = supabase.table("mlb_games").select("*").limit(1).execute()
        print(f"✅ mlb_games table exists with {len(result.data)} sample records")
        if result.data:
            print(f"   Sample columns: {list(result.data[0].keys())}")
    except Exception as e:
        print(f"❌ mlb_games table error: {e}")
    
    try:
        # Check if mlb_players table exists
        print("\n2. Checking mlb_players table:")
        result = supabase.table("mlb_players").select("*").limit(1).execute()
        print(f"✅ mlb_players table exists with {len(result.data)} sample records")
        if result.data:
            print(f"   Sample columns: {list(result.data[0].keys())}")
    except Exception as e:
        print(f"❌ mlb_players table error: {e}")
    
    # Try some common table name variations for games
    game_table_variations = [
        "games", "mlb_game", "baseball_games", "events", "mlb_events"
    ]
    
    print("\n3. Checking common game table name variations:")
    for table_name in game_table_variations:
        try:
            result = supabase.table(table_name).select("*").limit(1).execute()
            print(f"✅ {table_name} table exists")
            if result.data:
                print(f"   Sample columns: {list(result.data[0].keys())}")
        except Exception as e:
            print(f"❌ {table_name} table not found")

def check_mlb_players_structure():
    """Check mlb_players table structure in detail"""
    print("\n🔍 Detailed mlb_players table check:")
    
    try:
        # Try different possible column names
        column_variations = [
            "player_id, full_name",
            "id, player_id, full_name", 
            "player_id, name",
            "id, name",
            "*"
        ]
        
        for columns in column_variations:
            try:
                result = supabase.table("mlb_players").select(columns).limit(1).execute()
                print(f"✅ Query with '{columns}' works")
                if result.data:
                    print(f"   Sample data: {result.data[0]}")
                break
            except Exception as e:
                print(f"❌ Query with '{columns}' failed: {e}")
                
    except Exception as e:
        print(f"❌ mlb_players detailed check error: {e}")

def check_mlb_teams_relation():
    """Check if mlb_teams relation exists"""
    print("\n🔍 Checking mlb_teams relation:")
    
    try:
        # Test the join that was in the original script
        result = (
            supabase
            .table("mlb_players")
            .select("player_id, full_name, mlb_teams(abbreviation)")
            .limit(1)
            .execute()
        )
        print("✅ mlb_teams relation works")
        if result.data:
            print(f"   Sample data: {result.data[0]}")
    except Exception as e:
        print(f"❌ mlb_teams relation error: {e}")
        
        # Try without the relation
        try:
            result = (
                supabase
                .table("mlb_players")
                .select("player_id, full_name")
                .limit(1)
                .execute()
            )
            print("✅ mlb_players without relation works")
            if result.data:
                print(f"   Sample data: {result.data[0]}")
        except Exception as e2:
            print(f"❌ Even basic mlb_players query failed: {e2}")

def main():
    print("🚀 Database Debug Script")
    print("=" * 50)
    
    check_tables()
    check_mlb_players_structure()
    check_mlb_teams_relation()
    
    print("\n" + "=" * 50)
    print("✅ Debug complete!")

if __name__ == "__main__":
    main() 