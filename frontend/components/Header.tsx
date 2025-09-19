import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/router';
import { canViewUsersPartners, isSaleAdmin, isAccountant, canUseGate, isSystemAdmin, isYardManager, isMaintenanceManager, isSecurity, isCustomerRole, isDriver, canManageYard, canManageContainers, canManageForklift, canManageMaintenance, canManageFinance } from '@utils/rbac';
import { hasPermission } from '@utils/permissionsCatalog';
import { api } from '@services/api';
import { useTranslation } from '../hooks/useTranslation';

interface User {
  email?: string;
  role?: string;
  permissions?: string[];
}

export default function Header() {
  const router = useRouter();
  const [hasToken, setHasToken] = useState(false);
  const [me, setMe] = useState<User | null>(null);
  const [navOpen, setNavOpen] = useState(false); // Khởi tạo đóng, sẽ được set bởi logic restore
  const [isLoading, setIsLoading] = useState(true);
  const [accountDropdownOpen, setAccountDropdownOpen] = useState(false);
  const [gateSubmenuOpen, setGateSubmenuOpen] = useState(false);
  const [hrSubmenuOpen, setHrSubmenuOpen] = useState(false);
  const accountBtnRef = useRef<HTMLButtonElement | null>(null);
  const dropdownMenuRef = useRef<HTMLDivElement | null>(null);
  const [dropdownPos, setDropdownPos] = useState<{top:number; right:number}>({ top: 0, right: 12 });
  
  // Translation hook
  const { t, currentLanguage, changeLanguage } = useTranslation();

  // Language management functions
  const toggleLanguage = () => {
    const newLang = currentLanguage === 'vi' ? 'en' : 'vi';
    changeLanguage(newLang);
    
    // Update data-lang attribute
    const container = document.querySelector('.language-toggle-container');
    if (container) {
      container.setAttribute('data-lang', newLang);
    }
  };

  const setLanguage = (lang: 'vi' | 'en') => {
    changeLanguage(lang);
    
    // Update data-lang attribute
    const container = document.querySelector('.language-toggle-container');
    if (container) {
      container.setAttribute('data-lang', lang);
    }
  };

  // Helper: load profile and permissions
  const loadMe = async (silent = true) => {
    try {
      if (!silent) setIsLoading(true);
      const response = await api.get('/auth/me');
      setMe({
        email: response.data?.email,
        role: response.data?.role || response.data?.roles?.[0],
        permissions: Array.isArray(response.data?.permissions) ? response.data.permissions : undefined
      });
    } catch (e) {
      try {
        localStorage.removeItem('token');
        localStorage.removeItem('refresh_token');
      } catch {}
      setHasToken(false);
    } finally {
      if (!silent) setIsLoading(false);
    }
  };

  // Initialize auth state
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token');
      const hasValidToken = !!token;
      setHasToken(hasValidToken);

      if (hasValidToken) {
        loadMe(false);
      } else {
        setIsLoading(false);
      }

      // Restore sidebar state
      try {
        if (window.innerWidth >= 1024) {
          // Desktop: luôn mở sidebar
          setNavOpen(true);
        } else {
          // Mobile: luôn đóng mặc định, không restore từ localStorage
          setNavOpen(false);
        }
      } catch (error) {
        console.warn('Failed to restore nav state:', error);
        // Fallback: mở trên desktop, đóng trên mobile
        setNavOpen(window.innerWidth >= 1024);
      }

                   // Restore language preference - default to Vietnamese
      try {
        const savedLanguage = localStorage.getItem('preferred-language') || 'vi';
        if (savedLanguage === 'vi' || savedLanguage === 'en') {
          changeLanguage(savedLanguage as 'vi' | 'en');
        } else {
          changeLanguage('vi'); // Default to Vietnamese
        }
      } catch (error) {
        console.warn('Failed to restore language preference:', error);
        changeLanguage('vi'); // Default to Vietnamese on error
      }
    }
  }, []);

  // Auto-open Gate submenu when on Gate pages
  useEffect(() => {
    if (router.pathname === '/Gate' || router.pathname === '/Gate/History') {
      setGateSubmenuOpen(true);
    } else {
      setGateSubmenuOpen(false);
    }
  }, [router.pathname]);

  // Auto-refresh permissions on tab focus/visibility/route change
  useEffect(() => {
    if (!hasToken) return;
    const onFocus = () => { loadMe(true); };
    const onVisible = () => {
      try {
        if (document.visibilityState === 'visible') loadMe(true);
      } catch {}
    };
    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onVisible);
    try {
      // Next.js router events
      router.events?.on('routeChangeComplete', onFocus);
    } catch {}
    return () => {
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onVisible);
      try {
        router.events?.off('routeChangeComplete', onFocus);
      } catch {}
    };
  }, [hasToken, router.events]);

  // Periodic polling (visible tab only) to keep permissions fresh without manual reload
  useEffect(() => {
    if (!hasToken) return;
    let timer: any;
    const tick = () => {
      try {
        if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
          loadMe(true);
        }
      } catch {}
      timer = setTimeout(tick, 15000); // 15s interval
    };
    timer = setTimeout(tick, 15000);
    return () => { if (timer) clearTimeout(timer); };
  }, [hasToken]);

  // Handle sidebar state changes
  useEffect(() => {
    if (typeof document !== 'undefined') {
      const shouldShowSidebar = router.pathname !== '/Login' && router.pathname !== '/Register';
      
      document.body.classList.toggle('with-sidebar', shouldShowSidebar && navOpen);
      
      // Chỉ lưu trạng thái sidebar trên mobile
      if (typeof window !== 'undefined' && window.innerWidth < 1024) {
        try {
          localStorage.setItem('nav_open', navOpen ? '1' : '0');
        } catch (error) {
          console.warn('Failed to save nav state:', error);
        }
      }
    }
  }, [navOpen, router.pathname]);

  // Đảm bảo sidebar luôn mở trên desktop, đóng trên mobile
  useEffect(() => {
    const handleResize = () => {
      if (typeof window !== 'undefined') {
        if (window.innerWidth >= 1024) {
          setNavOpen(true);
        } else {
          setNavOpen(false);
        }
      }
    };

    // Chỉ kiểm tra resize, không gọi ngay khi mount để tránh override logic restore
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!accountDropdownOpen) return;
      const target = event.target as Node | null;
      // Nếu click trong menu hoặc nút, thì không đóng để onClick của item hoạt động
      if (dropdownMenuRef.current && target && dropdownMenuRef.current.contains(target)) return;
      if (accountBtnRef.current && target && accountBtnRef.current.contains(target)) return;
      setAccountDropdownOpen(false);
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [accountDropdownOpen]);

  const handleLogout = () => {
    try {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('token');
        localStorage.removeItem('refresh_token');
        setHasToken(false);
        setMe(null);
        setAccountDropdownOpen(false);
        window.location.href = '/Login';
      }
    } catch (error) {
      console.error('Logout error:', error);
      // Force redirect anyway
      window.location.href = '/Login';
    }
  };

  // Toggle sidebar - chỉ hoạt động trên mobile
  const toggleNavigation = (e?: React.MouseEvent) => {
    // Ngăn chặn event bubbling
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    // Chỉ cho phép toggle trên mobile (màn hình nhỏ hơn 1024px)
    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
      setNavOpen(prev => !prev);
    }
  };

  // Đóng sidebar khi click vào menu item trên mobile
  const handleSidebarLinkClick = (e: React.MouseEvent) => {
    // Chỉ đóng sidebar trên mobile (màn hình nhỏ hơn 1024px)
    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
      // Đóng sidebar ngay lập tức
      setNavOpen(false);
      // Lưu trạng thái đóng vào localStorage để tránh restore lại
      try {
        localStorage.setItem('nav_open', '0');
      } catch (error) {
        console.warn('Failed to save nav state:', error);
      }
    }
    // Không preventDefault để cho phép chuyển trang bình thường
  };

  const toggleAccountDropdown = () => {
    setAccountDropdownOpen(prev => !prev);
  };

  const toggleGateSubmenu = () => {
    setGateSubmenuOpen(prev => !prev);
  };

  const toggleHrSubmenu = () => {
    setHrSubmenuOpen(prev => !prev);
  };

  // Recalculate dropdown position on resize/scroll when open
  useEffect(() => {
    if (!accountDropdownOpen) return;
    const updatePosition = () => {
      try {
        const rect = accountBtnRef.current?.getBoundingClientRect();
        if (rect) {
          setDropdownPos({
            top: Math.round(rect.bottom + 8), // viewport coords for position: fixed
            right: Math.max(12, Math.round(window.innerWidth - rect.right - 12))
          });
        }
      } catch {}
    };
    updatePosition();
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);
    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
    };
  }, [accountDropdownOpen]);

  // Component state calculations
  const showLogout = hasToken && router.pathname !== '/Login';
  const showSidebar = router.pathname !== '/Login' && router.pathname !== '/Register'; // Luôn hiển thị sidebar trừ trang Login/Register
  const isAuthPage = router.pathname === '/Login' || router.pathname === '/Register';

  // Debug logging
  useEffect(() => {
    console.log('🔍 Debug Header State:', {
      hasToken,
      showSidebar,
      navOpen,
      userRole: me?.role,
      pathname: router.pathname,
      canUseGate: canUseGate(me?.role),
      isSecurity: isSecurity(me?.role)
    });
  }, [hasToken, showSidebar, navOpen, me?.role, router.pathname]);

  return (
    <header className="header">
      <div className={`container header-inner${isAuthPage ? ' auth-center' : ''}`}>
        {/* Navigation Toggle Button - Chỉ hiển thị trên mobile */}
        {showSidebar && (
          <button 
            className="nav-toggle mobile-only" 
            onClick={(e) => toggleNavigation(e)}
            title={navOpen ? t('header.closeMenu') : t('header.openMenu')}
            aria-label={navOpen ? t('header.closeMenu') : t('header.openMenu')}
            aria-expanded={navOpen}
          >
            <span className="nav-toggle-icon">
              {navOpen ? (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              ) : (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="3" y1="6" x2="21" y2="6"></line>
                  <line x1="3" y1="12" x2="21" y2="12"></line>
                  <line x1="3" y1="18" x2="21" y2="18"></line>
                </svg>
              )}
            </span>
          </button>
        )}

        {/* Brand Section */}
        <div className="header-brand">
          <Link href="/" className="header-logo-link">
            <Image 
              src="/sml_logo.png" 
              alt="Smartlog Depot Management" 
              width={80} 
              height={24} 
              className="logo"
              priority
            />
          </Link>
                     <h1 className="header-title">{t('header.brand')}</h1>
        </div>

        {/* User Actions Section */}
        <div className="header-actions">
          {/* User Info */}
          {me?.role && !isLoading && (
            <div className="user-info">
              <span className="user-role">({me.role})</span>
              <span className="user-email">{me.email}</span>
            </div>
          )}

          {/* Loading State */}
          {isLoading && (
            <div className="user-loading">
              <div className="loading-spinner-small"></div>
            </div>
          )}

          {/* Language Toggle Button */}
          <div className="language-toggle-dropdown">
            <div className="language-toggle-container" data-lang={currentLanguage}>
              <button className="language-toggle-btn" onClick={toggleLanguage}>
                <img 
                  src={currentLanguage === 'vi' ? '/flags/vn.svg' : '/flags/gb.svg'} 
                  alt={currentLanguage === 'vi' ? 'Việt Nam' : 'English'} 
                  className="language-flag" 
                />
                                 <span className="language-name">
                   {currentLanguage === 'vi' ? t('language.vietnamese') : t('language.english')}
                 </span>
                 <span className="language-code">
                   {currentLanguage === 'vi' ? t('language.vi') : t('language.en')}
                 </span>
                <span className="toggle-switch-icon">⌄</span>
              </button>
            </div>
            
            <div className="dropdown-content">
              <div className="dropdown-header">
                                 <h3 className="dropdown-title">{t('language.selectLanguage')}</h3>
                 <p className="dropdown-subtitle">{t('language.selectLanguageSubtitle')}</p>
              </div>
              
              <div 
                className={`language-option-item ${currentLanguage === 'vi' ? 'active' : ''}`} 
                onClick={() => setLanguage('vi')}
              >
                <img src="/flags/vn.svg" alt="Việt Nam" className="option-flag" />
                <div className="option-info">
                                     <div className="option-name">{t('language.vietnamese')}</div>
                   <div className="option-native">{t('language.vietnamese')}</div>
                </div>
                <div className="option-status">
                  {currentLanguage === 'vi' ? '✓' : ''}
                </div>
              </div>
              
              <div 
                className={`language-option-item ${currentLanguage === 'en' ? 'active' : ''}`} 
                onClick={() => setLanguage('en')}
              >
                <img src="/flags/gb.svg" alt="English" className="option-flag" />
                <div className="option-info">
                                     <div className="option-name">{t('language.english')}</div>
                   <div className="option-native">{t('language.english')}</div>
                </div>
                <div className="option-status">
                  {currentLanguage === 'en' ? '✓' : ''}
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="header-buttons">
            {/* Account Dropdown */}
            {showLogout && (
              <div className="account-dropdown-container">
                <button 
                  className="btn btn-outline header-account-btn" 
                  onClick={() => {
                    try{
                      const rect = accountBtnRef.current?.getBoundingClientRect();
                      if (rect) {
                        setDropdownPos({
                          top: Math.round(rect.bottom + 8),
                          right: Math.max(12, Math.round(window.innerWidth - rect.right - 12))
                        });
                      }
                    }catch{}
                    toggleAccountDropdown();
                  }}
                  type="button"
                                     title={t('header.account')}
                  ref={accountBtnRef}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                    <circle cx="12" cy="7" r="4"></circle>
                  </svg>
                  <span>{t('header.account')}</span>
                  <svg 
                    width="12" 
                    height="12" 
                    viewBox="0 0 24 24" 
                    fill="none" 
                    stroke="currentColor" 
                    strokeWidth="2"
                    style={{
                      transform: accountDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                      transition: 'transform 0.2s ease'
                    }}
                  >
                    <polyline points="6,9 12,15 18,9"></polyline>
                  </svg>
                </button>
                
                {/* Account Dropdown Menu */}
                {accountDropdownOpen && typeof document !== 'undefined' && createPortal(
                  <div 
                    className="account-dropdown-menu"
                    style={{
                      position: 'fixed',
                      top: dropdownPos.top,
                      right: dropdownPos.right,
                      zIndex: 2000
                    }}
                    ref={dropdownMenuRef}
                  >
                    <Link 
                      href="/Account" 
                      className="dropdown-item"
                      onClick={() => setAccountDropdownOpen(false)}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                        <circle cx="12" cy="7" r="4"></circle>
                      </svg>
                                             <span>{t('header.accountInfo')}</span>
                    </Link>
                    {canViewUsersPartners(me?.role) && (
                      <Link 
                        href="/UsersPartners" 
                        className="dropdown-item"
                        onClick={() => setAccountDropdownOpen(false)}
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                          <circle cx="9" cy="7" r="4"></circle>
                          <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                          <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                        </svg>
                                                 <span>{t('header.userManagement')}</span>
                      </Link>
                    )}
                    <div className="dropdown-divider"></div>
                    <button 
                      className="dropdown-item dropdown-item-danger" 
                      onClick={handleLogout}
                      type="button"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                        <polyline points="16,17 21,12 16,7"></polyline>
                        <line x1="21" y1="12" x2="9" y2="12"></line>
                      </svg>
                                             <span>{t('header.logout')}</span>
                    </button>
                  </div>,
                  document.body
                )}
              </div>
            )}
            
            {!hasToken && router.pathname !== '/Login' && (
              <Link 
                className="btn btn-outline header-login-btn" 
                href="/Login"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"></path>
                  <polyline points="10,17 15,12 10,7"></polyline>
                  <line x1="15" y1="12" x2="3" y2="12"></line>
                </svg>
                                 <span>{t('header.login')}</span>
              </Link>
            )}
          </div>
        </div>
      </div>
      {/* Sidebar Navigation - Hiển thị khi có token và navOpen */}
      {showSidebar && (
        <>
          {/* Overlay cho mobile - chỉ hiển thị khi sidebar mở */}
          {navOpen && (
            <div 
              className="sidebar-overlay mobile-only" 
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                toggleNavigation();
              }}
              aria-label={t('header.closeMenu')}
            />
          )}
          <nav className={`sidebar ${!navOpen ? 'closed' : ''}`} role="navigation" aria-label={t('sidebar.mainMenu')}>
          <div className="sidebar-content">
            
            {/* Sidebar trống khi chưa đăng nhập - không hiển thị menu gì */}
            
            {/* Helper: permission-aware gating - chỉ hiển thị khi đã đăng nhập */}
            {hasToken && (
              <>
                {/* HR Management Module with Submenu */}
            {(() => {
              const allowUsersPartners = canViewUsersPartners(me?.role);
              const allowPermissions = isSystemAdmin(me?.role);
              const okUsersPartners = Array.isArray(me?.permissions) && me!.permissions!.length > 0
                ? hasPermission(me?.permissions, 'users_partners.view')
                : allowUsersPartners;
              const okPermissions = Array.isArray(me?.permissions) && me!.permissions!.length > 0
                ? hasPermission(me?.permissions, 'permissions.manage')
                : allowPermissions;
              return okUsersPartners || okPermissions;
            })() && (
              <div className="sidebar-group">
                <button 
                  className={`sidebar-link sidebar-group-toggle ${router.pathname === '/UsersPartners' || router.pathname === '/Permissions' ? 'active' : ''}`}
                  onClick={toggleHrSubmenu}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                    <circle cx="9" cy="7" r="4"></circle>
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                    <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                  </svg>
                  <span>{t('sidebar.hrManagement')}</span>
                  <svg 
                    width="12" 
                    height="12" 
                    viewBox="0 0 24 24" 
                    fill="none" 
                    stroke="currentColor" 
                    strokeWidth="2"
                    style={{
                      transform: hrSubmenuOpen ? 'rotate(90deg)' : 'rotate(0deg)',
                      transition: 'transform 0.2s ease',
                      marginLeft: 'auto'
                    }}
                  >
                    <polyline points="9,18 15,12 9,6"></polyline>
                  </svg>
                </button>
                
                {hrSubmenuOpen && (
                  <div className="sidebar-submenu">
                    {(() => {
                      const allow = canViewUsersPartners(me?.role);
                      const ok = Array.isArray(me?.permissions) && me!.permissions!.length > 0
                        ? hasPermission(me?.permissions, 'users_partners.view')
                        : allow;
                      return ok;
                    })() && (
                      <Link 
                        className={`sidebar-link sidebar-submenu-link ${router.pathname === '/UsersPartners' ? 'active' : ''}`} 
                        href="/UsersPartners" 
                        onClick={handleSidebarLinkClick}
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                          <circle cx="9" cy="7" r="4"></circle>
                          <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                          <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                        </svg>
                        <span>{t('sidebar.usersPartners')}</span>
                      </Link>
                    )}
                    {(() => {
                      const allow = isSystemAdmin(me?.role);
                      const ok = Array.isArray(me?.permissions) && me!.permissions!.length > 0
                        ? hasPermission(me?.permissions, 'permissions.manage')
                        : allow;
                      return ok;
                    })() && (
                      <Link 
                        className={`sidebar-link sidebar-submenu-link ${router.pathname === '/Permissions' ? 'active' : ''}`} 
                        href="/Permissions" 
                        onClick={handleSidebarLinkClick}
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                        </svg>
                        <span>{t('sidebar.permissions')}</span>
                      </Link>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Requests Depot Module */}
            {(() => {
              const allow = isSaleAdmin(me?.role) || isAccountant(me?.role) || isSystemAdmin(me?.role);
              const ok = Array.isArray(me?.permissions) && me!.permissions!.length > 0
                ? hasPermission(me?.permissions, 'requests.depot')
                : allow;
              return ok;
            })() && (
              <Link className={`sidebar-link ${router.pathname === '/Requests/Depot' ? 'active' : ''}`} href="/Requests/Depot" onClick={handleSidebarLinkClick}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                  <polyline points="14,2 14,8 20,8"></polyline>
                  <line x1="16" y1="13" x2="8" y2="13"></line>
                  <line x1="16" y1="17" x2="8" y2="17"></line>
                  <polyline points="10,9 9,9 8,9"></polyline>
                </svg>
                <span>{t('sidebar.requests')}</span>
              </Link>
            )}
            
            {/* Requests Customer Module removed */}

            {/* Gate Module with Submenu */}
            {(() => {
              const allow = canUseGate(me?.role) || isSecurity(me?.role);
              const ok = Array.isArray(me?.permissions) && me!.permissions!.length > 0
                ? hasPermission(me?.permissions, 'gate.use')
                : allow;
              return ok;
            })() && (
              <div className="sidebar-group">
                <button 
                  className={`sidebar-link sidebar-group-toggle ${router.pathname === '/Gate' || router.pathname === '/Gate/History' ? 'active' : ''}`}
                  onClick={toggleGateSubmenu}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
                    <line x1="3" y1="6" x2="21" y2="6"></line>
                    <path d="M16 10a4 4 0 0 1-8 0"></path>
                  </svg>
                  <span>{t('sidebar.gate')}</span>
                  <svg 
                    width="12" 
                    height="12" 
                    viewBox="0 0 24 24" 
                    fill="none" 
                    stroke="currentColor" 
                    strokeWidth="2"
                    style={{
                      transform: gateSubmenuOpen ? 'rotate(90deg)' : 'rotate(0deg)',
                      transition: 'transform 0.2s ease',
                      marginLeft: 'auto'
                    }}
                  >
                    <polyline points="9,18 15,12 9,6"></polyline>
                  </svg>
                </button>
                
                {gateSubmenuOpen && (
                  <div className="sidebar-submenu">
                    <Link 
                      className={`sidebar-link sidebar-submenu-link ${router.pathname === '/Gate' ? 'active' : ''}`} 
                      href="/Gate" 
                      onClick={handleSidebarLinkClick}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                        <line x1="9" y1="9" x2="9" y2="9.01"></line>
                        <line x1="15" y1="9" x2="15" y2="9.01"></line>
                        <line x1="9" y1="15" x2="9" y2="15.01"></line>
                        <line x1="15" y1="15" x2="15" y2="15.01"></line>
                        <line x1="9" y1="12" x2="15" y2="12"></line>
                      </svg>
                      <span>Bảng điều khiển</span>
                    </Link>
                    <Link 
                      className={`sidebar-link sidebar-submenu-link ${router.pathname === '/Gate/History' ? 'active' : ''}`} 
                      href="/Gate/History" 
                      onClick={handleSidebarLinkClick}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M3 4h13l3 7-3 7H3V4z"></path>
                        <path d="M8 11l2 2 4-4"></path>
                      </svg>
                      <span>Lịch sử ra vào</span>
                    </Link>
                  </div>
                )}
              </div>
            )}

            {/* Yard Module */}
            {(() => {
              const allow = canManageYard(me?.role);
              const ok = Array.isArray(me?.permissions) && me!.permissions!.length > 0
                ? hasPermission(me?.permissions, 'yard.view')
                : allow;
              return ok;
            })() && (
                <Link className={`sidebar-link ${router.pathname === '/Yard' ? 'active' : ''}`} href="/Yard" onClick={handleSidebarLinkClick}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M3 3h18v18H3zM9 9h6v6H9z"></path>
                    <path d="M9 1v6M15 1v6M9 17v6M15 17v6M1 9h6M17 9h6M1 15h6M17 15h6"></path>
                  </svg>
                  <span>{t('sidebar.yard')}</span>
                </Link>
            )}

            {/* Containers Module */}
            {(() => {
              const allow = canManageContainers(me?.role);
              const ok = Array.isArray(me?.permissions) && me!.permissions!.length > 0
                ? hasPermission(me?.permissions, 'containers.manage')
                : allow;
              return ok;
            })() && (
                <Link className={`sidebar-link ${router.pathname === '/ContainersPage' ? 'active' : ''}`} href="/ContainersPage" onClick={handleSidebarLinkClick}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
                    <polyline points="7.5,4.21 12,6.81 16.5,4.21"></polyline>
                    <polyline points="7.5,19.79 7.5,14.6 3,12"></polyline>
                    <polyline points="21,12 16.5,14.6 16.5,19.79"></polyline>
                    <polyline points="3.27,6.96 12,12.01 20.73,6.96"></polyline>
                    <line x1="12" y1="22.08" x2="12" y2="12"></line>
                  </svg>
                  <span>{t('sidebar.containerManagement')}</span>
                </Link>
            )}

            {/* Forklift Module - Xe nâng */}
            {(() => {
              const allow = canManageForklift(me?.role);
              const ok = Array.isArray(me?.permissions) && me!.permissions!.length > 0
                ? hasPermission(me?.permissions, 'forklift.view')
                : allow;
              return ok;
            })() && (
              <Link className={`sidebar-link ${router.pathname === '/Forklift' ? 'active' : ''}`} href="/Forklift" onClick={handleSidebarLinkClick}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polygon points="13,2 3,14 12,14 11,22 21,10 12,10 13,2"></polygon>
                </svg>
                <span>{t('sidebar.forkliftManagement')}</span>
              </Link>
            )}

            {/* Driver Dashboard Module - Bảng điều khiển */}
            {(() => {
                              const allow = isDriver(me?.role);
                const ok = Array.isArray(me?.permissions) && me!.permissions!.length > 0
                  ? hasPermission(me?.permissions, 'driver.dashboard')
                  : allow;
                return ok;
            })() && (
              <Link className={`sidebar-link ${router.pathname === '/DriverDashboard' ? 'active' : ''}`} href="/DriverDashboard" onClick={handleSidebarLinkClick}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                  <line x1="9" y1="9" x2="9" y2="9.01"></line>
                  <line x1="15" y1="9" x2="15" y2="9.01"></line>
                  <line x1="9" y1="15" x2="9" y2="15.01"></line>
                  <line x1="15" y1="15" x2="15" y2="15.01"></line>
                  <line x1="9" y1="12" x2="15" y2="12"></line>
                </svg>
                                 <span>{t('sidebar.dashboard')}</span>
              </Link>
            )}
            {/* Maintenance - Repairs */}
            {(() => {
              const allow = canManageMaintenance(me?.role);
              const ok = Array.isArray(me?.permissions) && me!.permissions!.length > 0
                ? hasPermission(me?.permissions, 'maintenance.repairs')
                : allow;
              return ok;
            })() && (
                <Link className={`sidebar-link ${router.pathname === '/Maintenance/Repairs' ? 'active' : ''}`} href="/Maintenance/Repairs" onClick={handleSidebarLinkClick}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"></path>
                  </svg>
                                     <span>{t('sidebar.repairTickets')}</span>
                </Link>
            )}

            {/* Maintenance - Inventory */}
            {(() => {
              const allow = canManageMaintenance(me?.role);
              const ok = Array.isArray(me?.permissions) && me!.permissions!.length > 0
                ? hasPermission(me?.permissions, 'maintenance.inventory')
                : allow;
              return ok;
            })() && (
                <Link className={`sidebar-link ${router.pathname === '/Maintenance/Inventory' ? 'active' : ''}`} href="/Maintenance/Inventory" onClick={handleSidebarLinkClick}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
                  <polyline points="7.5,4.21 12,6.81 16.5,4.21"></polyline>
                  <polyline points="7.5,19.79 7.5,14.6 3,12"></polyline>
                  <polyline points="21,12 16.5,14.6 16.5,19.79"></polyline>
                  <polyline points="3.27,6.96 12,12.01 20.73,6.96"></polyline>
                  <line x1="12" y1="22.08" x2="12" y2="12"></line>
                </svg>
                                     <span>{t('sidebar.inventory')}</span>
                </Link>
            )}

            {/* Finance - Invoices */}
            {(() => {
              const allow = canManageFinance(me?.role);
              const ok = Array.isArray(me?.permissions) && me!.permissions!.length > 0
                ? hasPermission(me?.permissions, 'finance.invoices')
                : allow;
              return ok;
            })() && (
                <Link className={`sidebar-link ${router.pathname === '/finance/invoices' ? 'active' : ''}`} href="/finance/invoices" onClick={handleSidebarLinkClick}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                    <polyline points="14,2 14,8 20,8"></polyline>
                    <line x1="16" y1="13" x2="8" y2="13"></line>
                    <line x1="16" y1="17" x2="8" y2="17"></line>
                    <polyline points="10,9 9,9 8,9"></polyline>
                  </svg>
                                     <span>{t('sidebar.invoices')}</span>
                </Link>
            )}

            {/* Setup */}
            {(() => {
              const allow = me?.role === 'SystemAdmin' || me?.role === 'SaleAdmin';
              const ok = Array.isArray(me?.permissions) && me!.permissions!.length > 0
                ? hasPermission(me?.permissions, 'setup.manage')
                : allow;
              return ok;
            })() && (
            <Link className={`sidebar-link ${router.pathname === '/Setup' ? 'active' : ''}`} href="/Setup" onClick={handleSidebarLinkClick}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="3"></circle>
                <path d="M12 1v6m0 6v6m11-7h-6m-6 0H1"></path>
              </svg>
              <span>{t('sidebar.setup')}</span>
            </Link>
            )}

            {/* Account */}
            {(() => {
              const allow = true; // account visible by default
              const ok = Array.isArray(me?.permissions) && me!.permissions!.length > 0
                ? hasPermission(me?.permissions, 'account.view')
                : allow;
              return ok;
            })() && (
            <Link className={`sidebar-link ${router.pathname === '/Account' ? 'active' : ''}`} href="/Account" onClick={handleSidebarLinkClick}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                <circle cx="12" cy="7" r="4"></circle>
              </svg>
              <span>{t('sidebar.account')}</span>
            </Link>
            )}
              </>
            )}
          </div>
        </nav>
        </>
      )}
    </header>
  );
}

