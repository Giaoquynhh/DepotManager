const axios = require('axios');

const BASE_URL = 'http://localhost:5002';

// Test configuration
const testConfig = {
  depotCount: 3,
  slotsPerDepot: 15,
  tiersPerSlot: 4
};

async function testYardConfiguration() {
  try {
    console.log('🧪 Testing Yard Configuration APIs...\n');

    // 1. Test get current configuration
    console.log('1️⃣ Getting current configuration...');
    try {
      const configResponse = await axios.get(`${BASE_URL}/yard/configuration`);
      console.log('✅ Current configuration:', configResponse.data);
    } catch (error) {
      console.log('❌ Error getting configuration:', error.response?.data?.message || error.message);
    }

    // 2. Test configure yard
    console.log('\n2️⃣ Configuring yard with new settings...');
    console.log('Config:', testConfig);
    try {
      const configureResponse = await axios.post(`${BASE_URL}/yard/configure`, testConfig);
      console.log('✅ Configuration result:', configureResponse.data);
    } catch (error) {
      console.log('❌ Error configuring yard:', error.response?.data?.message || error.message);
    }

    // 3. Test get stack map after configuration
    console.log('\n3️⃣ Getting stack map after configuration...');
    try {
      const mapResponse = await axios.get(`${BASE_URL}/yard/stack/map`);
      const yards = mapResponse.data;
      console.log('✅ Stack map retrieved:');
      yards.forEach(yard => {
        console.log(`  Yard: ${yard.name} (${yard.code})`);
        yard.blocks.forEach(block => {
          console.log(`    Block: ${block.code} - ${block.slots.length} slots`);
          block.slots.forEach(slot => {
            console.log(`      Slot: ${slot.code} - Capacity: ${slot.tier_capacity} tiers`);
          });
        });
      });
    } catch (error) {
      console.log('❌ Error getting stack map:', error.response?.data?.message || error.message);
    }

    // 4. Test reset yard
    console.log('\n4️⃣ Resetting yard to default...');
    try {
      const resetResponse = await axios.post(`${BASE_URL}/yard/reset`);
      console.log('✅ Reset result:', resetResponse.data);
    } catch (error) {
      console.log('❌ Error resetting yard:', error.response?.data?.message || error.message);
    }

    // 5. Verify reset
    console.log('\n5️⃣ Verifying reset...');
    try {
      const mapResponse = await axios.get(`${BASE_URL}/yard/stack/map`);
      const yards = mapResponse.data;
      console.log('✅ Stack map after reset:');
      yards.forEach(yard => {
        console.log(`  Yard: ${yard.name} (${yard.code})`);
        yard.blocks.forEach(block => {
          console.log(`    Block: ${block.code} - ${block.slots.length} slots`);
        });
      });
    } catch (error) {
      console.log('❌ Error verifying reset:', error.response?.data?.message || error.message);
    }

    console.log('\n🎉 Yard Configuration test completed!');

  } catch (error) {
    console.error('💥 Test failed:', error.message);
  }
}

// Run the test
testYardConfiguration();
