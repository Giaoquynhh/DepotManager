import React from 'react';
import { ShippingLine, TransportCompany } from '../../../services/setupService';
import { ShippingLineFormData } from './AddShippingLineModal';
import { TransportCompanyFormData } from './AddTransportCompanyModal';
import { AddShippingLineModal } from './AddShippingLineModal';
import { EditShippingLineModal } from './EditShippingLineModal';
import { UploadExcelModal } from './UploadExcelModal';
import { AddTransportCompanyModal } from './AddTransportCompanyModal';
import { EditTransportCompanyModal } from './EditTransportCompanyModal';
import { UploadTransportCompanyExcelModal } from './UploadTransportCompanyExcelModal';

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
  editingTransportCompany: TransportCompany | null;
  transportCompanyFormData: TransportCompanyFormData;
  setTransportCompanyFormData: React.Dispatch<React.SetStateAction<TransportCompanyFormData>>;
  transportCompanyErrorText: string;
  
  // Handlers
  onCancelAddModal: () => void;
  onCancelEditModal: () => void;
  onCancelUploadModal: () => void;
  onCancelAddTransportCompanyModal: () => void;
  onCancelEditTransportCompanyModal: () => void;
  onCancelUploadTransportCompanyModal: () => void;
  onSubmitShippingLine: (data: ShippingLineFormData) => void;
  onUpdateShippingLine: (data: ShippingLineFormData) => void;
  onFileUpload: (file: File) => void;
  onSubmitTransportCompany: (data: TransportCompanyFormData) => void;
  onUpdateTransportCompany: (data: TransportCompanyFormData) => void;
  onTransportCompanyFileUpload: (file: File) => void;
  
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
  editingTransportCompany,
  transportCompanyFormData,
  setTransportCompanyFormData,
  transportCompanyErrorText,
  
  // Handlers
  onCancelAddModal,
  onCancelEditModal,
  onCancelUploadModal,
  onCancelAddTransportCompanyModal,
  onCancelEditTransportCompanyModal,
  onCancelUploadTransportCompanyModal,
  onSubmitShippingLine,
  onUpdateShippingLine,
  onFileUpload,
  onSubmitTransportCompany,
  onUpdateTransportCompany,
  onTransportCompanyFileUpload,
  
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
    </>
  );
};
