# Repair Cost Integration với ServiceRequest Invoice

## Tổng quan

Tính năng này tự động cập nhật chi phí sửa chữa container vào tổng tiền của ServiceRequest khi RepairTicket chuyển sang trạng thái `CHECKED` (ACCEPT).

## Logic hoạt động

### 1. Khi RepairTicket được ACCEPT

```typescript
// Trong RepairController.decide method
if (decision === 'ACCEPT' && request && ticket.container_no) {
  // Tính tổng chi phí sửa chữa
  const repairCost = this.repairCostService.calculateRepairCost(updatedTicket);
  
  // Cập nhật ServiceRequest với repair cost
  await this.repairCostService.updateServiceRequestWithRepairCost(
    ticket.container_no,
    repairCost,
    req.user?._id || '',
    request.id
  );
}
```

### 2. Tính chi phí sửa chữa

```typescript
calculateRepairCost(repairTicket: any): number {
  const estimatedCost = Number(repairTicket.estimated_cost || 0);
  const laborCost = Number(repairTicket.labor_cost || 0);
  const totalCost = estimatedCost + laborCost;
  
  return totalCost;
}
```

### 3. Cập nhật Invoice

- **Nếu chưa có invoice**: Tạo invoice mới với:
  - Items từ PriceList (dịch vụ "Hạ")
  - Item "REPAIR" với chi phí sửa chữa
  
- **Nếu đã có invoice**: 
  - Cập nhật item "REPAIR" hiện có
  - Hoặc thêm item "REPAIR" mới (nếu chưa có)
  - Tính lại tổng tiền

## Cấu trúc dữ liệu

### RepairTicket fields
```typescript
{
  id: string;
  container_no: string;
  estimated_cost: number; // Chi phí vật tư
  labor_cost: number;      // Chi phí công
  status: RepairStatus;    // PENDING, COMPLETE, COMPLETE_NEEDREPAIR, REJECT
}
```

### Invoice Line Item cho Repair Cost
```typescript
{
  service_code: 'REPAIR',
  description: 'Chi phí sửa chữa container',
  qty: 1,
  unit_price: repairCost,
  line_amount: repairCost,
  total_line_amount: repairCost
}
```

## API Endpoints

### 1. Quyết định RepairTicket
```
POST /maintenance/repairs/:id/decide
{
  "decision": "ACCEPT", // hoặc "REJECT"
  "canRepair": false    // true nếu container cần sửa chữa
}
```

### 2. Test Integration (SystemAdmin only)
```
POST /maintenance/test-repair-cost
{
  "container_no": "ISO1234567",
  "repair_ticket_id": "repair-ticket-id"
}
```

## Luồng hoạt động

1. **Container vào hệ thống** → ServiceRequest `PENDING`
2. **Tạo RepairTicket** → RepairTicket `PENDING`
3. **Kiểm tra container** → RepairTicket `PENDING`
4. **Quyết định RepairTicket**:
   - **ACCEPT** → RepairTicket `COMPLETE`/`COMPLETE_NEEDREPAIR` → ServiceRequest `CHECKED`
   - **Tự động cập nhật repair cost vào invoice**
   - **REJECT** → RepairTicket `REJECT` → ServiceRequest vẫn `PENDING`
5. **Container đã CHECKED** → Có thể tiếp tục quy trình

## Quy tắc tính giá

### Container không cần sửa chữa
- `estimated_cost = 0`
- `labor_cost = 0`
- **Tổng repair cost = 0 VND**

### Container cần sửa chữa
- `estimated_cost = Chi phí vật tư`
- `labor_cost = Chi phí công`
- **Tổng repair cost = estimated_cost + labor_cost**

## Files được tạo/cập nhật

### 1. RepairCostService
- **File**: `modules/finance/service/RepairCostService.ts`
- **Chức năng**: Tính toán và cập nhật repair cost vào invoice

### 2. RepairController
- **File**: `modules/maintenance/controller/RepairController.ts`
- **Cập nhật**: Tích hợp RepairCostService vào method `decide`

### 3. Test Controller
- **File**: `modules/maintenance/controller/testRepairCostController.ts`
- **Chức năng**: API endpoint để test integration

### 4. Test Script
- **File**: `test-repair-cost-integration.js`
- **Chức năng**: Script test tự động

## Testing

### 1. Chạy test script
```bash
cd backend
node test-repair-cost-integration.js
```

### 2. Test qua API
```bash
curl -X POST http://localhost:1000/maintenance/test-repair-cost \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "container_no": "ISO1234567"
  }'
```

## Lưu ý quan trọng

1. **Chỉ áp dụng cho Import requests** (type: 'IMPORT')
2. **Chỉ cập nhật khi RepairTicket được ACCEPT**
3. **Không ảnh hưởng đến việc quyết định RepairTicket** nếu có lỗi
4. **Tự động tính lại tổng tiền invoice** sau khi cập nhật
5. **Hỗ trợ cả trường hợp có và không có invoice trước đó**

## Logging

Tất cả hoạt động được log chi tiết:
- `💰 Cập nhật repair cost cho container: {container_no}`
- `✅ Đã cập nhật repair cost: {amount} VND cho container: {container_no}`
- `❌ Lỗi khi cập nhật repair cost: {error}`

## Troubleshooting

### Invoice không được tạo
- Kiểm tra ServiceRequest có tồn tại không
- Kiểm tra PriceList có dịch vụ "Hạ" không
- Kiểm tra quyền hạn của user

### Repair cost không được cập nhật
- Kiểm tra RepairTicket có `container_no` không
- Kiểm tra ServiceRequest có type 'IMPORT' không
- Kiểm tra RepairTicket status có phải COMPLETE/COMPLETE_NEEDREPAIR không

### Tổng tiền không đúng
- Kiểm tra `estimated_cost` và `labor_cost` trong RepairTicket
- Kiểm tra logic tính toán trong `calculateRepairCost`
- Kiểm tra việc tính lại tổng tiền trong `calculateTotals`