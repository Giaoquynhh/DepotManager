# Request ID Unique Logic - Frontend Documentation

## Tổng quan
Tài liệu này mô tả cách frontend xử lý logic request ID duy nhất và hiển thị thông tin request cho user.

## Vấn đề ban đầu
- User tạo request cho container 1234, request bị reject
- User tạo request mới cho cùng container 1234
- Cần đảm bảo user hiểu rằng đây là 2 request khác nhau
- Cần hiển thị thông tin rõ ràng để tránh nhầm lẫn

## Giải pháp Frontend

### 1. Request List Display

#### 1.1 Request Table Component
**File:** `components/RequestTable.tsx`

```typescript
interface Request {
  id: string;                    // ID duy nhất của request
  type: string;                  // IMPORT | EXPORT
  container_no: string;          // Container number
  eta: string;                   // Estimated Time of Arrival
  status: string;                // PENDING | REJECTED | PENDING_ACCEPT | ...
  rejected_reason?: string;      // Lý do reject (nếu có)
  rejected_at?: string;          // Thời gian reject (nếu có)
  createdAt: string;             // Thời gian tạo request
}

// Hiển thị request với thông tin đầy đủ
const RequestTable = ({ data, loading, userRole }: RequestTableProps) => {
  return (
    <table className="table table-modern">
      <thead>
        <tr>
          <th>LOẠI</th>
          <th>CONTAINER</th>
          <th>ETA</th>
          <th>TRẠNG THÁI</th>
          <th>CHỨNG TỪ</th>
          <th>THANH TOÁN</th>
          <th>CHAT</th>
          <th>HÀNH ĐỘNG</th>
        </tr>
      </thead>
      <tbody>
        {data.map((item) => (
          <tr key={item.id} className="table-row">
            <td>{getTypeBadge(item.type)}</td>
            <td>{item.container_no}</td>
            <td>{formatETA(item.eta)}</td>
            <td>{getStatusBadge(item.status)}</td>
            <td>{renderDocuments(item.documents)}</td>
            <td>{renderPaymentStatus(item)}</td>
            <td>{renderChatButton(item.id)}</td>
            <td>{renderActions(item, userRole)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};
```

#### 1.2 Status Badge Component
```typescript
const getStatusBadge = (status: string) => {
  const statusConfig = {
    'PENDING': { class: 'status-pending', text: 'CHỜ XỬ LÝ' },
    'REJECTED': { class: 'status-rejected', text: 'TỪ CHỐI' },
    'PENDING_ACCEPT': { class: 'status-pending-accept', text: 'CHỜ CHẤP NHẬN' },
    'ACCEPT': { class: 'status-accept', text: 'ĐÃ CHẤP NHẬN' },
    'COMPLETED': { class: 'status-completed', text: 'HOÀN THÀNH' }
  };

  const config = statusConfig[status] || { class: 'status-unknown', text: status };
  
  return (
    <span className={`status-badge ${config.class}`}>
      {config.text}
    </span>
  );
};
```

### 2. Request Creation Flow

#### 2.1 Create Request Form
**File:** `components/RequestForm.tsx`

```typescript
const RequestForm = ({ onSuccess, onCancel }: RequestFormProps) => {
  const [formData, setFormData] = useState({
    type: 'IMPORT',
    container_no: '',
    eta: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // Gọi API tạo request mới
      const response = await requestsApi.create(formData);
      
      // Hiển thị thông báo thành công với request ID
      toast.success(`Tạo request thành công! ID: ${response.data.id}`);
      
      // Refresh danh sách request
      onSuccess();
    } catch (error) {
      // Hiển thị lỗi validation
      toast.error(error.response?.data?.message || 'Có lỗi xảy ra');
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="form-group">
        <label>Loại yêu cầu</label>
        <select 
          value={formData.type}
          onChange={(e) => setFormData({...formData, type: e.target.value})}
        >
          <option value="IMPORT">Nhập</option>
          <option value="EXPORT">Xuất</option>
        </select>
      </div>
      
      <div className="form-group">
        <label>Mã container</label>
        <input
          type="text"
          value={formData.container_no}
          onChange={(e) => setFormData({...formData, container_no: e.target.value})}
          placeholder="Nhập mã container"
        />
      </div>
      
      <div className="form-group">
        <label>Thời gian dự kiến</label>
        <input
          type="datetime-local"
          value={formData.eta}
          onChange={(e) => setFormData({...formData, eta: e.target.value})}
        />
      </div>
      
      <div className="form-actions">
        <button type="button" onClick={onCancel}>Hủy</button>
        <button type="submit">Tạo yêu cầu</button>
      </div>
    </form>
  );
};
```

#### 2.2 Container Validation
```typescript
// Kiểm tra container đã tồn tại trước khi tạo request
const validateContainer = async (containerNo: string) => {
  try {
    // Gọi API kiểm tra container
    const response = await requestsApi.checkContainer(containerNo);
    return { valid: true, message: '' };
  } catch (error) {
    return { 
      valid: false, 
      message: error.response?.data?.message || 'Container không hợp lệ' 
    };
  }
};
```

### 3. Request Details View

#### 3.1 Request Detail Modal
```typescript
const RequestDetailModal = ({ requestId, visible, onClose }) => {
  const [request, setRequest] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (visible && requestId) {
      loadRequestDetails();
    }
  }, [visible, requestId]);

  const loadRequestDetails = async () => {
    setLoading(true);
    try {
      const response = await requestsApi.getById(requestId);
      setRequest(response.data);
    } catch (error) {
      toast.error('Không thể tải thông tin request');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} onClose={onClose} title="Chi tiết yêu cầu">
      {loading ? (
        <div className="loading">Đang tải...</div>
      ) : request ? (
        <div className="request-details">
          <div className="detail-row">
            <label>Request ID:</label>
            <span className="request-id">{request.id}</span>
          </div>
          
          <div className="detail-row">
            <label>Container:</label>
            <span>{request.container_no}</span>
          </div>
          
          <div className="detail-row">
            <label>Trạng thái:</label>
            <span className={`status ${request.status.toLowerCase()}`}>
              {getStatusText(request.status)}
            </span>
          </div>
          
          <div className="detail-row">
            <label>Thời gian tạo:</label>
            <span>{formatDateTime(request.createdAt)}</span>
          </div>
          
          {request.rejected_at && (
            <div className="detail-row">
              <label>Thời gian từ chối:</label>
              <span>{formatDateTime(request.rejected_at)}</span>
            </div>
          )}
          
          {request.rejected_reason && (
            <div className="detail-row">
              <label>Lý do từ chối:</label>
              <span className="rejected-reason">{request.rejected_reason}</span>
            </div>
          )}
        </div>
      ) : null}
    </Modal>
  );
};
```

### 4. Error Handling & User Feedback

#### 4.1 Error Messages
```typescript
const getErrorMessage = (error: any) => {
  const errorMessages = {
    'CONTAINER_EXISTS': 'Container đã tồn tại trong hệ thống',
    'CONTAINER_IN_REPAIR': 'Container đang trong quy trình sửa chữa',
    'CONTAINER_IN_YARD': 'Container đã được đặt vào yard',
    'VALIDATION_ERROR': 'Thông tin không hợp lệ',
    'NETWORK_ERROR': 'Lỗi kết nối mạng'
  };

  return errorMessages[error.code] || error.message || 'Có lỗi xảy ra';
};
```

#### 4.2 Success Messages
```typescript
const showSuccessMessage = (action: string, requestId: string) => {
  const messages = {
    'CREATE': `Tạo request thành công! ID: ${requestId}`,
    'REJECT': `Từ chối request thành công! ID: ${requestId}`,
    'ACCEPT': `Chấp nhận request thành công! ID: ${requestId}`,
    'UPDATE': `Cập nhật request thành công! ID: ${requestId}`
  };

  toast.success(messages[action] || 'Thao tác thành công');
};
```

### 5. State Management

#### 5.1 Request State Hook
```typescript
const useRequestState = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const loadRequests = async () => {
    setLoading(true);
    try {
      const response = await requestsApi.list();
      setRequests(response.data);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const createRequest = async (data) => {
    try {
      const response = await requestsApi.create(data);
      setRequests(prev => [response.data, ...prev]);
      return response.data;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const updateRequestStatus = async (id, status, reason) => {
    try {
      const response = await requestsApi.updateStatus(id, status, reason);
      setRequests(prev => 
        prev.map(req => req.id === id ? response.data : req)
      );
      return response.data;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  return {
    requests,
    loading,
    error,
    loadRequests,
    createRequest,
    updateRequestStatus
  };
};
```

### 6. UI/UX Improvements

#### 6.1 Request ID Display
```typescript
// Hiển thị request ID trong tooltip hoặc modal
const RequestIdTooltip = ({ requestId }) => (
  <Tooltip content={`Request ID: ${requestId}`}>
    <span className="request-id-hint">ℹ️</span>
  </Tooltip>
);
```

#### 6.2 Status History
```typescript
// Hiển thị lịch sử thay đổi trạng thái
const StatusHistory = ({ history }) => (
  <div className="status-history">
    <h4>Lịch sử trạng thái</h4>
    <div className="history-timeline">
      {history.map((item, index) => (
        <div key={index} className="history-item">
          <div className="history-time">
            {formatDateTime(item.at)}
          </div>
          <div className="history-action">
            {item.action} {item.reason && `- ${item.reason}`}
          </div>
        </div>
      ))}
    </div>
  </div>
);
```

### 7. Testing

#### 7.1 Unit Tests
```typescript
// Test RequestTable component
describe('RequestTable', () => {
  it('should display request with unique ID', () => {
    const mockRequest = {
      id: 'cmfc4twz40000hdsu0w5iqjbk',
      container_no: '1234',
      status: 'PENDING'
    };

    render(<RequestTable data={[mockRequest]} />);
    
    expect(screen.getByText('cmfc4twz40000hdsu0w5iqjbk')).toBeInTheDocument();
    expect(screen.getByText('1234')).toBeInTheDocument();
  });

  it('should show different IDs for different requests', () => {
    const mockRequests = [
      { id: 'req1', container_no: '1234', status: 'REJECTED' },
      { id: 'req2', container_no: '1234', status: 'PENDING' }
    ];

    render(<RequestTable data={mockRequests} />);
    
    expect(screen.getByText('req1')).toBeInTheDocument();
    expect(screen.getByText('req2')).toBeInTheDocument();
  });
});
```

#### 7.2 Integration Tests
```typescript
// Test create request flow
describe('Create Request Flow', () => {
  it('should create new request with unique ID', async () => {
    const mockResponse = {
      id: 'cmfc4twz40000hdsu0w5iqjbk',
      container_no: '1234',
      status: 'PENDING'
    };

    mockApi.create.mockResolvedValue({ data: mockResponse });

    render(<RequestForm onSuccess={jest.fn()} />);
    
    fireEvent.change(screen.getByLabelText('Mã container'), {
      target: { value: '1234' }
    });
    
    fireEvent.click(screen.getByText('Tạo yêu cầu'));
    
    await waitFor(() => {
      expect(mockApi.create).toHaveBeenCalledWith({
        type: 'IMPORT',
        container_no: '1234',
        eta: expect.any(String)
      });
    });
  });
});
```

### 8. Performance Optimization

#### 8.1 Memoization
```typescript
// Memoize expensive calculations
const RequestTable = React.memo(({ data, loading, userRole }) => {
  const memoizedData = useMemo(() => 
    data.map(item => ({
      ...item,
      formattedETA: formatETA(item.eta),
      statusBadge: getStatusBadge(item.status)
    })), [data]
  );

  return (
    <table className="table table-modern">
      {/* Render table */}
    </table>
  );
});
```

#### 8.2 Virtual Scrolling
```typescript
// For large lists of requests
import { FixedSizeList as List } from 'react-window';

const VirtualizedRequestTable = ({ requests }) => (
  <List
    height={600}
    itemCount={requests.length}
    itemSize={60}
    itemData={requests}
  >
    {({ index, style, data }) => (
      <div style={style}>
        <RequestRow request={data[index]} />
      </div>
    )}
  </List>
);
```

### 9. Accessibility

#### 9.1 ARIA Labels
```typescript
const RequestTable = () => (
  <table 
    className="table table-modern"
    role="table"
    aria-label="Danh sách yêu cầu dịch vụ"
  >
    <thead>
      <tr>
        <th scope="col">LOẠI</th>
        <th scope="col">CONTAINER</th>
        <th scope="col">ETA</th>
        <th scope="col">TRẠNG THÁI</th>
        {/* ... other headers */}
      </tr>
    </thead>
    <tbody>
      {data.map((item) => (
        <tr key={item.id}>
          <td>{getTypeBadge(item.type)}</td>
          <td>{item.container_no}</td>
          <td>{formatETA(item.eta)}</td>
          <td>
            <span 
              className={`status-badge ${item.status.toLowerCase()}`}
              aria-label={`Trạng thái: ${getStatusText(item.status)}`}
            >
              {getStatusText(item.status)}
            </span>
          </td>
          {/* ... other cells */}
        </tr>
      ))}
    </tbody>
  </table>
);
```

### 10. Internationalization

#### 10.1 Translation Keys
```json
{
  "pages": {
    "requests": {
      "tableHeaders": {
        "type": "Loại",
        "container": "Container",
        "eta": "ETA",
        "status": "Trạng thái",
        "documents": "Chứng từ",
        "payment": "Thanh toán",
        "chat": "Chat",
        "actions": "Hành động"
      },
      "status": {
        "pending": "Chờ xử lý",
        "rejected": "Từ chối",
        "pending_accept": "Chờ chấp nhận",
        "accept": "Đã chấp nhận",
        "completed": "Hoàn thành"
      },
      "messages": {
        "createSuccess": "Tạo request thành công! ID: {id}",
        "rejectSuccess": "Từ chối request thành công! ID: {id}",
        "containerExists": "Container đã tồn tại trong hệ thống",
        "containerInRepair": "Container đang trong quy trình sửa chữa"
      }
    }
  }
}
```

#### 10.2 Translation Hook
```typescript
const useTranslation = () => {
  const { t } = useTranslation();
  
  const getStatusText = (status: string) => {
    return t(`pages.requests.status.${status.toLowerCase()}`);
  };
  
  const getSuccessMessage = (action: string, id: string) => {
    return t(`pages.requests.messages.${action}Success`, { id });
  };
  
  return { t, getStatusText, getSuccessMessage };
};
```

## Kết luận

Frontend implementation đảm bảo:
- ✅ Hiển thị request ID duy nhất cho mỗi request
- ✅ User hiểu rõ đây là 2 request khác nhau
- ✅ UI/UX rõ ràng, dễ hiểu
- ✅ Error handling và user feedback tốt
- ✅ Performance tối ưu với memoization
- ✅ Accessibility và internationalization
- ✅ Testing coverage đầy đủ
