import { NextRequest, NextResponse } from 'next/server';
import { getGoogleCredentials, hasGoogleCredentials } from '@/lib/google-credentials-simple';

export async function GET(request: NextRequest) {
  try {
    // Check if credentials are configured
    if (!hasGoogleCredentials()) {
      return NextResponse.json(
        { error: 'Google credentials not configured' },
        { status: 500 }
      );
    }

    // Get the credentials
    const credentials = getGoogleCredentials();

    // Example: Using with Google Auth Library (most basic usage)
    const { GoogleAuth } = await import('google-auth-library');
    const auth = new GoogleAuth({
      credentials,
      scopes: ['https://www.googleapis.com/auth/cloud-platform']
    });

    // Get an access token to verify credentials work
    const authClient = await auth.getClient();
    const accessToken = await authClient.getAccessToken();

    // Example: Using with Google Sheets API (uncomment when googleapis is installed)
    // const { google } = await import('googleapis');
    // const sheets = google.sheets({ version: 'v4', auth });
    // const result = await sheets.spreadsheets.values.get({
    //   spreadsheetId: 'your_spreadsheet_id',
    //   range: 'Sheet1!A1:B10',
    // });

    // Example: Using with Google Cloud Storage (uncomment when @google-cloud/storage is installed)
    // const { Storage } = await import('@google-cloud/storage');
    // const storage = new Storage({ credentials });
    // const [buckets] = await storage.getBuckets();

    return NextResponse.json({
      message: 'Google credentials loaded successfully',
      projectId: credentials.project_id,
      clientEmail: credentials.client_email,
      hasAccessToken: !!accessToken.token,
    });

  } catch (error) {
    console.error('Google API error:', error);
    return NextResponse.json(
      { error: 'Failed to use Google services', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 