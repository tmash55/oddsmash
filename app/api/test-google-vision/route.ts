import { NextRequest, NextResponse } from 'next/server';
import { ImageAnnotatorClient } from '@google-cloud/vision';
import { getGoogleCredentials, hasGoogleCredentials } from '@/lib/google-credentials-simple';

export async function GET(request: NextRequest) {
  try {
    console.log('🧪 Starting Google Vision API test...');

    // Step 1: Check if credentials are available
    console.log('Step 1: Checking if credentials are configured...');
    if (!hasGoogleCredentials()) {
      return NextResponse.json({
        success: false,
        error: 'Google credentials not configured',
        details: 'Missing required environment variables',
        requiredVars: ['GOOGLE_PROJECT_ID', 'GOOGLE_PRIVATE_KEY', 'GOOGLE_CLIENT_EMAIL']
      }, { status: 500 });
    }
    console.log('✅ Credentials check passed');

    // Step 2: Get credentials object
    console.log('Step 2: Getting credentials object...');
    let credentials;
    try {
      credentials = getGoogleCredentials();
      console.log('✅ Credentials object created successfully');
      console.log('📋 Credentials info:', {
        project_id: credentials.project_id,
        client_email: credentials.client_email,
        has_private_key: !!credentials.private_key,
        private_key_preview: credentials.private_key?.substring(0, 50) + '...',
      });
    } catch (error) {
      console.error('❌ Error getting credentials:', error);
      return NextResponse.json({
        success: false,
        error: 'Failed to create credentials object',
        details: error instanceof Error ? error.message : 'Unknown error'
      }, { status: 500 });
    }

    // Step 3: Initialize Vision client
    console.log('Step 3: Initializing Vision API client...');
    let visionClient;
    try {
      visionClient = new ImageAnnotatorClient({
        credentials,
        projectId: credentials.project_id
      });
      console.log('✅ Vision client initialized successfully');
    } catch (error) {
      console.error('❌ Error initializing Vision client:', error);
      return NextResponse.json({
        success: false,
        error: 'Failed to initialize Vision client',
        details: error instanceof Error ? error.message : 'Unknown error'
      }, { status: 500 });
    }

    // Step 4: Test basic Vision API call (document text detection)
    console.log('Step 4: Testing Vision API with sample text...');
    try {
      // Create a simple test image with text (base64 encoded small image)
      const testImageBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==';
      const testImageBuffer = Buffer.from(testImageBase64, 'base64');

      const [result] = await visionClient.textDetection({
        image: { content: new Uint8Array(testImageBuffer) },
      });

      console.log('✅ Vision API call completed successfully');
      console.log('📋 API Response:', {
        hasTextAnnotations: !!result.textAnnotations,
        annotationsCount: result.textAnnotations?.length || 0,
        fullText: result.fullTextAnnotation?.text || 'No text detected'
      });

      return NextResponse.json({
        success: true,
        message: 'Google Vision API test completed successfully',
        credentials: {
          project_id: credentials.project_id,
          client_email: credentials.client_email,
          has_private_key: !!credentials.private_key
        },
        apiTest: {
          callSuccessful: true,
          hasTextAnnotations: !!result.textAnnotations,
          annotationsCount: result.textAnnotations?.length || 0
        }
      });

    } catch (apiError) {
      console.error('❌ Vision API call failed:', apiError);
      return NextResponse.json({
        success: false,
        error: 'Vision API call failed',
        details: apiError instanceof Error ? apiError.message : 'Unknown API error',
        credentials: {
          project_id: credentials.project_id,
          client_email: credentials.client_email,
          has_private_key: !!credentials.private_key
        }
      }, { status: 500 });
    }

  } catch (error) {
    console.error('❌ Test failed with unexpected error:', error);
    return NextResponse.json({
      success: false,
      error: 'Unexpected test failure',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('🧪 Testing Google Vision API with uploaded image...');

    // Check credentials first
    if (!hasGoogleCredentials()) {
      return NextResponse.json({
        success: false,
        error: 'Google credentials not configured'
      }, { status: 500 });
    }

    // Get the image from form data
    const formData = await request.formData();
    const imageFile = formData.get('image') as File;
    
    if (!imageFile) {
      return NextResponse.json({
        success: false,
        error: 'No image file provided'
      }, { status: 400 });
    }

    console.log(`📷 Testing with image: ${imageFile.name} (${imageFile.size} bytes)`);

    // Convert to buffer
    const imageBuffer = Buffer.from(await imageFile.arrayBuffer());

    // Initialize Vision client
    const credentials = getGoogleCredentials();
    const visionClient = new ImageAnnotatorClient({
      credentials,
      projectId: credentials.project_id
    });

    // Test OCR extraction
    const [result] = await visionClient.textDetection({
      image: { content: new Uint8Array(imageBuffer) },
    });

    const extractedText = result.textAnnotations?.[0]?.description || '';
    
    console.log('✅ OCR extraction successful');
    console.log('📝 Extracted text length:', extractedText.length);
    console.log('📝 First 200 chars:', extractedText.substring(0, 200));

    return NextResponse.json({
      success: true,
      message: 'Image OCR test completed successfully',
      extractedText: extractedText,
      textLength: extractedText.length,
      preview: extractedText.substring(0, 500)
    });

  } catch (error) {
    console.error('❌ Image OCR test failed:', error);
    return NextResponse.json({
      success: false,
      error: 'Image OCR test failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 