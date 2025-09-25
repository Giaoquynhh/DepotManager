import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useTranslation } from '../hooks/useTranslation';

interface ContainerSubmenuProps {
  isExpanded: boolean;
  onToggle: () => void;
  containerType: 'lift' | 'lower';
  onSidebarLinkClick?: (e: React.MouseEvent) => void;
  onSubmenuLinkClick?: (e: React.MouseEvent) => void;
}

export const ContainerSubmenu: React.FC<ContainerSubmenuProps> = ({ 
  isExpanded, 
  onToggle, 
  containerType,
  onSidebarLinkClick,
  onSubmenuLinkClick
}) => {
  const { t } = useTranslation();
  const router = useRouter();

  const isLift = containerType === 'lift';
  const mainHref = isLift ? '/LiftContainer' : '/LowerContainer/Request';
  
  const submenuItems = [
    {
      key: 'requests',
      href: mainHref,
      icon: (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
          <polyline points="14,2 14,8 20,8"/>
          <line x1="16" y1="13" x2="8" y2="13"/>
          <line x1="16" y1="17" x2="8" y2="17"/>
          <polyline points="10,9 9,9 8,9"/>
        </svg>
      ),
      label: isLift ? 'Yêu cầu nâng container' : 'Yêu cầu hạ container'
    }
  ];

  // Add specific submenu items
  if (!isLift) {
    // Thêm submenu mới ngay dưới Yêu cầu hạ container
    submenuItems.push({
      key: 'new-submenu',
      href: '/LowerContainer/NewSubmenu',
      icon: (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"></path>
        </svg>
      ),
      label: 'Submenu mới'
    });

    // Gate hạ container
    submenuItems.push({
      key: 'gate-lower',
      href: '/LowerContainer/Gate',
      icon: (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M3 4h13l3 7-3 7H3V4z"></path>
          <path d="M8 11l2 2 4-4"></path>
        </svg>
      ),
      label: 'Gate hạ container'
    });

    submenuItems.push({
      key: 'inspection',
      href: '/Maintenance/Repairs', // Using the actual inspection/repairs page route
      icon: (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
        </svg>
      ),
      label: 'Khu vực kiểm tra'
    });

    // Forklift management for Lower (IMPORT)
    submenuItems.push({
      key: 'forklift-lower',
      href: '/LowerContainer/Forklift',
      icon: (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M3 3h10v8H3z"></path>
          <path d="M13 11l4 0 2 4v4h-3"></path>
          <circle cx="7" cy="19" r="2"></circle>
          <circle cx="17" cy="19" r="2"></circle>
        </svg>
      ),
      label: 'Quản lý xe nâng'
    });
  } else {
    // Gate nâng container
    submenuItems.push({
      key: 'gate-lift',
      href: '/LiftContainer/Gate',
      icon: (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M3 4h13l3 7-3 7H3V4z"></path>
          <path d="M8 11l2-2 4 4"></path>
        </svg>
      ),
      label: 'Gate nâng container'
    });

    // Forklift management for Lift (EXPORT)
    submenuItems.push({
      key: 'forklift-lift',
      href: '/LiftContainer/Forklift',
      icon: (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M3 3h10v8H3z"></path>
          <path d="M13 11l4 0 2 4v4h-3"></path>
          <circle cx="7" cy="19" r="2"></circle>
          <circle cx="17" cy="19" r="2"></circle>
        </svg>
      ),
      label: 'Quản lý xe nâng'
    });
  }

  const isContainerPage = router.pathname === mainHref || (!isLift && router.pathname === '/Maintenance/Repairs');

  return (
    <div className="sidebar-group">
      <button 
        className={`sidebar-link sidebar-group-toggle ${isContainerPage ? 'active' : ''}`}
        onClick={onToggle}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
          <polyline points="7.5,4.21 12,6.81 16.5,4.21"></polyline>
          <polyline points="7.5,19.79 7.5,14.6 3,12"></polyline>
          <polyline points="21,12 16.5,14.6 16.5,19.79"></polyline>
          <polyline points="3.27,6.96 12,12.01 20.73,6.96"></polyline>
          <line x1="12" y1="22.08" x2="12" y2="12"></line>
          <path d={isLift ? "M8 12l2-2 4 4" : "M8 12l2 2 4-4"}></path>
        </svg>
        <span>{t(isLift ? 'sidebar.liftContainer' : 'sidebar.lowerContainer')}</span>
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
              onClick={(e) => {
                console.log('Submenu link clicked:', item.href);
                if (onSubmenuLinkClick) {
                  onSubmenuLinkClick(e);
                } else if (onSidebarLinkClick) {
                  onSidebarLinkClick(e);
                }
              }}
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
