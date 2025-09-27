const axios = require('axios');

const API_BASE_URL = 'http://localhost:5002';

// Test script để verify logic seal tracking
async function testSealTracking() {
  try {
    console.log('🧪 Testing Seal Tracking Logic...\n');

    // 1. Tạo một seal mới cho hãng tàu test
    console.log('1. Creating test seal...');
    const createSealResponse = await axios.post(`${API_BASE_URL}/seals`, {
      shipping_company: 'ZIM Integrated Shipping Services',
      purchase_date: new Date().toISOString(),
      quantity_purchased: 100,
      unit_price: 50000,
      pickup_location: 'Hải Phòng'
    }, {
      headers: {
        'Authorization': 'Bearer YOUR_TOKEN_HERE', // Cần token thực tế
        'Content-Type': 'application/json'
      }
    });

    if (createSealResponse.data.success) {
      console.log('✅ Seal created successfully:', createSealResponse.data.data);
      const sealId = createSealResponse.data.data.id;
      
      // 2. Test increment exported quantity
      console.log('\n2. Testing increment exported quantity...');
      const incrementResponse = await axios.post(`${API_BASE_URL}/seals/increment-exported`, {
        shipping_company: 'ZIM Integrated Shipping Services'
      }, {
        headers: {
          'Authorization': 'Bearer YOUR_TOKEN_HERE',
          'Content-Type': 'application/json'
        }
      });

      if (incrementResponse.data.success) {
        console.log('✅ Exported quantity incremented successfully:', incrementResponse.data.data);
        
        // 3. Verify the seal was updated
        console.log('\n3. Verifying seal update...');
        const getSealResponse = await axios.get(`${API_BASE_URL}/seals/${sealId}`, {
          headers: {
            'Authorization': 'Bearer YOUR_TOKEN_HERE'
          }
        });

        if (getSealResponse.data.success) {
          const updatedSeal = getSealResponse.data.data;
          console.log('✅ Seal verification:');
          console.log(`   - Quantity purchased: ${updatedSeal.quantity_purchased}`);
          console.log(`   - Quantity exported: ${updatedSeal.quantity_exported}`);
          console.log(`   - Quantity remaining: ${updatedSeal.quantity_remaining}`);
          
          if (updatedSeal.quantity_exported === 1 && updatedSeal.quantity_remaining === 99) {
            console.log('🎉 Test PASSED! Seal tracking logic is working correctly.');
          } else {
            console.log('❌ Test FAILED! Seal quantities are incorrect.');
          }
        }
      }
    }

  } catch (error) {
    console.error('❌ Test failed with error:', error.response?.data || error.message);
  }
}

// Hướng dẫn sử dụng
console.log('📋 Seal Tracking Test Script');
console.log('============================');
console.log('This script tests the seal tracking logic:');
console.log('1. Creates a test seal for ZIM Integrated Shipping Services');
console.log('2. Increments the exported quantity');
console.log('3. Verifies the seal was updated correctly');
console.log('\n⚠️  Note: You need to replace YOUR_TOKEN_HERE with a valid JWT token');
console.log('   You can get a token by logging into the application and checking the browser\'s network tab.\n');

// Uncomment the line below to run the test
// testSealTracking();
