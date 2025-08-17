// Test script to verify currency persistence
// Run this in browser console after setting currency

async function testCurrencyPersistence() {
  console.log('🧪 Testing Currency Persistence...\n');

  try {
    // Test 1: Check localStorage
    console.log('1. Checking localStorage...');
    const savedCurrency = localStorage.getItem('admin_currency');
    console.log('✅ Saved currency:', savedCurrency);

    // Test 2: Check backend settings
    console.log('\n2. Checking backend settings...');
    const response = await fetch('https://athlekt.com/backendnew/api/settings/public');
    const settings = await response.json();
    console.log('✅ Backend currency:', settings.currency);

    // Test 3: Check frontend website sync
    console.log('\n3. Checking frontend website...');
    try {
      const frontendResponse = await fetch('https://athlekt.com/api/settings');
      const frontendSettings = await frontendResponse.json();
      console.log('✅ Frontend currency:', frontendSettings.currency);
    } catch (error) {
      console.log('❌ Frontend not available:', error.message);
    }

    // Test 4: Simulate currency change
    console.log('\n4. Testing currency change...');
    const newCurrency = settings.currency === 'USD' ? 'AED' : 'USD';
    console.log('Changing currency to:', newCurrency);
    
    const updateResponse = await fetch('https://athlekt.com/backendnew/api/settings/currency', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        settingsData: JSON.stringify({ currency: newCurrency })
      }),
    });
    
    if (updateResponse.ok) {
      console.log('✅ Currency updated successfully');
      
      // Check if localStorage was updated
      setTimeout(() => {
        const updatedCurrency = localStorage.getItem('admin_currency');
        console.log('✅ Updated localStorage currency:', updatedCurrency);
      }, 1000);
    } else {
      console.log('❌ Failed to update currency');
    }

    console.log('\n🎉 Currency persistence test completed!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testCurrencyPersistence(); 
