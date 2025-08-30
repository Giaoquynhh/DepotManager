const fs = require('fs');
const path = require('path');

console.log('🔍 Kiểm tra tất cả đường dẫn uploads trong codebase...\n');

// Danh sách các file cần kiểm tra
const filesToCheck = [
  'main.ts',
  'modules/maintenance/service/MaintenanceService.ts',
  'modules/requests/service/RequestService.ts',
  'modules/driver-dashboard/service/DriverDashboardService.ts',
  'modules/driver-dashboard/controller/DriverDashboardRoutes.ts',
  'modules/gate/service/GateService.ts',
  'modules/requests/controller/DocumentRoutes.ts',
  'modules/requests/controller/RequestRoutes.ts'
];

// Các pattern cần tìm
const patterns = [
  {
    name: 'process.cwd() + uploads',
    pattern: /process\.cwd\(\),?\s*['"]uploads['"]/g,
    shouldBe: 'process.cwd(), \'backend\', \'uploads\''
  },
  {
    name: 'container20 path',
    pattern: /D:\\container20\\manageContainer\\backend\\uploads/g,
    shouldBe: 'D:\\container21\\manageContainer\\backend\\uploads'
  },
  {
    name: '__dirname + uploads',
    pattern: /__dirname,?\s*['"]uploads['"]/g,
    shouldBe: '__dirname, \'uploads\' (đã đúng)'
  }
];

let totalIssues = 0;

filesToCheck.forEach(filePath => {
  const fullPath = path.join(__dirname, filePath);
  
  if (!fs.existsSync(fullPath)) {
    console.log(`❌ File không tồn tại: ${filePath}`);
    return;
  }
  
  const content = fs.readFileSync(fullPath, 'utf8');
  let fileIssues = 0;
  
  console.log(`📁 ${filePath}:`);
  
  patterns.forEach(pattern => {
    const matches = content.match(pattern.pattern);
    if (matches) {
      console.log(`  ⚠️  ${pattern.name}: ${matches.length} chỗ`);
      console.log(`     Cần thay đổi thành: ${pattern.shouldBe}`);
      fileIssues++;
      totalIssues++;
    }
  });
  
  if (fileIssues === 0) {
    console.log(`  ✅ Không có vấn đề gì`);
  }
  
  console.log('');
});

console.log(`📊 Tổng kết: ${totalIssues} vấn đề cần sửa`);

if (totalIssues === 0) {
  console.log('🎉 Tất cả đường dẫn uploads đã được cập nhật chính xác!');
} else {
  console.log('🔧 Vui lòng sửa các vấn đề trên trước khi tiếp tục.');
}
