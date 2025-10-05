module.exports = {
  apps: [
    {
      name: 'ev-scanner-cron',
      script: 'scripts/ev-scanner-cron.js',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',
      cron_restart: '*/5 * * * *', // Run every 5 minutes
      env: {
        NODE_ENV: 'production',
      },
    },
  ],
}; 