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
    <div style={{display:'flex', gap:0, marginBottom:20, borderBottom:'1px solid #e5e7eb'}}>
      <button 
        onClick={() => setActiveTab('shippingLines')}
        style={{
          padding: '12px 24px',
          border: 'none',
          background: activeTab === 'shippingLines' ? '#0b2b6d' : 'transparent',
          color: activeTab === 'shippingLines' ? 'white' : '#6b7280',
          borderBottom: activeTab === 'shippingLines' ? '2px solid #0b2b6d' : '2px solid transparent',
          cursor: 'pointer',
          fontSize: '16px',
          fontWeight: '500',
          borderRadius: '6px 6px 0 0'
        }}
      >
        {translations[language].shippingLinesTab}
      </button>
      <button 
        onClick={() => setActiveTab('transportCompanies')}
        style={{
          padding: '12px 24px',
          border: 'none',
          background: activeTab === 'transportCompanies' ? '#0b2b6d' : 'transparent',
          color: activeTab === 'transportCompanies' ? 'white' : '#6b7280',
          borderBottom: activeTab === 'transportCompanies' ? '2px solid #0b2b6d' : '2px solid transparent',
          cursor: 'pointer',
          fontSize: '16px',
          fontWeight: '500',
          borderRadius: '6px 6px 0 0'
        }}
      >
        {translations[language].transportCompaniesTab}
      </button>
    </div>
  );
};
