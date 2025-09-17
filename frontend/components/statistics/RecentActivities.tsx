import React from 'react';
import { useTranslation } from '../../hooks/useTranslation';

interface Activity {
  id: string;
  type: 'container' | 'customer' | 'maintenance' | 'financial';
  description: string;
  timestamp: string;
  status: 'success' | 'warning' | 'error' | 'info';
}

interface RecentActivitiesProps {
  activities: Activity[];
}

const activityConfig = {
  container: { icon: '📦', color: 'text-blue-600' },
  customer: { icon: '👤', color: 'text-green-600' },
  maintenance: { icon: '🔧', color: 'text-yellow-600' },
  financial: { icon: '💰', color: 'text-purple-600' },
};

const statusConfig = {
  success: 'text-green-600',
  warning: 'text-yellow-600',
  error: 'text-red-600',
  info: 'text-blue-600',
};

export const RecentActivities: React.FC<RecentActivitiesProps> = ({ activities }) => {
  const { t } = useTranslation();
  // Mock data for demonstration
  const mockActivities: Activity[] = [
    {
      id: '1',
      type: 'container',
      description: t('pages.statistics.mockData.containerCompleted'),
      timestamp: `2 ${t('pages.statistics.mockData.minutesAgo')}`,
      status: 'success',
    },
    {
      id: '2',
      type: 'customer',
      description: t('pages.statistics.mockData.customerNewRequest'),
      timestamp: `15 ${t('pages.statistics.mockData.minutesAgo')}`,
      status: 'info',
    },
    {
      id: '3',
      type: 'maintenance',
      description: t('pages.statistics.mockData.maintenancePending'),
      timestamp: `1 ${t('pages.statistics.mockData.hoursAgo')}`,
      status: 'warning',
    },
    {
      id: '4',
      type: 'financial',
      description: t('pages.statistics.mockData.invoicePaid'),
      timestamp: `2 ${t('pages.statistics.mockData.hoursAgo')}`,
      status: 'success',
    },
    {
      id: '5',
      type: 'container',
      description: t('pages.statistics.mockData.containerGateIn'),
      timestamp: `3 ${t('pages.statistics.mockData.hoursAgo')}`,
      status: 'success',
    },
  ];

  const displayActivities = activities.length > 0 ? activities : mockActivities;

  return (
    <div className="p-6 bg-white/10 rounded-lg border border-white/20">
      <h3 className="text-lg font-semibold mb-4 text-white">{t('pages.statistics.sections.recentActivities')}</h3>
      
      <div className="space-y-3">
        {displayActivities.map((activity) => (
          <div key={activity.id} className="flex items-start space-x-3 p-3 hover:bg-white/10 rounded-lg transition-colors">
            <div className={`text-lg ${activityConfig[activity.type].color}`}>
              {activityConfig[activity.type].icon}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white">{activity.description}</p>
              <div className="flex items-center mt-1">
                <span className={`text-xs ${statusConfig[activity.status]}`}>
                  ●
                </span>
                <span className="text-xs text-white/70 ml-2">{activity.timestamp}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 pt-4 border-t border-white/20">
        <button className="text-sm text-white hover:text-white/80 font-medium">
          Xem tất cả hoạt động →
        </button>
      </div>
    </div>
  );
};
