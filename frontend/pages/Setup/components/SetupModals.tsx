import React from 'react';
import { ShippingLine, TransportCompany, ContainerType } from '../../../services/setupService';
import { ShippingLineFormData } from './AddShippingLineModal';
import { TransportCompanyFormData } from './AddTransportCompanyModal';
import { ContainerTypeFormData } from './AddContainerTypeModal';
import { AddShippingLineModal } from './AddShippingLineModal';
import { EditShippingLineModal } from './EditShippingLineModal';
import { UploadExcelModal } from './UploadExcelModal';
import { AddTransportCompanyModal } from './AddTransportCompanyModal';
import { EditTransportCompanyModal } from './EditTransportCompanyModal';
import { UploadTransportCompanyExcelModal } from './UploadTransportCompanyExcelModal';
import { UploadContainerTypeExcelModal } from './UploadContainerTypeExcelModal';
import { AddContainerTypeModal } from './AddContainerTypeModal';
import { EditContainerTypeModal } from './EditContainerTypeModal';

interface SetupModalsProps {
  // Shipping Lines Modals
  showAddModal: boolean;
  showEditModal: boolean;
  showUploadModal: boolean;
  editingShippingLine: ShippingLine | null;
  shippingLineFormData: ShippingLineFormData;
  setShippingLineFormData: React.Dispatch<React.SetStateAction<ShippingLineFormData>>;
  errorText: string;
  
  // Transport Companies Modals
  showAddTransportCompanyModal: boolean;
  showEditTransportCompanyModal: boolean;
  showUploadTransportCompanyModal: boolean;
  showUploadContainerTypeModal?: boolean;
  editingTransportCompany: TransportCompany | null;
  transportCompanyFormData: TransportCompanyFormData;
  setTransportCompanyFormData: React.Dispatch<React.SetStateAction<TransportCompanyFormData>>;
  transportCompanyErrorText: string;
  
  // Container Types Modals
  showAddContainerTypeModal: boolean;
  showEditContainerTypeModal: boolean;
  editingContainerType: ContainerType | null;
  containerTypeFormData: ContainerTypeFormData;
  setContainerTypeFormData: React.Dispatch<React.SetStateAction<ContainerTypeFormData>>;
  containerTypeErrorText: string;
  
  // Handlers
  onCancelAddModal: () => void;
  onCancelEditModal: () => void;
  onCancelUploadModal: () => void;
  onCancelAddTransportCompanyModal: () => void;
  onCancelEditTransportCompanyModal: () => void;
  onCancelUploadTransportCompanyModal: () => void;
  onCancelUploadContainerTypeModal?: () => void;
  onCancelAddContainerTypeModal: () => void;
  onCancelEditContainerTypeModal: () => void;
  onSubmitShippingLine: (data: ShippingLineFormData) => void;
  onUpdateShippingLine: (data: ShippingLineFormData) => void;
  onFileUpload: (file: File) => void;
  onSubmitTransportCompany: (data: TransportCompanyFormData) => void;
  onUpdateTransportCompany: (data: TransportCompanyFormData) => void;
  onTransportCompanyFileUpload: (file: File) => void;
  onContainerTypeFileUpload?: (file: File) => void;
  onSubmitContainerType: (data: ContainerTypeFormData) => void;
  onUpdateContainerType: (data: ContainerTypeFormData) => void;
  
  // Common
  language: 'vi' | 'en';
  translations: any;
}

export const SetupModals: React.FC<SetupModalsProps> = ({
  // Shipping Lines Modals
  showAddModal,
  showEditModal,
  showUploadModal,
  editingShippingLine,
  shippingLineFormData,
  setShippingLineFormData,
  errorText,
  
  // Transport Companies Modals
  showAddTransportCompanyModal,
  showEditTransportCompanyModal,
  showUploadTransportCompanyModal,
  showUploadContainerTypeModal,
  editingTransportCompany,
  transportCompanyFormData,
  setTransportCompanyFormData,
  transportCompanyErrorText,
  
  // Container Types Modals
  showAddContainerTypeModal,
  showEditContainerTypeModal,
  editingContainerType,
  containerTypeFormData,
  setContainerTypeFormData,
  containerTypeErrorText,
  
  // Handlers
  onCancelAddModal,
  onCancelEditModal,
  onCancelUploadModal,
  onCancelAddTransportCompanyModal,
  onCancelEditTransportCompanyModal,
  onCancelUploadTransportCompanyModal,
  onCancelUploadContainerTypeModal,
  onCancelAddContainerTypeModal,
  onCancelEditContainerTypeModal,
  onSubmitShippingLine,
  onUpdateShippingLine,
  onFileUpload,
  onSubmitTransportCompany,
  onUpdateTransportCompany,
  onTransportCompanyFileUpload,
  onContainerTypeFileUpload,
  onSubmitContainerType,
  onUpdateContainerType,
  
  // Common
  language,
  translations
}) => {
  return (
    <>
      {/* Add Shipping Line Modal */}
      <AddShippingLineModal
        visible={showAddModal}
        onCancel={onCancelAddModal}
        onSubmit={onSubmitShippingLine}
        formData={shippingLineFormData}
        setFormData={setShippingLineFormData}
        errorText={errorText}
        language={language}
        translations={translations}
      />

      {/* Edit Shipping Line Modal */}
      <EditShippingLineModal
        visible={showEditModal}
        onCancel={onCancelEditModal}
        onSubmit={onUpdateShippingLine}
        formData={shippingLineFormData}
        setFormData={setShippingLineFormData}
        errorText={errorText}
        language={language}
        translations={translations}
        originalCode={editingShippingLine?.code || ''}
      />

      {/* Upload Excel Modal */}
      <UploadExcelModal
        visible={showUploadModal}
        onCancel={onCancelUploadModal}
        onUpload={onFileUpload}
        language={language}
        translations={translations}
      />

      {/* Edit Transport Company Modal */}
      <EditTransportCompanyModal
        visible={showEditTransportCompanyModal}
        onCancel={onCancelEditTransportCompanyModal}
        onSubmit={onUpdateTransportCompany}
        formData={transportCompanyFormData}
        setFormData={setTransportCompanyFormData}
        errorText={transportCompanyErrorText}
        language={language}
        translations={translations}
        originalCode={editingTransportCompany?.code || ''}
      />

      {/* Add Transport Company Modal */}
      <AddTransportCompanyModal
        visible={showAddTransportCompanyModal}
        onCancel={onCancelAddTransportCompanyModal}
        onSubmit={onSubmitTransportCompany}
        formData={transportCompanyFormData}
        setFormData={setTransportCompanyFormData}
        errorText={transportCompanyErrorText}
        language={language}
        translations={translations}
      />

      {/* Upload Transport Company Excel Modal */}
      <UploadTransportCompanyExcelModal
        visible={showUploadTransportCompanyModal}
        onCancel={onCancelUploadTransportCompanyModal}
        onUpload={onTransportCompanyFileUpload}
        language={language}
        translations={translations}
      />

      {/* Upload Container Type Excel Modal */}
      <UploadContainerTypeExcelModal
        visible={!!showUploadContainerTypeModal}
        onCancel={onCancelUploadContainerTypeModal || (() => {})}
        onUpload={onContainerTypeFileUpload || (() => {})}
        language={language}
        translations={translations}
      />

      {/* Add Container Type Modal */}
      <AddContainerTypeModal
        visible={showAddContainerTypeModal}
        onCancel={onCancelAddContainerTypeModal}
        onSubmit={onSubmitContainerType}
        formData={containerTypeFormData}
        setFormData={setContainerTypeFormData}
        errorText={containerTypeErrorText}
        language={language}
        translations={translations}
      />

      {/* Edit Container Type Modal */}
      <EditContainerTypeModal
        visible={showEditContainerTypeModal}
        onCancel={onCancelEditContainerTypeModal}
        onSubmit={onUpdateContainerType}
        formData={containerTypeFormData}
        setFormData={setContainerTypeFormData}
        errorText={containerTypeErrorText}
        language={language}
        translations={translations}
        originalCode={editingContainerType?.code || ''}
      />
    </>
  );
};
