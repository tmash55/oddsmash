import os
from supabase import create_client
from datetime import datetime, timedelta

SUPABASE_URL = os.environ["SUPABASE_URL"]
SUPABASE_KEY = os.environ["SUPABASE_KEY"]
BATCH_SIZE = 5000  # Adjust this number based on your needs

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

def get_total_rows(table_name):
    try:
        response = supabase.table(table_name).select("*", count="exact").execute()
        return response.count if hasattr(response, 'count') else 0
    except Exception as e:
        print(f"❌ Error getting row count for {table_name}: {e}")
        return 0

def clear_table_in_batches(table_name, batch_size=BATCH_SIZE):
    print(f"🧹 Starting to clear `{table_name}` in batches...")
    
    total_rows = get_total_rows(table_name)
    if total_rows == 0:
        print(f"✅ Table {table_name} is already empty.")
        return

    print(f"📊 Total rows to delete: {total_rows}")
    deleted_count = 0
    
    try:
        while True:
            # Get IDs for the next batch
            response = supabase.table(table_name) \
                .select("id") \
                .limit(batch_size) \
                .execute()
            
            if not response.data:
                break
                
            batch_ids = [row['id'] for row in response.data]
            
            # Delete the batch
            supabase.table(table_name) \
                .delete() \
                .in_("id", batch_ids) \
                .execute()
            
            deleted_count += len(batch_ids)
            print(f"🗑️  Deleted {deleted_count}/{total_rows} rows...")
            
            if deleted_count >= total_rows:
                break
                
        print(f"✅ Successfully cleared {deleted_count} rows from `{table_name}`")
        
    except Exception as e:
        print(f"❌ Error during batch deletion for `{table_name}`: {e}")

def clear_old_records(table_name, days_to_keep=7):
    """Delete records older than specified days"""
    print(f"🧹 Clearing old records from `{table_name}`...")
    cutoff_date = (datetime.utcnow() - timedelta(days=days_to_keep)).isoformat()
    
    try:
        result = supabase.table(table_name) \
            .delete() \
            .lt("created_at", cutoff_date) \
            .execute()
            
        deleted_count = len(result.data) if hasattr(result, 'data') else 0
        print(f"✅ Deleted {deleted_count} old records from `{table_name}`")
        
    except Exception as e:
        print(f"❌ Error clearing old records from `{table_name}`: {e}")

def main():
    # Option 1: Clear entire tables in batches
    clear_table_in_batches("player_odds_history")
    clear_table_in_batches("player_hit_rate_profiles")
    
    # Option 2: Clear only old records (keep last 7 days)
    # clear_old_records("player_odds_history", days_to_keep=7)
    # clear_old_records("player_hit_rate_profiles", days_to_keep=7)

if __name__ == "__main__":
    main() 