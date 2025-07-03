// Test script to debug scanner API response
const fs = require('fs');
const FormData = require('form-data');
const fetch = require('node-fetch');

// Create a mock image file for testing
const testImagePath = 'test-betslip.png';
if (!fs.existsSync(testImagePath)) {
  // Create a simple 1x1 PNG for testing
  const pngData = Buffer.from([
    0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, // PNG signature
    0x00, 0x00, 0x00, 0x0D, // IHDR chunk length
    0x49, 0x48, 0x44, 0x52, // IHDR
    0x00, 0x00, 0x00, 0x01, // Width: 1
    0x00, 0x00, 0x00, 0x01, // Height: 1
    0x08, 0x02, 0x00, 0x00, 0x00, // Bit depth, color type, etc.
    0x90, 0x77, 0x53, 0xDE, // CRC
    0x00, 0x00, 0x00, 0x0C, // IDAT chunk length
    0x49, 0x44, 0x41, 0x54, // IDAT
    0x08, 0x99, 0x01, 0x01, 0x00, 0x00, 0x00, 0xFF, 0xFF, 0x00, 0x00, 0x00, 0x02, 0x00, 0x01, // Minimal image data
    0x00, 0x00, 0x00, 0x00, // IEND chunk length
    0x49, 0x45, 0x4E, 0x44, // IEND
    0xAE, 0x42, 0x60, 0x82  // CRC
  ]);
  fs.writeFileSync(testImagePath, pngData);
}

async function testScannerAPI() {
  try {
    console.log('🧪 Testing scanner API...');
    
    // Create form data
    const form = new FormData();
    form.append('image', fs.createReadStream(testImagePath), {
      filename: 'test-betslip.png',
      contentType: 'image/png'
    });

    // Make request to localhost
    const response = await fetch('http://localhost:3000/api/betslip-scanner/extract', {
      method: 'POST',
      body: form,
      headers: {
        // Add any authentication headers if needed
        ...form.getHeaders()
      }
    });

    console.log('📡 Response status:', response.status);
    console.log('📡 Response headers:', Object.fromEntries(response.headers.entries()));
    
    const responseText = await response.text();
    console.log('📡 Response body:', responseText);

    if (response.ok) {
      try {
        const data = JSON.parse(responseText);
        console.log('✅ Parsed response data:');
        console.log('- Success:', data.success);
        console.log('- Saved Betslip ID:', data.data?.savedBetslipId);
        console.log('- Sportsbook:', data.data?.sportsbook);
        console.log('- Total selections:', data.data?.totalSelections);
        
        if (data.data?.savedBetslipId) {
          console.log('🎯 REDIRECT URL:', `/betslip/${data.data.savedBetslipId}`);
        } else {
          console.log('❌ NO SAVED BETSLIP ID - This is the issue!');
        }
      } catch (parseError) {
        console.error('❌ Failed to parse JSON response:', parseError);
      }
    } else {
      console.error('❌ API request failed');
    }

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testScannerAPI(); 