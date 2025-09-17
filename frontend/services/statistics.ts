import { api } from './api';

export interface StatisticsOverview {
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
      REJECTED?: number;
      GATE_REJECTED?: number;
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

export interface StatisticsResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export type TimeRange = 'today' | 'week' | 'month' | 'year';

export class StatisticsService {
  static async getOverview(timeRange: TimeRange = 'today'): Promise<StatisticsOverview> {
    const response = await api.get<StatisticsResponse<StatisticsOverview>>(
      `/statistics/overview?timeRange=${timeRange}`
    );
    return response.data.data;
  }

  static async getContainers(timeRange: TimeRange = 'today') {
    const response = await api.get<StatisticsResponse<StatisticsOverview['containers']>>(
      `/statistics/containers?timeRange=${timeRange}`
    );
    return response.data.data;
  }

  static async getCustomers(timeRange: TimeRange = 'today') {
    const response = await api.get<StatisticsResponse<StatisticsOverview['customers']>>(
      `/statistics/customers?timeRange=${timeRange}`
    );
    return response.data.data;
  }

  static async getMaintenance(timeRange: TimeRange = 'today') {
    const response = await api.get<StatisticsResponse<StatisticsOverview['maintenance']>>(
      `/statistics/maintenance?timeRange=${timeRange}`
    );
    return response.data.data;
  }

  static async getFinancial(timeRange: TimeRange = 'today') {
    const response = await api.get<StatisticsResponse<StatisticsOverview['financial']>>(
      `/statistics/financial?timeRange=${timeRange}`
    );
    return response.data.data;
  }

  static async getOperational(timeRange: TimeRange = 'today') {
    const response = await api.get<StatisticsResponse<StatisticsOverview['operational']>>(
      `/statistics/operational?timeRange=${timeRange}`
    );
    return response.data.data;
  }

  static formatCurrency(amount: number): string {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount);
  }

  static formatNumber(num: number): string {
    return new Intl.NumberFormat('vi-VN').format(num);
  }
}
