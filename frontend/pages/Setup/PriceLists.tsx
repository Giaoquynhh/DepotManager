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
    limit: 10,
    total: 0,
    totalPages: 0
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);

  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [editingPriceList, setEditingPriceList] = useState<PriceList | null>(null);

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
        limit: 10,
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
    loadPriceLists();
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

  // Handle delete price list
  const handleDeletePriceList = async (id: string) => {
    if (!confirm(translations[language].confirmDelete)) {
      return;
    }

    try {
      // Find the price list to get its name before deleting
      const priceListToDelete = priceLists.find(pl => pl.id === id);
      const serviceName = priceListToDelete?.serviceName || '';

      const response = await setupService.deletePriceList(id);
      if (response.success) {
        setSuccessMessage(`Đã xóa bảng giá "${serviceName}" thành công!`);
        loadPriceLists(pagination.page, searchTerm);
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        setErrorText(response.message || 'Failed to delete price list');
      }
    } catch (error) {
      console.error('Error deleting price list:', error);
      setErrorText('Failed to delete price list');
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
      const XLSX = await import('xlsx');

      const newItems: Array<{ serviceCode: string; serviceName: string; type: string; price: number; note?: string }>[] = [] as any;
      const errors: string[] = [];

      const readAsArrayBuffer = (file: File): Promise<ArrayBuffer> => {
        const anyFile: any = file as any;
        if (typeof anyFile.arrayBuffer === 'function') return anyFile.arrayBuffer();
        return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as ArrayBuffer);
          reader.onerror = () => reject(reader.error);
          reader.readAsArrayBuffer(file);
        });
      };

      const normalizePrice = (val: any): number => {
        if (typeof val === 'number') return val;
        const s = String(val || '')
          .replace(/\./g, '')
          .replace(/,/g, '')
          .replace(/\s?VND/gi, '')
          .trim();
        const num = parseFloat(s);
        return isNaN(num) ? NaN : num;
      };

      const collected: Array<{ serviceCode: string; serviceName: string; type: string; price: number; note?: string }> = [];

      for (const file of files) {
        const data = await readAsArrayBuffer(file);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        const rows = (jsonData as any[]).slice(1);

        rows.forEach((row: any[], index: number) => {
          const [serviceCodeRaw, serviceNameRaw, typeRaw, priceRaw, noteRaw] = row || [];

          const hasAny = row && row.some((c) => (c !== undefined && String(c).trim() !== ''));
          if (!hasAny) return;

          const serviceCode = (serviceCodeRaw ?? '').toString().trim();
          const serviceName = (serviceNameRaw ?? '').toString().trim();
          const type = (typeRaw ?? '').toString().trim();
          const price = normalizePrice(priceRaw);
          const note = noteRaw ? noteRaw.toString().trim() : undefined;

          if (!serviceCode || !serviceName || !type || isNaN(price)) {
            errors.push(`Dòng ${index + 2} (${file.name}): Thiếu thông tin bắt buộc hoặc giá không hợp lệ`);
            return;
          }

          const duplicate = priceLists.some(pl => pl.serviceCode.toLowerCase() === serviceCode.toLowerCase())
            || collected.some(pl => pl.serviceCode.toLowerCase() === serviceCode.toLowerCase());
          if (duplicate) {
            errors.push(`Dòng ${index + 2} (${file.name}): Mã dịch vụ "${serviceCode}" đã tồn tại`);
            return;
          }

          collected.push({ serviceCode, serviceName, type, price, note });
        });
      }

      if (errors.length) {
        setErrorText(`Lỗi trong file Excel:\n${errors.join('\n')}`);
        return;
      }

      if (collected.length === 0) {
        setErrorText('Không có dữ liệu hợp lệ trong file Excel');
        return;
      }

      const results = await Promise.allSettled(collected.map(item => setupService.createPriceList(item)));

      let imported = 0; const failedMsgs: string[] = [];
      results.forEach((r, idx) => {
        if (r.status === 'fulfilled' && r.value?.success) imported += 1; else {
          const code = collected[idx].serviceCode;
          const msg = (r.status === 'fulfilled' ? r.value?.message : (r as any).reason?.message) || 'Lỗi không xác định';
          failedMsgs.push(`${code}: ${msg}`);
        }
      });

      if (imported > 0) {
        setSuccessMessage(`Đã tải lên ${imported} dịch vụ thành công!`);
      }
      if (failedMsgs.length) {
        setErrorText(`Một số dịch vụ không thể lưu:\n${failedMsgs.join('\n')}`);
      }

      // refresh
      loadPriceLists(1, searchTerm);
      setTimeout(() => setSuccessMessage(''), 5000);
      setShowUploadModal(false);
    } catch (err) {
      console.error('Error uploading price list excel:', err);
      setErrorText('Lỗi khi đọc file Excel. Vui lòng kiểm tra định dạng file.');
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
        formData={editingPriceList}
        setFormData={setEditingPriceList}
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
    </>
  );
}

