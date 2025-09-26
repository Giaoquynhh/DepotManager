import React from 'react';
import { SetupTab } from './TabNavigation';

interface SetupHeaderProps {
  activeTab: SetupTab;
  language: 'vi' | 'en';
  translations: any;
  onAddNewShippingLine: () => void;
  onUploadExcel: () => void;
  onAddNewTransportCompany: () => void;
  onUploadTransportCompanyExcel: () => void;
  onAddNewContainerType: () => void;
  onUploadContainerTypeExcel: () => void;
  onAddNewCustomer?: () => void;
  onUploadCustomerExcel?: () => void;
  onAddNewPriceList?: () => void;
  onUploadPriceListExcel?: () => void;
}

export const SetupHeader: React.FC<SetupHeaderProps> = ({
  activeTab,
  language,
  translations,
  onAddNewShippingLine,
  onUploadExcel,
  onAddNewTransportCompany,
  onUploadTransportCompanyExcel,
  onAddNewContainerType,
  onUploadContainerTypeExcel,
  onAddNewCustomer,
  onUploadCustomerExcel,
  onAddNewPriceList,
  onUploadPriceListExcel
}) => {
  return (
    <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12}}>
      <h3 style={{margin:0, fontSize:18, fontWeight:700, color:'#0b2b6d'}}>
        {activeTab === 'shippingLines' ? translations[language].shippingLinesList : 
         activeTab === 'transportCompanies' ? translations[language].transportCompaniesList :
         activeTab === 'containerTypes' ? translations[language].containerTypesList :
         activeTab === 'customers' ? 'Danh sách khách hàng' :
         activeTab === 'priceLists' ? translations[language].priceListsList :
         translations[language].containerTypesList}
      </h3>
      {activeTab === 'shippingLines' && (
        <div style={{display:'flex', gap:8}}>
          <button 
            className="btn" 
            onClick={onAddNewShippingLine}
            style={{background:'#059669', color:'#fff'}}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{marginRight: '8px'}}>
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
            {translations[language].addNew}
          </button>
          <button
            className="btn btn-outline"
            onClick={onUploadExcel}
            style={{color: '#7c3aed', borderColor: '#7c3aed', backgroundColor: '#f3f4f6'}}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{marginRight: '8px'}}>
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
              <polyline points="14,2 14,8 20,8"></polyline>
              <line x1="16" y1="13" x2="8" y2="13"></line>
              <line x1="16" y1="17" x2="8" y2="17"></line>
              <polyline points="10,9 9,9 8,9"></polyline>
            </svg>
            {translations[language].uploadExcel}
          </button>
        </div>
      )}
      {activeTab === 'transportCompanies' && (
        <div style={{display:'flex', gap:8}}>
          <button 
            className="btn" 
            onClick={onAddNewTransportCompany}
            style={{background:'#059669', color:'#fff'}}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{marginRight: '8px'}}>
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
            {translations[language].addNew}
          </button>
          <button
            className="btn btn-outline"
            onClick={onUploadTransportCompanyExcel}
            style={{color: '#7c3aed', borderColor: '#7c3aed', backgroundColor: '#f3f4f6'}}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{marginRight: '8px'}}>
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
              <polyline points="14,2 14,8 20,8"></polyline>
              <line x1="16" y1="13" x2="8" y2="13"></line>
              <line x1="16" y1="17" x2="8" y2="17"></line>
              <polyline points="10,9 9,9 8,9"></polyline>
            </svg>
            {translations[language].uploadExcel}
          </button>
        </div>
      )}
      {activeTab === 'containerTypes' && (
        <div style={{display:'flex', gap:8}}>
          <button 
            className="btn" 
            onClick={onAddNewContainerType}
            style={{background:'#059669', color:'#fff'}}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{marginRight: '8px'}}>
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
            {translations[language].addNew}
          </button>
          <button
            className="btn btn-outline"
            onClick={onUploadContainerTypeExcel}
            style={{color: '#7c3aed', borderColor: '#7c3aed', backgroundColor: '#f3f4f6'}}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{marginRight: '8px'}}>
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
              <polyline points="14,2 14,8 20,8"></polyline>
              <line x1="16" y1="13" x2="8" y2="13"></line>
              <line x1="16" y1="17" x2="8" y2="17"></line>
              <polyline points="10,9 9,9 8,9"></polyline>
            </svg>
            {translations[language].uploadExcel}
          </button>
        </div>
      )}
      {activeTab === 'customers' && onAddNewCustomer && onUploadCustomerExcel && (
        <div style={{display:'flex', gap:8}}>
          <button 
            className="btn" 
            onClick={onAddNewCustomer}
            style={{background:'#059669', color:'#fff'}}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{marginRight: '8px'}}>
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
            Thêm mới
          </button>
          <button
            className="btn btn-outline"
            onClick={onUploadCustomerExcel}
            style={{color: '#7c3aed', borderColor: '#7c3aed', backgroundColor: '#f3f4f6'}}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{marginRight: '8px'}}>
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
              <polyline points="14,2 14,8 20,8"></polyline>
              <line x1="16" y1="13" x2="8" y2="13"></line>
              <line x1="16" y1="17" x2="8" y2="17"></line>
              <polyline points="10,9 9,9 8,9"></polyline>
            </svg>
            Upload Excel
          </button>
        </div>
      )}
      {activeTab === 'priceLists' && onAddNewPriceList && (
        <div style={{display:'flex', gap:8}}>
          <button 
            className="btn" 
            onClick={onAddNewPriceList}
            style={{background:'#059669', color:'#fff'}}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{marginRight: '8px'}}>
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
            {translations[language].addNew}
          </button>
          {onUploadPriceListExcel && (
            <button
              className="btn btn-outline"
              onClick={onUploadPriceListExcel}
              style={{color: '#7c3aed', borderColor: '#7c3aed', backgroundColor: '#f3f4f6'}}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{marginRight: '8px'}}>
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                <polyline points="14,2 14,8 20,8"></polyline>
                <line x1="16" y1="13" x2="8" y2="13"></line>
                <line x1="16" y1="17" x2="8" y2="17"></line>
                <polyline points="10,9 9,9 8,9"></polyline>
              </svg>
              {translations[language].uploadExcel}
            </button>
          )}
        </div>
      )}
    </div>
  );
};
