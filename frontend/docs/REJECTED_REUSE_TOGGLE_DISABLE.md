# 🔒 Vô hiệu hóa Toggle Reuse Status cho Request REJECTED

## **📋 Vấn đề**

Trong page Lift Container Request (`/LiftContainer`), các request có trạng thái **REJECTED** vẫn có thể chỉnh sửa trạng thái reuse thông qua toggle switch, điều này không hợp lý vì request đã bị từ chối.

## **🔍 Phân tích hiện tại**

### **Logic cũ:**
- Chỉ disable toggle reuse khi status là: `DONE_LIFTING`, `IN_CAR`, `GATE_OUT`
- Request `REJECTED` vẫn có thể thay đổi reuse status

### **Vấn đề:**
- Request bị từ chối không nên cho phép thay đổi reuse status
- Gây nhầm lẫn cho người dùng
- Logic không nhất quán

## **✅ Giải pháp**

Thêm `REJECTED` vào danh sách các trạng thái không thể chỉnh sửa reuse status:

### **1. Disable Toggle Switch**
```typescript
// Trước
disabled={r.status === 'DONE_LIFTING' || r.status === 'IN_CAR' || r.status === 'GATE_OUT'}

// Sau  
disabled={r.status === 'DONE_LIFTING' || r.status === 'IN_CAR' || r.status === 'GATE_OUT' || r.status === 'REJECTED'}
```

### **2. Visual Feedback**
```typescript
// Trước
opacity: (r.status === 'DONE_LIFTING' || r.status === 'IN_CAR' || r.status === 'GATE_OUT') ? 0.5 : 1,
cursor: (r.status === 'DONE_LIFTING' || r.status === 'IN_CAR' || r.status === 'GATE_OUT') ? 'not-allowed' : 'pointer'

// Sau
opacity: (r.status === 'DONE_LIFTING' || r.status === 'IN_CAR' || r.status === 'GATE_OUT' || r.status === 'REJECTED') ? 0.5 : 1,
cursor: (r.status === 'DONE_LIFTING' || r.status === 'IN_CAR' || r.status === 'GATE_OUT' || r.status === 'REJECTED') ? 'not-allowed' : 'pointer'
```

### **3. Error Message**
```typescript
// Trước
if (r.status === 'DONE_LIFTING' || r.status === 'IN_CAR' || r.status === 'GATE_OUT') {
    const statusText = r.status === 'DONE_LIFTING' ? 'Nâng thành công' : 
                       r.status === 'IN_CAR' ? 'IN_CAR' : 'GATE_OUT';

// Sau
if (r.status === 'DONE_LIFTING' || r.status === 'IN_CAR' || r.status === 'GATE_OUT' || r.status === 'REJECTED') {
    const statusText = r.status === 'DONE_LIFTING' ? 'Nâng thành công' : 
                       r.status === 'IN_CAR' ? 'IN_CAR' : 
                       r.status === 'GATE_OUT' ? 'GATE_OUT' : 'Bị từ chối';
```

## **🎯 Kết quả**

### **Trước khi sửa:**
- Request REJECTED: ✅ Có thể thay đổi reuse status
- Visual: Toggle switch bình thường, cursor pointer

### **Sau khi sửa:**
- Request REJECTED: ❌ Không thể thay đổi reuse status
- Visual: Toggle switch mờ (opacity 0.5), cursor not-allowed
- Error message: "Request đang ở trạng thái Bị từ chối, không thể thay đổi reuse status"

## **🔧 Files đã sửa**

### **`ExportRequest.tsx`**
- **Dòng 714-715:** Thêm `REJECTED` vào opacity và cursor logic
- **Dòng 720:** Thêm `REJECTED` vào disabled condition
- **Dòng 722:** Thêm `REJECTED` vào onChange validation
- **Dòng 725:** Thêm case 'Bị từ chối' cho statusText
- **Dòng 743:** Thêm `REJECTED` vào cursor logic cho span

## **📊 Trạng thái Reuse Status**

### **Có thể chỉnh sửa:**
- `NEW_REQUEST`
- `PENDING`
- `GATE_IN`
- `FORKLIFTING`
- `GATE_REJECTED`

### **Không thể chỉnh sửa:**
- `DONE_LIFTING` - Nâng thành công
- `IN_CAR` - Đã lên xe
- `GATE_OUT` - Đã ra cổng
- **`REJECTED` - Bị từ chối** ⭐ (Mới thêm)

## **🎉 Kết luận**

Bây giờ logic toggle reuse status đã nhất quán:
- Chỉ cho phép chỉnh sửa reuse status khi request còn đang xử lý
- Không cho phép chỉnh sửa khi request đã hoàn thành hoặc bị từ chối
- Cung cấp feedback rõ ràng cho người dùng về lý do không thể chỉnh sửa

**Request REJECTED giờ đây không thể chỉnh sửa reuse status!** 🔒

