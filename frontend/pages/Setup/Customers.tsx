import React, { useState, useEffect } from 'react';
import { useTranslation } from '../../hooks/useTranslation';
import Header from '../../components/Header';
import Card from '../../components/Card';
import { setupService, Customer } from '../../services/setupService';
import { Pagination } from '../../components/Pagination';
import { UploadCustomerExcelModal } from './components/UploadCustomerExcelModal';
import { AddCustomerModal, CustomerFormData } from './components/AddCustomerModal';
import { EditCustomerModal } from './components/EditCustomerModal';
import { SetupHeader } from './components/SetupHeader';
import { SuccessMessage } from './components/SuccessMessage';
import { ConfirmDeleteModal } from './components/ConfirmDeleteModal';

// Import translations
import { translations } from './constants/translations';

export default function Customers() {
  const { t, currentLanguage } = useTranslation();
  const language = currentLanguage as 'vi' | 'en';

  // State for customers
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 14, total: 0, totalPages: 0 });
  const [loading, setLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [successMessage, setSuccessMessage] = useState('');
  
  // Delete Modal States
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingCustomer, setDeletingCustomer] = useState<Customer | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Form states
  const [customerFormData, setCustomerFormData] = useState<CustomerFormData>({
    code: '',
    name: '',
    address: '',
    taxCode: '',
    email: '',
    phone: '',
    note: ''
  });
  const [errorText, setErrorText] = useState('');

  // Load customers on component mount
  useEffect(() => {
    loadCustomers(1, 14);
  }, []);

  // Auto-hide success message after 3 seconds
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => {
        setSuccessMessage('');
      }, 3000);
      
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  const resetForm = () => {
    setCustomerFormData({
      code: '',
      name: '',
      address: '',
      taxCode: '',
      email: '',
      phone: '',
      note: ''
    });
    setErrorText('');
    setEditingCustomer(null);
  };

  // Validation functions
  const validateEmail = (email: string) => {
    if (!email.trim()) return true; // Empty is valid
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email.trim());
  };

  const validatePhone = (phone: string) => {
    if (!phone.trim()) return true; // Empty is valid
    const phoneRegex = /^[0-9+\-\s()]+$/;
    return phoneRegex.test(phone.trim()) && phone.trim().length >= 8;
  };

  const validateCode = (code: string) => {
    if (!code.trim()) return false;
    const codeRegex = /^[A-Za-z0-9_]+$/;
    return codeRegex.test(code.trim());
  };

  const validateTaxCode = (taxCode: string) => {
    if (!taxCode.trim()) return true; // Empty is valid
    const taxCodeRegex = /^[0-9]+$/;
    return taxCodeRegex.test(taxCode.trim()) && taxCode.trim().length >= 10;
  };


  const loadCustomers = async (page = 1, limit = 14) => {
    setLoading(true);
    try {
      console.log('Loading customers...');
      const response = await setupService.getCustomers({ page, limit });
      console.log('Load customers response:', JSON.stringify(response, null, 2));
      if (response && response.data) {
        const list = Array.isArray(response.data.data) ? response.data.data : (response.data as any);
        setCustomers(list || []);
        if ((response.data as any).pagination) {
          const p = (response.data as any).pagination;
          setPagination({ page: p.page, limit: p.limit, total: p.total, totalPages: p.totalPages });
        } else {
          // fallback if backend returns plain array
          const total = Array.isArray(list) ? list.length : 0;
          const totalPages = Math.max(1, Math.ceil(total / limit));
          setPagination(prev => ({ ...prev, page, limit, total, totalPages }));
        }
        // Don't clear success message here to preserve it
      } else {
        setSuccessMessage(response.message || 'Lỗi khi tải danh sách khách hàng');
      }
    } catch (error) {
      console.error('Error loading customers:', error);
      setSuccessMessage('Lỗi khi tải danh sách khách hàng');
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (page: number) => {
    loadCustomers(page, pagination.limit);
  };

  // Validation and create/update function
  const validateAndCreate = async (formData: CustomerFormData) => {
    if (!formData.code.trim()) {
      setErrorText('Mã khách hàng không được để trống');
      return;
    }
    if (!formData.name.trim()) {
      setErrorText('Tên khách hàng không được để trống');
      return;
    }

    // Validate customer code format
    if (!validateCode(formData.code)) {
      setErrorText('Mã khách hàng chỉ được chứa chữ cái, số và dấu gạch dưới');
      return;
    }

    // Validate email format if provided
    if (!validateEmail(formData.email)) {
      setErrorText('Định dạng email không hợp lệ. Vui lòng nhập email đúng định dạng (ví dụ: example@domain.com)');
      return;
    }

    // Validate phone format if provided
    if (!validatePhone(formData.phone)) {
      setErrorText('Số điện thoại không hợp lệ. Vui lòng nhập số điện thoại đúng định dạng');
      return;
    }

    // Validate tax code format if provided
    if (!validateTaxCode(formData.taxCode)) {
      setErrorText('Mã số thuế phải là số và có ít nhất 10 chữ số');
      return;
    }

    setErrorText('');
    setLoading(true);

    try {
      if (editingCustomer) {
        // Update existing customer (tax_code is immutable, so we only update name, address, email, phone)
        const updateData: any = {
          name: formData.name.trim()
        };
        
        if (formData.address.trim()) updateData.address = formData.address.trim();
        if (formData.email.trim()) updateData.email = formData.email.trim();
        if (formData.phone.trim()) updateData.phone = formData.phone.trim();
        
        console.log('Updating customer with data:', updateData);
        const response = await setupService.updateCustomer(editingCustomer.id, updateData);

        if (response && response.success && response.data) {
          // Refresh the entire list to ensure data consistency
          await loadCustomers(1, 14);
          console.log('Setting success message for update');
          setSuccessMessage('Cập nhật khách hàng thành công');
          
          // Close modal immediately
          if (editingCustomer) {
            setShowEditModal(false);
          } else {
            setShowAddModal(false);
          }
          setEditingCustomer(null);
          resetForm();
        } else {
          // Kiểm tra lỗi cụ thể
          if (response.message && response.message.includes('Mã khách hàng đã tồn tại')) {
            setErrorText(`Khách hàng có mã "${formData.code.trim()}" đã tồn tại. Vui lòng nhập mã khác`);
          } else if (response.message && response.message.includes('Mã số thuế đã tồn tại')) {
            setErrorText(`Mã số thuế "${formData.taxCode.trim()}" đã tồn tại. Vui lòng nhập mã số thuế khác`);
          } else if (response.message && response.message.includes('Email format is invalid')) {
            setErrorText('Định dạng email không hợp lệ. Vui lòng nhập email đúng định dạng (ví dụ: example@domain.com)');
          } else if (response.message && response.message.includes('Please enter a valid email address')) {
            setErrorText('Định dạng email không hợp lệ. Vui lòng nhập email đúng định dạng (ví dụ: example@domain.com)');
          } else {
            setErrorText(response.message || 'Lỗi khi cập nhật khách hàng');
          }
          return;
        }
      } else {
        // Create new customer
        console.log('Creating customer with data:', {
          code: formData.code.trim(),
          name: formData.name.trim(),
          tax_code: formData.taxCode.trim() ? formData.taxCode.trim() : undefined,
          address: formData.address.trim() ? formData.address.trim() : undefined,
          email: formData.email.trim() ? formData.email.trim() : undefined,
          phone: formData.phone.trim() ? formData.phone.trim() : undefined
        });
        
        // Prepare data object, only include non-empty fields
        const customerData: any = {
          code: formData.code.trim(),
          name: formData.name.trim()
        };
        
        if (formData.taxCode.trim()) customerData.tax_code = formData.taxCode.trim();
        if (formData.address.trim()) customerData.address = formData.address.trim();
        if (formData.email.trim()) {
          customerData.email = formData.email.trim();
          console.log('Email being sent:', customerData.email);
        }
        if (formData.phone.trim()) customerData.phone = formData.phone.trim();
        if (formData.note.trim()) customerData.note = formData.note.trim();
        
        console.log('Sending customer data:', customerData);
        
        const response = await setupService.createCustomer(customerData);
        
        console.log('API response:', JSON.stringify(response, null, 2));
        console.log('Response success:', response?.success);
        console.log('Response data:', response?.data);
        console.log('Response message:', response?.message);

        if (response && response.success && response.data) {
          // Refresh the entire list to ensure data consistency
          await loadCustomers(1, 14);
          console.log('Setting success message for create');
          setSuccessMessage('Tạo khách hàng thành công');
          
          // Close modal immediately
          if (editingCustomer) {
            setShowEditModal(false);
          } else {
            setShowAddModal(false);
          }
          setEditingCustomer(null);
          resetForm();
        } else {
          // Kiểm tra lỗi cụ thể
          if (response && response.message && response.message.includes('Mã khách hàng đã tồn tại')) {
            setErrorText(`Khách hàng có mã "${formData.code.trim()}" đã tồn tại. Vui lòng nhập mã khác`);
          } else if (response && response.message && response.message.includes('Mã số thuế đã tồn tại')) {
            setErrorText(`Mã số thuế "${formData.taxCode.trim()}" đã tồn tại. Vui lòng nhập mã số thuế khác`);
          } else if (response && response.message && response.message.includes('Email format is invalid')) {
            setErrorText('Định dạng email không hợp lệ. Vui lòng nhập email đúng định dạng (ví dụ: example@domain.com)');
          } else if (response && response.message && response.message.includes('Please enter a valid email address')) {
            setErrorText('Định dạng email không hợp lệ. Vui lòng nhập email đúng định dạng (ví dụ: example@domain.com)');
          } else {
            setErrorText(response?.message || 'Lỗi khi tạo khách hàng');
          }
          return;
        }
      }

      // Reset form (only if not successful)
      // Note: Successful cases are handled in the if blocks above
    } catch (error) {
      console.error('Error saving customer:', error);
      setErrorText('Lỗi khi lưu khách hàng');
    } finally {
      setLoading(false);
    }
  };

  // Delete customer function
  const confirmDeleteCustomer = async () => {
    if (!deletingCustomer) return;

    setIsDeleting(true);
    try {
      console.log('Deleting customer with ID:', deletingCustomer.id);
      const response = await setupService.deleteCustomer(deletingCustomer.id);
      console.log('Delete response:', JSON.stringify(response, null, 2));
      
      if (response && response.success) {
        setCustomers(prev => prev.filter(c => c.id !== deletingCustomer.id));
        setSuccessMessage(`Đã xóa khách hàng "${deletingCustomer.name}" thành công`);
        setTimeout(() => setSuccessMessage(''), 3000);
        setShowDeleteModal(false);
        setDeletingCustomer(null);
      } else {
        setSuccessMessage(response.message || 'Lỗi khi xóa khách hàng');
      }
    } catch (error) {
      console.error('Error deleting customer:', error);
      setSuccessMessage('Lỗi khi xóa khách hàng');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <Header />
      <main className="container">
        <div className="grid grid-cols-3" style={{gap: 20}}>
          <div style={{gridColumn: 'span 3'}}>
            <Card title={undefined as any}>
              {/* Header with buttons */}
              <SetupHeader
                activeTab="customers"
                language={language}
                translations={translations}
                onAddNewShippingLine={() => {}}
                onUploadExcel={() => {}}
                onAddNewTransportCompany={() => {}}
                onUploadTransportCompanyExcel={() => {}}
                onAddNewContainerType={() => {}}
                onUploadContainerTypeExcel={() => {}}
                onAddNewCustomer={() => {
                  setEditingCustomer(null);
                  setCustomerFormData({
                    code: '',
                    name: '',
                    address: '',
                    taxCode: '',
                    email: '',
                    phone: '',
                    note: ''
                  });
                  setErrorText('');
                  setShowAddModal(true);
                }}
                onUploadCustomerExcel={() => setShowUploadModal(true)}
              />

              {/* Success Message */}
              <SuccessMessage message={successMessage} />

              {/* Table */}
              <div className="table-container">
                {loading ? (
                  <div style={{textAlign: 'center', padding: '40px', color: '#666'}}>
                    Đang tải dữ liệu...
                  </div>
                ) : (
                  <table className="table">
                    <thead style={{background: '#f8fafc'}}>
                      <tr>
                        <th>Mã khách hàng</th>
                        <th>Tên khách hàng</th>
                        <th>Địa chỉ</th>
                        <th>Mã số thuế</th>
                        <th>Email</th>
                        <th>Số điện thoại</th>
                        <th>Hành động</th>
                      </tr>
                    </thead>
                    <tbody>
                      {customers.length === 0 ? (
                        <tr>
                          <td colSpan={7} style={{textAlign: 'center', padding: '40px', color: '#666'}}>
                            Chưa có khách hàng nào
                          </td>
                        </tr>
                      ) : (
                        customers.map((customer) => (
                          <tr key={customer.code}>
                            <td style={{fontFamily:'monospace'}}>{customer.code}</td>
                            <td style={{fontWeight:600}}>{customer.name}</td>
                            <td>{customer.address || '-'}</td>
                            <td>{customer.tax_code || '-'}</td>
                            <td>{customer.email || '-'}</td>
                            <td>{customer.phone || '-'}</td>
                            <td>
                              <div style={{display:'flex', gap:8}}>
                                <button 
                                  className="btn btn-xs" 
                                  onClick={() => {
                                    // open edit modal with existing values
                                    resetForm();
                                    setCustomerFormData({
                                      code: customer.code,
                                      name: customer.name,
                                      address: customer.address || '',
                                      taxCode: customer.tax_code || '',
                                      email: customer.email || '',
                                      phone: customer.phone || '',
                                      note: customer.note || ''
                                    });
                                    setEditingCustomer(customer);
                                    setShowEditModal(true);
                                  }}
                                  disabled={loading}
                                >
                                  Sửa
                                </button>
                                <button 
                                  className="btn btn-xs btn-outline" 
                                  onClick={() => {
                                    setDeletingCustomer(customer);
                                    setShowDeleteModal(true);
                                  }}
                                  disabled={loading}
                                >
                                  Xóa
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                )}

                {/* Pagination giống các trang Setup khác */}
                <Pagination
                  currentPage={pagination.page}
                  totalPages={pagination.totalPages}
                  totalItems={pagination.total}
                  itemsPerPage={pagination.limit}
                  onPageChange={handlePageChange}
                  language={language}
                  translations={{
                    common: { showing: 'Hiển thị', of: 'trong tổng số', items: 'mục', previous: 'Trước', next: 'Sau' }
                  }}
                />
              </div>

              {/* Add Modal */}
              <AddCustomerModal
                visible={showAddModal}
                onCancel={() => { 
                  setShowAddModal(false); 
                  setEditingCustomer(null);
                  resetForm();
                }}
                onSubmit={validateAndCreate}
                formData={customerFormData}
                setFormData={setCustomerFormData}
                errorText={errorText}
                language={language}
                translations={translations}
              />

              {/* Edit Modal */}
              <EditCustomerModal
                visible={showEditModal}
                onCancel={() => { 
                  setShowEditModal(false); 
                  setEditingCustomer(null);
                  resetForm();
                }}
                onSubmit={validateAndCreate}
                formData={customerFormData}
                setFormData={setCustomerFormData}
                errorText={errorText}
                language={language}
                translations={translations}
                originalCode={editingCustomer?.code || ''}
              />
            </Card>
          </div>
        </div>
      </main>

      {/* Upload Excel Modal */}
      <UploadCustomerExcelModal
        visible={showUploadModal}
        onCancel={() => setShowUploadModal(false)}
        onUpload={async (files) => {
          if (files.length === 0) return;
          setLoading(true);
          try {
            const formData = new FormData();
            formData.append('file', files[0]);
            const res = await setupService.uploadCustomerExcel(formData);
            if (res.success) {
              setSuccessMessage(res.message || 'Upload Excel thành công');
              await loadCustomers(1, 14);
              setShowUploadModal(false);
            } else {
              const details = Array.isArray(res.details) ? `\n- ${res.details.join('\n- ')}` : '';
              alert((res.message || 'Upload thất bại') + details);
            }
          } catch (err) {
            alert('Có lỗi khi upload file');
          } finally {
            setLoading(false);
          }
        }}
        language={language}
        translations={{
          vi: {
            uploadExcel: 'Upload Excel',
            uploadInstructions: 'Hướng dẫn upload file Excel',
            downloadTemplate: 'Tải mẫu file Excel',
            selectFile: 'Chọn file Excel',
            upload: 'Tải lên',
            code: true
          },
          en: {
            uploadExcel: 'Upload Excel',
            uploadInstructions: 'Excel file upload instructions',
            downloadTemplate: 'Download template',
            selectFile: 'Select Excel file',
            upload: 'Upload',
            code: false
          }
        }}
      />

      <ConfirmDeleteModal
        visible={showDeleteModal}
        onCancel={() => {
          setShowDeleteModal(false);
          setDeletingCustomer(null);
        }}
        onConfirm={confirmDeleteCustomer}
        title="Xác nhận xóa khách hàng"
        message="Bạn có chắc chắn muốn xóa khách hàng này không?"
        itemName={deletingCustomer?.name || ''}
        isDeleting={isDeleting}
      />
    </>
  );
}
