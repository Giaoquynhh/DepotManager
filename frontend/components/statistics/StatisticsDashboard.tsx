import React, { useState, useEffect } from 'react';
import { StatisticsService, StatisticsOverview, TimeRange } from '../../services/statistics';
import { useStatisticsPermissions, useUserRole } from '../../hooks/useStatisticsPermissions';
import { ExportUtils } from '../../utils/exportUtils';
import { StatCard } from './StatCard';
import { ContainerStatusChart } from './ContainerStatusChart';
import { CustomerStatsCard } from './CustomerStatsCard';
import { FinancialOverview } from './FinancialOverview';
import { MaintenanceSummary } from './MaintenanceSummary';
import { RecentActivities } from './RecentActivities';
import { TopCustomers } from './TopCustomers';
import { PendingRepairs } from './PendingRepairs';

// Icons
import {
  ArrowPathIcon,
  DocumentArrowDownIcon,
} from '@heroicons/react/24/outline';

export const StatisticsDashboard: React.FC = () => {
  const [data, setData] = useState<StatisticsOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<TimeRange>('today');
  const [refreshing, setRefreshing] = useState(false);
  
  const userRole = useUserRole();
  const permissions = useStatisticsPermissions(userRole?.role);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const overview = await StatisticsService.getOverview(timeRange);
      setData(overview);
    } catch (err) {
      console.error('Error fetching statistics:', err);
      setError('Không thể tải dữ liệu thống kê');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  const handleExport = () => {
    if (!data) return;
    
    const exportData = {
      containers: data.containers,
      customers: data.customers,
      maintenance: data.maintenance,
      financial: data.financial,
      operational: data.operational,
    };
    
    // Show export options
    const exportType = window.confirm('Chọn định dạng xuất:\nOK = Excel (.xlsx)\nCancel = PDF (.pdf)');
    
    if (exportType) {
      ExportUtils.exportToExcel(exportData, timeRange);
    } else {
      ExportUtils.exportToPDF(exportData, timeRange);
    }
  };

  useEffect(() => {
    fetchData();
  }, [timeRange]);

  // Check if user has permission to view statistics
  if (!permissions.canViewOverview && !permissions.canViewContainers) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white mb-4">Không có quyền truy cập</h2>
          <p className="text-white">Bạn không có quyền xem thống kê tổng quan.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-white mb-4">{error}</p>
        <button
          onClick={fetchData}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Thử lại
        </button>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-8">
        <p className="text-white">Không có dữ liệu</p>
      </div>
    );
  }

  return (
    <div className="statistics-dashboard">
      {/* Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-4">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value as TimeRange)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-white bg-white/10"
          >
            <option value="today">⏱️ Hôm nay</option>
            <option value="week">📅 Tuần này</option>
            <option value="month">📆 Tháng này</option>
            <option value="year">🗓️ Năm này</option>
          </select>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 gap-1 text-sm"
          >
            <ArrowPathIcon className={`w-3 h-3 ${refreshing ? 'animate-spin' : ''}`} />
            🔄 Refresh
          </button>
          {permissions.canExport && (
            <button
              onClick={handleExport}
              className="flex items-center px-3 py-1 bg-green-600 text-white rounded-lg hover:bg-green-700 gap-1 text-sm"
            >
              <DocumentArrowDownIcon className="w-3 h-3" />
              📤 Export
            </button>
          )}
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {permissions.canViewContainers && (
          <StatCard
            title="Containers"
            value={StatisticsService.formatNumber(data.containers.total)}
            icon={null}
            emoji="🚢"
            color="blue"
            subtitle={`${data.containers.today} hôm nay`}
          />
        )}
        {permissions.canViewCustomers && (
          <StatCard
            title="Customers"
            value={data.customers.total}
            icon={null}
            emoji="👥"
            color="green"
            subtitle={`${data.customers.active} đang hoạt động`}
          />
        )}
        {permissions.canViewFinancial && (
          <StatCard
            title="Revenue"
            value={StatisticsService.formatCurrency(data.financial.thisMonthRevenue)}
            icon={null}
            emoji="💰"
            color="purple"
            subtitle={`${StatisticsService.formatCurrency(data.financial.totalRevenue)} tổng cộng`}
          />
        )}
        {permissions.canViewMaintenance && (
          <StatCard
            title="Maintenance"
            value={data.maintenance.total}
            icon={null}
            emoji="🛠️"
            color="yellow"
            subtitle={`${data.maintenance.byStatus.PENDING} chờ xử lý`}
          />
        )}
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        {permissions.canViewContainers && (
          <ContainerStatusChart data={data.containers.byStatus} />
        )}
        {permissions.canViewFinancial && (
          <FinancialOverview data={data.financial} />
        )}
        {permissions.canViewCustomers && (
          <CustomerStatsCard data={data.customers} />
        )}
        {permissions.canViewMaintenance && (
          <MaintenanceSummary data={data.maintenance} />
        )}
      </div>

      {/* Bottom Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="chart-container">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-sm">🔄</span>
            <h3 className="text-sm font-bold text-white">Recent Activities</h3>
          </div>
          <RecentActivities activities={[]} />
        </div>
        {permissions.canViewCustomers && (
          <div className="chart-container">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-sm">👑</span>
              <h3 className="text-sm font-bold text-white">Top Customers</h3>
            </div>
            <TopCustomers customers={data.customers.topCustomers} />
          </div>
        )}
        {permissions.canViewMaintenance && (
          <div className="chart-container">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-sm">📝</span>
              <h3 className="text-sm font-bold text-white">Pending Repairs</h3>
            </div>
            <PendingRepairs repairs={[]} />
          </div>
        )}
      </div>
    </div>
  );
};
