# Depot Dashboard Component

## Tổng quan

DepotDashboard là một component dashboard hiện đại được thiết kế theo mẫu UI/UX chuyên nghiệp, cung cấp giao diện quản lý depot với các tính năng:

- **Header**: Logo, thông báo, chọn time range, role selector, refresh button, avatar
- **Sidebar**: Navigation menu với các module theo role
- **Main Content**: Dashboard chính với KPI cards, charts, activities, tasks

## Cấu trúc Component

### 1. Header Section
- Logo và tên hệ thống
- Notifications với badge
- Time range selector (Today, Week, Month, Year)
- Role selector (SystemAdmin, BusinessAdmin, etc.)
- Refresh button
- User avatar

### 2. Sidebar Navigation
- Module navigation dựa trên role
- Icons và labels cho từng module
- Active state highlighting

### 3. Main Content

#### Dashboard Module
- **KPI Cards**: Total Containers, Yard Utilization, Monthly Revenue, Pending Tasks
- **Charts Section**: Revenue Trend, Service Distribution
- **Container Operations**: Weekly inbound/outbound chart
- **Activity & Tasks**: Recent activities và pending tasks

#### Services Module
- Service Management interface
- Tabs: Service Requests, Active Services, Completed
- Service request list với actions

## Role-based Permissions

Component sử dụng hệ thống phân quyền dựa trên role:

```typescript
const modules = [
  { id: "dashboard", name: "Dashboard", icon: BarChart3, roles: ["SystemAdmin", "BusinessAdmin", "YardManager", "MaintenanceManager"] },
  { id: "personnel", name: "Personnel Management", icon: Users, roles: ["SystemAdmin", "BusinessAdmin"] },
  { id: "customers", name: "Customer Management", icon: Building2, roles: ["SystemAdmin", "BusinessAdmin", "SaleAdmin"] },
  // ... more modules
]
```

## Dependencies

### UI Components
- `Card`, `CardHeader`, `CardTitle`, `CardDescription`, `CardContent`
- `Button` với variants: default, outline, destructive
- `Badge` với variants: default, secondary, destructive
- `Tabs`, `TabsList`, `TabsTrigger`, `TabsContent`
- `Avatar`, `AvatarFallback`

### Charts
- `recharts` cho các biểu đồ
- `BarChart`, `LineChart`, `PieChart`
- `ResponsiveContainer` cho responsive design

### Icons
- `lucide-react` cho các icons

### Services
- `StatisticsService` để lấy dữ liệu thực
- `useStatisticsPermissions` cho phân quyền
- `useUserRole` để lấy role hiện tại

## CSS Styling

Component sử dụng CSS custom properties và classes:

```css
.depot-dashboard {
  --background: 0 0% 100%;
  --foreground: 222.2 84% 4.9%;
  --primary: 221.2 83.2% 53.3%;
  // ... more variables
}
```

## Usage

```tsx
import { DepotDashboard } from './components/statistics/DepotDashboard';

export default function StatisticsPage() {
  return <DepotDashboard />;
}
```

## Demo Page

Có thể test component tại: `/depot-dashboard-demo`

## Features

### 1. Real-time Data
- Tích hợp với StatisticsService
- Auto-refresh khi thay đổi time range
- Loading states và error handling

### 2. Responsive Design
- Mobile-friendly sidebar
- Grid layout cho cards và charts
- Responsive charts với Recharts

### 3. Interactive Elements
- Role switching
- Time range selection
- Module navigation
- Service request actions

### 4. Modern UI/UX
- Clean design với proper spacing
- Consistent color scheme
- Smooth transitions
- Professional typography

## Customization

### Adding New Modules
```typescript
const modules = [
  // ... existing modules
  { id: "new-module", name: "New Module", icon: NewIcon, roles: ["SystemAdmin"] }
]
```

### Adding New Roles
```typescript
const roles = [
  // ... existing roles
  { id: "NewRole", name: "New Role", color: "bg-chart-6" }
]
```

### Styling
Chỉnh sửa CSS variables trong `depot-dashboard.css`:

```css
.depot-dashboard {
  --primary: 221.2 83.2% 53.3%; /* Change primary color */
  --chart-1: #f97316; /* Change chart colors */
}
```

## Integration

Component được tích hợp vào StatisticsDashboard:

```tsx
// StatisticsDashboard.tsx
export const StatisticsDashboard: React.FC = () => {
  return <DepotDashboard />;
};
```

## Notes

- Component sử dụng mock data cho charts (revenueData, serviceDistribution, containerData)
- Có thể thay thế bằng dữ liệu thực từ API
- Responsive design được tối ưu cho desktop và mobile
- Accessibility được đảm bảo với proper ARIA labels và keyboard navigation

