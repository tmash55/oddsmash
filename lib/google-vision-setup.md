# Google Vision API Setup Guide

## Step-by-Step Setup

### 1. Google Cloud Console
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable the Cloud Vision API:
   - Navigate to "APIs & Services" → "Library"
   - Search for "Cloud Vision API"
   - Click "Enable"

### 2. Create Service Account
1. Go to "APIs & Services" → "Credentials"
2. Click "Create Credentials" → "Service Account"
3. Fill in details:
   - **Name**: `oddsmash-vision-api`
   - **Description**: `Service account for betslip OCR processing`
4. Grant roles:
   - Add role: `Cloud Vision API Service Agent`
5. Create and download JSON key:
   - Click on the created service account
   - Go to "Keys" tab → "Add Key" → "Create new key" → "JSON"
   - Download the JSON file

### 3. Environment Variables

Add to your `.env.local` file:

```bash
# Option 1: Use service account key file (for local development)
GOOGLE_APPLICATION_CREDENTIALS=./path/to/your/service-account-key.json
GOOGLE_CLOUD_PROJECT_ID=your-project-id

# Option 2: Use service account key content (for deployment)
GOOGLE_CLOUD_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
GOOGLE_CLOUD_CLIENT_EMAIL=your-service-account@your-project.iam.gserviceaccount.com
GOOGLE_CLOUD_PROJECT_ID=your-project-id
```

### 4. Security Notes

- **Never commit** the service account JSON file to version control
- Add `*.json` to your `.gitignore` if using local key files
- For production, use environment variables instead of files
- Consider using Google Cloud IAM roles for more granular permissions

### 5. Testing

The API will automatically fall back to mock OCR if Google Vision API is not configured, so you can test the feature even without credentials.

### 6. Pricing

Google Vision API pricing (as of 2024):
- First 1,000 requests per month: **FREE**
- Additional requests: $1.50 per 1,000 requests
- Perfect for testing and moderate usage

### 7. Troubleshooting

Common issues:
- **"Credentials not found"**: Check file path and environment variables
- **"API not enabled"**: Ensure Cloud Vision API is enabled in Google Cloud Console
- **"Permission denied"**: Verify service account has correct roles
- **"Project not found"**: Check GOOGLE_CLOUD_PROJECT_ID matches your project 