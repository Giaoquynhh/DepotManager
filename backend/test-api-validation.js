const axios = require('axios');

const API_BASE = 'http://localhost:1000';

async function testAPIContainerValidation() {
    try {
        console.log('🧪 TEST API CONTAINER VALIDATION');
        console.log('=' .repeat(50));

        const testContainerNo = 'API_TEST_123';
        const testToken = 'your_test_token_here'; // Cần token thực tế để test

        // Test Case 1: Kiểm tra container không tồn tại
        console.log('\n1. Test Case: Kiểm tra container không tồn tại');
        try {
            const checkResponse = await axios.get(`${API_BASE}/requests/check-container`, {
                params: { container_no: testContainerNo },
                headers: { Authorization: `Bearer ${testToken}` }
            });
            console.log(`   Response: ${checkResponse.data.success ? '✅' : '❌'}`);
            console.log(`   Message: ${checkResponse.data.message}`);
        } catch (error) {
            console.log(`   Error: ${error.response?.data?.message || error.message}`);
        }

        // Test Case 2: Tạo EXPORT request với status IN_CAR
        console.log('\n2. Test Case: Tạo EXPORT request với status IN_CAR');
        try {
            const exportData = {
                type: 'EXPORT',
                container_no: testContainerNo,
                status: 'IN_CAR',
                request_no: 'EXPORT_API_TEST_001',
                notes: 'Test export request'
            };

            const exportResponse = await axios.post(`${API_BASE}/requests`, exportData, {
                headers: { 
                    Authorization: `Bearer ${testToken}`,
                    'Content-Type': 'application/json'
                }
            });
            console.log(`   ✅ Đã tạo EXPORT request: ${exportResponse.data.data?.id}`);
        } catch (error) {
            console.log(`   ❌ Lỗi tạo EXPORT request: ${error.response?.data?.message || error.message}`);
        }

        // Test Case 3: Thử tạo IMPORT request khi có EXPORT với status IN_CAR
        console.log('\n3. Test Case: Thử tạo IMPORT request khi có EXPORT với status IN_CAR');
        try {
            const importData = {
                type: 'IMPORT',
                container_no: testContainerNo,
                status: 'PENDING',
                request_no: 'IMPORT_API_TEST_001',
                notes: 'Test import request'
            };

            const importResponse = await axios.post(`${API_BASE}/requests`, importData, {
                headers: { 
                    Authorization: `Bearer ${testToken}`,
                    'Content-Type': 'application/json'
                }
            });
            console.log(`   ❌ Không nên tạo được IMPORT request: ${importResponse.data.data?.id}`);
        } catch (error) {
            console.log(`   ✅ Đúng rồi, bị từ chối: ${error.response?.data?.message || error.message}`);
        }

        // Test Case 4: Cập nhật EXPORT request thành GATE_OUT
        console.log('\n4. Test Case: Cập nhật EXPORT request thành GATE_OUT');
        try {
            // Cần lấy ID của EXPORT request để update
            const listResponse = await axios.get(`${API_BASE}/requests`, {
                params: { 
                    container_no: testContainerNo,
                    type: 'EXPORT'
                },
                headers: { Authorization: `Bearer ${testToken}` }
            });
            
            if (listResponse.data.data && listResponse.data.data.length > 0) {
                const exportRequestId = listResponse.data.data[0].id;
                
                const updateResponse = await axios.put(`${API_BASE}/requests/${exportRequestId}`, {
                    status: 'GATE_OUT'
                }, {
                    headers: { 
                        Authorization: `Bearer ${testToken}`,
                        'Content-Type': 'application/json'
                    }
                });
                console.log(`   ✅ Đã cập nhật EXPORT request thành GATE_OUT`);
            }
        } catch (error) {
            console.log(`   ❌ Lỗi cập nhật EXPORT request: ${error.response?.data?.message || error.message}`);
        }

        // Test Case 5: Thử tạo IMPORT request sau khi EXPORT đã GATE_OUT
        console.log('\n5. Test Case: Thử tạo IMPORT request sau khi EXPORT đã GATE_OUT');
        try {
            const importData = {
                type: 'IMPORT',
                container_no: testContainerNo,
                status: 'PENDING',
                request_no: 'IMPORT_API_TEST_002',
                notes: 'Test import request after gate out'
            };

            const importResponse = await axios.post(`${API_BASE}/requests`, importData, {
                headers: { 
                    Authorization: `Bearer ${testToken}`,
                    'Content-Type': 'application/json'
                }
            });
            console.log(`   ✅ Đã tạo thành công IMPORT request: ${importResponse.data.data?.id}`);
        } catch (error) {
            console.log(`   ❌ Lỗi tạo IMPORT request: ${error.response?.data?.message || error.message}`);
        }

        // Test Case 6: Thử tạo IMPORT request thứ 2
        console.log('\n6. Test Case: Thử tạo IMPORT request thứ 2');
        try {
            const importData = {
                type: 'IMPORT',
                container_no: testContainerNo,
                status: 'PENDING',
                request_no: 'IMPORT_API_TEST_003',
                notes: 'Test second import request'
            };

            const importResponse = await axios.post(`${API_BASE}/requests`, importData, {
                headers: { 
                    Authorization: `Bearer ${testToken}`,
                    'Content-Type': 'application/json'
                }
            });
            console.log(`   ❌ Không nên tạo được IMPORT request thứ 2: ${importResponse.data.data?.id}`);
        } catch (error) {
            console.log(`   ✅ Đúng rồi, bị từ chối: ${error.response?.data?.message || error.message}`);
        }

        console.log('\n✅ API Test hoàn thành!');

    } catch (error) {
        console.error('❌ API Test error:', error.message);
    }
}

// Chạy test
testAPIContainerValidation();
