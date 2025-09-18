// Tab Navigation component for Setup page
import React from 'react';

export type SetupTab = 'shippingLines' | 'transportCompanies';

interface TabNavigationProps {
  activeTab: SetupTab;
  setActiveTab: (tab: SetupTab) => void;
  language: 'vi' | 'en';
  translations: any;
}

export const TabNavigation: React.FC<TabNavigationProps> = ({
  activeTab,
  setActiveTab,
  language,
  translations
}) => {
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
          left: activeTab === 'shippingLines' ? '4px' : 'calc(50% + 2px)',
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
        onClick={() => setActiveTab('shippingLines')}
        style={{
          position: 'relative',
          zIndex: 2,
          flex: 1,
          padding: '12px 20px',
          border: 'none',
          background: 'transparent',
          color: activeTab === 'shippingLines' ? 'white' : '#64748b',
          cursor: 'pointer',
          fontSize: '15px',
          fontWeight: '600',
          borderRadius: '8px',
          transition: 'all 0.2s ease',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
          textShadow: activeTab === 'shippingLines' ? '0 1px 2px rgba(0, 0, 0, 0.1)' : 'none'
        }}
        onMouseEnter={(e) => {
          if (activeTab !== 'shippingLines') {
            e.currentTarget.style.color = '#334155';
            e.currentTarget.style.transform = 'translateY(-1px)';
          }
        }}
        onMouseLeave={(e) => {
          if (activeTab !== 'shippingLines') {
            e.currentTarget.style.color = '#64748b';
            e.currentTarget.style.transform = 'translateY(0)';
          }
        }}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M3 12h18l-2-2m2 2l-2 2M3 12l2-2m-2 2l2 2"/>
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
        </svg>
        {translations[language].shippingLinesTab}
      </button>
      
      <button 
        onClick={() => setActiveTab('transportCompanies')}
        style={{
          position: 'relative',
          zIndex: 2,
          flex: 1,
          padding: '12px 20px',
          border: 'none',
          background: 'transparent',
          color: activeTab === 'transportCompanies' ? 'white' : '#64748b',
          cursor: 'pointer',
          fontSize: '15px',
          fontWeight: '600',
          borderRadius: '8px',
          transition: 'all 0.2s ease',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
          textShadow: activeTab === 'transportCompanies' ? '0 1px 2px rgba(0, 0, 0, 0.1)' : 'none'
        }}
        onMouseEnter={(e) => {
          if (activeTab !== 'transportCompanies') {
            e.currentTarget.style.color = '#334155';
            e.currentTarget.style.transform = 'translateY(-1px)';
          }
        }}
        onMouseLeave={(e) => {
          if (activeTab !== 'transportCompanies') {
            e.currentTarget.style.color = '#64748b';
            e.currentTarget.style.transform = 'translateY(0)';
          }
        }}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
          <polyline points="14,2 14,8 20,8"/>
          <line x1="16" y1="13" x2="8" y2="13"/>
          <line x1="16" y1="17" x2="8" y2="17"/>
          <polyline points="10,9 9,9 8,9"/>
        </svg>
        {translations[language].transportCompaniesTab}
      </button>
    </div>
  );
};
