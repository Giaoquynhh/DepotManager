import React, { useState, useEffect } from 'react';
import { useTranslation } from '../../hooks/useTranslation';
import Header from '../../components/Header';
import Card from '../../components/Card';

// Import components
import { ShippingLinesTable } from './components/ShippingLinesTable';
import { SetupHeader } from './components/SetupHeader';
import { SuccessMessage } from './components/SuccessMessage';
import { SetupModals } from './components/SetupModals';
import { ConfirmDeleteModal } from './components/ConfirmDeleteModal';
import { EditShippingLineModal } from './components/EditShippingLineModal';

// Import hooks and handlers
import { useSetupState } from './hooks/useSetupState';
import { createShippingLineHandlers } from './handlers/shippingLineHandlers';

// Import constants
import { translations } from './constants/translations';

export default function ShippingLines() {
  const { t, currentLanguage } = useTranslation();
  const language = currentLanguage as 'vi' | 'en';

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
    setShowDeleteModal,
    setDeletingItem,
    setIsDeleting,
    shippingLines,
    shippingLinesPagination,
    language,
    translations
  );

  // Load data on component mount
  useEffect(() => {
    shippingLineHandlers.loadShippingLines(1, 14);
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
                activeTab="shippingLines"
                language={language}
                translations={translations}
                onAddNewShippingLine={shippingLineHandlers.handleAddNewShippingLine}
                onUploadExcel={shippingLineHandlers.handleUploadExcel}
                onAddNewTransportCompany={() => {}}
                onUploadTransportCompanyExcel={() => {}}
                onAddNewContainerType={() => {}}
                onUploadContainerTypeExcel={() => {}}
              />

              {/* Success Message */}
              <SuccessMessage message={successMessage} />

              {/* Shipping Lines Table */}
              <ShippingLinesTable
                shippingLines={shippingLines}
                pagination={shippingLinesPagination}
                onPageChange={shippingLineHandlers.handlePageChange}
                onEdit={shippingLineHandlers.handleEditShippingLine}
                onDelete={shippingLineHandlers.handleDeleteShippingLine}
                language={language}
                translations={translations}
              />
            </Card>
          </div>
        </div>
      </main>

      {/* Modals */}
      <SetupModals
        // Shipping Lines Modals
        showAddModal={showAddModal}
        showEditModal={showEditModal}
        showUploadModal={showUploadModal}
        editingShippingLine={editingShippingLine}
        shippingLineFormData={shippingLineFormData}
        setShippingLineFormData={setShippingLineFormData}
        errorText={errorText}
        
        // Transport Companies Modals (default values)
        showAddTransportCompanyModal={false}
        showEditTransportCompanyModal={false}
        showUploadTransportCompanyModal={false}
        editingTransportCompany={null}
        transportCompanyFormData={{ code: '', name: '', address: '', mst: '', phone: '', note: '' }}
        setTransportCompanyFormData={() => {}}
        transportCompanyErrorText=""
        
        // Container Types Modals (default values)
        showAddContainerTypeModal={false}
        showEditContainerTypeModal={false}
        showUploadContainerTypeModal={false}
        editingContainerType={null}
        containerTypeFormData={{ code: '', description: '', note: '' }}
        setContainerTypeFormData={() => {}}
        containerTypeErrorText=""
        
        // Handlers
        onCancelAddModal={() => setShowAddModal(false)}
        onCancelEditModal={() => setShowEditModal(false)}
        onCancelUploadModal={() => setShowUploadModal(false)}
        onCancelAddTransportCompanyModal={() => {}}
        onCancelEditTransportCompanyModal={() => {}}
        onCancelUploadTransportCompanyModal={() => {}}
        onCancelAddContainerTypeModal={() => {}}
        onCancelEditContainerTypeModal={() => {}}
        onCancelUploadContainerTypeModal={() => {}}
        onSubmitShippingLine={shippingLineHandlers.handleSubmitShippingLine}
        onUpdateShippingLine={(data) => shippingLineHandlers.handleUpdateShippingLine(data, editingShippingLine)}
        onFileUpload={(files) => shippingLineHandlers.handleFileUpload(files)}
        onSubmitTransportCompany={() => {}}
        onUpdateTransportCompany={() => {}}
        onTransportCompanyFileUpload={() => {}}
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
        onConfirm={() => shippingLineHandlers.confirmDeleteShippingLine(deletingItem)}
        title="Xác nhận xóa hãng tàu"
        message="Bạn có chắc chắn muốn xóa hãng tàu này không?"
        itemName={deletingItem?.name || ''}
        isDeleting={isDeleting}
      />

      <EditShippingLineModal
        visible={showEditModal}
        onCancel={() => {
          setShowEditModal(false);
          setEditingShippingLine(null);
          setErrorText('');
        }}
        onSubmit={(data) => shippingLineHandlers.handleUpdateShippingLine(data, editingShippingLine)}
        shippingLine={editingShippingLine}
        formData={shippingLineFormData}
        setFormData={setShippingLineFormData}
        errorText={errorText}
        language={language}
        translations={translations}
      />
    </>
  );
}
