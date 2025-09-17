import React from 'react';
import { useTranslation } from '../../hooks/useTranslation';
import { StatisticsService } from '../../services/statistics';

interface CustomerStatsCardProps {
  data: {
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
}

export const CustomerStatsCard: React.FC<CustomerStatsCardProps> = ({ data }) => {
  const { t } = useTranslation();
  return (
    <div className="chart-container">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-sm">👥</span>
        <h3 className="text-sm font-bold text-white">{t('pages.statistics.sections.customerStats')}</h3>
      </div>
      
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="text-center p-2 bg-gradient-to-br from-blue-500/20 to-blue-600/20 rounded-lg border border-blue-400/30">
          <div className="text-sm font-bold text-white">{data.total}</div>
          <div className="text-xs font-medium text-white">{t('pages.statistics.labels.total')}</div>
        </div>
        <div className="text-center p-2 bg-gradient-to-br from-green-500/20 to-green-600/20 rounded-lg border border-green-400/30">
          <div className="text-sm font-bold text-white">{data.active}</div>
          <div className="text-xs font-medium text-white">{t('pages.statistics.labels.active')}</div>
        </div>
        <div className="text-center p-2 bg-gradient-to-br from-purple-500/20 to-purple-600/20 rounded-lg border border-purple-400/30">
          <div className="text-sm font-bold text-white">{data.newThisMonth}</div>
          <div className="text-xs font-medium text-white">{t('pages.statistics.labels.newThisMonth')}</div>
        </div>
      </div>

      <div>
        <h4 className="text-sm font-semibold mb-3 text-white">{t('pages.statistics.sections.topCustomers')} 👑</h4>
        <div className="space-y-2">
          {data.topCustomers.slice(0, 3).map((customer, index) => (
            <div key={customer.id} className="flex items-center justify-between p-2 bg-white/5 hover:bg-white/10 rounded-lg transition-all duration-200">
              <div className="flex items-center">
                <div className="w-8 h-8 bg-gradient-to-br from-yellow-400 to-orange-500 text-white rounded-full flex items-center justify-center text-sm font-bold mr-3 shadow-lg">
                  {index === 0 ? '👑' : index + 1}
                </div>
                <div>
                  <div className="font-medium text-sm text-white">{customer.name}</div>
                  <div className="text-xs text-white">{customer.requestCount} {t('pages.statistics.labels.requests')}</div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm font-bold text-white">
                  {StatisticsService.formatCurrency(customer.totalRevenue)}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
