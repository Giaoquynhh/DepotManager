import { setupService, ContainerType } from '../../../services/setupService';
import { ContainerTypeFormData } from '../components/AddContainerTypeModal';

export const createContainerTypeHandlers = (
  setContainerTypes: React.Dispatch<React.SetStateAction<ContainerType[]>>,
  setContainerTypesPagination: React.Dispatch<React.SetStateAction<{
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  }>>,
  setShowAddContainerTypeModal: React.Dispatch<React.SetStateAction<boolean>>,
  setShowEditContainerTypeModal: React.Dispatch<React.SetStateAction<boolean>>,
  // NEW: control upload modal
  setShowUploadContainerTypeModal: React.Dispatch<React.SetStateAction<boolean>>,
  setEditingContainerType: React.Dispatch<React.SetStateAction<ContainerType | null>>,
  setContainerTypeFormData: React.Dispatch<React.SetStateAction<ContainerTypeFormData>>,
  setContainerTypeErrorText: React.Dispatch<React.SetStateAction<string>>,
  setSuccessMessage: React.Dispatch<React.SetStateAction<string>>,
  setShowDeleteModal: React.Dispatch<React.SetStateAction<boolean>>,
  setDeletingItem: React.Dispatch<React.SetStateAction<any>>,
  setIsDeleting: React.Dispatch<React.SetStateAction<boolean>>,
  containerTypes: ContainerType[],
  containerTypesPagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  },
  language: 'vi' | 'en',
  translations: any
) => {
  const loadContainerTypes = async (page: number = 1, limit: number = 14) => {
    try {
      const response = await setupService.getContainerTypes({ page, limit });
      if (response.success && response.data) {
        setContainerTypes(response.data.data);
        setContainerTypesPagination({
          page: response.data.pagination.page,
          limit: response.data.pagination.limit,
          total: response.data.pagination.total,
          totalPages: response.data.pagination.totalPages
        });
      }
    } catch (error) {
      console.error('Error loading container types:', error);
    }
  };

  const handlePageChange = (page: number) => {
    loadContainerTypes(page, containerTypesPagination.limit);
  };

  const handleEditContainerType = (containerType: ContainerType) => {
    setEditingContainerType(containerType);
    setContainerTypeFormData({
      code: containerType.code,
      description: containerType.description,
      note: containerType.note || ''
    });
    setContainerTypeErrorText('');
    setShowEditContainerTypeModal(true);
  };

  const handleDeleteContainerType = (id: string) => {
    const containerTypeToDelete = containerTypes.find(ct => ct.id === id);
    if (containerTypeToDelete) {
      setDeletingItem(containerTypeToDelete);
      setShowDeleteModal(true);
    }
  };

  const confirmDeleteContainerType = async (deletingItem: ContainerType) => {
    if (!deletingItem) return;

    setIsDeleting(true);
    try {
      const response = await setupService.deleteContainerType(deletingItem.id);
      if (response.success) {
        // 1. Cập nhật trạng thái frontend một cách lạc quan (optimistic update)
        //    Xóa mục khỏi danh sách hiện tại để hiển thị ngay lập tức.
        setContainerTypes(prev => prev.filter(item => item.id !== deletingItem.id));

        // 2. Cập nhật tổng số mục và tổng số trang trong trạng thái phân trang
        setContainerTypesPagination(prev => ({
          ...prev,
          total: Math.max(0, prev.total - 1),
          totalPages: Math.ceil(Math.max(0, prev.total - 1) / prev.limit)
        }));

        setSuccessMessage(
          translations[language].code 
            ? `Đã xóa loại container "${deletingItem.code}" thành công!`
            : `Successfully deleted container type "${deletingItem.code}"!`
        );
        setTimeout(() => setSuccessMessage(''), 3000);
        setShowDeleteModal(false);
        setDeletingItem(null);

        // 3. Sau một khoảng thời gian ngắn, gọi lại loadContainerTypes để đồng bộ hoàn toàn
        //    với backend, đảm bảo dữ liệu chính xác, sắp xếp và phân trang đúng.
        setTimeout(() => {
          loadContainerTypes(containerTypesPagination.page, containerTypesPagination.limit);
        }, 100); // Độ trễ nhỏ để cho phép optimistic update render trước
      } else {
        setContainerTypeErrorText(response.message || 'Failed to delete container type');
      }
    } catch (error) {
      console.error('Error deleting container type:', error);
      setContainerTypeErrorText('Failed to delete container type');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleAddNewContainerType = () => {
    setContainerTypeFormData({
      code: '',
      description: '',
      note: ''
    });
    setContainerTypeErrorText('');
    setShowAddContainerTypeModal(true);
  };

  const handleContainerTypeFileUpload = async (files: File[]) => {
    try {
      let total = 0;
      for (const file of files) {
        const formData = new FormData();
        formData.append('file', file);
        const response = await setupService.uploadContainerTypeExcel(formData);
        if (response.success && response.data) total += (response.data as any[]).length;
        else if (!response.success) setContainerTypeErrorText(response.message || 'Failed to upload Excel file');
      }
      if (total > 0) {
        setSuccessMessage(translations[language].code ? `Đã tải lên ${total} loại container!` : `Uploaded ${total} container types!`);
        setTimeout(() => setSuccessMessage(''), 3000);
        loadContainerTypes(1, containerTypesPagination.limit);
        // Close upload modal after success
        setShowUploadContainerTypeModal(false);
        setContainerTypeErrorText('');
      }
    } catch (error: any) {
      console.error('Error uploading container type Excel:', error);
      const msg = error?.response?.data?.message || 'Failed to upload Excel file';
      const details: any[] = error?.response?.data?.details || [];
      if (Array.isArray(details) && details.length > 0) {
        setContainerTypeErrorText(`${msg}:\n${details.join('\n')}`);
      } else {
        setContainerTypeErrorText(msg);
      }
    }
  };

  const handleSubmitContainerType = async (data: ContainerTypeFormData) => {
    // Wrap the entire function to prevent any errors from being thrown
    try {
      // Frontend duplicate validation: tránh gọi API khi mã đã tồn tại trong bảng
      const inputCode = data.code.trim();
      const isDuplicateOnClient = containerTypes.some(ct => ct.code.trim().toLowerCase() === inputCode.toLowerCase());
      if (isDuplicateOnClient) {
        setContainerTypeErrorText(
          translations[language].code
            ? `Mã loại container "${inputCode}" đã có trong bảng. Vui lòng nhập mã khác.`
            : `Container type code "${inputCode}" already exists in the table. Please choose a different code.`
        );
        return; // Không gọi API nữa
      }

      const response = await setupService.createContainerType({
        code: data.code.trim(),
        description: data.description.trim(),
        note: data.note.trim()
      }).catch((error: any) => {
        // If setupService throws an error, catch it here and return error response
        console.error('Error in setupService.createContainerType:', error);
        return {
          success: false,
          error: 'CREATE_ERROR',
          message: error.response?.data?.message || 'Failed to create container type',
          details: error.response?.data?.details
        };
      });

      if (response.success && 'data' in response && response.data) {
        const newContainerType = response.data;

        // 1. Cập nhật trạng thái frontend một cách lạc quan (optimistic update)
        //    Thêm mục mới vào đầu danh sách hiện tại để hiển thị ngay lập tức.
        setContainerTypes(prev => [newContainerType, ...prev]);

        // 2. Cập nhật tổng số mục và tổng số trang trong trạng thái phân trang
        setContainerTypesPagination(prev => ({
          ...prev,
          total: prev.total + 1,
          totalPages: Math.ceil((prev.total + 1) / prev.limit)
        }));
    
        // Show success message
        setSuccessMessage(
          translations[language].code 
            ? `Đã thêm loại container "${newContainerType.code}" thành công!`
            : `Successfully added container type "${newContainerType.code}"!`
        );
        
        // Clear success message after 3 seconds
        setTimeout(() => {
          setSuccessMessage('');
        }, 3000);
        
        // Close modal and reset form
        setShowAddContainerTypeModal(false);
        setContainerTypeErrorText('');
        setContainerTypeFormData({
          code: '',
          description: '',
          note: ''
        });

        // 3. Sau một khoảng thời gian ngắn, gọi lại loadContainerTypes để đồng bộ hoàn toàn
        //    với backend, đảm bảo dữ liệu chính xác, sắp xếp và phân trang đúng.
        setTimeout(() => {
          loadContainerTypes(1, containerTypesPagination.limit);
        }, 100); // Độ trễ nhỏ để cho phép optimistic update render trước
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
          setContainerTypeErrorText(
            translations[language].code 
              ? `Mã loại container "${data.code}" đã tồn tại. Vui lòng chọn mã khác.`
              : `Container type code "${data.code}" already exists. Please choose a different code.`
          );
        } else if (errorMessage.toLowerCase().includes('validation')) {
          setContainerTypeErrorText(
            translations[language].code 
              ? 'Dữ liệu không hợp lệ. Vui lòng kiểm tra lại thông tin.'
              : 'Invalid data. Please check your information.'
          );
        } else {
          // Show detailed error message if available
          if (errorDetails && errorDetails.length > 0) {
            const detailMessages = errorDetails.map((d: any) => d.message).join(', ');
            setContainerTypeErrorText(detailMessages);
          } else {
            setContainerTypeErrorText(errorMessage || 'Failed to create container type');
          }
        }
      }
    } catch (error: any) {
      console.error('Error creating container type:', error);
      // Prevent error from being thrown to avoid Next.js error overlay
      setContainerTypeErrorText(
        translations[language].code 
          ? 'Không thể tạo loại container. Vui lòng thử lại.'
          : 'Failed to create container type. Please try again.'
      );
    }
  };

  const handleUpdateContainerType = async (data: ContainerTypeFormData, editingContainerType: ContainerType | null) => {
    if (!editingContainerType) return;

    try {
      const response = await setupService.updateContainerType(editingContainerType.id, {
        code: data.code.trim(),
        description: data.description.trim(),
        note: data.note.trim()
      });

      if (response.success && response.data) {
        const updatedContainerType = response.data;

        // 1. Cập nhật trạng thái frontend một cách lạc quan (optimistic update)
        //    Cập nhật mục đã chỉnh sửa trong danh sách hiện tại để hiển thị ngay lập tức.
        setContainerTypes(prev => 
          prev.map(item => 
            item.id === editingContainerType.id ? updatedContainerType : item
          )
        );
        
        // Show success message
        setSuccessMessage(
          translations[language].code 
            ? `Đã cập nhật loại container "${updatedContainerType.code}" thành công!`
            : `Successfully updated container type "${updatedContainerType.code}"!`
        );
        
        // Clear success message after 3 seconds
        setTimeout(() => {
          setSuccessMessage('');
        }, 3000);
        
        // Close modal and reset form
        setShowEditContainerTypeModal(false);
        setEditingContainerType(null);
        setContainerTypeErrorText('');
        setContainerTypeFormData({
          code: '',
          description: '',
          note: ''
        });

        // 2. Sau một khoảng thời gian ngắn, gọi lại loadContainerTypes để đồng bộ hoàn toàn
        //    với backend, đảm bảo dữ liệu chính xác, sắp xếp và phân trang đúng.
        setTimeout(() => {
          loadContainerTypes(containerTypesPagination.page, containerTypesPagination.limit);
        }, 100); // Độ trễ nhỏ để cho phép optimistic update render trước
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
          setContainerTypeErrorText(
            translations[language].code 
              ? `Mã loại container "${data.code}" đã tồn tại. Vui lòng chọn mã khác.`
              : `Container type code "${data.code}" already exists. Please choose a different code.`
          );
        } else if (errorMessage.toLowerCase().includes('validation')) {
          setContainerTypeErrorText(
            translations[language].code 
              ? 'Dữ liệu không hợp lệ. Vui lòng kiểm tra lại thông tin.'
              : 'Invalid data. Please check your information.'
          );
        } else {
          // Show detailed error message if available
          if (errorDetails && errorDetails.length > 0) {
            const detailMessages = errorDetails.map((d: any) => d.message).join(', ');
            setContainerTypeErrorText(detailMessages);
          } else {
            setContainerTypeErrorText(errorMessage || 'Failed to update container type');
          }
        }
      }
    } catch (error: any) {
      console.error('Error updating container type:', error);
      setContainerTypeErrorText(
        translations[language].code 
          ? 'Không thể cập nhật loại container. Vui lòng thử lại.'
          : 'Failed to update container type. Please try again.'
      );
    }
  };

  return {
    loadContainerTypes,
    handlePageChange,
    handleEditContainerType,
    handleDeleteContainerType,
    confirmDeleteContainerType,
    handleAddNewContainerType,
    handleSubmitContainerType,
    handleUpdateContainerType,
    handleContainerTypeFileUpload
  };
};
