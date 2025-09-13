import React from 'react';
import { StatisticsService } from '../../services/statistics';

interface FinancialOverviewProps {
  data: {
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
}

export const FinancialOverview: React.FC<FinancialOverviewProps> = ({ data }) => {
  return (
    <div className="chart-container">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-sm">💰</span>
        <h3 className="text-sm font-bold text-white">Financial Overview</h3>
      </div>
      
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="text-center p-2 bg-gradient-to-br from-green-500/20 to-green-600/20 rounded-lg border border-green-400/30 hover:from-green-500/30 hover:to-green-600/30 transition-all duration-300">
          <div className="text-sm font-bold text-white">
            {StatisticsService.formatCurrency(data.thisMonthRevenue)}
          </div>
          <div className="text-xs font-medium text-white">This Month</div>
        </div>
        <div className="text-center p-2 bg-gradient-to-br from-blue-500/20 to-blue-600/20 rounded-lg border border-blue-400/30 hover:from-blue-500/30 hover:to-blue-600/30 transition-all duration-300">
          <div className="text-sm font-bold text-white">
            {StatisticsService.formatCurrency(data.totalRevenue)}
          </div>
          <div className="text-xs font-medium text-white">Total Revenue</div>
        </div>
        <div className="text-center p-2 bg-gradient-to-br from-yellow-500/20 to-yellow-600/20 rounded-lg border border-yellow-400/30 hover:from-yellow-500/30 hover:to-yellow-600/30 transition-all duration-300">
          <div className="text-sm font-bold text-white">
            {StatisticsService.formatCurrency(data.unpaidAmount)}
          </div>
          <div className="text-xs font-medium text-white">Unpaid</div>
        </div>
        <div className="text-center p-2 bg-gradient-to-br from-red-500/20 to-red-600/20 rounded-lg border border-red-400/30 hover:from-red-500/30 hover:to-red-600/30 transition-all duration-300">
          <div className="text-sm font-bold text-white">
            {StatisticsService.formatCurrency(data.overdueAmount)}
          </div>
          <div className="text-xs font-medium text-white">Overdue</div>
        </div>
      </div>

      <div className="mb-4">
        <h4 className="text-sm font-semibold mb-3 text-white">Revenue by Service</h4>
        <div className="space-y-2">
          {data.revenueByService.map((service, index) => (
            <div key={index} className="flex items-center justify-between p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-all duration-200">
              <span className="text-sm font-medium text-white">{service.service}</span>
              <span className="text-sm font-bold text-white">
                {StatisticsService.formatCurrency(service.amount)}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="pt-4 border-t border-white/20">
        <div className="flex justify-between items-center">
          <span className="text-sm text-white/70">Average Invoice Value:</span>
          <span className="text-sm font-bold text-white">
            {StatisticsService.formatCurrency(data.averageInvoiceValue)}
          </span>
        </div>
      </div>
    </div>
  );
};
