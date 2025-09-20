export type AppRole = 'SystemAdmin' | 'SaleAdmin' | 'Security' | 'YardManager' | 'MaintenanceManager' | 'Accountant' | 'Driver' | 'Dispatcher' | 'admin';

export function homeFor(role: AppRole): string {
    if (canViewUsersPartners(role)) return '/UsersPartners';
    if (isSaleAdmin(role) || isAccountant(role)) return '/Requests/Depot';
    if (canUseGate(role)) return '/Gate';
    if (isDriver(role)) return '/DriverDashboard';
    return '/Account';
}

export function canViewUsersPartners(role?: string): boolean {
	return ['SystemAdmin','admin'].includes(String(role));
}

export function showInternalForm(role?: string): boolean {
	return ['SystemAdmin'].includes(String(role));
}

export function showCustomerForm(role?: string): boolean {
	return ['SystemAdmin'].includes(String(role));
}

export function showPartnerForm(role?: string): boolean {
	return ['SystemAdmin','admin'].includes(String(role));
}

// UsersPartners không còn hỗ trợ vai khách hàng
export function isCustomerRole(_role?: string): boolean { return false; }

export function isSaleAdmin(role?: string): boolean {
	return String(role) === 'SaleAdmin';
}

export function isAccountant(role?: string): boolean {
	return String(role) === 'Accountant';
}

export function canUseGate(role?: string): boolean {
	// FE chỉ kiểm tra role; backend sẽ xác thực Gate Mode theo thiết bị
	return ['SaleAdmin','SystemAdmin'].includes(String(role));
}

// SaleAdmin specific permissions
export function canManageYard(role?: string): boolean {
	return ['SystemAdmin','YardManager'].includes(String(role));
}

export function canManageContainers(role?: string): boolean {
	return ['SystemAdmin','YardManager'].includes(String(role));
}

export function canManageForklift(role?: string): boolean {
	return ['SystemAdmin','YardManager'].includes(String(role));
}

export function canManageMaintenance(role?: string): boolean {
	return ['SystemAdmin','MaintenanceManager'].includes(String(role));
}

export function canManageFinance(role?: string): boolean {
	return ['SystemAdmin','Accountant'].includes(String(role));
}

// Extra helpers for sidebar mapping
export function isSystemAdmin(role?: string): boolean { return String(role) === 'SystemAdmin'; }
export function isSecurity(role?: string): boolean { return String(role) === 'Security'; }
export function isYardManager(role?: string): boolean { return String(role) === 'YardManager'; }
export function isMaintenanceManager(role?: string): boolean { return String(role) === 'MaintenanceManager'; }
export function isDriver(role?: string): boolean { return String(role) === 'Driver'; }

// User action permissions
export function canLockUnlockUsers(role?: string): boolean {
	return ['SystemAdmin'].includes(String(role));
}

export function canDeleteUsers(role?: string): boolean {
	return ['SystemAdmin'].includes(String(role));
}

export function canUpdateUsers(role?: string): boolean {
	return ['SystemAdmin'].includes(String(role));
}

// Kiểm tra CustomerAdmin có thể khóa user cụ thể hay không
export function canLockSpecificUser(currentUserRole?: string, _targetUserRole?: string): boolean {
    // Chỉ còn SystemAdmin logic
    return ['SystemAdmin'].includes(String(currentUserRole));
}
