#!/usr/bin/env node

console.log(`
=================================================
SETUP UPSTASH CRON JOBS FOR NBA DATA FETCHING
=================================================

Follow these steps to set up cron jobs using Upstash:

1. Sign up for an Upstash account at https://upstash.com/ if you haven't already

2. Install the Upstash CLI:
   npm install -g @upstash/cli

3. Login to Upstash:
   upstash login

4. Deploy your cron jobs using the upstash.json configuration:
   upstash cron deploy

5. Verify that your cron jobs are running:
   upstash cron list

The cron job should now run every 5 minutes to fetch and cache NBA data.

Make sure you've configured the CRON_SECRET environment variable 
in your .env.local file and in your deployment environment.

For Vercel, add the CRON_SECRET environment variable in your 
project settings under Settings > Environment Variables.

=================================================
`); 