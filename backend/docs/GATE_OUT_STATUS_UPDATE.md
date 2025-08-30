# GATE_OUT Status Update - Thêm trạng thái xe đã rời kho

## 🎯 Tổng quan

Tài liệu này mô tả việc thêm trạng thái `GATE_OUT` vào hệ thống để đánh dấu khi xe đã rời kho, áp dụng cho cả IMPORT và EXPORT requests.

## 🔄 Trạng thái mới: GATE_OUT

### **Ý nghĩa**
- **GATE_OUT**: Xe đã rời kho
- Áp dụng cho cả IMPORT và EXPORT requests
- Đánh dấu điểm cuối của quy trình xử lý container

### **Workflow mới**

#### **Export Request Workflow:**
```
1. GATE_IN → FORKLIFTING (Driver click "Bắt đầu")
2. FORKLIFTING → IN_CAR (Forklift approval)
3. IN_CAR → GATE_OUT (Xe đã rời kho) ⭐ MỚI
```

#### **Import Request Workflow:**
```
1. CHECKED → POSITIONED (Yard confirm)
2. POSITIONED → FORKLIFTING (Driver click "Bắt đầu")
3. FORKLIFTING → IN_YARD (Forklift approval)
4. IN_YARD → GATE_OUT (Xe đã rời kho) ⭐ MỚI
```

## 🏗️ Thay đổi kỹ thuật

### **1. RequestStateMachine.ts**

#### **Valid States mới:**
```typescript
private static readonly VALID_STATES = [
  // ... existing states ...
  'IN_CAR', // Container đã được đặt lên xe (cho EXPORT)
  'GATE_OUT' // Xe đã rời kho (cho cả IMPORT và EXPORT)
];
```

#### **Transitions mới:**
```typescript
// Export: IN_CAR → GATE_OUT
{
  from: 'IN_CAR',
  to: 'GATE_OUT',
  allowedRoles: ['SaleAdmin', 'SystemAdmin'],
  description: 'Xe đã rời kho (cho EXPORT requests)'
},

// Import: IN_YARD → GATE_OUT
{
  from: 'IN_YARD',
  to: 'GATE_OUT',
  allowedRoles: ['SaleAdmin', 'SystemAdmin'],
  description: 'Xe đã rời kho (cho IMPORT requests)'
}
```

#### **System Messages mới:**
```typescript
case 'IN_CAR':
  systemMessage = '🚛 Container đã được đặt lên xe';
  break;
case 'GATE_OUT':
  systemMessage = '🚗 Xe đã rời kho';
  break;
```

#### **State Descriptions mới:**
```typescript
'IN_CAR': 'Đã lên xe',
'GATE_OUT': 'Đã rời kho'
```

#### **State Colors mới:**
```typescript
'IN_CAR': 'purple',
'GATE_OUT': 'red'
```

### **2. Schema.prisma**

#### **Status Comment cập nhật:**
```prisma
status String // PENDING | PICK_CONTAINER | SCHEDULED | FORWARDED | GATE_IN | CHECKING | GATE_REJECTED | REJECTED | COMPLETED | EXPORTED | IN_YARD | LEFT_YARD | PENDING_ACCEPT | ACCEPT | CHECKED | POSITIONED | FORKLIFTING | IN_YARD | IN_CAR | GATE_OUT
```

## 🚀 Quy trình hoạt động

### **Export Request:**
1. **GATE_IN**: Container đã được Gate approve
2. **FORKLIFTING**: Tài xế bắt đầu nâng/hạ container
3. **IN_CAR**: Container đã được đặt lên xe
4. **GATE_OUT**: Xe đã rời kho ⭐ **MỚI**

### **Import Request:**
1. **CHECKED**: Container đã được kiểm tra
2. **POSITIONED**: Container đã được xếp chỗ trong bãi
3. **FORKLIFTING**: Tài xế bắt đầu nâng/hạ container
4. **IN_YARD**: Container đã được đặt vào vị trí trong bãi
5. **GATE_OUT**: Xe đã rời kho ⭐ **MỚI**

## 🎯 Business Logic

### **Khi nào sử dụng GATE_OUT:**
- **Export requests**: Sau khi container đã lên xe và xe rời kho
- **Import requests**: Sau khi container đã được đặt trong bãi và xe rời kho

### **Ý nghĩa nghiệp vụ:**
- Đánh dấu hoàn tất quy trình xử lý container
- Xe không còn ở trong depot
- Có thể sử dụng để thống kê và báo cáo

## 📊 Tác động hệ thống

### **Frontend:**
- Hiển thị trạng thái GATE_OUT trong RequestTable
- Hiển thị trạng thái GATE_OUT trong DepotRequestTable
- Hiển thị trạng thái GATE_OUT trong SimpleChatBox

### **Backend:**
- State Machine hỗ trợ transitions mới
- Audit logging cho trạng thái GATE_OUT
- System messages tự động gửi vào chat room

## 🔧 Testing

### **Test Cases:**
1. **Export Request**: `IN_CAR` → `GATE_OUT` ✅
2. **Import Request**: `IN_YARD` → `GATE_OUT` ✅
3. **Invalid Transitions**: Không cho phép chuyển từ trạng thái khác sang GATE_OUT ✅
4. **Role Permissions**: Chỉ SaleAdmin và SystemAdmin có thể chuyển sang GATE_OUT ✅

## 📚 Tài liệu liên quan

- [REQUEST_STATE_MACHINE_IMPLEMENTATION.md](./REQUEST_STATE_MACHINE_IMPLEMENTATION.md)
- [MODULE_3_REQUESTS.md](./MODULE_3_REQUESTS.md)
- [PROJECT_OVERVIEW.md](./PROJECT_OVERVIEW.md)

## 🚀 Future Enhancements

### **Có thể mở rộng:**
- Thêm trạng thái `COMPLETED` sau `GATE_OUT`
- Thêm logic tự động chuyển sang `GATE_OUT` sau một khoảng thời gian
- Thêm báo cáo thống kê xe rời kho theo ngày/tháng
