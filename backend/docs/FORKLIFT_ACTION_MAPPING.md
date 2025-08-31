# Forklift Action Mapping - Backend to Frontend

## Overview
Mapping giữa backend API endpoints và frontend actions cho module Forklift Management.

## Action Flow Changes

### Before (Cũ)
```
PENDING → [BẮT ĐẦU] → IN_PROGRESS → [HOÀN THÀNH] → COMPLETED
```

### After (Mới)
```
PENDING → [HỦY] → CANCELLED
IN_PROGRESS → Hiển thị "Đang thực hiện"
```

## Backend API Endpoints

### 1. Complete Job (Updated)
```typescript
// File: manageContainer/backend/modules/forklift/controller/ForkliftController.ts
async completeJob(req: AuthRequest, res: Response) {
  // UPDATED LOGIC:
  // Allow completion from both PENDING and IN_PROGRESS status
  if (job.status !== 'IN_PROGRESS' && job.status !== 'PENDING') {
    return res.status(400).json({ 
      message: 'Job is not in progress or pending status' 
    });
  }
}
```

**Endpoint**: `PATCH /forklift/jobs/:jobId/complete`
**Status Allowed**: `PENDING`, `IN_PROGRESS`

### 2. Cancel Job
```typescript
// File: manageContainer/backend/modules/forklift/controller/ForkliftController.ts
async cancelJob(req: AuthRequest, res: Response) {
  // Only allow cancel from PENDING and IN_PROGRESS
  if (job.status === 'COMPLETED') {
    return res.status(400).json({ message: 'Cannot cancel completed job' });
  }
}
```

**Endpoint**: `PATCH /forklift/jobs/:jobId/cancel`
**Status Allowed**: `PENDING`, `IN_PROGRESS`

### 3. Assign Driver
```typescript
// File: manageContainer/backend/modules/forklift/controller/ForkliftController.ts
async assignDriver(req: AuthRequest, res: Response) {
  // Can assign driver to any status
}
```

**Endpoint**: `PATCH /forklift/jobs/:jobId/assign-driver`
**Status Allowed**: `PENDING`, `IN_PROGRESS`, `COMPLETED`, `CANCELLED`

### 4. Update Cost
```typescript
// File: manageContainer/backend/modules/forklift/controller/ForkliftController.ts
async updateCost(req: AuthRequest, res: Response) {
  // Can update cost for any status
}
```

**Endpoint**: `PATCH /forklift/jobs/:jobId/cost`
**Status Allowed**: `PENDING`, `IN_PROGRESS`, `COMPLETED`, `CANCELLED`

## Frontend Action Mapping

### 1. PENDING Status Actions
```typescript
// File: manageContainer/frontend/pages/Forklift/index.tsx
{task.status === 'PENDING' && (
  <button onClick={() => handleCancelJob(task.id)}>
    ❌ Hủy
  </button>
)}
```

### 2. IN_PROGRESS Status Actions
```typescript
{task.status === 'IN_PROGRESS' && (
  <div style={{ color: '#6b7280', fontSize: '11px' }}>
    Đang thực hiện
  </div>
)}
```

### 3. COMPLETED/CANCELLED Status Actions
```typescript
<>
  <button onClick={() => handleAssignDriver(task)}>
    👤 Gán tài xế
  </button>
  <button onClick={() => setCostModalOpen(true)}>
    💰 Chỉnh sửa chi phí
  </button>
</>
```

## Database Schema

### ForkliftTask Model
```prisma
// File: manageContainer/backend/prisma/schema.prisma
model ForkliftTask {
  id                  String   @id @default(cuid())
  container_no        String
  from_slot_id        String?
  to_slot_id          String?
  status              String   // PENDING | IN_PROGRESS | COMPLETED | CANCELLED
  assigned_driver_id  String?
  created_by          String
  cancel_reason       String?
  cost                Float?   @default(0)
  createdAt           DateTime @default(now())
  updatedAt           DateTime @updatedAt
}
```

## API Response Mapping

### GET /forklift/jobs Response
```typescript
// Frontend Interface
interface ForkliftTask {
  id: string;
  container_no: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  assigned_driver_id?: string;
  cost?: number;
  createdAt: string;
  updatedAt: string;
  driver?: {
    id: string;
    full_name: string;
    email: string;
  };
  container_info?: {
    driver_name?: string;
    license_plate?: string;
    status?: string;
    type?: string;
  };
  actual_location?: {
    id: string;
    tier: number;
    status: string;
    slot: {
      id: string;
      code: string;
      block: {
        code: string;
        yard: {
          name: string;
        };
      };
    };
  } | null;
}
```

## Error Handling

### Backend Error Responses
```typescript
// Common error responses
{
  "message": "Job is not in progress or pending status"
}
{
  "message": "Cannot cancel completed job"
}
{
  "message": "Forklift job not found"
}
```

### Frontend Error Handling
```typescript
// File: manageContainer/frontend/pages/Forklift/index.tsx
const handleCompleteJob = async (taskId: string) => {
  try {
    await api.patch(`/forklift/jobs/${taskId}/complete`);
    loadForkliftTasks();
  } catch (err: any) {
    alert(err?.response?.data?.message || 'Không thể hoàn thành công việc');
  }
};
```

## Testing

### Backend API Tests
```bash
# Test complete job from PENDING status
curl -X PATCH http://localhost:5000/forklift/jobs/:jobId/complete \
  -H "Authorization: Bearer <token>"

# Test complete job from IN_PROGRESS status  
curl -X PATCH http://localhost:5000/forklift/jobs/:jobId/complete \
  -H "Authorization: Bearer <token>"
```

### Frontend Component Tests
```typescript
// Test button rendering for PENDING status
const pendingTask = { status: 'PENDING', id: 'test-id' };
const wrapper = render(<ForkliftTaskRow task={pendingTask} />);
expect(wrapper.getByText('✅ Hoàn thành')).toBeInTheDocument();
expect(wrapper.getByText('❌ Hủy')).toBeInTheDocument();
```

## Migration Notes

### Removed Features
- ❌ `startJob` action button removed from frontend
- ❌ `completeJob` action button removed from frontend
- ❌ `PATCH /forklift/jobs/:jobId/start` endpoint still exists but unused
- ❌ Status transition `PENDING → IN_PROGRESS` no longer needed
- ❌ Direct completion from `PENDING` status removed

### Added Features
- ✅ "Đang thực hiện" status display for IN_PROGRESS
- ✅ Updated action flow documentation
- ✅ Simplified action management

## Future Considerations

1. **Route Optimization**: Consider removing unused `startJob` endpoint
2. **Status Simplification**: Consider removing `IN_PROGRESS` status entirely
3. **UI Enhancement**: Add confirmation dialogs for direct completion
4. **Audit Trail**: Track direct completion vs traditional flow
