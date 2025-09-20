import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useTranslation } from '../hooks/useTranslation';

interface SetupSubmenuProps {
  isExpanded: boolean;
  onToggle: () => void;
  onSubmenuLinkClick?: (e: React.MouseEvent) => void;
}

export const SetupSubmenu: React.FC<SetupSubmenuProps> = ({ isExpanded, onToggle, onSubmenuLinkClick }) => {
  const { t } = useTranslation();
  const router = useRouter();

  const submenuItems = [
    {
      key: 'shippingLines',
      href: '/Setup/ShippingLines',
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M3 12h18l-2-2m2 2l-2 2M3 12l2-2m-2 2l2 2"/>
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
        </svg>
      ),
      label: t('sidebar.shippingLines')
    },
    {
      key: 'transportCompanies',
      href: '/Setup/TransportCompanies',
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
          <polyline points="14,2 14,8 20,8"/>
          <line x1="16" y1="13" x2="8" y2="13"/>
          <line x1="16" y1="17" x2="8" y2="17"/>
          <polyline points="10,9 9,9 8,9"/>
        </svg>
      ),
      label: t('sidebar.transportCompanies')
    },
    {
      key: 'containerTypes',
      href: '/Setup/ContainerTypes',
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/>
          <line x1="8" y1="21" x2="16" y2="21"/>
          <line x1="12" y1="17" x2="12" y2="21"/>
        </svg>
      ),
      label: t('sidebar.containerTypes')
    },
    {
      key: 'customers',
      href: '/Setup/Customers',
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
          <circle cx="12" cy="7" r="4"/>
        </svg>
      ),
      label: t('sidebar.customers')
    }
  ];

  const isSetupPage = router.pathname.startsWith('/Setup');

  return (
    <div className="sidebar-group">
      <button
        className={`sidebar-link sidebar-group-toggle ${isSetupPage ? 'active' : ''}`}
        onClick={onToggle}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="3"/>
          <path d="M12 1v6m0 6v6m11-7h-6m-6 0H1"/>
        </svg>
        <span>{t('sidebar.setup')}</span>
        <svg
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          style={{
            transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
            transition: 'transform 0.2s ease',
            marginLeft: 'auto'
          }}
        >
          <polyline points="9,18 15,12 9,6"></polyline>
        </svg>
      </button>

      {isExpanded && (
        <div className="sidebar-submenu">
          {submenuItems.map((item) => (
            <Link
              key={item.key}
              className={`sidebar-link sidebar-submenu-link ${router.pathname === item.href ? 'active' : ''}`}
              href={item.href}
              onClick={onSubmenuLinkClick}
            >
              {item.icon}
              <span>{item.label}</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};