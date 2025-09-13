import React from 'react';

interface ContainerStatusChartProps {
  data: {
    PENDING: number;
    SCHEDULED: number;
    GATE_IN: number;
    IN_YARD: number;
    IN_CAR: number;
    GATE_OUT: number;
    COMPLETED: number;
  };
}

const statusConfig = {
  PENDING: { label: 'Chờ xử lý', color: '#F59E0B', bgColor: 'bg-yellow-100' },
  SCHEDULED: { label: 'Đã lên lịch', color: '#3B82F6', bgColor: 'bg-blue-100' },
  GATE_IN: { label: 'Vào cổng', color: '#8B5CF6', bgColor: 'bg-purple-100' },
  IN_YARD: { label: 'Trong bãi', color: '#10B981', bgColor: 'bg-green-100' },
  IN_CAR: { label: 'Trên xe', color: '#F97316', bgColor: 'bg-orange-100' },
  GATE_OUT: { label: 'Ra cổng', color: '#EF4444', bgColor: 'bg-red-100' },
  COMPLETED: { label: 'Hoàn thành', color: '#059669', bgColor: 'bg-emerald-100' },
};

export const ContainerStatusChart: React.FC<ContainerStatusChartProps> = ({ data }) => {
  const total = Object.values(data).reduce((sum, value) => sum + value, 0);
  
  if (total === 0) {
    return (
      <div className="p-6 text-center text-white">
        <p>Không có dữ liệu container</p>
      </div>
    );
  }

  // Calculate percentages and create pie chart data
  const chartData = Object.entries(data)
    .map(([status, value]) => ({
      status: status as keyof typeof data,
      value,
      percentage: (value / total) * 100,
    }))
    .filter(item => item.value > 0)
    .sort((a, b) => b.value - a.value);

  // Simple pie chart using CSS
  let cumulativePercentage = 0;

  return (
    <div className="chart-container">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-sm">📊</span>
        <h3 className="text-sm font-bold text-white">Container Status</h3>
      </div>
      
      <div className="flex items-center justify-center mb-4">
        <div className="relative pie-chart">
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
            {chartData.map((item, index) => {
              const startAngle = cumulativePercentage * 3.6; // 3.6 degrees per percentage
              const endAngle = (cumulativePercentage + item.percentage) * 3.6;
              const largeArcFlag = item.percentage > 50 ? 1 : 0;
              
              const x1 = 50 + 40 * Math.cos((startAngle * Math.PI) / 180);
              const y1 = 50 + 40 * Math.sin((startAngle * Math.PI) / 180);
              const x2 = 50 + 40 * Math.cos((endAngle * Math.PI) / 180);
              const y2 = 50 + 40 * Math.sin((endAngle * Math.PI) / 180);
              
              const pathData = [
                `M 50 50`,
                `L ${x1} ${y1}`,
                `A 40 40 0 ${largeArcFlag} 1 ${x2} ${y2}`,
                'Z'
              ].join(' ');
              
              cumulativePercentage += item.percentage;
              
              return (
                <path
                  key={item.status}
                  d={pathData}
                  fill={statusConfig[item.status]?.color || '#6B7280'}
                  stroke="rgba(255, 255, 255, 0.2)"
                  strokeWidth="2"
                  className="pie-segment"
                  style={{
                    filter: 'drop-shadow(0 4px 8px rgba(0, 0, 0, 0.1))',
                    transition: 'all 0.3s ease'
                  }}
                />
              );
            })}
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className="text-sm font-bold text-white">{total.toLocaleString()}</div>
              <div className="text-xs text-white/70">Total</div>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        {chartData.map((item) => (
          <div key={item.status} className="flex items-center justify-between p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-all duration-200">
            <div className="flex items-center">
              <div 
                className={`w-4 h-4 rounded-full mr-3 shadow-lg`}
                style={{ backgroundColor: statusConfig[item.status]?.color || '#6B7280' }}
              />
              <span className="text-sm font-medium text-white">
                {statusConfig[item.status]?.label || item.status}
              </span>
            </div>
            <div className="text-right">
              <div className="text-sm font-bold text-white">{item.value.toLocaleString()}</div>
              <div className="text-xs text-white/70">{item.percentage.toFixed(1)}%</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
