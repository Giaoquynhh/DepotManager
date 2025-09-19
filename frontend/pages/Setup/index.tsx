import React, { useState, useEffect } from 'react';
import { useTranslation } from '../../hooks/useTranslation';
import Header from '../../components/Header';
import Card from '../../components/Card';

// Import components
import { TabNavigation, SetupTab } from './components/TabNavigation';
import { ShippingLinesTable } from './components/ShippingLinesTable';
import { TransportCompaniesTable } from './components/TransportCompaniesTable';
import { ContainerTypesTable } from './components/ContainerTypesTable';
import { SetupHeader } from './components/SetupHeader';
import { SuccessMessage } from './components/SuccessMessage';
import { SetupModals } from './components/SetupModals';

// Import hooks and handlers
import { useSetupState } from './hooks/useSetupState';
import { createShippingLineHandlers } from './handlers/shippingLineHandlers';
import { createTransportCompanyHandlers } from './handlers/transportCompanyHandlers';
import { createContainerTypeHandlers } from './handlers/containerTypeHandlers';

// Import constants
import { translations } from './constants/translations';

export default function Setup() {
  const { t, currentLanguage } = useTranslation();
  const language = currentLanguage as 'vi' | 'en';
  const [activeTab, setActiveTab] = useState<SetupTab>('shippingLines');

  // Use custom hook for state management
  const {
    // Shipping Lines State
    shippingLines,
    setShippingLines,
    shippingLinesPagination,
    setShippingLinesPagination,
    showAddModal,
    setShowAddModal,
    showEditModal,
    setShowEditModal,
    showUploadModal,
    setShowUploadModal,
    editingShippingLine,
    setEditingShippingLine,
    shippingLineFormData,
    setShippingLineFormData,
    errorText,
    setErrorText,

    // Transport Companies State
    transportCompanies,
    setTransportCompanies,
    transportCompaniesPagination,
    setTransportCompaniesPagination,
    showAddTransportCompanyModal,
    setShowAddTransportCompanyModal,
    showEditTransportCompanyModal,
    setShowEditTransportCompanyModal,
    showUploadTransportCompanyModal,
    setShowUploadTransportCompanyModal,
    editingTransportCompany,
    setEditingTransportCompany,
    transportCompanyFormData,
    setTransportCompanyFormData,
    transportCompanyErrorText,
    setTransportCompanyErrorText,

    // Container Types State
    containerTypes,
    setContainerTypes,
    containerTypesPagination,
    setContainerTypesPagination,
    showAddContainerTypeModal,
    setShowAddContainerTypeModal,
    showEditContainerTypeModal,
    setShowEditContainerTypeModal,
    showUploadContainerTypeModal,
    setShowUploadContainerTypeModal,
    editingContainerType,
    setEditingContainerType,
    containerTypeFormData,
    setContainerTypeFormData,
    containerTypeErrorText,
    setContainerTypeErrorText,

    // Common State
    successMessage,
    setSuccessMessage
  } = useSetupState();

  // Create handlers
  const shippingLineHandlers = createShippingLineHandlers(
    setShippingLines,
    setShippingLinesPagination,
    setShowAddModal,
    setShowEditModal,
    setShowUploadModal,
    setEditingShippingLine,
    setShippingLineFormData,
    setErrorText,
    setSuccessMessage,
    shippingLines,
    shippingLinesPagination,
    language,
    translations
  );

  const transportCompanyHandlers = createTransportCompanyHandlers(
    setTransportCompanies,
    setTransportCompaniesPagination,
    setShowAddTransportCompanyModal,
    setShowEditTransportCompanyModal,
    setShowUploadTransportCompanyModal,
    setEditingTransportCompany,
    setTransportCompanyFormData,
    setTransportCompanyErrorText,
    setSuccessMessage,
    transportCompanies,
    transportCompaniesPagination,
    language,
    translations
  );

  const containerTypeHandlers = createContainerTypeHandlers(
    setContainerTypes,
    setContainerTypesPagination,
    setShowAddContainerTypeModal,
    setShowEditContainerTypeModal,
    setShowUploadContainerTypeModal,
    setEditingContainerType,
    setContainerTypeFormData,
    setContainerTypeErrorText,
    setSuccessMessage,
    containerTypes,
    containerTypesPagination,
    language,
    translations
  );

  // Load data from API
  useEffect(() => {
    shippingLineHandlers.loadShippingLines();
    transportCompanyHandlers.loadTransportCompanies();
    containerTypeHandlers.loadContainerTypes();
  }, []);

  // Modal cancel handlers
  const handleCancelAddModal = () => {
    setShowAddModal(false);
    setErrorText('');
  };

  const handleCancelEditModal = () => {
    setShowEditModal(false);
    setEditingShippingLine(null);
    setErrorText('');
  };

  const handleCancelUploadModal = () => {
    setShowUploadModal(false);
    setErrorText('');
  };

  const handleCancelAddTransportCompanyModal = () => {
    setShowAddTransportCompanyModal(false);
    setTransportCompanyErrorText('');
  };

  const handleCancelEditTransportCompanyModal = () => {
    setShowEditTransportCompanyModal(false);
    setEditingTransportCompany(null);
    setTransportCompanyErrorText('');
  };

  const handleCancelUploadTransportCompanyModal = () => {
    setShowUploadTransportCompanyModal(false);
    setTransportCompanyErrorText('');
  };

  const handleCancelAddContainerTypeModal = () => {
    setShowAddContainerTypeModal(false);
    setContainerTypeErrorText('');
  };

  const handleCancelEditContainerTypeModal = () => {
    setShowEditContainerTypeModal(false);
    setEditingContainerType(null);
    setContainerTypeErrorText('');
  };

  const handleCancelUploadContainerTypeModal = () => {
    setShowUploadContainerTypeModal(false);
    setContainerTypeErrorText('');
  };

  return (
    <>
      <Header />
      <main className="container">
        <div className="grid grid-cols-3" style={{gap: 20}}>
          <div style={{gridColumn: 'span 3'}}>
            <Card title={undefined as any}>
              {/* Tab Navigation */}
              <TabNavigation
                activeTab={activeTab}
                setActiveTab={setActiveTab}
                language={language}
                translations={translations}
              />
              
              {/* Header with buttons */}
              <SetupHeader
                activeTab={activeTab}
                language={language}
                translations={translations}
                onAddNewShippingLine={shippingLineHandlers.handleAddNewShippingLine}
                onUploadExcel={shippingLineHandlers.handleUploadExcel}
                onAddNewTransportCompany={transportCompanyHandlers.handleAddNewTransportCompany}
                onUploadTransportCompanyExcel={transportCompanyHandlers.handleUploadTransportCompanyExcel}
                onAddNewContainerType={containerTypeHandlers.handleAddNewContainerType}
                onUploadContainerTypeExcel={() => setShowUploadContainerTypeModal(true)}
              />

              {/* Success Message */}
              <SuccessMessage message={successMessage} />

              {/* Tables */}
              {activeTab === 'shippingLines' ? (
                <ShippingLinesTable
                  shippingLines={shippingLines}
                  pagination={shippingLinesPagination}
                  language={language}
                  translations={translations}
                  onEdit={shippingLineHandlers.handleEditShippingLine}
                  onDelete={shippingLineHandlers.handleDeleteShippingLine}
                  onPageChange={shippingLineHandlers.handlePageChange}
                />
              ) : activeTab === 'transportCompanies' ? (
                <TransportCompaniesTable
                  transportCompanies={transportCompanies}
                  pagination={transportCompaniesPagination}
                  language={language}
                  translations={translations}
                  onEdit={transportCompanyHandlers.handleEditTransportCompany}
                  onDelete={transportCompanyHandlers.handleDeleteTransportCompany}
                  onPageChange={transportCompanyHandlers.handlePageChange}
                />
              ) : (
                <ContainerTypesTable
                  containerTypes={containerTypes}
                  pagination={containerTypesPagination}
                  language={language}
                  translations={translations}
                  onEdit={containerTypeHandlers.handleEditContainerType}
                  onDelete={containerTypeHandlers.handleDeleteContainerType}
                  onPageChange={containerTypeHandlers.handlePageChange}
                />
              )}
            </Card>
          </div>
        </div>
      </main>

      {/* All Modals */}
      <SetupModals
        // Shipping Lines Modals
        showAddModal={showAddModal}
        showEditModal={showEditModal}
        showUploadModal={showUploadModal}
        editingShippingLine={editingShippingLine}
        shippingLineFormData={shippingLineFormData}
        setShippingLineFormData={setShippingLineFormData}
        errorText={errorText}
        
        // Transport Companies Modals
        showAddTransportCompanyModal={showAddTransportCompanyModal}
        showEditTransportCompanyModal={showEditTransportCompanyModal}
        showUploadTransportCompanyModal={showUploadTransportCompanyModal}
        editingTransportCompany={editingTransportCompany}
        transportCompanyFormData={transportCompanyFormData}
        setTransportCompanyFormData={setTransportCompanyFormData}
        transportCompanyErrorText={transportCompanyErrorText}
        
        // Container Types Modals
        showAddContainerTypeModal={showAddContainerTypeModal}
        showEditContainerTypeModal={showEditContainerTypeModal}
        showUploadContainerTypeModal={showUploadContainerTypeModal}
        editingContainerType={editingContainerType}
        containerTypeFormData={containerTypeFormData}
        setContainerTypeFormData={setContainerTypeFormData}
        containerTypeErrorText={containerTypeErrorText}
        
        // Handlers
        onCancelAddModal={handleCancelAddModal}
        onCancelEditModal={handleCancelEditModal}
        onCancelUploadModal={handleCancelUploadModal}
        onCancelAddTransportCompanyModal={handleCancelAddTransportCompanyModal}
        onCancelEditTransportCompanyModal={handleCancelEditTransportCompanyModal}
        onCancelUploadTransportCompanyModal={handleCancelUploadTransportCompanyModal}
        onCancelAddContainerTypeModal={handleCancelAddContainerTypeModal}
        onCancelEditContainerTypeModal={handleCancelEditContainerTypeModal}
        onCancelUploadContainerTypeModal={handleCancelUploadContainerTypeModal}
        onSubmitShippingLine={shippingLineHandlers.handleSubmitShippingLine}
        onUpdateShippingLine={(data) => shippingLineHandlers.handleUpdateShippingLine(data, editingShippingLine)}
        onFileUpload={shippingLineHandlers.handleFileUpload}
        onSubmitTransportCompany={transportCompanyHandlers.handleSubmitTransportCompany}
        onUpdateTransportCompany={(data) => transportCompanyHandlers.handleUpdateTransportCompany(data, editingTransportCompany)}
        onTransportCompanyFileUpload={transportCompanyHandlers.handleTransportCompanyFileUpload}
        onContainerTypeFileUpload={containerTypeHandlers.handleContainerTypeFileUpload}
        onSubmitContainerType={containerTypeHandlers.handleSubmitContainerType}
        onUpdateContainerType={(data) => containerTypeHandlers.handleUpdateContainerType(data, editingContainerType)}
        
        // Common
        language={language}
        translations={translations}
      />
    </>
  );
}
