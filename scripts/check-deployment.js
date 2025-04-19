#!/usr/bin/env node

/**
 * KOTP Deployment Checklist
 * 
 * This script displays a checklist of items to verify before deploying
 * or after deployment to ensure everything is set up correctly.
 */

console.log(`
=====================================================
📋 KOTP DEPLOYMENT CHECKLIST
=====================================================

✅ AUTOMATED SETUP
   ✓ QStash schedule created for: https://oddsmash.io/api/kotp/cron/update-cache
   ✓ Schedule ID: scd_6qdEW7XQyeS9kkY77kdEwy4GUFGr

🔍 BEFORE DEPLOYING TO VERCEL
   [ ] Add CRON_SECRET in Vercel environment variables
       → Value should match what you used in QStash URL (test123)
   [ ] Ensure Redis connection string is configured in Vercel
   
🔍 AFTER DEPLOYMENT
   [ ] Verify endpoint is responding:
       → Visit https://oddsmash.io/api/kotp/cron/update-cache?secret=test123
       → Should return JSON response with success message
   [ ] Check Upstash console to see if jobs are running
   [ ] Verify leaderboard is loading without timeouts:
       → Visit https://oddsmash.io/kotp
   
ℹ️ MONITORING & TROUBLESHOOTING
   - Check Vercel logs for any API errors
   - Check Upstash QStash dashboard for delivery status
   - If needed, manually trigger the endpoint:
     curl "https://oddsmash.io/api/kotp/cron/update-cache?secret=test123"
   
=====================================================
`); 