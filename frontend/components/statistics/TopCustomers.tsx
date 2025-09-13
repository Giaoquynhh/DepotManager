import React from 'react';
import { StatisticsService } from '../../services/statistics';

interface Customer {
  id: string;
  name: string;
  requestCount: number;
  totalRevenue: number;
}

interface TopCustomersProps {
  customers: Customer[];
}

export const TopCustomers: React.FC<TopCustomersProps> = ({ customers }) => {
  return (
    <div className="p-6 bg-white/10 rounded-lg border border-white/20">
      <h3 className="text-lg font-semibold mb-4 text-white">Top Khách hàng</h3>
      
      <div className="space-y-3">
        {customers.map((customer, index) => (
          <div key={customer.id} className="flex items-center justify-between p-3 bg-white/5 rounded-lg hover:bg-white/10 transition-colors">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-blue-500/20 text-white rounded-full flex items-center justify-center text-sm font-bold mr-3">
                {index + 1}
              </div>
              <div>
                <div className="font-medium text-sm text-white">{customer.name}</div>
                <div className="text-xs text-white/70">{customer.requestCount} requests</div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm font-semibold text-white">
                {StatisticsService.formatCurrency(customer.totalRevenue)}
              </div>
              <div className="text-xs text-white/70">Tổng doanh thu</div>
            </div>
          </div>
        ))}
      </div>

      {customers.length === 0 && (
        <div className="text-center py-8 text-white/70">
          <p>Không có dữ liệu khách hàng</p>
        </div>
      )}

      <div className="mt-4 pt-4 border-t border-white/20">
        <button className="text-sm text-white hover:text-white/80 font-medium">
          Xem báo cáo chi tiết →
        </button>
      </div>
    </div>
  );
};
