import React from 'react';
import { useTranslation } from '../../hooks/useTranslation';

interface RepairTicket {
  id: string;
  containerNumber: string;
  issueDescription: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  status: 'PENDING' | 'APPROVED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  estimatedCost: number;
  createdAt: string;
}

interface PendingRepairsProps {
  repairs: RepairTicket[];
}

const getPriorityConfig = (t: (key: string) => string) => ({
  LOW: { label: t('pages.statistics.priority.low'), color: 'bg-green-100 text-green-800' },
  MEDIUM: { label: t('pages.statistics.priority.medium'), color: 'bg-yellow-100 text-yellow-800' },
  HIGH: { label: t('pages.statistics.priority.high'), color: 'bg-orange-100 text-orange-800' },
  URGENT: { label: t('pages.statistics.priority.urgent'), color: 'bg-red-100 text-red-800' },
});

const getStatusConfig = (t: (key: string) => string) => ({
  PENDING: { label: t('pages.statistics.repairStatus.pending'), color: 'bg-yellow-100 text-yellow-800' },
  APPROVED: { label: t('pages.statistics.repairStatus.approved'), color: 'bg-blue-100 text-blue-800' },
  IN_PROGRESS: { label: t('pages.statistics.repairStatus.inProgress'), color: 'bg-purple-100 text-purple-800' },
  COMPLETED: { label: t('pages.statistics.repairStatus.completed'), color: 'bg-green-100 text-green-800' },
  CANCELLED: { label: t('pages.statistics.repairStatus.cancelled'), color: 'bg-red-100 text-red-800' },
});

export const PendingRepairs: React.FC<PendingRepairsProps> = ({ repairs }) => {
  const { t } = useTranslation();
  const priorityConfig = getPriorityConfig(t);
  const statusConfig = getStatusConfig(t);
  // Mock data for demonstration
  const mockRepairs: RepairTicket[] = [
    {
      id: 'RT001',
      containerNumber: 'CTN-001-2024',
      issueDescription: t('pages.statistics.mockData.containerDoorDamage'),
      priority: 'HIGH',
      status: 'PENDING',
      estimatedCost: 2500000,
      createdAt: '2024-12-19T10:30:00Z',
    },
    {
      id: 'RT002',
      containerNumber: 'CTN-002-2024',
      issueDescription: t('pages.statistics.mockData.containerLockError'),
      priority: 'MEDIUM',
      status: 'APPROVED',
      estimatedCost: 1500000,
      createdAt: '2024-12-19T09:15:00Z',
    },
    {
      id: 'RT003',
      containerNumber: 'CTN-003-2024',
      issueDescription: t('pages.statistics.mockData.containerBottomDamage'),
      priority: 'URGENT',
      status: 'IN_PROGRESS',
      estimatedCost: 5000000,
      createdAt: '2024-12-19T08:45:00Z',
    },
  ];

  const displayRepairs = repairs.length > 0 ? repairs : mockRepairs;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="p-6 bg-white/10 rounded-lg border border-white/20">
      <h3 className="text-lg font-semibold mb-4 text-white">{t('pages.statistics.sections.pendingRepairs')}</h3>
      
      <div className="space-y-4">
        {displayRepairs.map((repair) => (
          <div key={repair.id} className="p-4 bg-white/5 rounded-lg hover:bg-white/10 transition-colors">
            <div className="flex items-start justify-between mb-3">
              <div>
                <div className="font-medium text-sm text-white mb-1">{repair.containerNumber}</div>
                <div className="text-xs text-white/70">#{repair.id}</div>
              </div>
              <div className="flex space-x-2">
                <span className={`text-xs px-2 py-1 rounded-full ${
                  repair.priority === 'LOW' ? 'bg-green-500/20 text-white' :
                  repair.priority === 'MEDIUM' ? 'bg-yellow-500/20 text-white' :
                  repair.priority === 'HIGH' ? 'bg-orange-500/20 text-white' :
                  'bg-red-500/20 text-white'
                }`}>
                  {priorityConfig[repair.priority]?.label || repair.priority}
                </span>
                <span className={`text-xs px-2 py-1 rounded-full ${
                  repair.status === 'PENDING' ? 'bg-yellow-500/20 text-white' :
                  repair.status === 'APPROVED' ? 'bg-blue-500/20 text-white' :
                  repair.status === 'IN_PROGRESS' ? 'bg-purple-500/20 text-white' :
                  repair.status === 'COMPLETED' ? 'bg-green-500/20 text-white' :
                  'bg-red-500/20 text-white'
                }`}>
                  {statusConfig[repair.status]?.label || repair.status}
                </span>
              </div>
            </div>
            
            <div className="mb-3">
              <p className="text-sm text-white leading-relaxed">{repair.issueDescription}</p>
            </div>
            
            <div className="flex items-center justify-between text-xs text-white/70">
              <span>Chi phí: {formatCurrency(repair.estimatedCost)}</span>
              <span>{formatDate(repair.createdAt)}</span>
            </div>
          </div>
        ))}
      </div>

      {displayRepairs.length === 0 && (
        <div className="text-center py-8 text-white/70">
          <p>{t('pages.statistics.mockData.noRepairs')}</p>
        </div>
      )}

      <div className="mt-4 pt-4 border-t border-white/20">
        <button className="text-sm text-white hover:text-white/80 font-medium">
          {t('pages.statistics.mockData.viewAll')} →
        </button>
      </div>
    </div>
  );
};
