/**
 * Test script để kiểm tra giải pháp đồng bộ booking giữa ServiceRequest và SealUsageHistory
 * 
 * Quy trình test:
 * 1. Tạo ServiceRequest (không có booking_bill)
 * 2. Gán seal cho container
 * 3. Cập nhật booking_bill vào ServiceRequest
 * 4. Kiểm tra SealUsageHistory đã được cập nhật booking_number chưa
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:5002';
const API_KEY = 'your-api-key-here'; // Thay bằng API key thực tế

// Headers cho API calls
const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${API_KEY}`
};

async function testSealBookingSync() {
    console.log('🧪 Bắt đầu test đồng bộ booking giữa ServiceRequest và SealUsageHistory\n');

    try {
        // Step 1: Tạo ServiceRequest (không có booking_bill)
        console.log('📝 Step 1: Tạo ServiceRequest (không có booking_bill)');
        const createRequestData = {
            type: 'EXPORT',
            container_no: `TEST-${Date.now()}`,
            shipping_line_id: 'your-shipping-line-id', // Thay bằng ID thực tế
            container_type_id: 'your-container-type-id', // Thay bằng ID thực tế
            customer_id: 'your-customer-id', // Thay bằng ID thực tế
            // Không có booking_bill
        };

        const createResponse = await axios.post(`${BASE_URL}/requests/create`, createRequestData, { headers });
        const requestId = createResponse.data.data.id;
        const containerNo = createRequestData.container_no;

        console.log(`✅ Tạo ServiceRequest thành công: ${requestId}`);
        console.log(`📦 Container: ${containerNo}`);
        console.log(`📋 Booking: ${createResponse.data.data.booking_bill || 'null'}\n`);

        // Step 2: Gán seal cho container
        console.log('🔒 Step 2: Gán seal cho container');
        const sealData = {
            shipping_company: 'Test Shipping Company',
            seal_number: `SEAL-${Date.now()}`,
            container_number: containerNo,
            request_id: requestId
        };

        const sealResponse = await axios.post(`${BASE_URL}/seals/increment-exported`, sealData, { headers });
        console.log(`✅ Gán seal thành công: ${sealData.seal_number}`);
        console.log(`📊 Seal quantity exported: ${sealResponse.data.data.quantity_exported}\n`);

        // Step 3: Kiểm tra SealUsageHistory trước khi cập nhật booking
        console.log('🔍 Step 3: Kiểm tra SealUsageHistory trước khi cập nhật booking');
        const sealId = sealResponse.data.data.id;
        const historyBeforeResponse = await axios.get(`${BASE_URL}/seals/${sealId}/usage-history`, { headers });
        const historyBefore = historyBeforeResponse.data.data;

        console.log('📋 Lịch sử seal trước khi cập nhật booking:');
        historyBefore.forEach((item, index) => {
            console.log(`  ${index + 1}. Seal: ${item.seal_number}, Container: ${item.container_number}, Booking: ${item.booking_number || 'null'}`);
        });
        console.log('');

        // Step 4: Cập nhật booking_bill vào ServiceRequest
        console.log('📝 Step 4: Cập nhật booking_bill vào ServiceRequest');
        const bookingBill = `BOOKING-${Date.now()}`;
        const updateRequestData = {
            booking_bill: bookingBill
        };

        const updateResponse = await axios.patch(`${BASE_URL}/requests/${requestId}`, updateRequestData, { headers });
        console.log(`✅ Cập nhật booking thành công: ${bookingBill}\n`);

        // Step 5: Kiểm tra SealUsageHistory sau khi cập nhật booking
        console.log('🔍 Step 5: Kiểm tra SealUsageHistory sau khi cập nhật booking');
        const historyAfterResponse = await axios.get(`${BASE_URL}/seals/${sealId}/usage-history`, { headers });
        const historyAfter = historyAfterResponse.data.data;

        console.log('📋 Lịch sử seal sau khi cập nhật booking:');
        historyAfter.forEach((item, index) => {
            console.log(`  ${index + 1}. Seal: ${item.seal_number}, Container: ${item.container_number}, Booking: ${item.booking_number || 'null'}`);
        });
        console.log('');

        // Step 6: Kiểm tra kết quả
        console.log('✅ Step 6: Kiểm tra kết quả');
        const hasBookingUpdated = historyAfter.some(item => item.booking_number === bookingBill);
        
        if (hasBookingUpdated) {
            console.log('🎉 THÀNH CÔNG: Booking đã được đồng bộ vào SealUsageHistory!');
            console.log(`📋 Booking ${bookingBill} đã xuất hiện trong lịch sử seal`);
        } else {
            console.log('❌ THẤT BẠI: Booking chưa được đồng bộ vào SealUsageHistory');
            console.log('🔧 Có thể cần gọi API đồng bộ thủ công');
        }

        // Step 7: Test API đồng bộ thủ công (nếu cần)
        if (!hasBookingUpdated) {
            console.log('\n🔧 Step 7: Test API đồng bộ thủ công');
            try {
                const syncResponse = await axios.post(`${BASE_URL}/requests/${requestId}/sync-seal-booking`, {}, { headers });
                console.log(`✅ Đồng bộ thủ công thành công: ${syncResponse.data.message}`);
                
                // Kiểm tra lại lịch sử
                const historyFinalResponse = await axios.get(`${BASE_URL}/seals/${sealId}/usage-history`, { headers });
                const historyFinal = historyFinalResponse.data.data;
                
                console.log('📋 Lịch sử seal sau đồng bộ thủ công:');
                historyFinal.forEach((item, index) => {
                    console.log(`  ${index + 1}. Seal: ${item.seal_number}, Container: ${item.container_number}, Booking: ${item.booking_number || 'null'}`);
                });
            } catch (syncError) {
                console.log(`❌ Lỗi khi đồng bộ thủ công: ${syncError.response?.data?.message || syncError.message}`);
            }
        }

        console.log('\n🏁 Test hoàn thành!');

    } catch (error) {
        console.error('❌ Lỗi trong quá trình test:', error.response?.data || error.message);
    }
}

// Chạy test
if (require.main === module) {
    testSealBookingSync();
}

module.exports = { testSealBookingSync };
