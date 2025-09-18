// Tab Navigation component
import React from 'react';
import { ActiveTab, Language } from '../types';

interface TabNavigationProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  role: string;
  language: Language;
  translations: any;
}

export const TabNavigation: React.FC<TabNavigationProps> = ({
  activeTab,
  setActiveTab,
  role,
  language,
  translations
}) => {
  // Chỉ hiển thị tabs cho các role có quyền quản lý cả nhân viên và customer
  const canManageBoth = ['SystemAdmin', 'BusinessAdmin', 'admin'].includes(role);
  
  if (!canManageBoth) {
    return null; // Chỉ hiển thị tab "Người dùng" cho các role khác
  }

  return (
    <div style={{
      display: 'flex',
      gap: '4px',
      marginBottom: '24px',
      padding: '4px',
      background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
      borderRadius: '12px',
      border: '1px solid #e2e8f0',
      boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05), 0 1px 2px rgba(0, 0, 0, 0.1)',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Background indicator */}
      <div
        style={{
          position: 'absolute',
          top: '4px',
          left: activeTab === 'users' ? '4px' : 'calc(50% + 2px)',
          width: 'calc(50% - 4px)',
          height: 'calc(100% - 8px)',
          background: 'linear-gradient(135deg, #0b2b6d 0%, #1e40af 100%)',
          borderRadius: '8px',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          boxShadow: '0 4px 6px rgba(11, 43, 109, 0.3), 0 1px 3px rgba(11, 43, 109, 0.2)',
          zIndex: 1
        }}
      />
      
      <button 
        onClick={() => setActiveTab('users')}
        style={{
          position: 'relative',
          zIndex: 2,
          flex: 1,
          padding: '12px 20px',
          border: 'none',
          background: 'transparent',
          color: activeTab === 'users' ? 'white' : '#64748b',
          cursor: 'pointer',
          fontSize: '15px',
          fontWeight: '600',
          borderRadius: '8px',
          transition: 'all 0.2s ease',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
          textShadow: activeTab === 'users' ? '0 1px 2px rgba(0, 0, 0, 0.1)' : 'none'
        }}
        onMouseEnter={(e) => {
          if (activeTab !== 'users') {
            e.currentTarget.style.color = '#334155';
            e.currentTarget.style.transform = 'translateY(-1px)';
          }
        }}
        onMouseLeave={(e) => {
          if (activeTab !== 'users') {
            e.currentTarget.style.color = '#64748b';
            e.currentTarget.style.transform = 'translateY(0)';
          }
        }}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
          <circle cx="9" cy="7" r="4"/>
          <path d="M22 21v-2a4 4 0 0 0-3-3.87"/>
          <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
        </svg>
        {translations[language].usersTab}
      </button>
      
      <button 
        onClick={() => {
          console.log('Switching to partners tab, current role:', role);
          setActiveTab('partners');
        }}
        style={{
          position: 'relative',
          zIndex: 2,
          flex: 1,
          padding: '12px 20px',
          border: 'none',
          background: 'transparent',
          color: activeTab === 'partners' ? 'white' : '#64748b',
          cursor: 'pointer',
          fontSize: '15px',
          fontWeight: '600',
          borderRadius: '8px',
          transition: 'all 0.2s ease',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
          textShadow: activeTab === 'partners' ? '0 1px 2px rgba(0, 0, 0, 0.1)' : 'none'
        }}
        onMouseEnter={(e) => {
          if (activeTab !== 'partners') {
            e.currentTarget.style.color = '#334155';
            e.currentTarget.style.transform = 'translateY(-1px)';
          }
        }}
        onMouseLeave={(e) => {
          if (activeTab !== 'partners') {
            e.currentTarget.style.color = '#64748b';
            e.currentTarget.style.transform = 'translateY(0)';
          }
        }}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
          <circle cx="9" cy="7" r="4"/>
          <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
          <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
        </svg>
        {translations[language].partnersTab}
      </button>
    </div>
  );
};
