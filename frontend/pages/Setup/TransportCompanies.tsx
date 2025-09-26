import React, { useState, useEffect } from 'react';
import { useTranslation } from '../../hooks/useTranslation';
import Header from '../../components/Header';
import Card from '../../components/Card';

// Import components
import { TransportCompaniesTable } from './components/TransportCompaniesTable';
import { SetupHeader } from './components/SetupHeader';
import { SuccessMessage } from './components/SuccessMessage';
import { SetupModals } from './components/SetupModals';
import { ConfirmDeleteModal } from './components/ConfirmDeleteModal';
import { EditTransportCompanyModal } from './components/EditTransportCompanyModal';

// Import hooks and handlers
import { useSetupState } from './hooks/useSetupState';
import { createTransportCompanyHandlers } from './handlers/transportCompanyHandlers';

// Import constants
import { translations } from './constants/translations';

export default function TransportCompanies() {
  const { t, currentLanguage } = useTranslation();
  const language = currentLanguage as 'vi' | 'en';

  // Use custom hook for state management
  const {
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

    // Delete Modal States
    showDeleteModal,
    setShowDeleteModal,
    deletingItem,
    setDeletingItem,
    isDeleting,
    setIsDeleting,

    // Common State
    successMessage,
    setSuccessMessage
  } = useSetupState();

  // Create handlers
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
    setShowDeleteModal,
    setDeletingItem,
    setIsDeleting,
    transportCompanies,
    transportCompaniesPagination,
    language,
    translations
  );

  // Load data on component mount
  useEffect(() => {
    transportCompanyHandlers.loadTransportCompanies(1, 14);
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
                activeTab="transportCompanies"
                language={language}
                translations={translations}
                onAddNewShippingLine={() => {}}
                onUploadExcel={() => {}}
                onAddNewTransportCompany={transportCompanyHandlers.handleAddNewTransportCompany}
                onUploadTransportCompanyExcel={transportCompanyHandlers.handleUploadTransportCompanyExcel}
                onAddNewContainerType={() => {}}
                onUploadContainerTypeExcel={() => {}}
              />

              {/* Success Message */}
              <SuccessMessage message={successMessage} />

              {/* Transport Companies Table */}
              <TransportCompaniesTable
                transportCompanies={transportCompanies}
                pagination={transportCompaniesPagination}
                onPageChange={transportCompanyHandlers.handlePageChange}
                onEdit={transportCompanyHandlers.handleEditTransportCompany}
                onDelete={transportCompanyHandlers.handleDeleteTransportCompany}
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
        
        // Transport Companies Modals
        showAddTransportCompanyModal={showAddTransportCompanyModal}
        showEditTransportCompanyModal={showEditTransportCompanyModal}
        showUploadTransportCompanyModal={showUploadTransportCompanyModal}
        editingTransportCompany={editingTransportCompany}
        transportCompanyFormData={transportCompanyFormData}
        setTransportCompanyFormData={setTransportCompanyFormData}
        transportCompanyErrorText={transportCompanyErrorText}
        
        // Container Types Modals (default values)
        showAddContainerTypeModal={false}
        showEditContainerTypeModal={false}
        editingContainerType={null}
        containerTypeFormData={{ code: '', description: '', note: '' }}
        setContainerTypeFormData={() => {}}
        containerTypeErrorText=""
        
        // Handlers
        onCancelAddModal={() => {}}
        onCancelEditModal={() => {}}
        onCancelUploadModal={() => {}}
        onCancelAddTransportCompanyModal={() => setShowAddTransportCompanyModal(false)}
        onCancelEditTransportCompanyModal={() => setShowEditTransportCompanyModal(false)}
        onCancelUploadTransportCompanyModal={() => setShowUploadTransportCompanyModal(false)}
        onCancelAddContainerTypeModal={() => {}}
        onCancelEditContainerTypeModal={() => {}}
        onCancelUploadContainerTypeModal={() => {}}
        onSubmitShippingLine={() => {}}
        onUpdateShippingLine={() => {}}
        onFileUpload={() => {}}
        onSubmitTransportCompany={transportCompanyHandlers.handleSubmitTransportCompany}
        onUpdateTransportCompany={(data) => transportCompanyHandlers.handleUpdateTransportCompany(data, editingTransportCompany)}
        onTransportCompanyFileUpload={(files) => transportCompanyHandlers.handleTransportCompanyFileUpload(files)}
        onSubmitContainerType={() => {}}
        onUpdateContainerType={() => {}}
        onContainerTypeFileUpload={() => {}}
        
        // Common
        language={language}
        translations={translations}
      />

      <ConfirmDeleteModal
        visible={showDeleteModal}
        onCancel={() => {
          setShowDeleteModal(false);
          setDeletingItem(null);
        }}
        onConfirm={() => transportCompanyHandlers.confirmDeleteTransportCompany(deletingItem)}
        title="Xác nhận xóa nhà xe"
        message="Bạn có chắc chắn muốn xóa nhà xe này không?"
        itemName={deletingItem?.name || ''}
        isDeleting={isDeleting}
      />

      <EditTransportCompanyModal
        visible={showEditTransportCompanyModal}
        onCancel={() => {
          setShowEditTransportCompanyModal(false);
          setEditingTransportCompany(null);
          setTransportCompanyErrorText('');
        }}
        onSubmit={(data) => transportCompanyHandlers.handleUpdateTransportCompany(data, editingTransportCompany)}
        transportCompany={editingTransportCompany}
        formData={transportCompanyFormData}
        setFormData={setTransportCompanyFormData}
        errorText={transportCompanyErrorText}
        language={language}
        translations={translations}
      />
    </>
  );
}
