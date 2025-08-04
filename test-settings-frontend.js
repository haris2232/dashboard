// Test script to run in browser console
async function testFrontendSettings() {
  console.log('🧪 Testing Frontend Settings API...\n');

  try {
    // Test 1: Get settings
    console.log('1. Testing GET /api/settings...');
    const getResponse = await fetch('/api/settings');
    const getData = await getResponse.json();
    console.log('✅ GET Response:', getData);
    console.log('Status:', getResponse.status);

    // Test 2: Update settings
    console.log('\n2. Testing POST /api/settings...');
    const updateData = {
      currency: "AED"
    };

    const postResponse = await fetch('/api/settings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updateData)
    });

    const postData = await postResponse.json();
    console.log('✅ POST Response:', postData);
    console.log('Status:', postResponse.status);

    console.log('\n🎉 Frontend tests completed!');

  } catch (error) {
    console.error('❌ Frontend test failed:', error.message);
  }
}

// Run the test
testFrontendSettings(); 