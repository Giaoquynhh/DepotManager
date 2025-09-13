# Statistics Module

## Overview
This module provides comprehensive statistics and analytics for the Container Management System. It includes data aggregation for containers, customers, maintenance, financial, and operational metrics.

## Features
- Real-time statistics dashboard
- Role-based access control
- Time range filtering (today, week, month, year)
- Comprehensive data aggregation
- Performance optimized queries

## API Endpoints

### GET /statistics/overview
Returns complete statistics overview for the specified time range.

**Query Parameters:**
- `timeRange` (optional): 'today' | 'week' | 'month' | 'year' (default: 'today')

**Authorization:** SystemAdmin, BusinessAdmin, Accountant, SaleAdmin, YardManager, MaintenanceManager

### GET /statistics/containers
Returns container-specific statistics.

**Authorization:** All roles except Partner, Driver, Security

### GET /statistics/customers
Returns customer-specific statistics.

**Authorization:** SystemAdmin, BusinessAdmin, Accountant, SaleAdmin, YardManager

### GET /statistics/maintenance
Returns maintenance-specific statistics.

**Authorization:** SystemAdmin, BusinessAdmin, Accountant, MaintenanceManager

### GET /statistics/financial
Returns financial statistics.

**Authorization:** SystemAdmin, BusinessAdmin, Accountant

### GET /statistics/operational
Returns operational statistics.

**Authorization:** SystemAdmin, BusinessAdmin, Accountant, SaleAdmin, YardManager, MaintenanceManager

## Data Structure

### Container Statistics
- Total containers
- Containers by status (PENDING, SCHEDULED, GATE_IN, IN_YARD, IN_CAR, GATE_OUT, COMPLETED)
- Containers by type (IMPORT, EXPORT)
- Time-based counts (today, this week, this month)

### Customer Statistics
- Total customers
- Active customers
- New customers this month
- Top customers by request count and revenue

### Maintenance Statistics
- Total repair tickets
- Repair tickets by status
- Average repair time
- Total repair cost
- Common issues

### Financial Statistics
- Total revenue
- Monthly and yearly revenue
- Unpaid and overdue amounts
- Average invoice value
- Revenue by service type

### Operational Statistics
- Gate In/Out counts
- Forklift utilization rate
- Yard utilization rate
- Average processing time
- Completion rate

## Usage Example

```typescript
// Get today's overview
const response = await fetch('/api/statistics/overview?timeRange=today');
const data = await response.json();

// Get container statistics for this month
const containerStats = await fetch('/api/statistics/containers?timeRange=month');
const containerData = await containerStats.json();
```

## Performance Considerations
- Database queries are optimized with proper indexing
- Aggregation functions are used for efficient counting
- Time-based filtering reduces data processing
- Caching can be implemented for frequently accessed data

## Error Handling
All endpoints return standardized error responses:
```json
{
  "success": false,
  "data": null,
  "message": "Error description"
}
```
