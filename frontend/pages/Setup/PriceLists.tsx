import React, { useState, useEffect } from 'react';
import { useTranslation } from '../../hooks/useTranslation';
import Header from '../../components/Header';
import Card from '../../components/Card';
import { formatNumberWithDots } from '../../utils/numberFormat';

// Import components
import { PriceListsTable } from './components/PriceListsTable';
import { SetupHeader } from './components/SetupHeader';
import { SuccessMessage } from './components/SuccessMessage';
import { AddPriceListModal } from './components/AddPriceListModal';
import { EditPriceListModal } from './components/EditPriceListModal';
import { UploadExcelModal } from './components/UploadExcelModal';
import { ConfirmDeleteModal } from './components/ConfirmDeleteModal';

// Import service
import { setupService, PriceList } from '../../services/setupService';

// Import constants
import { translations } from './constants/translations';

export default function PriceLists() {
  const { t, currentLanguage } = useTranslation();
  const language = currentLanguage as 'vi' | 'en';

  // State management
  const [priceLists, setPriceLists] = useState<PriceList[]>([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 14,
    total: 0,
    totalPages: 0
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);

  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editingPriceList, setEditingPriceList] = useState<PriceList | null>(null);
  const [deletingPriceList, setDeletingPriceList] = useState<PriceList | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Form data
  const [formData, setFormData] = useState({
    serviceCode: '',
    serviceName: '',
    type: '',
    price: '',
    note: ''
  });

  // Error and success messages
  const [errorText, setErrorText] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Load price lists
  const loadPriceLists = async (page = 1, search = '') => {
    try {
      setLoading(true);
      const response = await setupService.getPriceLists({
        page,
        limit: 14,
        search
      });

      if (response.success && response.data) {
        setPriceLists(response.data.data);
        setPagination(response.data.pagination);
      } else {
        setErrorText(response.message || 'Failed to load price lists');
      }
    } catch (error) {
      console.error('Error loading price lists:', error);
      setErrorText('Failed to load price lists');
    } finally {
      setLoading(false);
    }
  };

  // Load data on component mount
  useEffect(() => {
    loadPriceLists(1, '');
  }, []);

  // Handle search
  const handleSearch = (search: string) => {
    setSearchTerm(search);
    loadPriceLists(1, search);
  };

  // Handle page change
  const handlePageChange = (page: number) => {
    loadPriceLists(page, searchTerm);
  };

  // Handle add new price list
  const handleAddNewPriceList = () => {
    setFormData({
      serviceCode: '',
      serviceName: '',
      type: '',
      price: '',
      note: ''
    });
    setErrorText('');
    setShowAddModal(true);
  };

  // Handle edit price list
  const handleEditPriceList = (priceList: PriceList) => {
    setFormData({
      serviceCode: priceList.serviceCode,
      serviceName: priceList.serviceName,
      type: priceList.type,
      price: formatNumberWithDots(priceList.price),
      note: priceList.note || ''
    });
    setEditingPriceList(priceList);
    setErrorText('');
    setShowEditModal(true);
  };

  // Handle delete price list - show confirmation modal
  const handleDeletePriceList = (id: string) => {
    const priceListToDelete = priceLists.find(pl => pl.id === id);
    if (priceListToDelete) {
      setDeletingPriceList(priceListToDelete);
      setShowDeleteModal(true);
    }
  };

  // Confirm delete price list
  const confirmDeletePriceList = async () => {
    if (!deletingPriceList) return;

    setIsDeleting(true);
    try {
      const response = await setupService.deletePriceList(deletingPriceList.id);
      if (response.success) {
        setSuccessMessage(`Đã xóa bảng giá "${deletingPriceList.serviceName}" thành công!`);
        loadPriceLists(pagination.page, searchTerm);
        setTimeout(() => setSuccessMessage(''), 3000);
        setShowDeleteModal(false);
        setDeletingPriceList(null);
      } else {
        setErrorText(response.message || 'Failed to delete price list');
      }
    } catch (error) {
      console.error('Error deleting price list:', error);
      setErrorText('Failed to delete price list');
    } finally {
      setIsDeleting(false);
    }
  };

  // Handle submit add
  const handleSubmitPriceList = async (data: typeof formData) => {
    try {
      const response = await setupService.createPriceList({
        serviceCode: data.serviceCode,
        serviceName: data.serviceName,
        type: data.type,
        price: parseFloat(data.price),
        note: data.note || undefined
      });

      if (response.success) {
        setShowAddModal(false);
        setSuccessMessage(`Đã thêm bảng giá "${response.data.serviceName}" thành công!`);
        loadPriceLists(pagination.page, searchTerm);
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        setErrorText(response.message || 'Failed to create price list');
      }
    } catch (error) {
      console.error('Error creating price list:', error);
      setErrorText('Failed to create price list');
    }
  };

  // Handle submit edit
  const handleUpdatePriceList = async (data: typeof formData) => {
    if (!editingPriceList) return;

    try {
      const response = await setupService.updatePriceList(editingPriceList.id, {
        serviceCode: data.serviceCode,
        serviceName: data.serviceName,
        type: data.type,
        price: parseFloat(data.price),
        note: data.note || undefined
      });

      if (response.success) {
        setShowEditModal(false);
        setSuccessMessage(`Đã cập nhật bảng giá "${response.data.serviceName}" thành công!`);
        loadPriceLists(pagination.page, searchTerm);
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        setErrorText(response.message || 'Failed to update price list');
      }
    } catch (error) {
      console.error('Error updating price list:', error);
      setErrorText('Failed to update price list');
    }
  };

  // Upload Excel: open modal
  const handleUploadPriceListExcel = () => {
    setErrorText('');
    setShowUploadModal(true);
  };

  // Upload Excel: parse files and create items
  const handleFileUpload = async (files: File[]) => {
    try {
      let total = 0;
      for (const file of files) {
        const formData = new FormData();
        formData.append('file', file);
        const response = await setupService.uploadPriceListExcel(formData);
        if (response.success && response.data) total += response.data.length;
        else if (!response.success) {
          const details = Array.isArray(response.details) ? `\n- ${response.details.join('\n- ')}` : '';
          setErrorText((response.message || 'Failed to upload Excel file') + details);
          return;
        }
      }

      if (total > 0) {
        setSuccessMessage(`Đã tải lên ${total} dịch vụ thành công!`);
        setTimeout(() => setSuccessMessage(''), 5000);
        loadPriceLists(1, searchTerm);
        setShowUploadModal(false);
        setErrorText('');
      }
    } catch (error: any) {
      console.error('Error uploading price list Excel:', error);
      setErrorText('Có lỗi khi upload file Excel. Vui lòng kiểm tra định dạng file.');
    }
  };

  // Removed file upload handler

  return (
    <>
      <Header />
      <main className="container">
        <div className="grid grid-cols-3" style={{gap: 20}}>
          <div style={{gridColumn: 'span 3'}}>
            <Card title={undefined as any}>
              {/* Header with buttons */}
              <SetupHeader
                activeTab="priceLists"
                language={language}
                translations={translations}
                onAddNewPriceList={handleAddNewPriceList}
                onUploadPriceListExcel={handleUploadPriceListExcel}
                onAddNewShippingLine={() => {}}
                onUploadExcel={() => {}}
                onAddNewTransportCompany={() => {}}
                onUploadTransportCompanyExcel={() => {}}
                onAddNewContainerType={() => {}}
                onUploadContainerTypeExcel={() => {}}
              />

              {/* Success Message */}
              <SuccessMessage message={successMessage} />

              {/* Price Lists Table */}
              <PriceListsTable
                priceLists={priceLists}
                pagination={pagination}
                onPageChange={handlePageChange}
                onEdit={handleEditPriceList}
                onDelete={handleDeletePriceList}
                language={language}
                translations={translations}
              />
            </Card>
          </div>
        </div>
      </main>

      {/* Modals */}
            <AddPriceListModal
              visible={showAddModal}
              onCancel={() => setShowAddModal(false)}
              onSubmit={handleSubmitPriceList}
              formData={formData}
              setFormData={setFormData}
              errorText={errorText}
              language={language}
              translations={translations}
              existingPriceLists={priceLists}
            />

      <EditPriceListModal
        visible={showEditModal}
        onCancel={() => setShowEditModal(false)}
        onSubmit={handleUpdatePriceList}
        formData={formData}
        setFormData={setFormData}
        errorText={errorText}
        language={language}
        translations={translations}
        existingPriceLists={priceLists}
        currentId={editingPriceList?.id}
      />

      <UploadExcelModal
        visible={showUploadModal}
        onCancel={() => setShowUploadModal(false)}
        onUpload={handleFileUpload}
        language={language}
        translations={translations}
        context="priceLists"
      />

      <ConfirmDeleteModal
        visible={showDeleteModal}
        onCancel={() => {
          setShowDeleteModal(false);
          setDeletingPriceList(null);
        }}
        onConfirm={confirmDeletePriceList}
        title="Xác nhận xóa bảng giá"
        message="Bạn có chắc chắn muốn xóa bảng giá này không?"
        itemName={deletingPriceList?.serviceName || ''}
        isDeleting={isDeleting}
      />
    </>
  );
}

