const axios = require('axios');

// Test script để kiểm tra logic gợi ý container khi có trạng thái REJECTED
async function testContainerSuggestionWithRejected() {
    try {
        console.log('🧪 Testing Container Suggestion with REJECTED status...\n');

        // Test với một shipping line cụ thể
        const shippingLineId = 'your_shipping_line_id_here'; // Thay thế bằng ID thực tế
        
        console.log(`📡 Calling API: GET /containers/yard/by-shipping-line/${shippingLineId}`);
        
        const response = await axios.get(`http://localhost:5002/containers/yard/by-shipping-line/${shippingLineId}`, {
            headers: {
                'Content-Type': 'application/json',
                // Thêm Authorization header nếu cần
                // 'Authorization': 'Bearer YOUR_TOKEN_HERE'
            }
        });

        console.log('✅ API Response Status:', response.status);
        console.log('📊 Response Data:', JSON.stringify(response.data, null, 2));

        if (response.data.success && response.data.data) {
            const containers = response.data.data;
            console.log(`\n📦 Found ${containers.length} containers in yard`);
            
            // Tìm containers có note về REJECTED
            const rejectedContainers = containers.filter(container => 
                container.note && container.note.includes('hủy yêu cầu')
            );
            
            console.log(`🔄 Found ${rejectedContainers.length} containers that can be lifted again after rejection:`);
            rejectedContainers.forEach(container => {
                console.log(`  - ${container.container_no}: ${container.note}`);
                console.log(`    Location: ${container.block_code} - ${container.slot_code} (Tier ${container.tier})`);
                console.log(`    Quality: ${container.container_quality}`);
                console.log(`    Service Status: ${container.service_status}`);
                console.log('');
            });
        }

    } catch (error) {
        console.error('❌ Error testing container suggestion:', error.message);
        if (error.response) {
            console.error('Response Status:', error.response.status);
            console.error('Response Data:', error.response.data);
        }
    }
}

// Test với search query
async function testContainerSuggestionWithSearch() {
    try {
        console.log('\n🔍 Testing Container Suggestion with search query...\n');

        const shippingLineId = 'your_shipping_line_id_here'; // Thay thế bằng ID thực tế
        const searchQuery = 'IM'; // Tìm containers bắt đầu bằng "IM"
        
        console.log(`📡 Calling API: GET /containers/yard/by-shipping-line/${shippingLineId}?q=${searchQuery}`);
        
        const response = await axios.get(`http://localhost:5002/containers/yard/by-shipping-line/${shippingLineId}?q=${searchQuery}`, {
            headers: {
                'Content-Type': 'application/json',
                // Thêm Authorization header nếu cần
                // 'Authorization': 'Bearer YOUR_TOKEN_HERE'
            }
        });

        console.log('✅ API Response Status:', response.status);
        console.log('📊 Response Data:', JSON.stringify(response.data, null, 2));

    } catch (error) {
        console.error('❌ Error testing container suggestion with search:', error.message);
        if (error.response) {
            console.error('Response Status:', error.response.status);
            console.error('Response Data:', error.response.data);
        }
    }
}

// Chạy tests
async function runTests() {
    console.log('🚀 Starting Container Suggestion Tests for REJECTED containers...\n');
    
    await testContainerSuggestionWithRejected();
    await testContainerSuggestionWithSearch();
    
    console.log('\n✅ Tests completed!');
    console.log('\n📝 Instructions:');
    console.log('1. Replace "your_shipping_line_id_here" with actual shipping line ID');
    console.log('2. Add proper Authorization header if needed');
    console.log('3. Run: node test-container-suggestion-rejected.js');
    console.log('4. Check console logs for detailed information');
}

runTests();
