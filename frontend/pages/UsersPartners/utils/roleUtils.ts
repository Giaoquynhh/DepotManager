// Role utility functions
import { translations } from '../translations';

export const getRoleDisplayName = (role: string, language: 'vi' | 'en' = 'vi') => {
  const roleMap = {
    vi: {
      SystemAdmin: translations.vi.systemAdminLabel,
      SaleAdmin: translations.vi.saleAdminLabel,
      Driver: translations.vi.driverLabel,
      
      Security: 'Nhân viên bảo vệ',
      Dispatcher: 'Nhân viên điều độ',
    },
    en: {
      SystemAdmin: translations.en.systemAdminLabel,
      SaleAdmin: translations.en.saleAdminLabel,
      Driver: translations.en.driverLabel,
      
      Security: 'Security',
      Dispatcher: 'Dispatcher',
    }
  };
  return roleMap[language][role as keyof typeof roleMap.vi] || role;
};
