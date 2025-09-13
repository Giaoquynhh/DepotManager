export interface StatisticsOverviewDto {
  containers: {
    total: number;
    today: number;
    thisWeek: number;
    thisMonth: number;
    byStatus: {
      PENDING: number;
      SCHEDULED: number;
      GATE_IN: number;
      IN_YARD: number;
      IN_CAR: number;
      GATE_OUT: number;
      COMPLETED: number;
    };
    byType: {
      IMPORT: number;
      EXPORT: number;
    };
  };
  customers: {
    total: number;
    active: number;
    newThisMonth: number;
    topCustomers: Array<{
      id: string;
      name: string;
      requestCount: number;
      totalRevenue: number;
    }>;
  };
  maintenance: {
    total: number;
    byStatus: {
      PENDING: number;
      APPROVED: number;
      IN_PROGRESS: number;
      COMPLETED: number;
      CANCELLED: number;
    };
    averageRepairTime: number;
    totalCost: number;
    commonIssues: Array<{
      issue: string;
      count: number;
    }>;
  };
  financial: {
    totalRevenue: number;
    thisMonthRevenue: number;
    thisYearRevenue: number;
    unpaidAmount: number;
    overdueAmount: number;
    averageInvoiceValue: number;
    revenueByService: Array<{
      service: string;
      amount: number;
    }>;
  };
  operational: {
    gateInToday: number;
    gateOutToday: number;
    forkliftUtilization: number;
    yardUtilization: number;
    averageProcessingTime: number;
    completionRate: number;
  };
}

export interface TimeRangeQuery {
  timeRange: 'today' | 'week' | 'month' | 'year';
}

export interface StatisticsResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}
