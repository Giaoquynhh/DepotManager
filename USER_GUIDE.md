# Hướng dẫn sử dụng hệ thống Smartlog Container Manager

Phiên bản: 1.0  
Ngày: 2025-09-04

---

## 1. Giới thiệu nhanh

- Hệ thống giúp quản lý yêu cầu dịch vụ container (Nhập/Xuất/Chuyển đổi), vận hành cổng, kho bãi, sửa chữa, hóa đơn và giao tiếp khách hàng.
- Giao diện đa ngôn ngữ: Tiếng Việt/English. Chuyển ngôn ngữ tại menu người dùng (góc phải trên).
- Các vai trò chính: Admin, Depot Manager/Staff, Gate Staff, Forklift, Customer, Accountant, Driver.

## 2. Bắt đầu sử dụng

- Đăng nhập: Nhập email/mật khẩu đã được cấp.
- Chuyển ngôn ngữ: Menu người dùng > chọn VI/EN.
- Bố cục:
  - Sidebar trái: điều hướng module.
  - Header trên: tài khoản, thông báo, chọn ngôn ngữ.
  - Nội dung: danh sách/bảng, form thao tác, cửa sổ phụ (chat, modal,...).

### 2.3. Tổng quan Sidebar (tóm tắt)

- Người dùng/Đối tác → Quản lý hồ sơ người dùng/khách hàng. Chi tiết: xem mục 4.1.
- Phân quyền → Gán vai trò, phân quyền theo module. Chi tiết: xem mục 4.2.
- Yêu cầu → Quản lý yêu cầu dịch vụ. Chi tiết: xem mục 4.3.
- Cổng (Gate) → Vận hành vào/ra cổng. Chi tiết: xem mục 4.4.
- Bãi (Yard) → Sơ đồ bãi, vị trí container, di chuyển. Chi tiết: xem mục 4.5.
- Quản lý container → Tra cứu container và lịch sử. Chi tiết: xem mục 4.6.
- Quản lý xe nâng → Tác vụ xe nâng. Chi tiết: xem mục 4.7.
- Phiếu sửa chữa → Quy trình sửa chữa và vật tư. Chi tiết: xem mục 4.8.
- Tồn kho → Quản lý vật tư. Chi tiết: xem mục 4.9.
- Hóa đơn → Hóa đơn, thanh toán. Chi tiết: xem mục 4.10.
- Tài khoản → Hồ sơ cá nhân, mật khẩu, ngôn ngữ. Chi tiết: xem mục 4.11.

## 3. Khái niệm và trạng thái quan trọng

- Loại yêu cầu: IMPORT, EXPORT, CONVERT.
- Trạng thái yêu cầu (khách hàng/Depot nhìn thấy một phần tùy vai trò):
  - PENDING: Chờ xử lý
  - SCHEDULED: Đã lên lịch
  - RECEIVED: Đã nhận
  - FORWARDED: Đã chuyển tiếp (khách hàng bổ sung chứng từ → hệ thống tự động chuyển tiếp đến Depot để xử lý tiếp)
  - PENDING_ACCEPT: Chờ xác nhận (ví dụ: chờ khách hàng duyệt chi phí sửa chữa/hóa đơn)
  - CHECKING/CHECKED: Đang kiểm tra/Đã kiểm tra
  - POSITIONED: Đã bố trí vị trí trong bãi
  - FORKLIFTING: Đang nâng hạ
  - IN_YARD/IN_CAR/LEFT_YARD: Tình trạng trong bãi/đang trên xe/đã rời bãi
  - COMPLETED: Hoàn thành
  - EXPORTED: Đã xuất
  - REJECTED: Từ chối
  - GATE_IN/GATE_OUT/GATE_REJECTED: Trạng thái tại cổng

Lưu ý: Một số trạng thái chỉ xuất hiện ở vai trò nhất định.

## 4. Danh mục chức năng theo Sidebar

Mỗi mục dưới đây mô tả chức năng, tác vụ chính và quyền truy cập gợi ý. Quyền thực tế có thể thay đổi theo cấu hình phân quyền.

### 4.1. Người dùng/Đối tác
- Chức năng: Quản lý hồ sơ người dùng nội bộ và khách hàng/đối tác.
- Tác vụ chính:
  - Tạo/Sửa/Xóa người dùng, kích hoạt/vô hiệu hóa.
  - Tra cứu theo email/tên, reset mật khẩu.
- Quyền truy cập: Admin, Depot Manager (xem), Bộ phận CS.

#### 4.1.1. Hướng dẫn tạo tài khoản (Admin)

- Chuẩn bị
  - Xác định vai trò người dùng (ví dụ: Customer, Depot Staff, Gate Staff, Forklift, Accountant, Admin).
  - Thu thập thông tin: Họ tên, Email (duy nhất), Số điện thoại (tùy chọn), Đối tác/Khách hàng liên quan (nếu có).
- Các bước thực hiện
  1) Mở `Người dùng/Đối tác` trong sidebar.
  2) Bấm nút `Tạo mới`.
  3) Nhập các trường bắt buộc:
     - Họ và tên
     - Email (định dạng hợp lệ, không trùng lặp)
     - Mật khẩu tạm thời hoặc gửi liên kết đặt mật khẩu (nếu hệ thống hỗ trợ)
     - Vai trò (chọn 1+ vai trò phù hợp)
     - Đối tác/Khách hàng (nếu tài khoản thuộc một tổ chức cụ thể)
  4) Bấm `Lưu` để tạo tài khoản.
  5) Tài khoản được tạo với trạng thái ACTIVE và có thể đăng nhập ngay.
- Phân quyền sau khi tạo
  - Vào mục `Phân quyền` → gán hoặc điều chỉnh quyền chi tiết nếu cần (xem/tạo/sửa/xóa theo từng module).
  - Nguyên tắc: cấp quyền tối thiểu cần thiết (least privilege).
- Xác thực và kích hoạt
  - Nếu có email xác thực: người dùng bấm link kích hoạt trong email.
  - Admin có thể `Kích hoạt/Vô hiệu hóa` tài khoản bất cứ lúc nào.
- Lưu ý bảo mật
  - Yêu cầu mật khẩu mạnh: tối thiểu 8 ký tự, gồm chữ hoa, chữ thường, số và ký tự đặc biệt.
  - Bắt buộc đổi mật khẩu khi đăng nhập lần đầu (nếu có mật khẩu tạm).
  - Không dùng email dùng chung; phân quyền theo cá nhân để truy vết hành động.
  - Thu hồi quyền ngay khi người dùng chuyển nhiệm vụ hoặc nghỉ việc.

##### Ảnh minh họa

Gợi ý chụp và đặt ảnh vào thư mục `images/user_guide/` rồi cập nhật đúng tên file bên dưới:

1) Mục Người dùng/Đối tác trên sidebar
![Sidebar - Người dùng/Đối tác](images/user_guide/create-user-01-sidebar.png)

2) Danh sách người dùng và nút "Tạo mới"
![Danh sách người dùng](images/user_guide/create-user-02-list.png)

3) Form tạo người dùng (trường cơ bản, vai trò)
![Form tạo người dùng](images/user_guide/create-user-03-form.png)

4) Gán vai trò và lưu
![Gán vai trò](images/user_guide/create-user-04-roles.png)

5) Tài khoản được tạo thành công
![Tạo tài khoản thành công](images/user_guide/create-user-05-success.png)

### 4.2. Phân quyền
- Chức năng: Gán vai trò và quyền truy cập theo module.
- Tác vụ chính:
  - Tạo vai trò, ánh xạ quyền chi tiết (xem/tạo/sửa/xóa) cho từng màn hình.
  - Gán nhiều vai trò cho một người dùng.
- Quyền truy cập: Admin.

### 4.3. Yêu cầu
- Chức năng: Quản lý yêu cầu dịch vụ (IMPORT/EXPORT/CONVERT).
- Tác vụ chính:
  - Tạo yêu cầu (Customer), lọc/sort, duyệt/từ chối (Depot), đặt lịch (SCHEDULED).
  - Bổ sung chứng từ (FORWARDED), chat theo yêu cầu, theo dõi tiến trình đến COMPLETED/EXPORTED.
- Quyền truy cập: Customer, Depot Staff/Manager, Admin.

### 4.4. Cổng (Gate)
- Chức năng: Vận hành xe vào/ra cổng và kiểm tra chứng từ.
- Tác vụ chính:
  - Xem danh sách hẹn, xác nhận GATE_IN/GATE_OUT.
  - GATE_REJECTED nếu không hợp lệ (chứng từ/biển số/xe không khớp).
- Quyền truy cập: Gate Staff, Depot Manager, Admin.

### 4.5. Bãi (Yard)
- Chức năng: Quản lý sơ đồ bãi, vị trí container và di chuyển trong bãi.
- Tác vụ chính:
  - Xem bản đồ bãi, tìm container, bố trí vị trí (POSITIONED).
  - Tạo tác vụ di chuyển (Forklift Task), đánh dấu bảo trì slot.
- Quyền truy cập: Depot Staff/Manager, Admin.

### 4.6. Quản lý container
- Chức năng: Tra cứu chi tiết container, lịch sử trạng thái và chứng từ liên quan.
- Tác vụ chính:
  - Tìm theo số container, xem lịch sử Gate/Yard/Repair.
  - Mở nhanh chứng từ và liên kết sang yêu cầu liên quan.
- Quyền truy cập: Depot Staff/Manager, Customer (giới hạn phạm vi), Admin.

### 4.7. Quản lý xe nâng
- Chức năng: Quản lý tác vụ xe nâng và tiến độ thực hiện.
- Tác vụ chính:
  - Tạo/Phân công task A→B, theo dõi trạng thái FORKLIFTING → hoàn thành.
  - Xem tải công việc theo tài xế/ca làm việc.
- Quyền truy cập: Depot Manager, Forklift Driver (cá nhân), Admin.

### 4.8. Phiếu sửa chữa
- Chức năng: Quản lý sửa chữa container/thiết bị và vật tư.
- Tác vụ chính:
  - Tạo phiếu, ước tính chi phí, chờ duyệt, cập nhật vật tư sử dụng.
  - Đính kèm ảnh biên bản, xuất báo cáo tình trạng sau sửa chữa.
- Quyền truy cập: Maintenance Staff/Manager, Admin.

### 4.9. Tồn kho (Vật tư)
- Chức năng: Quản lý kho vật tư phục vụ sửa chữa/vận hành.
- Tác vụ chính:
  - Thêm/Sửa/Xóa vật tư, kiểm kê, theo dõi nhập/xuất.
  - Cảnh báo mức tồn tối thiểu, nhật ký sử dụng theo phiếu sửa chữa.
- Quyền truy cập: Maintenance/Depot Manager, Kế toán (xem), Admin.

### 4.10. Hóa đơn
- Chức năng: Quản lý hóa đơn dịch vụ và sửa chữa, thanh toán.
- Tác vụ chính:
  - Tạo hóa đơn theo yêu cầu/phiếu sửa chữa, gửi khách hàng.
  - Ghi nhận thanh toán, theo dõi quá hạn, xuất PDF.
- Quyền truy cập: Accountant, Depot Manager (xem), Customer (xem hóa đơn của mình), Admin.

### 4.11. Tài khoản
- Chức năng: Thông tin cá nhân và thiết lập người dùng.
- Tác vụ chính:
  - Cập nhật hồ sơ, đổi mật khẩu, chọn ngôn ngữ.
  - Quản lý thông báo nhận (in-app/email) nếu được hỗ trợ.
- Quyền truy cập: Tất cả người dùng đã đăng nhập.

## 5. Hướng dẫn theo vai trò

### 5.1. Khách hàng (Customer)

- Tạo yêu cầu
  - Vào Yêu cầu khách hàng: `Requests/Customer` > "Tạo yêu cầu".
  - Chọn loại (IMPORT/EXPORT), nhập số container, ETA, ghi chú.
  - Gửi để tạo yêu cầu ở trạng thái PENDING.
- Tìm kiếm/lọc/sắp xếp
  - Ô tìm kiếm theo mã container.
  - Bộ lọc "Tất cả loại" và sắp xếp theo ETA bằng nút ở tiêu đề cột.
- Bổ sung chứng từ (đưa yêu cầu sang FORWARDED)
  - Với yêu cầu SCHEDULED/RECEIVED (tùy trường hợp), bấm "Bổ sung thông tin".
  - Tải lên file PDF/JPG/PNG; khi thành công hệ thống sẽ hiển thị thông báo và cập nhật trạng thái → FORWARDED.
- Chat
  - Bấm nút Chat ở mỗi dòng để mở cửa sổ chat, trao đổi với Depot.
- Hóa đơn & Thanh toán
  - Khi có hóa đơn, nhấn "Xem hóa đơn" (Invoice Viewer).
  - Nếu cho phép thanh toán trực tuyến, bấm "Thanh toán" và thực hiện theo hướng dẫn (mock hiện tại cập nhật trạng thái thanh toán).

### 5.2. Depot Staff/Manager

- Duyệt/Từ chối yêu cầu
  - Trang `Requests/Depot`.
  - Lọc theo trạng thái/loại/container; đã có lựa chọn "Đã chuyển tiếp" trong "Tất cả trạng thái".
  - Với PENDING: bấm "Chấp nhận" để chuyển RECEIVED hoặc "Từ chối" để REJECTED.
- Đặt lịch (SCHEDULED)
  - Mở mini window "Appointment" để đặt/đổi lịch (thời gian, vị trí/cổng, ghi chú).
- Theo dõi và cập nhật
  - Thay đổi các trạng thái tiến trình: COMPLETED, EXPORTED, ...
  - Gửi yêu cầu thanh toán khi hoàn tất dịch vụ.
- Xem/Bật chat với khách hàng.
- Xem chứng từ đã tải lên, mở modal xem tài liệu.

### 5.3. Gate Staff

- Xem danh sách hẹn tại cổng.
- Thực hiện GATE_IN/GATE_OUT và kiểm tra chứng từ.
- Trường hợp lỗi chứng từ có thể chuyển GATE_REJECTED.

### 5.4. Forklift

- Nhận tác vụ nâng/hạ từ quản lý.
- Cập nhật tiến độ: FORKLIFTING → hoàn thành.
- Liên hệ Depot/Manager khi có cản trở tác nghiệp.

### 5.5. Bảo trì/Sửa chữa

- Tạo phiếu sửa chữa (Repair Ticket) khi phát hiện hư hỏng.
- Ước tính chi phí, gửi duyệt cho khách hàng (trạng thái chờ xác nhận).
- Quản lý vật tư; khi thực hiện sửa chữa hệ thống tự động trừ tồn kho.

### 5.6. Kế toán (Accountant)

- Xem danh sách hóa đơn theo yêu cầu dịch vụ/phiếu sửa chữa.
- Ghi nhận thanh toán, cập nhật trạng thái hóa đơn.
- Lọc theo đã thanh toán/chưa thanh toán/quá hạn.

### 5.7. Quản trị viên (Admin)

- Quản lý người dùng, gán vai trò.
- Cấu hình sơ đồ bãi (blocks/slots).
- Cấu hình tích hợp (email/thông báo), sao lưu dữ liệu định kỳ.

### 5.8. Bãi (Yard)

Lưu ý: Hướng dẫn theo module (đầy đủ) xem mục 4.5. Bãi (Yard).

- Xem sơ đồ bãi (Yard Map)
  - Mở màn hình Bãi/Yard từ sidebar. Sơ đồ hiển thị theo Block → Row → Slot.
  - Chú giải màu: Trống, Đã chiếm, Đang bảo trì, Đang giữ chỗ (reserved).
  - Phóng to/thu nhỏ nếu được hỗ trợ để xem chi tiết vị trí.
- Tìm container và kiểm tra vị trí
  - Nhập số container vào ô tìm kiếm. Hệ thống highlight slot hiện tại (nếu có vị trí).
  - Với yêu cầu EXPORT: vị trí có thể hiển thị huy hiệu trong bảng yêu cầu và link tới slot trên sơ đồ.
- Gán vị trí (Positioning)
  - Từ yêu cầu đã RECEIVED/SCHEDULED, chọn "Bố trí vị trí".
  - Chọn Block/Slot còn trống; lưu để cập nhật trạng thái POSITIONED và ghi nhận vào lịch sử.
  - Quy tắc: không gán vào slot đang bảo trì/đã chiếm.
- Di chuyển container trong bãi (Relocation)
  - Tạo tác vụ di chuyển (Forklift Task) từ vị trí A → B khi cần tối ưu xếp dỡ.
  - Tài xế cập nhật trạng thái FORKLIFTING → hoàn thành. Hệ thống tự động đổi vị trí về B.
- Đánh dấu bảo trì slot/khu vực
  - Admin/Depot có thể đặt trạng thái slot: Đang bảo trì. Slot sẽ không thể gán vị trí mới.
  - Khi hoàn tất, gỡ trạng thái để slot quay về khả dụng.
- Kiểm tra tồn chứa và tải khu vực
  - Xem tổng hợp số slot còn trống/đã sử dụng theo Block.
  - Dựa trên tải hiện tại để đề xuất vị trí tối ưu cho IMPORT mới.
- Lưu ý an toàn và hiệu năng
  - Luôn xác nhận tình trạng cổng (GATE_IN/GATE_OUT) trước khi gán/đổi vị trí.
  - Với bãi lớn, lọc theo Block trước khi tìm kiếm để tăng hiệu năng hiển thị.

## 6. Thao tác phổ biến (How-to)

- Đổi ngôn ngữ: Góc phải trên > chọn VI/EN.
- Tải lên chứng từ: Bấm "Bổ sung thông tin" hoặc "Upload" trong yêu cầu > chọn file PDF/JPG/PNG.
- Tìm vị trí container (EXPORT): Trong bảng có huy hiệu vị trí; nếu đang tải dữ liệu hiển thị ⏳, khi có dữ liệu sẽ hiện "Yard / Block / Slot".
- Lọc theo "Đã chuyển tiếp": `Requests/Depot` > "Tất cả trạng thái" > chọn "Đã chuyển tiếp" (FORWARDED).

## 7. Quy ước và giới hạn

- Số container: theo chuẩn ISO, ví dụ "MSCU1234567".
- Định dạng file: PDF, JPG, JPEG, PNG; dung lượng đề xuất ≤ 10MB/file.
- Múi giờ/Ngày giờ: hiển thị theo ngôn ngữ (vi-VN/en-US), trường ETA dạng ISO.

## 8. Khắc phục sự cố (FAQ)

- Không đăng nhập được: kiểm tra tài khoản/mật khẩu, thử chức năng Quên mật khẩu.
- Không tải lên được chứng từ: kiểm tra định dạng/dung lượng file, thử lại sau ít phút.
- Không thấy vị trí container: có thể dữ liệu yard chưa sẵn sàng; thử làm mới trang.
- Không thấy nút "Đã chuyển tiếp": đảm bảo bạn đang ở trang `Requests/Depot` và sử dụng dropdown trạng thái.

## 9. Bảo mật và an toàn

- Không chia sẻ tài khoản/mật khẩu; sử dụng mật khẩu mạnh.
- Đăng xuất khi không sử dụng.
- Không tải lên tài liệu nhạy cảm nếu không cần thiết.

## 10. Liên hệ hỗ trợ

- Bộ phận vận hành Depot hoặc Quản trị hệ thống nội bộ.

---

Tài liệu này phản ánh tính năng hiện tại của mã nguồn trong thư mục `manageContainer/`. Nếu có khác biệt giao diện hoặc hành vi, vui lòng thông báo để cập nhật hướng dẫn.

