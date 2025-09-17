import React from 'react';
import { StatisticsService } from '../../services/statistics';
import { useTranslation } from '../../hooks/useTranslation';

interface MaintenanceSummaryProps {
  data: {
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
}

const statusConfig = {
  PENDING: { label: 'Chờ xử lý', color: 'bg-yellow-100 text-yellow-800' },
  APPROVED: { label: 'Đã duyệt', color: 'bg-blue-100 text-blue-800' },
  IN_PROGRESS: { label: 'Đang sửa', color: 'bg-purple-100 text-purple-800' },
  COMPLETED: { label: 'Hoàn thành', color: 'bg-green-100 text-green-800' },
  CANCELLED: { label: 'Hủy bỏ', color: 'bg-red-100 text-red-800' },
};

export const MaintenanceSummary: React.FC<MaintenanceSummaryProps> = ({ data }) => {
  const { t } = useTranslation();
  return (
    <div className="chart-container">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-sm">🛠️</span>
        <h3 className="text-sm font-bold text-white">{t('pages.statistics.sections.maintenanceSummary')}</h3>
      </div>
      
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="text-center p-2 bg-gradient-to-br from-blue-500/20 to-blue-600/20 rounded-lg border border-blue-400/30">
          <div className="text-sm font-bold text-white">{data.total}</div>
          <div className="text-xs font-medium text-white">{t('pages.statistics.labels.totalRepairs')}</div>
        </div>
        <div className="text-center p-2 bg-gradient-to-br from-green-500/20 to-green-600/20 rounded-lg border border-green-400/30">
          <div className="text-sm font-bold text-white">
            {data.averageRepairTime} days
          </div>
          <div className="text-xs font-medium text-white">{t('pages.statistics.labels.avgRepairTime')}</div>
        </div>
      </div>

      <div className="mb-4">
        <h4 className="text-sm font-semibold mb-3 text-white">{t('pages.statistics.labels.byStatus')}</h4>
        <div className="grid grid-cols-2 gap-2">
          {Object.entries(data.byStatus).map(([status, count]) => (
            <div key={status} className="flex items-center justify-between p-2 bg-white/5 rounded-lg hover:bg-white/10 transition-all duration-200">
              <span className={`text-xs px-3 py-1 rounded-full font-medium ${
                status === 'PENDING' ? 'bg-yellow-500/20 text-white' :
                status === 'APPROVED' ? 'bg-blue-500/20 text-white' :
                status === 'IN_PROGRESS' ? 'bg-purple-500/20 text-white' :
                status === 'COMPLETED' ? 'bg-green-500/20 text-white' :
                'bg-red-500/20 text-white'
              }`}>
                {statusConfig[status as keyof typeof statusConfig]?.label || status}
              </span>
              <span className="text-sm font-bold text-white">{count}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="mb-4">
        <h4 className="text-sm font-semibold mb-3 text-white">{t('pages.statistics.labels.commonIssues')} 🔧</h4>
        <div className="space-y-2">
          {data.commonIssues.map((issue, index) => (
            <div key={index} className="flex items-center justify-between p-2 bg-white/5 rounded-lg hover:bg-white/10 transition-all duration-200">
              <span className="text-sm font-medium text-white">{issue.issue}</span>
              <span className="text-sm font-bold text-white">{issue.count} {t('pages.statistics.labels.times')}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="pt-4 border-t border-white/20">
        <div className="flex justify-between items-center">
          <span className="text-sm text-white">{t('pages.statistics.labels.totalRepairCost')}:</span>
          <span className="text-sm font-bold text-white">
            {StatisticsService.formatCurrency(data.totalCost)}
          </span>
        </div>
      </div>
    </div>
  );
};
