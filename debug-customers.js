// Debug script to test customer API
const testCustomerAPI = async () => {
  try {
    console.log('🧪 Testing Customer API...');
    
    // Test 1: Check if we can access localStorage
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    console.log('🔑 Token:', token ? 'Present' : 'Missing');
    console.log('👤 User:', user ? JSON.parse(user) : 'Missing');
    
    // Test 2: Try to fetch customers
    const response = await fetch('https://athlekt.com/backendnew/api/users/admin/all', {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` })
      }
    });
    
    console.log('📡 Response status:', response.status);
    console.log('📡 Response headers:', response.headers);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.log('❌ Error response:', errorText);
      return;
    }
    
    const data = await response.json();
    console.log('✅ Success response:', data);
    
    // Test 3: Map the data
    if (data.data) {
      const customers = data.data.map((user) => ({
        id: user._id,
        name: user.firstName || user.name || user.email,
        email: user.email,
        totalOrders: user.totalOrders || 0,
        totalSpent: user.totalSpent || 0,
        isBanned: user.isBanned || false,
        notes: user.notes || "",
        createdAt: user.createdAt
      }));
      
      console.log('👥 Mapped customers:', customers);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
};

// Run the test
testCustomerAPI(); 