# Đặc tả Yêu cầu Phần mềm (SRS) - Hệ thống Quản lý Container Depot

**Phiên bản: 1.0**

**Ngày: 2025-09-04**

---

## 1. Giới thiệu

### 1.1. Mục đích

Tài liệu này đặc tả các yêu cầu chức năng và phi chức năng cho Hệ thống Quản lý Container Depot (sau đây gọi là "Hệ thống"). Mục tiêu là cung cấp một nền tảng web toàn diện để số hóa và tối ưu hóa các quy trình nghiệp vụ tại một cảng hoặc kho container, từ quản lý yêu cầu dịch vụ, vận hành kho bãi, đến tài chính và giao tiếp với khách hàng.

> Lưu ý: Tài liệu này là đặc tả yêu cầu (SRS). Để biết cách sử dụng hệ thống, vui lòng xem: [USER_GUIDE.md](./USER_GUIDE.md)

### 1.2. Phạm vi

Hệ thống bao gồm các phân hệ chính sau:
- Quản lý người dùng và phân quyền.
- Quản lý yêu cầu dịch vụ (Nhập, Xuất, Chuyển đổi container).
- Quản lý vận hành cổng (Gate In/Out).
- Quản lý kho bãi (Yard) và vị trí container.
- Quản lý tác vụ xe nâng (Forklift).
- Quản lý bảo trì, sửa chữa và vật tư.
- Quản lý tài chính, hóa đơn và thanh toán.
- Hệ thống giao tiếp (Chat) và thông báo.

### 1.3. Định nghĩa, Từ viết tắt

- **SRS**: Software Requirements Specification (Đặc tả Yêu cầu Phần mềm).
- **Depot**: Kho bãi chứa container.
- **EIR**: Equipment Interchange Receipt (Phiếu giao nhận container).
- **IMPORT**: Quy trình nhập container vào depot.
- **EXPORT**: Quy trình xuất container khỏi depot.
- **Yard**: Khu vực kho bãi.
- **Slot**: Vị trí cụ thể trong yard để đặt container.

### 1.4. Tổng quan

Tài liệu được cấu trúc như sau:
- **Phần 2**: Mô tả tổng quan về sản phẩm, người dùng và các ràng buộc.
- **Phần 3**: Đặc tả chi tiết các yêu cầu chức năng theo từng module.
- **Phần 4**: Đặc tả các yêu cầu phi chức năng như hiệu năng, bảo mật, và khả năng sử dụng.
- **Phần 5**: Đặc tả các yêu cầu về giao diện và dữ liệu.

---

## 2. Mô tả tổng quan

### 2.1. Bối cảnh sản phẩm

Hệ thống là một ứng dụng web độc lập, cung cấp giao diện cho nhiều vai trò người dùng khác nhau để tương tác và quản lý các hoạt động của depot. Hệ thống bao gồm một `frontend` (Next.js) và một `backend` (Node.js/TypeScript) giao tiếp qua API, với cơ sở dữ liệu PostgreSQL.

### 2.2. Chức năng sản phẩm

- **Quản lý Yêu cầu**: Khách hàng tạo yêu cầu, nhân viên depot xử lý.
- **Vận hành Kho bãi**: Nhân viên cổng, xe nâng, và quản lý kho bãi phối hợp để di chuyển và lưu trữ container.
- **Bảo trì**: Quản lý các yêu cầu sửa chữa container và thiết bị.
- **Tài chính**: Tự động hóa việc tạo hóa đơn và theo dõi thanh toán.
- **Tương tác**: Cung cấp kênh giao tiếp hiệu quả giữa các bên.

### 2.3. Đặc điểm người dùng

| Vai trò | Mô tả | Nhiệm vụ chính |
|---|---|---|
| **Quản trị viên (Admin)** | Quản lý toàn bộ hệ thống. | Cấu hình hệ thống, quản lý người dùng, phân quyền. |
| **Quản lý Kho (Depot Manager)** | Giám sát hoạt động của depot. | Xem báo cáo, điều phối công việc, xử lý các vấn đề phát sinh. |
| **Nhân viên Kho (Depot Staff)** | Xử lý các yêu cầu dịch vụ. | Xác nhận, lên lịch, theo dõi tiến trình yêu cầu. |
| **Khách hàng (Customer)** | Người sở hữu container/hàng hóa. | Tạo yêu cầu dịch vụ, theo dõi trạng thái, thanh toán, chat. |
| **Nhân viên Cổng (Gate Staff)** | Quản lý xe ra/vào. | Ghi nhận thông tin, kiểm tra chứng từ, cập nhật trạng thái container. |
| **Tài xế Xe nâng (Forklift Driver)** | Vận hành xe nâng. | Thực hiện các tác vụ di chuyển container trong bãi. |
| **Kế toán (Accountant)** | Quản lý tài chính. | Quản lý hóa đơn, xác nhận thanh toán, lập báo cáo tài chính. |
| **Tài xế (Driver)** | Người vận chuyển container. | Xem thông tin lịch hẹn, vị trí container. |

### 2.4. Ràng buộc

- Hệ thống phải là ứng dụng web, truy cập được qua các trình duyệt hiện đại.
- Giao diện phải hỗ trợ đa ngôn ngữ (tiếng Việt, tiếng Anh).
- Tuân thủ các quy định về bảo mật dữ liệu.

---

## 3. Yêu cầu chức năng

### 3.1. Module: Quản lý Người dùng và Phân quyền

- **FUNC-AUTH-01**: Hệ thống phải cho phép người dùng đăng ký tài khoản mới.
- **FUNC-AUTH-02**: Hệ thống phải xác thực người dùng bằng email/username và mật khẩu.
- **FUNC-AUTH-03**: Hệ thống phải hỗ trợ chức năng "Quên mật khẩu".
- **FUNC-USER-01**: Quản trị viên phải có khả năng tạo, sửa, xóa, và (de)activate tài khoản người dùng.
- **FUNC-PERM-01**: Quản trị viên phải có khả năng gán một hoặc nhiều vai trò cho người dùng.
- **FUNC-PERM-02**: Hệ thống phải giới hạn quyền truy cập vào các chức năng dựa trên vai trò của người dùng đã đăng nhập.

### 3.2. Module: Quản lý Yêu cầu Dịch vụ

- **FUNC-REQ-01**: Khách hàng phải có khả năng tạo yêu cầu dịch vụ mới (Nhập, Xuất, Chuyển đổi).
- **FUNC-REQ-02**: Khi tạo yêu cầu `IMPORT`, khách hàng phải cung cấp số container, ETA.
- **FUNC-REQ-03**: Khi tạo yêu cầu `EXPORT`, hệ thống phải cho phép chọn container sau.
- **FUNC-REQ-04**: Nhân viên depot phải có khả năng xem danh sách các yêu cầu và lọc theo trạng thái, loại, mã container.
- **FUNC-REQ-05**: Nhân viên depot phải có khả năng `Chấp nhận` hoặc `Từ chối` một yêu cầu `PENDING`.
- **FUNC-REQ-06**: Hệ thống phải cho phép đặt lịch hẹn (thời gian, cổng/vị trí) cho các yêu cầu đã được chấp nhận.
- **FUNC-REQ-07**: Hệ thống phải ghi lại lịch sử thay đổi trạng thái của mỗi yêu cầu.

### 3.3. Module: Quản lý Kho bãi và Xe nâng

- **FUNC-YARD-01**: Quản trị viên phải có khả năng cấu hình sơ đồ kho bãi (blocks, slots).
- **FUNC-YARD-02**: Hệ thống phải cung cấp giao diện trực quan hiển thị trạng thái của các vị trí trong bãi (trống, đã chiếm, đang bảo trì).
- **FUNC-YARD-03**: Khi một container được `GATE_IN`, hệ thống phải đề xuất vị trí lưu trữ tối ưu.
- **FUNC-FORK-01**: Quản lý kho phải có khả năng tạo tác vụ xe nâng (di chuyển container từ A đến B).
- **FUNC-FORK-02**: Tài xế xe nâng phải có khả năng xem danh sách các tác vụ được giao và cập nhật trạng thái (đang thực hiện, hoàn thành).

### 3.4. Module: Quản lý Cổng

- **FUNC-GATE-01**: Nhân viên cổng phải có khả năng xem danh sách các yêu cầu có lịch hẹn tại cổng.
- **FUNC-GATE-02**: Khi xe vào, nhân viên cổng phải ghi nhận được thông tin tài xế, biển số xe.
- **FUNC-GATE-03**: Hệ thống phải cho phép nhân viên cổng xác nhận container và cập nhật trạng thái yêu cầu thành `GATE_IN` hoặc `GATE_OUT`.

### 3.5. Module: Quản lý Bảo trì

- **FUNC-MAINT-01**: Nhân viên phải có khả năng tạo phiếu yêu cầu sửa chữa cho một container hoặc thiết bị, mô tả vấn đề.
- **FUNC-MAINT-02**: Quản lý phải có khả năng xem xét yêu cầu, ước tính chi phí và `Chấp nhận` hoặc `Từ chối`.
- **FUNC-MAINT-03**: Hệ thống phải cho phép quản lý vật tư (thêm, sửa, xóa, theo dõi số lượng tồn kho).
- **FUNC-MAINT-04**: Khi thực hiện sửa chữa, hệ thống phải tự động trừ số lượng vật tư đã sử dụng.

### 3.6. Module: Tài chính

- **FUNC-FIN-01**: Hệ thống phải có khả năng tạo hóa đơn cho các dịch vụ (phí nâng/hạ, sửa chữa,...).
- **FUNC-FIN-02**: Hóa đơn phải được liên kết với yêu cầu dịch vụ hoặc phiếu sửa chữa tương ứng.
- **FUNC-FIN-03**: Khách hàng phải có khả năng xem danh sách hóa đơn và chi tiết từng hóa đơn.
- **FUNC-FIN-04**: Kế toán phải có khả năng ghi nhận thanh toán cho hóa đơn và cập nhật trạng thái (đã thanh toán, quá hạn).

### 3.7. Module: Tương tác và Chứng từ

- **FUNC-CHAT-01**: Hệ thống phải cung cấp một cửa sổ chat riêng cho mỗi yêu cầu dịch vụ, cho phép khách hàng và nhân viên depot trao đổi.
- **FUNC-DOC-01**: Người dùng (khách hàng và nhân viên) phải có khả năng tải lên và đính kèm các tệp chứng từ (PDF, JPG, PNG) vào yêu cầu.
- **FUNC-NOTIF-01**: Hệ thống phải gửi thông báo (trong ứng dụng hoặc qua email) cho người dùng khi có các sự kiện quan trọng (ví dụ: yêu cầu được chấp nhận, có tin nhắn mới).

---

## 4. Yêu cầu phi chức năng

- **PERF-01**: Thời gian phản hồi của hệ thống cho các tác vụ thông thường không được vượt quá 2 giây.
- **SEC-01**: Mật khẩu người dùng phải được lưu trữ dưới dạng băm (hashed) an toàn.
- **SEC-02**: Hệ thống phải có cơ chế chống lại các cuộc tấn công phổ biến như XSS, CSRF, SQL Injection.
- **USAB-01**: Giao diện người dùng phải nhất quán, dễ hiểu và dễ sử dụng.
- **AVAIL-01**: Hệ thống phải đảm bảo độ sẵn sàng 99.5%.
- **COMPAT-01**: Hệ thống phải hoạt động tốt trên các trình duyệt Chrome, Firefox, Safari, Edge phiên bản mới nhất.

---

## 5. Yêu cầu Giao diện và Dữ liệu

### 5.1. Yêu cầu Giao diện

- Giao diện phải được thiết kế theo phong cách hiện đại, sạch sẽ.
- Phải có phiên bản giao diện đáp ứng (responsive) cho các thiết bị di động (đặc biệt cho các vai trò như Tài xế).

### 5.2. Yêu cầu Dữ liệu

- Dữ liệu phải được lưu trữ trong cơ sở dữ liệu quan hệ PostgreSQL.
- Hệ thống phải có cơ chế sao lưu dữ liệu định kỳ.
- Mô hình dữ liệu chi tiết được định nghĩa trong `prisma/schema.prisma`, bao gồm các thực thể chính như `User`, `ServiceRequest`, `YardSlot`, `Invoice`, `RepairTicket`, và các mối quan hệ giữa chúng.
