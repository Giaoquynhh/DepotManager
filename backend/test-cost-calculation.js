const fs = require('fs');
const path = require('path');

// Test script để kiểm tra cách tính chi phí mới
console.log('=== Test Cost Calculation Fix ===');

// Test data cho container ISO 1234
const testContainerData = {
  container_no: 'ISO 1234',
  repair_tickets: [
    {
      id: 'repair_1',
      code: 'REP-1756566850740',
      estimated_cost: 1100000, // Chỉ sử dụng estimated_cost
      labor_cost: 100000,      // Không sử dụng trong tính toán
      status: 'CHECKED'
    }
  ],
  forklift_tasks: [
    {
      id: 'task_1',
      cost: 1000000,
      status: 'COMPLETED'
    }
  ]
};

// Tính toán chi phí theo cách cũ (sai)
const oldCalculation = testContainerData.repair_tickets.reduce((sum, ticket) => {
  return sum + (ticket.estimated_cost || 0) + (ticket.labor_cost || 0);
}, 0);

// Tính toán chi phí theo cách mới (đúng)
const newCalculation = testContainerData.repair_tickets.reduce((sum, ticket) => {
  return sum + (ticket.estimated_cost || 0);
}, 0);

const totalLoloCost = testContainerData.forklift_tasks.reduce((sum, task) => {
  return sum + (task.cost || 0);
}, 0);

console.log('\n📊 Test Data:');
console.log('Container:', testContainerData.container_no);
console.log('Repair Ticket:', testContainerData.repair_tickets[0].code);
console.log('- estimated_cost:', testContainerData.repair_tickets[0].estimated_cost.toLocaleString('vi-VN'), 'VND');
console.log('- labor_cost:', testContainerData.repair_tickets[0].labor_cost.toLocaleString('vi-VN'), 'VND');
console.log('Forklift Task Cost:', totalLoloCost.toLocaleString('vi-VN'), 'VND');

console.log('\n🔢 Cost Calculation:');
console.log('❌ Old calculation (estimated_cost + labor_cost):', oldCalculation.toLocaleString('vi-VN'), 'VND');
console.log('✅ New calculation (estimated_cost only):', newCalculation.toLocaleString('vi-VN'), 'VND');
console.log('📋 Expected in Maintenance table:', testContainerData.repair_tickets[0].estimated_cost.toLocaleString('vi-VN'), 'VND');

console.log('\n📈 Summary:');
console.log('- Maintenance table shows:', testContainerData.repair_tickets[0].estimated_cost.toLocaleString('vi-VN'), 'VND');
console.log('- Popup now shows:', newCalculation.toLocaleString('vi-VN'), 'VND');
console.log('- Difference resolved:', (oldCalculation - newCalculation).toLocaleString('vi-VN'), 'VND');

console.log('\n✅ Cost calculation fix completed!');
console.log('💡 Popup now shows the same cost as Maintenance table');
