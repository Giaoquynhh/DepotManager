const fs = require('fs');
const path = require('path');

console.log('Testing upload directory creation...');

// Lấy đường dẫn thư mục gốc của project
const projectRoot = __dirname;
console.log('Project root:', projectRoot);

// Tạo đường dẫn đến thư mục uploads/reports
const uploadDir = path.join(projectRoot, 'uploads', 'reports');
console.log('Upload directory path:', uploadDir);

// Kiểm tra xem thư mục có tồn tại không
if (fs.existsSync(uploadDir)) {
  console.log('Upload directory already exists');
} else {
  console.log('Upload directory does not exist, creating...');
  try {
    fs.mkdirSync(uploadDir, { recursive: true });
    console.log('Upload directory created successfully');
  } catch (error) {
    console.error('Error creating upload directory:', error);
  }
}

// Kiểm tra quyền ghi
try {
  const testFile = path.join(uploadDir, 'test.txt');
  fs.writeFileSync(testFile, 'test content');
  console.log('Write permission test passed');
  
  // Xóa file test
  fs.unlinkSync(testFile);
  console.log('Delete permission test passed');
} catch (error) {
  console.error('Permission test failed:', error);
}

// Kiểm tra cấu trúc thư mục
console.log('\nDirectory structure:');
const listDir = (dir, indent = '') => {
  if (fs.existsSync(dir)) {
    const items = fs.readdirSync(dir);
    items.forEach(item => {
      const itemPath = path.join(dir, item);
      const stats = fs.statSync(itemPath);
      if (stats.isDirectory()) {
        console.log(`${indent}📁 ${item}/`);
        listDir(itemPath, indent + '  ');
      } else {
        console.log(`${indent}📄 ${item}`);
      }
    });
  }
};

listDir(projectRoot);
