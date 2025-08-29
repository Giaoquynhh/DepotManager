# manageContainer

## 🆕 Cập nhật gần đây

### Forklift Workflow Update (2025-08-29)
- **Logic gán tài xế mới:** Job vẫn giữ trạng thái PENDING sau khi gán tài xế
- **Trạng thái mới:** `ASSIGNED` (Xe nâng đã nhận) - chỉ khi tài xế bấm "Bắt đầu"
- **Workflow mới:** PENDING → ASSIGNED → IN_PROGRESS → COMPLETED
- **Tính năng gán lại:** Có thể gán lại tài xế khác cho job PENDING (tự động xóa khỏi tài xế cũ)
- **WebSocket notifications:** Thông báo real-time cho tài xế khi có thay đổi

### DriverDashboard Features (2025-08-29)
- **Trường Chi phí:** Tài xế có thể nhập và chỉnh sửa chi phí dịch vụ xe nâng
- **Trường Báo cáo:** Upload ảnh báo cáo với trạng thái PENDING/SUBMITTED/APPROVED/REJECTED
- **Upload ảnh:** Sử dụng Multer middleware, giới hạn 5MB, chỉ chấp nhận file ảnh
- **Static file serving:** Ảnh có thể truy cập trực tiếp qua `/uploads/reports/`
- **Route backup:** Route `/driver-dashboard/reports/:filename` để serve ảnh
- **Audit logging:** Ghi log chi tiết cho mọi thay đổi chi phí và upload báo cáo

### Technical Improvements (2025-08-29)
- **Xóa trường Báo cáo:** Loại bỏ trường báo cáo khỏi Forklift page (admin view)
- **Port configuration:** Sửa lỗi port không đúng khi xem ảnh (5000 → 5002)
- **Error handling:** Cải thiện xử lý lỗi và logging cho upload file
- **File storage:** Tự động tạo thư mục uploads và xử lý file buffer/stream

### Tính năng mới được thêm:
- **Gán lại tài xế:** Nút "🔄 Gán lại tài xế" cho job PENDING đã có tài xế
- **Bắt đầu làm việc:** Nút "Bắt đầu làm việc" cho job ASSIGNED
- **Chỉnh sửa chi phí:** Nút "Chỉnh sửa chi phí" cho mọi trạng thái
- **Cập nhật báo cáo:** API endpoint mới `/jobs/:jobId/report`

### Thay đổi giao diện:
- **Forklift page:** Xóa cột "Báo cáo", giữ cột "Chi phí"
- **DriverDashboard:** Thêm cột "Chi phí" và "Báo cáo" với giao diện đẹp

Xem chi tiết: 
- [FORKLIFT_STATUS_UPDATE.md](backend/docs/FORKLIFT_STATUS_UPDATE.md)
- [Demo Workflow](backend/docs/demo-forklift-workflow.md)