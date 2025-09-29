// Test logic hiển thị tổng tiền theo trạng thái thanh toán
const mockRequests = [
  {
    id: 'req1',
    container_no: 'SA888',
    status: 'CHECKED',
    is_paid: false, // Chưa thanh toán
    invoices: [
      {
        id: 'inv1',
        total_amount: 2350000 // Có invoice nhưng chưa thanh toán
      }
    ]
  },
  {
    id: 'req2', 
    container_no: 'SA999',
    status: 'CHECKED',
    is_paid: true, // Đã thanh toán
    invoices: [
      {
        id: 'inv2',
        total_amount: 850000 // Có invoice và đã thanh toán
      }
    ]
  },
  {
    id: 'req3',
    container_no: 'SA777',
    status: 'CHECKED', 
    is_paid: false, // Chưa thanh toán
    invoices: [] // Không có invoice
  }
];

const lowerTotalLocal = 850000; // PriceList total

function calculateTotalAmount(request) {
  // Logic mới: chỉ hiển thị tổng tiền từ invoice khi đã thanh toán
  let totalAmount = 0;
  if (request.is_paid && request.invoices && request.invoices.length > 0) {
    // Chỉ lấy từ invoice khi đã thanh toán
    const invoice = request.invoices[0];
    totalAmount = Number(invoice.total_amount || 0);
  } else {
    // Sử dụng PriceList cho các trường hợp khác
    totalAmount = Number.isFinite(lowerTotalLocal) ? lowerTotalLocal : 0;
  }
  return totalAmount;
}

console.log('🧪 Test Logic Hiển thị Tổng tiền theo Trạng thái Thanh toán...\n');

mockRequests.forEach((request, index) => {
  const totalAmount = calculateTotalAmount(request);
  const paymentStatus = request.is_paid ? 'Đã thanh toán' : 'Chưa thanh toán';
  
  console.log(`${index + 1}. Container: ${request.container_no}`);
  console.log(`   - Status: ${request.status}`);
  console.log(`   - Payment Status: ${paymentStatus}`);
  console.log(`   - Has Invoice: ${request.invoices.length > 0 ? 'Yes' : 'No'}`);
  
  if (request.invoices.length > 0) {
    console.log(`   - Invoice Amount: ${request.invoices[0].total_amount.toLocaleString('vi-VN')} VND`);
  }
  
  console.log(`   - Display Amount: ${totalAmount.toLocaleString('vi-VN')} VND`);
  
  if (request.is_paid) {
    console.log(`   - ✅ Hiển thị từ invoice (đã thanh toán)`);
  } else {
    console.log(`   - ℹ️ Hiển thị từ PriceList (chưa thanh toán)`);
  }
  
  console.log('');
});

console.log('✅ Expected Results:');
console.log('- Chưa thanh toán: Hiển thị 850.000 VND (từ PriceList)');
console.log('- Đã thanh toán: Hiển thị từ invoice (có thể bao gồm repair cost)');
console.log('- Hóa đơn chỉ hiển thị khi trạng thái = "Đã thanh toán"');
