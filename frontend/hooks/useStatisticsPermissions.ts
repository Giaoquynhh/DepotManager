import { useState, useEffect } from 'react';

export interface UserRole {
  role: string;
  permissions: string[];
}

export interface StatisticsPermissions {
  canViewOverview: boolean;
  canViewContainers: boolean;
  canViewCustomers: boolean;
  canViewMaintenance: boolean;
  canViewFinancial: boolean;
  canViewOperational: boolean;
  canExport: boolean;
}

const rolePermissions: Record<string, StatisticsPermissions> = {
  SystemAdmin: {
    canViewOverview: true,
    canViewContainers: true,
    canViewCustomers: true,
    canViewMaintenance: true,
    canViewFinancial: true,
    canViewOperational: true,
    canExport: true,
  },
  BusinessAdmin: {
    canViewOverview: true,
    canViewContainers: true,
    canViewCustomers: true,
    canViewMaintenance: true,
    canViewFinancial: true,
    canViewOperational: true,
    canExport: true,
  },
  Accountant: {
    canViewOverview: true,
    canViewContainers: true,
    canViewCustomers: true,
    canViewMaintenance: true,
    canViewFinancial: true,
    canViewOperational: true,
    canExport: true,
  },
  TechnicalDepartment: {
    canViewOverview: true,
    canViewContainers: true,
    canViewCustomers: true,
    canViewMaintenance: false,
    canViewFinancial: false,
    canViewOperational: true,
    canExport: false,
  },
  YardManager: {
    canViewOverview: true,
    canViewContainers: true,
    canViewCustomers: true,
    canViewMaintenance: false,
    canViewFinancial: false,
    canViewOperational: true,
    canExport: false,
  },
  MaintenanceManager: {
    canViewOverview: true,
    canViewContainers: true,
    canViewCustomers: false,
    canViewMaintenance: true,
    canViewFinancial: false,
    canViewOperational: true,
    canExport: false,
  },
  CustomerAdmin: {
    canViewOverview: false,
    canViewContainers: true,
    canViewCustomers: false,
    canViewMaintenance: false,
    canViewFinancial: false,
    canViewOperational: false,
    canExport: false,
  },
  CustomerUser: {
    canViewOverview: false,
    canViewContainers: true,
    canViewCustomers: false,
    canViewMaintenance: false,
    canViewFinancial: false,
    canViewOperational: false,
    canExport: false,
  },
  Driver: {
    canViewOverview: false,
    canViewContainers: false,
    canViewCustomers: false,
    canViewMaintenance: false,
    canViewFinancial: false,
    canViewOperational: false,
    canExport: false,
  },
  Security: {
    canViewOverview: false,
    canViewContainers: false,
    canViewCustomers: false,
    canViewMaintenance: false,
    canViewFinancial: false,
    canViewOperational: false,
    canExport: false,
  },
};

export const useStatisticsPermissions = (userRole?: string): StatisticsPermissions => {
  const [permissions, setPermissions] = useState<StatisticsPermissions>({
    canViewOverview: false,
    canViewContainers: false,
    canViewCustomers: false,
    canViewMaintenance: false,
    canViewFinancial: false,
    canViewOperational: false,
    canExport: false,
  });

  useEffect(() => {
    if (userRole && rolePermissions[userRole]) {
      setPermissions(rolePermissions[userRole]);
    } else {
      // Default permissions for unknown roles
      setPermissions({
        canViewOverview: false,
        canViewContainers: false,
        canViewCustomers: false,
        canViewMaintenance: false,
        canViewFinancial: false,
        canViewOperational: false,
        canExport: false,
      });
    }
  }, [userRole]);

  return permissions;
};

export const useUserRole = (): UserRole | null => {
  const [userRole, setUserRole] = useState<UserRole | null>(null);

  useEffect(() => {
    // Get user role from localStorage or context
    try {
      // Try multiple possible keys for user data
      const possibleKeys = ['user_role', 'user', 'userData', 'currentUser', 'authUser', 'userInfo'];
      let storedUser = null;
      
      for (const key of possibleKeys) {
        const value = localStorage.getItem(key);
        if (value) {
          storedUser = value;
          break;
        }
      }
      
      if (storedUser) {
        try {
          // Check if it's a JSON object or just a string
          if (storedUser.startsWith('{')) {
            const user = JSON.parse(storedUser);
            setUserRole({
              role: user.role || 'CustomerUser',
              permissions: user.permissions || [],
            });
          } else {
            // It's just a role string
            setUserRole({
              role: storedUser || 'CustomerUser',
              permissions: [],
            });
          }
        } catch (error) {
          console.error('Error parsing user data:', error);
          setUserRole({
            role: 'CustomerUser',
            permissions: [],
          });
        }
      } else {
        // Fallback: If no user data found, assume SystemAdmin
        setUserRole({
          role: 'SystemAdmin',
          permissions: [],
        });
      }
    } catch (error) {
      console.error('Error accessing localStorage:', error);
      // Fallback: If localStorage access fails, assume SystemAdmin
      setUserRole({
        role: 'SystemAdmin',
        permissions: [],
      });
    }
  }, []);

  return userRole;
};
