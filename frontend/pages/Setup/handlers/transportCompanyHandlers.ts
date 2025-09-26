import { setupService, TransportCompany } from '../../../services/setupService';
import { TransportCompanyFormData } from '../components/AddTransportCompanyModal';

export const createTransportCompanyHandlers = (
  setTransportCompanies: React.Dispatch<React.SetStateAction<TransportCompany[]>>,
  setTransportCompaniesPagination: React.Dispatch<React.SetStateAction<{
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  }>>,
  setShowAddTransportCompanyModal: React.Dispatch<React.SetStateAction<boolean>>,
  setShowEditTransportCompanyModal: React.Dispatch<React.SetStateAction<boolean>>,
  setShowUploadTransportCompanyModal: React.Dispatch<React.SetStateAction<boolean>>,
  setEditingTransportCompany: React.Dispatch<React.SetStateAction<TransportCompany | null>>,
  setTransportCompanyFormData: React.Dispatch<React.SetStateAction<TransportCompanyFormData>>,
  setTransportCompanyErrorText: React.Dispatch<React.SetStateAction<string>>,
  setSuccessMessage: React.Dispatch<React.SetStateAction<string>>,
  setShowDeleteModal: React.Dispatch<React.SetStateAction<boolean>>,
  setDeletingItem: React.Dispatch<React.SetStateAction<any>>,
  setIsDeleting: React.Dispatch<React.SetStateAction<boolean>>,
  transportCompanies: TransportCompany[],
  transportCompaniesPagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  },
  language: 'vi' | 'en',
  translations: any
) => {
  const loadTransportCompanies = async (page: number = 1, limit: number = 14) => {
    try {
      const response = await setupService.getTransportCompanies({ page, limit });
      if (response.success && response.data) {
        setTransportCompanies(response.data.data);
        setTransportCompaniesPagination({
          page: response.data.pagination.page,
          limit: response.data.pagination.limit,
          total: response.data.pagination.total,
          totalPages: response.data.pagination.totalPages
        });
      }
    } catch (error) {
      console.error('Error loading transport companies:', error);
    }
  };

  const handlePageChange = (page: number) => {
    loadTransportCompanies(page, transportCompaniesPagination.limit);
  };

  const handleEditTransportCompany = (company: TransportCompany) => {
    setEditingTransportCompany(company);
    setTransportCompanyFormData({
      code: company.code,
      name: company.name,
      address: company.address || '',
      mst: company.mst || '',
      phone: company.phone || '',
      note: company.note || ''
    });
    setTransportCompanyErrorText('');
    setShowEditTransportCompanyModal(true);
  };

  const handleDeleteTransportCompany = (id: string) => {
    const companyToDelete = transportCompanies.find(tc => tc.id === id);
    if (companyToDelete) {
      setDeletingItem(companyToDelete);
      setShowDeleteModal(true);
    }
  };

  const confirmDeleteTransportCompany = async (deletingItem: TransportCompany) => {
    if (!deletingItem) return;

    setIsDeleting(true);
    try {
      const response = await setupService.deleteTransportCompany(deletingItem.id);
      if (response.success) {
        // Reload current page to refresh data
        loadTransportCompanies(transportCompaniesPagination.page, transportCompaniesPagination.limit);
        setSuccessMessage(
          translations[language].code 
            ? `Đã xóa nhà xe "${deletingItem.name}" thành công!`
            : `Successfully deleted transport company "${deletingItem.name}"!`
        );
        setTimeout(() => setSuccessMessage(''), 3000);
        setShowDeleteModal(false);
        setDeletingItem(null);
      } else {
        setTransportCompanyErrorText(response.message || 'Failed to delete transport company');
      }
    } catch (error) {
      console.error('Error deleting transport company:', error);
      setTransportCompanyErrorText('Failed to delete transport company');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleAddNewTransportCompany = () => {
    setTransportCompanyFormData({
      code: '',
      name: '',
      address: '',
      mst: '',
      phone: '',
      note: ''
    });
    setTransportCompanyErrorText('');
    setShowAddTransportCompanyModal(true);
  };

  const handleSubmitTransportCompany = async (data: TransportCompanyFormData) => {
    // Wrap the entire function to prevent any errors from being thrown
    try {
      const response = await setupService.createTransportCompany({
        code: data.code.trim(),
        name: data.name.trim(),
        address: data.address.trim(),
        mst: data.mst.trim(),
        phone: data.phone.trim(),
        note: data.note.trim()
      }).catch((error: any) => {
        // If setupService throws an error, catch it here and return error response
        console.error('Error in setupService.createTransportCompany:', error);
        return {
          success: false,
          error: 'CREATE_ERROR',
          message: error.response?.data?.message || 'Failed to create transport company',
          details: error.response?.data?.details
        };
      });

      if (response.success && 'data' in response && response.data) {
        // Reload first page to show new item
        loadTransportCompanies(1, transportCompaniesPagination.limit);
        
        // Show success message
        setSuccessMessage(
          translations[language].code 
            ? `Đã thêm nhà xe "${response.data.name}" thành công!`
            : `Successfully added transport company "${response.data.name}"!`
        );
        
        // Clear success message after 3 seconds
        setTimeout(() => {
          setSuccessMessage('');
        }, 3000);
        
        // Close modal and reset form
        setShowAddTransportCompanyModal(false);
        setTransportCompanyErrorText('');
        setTransportCompanyFormData({
          code: '',
          name: '',
          address: '',
          mst: '',
          phone: '',
          note: ''
        });
      } else {
        // Handle API error response
        const errorMessage = response.message || '';
        const errorDetails = response.details || [];
        
        // Check if it's a duplicate code error
        const isDuplicateError = errorMessage.toLowerCase().includes('duplicate') || 
                                errorMessage.toLowerCase().includes('already exists') ||
                                errorMessage.toLowerCase().includes('unique') ||
                                errorMessage.toLowerCase().includes('constraint') ||
                                errorDetails.some((detail: any) => 
                                  detail.message?.toLowerCase().includes('duplicate') ||
                                  detail.message?.toLowerCase().includes('already exists') ||
                                  detail.message?.toLowerCase().includes('unique')
                                );
        
        if (isDuplicateError) {
          setTransportCompanyErrorText(
            translations[language].code 
              ? `Mã nhà xe "${data.code}" đã tồn tại. Vui lòng chọn mã khác.`
              : `Transport company code "${data.code}" already exists. Please choose a different code.`
          );
        } else if (errorMessage.toLowerCase().includes('validation')) {
          setTransportCompanyErrorText(
            translations[language].code 
              ? 'Dữ liệu không hợp lệ. Vui lòng kiểm tra lại thông tin.'
              : 'Invalid data. Please check your information.'
          );
        } else {
          // Show detailed error message if available
          if (errorDetails && errorDetails.length > 0) {
            const detailMessages = errorDetails.map((d: any) => d.message).join(', ');
            setTransportCompanyErrorText(detailMessages);
          } else {
            setTransportCompanyErrorText(errorMessage || 'Failed to create transport company');
          }
        }
      }
    } catch (error: any) {
      console.error('Error creating transport company:', error);
      setTransportCompanyErrorText(
        translations[language].code 
          ? 'Không thể tạo nhà xe. Vui lòng thử lại.'
          : 'Failed to create transport company. Please try again.'
      );
    }
  };

  const handleUpdateTransportCompany = async (data: TransportCompanyFormData, editingTransportCompany: TransportCompany | null) => {
    if (!editingTransportCompany) return;

    // Validation
    if (!data.code.trim()) {
      setTransportCompanyErrorText(translations[language].code ? 'Vui lòng nhập mã nhà xe.' : 'Please enter transport company code.');
      return;
    }
    if (!data.name.trim()) {
      setTransportCompanyErrorText(translations[language].name ? 'Vui lòng nhập tên nhà xe.' : 'Please enter transport company name.');
      return;
    }

    // Check for duplicate code (only if code changed)
    const trimmedCode = data.code.trim();
    if (trimmedCode !== editingTransportCompany.code) {
      const isDuplicate = transportCompanies.some(tc => 
        tc.id !== editingTransportCompany.id && 
        tc.code.toLowerCase() === trimmedCode.toLowerCase()
      );
      
      if (isDuplicate) {
        const existingTransportCompany = transportCompanies.find(tc => 
          tc.code.toLowerCase() === trimmedCode.toLowerCase()
        );
        setTransportCompanyErrorText(
          translations[language].code 
            ? `Mã nhà xe "${trimmedCode}" đã tồn tại (${existingTransportCompany?.name}). Vui lòng chọn mã khác.`
            : `Transport company code "${trimmedCode}" already exists (${existingTransportCompany?.name}). Please choose a different code.`
        );
        return;
      }
    }

    try {
      // Prepare update data
      const updateData = {
        code: trimmedCode,
        name: data.name.trim(),
        address: data.address.trim(),
        mst: data.mst.trim(),
        phone: data.phone.trim(),
        note: data.note.trim()
      };

      // Call API to update transport company
      const response = await setupService.updateTransportCompany(editingTransportCompany.id, updateData);
      
      if (response.success && response.data) {
        // Reload current page to refresh data
        loadTransportCompanies(transportCompaniesPagination.page, transportCompaniesPagination.limit);
        
        // Show success message
        setSuccessMessage(
          translations[language].code 
            ? `Đã cập nhật nhà xe "${response.data.name}" thành công!`
            : `Successfully updated transport company "${response.data.name}"!`
        );
        
        // Clear success message after 3 seconds
        setTimeout(() => {
          setSuccessMessage('');
        }, 3000);
        
        // Close modal and reset form
        setShowEditTransportCompanyModal(false);
        setEditingTransportCompany(null);
        setTransportCompanyErrorText('');
        setTransportCompanyFormData({
          code: '',
          name: '',
          address: '',
          mst: '',
          phone: '',
          note: ''
        });

        console.log('Transport company updated successfully:', response.data);
      } else {
        // Handle API error response
        const errorMessage = response.message || '';
        const errorDetails = response.details || [];
        
        // Check if it's a duplicate code error
        const isDuplicateError = errorMessage.toLowerCase().includes('duplicate') || 
                                errorMessage.toLowerCase().includes('already exists') ||
                                errorMessage.toLowerCase().includes('unique') ||
                                errorMessage.toLowerCase().includes('constraint') ||
                                errorDetails.some((detail: any) => 
                                  detail.message?.toLowerCase().includes('duplicate') ||
                                  detail.message?.toLowerCase().includes('already exists') ||
                                  detail.message?.toLowerCase().includes('unique')
                                );
        
        if (isDuplicateError) {
          setTransportCompanyErrorText(
            translations[language].code 
              ? `Mã nhà xe "${data.code}" đã tồn tại. Vui lòng chọn mã khác.`
              : `Transport company code "${data.code}" already exists. Please choose a different code.`
          );
        } else if (errorMessage.toLowerCase().includes('validation')) {
          setTransportCompanyErrorText(
            translations[language].code 
              ? 'Dữ liệu không hợp lệ. Vui lòng kiểm tra lại thông tin.'
              : 'Invalid data. Please check your information.'
          );
        } else {
          // Show detailed error message if available
          if (errorDetails && errorDetails.length > 0) {
            const detailMessages = errorDetails.map((d: any) => d.message).join(', ');
            setTransportCompanyErrorText(detailMessages);
          } else {
            setTransportCompanyErrorText(errorMessage || 'Failed to update transport company');
          }
        }
      }
    } catch (error: any) {
      console.error('Error updating transport company:', error);
      setTransportCompanyErrorText(
        translations[language].code 
          ? 'Không thể cập nhật nhà xe. Vui lòng thử lại.'
          : 'Failed to update transport company. Please try again.'
      );
    }
  };

  const handleUploadTransportCompanyExcel = () => {
    setShowUploadTransportCompanyModal(true);
  };

  const handleTransportCompanyFileUpload = async (files: File[]) => {
    try {
      let total = 0;
      for (const file of files) {
        const formData = new FormData();
        formData.append('file', file);
        const response = await setupService.uploadTransportCompanyExcel(formData);
        if (response.success && response.data) total += response.data.length;
        else if (!response.success) setTransportCompanyErrorText(response.message || 'Failed to upload Excel file');
      }

      if (total > 0) {
        loadTransportCompanies(1, transportCompaniesPagination.limit);
        setSuccessMessage(translations[language].code ? `Đã tải lên ${total} nhà xe thành công!` : `Successfully uploaded ${total} transport companies!`);
        setTimeout(() => setSuccessMessage(''), 5000);
        setShowUploadTransportCompanyModal(false);
        setTransportCompanyErrorText('');
      }
    } catch (error: any) {
      console.error('Error uploading Excel file:', error);
      
      // Handle specific error cases
      if (error.response?.status === 400) {
        const errorMessage = error.response?.data?.message || '';
        if (errorMessage.toLowerCase().includes('duplicate') || errorMessage.toLowerCase().includes('already exists')) {
          setTransportCompanyErrorText(
            translations[language].code 
              ? 'Một số mã nhà xe trong file Excel đã tồn tại. Vui lòng kiểm tra và thử lại.'
              : 'Some transport company codes in the Excel file already exist. Please check and try again.'
          );
        } else {
          setTransportCompanyErrorText(errorMessage || 'Failed to upload Excel file');
        }
      } else {
        setTransportCompanyErrorText('Failed to upload Excel file');
      }
    }
  };

  return {
    loadTransportCompanies,
    handlePageChange,
    handleEditTransportCompany,
    handleDeleteTransportCompany,
    confirmDeleteTransportCompany,
    handleAddNewTransportCompany,
    handleSubmitTransportCompany,
    handleUpdateTransportCompany,
    handleUploadTransportCompanyExcel,
    handleTransportCompanyFileUpload
  };
};
