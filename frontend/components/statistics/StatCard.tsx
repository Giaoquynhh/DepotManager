import React from 'react';
import { useTranslation } from '../../hooks/useTranslation';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  emoji?: string;
  color?: 'blue' | 'green' | 'yellow' | 'red' | 'purple' | 'indigo';
  trend?: {
    value: number;
    isPositive: boolean;
  };
  subtitle?: string;
}

const emojiMap = {
  containers: '🚢',
  customers: '👥',
  revenue: '💰',
  maintenance: '🛠️',
  default: '📊'
};

const gradientClasses = {
  blue: 'from-blue-500/20 to-blue-600/20 border-blue-400/30',
  green: 'from-green-500/20 to-green-600/20 border-green-400/30',
  yellow: 'from-yellow-500/20 to-yellow-600/20 border-yellow-400/30',
  red: 'from-red-500/20 to-red-600/20 border-red-400/30',
  purple: 'from-purple-500/20 to-purple-600/20 border-purple-400/30',
  indigo: 'from-indigo-500/20 to-indigo-600/20 border-indigo-400/30',
};

const textColorClasses = {
  blue: 'text-blue-100',
  green: 'text-green-100',
  yellow: 'text-yellow-100',
  red: 'text-red-100',
  purple: 'text-purple-100',
  indigo: 'text-indigo-100',
};

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  icon,
  emoji,
  color = 'blue',
  trend,
  subtitle,
}) => {
  const { t } = useTranslation();
  const cardEmoji = emoji || emojiMap[title.toLowerCase() as keyof typeof emojiMap] || emojiMap.default;
  
  return (
    <div className={`stat-card p-6 bg-gradient-to-br ${gradientClasses[color]} border-2 text-white relative overflow-hidden`}>
      {/* Animated background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300"></div>
      
      <div className="relative z-10">
        {/* Emoji */}
        <div className="stat-card-emoji text-center mb-3">
          {cardEmoji}
        </div>
        
        {/* Content */}
        <div className="text-center">
          <p className="text-xs font-bold text-white mb-1">{title}</p>
          <p className="text-2xl font-bold mb-1 text-white">{value}</p>
          {subtitle && (
            <p className="text-xs font-medium text-white">{subtitle}</p>
          )}
          {trend && (
            <div className="flex items-center justify-center mt-3">
              <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                trend.isPositive 
                  ? 'bg-green-500/20 text-green-200' 
                  : 'bg-red-500/20 text-red-200'
              }`}>
                {trend.isPositive ? '↗' : '↘'} {Math.abs(trend.value)}%
              </span>
              <span className="text-xs text-white ml-2">vs last period</span>
            </div>
          )}
        </div>
        
        {/* Icon overlay - REMOVED */}
      </div>
    </div>
  );
};
