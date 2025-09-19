import { setupService, ShippingLine } from '../../../services/setupService';
import { ShippingLineFormData } from '../components/AddShippingLineModal';

export const createShippingLineHandlers = (
  setShippingLines: React.Dispatch<React.SetStateAction<ShippingLine[]>>,
  setShippingLinesPagination: React.Dispatch<React.SetStateAction<{
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  }>>,
  setShowAddModal: React.Dispatch<React.SetStateAction<boolean>>,
  setShowEditModal: React.Dispatch<React.SetStateAction<boolean>>,
  setShowUploadModal: React.Dispatch<React.SetStateAction<boolean>>,
  setEditingShippingLine: React.Dispatch<React.SetStateAction<ShippingLine | null>>,
  setShippingLineFormData: React.Dispatch<React.SetStateAction<ShippingLineFormData>>,
  setErrorText: React.Dispatch<React.SetStateAction<string>>,
  setSuccessMessage: React.Dispatch<React.SetStateAction<string>>,
  shippingLines: ShippingLine[],
  shippingLinesPagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  },
  language: 'vi' | 'en',
  translations: any
) => {
  const loadShippingLines = async (page: number = 1, limit: number = 10) => {
    try {
      const response = await setupService.getShippingLines({ page, limit });
      if (response.success && response.data) {
        setShippingLines(response.data.data);
        setShippingLinesPagination({
          page: response.data.pagination.page,
          limit: response.data.pagination.limit,
          total: response.data.pagination.total,
          totalPages: response.data.pagination.totalPages
        });
      }
    } catch (error) {
      console.error('Error loading shipping lines:', error);
    }
  };

  const handlePageChange = (page: number) => {
    loadShippingLines(page, shippingLinesPagination.limit);
  };

  const handleEditShippingLine = (shippingLine: ShippingLine) => {
    setEditingShippingLine(shippingLine);
    setShippingLineFormData({
      code: shippingLine.code,
      name: shippingLine.name,
      eir: shippingLine.eir,
      note: shippingLine.note || ''
    });
    setErrorText('');
    setShowEditModal(true);
  };

  const handleDeleteShippingLine = async (id: string) => {
    if (window.confirm(
      translations[language].code 
        ? 'Bạn có chắc chắn muốn xóa hãng tàu này?' 
        : 'Are you sure you want to delete this shipping line?'
    )) {
      try {
        const response = await setupService.deleteShippingLine(id);
      if (response.success) {
        // Reload current page to refresh data
        loadShippingLines(shippingLinesPagination.page, shippingLinesPagination.limit);
        setSuccessMessage(
          translations[language].code 
            ? 'Đã xóa hãng tàu thành công!'
            : 'Shipping line deleted successfully!'
        );
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
          setErrorText(response.message || 'Failed to delete shipping line');
        }
      } catch (error) {
        console.error('Error deleting shipping line:', error);
        setErrorText('Failed to delete shipping line');
      }
    }
  };

  const handleAddNewShippingLine = () => {
    setShippingLineFormData({
      code: '',
      name: '',
      eir: '',
      note: ''
    });
    setErrorText('');
    setShowAddModal(true);
  };

  const handleSubmitShippingLine = async (data: ShippingLineFormData) => {
    // Wrap the entire function to prevent any errors from being thrown
    try {
      const response = await setupService.createShippingLine({
        code: data.code.trim(),
        name: data.name.trim(),
        eir: data.eir.trim(),
        note: data.note.trim()
      }).catch((error: any) => {
        // If setupService throws an error, catch it here and return error response
        console.error('Error in setupService.createShippingLine:', error);
        return {
          success: false,
          error: 'CREATE_ERROR',
          message: error.response?.data?.message || 'Failed to create shipping line',
          details: error.response?.data?.details
        };
      });

      if (response.success && 'data' in response && response.data) {
        // Reload first page to show new item
        loadShippingLines(1, shippingLinesPagination.limit);
    
        // Show success message
        setSuccessMessage(
          translations[language].code 
            ? `Đã thêm hãng tàu "${response.data.name}" thành công!`
            : `Successfully added shipping line "${response.data.name}"!`
        );
        
        // Clear success message after 3 seconds
        setTimeout(() => {
          setSuccessMessage('');
        }, 3000);
        
        // Close modal and reset form
        setShowAddModal(false);
        setErrorText('');
        setShippingLineFormData({
          code: '',
          name: '',
          eir: '',
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
          setErrorText(
            translations[language].code 
              ? `Mã hãng tàu "${data.code}" đã tồn tại. Vui lòng chọn mã khác.`
              : `Shipping line code "${data.code}" already exists. Please choose a different code.`
          );
        } else if (errorMessage.toLowerCase().includes('validation')) {
          setErrorText(
            translations[language].code 
              ? 'Dữ liệu không hợp lệ. Vui lòng kiểm tra lại thông tin.'
              : 'Invalid data. Please check your information.'
          );
        } else {
          // Show detailed error message if available
          if (errorDetails && errorDetails.length > 0) {
            const detailMessages = errorDetails.map((d: any) => d.message).join(', ');
            setErrorText(detailMessages);
          } else {
            setErrorText(errorMessage || 'Failed to create shipping line');
          }
        }
      }
    } catch (error: any) {
      console.error('Error creating shipping line:', error);
      // Prevent error from being thrown to avoid Next.js error overlay
      setErrorText(
        translations[language].code 
          ? 'Không thể tạo hãng tàu. Vui lòng thử lại.'
          : 'Failed to create shipping line. Please try again.'
      );
    }
  };

  const handleUpdateShippingLine = async (data: ShippingLineFormData, editingShippingLine: ShippingLine | null) => {
    if (!editingShippingLine) return;

    try {
      const response = await setupService.updateShippingLine(editingShippingLine.id, {
        code: data.code.trim(),
        name: data.name.trim(),
        eir: data.eir.trim(),
        note: data.note.trim()
      });

      if (response.success && response.data) {
        // Reload current page to refresh data
        loadShippingLines(shippingLinesPagination.page, shippingLinesPagination.limit);
        
        // Show success message
        setSuccessMessage(
          translations[language].code 
            ? `Đã cập nhật hãng tàu "${response.data.name}" thành công!`
            : `Successfully updated shipping line "${response.data.name}"!`
        );
        
        // Clear success message after 3 seconds
        setTimeout(() => {
          setSuccessMessage('');
        }, 3000);
        
        // Close modal and reset form
        setShowEditModal(false);
        setEditingShippingLine(null);
        setErrorText('');
        setShippingLineFormData({
          code: '',
          name: '',
          eir: '',
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
          setErrorText(
            translations[language].code 
              ? `Mã hãng tàu "${data.code}" đã tồn tại. Vui lòng chọn mã khác.`
              : `Shipping line code "${data.code}" already exists. Please choose a different code.`
          );
        } else if (errorMessage.toLowerCase().includes('validation')) {
          setErrorText(
            translations[language].code 
              ? 'Dữ liệu không hợp lệ. Vui lòng kiểm tra lại thông tin.'
              : 'Invalid data. Please check your information.'
          );
        } else {
          // Show detailed error message if available
          if (errorDetails && errorDetails.length > 0) {
            const detailMessages = errorDetails.map((d: any) => d.message).join(', ');
            setErrorText(detailMessages);
          } else {
            setErrorText(errorMessage || 'Failed to update shipping line');
          }
        }
      }
    } catch (error: any) {
      console.error('Error updating shipping line:', error);
      setErrorText(
        translations[language].code 
          ? 'Không thể cập nhật hãng tàu. Vui lòng thử lại.'
          : 'Failed to update shipping line. Please try again.'
      );
    }
  };

  const handleUploadExcel = () => {
    setShowUploadModal(true);
  };

  const handleFileUpload = async (files: File[]) => {
    try {
      // Import XLSX dynamically
      const XLSX = await import('xlsx');
      const newShippingLines: ShippingLine[] = [];
      const errors: string[] = [];

      for (const file of files) {
        const data = await file.arrayBuffer();
        const workbook = XLSX.read(data);
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        const rows = jsonData.slice(1) as string[][];

        rows.forEach((row, index) => {
          if (row.length >= 3 && row[0] && row[1] && row[2]) {
            const code = row[0].toString().trim();
            const name = row[1].toString().trim();
            const eir = row[2].toString().trim();
            const note = row[3] ? row[3].toString().trim() : '';

            const isDuplicate = shippingLines.some(sl => 
              sl.code.toLowerCase() === code.toLowerCase()
            ) || newShippingLines.some(sl => 
              sl.code.toLowerCase() === code.toLowerCase()
            );

            if (isDuplicate) {
              errors.push(`Dòng ${index + 2} (${file.name}): Mã hãng tàu "${code}" đã tồn tại`);
            } else {
              newShippingLines.push({
                id: code,
                code: code,
                name: name,
                eir: eir,
                note: note,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
              });
            }
          } else if (row.some(cell => cell && cell.toString().trim())) {
            errors.push(`Dòng ${index + 2} (${file.name}): Thiếu thông tin bắt buộc (Mã hãng tàu, Tên hãng tàu, EIR)`);
          }
        });
      }
      
      if (errors.length > 0) {
        setErrorText(`Lỗi trong file Excel:\n${errors.join('\n')}`);
        return;
      }
      
      if (newShippingLines.length === 0) {
        setErrorText('Không có dữ liệu hợp lệ trong file Excel');
        return;
      }
      
      // Prepare data for bulk create
      const shippingLinesData = newShippingLines.map(sl => ({
        code: sl.code,
        name: sl.name,
        eir: sl.eir,
        note: sl.note
      }));
      
      // Bulk create shipping lines
      const response = await setupService.bulkCreateShippingLines(shippingLinesData);
      
      if (response.success && response.data) {
        // Reload first page to show new items
        loadShippingLines(1, shippingLinesPagination.limit);
      
        // Show success message
        if (response.data.imported > 0) {
          setSuccessMessage(
            `Đã tải lên ${response.data.imported} hãng tàu thành công!`
          );
        }
        
        // Show error message for failed lines
        if (response.data.failed > 0) {
          const failedLines = response.data.results.failed.map(f => 
            `${f.data.code}: ${f.error}`
          );
          setErrorText(`Một số hãng tàu không thể lưu:\n${failedLines.join('\n')}`);
        }
      } else {
        setErrorText(response.message || 'Failed to upload shipping lines');
      }
      
      // Clear success message after 5 seconds
      setTimeout(() => {
        setSuccessMessage('');
      }, 5000);
      
      // Close modal
      setShowUploadModal(false);
      
    } catch (error: any) {
      console.error('Error parsing Excel file:', error);
      
      // Handle specific error cases
      if (error.response?.status === 400) {
        const errorMessage = error.response?.data?.message || '';
        if (errorMessage.toLowerCase().includes('duplicate') || errorMessage.toLowerCase().includes('already exists')) {
          setErrorText(
            translations[language].code 
              ? 'Một số mã hãng tàu trong file Excel đã tồn tại. Vui lòng kiểm tra và thử lại.'
              : 'Some shipping line codes in the Excel file already exist. Please check and try again.'
          );
        } else {
          setErrorText(errorMessage || 'Lỗi khi đọc file Excel. Vui lòng kiểm tra định dạng file.');
        }
      } else {
        setErrorText('Lỗi khi đọc file Excel. Vui lòng kiểm tra định dạng file.');
      }
    }
  };

  return {
    loadShippingLines,
    handlePageChange,
    handleEditShippingLine,
    handleDeleteShippingLine,
    handleAddNewShippingLine,
    handleSubmitShippingLine,
    handleUpdateShippingLine,
    handleUploadExcel,
    handleFileUpload
  };
};
