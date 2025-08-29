const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

async function testUpload() {
  try {
    // Tạo file test đơn giản
    const testImagePath = path.join(__dirname, 'test-image.txt');
    fs.writeFileSync(testImagePath, 'This is a test image content');
    
    // Tạo FormData
    const formData = new FormData();
    formData.append('report_image', fs.createReadStream(testImagePath), {
      filename: 'test-image.txt',
      contentType: 'text/plain'
    });
    
    console.log('Testing upload API...');
    
    // Gọi API upload
    const response = await axios.post('http://localhost:5000/driver-dashboard/tasks/test-task-id/report', formData, {
      headers: {
        ...formData.getHeaders(),
        'Authorization': 'Bearer test-token'
      }
    });
    
    console.log('Upload successful:', response.data);
    
    // Xóa file test
    fs.unlinkSync(testImagePath);
    
  } catch (error) {
    console.error('Upload failed:', error.response?.data || error.message);
  }
}

testUpload();
