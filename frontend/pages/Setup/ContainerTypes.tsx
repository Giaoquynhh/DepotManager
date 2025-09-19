import React, { useState, useEffect } from 'react';
import { useTranslation } from '../../hooks/useTranslation';
import Header from '../../components/Header';
import Card from '../../components/Card';

// Import components
import { ContainerTypesTable } from './components/ContainerTypesTable';
import { SetupHeader } from './components/SetupHeader';
import { SuccessMessage } from './components/SuccessMessage';
import { SetupModals } from './components/SetupModals';

// Import hooks and handlers
import { useSetupState } from './hooks/useSetupState';
import { createContainerTypeHandlers } from './handlers/containerTypeHandlers';

// Import constants
import { translations } from './constants/translations';

export default function ContainerTypes() {
  const { t, currentLanguage } = useTranslation();
  const language = currentLanguage as 'vi' | 'en';

  // Use custom hook for state management
  const {
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

  // Load data on component mount
  useEffect(() => {
    containerTypeHandlers.loadContainerTypes();
  }, []);

  return (
    <>
      <Header />
      <main className="container">
        <div className="grid grid-cols-3" style={{gap: 20}}>
          <div style={{gridColumn: 'span 3'}}>
            <Card title={undefined as any}>
              {/* Header with buttons */}
              <SetupHeader
                activeTab="containerTypes"
                language={language}
                translations={translations}
                onAddNewShippingLine={() => {}}
                onUploadExcel={() => {}}
                onAddNewTransportCompany={() => {}}
                onUploadTransportCompanyExcel={() => {}}
                onAddNewContainerType={containerTypeHandlers.handleAddNewContainerType}
                onUploadContainerTypeExcel={() => setShowUploadContainerTypeModal(true)}
              />

              {/* Success Message */}
              <SuccessMessage message={successMessage} />

              {/* Container Types Table */}
              <ContainerTypesTable
                containerTypes={containerTypes}
                pagination={containerTypesPagination}
                onPageChange={containerTypeHandlers.handlePageChange}
                onEdit={containerTypeHandlers.handleEditContainerType}
                onDelete={containerTypeHandlers.handleDeleteContainerType}
                language={language}
                translations={translations}
              />
            </Card>
          </div>
        </div>
      </main>

      {/* Modals */}
      <SetupModals
        // Shipping Lines Modals (default values)
        showAddModal={false}
        showEditModal={false}
        showUploadModal={false}
        editingShippingLine={null}
        shippingLineFormData={{ code: '', name: '', eir: '', note: '' }}
        setShippingLineFormData={() => {}}
        errorText=""
        
        // Transport Companies Modals (default values)
        showAddTransportCompanyModal={false}
        showEditTransportCompanyModal={false}
        showUploadTransportCompanyModal={false}
        editingTransportCompany={null}
        transportCompanyFormData={{ code: '', name: '', address: '', mst: '', phone: '', note: '' }}
        setTransportCompanyFormData={() => {}}
        transportCompanyErrorText=""
        
        // Container Types Modals
        showAddContainerTypeModal={showAddContainerTypeModal}
        showEditContainerTypeModal={showEditContainerTypeModal}
        showUploadContainerTypeModal={showUploadContainerTypeModal}
        editingContainerType={editingContainerType}
        containerTypeFormData={containerTypeFormData}
        setContainerTypeFormData={setContainerTypeFormData}
        containerTypeErrorText={containerTypeErrorText}
        
        // Handlers
        onCancelAddModal={() => {}}
        onCancelEditModal={() => {}}
        onCancelUploadModal={() => {}}
        onCancelAddTransportCompanyModal={() => {}}
        onCancelEditTransportCompanyModal={() => {}}
        onCancelUploadTransportCompanyModal={() => {}}
        onCancelAddContainerTypeModal={() => setShowAddContainerTypeModal(false)}
        onCancelEditContainerTypeModal={() => setShowEditContainerTypeModal(false)}
        onCancelUploadContainerTypeModal={() => setShowUploadContainerTypeModal(false)}
        onSubmitShippingLine={() => {}}
        onUpdateShippingLine={() => {}}
        onFileUpload={() => {}}
        onSubmitTransportCompany={() => {}}
        onUpdateTransportCompany={() => {}}
        onTransportCompanyFileUpload={() => {}}
        onSubmitContainerType={containerTypeHandlers.handleSubmitContainerType}
        onUpdateContainerType={(data) => containerTypeHandlers.handleUpdateContainerType(data, editingContainerType)}
        onContainerTypeFileUpload={(file) => containerTypeHandlers.handleContainerTypeFileUpload([file])}
        
        // Common
        language={language}
        translations={translations}
      />
    </>
  );
}
