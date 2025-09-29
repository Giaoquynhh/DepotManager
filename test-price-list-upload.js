// Test script for Price List Excel upload API
const fs = require('fs');
const FormData = require('form-data');
const axios = require('axios');

async function testPriceListUpload() {
  try {
    console.log('Testing Price List Excel Upload API...');
    
    // Create a sample Excel file content (CSV format for simplicity)
    const sampleData = [
      ['Mã dịch vụ', 'Tên dịch vụ', 'Loại hình', 'Giá', 'Ghi chú'],
      ['DV001', 'Nâng container 20GP lên xe', 'Nâng', '350000', 'Thời gian thực hiện: 15-20 phút'],
      ['DV002', 'Hạ container 40GP xuống bãi', 'Hạ', '450000', 'Bao gồm vận chuyển đến vị trí'],
      ['DV003', 'Tôn sửa cửa container', 'Tồn kho', '800000', 'Sửa chữa cửa hỏng, thay thế bản lề']
    ];
    
    // Convert to CSV
    const csvContent = sampleData.map(row => row.join(',')).join('\n');
    
    // Write to temporary file
    fs.writeFileSync('test-price-list.csv', csvContent);
    
    // Create FormData
    const formData = new FormData();
    formData.append('file', fs.createReadStream('test-price-list.csv'), {
      filename: 'test-price-list.csv',
      contentType: 'text/csv'
    });
    
    // Make API request
    const response = await axios.post('http://localhost:5001/api/setup/price-lists/upload-excel', formData, {
      headers: {
        ...formData.getHeaders(),
        'Authorization': 'Bearer YOUR_TOKEN_HERE' // Replace with actual token
      }
    });
    
    console.log('✅ Upload successful!');
    console.log('Response:', JSON.stringify(response.data, null, 2));
    
    // Clean up
    fs.unlinkSync('test-price-list.csv');
    
  } catch (error) {
    console.error('❌ Upload failed:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', JSON.stringify(error.response.data, null, 2));
    } else {
      console.error('Error:', error.message);
    }
    
    // Clean up
    try {
      fs.unlinkSync('test-price-list.csv');
    } catch (e) {
      // File might not exist
    }
  }
}

// Run the test
testPriceListUpload();
