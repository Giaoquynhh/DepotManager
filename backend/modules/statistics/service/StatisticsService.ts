import { PrismaClient } from '@prisma/client';
import { StatisticsOverviewDto } from '../dto/StatisticsDtos';

export class StatisticsService {
  constructor(private prisma: PrismaClient) {}

  async getOverview(timeRange: 'today' | 'week' | 'month' | 'year'): Promise<StatisticsOverviewDto> {
    const dateFilter = this.getDateFilter(timeRange);
    
    // Container statistics
    const containerStats = await this.getContainerStatistics(dateFilter);
    
    // Customer statistics
    const customerStats = await this.getCustomerStatistics(dateFilter);
    
    // Maintenance statistics
    const maintenanceStats = await this.getMaintenanceStatistics(dateFilter);
    
    // Financial statistics
    const financialStats = await this.getFinancialStatistics(dateFilter);
    
    // Operational statistics
    const operationalStats = await this.getOperationalStatistics(dateFilter);

    return {
      containers: containerStats,
      customers: customerStats,
      maintenance: maintenanceStats,
      financial: financialStats,
      operational: operationalStats,
    };
  }

  private getDateFilter(timeRange: string) {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    switch (timeRange) {
      case 'today':
        return {
          gte: startOfDay,
          lte: now,
        };
      case 'week':
        const startOfWeek = new Date(startOfDay);
        startOfWeek.setDate(startOfDay.getDate() - startOfDay.getDay());
        return {
          gte: startOfWeek,
          lte: now,
        };
      case 'month':
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        return {
          gte: startOfMonth,
          lte: now,
        };
      case 'year':
        const startOfYear = new Date(now.getFullYear(), 0, 1);
        return {
          gte: startOfYear,
          lte: now,
        };
      default:
        return {
          gte: startOfDay,
          lte: now,
        };
    }
  }

  private async getContainerStatistics(dateFilter: any) {
    const totalContainers = await this.prisma.serviceRequest.count();
    
    const containersToday = await this.prisma.serviceRequest.count({
      where: {
        createdAt: dateFilter,
      },
    });

    const containersThisWeek = await this.prisma.serviceRequest.count({
      where: {
        createdAt: this.getDateFilter('week'),
      },
    });

    const containersThisMonth = await this.prisma.serviceRequest.count({
      where: {
        createdAt: this.getDateFilter('month'),
      },
    });

    // Container by status
    const statusCounts = await this.prisma.serviceRequest.groupBy({
      by: ['status'],
      _count: {
        status: true,
      },
    });

    const byStatus = {
      PENDING: 0,
      SCHEDULED: 0,
      GATE_IN: 0,
      IN_YARD: 0,
      IN_CAR: 0,
      GATE_OUT: 0,
      COMPLETED: 0,
    };

    statusCounts.forEach((item) => {
      byStatus[item.status as keyof typeof byStatus] = item._count.status;
    });

    // Container by type
    const typeCounts = await this.prisma.serviceRequest.groupBy({
      by: ['type'],
      _count: {
        type: true,
      },
    });

    const byType = {
      IMPORT: 0,
      EXPORT: 0,
    };

    typeCounts.forEach((item) => {
      byType[item.type as keyof typeof byType] = item._count.type;
    });

    return {
      total: totalContainers,
      today: containersToday,
      thisWeek: containersThisWeek,
      thisMonth: containersThisMonth,
      byStatus,
      byType,
    };
  }

  private async getCustomerStatistics(dateFilter: any) {
    const totalCustomers = await this.prisma.customer.count();
    
    const activeCustomers = await this.prisma.customer.count({
      where: {
        status: 'ACTIVE',
      },
    });

    const newCustomersThisMonth = await this.prisma.customer.count({
      where: {
        createdAt: this.getDateFilter('month'),
      },
    });

    // Top customers by creation date (simplified since no direct relation to requests)
    const topCustomers = await this.prisma.customer.findMany({
      select: {
        id: true,
        name: true,
        status: true,
        createdAt: true,
        address: true,
        contact_email: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 5,
    });

    const topCustomersFormatted = topCustomers.map((customer) => ({
      id: customer.id,
      name: customer.name,
      status: customer.status,
      address: customer.address,
      contact_email: customer.contact_email,
      createdAt: customer.createdAt,
    }));

    return {
      total: totalCustomers,
      active: activeCustomers,
      newThisMonth: newCustomersThisMonth,
      topCustomers: topCustomersFormatted.map(customer => ({
        id: customer.id,
        name: customer.name,
        requestCount: 0, // No direct relation available
        totalRevenue: 0, // No direct relation available
      })),
    };
  }

  private async getMaintenanceStatistics(dateFilter: any) {
    const totalRepairs = await this.prisma.repairTicket.count();

    // Repair tickets by status
    const statusCounts = await this.prisma.repairTicket.groupBy({
      by: ['status'],
      _count: {
        status: true,
      },
    });

    const byStatus = {
      PENDING: 0,
      APPROVED: 0,
      IN_PROGRESS: 0,
      COMPLETED: 0,
      CANCELLED: 0,
    };

    statusCounts.forEach((item) => {
      byStatus[item.status as keyof typeof byStatus] = item._count.status;
    });

    // Average repair time (simplified - using updatedAt as completion time)
    const completedRepairs = await this.prisma.repairTicket.findMany({
      where: {
        status: 'CHECKED', // Using valid RepairStatus enum value
      },
      select: {
        createdAt: true,
        updatedAt: true,
      },
    });

    const averageRepairTime = completedRepairs.length > 0 
      ? completedRepairs.reduce((sum, repair) => {
          const duration = repair.updatedAt.getTime() - repair.createdAt.getTime();
          return sum + (duration / (1000 * 60 * 60 * 24)); // Convert to days
        }, 0) / completedRepairs.length
      : 0;

    // Total repair cost
    const totalCost = await this.prisma.repairTicket.aggregate({
      _sum: {
        estimated_cost: true,
      },
    });

    // Common issues
    const commonIssues = await this.prisma.repairTicket.groupBy({
      by: ['problem_description'],
      _count: {
        problem_description: true,
      },
      orderBy: {
        _count: {
          problem_description: 'desc',
        },
      },
      take: 5,
    });

    const commonIssuesFormatted = commonIssues.map((issue) => ({
      issue: issue.problem_description || 'Unknown',
      count: issue._count.problem_description,
    }));

    return {
      total: totalRepairs,
      byStatus,
      averageRepairTime: Math.round(averageRepairTime * 10) / 10,
      totalCost: totalCost._sum.estimated_cost || 0,
      commonIssues: commonIssuesFormatted,
    };
  }

  private async getFinancialStatistics(dateFilter: any) {
    // Total revenue
    const totalRevenue = await this.prisma.invoice.aggregate({
      _sum: {
        total_amount: true,
      },
    });

    // This month revenue
    const thisMonthRevenue = await this.prisma.invoice.aggregate({
      where: {
        createdAt: this.getDateFilter('month'),
      },
      _sum: {
        total_amount: true,
      },
    });

    // This year revenue
    const thisYearRevenue = await this.prisma.invoice.aggregate({
      where: {
        createdAt: this.getDateFilter('year'),
      },
      _sum: {
        total_amount: true,
      },
    });

    // Unpaid amount (invoices that are not fully paid)
    const unpaidAmount = await this.prisma.invoice.aggregate({
      where: {
        paid_at: null,
      },
      _sum: {
        total_amount: true,
      },
    });

    // Overdue amount (unpaid invoices past due date)
    const overdueAmount = await this.prisma.invoice.aggregate({
      where: {
        paid_at: null,
        due_date: {
          lt: new Date(),
        },
      },
      _sum: {
        total_amount: true,
      },
    });

    // Average invoice value
    const invoiceCount = await this.prisma.invoice.count();
    const averageInvoiceValue = invoiceCount > 0 
      ? Number(totalRevenue._sum.total_amount || 0) / invoiceCount 
      : 0;

    // Revenue by status
    const revenueByService = await this.prisma.invoice.groupBy({
      by: ['status'],
      _sum: {
        total_amount: true,
      },
      orderBy: {
        _sum: {
          total_amount: 'desc',
        },
      },
    });

    const revenueByServiceFormatted = revenueByService.map((item) => ({
      service: item.status || 'Unknown',
      amount: item._sum.total_amount || 0,
    }));

    return {
      totalRevenue: Number(totalRevenue._sum.total_amount || 0),
      thisMonthRevenue: Number(thisMonthRevenue._sum.total_amount || 0),
      thisYearRevenue: Number(thisYearRevenue._sum.total_amount || 0),
      unpaidAmount: Number(unpaidAmount._sum.total_amount || 0),
      overdueAmount: Number(overdueAmount._sum.total_amount || 0),
      averageInvoiceValue: Math.round(averageInvoiceValue),
      revenueByService: revenueByServiceFormatted.map(item => ({
        service: item.service,
        amount: Number(item.amount),
      })),
    };
  }

  private async getOperationalStatistics(dateFilter: any) {
    // Gate In/Out today
    const gateInToday = await this.prisma.serviceRequest.count({
      where: {
        status: 'GATE_IN',
        updatedAt: dateFilter,
      },
    });

    const gateOutToday = await this.prisma.serviceRequest.count({
      where: {
        status: 'GATE_OUT',
        updatedAt: dateFilter,
      },
    });

    // Forklift utilization (simplified calculation)
    const totalForkliftJobs = await this.prisma.forkliftTask.count(); 
    const completedForkliftJobs = await this.prisma.forkliftTask.count({
      where: {
        status: 'COMPLETED',
      },
    });
    const forkliftUtilization = totalForkliftJobs > 0 
      ? (completedForkliftJobs / totalForkliftJobs) * 100 
      : 0;

    // Yard utilization (simplified calculation)
    const totalYardCapacity = 1000; // Assuming total yard capacity
    const currentYardOccupancy = await this.prisma.yardPlacement.count({
      where: {
        status: 'ACTIVE',
      },
    });
    const yardUtilization = (currentYardOccupancy / totalYardCapacity) * 100;

    // Average processing time
    const completedRequests = await this.prisma.serviceRequest.findMany({
      where: {
        status: 'COMPLETED',
      },
      select: {
        createdAt: true,
        updatedAt: true,
      },
    });

    const averageProcessingTime = completedRequests.length > 0
      ? completedRequests.reduce((sum, request) => {
          const duration = request.updatedAt.getTime() - request.createdAt.getTime();
          return sum + (duration / (1000 * 60 * 60 * 24)); // Convert to days
        }, 0) / completedRequests.length
      : 0;

    // Completion rate
    const totalRequests = await this.prisma.serviceRequest.count();
    const completedRequestsCount = await this.prisma.serviceRequest.count({
      where: {
        status: 'COMPLETED',
      },
    });
    const completionRate = totalRequests > 0 
      ? (completedRequestsCount / totalRequests) * 100 
      : 0;

    return {
      gateInToday,
      gateOutToday,
      forkliftUtilization: Math.round(forkliftUtilization),
      yardUtilization: Math.round(yardUtilization),
      averageProcessingTime: Math.round(averageProcessingTime * 10) / 10,
      completionRate: Math.round(completionRate),
    };
  }
}
