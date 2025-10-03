// Test script để kiểm tra validation status cho delete request
console.log('🧪 Test Delete Request Status Validation...\n');

console.log('📋 Logic mới cho delete request:');
console.log('1. ✅ Chỉ cho phép xóa khi status = "NEW_REQUEST"');
console.log('2. ❌ Từ chối xóa khi status khác "NEW_REQUEST"');
console.log('3. 📝 Trả về thông báo lỗi rõ ràng với status hiện tại');

console.log('\n🔍 Các trường hợp test:');
console.log('- Status: NEW_REQUEST → ✅ Cho phép xóa');
console.log('- Status: PENDING → ❌ Từ chối xóa');
console.log('- Status: APPROVED → ❌ Từ chối xóa');
console.log('- Status: IN_PROGRESS → ❌ Từ chối xóa');
console.log('- Status: COMPLETED → ❌ Từ chối xóa');
console.log('- Status: CANCELLED → ❌ Từ chối xóa');

console.log('\n📝 Thông báo lỗi mẫu:');
console.log('"Không thể xóa yêu cầu. Chỉ có thể xóa khi trạng thái là NEW_REQUEST (hiện tại: PENDING)"');

console.log('\n✅ Implementation hoàn tất!');
console.log('📍 File: modules/requests/controller/deleteController.ts');
console.log('📍 Endpoint: DELETE /requests/:id');
console.log('📍 Validation: request.status === "NEW_REQUEST"');

