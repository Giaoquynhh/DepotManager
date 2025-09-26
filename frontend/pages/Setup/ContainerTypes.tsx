import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from '../../hooks/useTranslation';
import Header from '../../components/Header';
import Card from '../../components/Card';

// Import components
import { ContainerTypesTable } from './components/ContainerTypesTable';
import { SetupHeader } from './components/SetupHeader';
import { SuccessMessage } from './components/SuccessMessage';
import { SetupModals } from './components/SetupModals';
import { ConfirmDeleteModal } from './components/ConfirmDeleteModal';

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
    setShowDeleteModal,
    setDeletingItem,
    setIsDeleting,
    containerTypes,
    containerTypesPagination,
    language,
    translations
  );

  // File input ref for direct Excel upload (no modal)
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleOpenExcelPicker = () => {
    setShowUploadContainerTypeModal(true);
  };

  const handleExcelSelected: React.ChangeEventHandler<HTMLInputElement> = async (e) => {
    const files = e.target.files ? Array.from(e.target.files) : [];
    if (!files.length) return;
    await containerTypeHandlers.handleContainerTypeFileUpload(files);
  };

  // Load data on component mount
  useEffect(() => {
    containerTypeHandlers.loadContainerTypes(1, 14);
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
                onUploadContainerTypeExcel={handleOpenExcelPicker}
              />

              {/* Hidden file input for Excel upload */}
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls"
                style={{ display: 'none' }}
                onChange={handleExcelSelected}
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
        onContainerTypeFileUpload={containerTypeHandlers.handleContainerTypeFileUpload}
        
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
        onConfirm={() => containerTypeHandlers.confirmDeleteContainerType(deletingItem)}
        title="Xác nhận xóa loại container"
        message="Bạn có chắc chắn muốn xóa loại container này không?"
        itemName={deletingItem?.code || ''}
        isDeleting={isDeleting}
      />
    </>
  );
}
