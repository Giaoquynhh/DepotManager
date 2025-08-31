# Finance Container Invoice Feature - Complete Documentation

## Tổng quan
Tính năng "Danh sách container cần tạo hóa đơn" đã được implement hoàn chỉnh, thay thế nút "Tạo hóa đơn" cũ bằng nút "Danh sách container cần tạo hóa đơn" và hiển thị popup modal với danh sách container cần tạo hóa đơn.

## Tính năng chính

### 1. Backend API
- **Endpoint**: `GET /finance/invoices/containers-need-invoice`
- **Business Logic**: Lấy container có trạng thái `IN_YARD`, `IN_CAR`, `GATE_OUT`
- **Data Source**: Bảng `ServiceRequest` với filter theo status

### 2. Frontend Components
- **Main Page**: `pages/finance/invoices/index.tsx` - Trang chính với bảng invoices
- **Modal Component**: `components/ContainersNeedInvoiceModal.tsx` - Popup hiển thị container
- **Service Layer**: `services/finance.ts` - API integration

### 3. Database Integration
- **ServiceRequest**: Lấy danh sách container theo trạng thái
- **RepairTicket**: Chi phí sửa chữa (future enhancement)
- **ForkliftTask**: Chi phí LOLO (future enhancement)

## File Structure & Code Mapping

### Backend Files
```
backend/
├── modules/finance/
│   ├── service/InvoiceService.ts          # Business logic
│   ├── controller/InvoiceController.ts    # API endpoints
│   └── controller/FinanceRoutes.ts        # Route configuration
├── docs/
│   ├── MODULE_7_FINANCE.md               # Updated main finance docs
│   └── FINANCE_CONTAINER_INVOICE_API.md  # Detailed API docs
└── prisma/schema.prisma                   # Database schema
```

### Frontend Files
```
frontend/
├── pages/finance/invoices/
│   └── index.tsx                          # Main page component
├── components/
│   └── ContainersNeedInvoiceModal.tsx     # Modal component
├── services/
│   └── finance.ts                         # API service
└── docs/
    └── FINANCE_INVOICE_CONTAINER_LIST.md  # Frontend docs
```

## API Endpoints

### 1. Container List API
```http
GET /finance/invoices/containers-need-invoice
Authorization: Bearer <JWT_TOKEN>
```

**Response**:
```json
[
  {
    "id": "clx1234567890",
    "type": "IMPORT",
    "container_no": "ISO 1234",
    "status": "IN_YARD",
    "createdAt": "2025-08-30T10:00:00.000Z"
  }
]
```

### 2. Invoice Details API
```http
GET /finance/invoices/details
Authorization: Bearer <JWT_TOKEN>
```

**Response**: Invoices với thông tin ServiceRequest và Customer

## Business Logic

### 1. Container Filtering
- **Status**: `IN_YARD`, `IN_CAR`, `GATE_OUT`
- **Ordering**: Theo `createdAt` giảm dần
- **Scope**: Theo `tenant_id` (nếu có)

### 2. Data Enrichment
- **ServiceRequest**: Loại container, trạng thái, container number
- **Customer**: Thông tin khách hàng (name, tax_code)
- **Costs**: Chi phí sửa chữa và LOLO (future enhancement)

## UI/UX Features

### 1. Main Button
- **Text**: "Danh sách container cần tạo hóa đơn"
- **Color**: `#28a745` (xanh lá)
- **Action**: Mở modal popup

### 2. Modal Popup
- **Size**: 90% viewport width, max 1000px
- **Content**: Bảng container với các cột:
  - Loại (Nhập/Xuất/Chuyển đổi)
  - Container No
  - Trạng thái
  - Ngày tạo
  - Hành động

### 3. Status Badges
- **Type Badges**: Màu sắc khác nhau cho IMPORT/EXPORT/CONVERT
- **Status Badges**: Màu sắc khác nhau cho IN_YARD/IN_CAR/GATE_OUT

## Implementation Status

### ✅ Completed
- [x] Backend API endpoint
- [x] Service layer implementation
- [x] Controller integration
- [x] Route configuration
- [x] Frontend modal component
- [x] Main page integration
- [x] API service methods
- [x] Complete documentation

### 🔄 In Progress
- [ ] Backend restart để apply changes
- [ ] Testing API endpoints
- [ ] Frontend testing

### 📋 Future Enhancements
- [ ] Chi phí sửa chữa từ RepairTicket
- [ ] Chi phí LOLO từ ForkliftTask
- [ ] EIR upload functionality
- [ ] Create invoice flow
- [ ] Cost calculation integration

## Testing

### 1. Backend Testing
```bash
# Test API endpoint
curl -X GET "http://localhost:5002/finance/invoices/containers-need-invoice" \
  -H "Authorization: Bearer <JWT_TOKEN>" \
  -H "Content-Type: application/json"
```

### 2. Frontend Testing
- Navigate to `/finance/invoices`
- Click button "Danh sách container cần tạo hóa đơn"
- Verify modal opens with container list
- Check responsive design

## Deployment Notes

### 1. Backend Requirements
- Restart backend service để apply code changes
- Verify Prisma schema compatibility
- Check JWT authentication

### 2. Frontend Requirements
- Next.js 12+ với TypeScript
- SWR library cho data fetching
- Styled JSX cho styling

### 3. Environment Variables
```bash
# Backend
DATABASE_URL=postgresql://user:password@localhost:5432/container_manager
JWT_SECRET=your_jwt_secret_here

# Frontend
NEXT_PUBLIC_API_URL=http://localhost:5002
```

## Troubleshooting

### 1. Common Issues
- **Backend not starting**: Check TypeScript compilation errors
- **API 404**: Verify route configuration
- **Modal not opening**: Check component import paths
- **Data not loading**: Verify API endpoint và authentication

### 2. Debug Steps
1. Check backend logs cho compilation errors
2. Verify API endpoint với Postman/curl
3. Check browser console cho frontend errors
4. Verify component props và state management

## Support & Maintenance

### 1. Code Ownership
- **Backend**: Finance module team
- **Frontend**: UI/UX team
- **Database**: DevOps team

### 2. Documentation Updates
- Update docs khi có thay đổi business logic
- Maintain API documentation
- Update frontend component guides

### 3. Monitoring
- API response time monitoring
- Error tracking và alerting
- User interaction analytics

## Related Documentation

- [MODULE_7_FINANCE.md](backend/docs/MODULE_7_FINANCE.md) - Main finance module docs
- [FINANCE_CONTAINER_INVOICE_API.md](backend/docs/FINANCE_CONTAINER_INVOICE_API.md) - Detailed API docs
- [FINANCE_INVOICE_CONTAINER_LIST.md](frontend/docs/FINANCE_INVOICE_CONTAINER_LIST.md) - Frontend implementation docs

## Contact & Support

- **Backend Issues**: Finance module team
- **Frontend Issues**: UI/UX team
- **Database Issues**: DevOps team
- **General Questions**: Tech lead hoặc project manager
