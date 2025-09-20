import React from 'react';
import { StatisticsDashboard } from '../components/statistics/StatisticsDashboard';

/**
 * Demo component for Statistics Dashboard
 * This component can be used to test the Statistics Dashboard functionality
 * 
 * Usage:
 * 1. Import this component in any page
 * 2. Add it to the page content
 * 3. Test different user roles by modifying localStorage
 * 
 * Example:
 * ```tsx
 * import { StatisticsDemo } from '../examples/StatisticsDemo';
 * 
 * export default function TestPage() {
 *   return (
 *     <div>
 *       <h1>Statistics Dashboard Demo</h1>
 *       <StatisticsDemo />
 *     </div>
 *   );
 * }
 * ```
 */

export const StatisticsDemo: React.FC = () => {
  // Mock user data for testing different roles
  const mockUsers = {
    SystemAdmin: {
      role: 'SystemAdmin',
      permissions: ['all']
    },
    BusinessAdmin: {
      role: 'BusinessAdmin', 
      permissions: ['all']
    },
    Accountant: {
      role: 'Accountant',
      permissions: ['all']
    },
    TechnicalDepartment: {
      role: 'TechnicalDepartment',
      permissions: ['containers', 'customers', 'operational']
    },
    YardManager: {
      role: 'YardManager',
      permissions: ['containers', 'customers', 'operational']
    },
    MaintenanceManager: {
      role: 'MaintenanceManager',
      permissions: ['containers', 'maintenance', 'operational']
    },
    CustomerAdmin: {
      role: 'CustomerAdmin',
      permissions: ['containers']
    },
    CustomerUser: {
      role: 'CustomerUser',
      permissions: ['containers']
    },
    Driver: {
      role: 'Driver',
      permissions: []
    },
    Security: {
      role: 'Security',
      permissions: []
    }
  };

  const handleRoleChange = (role: string) => {
    const user = mockUsers[role as keyof typeof mockUsers];
    localStorage.setItem('user', JSON.stringify(user));
    window.location.reload();
  };

  return (
    <div className="p-6">
      <div className="mb-6 p-4 bg-blue-50 rounded-lg">
        <h2 className="text-xl font-bold mb-4">Statistics Dashboard Demo</h2>
        <p className="mb-4 text-gray-700">
          Chọn role để test quyền truy cập khác nhau:
        </p>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2">
          {Object.keys(mockUsers).map((role) => (
            <button
              key={role}
              onClick={() => handleRoleChange(role)}
              className="px-3 py-2 text-sm bg-white border border-gray-300 rounded hover:bg-gray-50 focus:ring-2 focus:ring-blue-500"
            >
              {role}
            </button>
          ))}
        </div>
        <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
          <p className="text-sm text-yellow-800">
            <strong>Lưu ý:</strong> Thay đổi role sẽ reload trang để áp dụng quyền mới.
            Dữ liệu hiển thị là mock data cho mục đích demo.
          </p>
        </div>
      </div>
      
      <StatisticsDashboard />
    </div>
  );
};

export default StatisticsDemo;
