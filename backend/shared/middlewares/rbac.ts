import { Response, NextFunction } from 'express';
import { AuthRequest, AppRole } from './auth';

export const requireRoles = (...roles: AppRole[]) => (req: AuthRequest, res: Response, next: NextFunction) => {
	if (!req.user) return res.status(401).json({ message: 'Unauthorized' });
	if (!roles.includes(req.user.role)) return res.status(403).json({ message: 'Forbidden' });
	next();
};

// Helper functions for role checking
export const isSystemAdmin = (role?: string): boolean => String(role) === 'SystemAdmin';
export const isBusinessAdmin = (role?: string): boolean => String(role) === 'BusinessAdmin';
export const isTechnicalDepartment = (role?: string): boolean => String(role) === 'TechnicalDepartment';

// Keep old function for backward compatibility
export const isSaleAdmin = (role?: string): boolean => String(role) === 'TechnicalDepartment';
export const isYardManager = (role?: string): boolean => String(role) === 'YardManager';
export const isMaintenanceManager = (role?: string): boolean => String(role) === 'MaintenanceManager';
export const isAccountant = (role?: string): boolean => String(role) === 'Accountant';
export const isDriver = (role?: string): boolean => String(role) === 'Driver';

export const enforceTenantScope = (req: AuthRequest, res: Response, next: NextFunction) => {
	if (!req.user) return res.status(401).json({ message: 'Unauthorized' });
	// Note: CustomerAdmin/CustomerUser roles are deprecated
	// Tenant scoping logic removed as these roles no longer exist
	next();
};

