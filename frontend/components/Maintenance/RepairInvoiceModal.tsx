import React, { useState, useEffect } from 'react';
import { maintenanceApi } from '@services/maintenance';
import { useTranslation } from '@hooks/useTranslation';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

interface RepairInvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  repairTicket: any;
  onSuccess: () => void;
  onInvoiceCreated?: (repairTicketId: string) => void;
}

interface InventoryItem {
  id: string;
  name: string;
  uom: string;
  unit_price: number;
  qty_on_hand: number;
}

interface SelectedPart {
  inventory_item_id: string;
  quantity: number;
}

export default function RepairInvoiceModal({ isOpen, onClose, repairTicket, onSuccess, onInvoiceCreated }: RepairInvoiceModalProps) {
  const { t } = useTranslation();
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [selectedParts, setSelectedParts] = useState<SelectedPart[]>([]);
  const [laborCost, setLaborCost] = useState<string>('');
  const [problemDescription, setProblemDescription] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (isOpen) {
      loadInventoryItems();
      // Khởi tạo mô tả lỗi từ repair ticket
      setProblemDescription(repairTicket.problem_description || '');
    }
  }, [isOpen, repairTicket.problem_description]);

  const loadInventoryItems = async () => {
    try {
      const items = await maintenanceApi.listInventory();
      setInventoryItems(items);
    } catch (error: any) {
      setMessage('Lỗi tải danh sách phụ tùng: ' + error.message);
    }
  };

  const addPart = () => {
    setSelectedParts([...selectedParts, { inventory_item_id: '', quantity: 0 }]);
  };

  const removePart = (index: number) => {
    setSelectedParts(selectedParts.filter((_, i) => i !== index));
  };

  const updatePart = (index: number, field: keyof SelectedPart, value: any) => {
    const newParts = [...selectedParts];
    newParts[index] = { ...newParts[index], [field]: value };
    setSelectedParts(newParts);
  };

  const calculatePartsCost = () => {
    return selectedParts.reduce((total, part) => {
      const item = inventoryItems.find(i => i.id === part.inventory_item_id);
      return total + (item ? item.unit_price * part.quantity : 0);
    }, 0);
  };

  const calculateTotalCost = () => {
    return calculatePartsCost() + (Number(laborCost) || 0);
  };

  // Helper function để format số tiền với dấu phẩy
  const formatCurrency = (amount: number) => {
    return amount.toLocaleString('vi-VN');
  };

  // Helper function để format input số tiền
  const formatInputValue = (value: string) => {
    if (!value) return '';
    return Number(value).toLocaleString('vi-VN');
  };

  // Helper function để parse input số tiền (loại bỏ dấu phẩy)
  const parseInputValue = (value: string) => {
    return value.replace(/[^\d]/g, '');
  };

  // Helper function để xử lý text tiếng Việt - chuyển thành ASCII dễ đọc
  const cleanVietnameseText = (text: string): string => {
    return text
      .replace(/[àáạảãâầấậẩẫăằắặẳẵ]/g, 'a')
      .replace(/[èéẹẻẽêềếệểễ]/g, 'e')
      .replace(/[ìíịỉĩ]/g, 'i')
      .replace(/[òóọỏõôồốộổỗơờớợởỡ]/g, 'o')
      .replace(/[ùúụủũưừứựửữ]/g, 'u')
      .replace(/[ỳýỵỷỹ]/g, 'y')
      .replace(/[đ]/g, 'd')
      .replace(/[ÀÁẠẢÃÂẦẤẬẨẪĂẰẮẶẲẴ]/g, 'A')
      .replace(/[ÈÉẸẺẼÊỀẾỆỂỄ]/g, 'E')
      .replace(/[ÌÍỊỈĨ]/g, 'I')
      .replace(/[ÒÓỌỎÕÔỒỐỘỔỖƠỜỚỢỞỠ]/g, 'O')
      .replace(/[ÙÚỤỦŨƯỪỨỰỬỮ]/g, 'U')
      .replace(/[ỲÝỴỶỸ]/g, 'Y')
      .replace(/[Đ]/g, 'D');
  };

    const generatePDF = async () => {
    try {
      const doc = new jsPDF();
      
      // Sử dụng font hỗ trợ Unicode để hiển thị tiếng Việt
      doc.setFont('helvetica');
      
      // Header
      doc.setFontSize(20);
      doc.setFont('helvetica', 'bold');
      doc.text('HOA DON SUA CHUA', 105, 20, { align: 'center' });
      
      // Vẽ đường kẻ dưới header
      doc.setDrawColor(41, 128, 185);
      doc.setLineWidth(0.5);
      doc.line(20, 25, 190, 25);
      
      // Thông tin công ty
      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      doc.text('Smartlog Depot Management', 105, 30, { align: 'center' });
      doc.text('Dia chi: 123 Duong ABC, Quan XYZ, TP.HCM', 105, 37, { align: 'center' });
      doc.text('Dien thoai: 028-1234-5678 | Email: info@smartlog.com', 105, 44, { align: 'center' });
      
      // Thông tin phiếu
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('THONG TIN PHIEU SUA CHUA', 20, 60);
      
      // Vẽ khung cho thông tin phiếu
      doc.setDrawColor(200, 200, 200);
      doc.setLineWidth(0.2);
      doc.rect(18, 55, 174, 45);
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(`Ma phieu: ${repairTicket.code}`, 20, 70);
      doc.text(`Ma container: ${repairTicket.container_no || 'N/A'}`, 20, 77);
      doc.text(`Thoi gian tao: ${new Date(repairTicket.createdAt).toLocaleString('vi-VN')}`, 20, 84);
      // Xử lý text tiếng Việt để tránh lỗi font
      const cleanDescription = cleanVietnameseText(problemDescription);
      doc.text(`Mo ta loi: ${cleanDescription}`, 20, 91);
      
      // Chi phí công sửa chữa
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('CHI PHI CONG SUA CHUA', 20, 105);
      
      // Vẽ khung cho chi phí công
      doc.setDrawColor(200, 200, 200);
      doc.setLineWidth(0.2);
      doc.rect(18, 100, 174, 25);
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(`Chi phi cong: ${(Number(laborCost) || 0).toLocaleString('vi-VN')} VND`, 20, 115);
    
      // Table phụ tùng
      if (selectedParts.length > 0) {
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text('PHU TUNG SU DUNG', 20, 130);
        
        // Vẽ khung cho section phụ tùng
        doc.setDrawColor(200, 200, 200);
        doc.setLineWidth(0.2);
        doc.rect(18, 125, 174, 25);
        
        const tableData = selectedParts.map(part => {
          const item = inventoryItems.find(i => i.id === part.inventory_item_id);
          if (!item) return [];
          
          // Xử lý tên phụ tùng tiếng Việt
          const cleanItemName = cleanVietnameseText(item.name);
          
          return [
            cleanItemName + ' (' + item.uom + ')',
            item.unit_price.toLocaleString('vi-VN'),
            part.quantity.toString(),
            (item.unit_price * part.quantity).toLocaleString('vi-VN')
          ];
        }).filter(row => row.length > 0);
        
        (doc as any).autoTable({
          startY: 140,
          head: [['Ten phu tung', 'Don gia (VND)', 'So luong', 'Thanh tien (VND)']],
          body: tableData,
          theme: 'grid',
          headStyles: { 
            fillColor: [41, 128, 185], 
            textColor: 255,
            fontSize: 10,
            fontStyle: 'bold'
          },
          styles: { 
            fontSize: 9,
            cellPadding: 4,
            lineWidth: 0.1
          },
          columnStyles: {
            0: { cellWidth: 75, halign: 'left' },
            1: { cellWidth: 35, halign: 'center' },
            2: { cellWidth: 25, halign: 'center' },
            3: { cellWidth: 35, halign: 'right' }
          },
          margin: { top: 15, right: 20, bottom: 15, left: 20 },
          tableWidth: 170
        });
      }
      
      // Tổng kết chi phí
      const finalY = (doc as any).lastAutoTable.finalY + 10;
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('TONG KET CHI PHI', 20, finalY);
      
      // Vẽ khung cho section tổng kết
      doc.setDrawColor(200, 200, 200);
      doc.setLineWidth(0.2);
      doc.rect(18, finalY - 5, 174, 40);
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(`Chi phi phu tung: ${calculatePartsCost().toLocaleString('vi-VN')} VND`, 20, finalY + 10);
      doc.text(`Chi phi cong sua chua: ${(Number(laborCost) || 0).toLocaleString('vi-VN')} VND`, 20, finalY + 17);
      
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text(`TONG CHI PHI SUA CHUA: ${calculateTotalCost().toLocaleString('vi-VN')} VND`, 20, finalY + 27);
    
      // Footer
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.text(`Ngay xuat: ${new Date().toLocaleDateString('vi-VN')}`, 20, finalY + 40);
      doc.text('Chu ky nguoi lap:', 120, finalY + 40);
    
      // Tạo tên file đơn giản: ten_phieu.pdf
      const fileName = `${repairTicket.code}.pdf`;
      
      // Lưu file local trước
      doc.save(fileName);
      
      // Chuyển PDF thành base64 để upload lên backend
      const pdfOutput = doc.output('datauristring');
      const base64Data = pdfOutput.split(',')[1]; // Lấy phần base64 từ data URI
      
      // Upload lên backend
      try {
        await maintenanceApi.uploadRepairInvoicePDF(repairTicket.id, base64Data, fileName);
        setMessage('Đã xuất PDF và upload lên server thành công!');
      } catch (uploadError: any) {
        setMessage('Đã xuất PDF local nhưng lỗi khi upload lên server: ' + uploadError.message);
      }
      
      setTimeout(() => setMessage(''), 5000);
    } catch (error: any) {
      console.error('Lỗi khi tạo PDF:', error);
      setMessage('Lỗi khi tạo PDF: ' + error.message);
    }
  };

    const handleSubmit = async () => {
    if (selectedParts.length === 0) {
      setMessage('Vui lòng chọn ít nhất một phụ tùng');
      return;
    }

    // Kiểm tra tất cả phụ tùng đều có số lượng > 0
    for (const part of selectedParts) {
      if (part.quantity <= 0) {
        setMessage('Số lượng phụ tùng phải lớn hơn 0');
        return;
      }
    }

    if (Number(laborCost) < 0) {
      setMessage(t('pages.maintenance.repairs.repairInvoice.messages.laborCostCannotBeNegative'));
      return;
    }

    if (Number(laborCost) > 999999999) {
      setMessage(t('pages.maintenance.repairs.repairInvoice.messages.laborCostTooHigh'));
      return;
    }

    setLoading(true);
    setMessage('Đang tạo hóa đơn...');

    try {
      // Kiểm tra xem đây có phải là cập nhật hóa đơn hay tạo mới
      const isUpdate = repairTicket.status === 'PENDING_ACCEPT';
      
      if (isUpdate) {
        // Cập nhật hóa đơn hiện có
        const payload = {
          total_amount: calculateTotalCost(),
          labor_cost: Number(laborCost) || 0,
          problem_description: problemDescription,
          items: selectedParts.map(part => {
            const item = inventoryItems.find(i => i.id === part.inventory_item_id);
            return {
              inventory_item_id: part.inventory_item_id,
              quantity: part.quantity,
              description: item?.name || '',
              unit_price: item?.unit_price || 0,
              total_price: (item?.unit_price || 0) * part.quantity
            };
          })
        };

        await maintenanceApi.updateRepairInvoice(repairTicket.id, payload);
        setMessage('Đã cập nhật hóa đơn! Đang tạo PDF mới...');
      } else {
        // Tạo hóa đơn mới
        const payload = {
          repair_ticket_id: repairTicket.id,
          labor_cost: Number(laborCost) || 0,
          selected_parts: selectedParts
        };

        await maintenanceApi.createRepairInvoice(repairTicket.id, payload);
        setMessage('Đã tạo hóa đơn! Đang cập nhật trạng thái...');

        // Cập nhật trạng thái phiếu thành PENDING_ACCEPT
        await maintenanceApi.updateRepairStatus(repairTicket.id, 'PENDING_ACCEPT', 'Đã tạo hóa đơn sửa chữa');
        setMessage('Đã cập nhật trạng thái! Đang tạo PDF...');
      }

      // Tạo và upload PDF tự động
      await generateAndUploadPDF();

      const successMessage = isUpdate 
        ? 'Hoàn thành! Đã cập nhật hóa đơn và tạo PDF mới thành công!'
        : 'Hoàn thành! Đã tạo hóa đơn, cập nhật trạng thái và upload PDF thành công!';
      
      setMessage(successMessage);
      
      // Thông báo cho component cha biết hóa đơn đã được tạo/cập nhật
      if (onInvoiceCreated) {
        onInvoiceCreated(repairTicket.id);
      }
      
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 2000);
    } catch (error: any) {
      setMessage('Lỗi: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  // Function riêng để tạo và upload PDF
  const generateAndUploadPDF = async () => {
    try {
      const doc = new jsPDF();
      
      // Sử dụng font hỗ trợ Unicode để hiển thị tiếng Việt
      doc.setFont('helvetica');
      
      // Header
      doc.setFontSize(20);
      doc.setFont('helvetica', 'bold');
      doc.text('HOA DON SUA CHUA', 105, 20, { align: 'center' });
      
      // Vẽ đường kẻ dưới header
      doc.setDrawColor(41, 128, 185);
      doc.setLineWidth(0.5);
      doc.line(20, 25, 190, 25);
      
      // Thông tin công ty
      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      doc.text('Smartlog Depot Management', 105, 30, { align: 'center' });
      doc.text('Dia chi: 123 Duong ABC, Quan XYZ, TP.HCM', 105, 37, { align: 'center' });
      doc.text('Dien thoai: 028-1234-5678 | Email: info@smartlog.com', 105, 44, { align: 'center' });
      
      // Thông tin phiếu
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('THONG TIN PHIEU SUA CHUA', 20, 60);
      
      // Vẽ khung cho thông tin phiếu
      doc.setDrawColor(200, 200, 200);
      doc.setLineWidth(0.2);
      doc.rect(18, 55, 174, 45);
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(`Ma phieu: ${repairTicket.code}`, 20, 70);
      doc.text(`Ma container: ${repairTicket.container_no || 'N/A'}`, 20, 77);
      doc.text(`Thoi gian tao: ${new Date(repairTicket.createdAt).toLocaleString('vi-VN')}`, 20, 84);
      // Xử lý text tiếng Việt để tránh lỗi font
      const cleanDescription = cleanVietnameseText(problemDescription);
      doc.text(`Mo ta loi: ${cleanDescription}`, 20, 91);
      
      // Chi phí công sửa chữa
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('CHI PHI CONG SUA CHUA', 20, 105);
      
      // Vẽ khung cho chi phí công
      doc.setDrawColor(200, 200, 200);
      doc.setLineWidth(0.2);
      doc.rect(18, 100, 174, 25);
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(`Chi phi cong: ${(Number(laborCost) || 0).toLocaleString('vi-VN')} VND`, 20, 115);
    
      // Table phụ tùng
      if (selectedParts.length > 0) {
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text('PHU TUNG SU DUNG', 20, 130);
        
        // Vẽ khung cho section phụ tùng
        doc.setDrawColor(200, 200, 200);
        doc.setLineWidth(0.2);
        doc.rect(18, 125, 174, 25);
        
        const tableData = selectedParts.map(part => {
          const item = inventoryItems.find(i => i.id === part.inventory_item_id);
          if (!item) return [];
          
          // Xử lý tên phụ tùng tiếng Việt
          const cleanItemName = cleanVietnameseText(item.name);
          
          return [
            cleanItemName + ' (' + item.uom + ')',
            item.unit_price.toLocaleString('vi-VN'),
            part.quantity.toString(),
            (item.unit_price * part.quantity).toLocaleString('vi-VN')
          ];
        }).filter(row => row.length > 0);
        
        (doc as any).autoTable({
          startY: 140,
          head: [['Ten phu tung', 'Don gia (VND)', 'So luong', 'Thanh tien (VND)']],
          body: tableData,
          theme: 'grid',
          headStyles: { 
            fillColor: [41, 128, 185], 
            textColor: 255,
            fontSize: 10,
            fontStyle: 'bold'
          },
          styles: { 
            fontSize: 9,
            cellPadding: 4,
            lineWidth: 0.1
          },
          columnStyles: {
            0: { cellWidth: 75, halign: 'left' },
            1: { cellWidth: 35, halign: 'center' },
            2: { cellWidth: 25, halign: 'center' },
            3: { cellWidth: 35, halign: 'right' }
          },
          margin: { top: 15, right: 20, bottom: 15, left: 20 },
          tableWidth: 170
        });
      }
      
      // Tổng kết chi phí
      const finalY = (doc as any).lastAutoTable.finalY + 10;
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('TONG KET CHI PHI', 20, finalY);
      
      // Vẽ khung cho section tổng kết
      doc.setDrawColor(200, 200, 200);
      doc.setLineWidth(0.2);
      doc.rect(18, finalY - 5, 174, 40);
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(`Chi phi phu tung: ${calculatePartsCost().toLocaleString('vi-VN')} VND`, 20, finalY + 10);
      doc.text(`Chi phi cong sua chua: ${(Number(laborCost) || 0).toLocaleString('vi-VN')} VND`, 20, finalY + 17);
      
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text(`TONG CHI PHI SUA CHUA: ${calculateTotalCost().toLocaleString('vi-VN')} VND`, 20, finalY + 27);
    
      // Footer
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.text(`Ngay xuat: ${new Date().toLocaleDateString('vi-VN')}`, 20, finalY + 40);
      doc.text('Chu ky nguoi lap:', 120, finalY + 40);
    
      // Tạo tên file đơn giản: ten_phieu.pdf
      const fileName = `${repairTicket.code}.pdf`;
      
      // Lưu file local trước
      doc.save(fileName);
      
      // Chuyển PDF thành base64 để upload lên backend
      const pdfOutput = doc.output('datauristring');
      const base64Data = pdfOutput.split(',')[1]; // Lấy phần base64 từ data URI
      
      // Upload lên backend
      setMessage('Đang upload PDF lên server...');
      await maintenanceApi.uploadRepairInvoicePDF(repairTicket.id, base64Data, fileName);
      
    } catch (error: any) {
      console.error('Lỗi khi tạo PDF:', error);
      throw new Error('Lỗi khi tạo PDF: ' + error.message);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    }}>
      <div className="modal-content" style={{
        backgroundColor: 'white',
        borderRadius: '8px',
        padding: '24px',
        maxWidth: '800px',
        width: '90%',
        maxHeight: '90vh',
        overflow: 'auto'
      }}>
        <div className="modal-header" style={{
          display: 'flex',
          justifyContent: 'flex-start',
          alignItems: 'center',
          marginBottom: '20px',
          borderBottom: '1px solid #e5e7eb',
          paddingBottom: '16px'
        }}>
          <h2 style={{ margin: 0, color: '#1f2937' }}>
            {repairTicket.status === 'PENDING_ACCEPT' ? `✏️ ${t('pages.maintenance.repairs.repairInvoice.editTitle')}` : `📄 ${t('pages.maintenance.repairs.repairInvoice.title')}`}
          </h2>
        </div>

        <div className="modal-body">
          {/* Thông tin phiếu */}
          <div style={{ marginBottom: '20px', padding: '16px', backgroundColor: '#f9fafb', borderRadius: '8px' }}>
            <h3 style={{ margin: '0 0 12px 0', color: '#374151' }}>{t('pages.maintenance.repairs.repairInvoice.ticketInfo')}</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '12px', color: '#6b7280' }}>{t('pages.maintenance.repairs.repairInvoice.ticketCode')}</label>
                <div style={{ fontWeight: 'bold' }}>{repairTicket.code}</div>
              </div>
              <div>
                <label style={{ fontSize: '12px', color: '#6b7280' }}>{t('pages.maintenance.repairs.repairInvoice.containerCode')}</label>
                <div>{repairTicket.container_no || 'N/A'}</div>
              </div>
              <div>
                <label style={{ fontSize: '12px', color: '#6b7280' }}>{t('pages.maintenance.repairs.repairInvoice.creationTime')}</label>
                <div>{new Date(repairTicket.createdAt).toLocaleString('vi-VN')}</div>
              </div>
                             <div>
                 <label style={{ fontSize: '12px', color: '#6b7280' }}>{t('pages.maintenance.repairs.repairInvoice.errorDescription')}</label>
                 <textarea
                   value={problemDescription}
                   onChange={(e) => setProblemDescription(e.target.value)}
                   style={{
                     width: '100%',
                     padding: '8px',
                     border: '1px solid #d1d5db',
                     borderRadius: '4px',
                     fontSize: '14px',
                     minHeight: '60px',
                     resize: 'vertical',
                     fontFamily: 'inherit'
                   }}
                   placeholder={t('pages.maintenance.repairs.repairInvoice.errorDescription')}
                 />
               </div>
            </div>
          </div>

                     {/* Chi phí công sửa chữa */}
           <div style={{ marginBottom: '20px' }}>
             <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
               {t('pages.maintenance.repairs.repairInvoice.laborCost')}
               <span style={{ fontSize: '12px', color: '#6b7280', fontWeight: 'normal', marginLeft: '8px' }}>
                 (Ví dụ: 1,000,000)
               </span>
             </label>
             <input
               type="text"
               value={formatInputValue(laborCost)}
               onChange={(e) => {
                 const cleanValue = parseInputValue(e.target.value);
                 if (cleanValue === '' || /^\d+$/.test(cleanValue)) {
                   setLaborCost(cleanValue);
                 }
               }}
               onFocus={(e) => {
                 // Khi focus, hiển thị số thuần không có dấu phẩy để dễ chỉnh sửa
                 e.target.value = laborCost;
               }}
               onBlur={(e) => {
                 // Khi blur, format lại với dấu phẩy
                 e.target.value = formatInputValue(laborCost);
               }}
               style={{
                 width: '100%',
                 padding: '12px',
                 border: '1px solid #d1d5db',
                 borderRadius: '6px',
                 fontSize: '16px',
                 textAlign: 'right',
                 fontFamily: 'monospace',
                 letterSpacing: '0.5px'
               }}
               placeholder={t('pages.maintenance.repairs.repairInvoice.laborCostPlaceholder')}
             />
           </div>

          {/* Danh sách phụ tùng */}
          <div style={{ marginBottom: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <label style={{ fontWeight: 'bold' }}>{t('pages.maintenance.repairs.repairInvoice.partsUsed')}</label>
              <button
                onClick={addPart}
                style={{
                  backgroundColor: '#059669',
                  color: 'white',
                  border: 'none',
                  padding: '8px 16px',
                  borderRadius: '6px',
                  cursor: 'pointer'
                }}
              >
                + {t('pages.maintenance.repairs.repairInvoice.addPart')}
              </button>
            </div>

            {selectedParts.map((part, index) => (
              <div key={index} style={{
                display: 'grid',
                gridTemplateColumns: '2fr 1fr 1fr auto',
                gap: '12px',
                alignItems: 'center',
                padding: '12px',
                border: '1px solid #e5e7eb',
                borderRadius: '6px',
                marginBottom: '8px'
              }}>
                <select
                  value={part.inventory_item_id}
                  onChange={(e) => updatePart(index, 'inventory_item_id', e.target.value)}
                  style={{
                    padding: '8px',
                    border: '1px solid #d1d5db',
                    borderRadius: '4px'
                  }}
                >
                  <option value="">{t('pages.maintenance.repairs.repairInvoice.selectPart')}</option>
                  {inventoryItems.map(item => (
                    <option key={item.id} value={item.id}>
                      {item.name} ({item.uom}) - {item.unit_price.toLocaleString('vi-VN')} VND
                    </option>
                  ))}
                </select>

                                 <input
                   type="text"
                   value={part.quantity}
                   onChange={(e) => {
                     const value = e.target.value;
                     if (value === '' || /^\d+$/.test(value)) {
                       updatePart(index, 'quantity', Number(value) || 0);
                     }
                   }}
                   style={{
                     padding: '8px',
                     border: '1px solid #d1d5db',
                     borderRadius: '4px'
                   }}
                   placeholder={t('pages.maintenance.repairs.repairInvoice.enterQuantity')}
                 />

                <div style={{ fontSize: '14px', color: '#6b7280', fontWeight: 'bold', textAlign: 'right' }}>
                  {(() => {
                    const item = inventoryItems.find(i => i.id === part.inventory_item_id);
                    return item ? `${formatCurrency(item.unit_price * part.quantity)} VND` : '0 VND';
                  })()}
                </div>

                <button
                  onClick={() => removePart(index)}
                  style={{
                    backgroundColor: '#dc2626',
                    color: 'white',
                    border: 'none',
                    padding: '6px 12px',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                >
                  {t('pages.maintenance.repairs.repairInvoice.remove')}
                </button>
              </div>
            ))}
          </div>

                     {/* Table phụ tùng đã sử dụng */}
           {selectedParts.length > 0 && (
             <div style={{ marginBottom: '20px' }}>
               <h3 style={{ margin: '0 0 12px 0', color: '#374151' }}>{t('pages.maintenance.repairs.repairInvoice.partsUsedTable')}</h3>
               <div style={{
                 border: '1px solid #e5e7eb',
                 borderRadius: '8px',
                 overflow: 'hidden'
               }}>
                 <table style={{
                   width: '100%',
                   borderCollapse: 'collapse',
                   fontSize: '14px'
                 }}>
                   <thead>
                     <tr style={{
                       backgroundColor: '#f9fafb',
                       borderBottom: '1px solid #e5e7eb'
                     }}>
                       <th style={{
                         padding: '12px',
                         textAlign: 'left',
                         fontWeight: 'bold',
                         color: '#374151',
                         borderRight: '1px solid #e5e7eb'
                       }}>
                         {t('pages.maintenance.repairs.repairInvoice.partName')}
                       </th>
                       <th style={{
                         padding: '12px',
                         textAlign: 'center',
                         fontWeight: 'bold',
                         color: '#374151',
                         borderRight: '1px solid #e5e7eb'
                       }}>
                         {t('pages.maintenance.repairs.repairInvoice.unitPrice')}
                       </th>
                       <th style={{
                         padding: '12px',
                         textAlign: 'center',
                         fontWeight: 'bold',
                         color: '#374151',
                         borderRight: '1px solid #e5e7eb'
                       }}>
                         {t('pages.maintenance.repairs.repairInvoice.quantity')}
                       </th>
                       <th style={{
                         padding: '12px',
                         textAlign: 'right',
                         fontWeight: 'bold',
                         color: '#374151'
                       }}>
                         {t('pages.maintenance.repairs.repairInvoice.totalAmount')}
                       </th>
                     </tr>
                   </thead>
                   <tbody>
                     {selectedParts.map((part, index) => {
                       const item = inventoryItems.find(i => i.id === part.inventory_item_id);
                       if (!item) return null;
                       
                       return (
                         <tr key={index} style={{
                           borderBottom: '1px solid #f3f4f6'
                         }}>
                           <td style={{
                             padding: '12px',
                             borderRight: '1px solid #e5e7eb',
                             color: '#374151'
                           }}>
                             {item.name} ({item.uom})
                           </td>
                           <td style={{
                             padding: '12px',
                             textAlign: 'center',
                             borderRight: '1px solid #e5e7eb',
                             color: '#6b7280',
                             fontFamily: 'monospace'
                           }}>
                             {formatCurrency(item.unit_price)}
                           </td>
                           <td style={{
                             padding: '12px',
                             textAlign: 'center',
                             borderRight: '1px solid #e5e7eb',
                             color: '#6b7280'
                           }}>
                             {part.quantity}
                           </td>
                           <td style={{
                             padding: '12px',
                             textAlign: 'right',
                             fontWeight: 'bold',
                             color: '#059669',
                             fontFamily: 'monospace'
                           }}>
                             {formatCurrency(item.unit_price * part.quantity)}
                           </td>
                         </tr>
                       );
                     })}
                     <tr style={{
                       backgroundColor: '#f0f9ff',
                       borderTop: '2px solid #1e40af'
                     }}>
                       <td colSpan={3} style={{
                         padding: '12px',
                         textAlign: 'right',
                         fontWeight: 'bold',
                         color: '#1e40af',
                         borderRight: '1px solid #e5e7eb'
                       }}>
                         {t('pages.maintenance.repairs.repairInvoice.partsCost')}
                       </td>
                       <td style={{
                         padding: '12px',
                         textAlign: 'right',
                         fontWeight: 'bold',
                         fontSize: '16px',
                         color: '#1e40af',
                         fontFamily: 'monospace'
                       }}>
                         {formatCurrency(calculatePartsCost())} VND
                       </td>
                     </tr>
                   </tbody>
                 </table>
               </div>
             </div>
           )}

           {/* Tổng kết chi phí */}
           <div style={{
             padding: '16px',
             backgroundColor: '#f0f9ff',
             borderRadius: '8px',
             marginBottom: '20px'
           }}>
             <h3 style={{ margin: '0 0 12px 0', color: '#1e40af' }}>{t('pages.maintenance.repairs.repairInvoice.totalRepairCost')}</h3>
             <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
               <div>
                 <span style={{ color: '#6b7280' }}>{t('pages.maintenance.repairs.repairInvoice.partsCost')}</span>
                 <span style={{ float: 'right', fontWeight: 'bold', fontSize: '16px', fontFamily: 'monospace' }}>
                   {formatCurrency(calculatePartsCost())} VND
                 </span>
               </div>
               <div>
                 <span style={{ color: '#6b7280' }}>{t('pages.maintenance.repairs.repairInvoice.laborCostLabel')}</span>
                 <span style={{ float: 'right', fontWeight: 'bold', fontSize: '16px', fontFamily: 'monospace' }}>
                   {formatCurrency(Number(laborCost) || 0)} VND
                 </span>
               </div>
               <div style={{ gridColumn: '1 / -1', borderTop: '2px solid #1e40af', paddingTop: '12px', marginTop: '12px' }}>
                 <span style={{ color: '#1e40af', fontWeight: 'bold', fontSize: '18px' }}>{t('pages.maintenance.repairs.repairInvoice.totalRepairCost')}</span>
                 <span style={{ float: 'right', fontWeight: 'bold', fontSize: '20px', color: '#1e40af', fontFamily: 'monospace' }}>
                   {formatCurrency(calculateTotalCost())} VND
                 </span>
               </div>
             </div>
           </div>

          {/* Thông báo */}
          {message && (
            <div style={{
              padding: '12px',
              marginBottom: '16px',
              borderRadius: '6px',
              backgroundColor: message.includes('thành công') ? '#d1fae5' : '#fee2e2',
              color: message.includes('thành công') ? '#065f46' : '#991b1b',
              border: `1px solid ${message.includes('thành công') ? '#a7f3d0' : '#fecaca'}`
            }}>
              {message}
            </div>
          )}

                     {/* Nút hành động */}
           <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                           <button
                onClick={handleSubmit}
                disabled={loading}
                style={{
                  backgroundColor: '#3b82f6',
                  color: 'white',
                  border: 'none',
                  padding: '12px 24px',
                  borderRadius: '6px',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  opacity: loading ? 0.6 : 1,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                {loading ? `🔄 ${t('pages.maintenance.repairs.repairInvoice.processing')}` : (repairTicket.status === 'PENDING_ACCEPT' ? `✏️ ${t('pages.maintenance.repairs.repairInvoice.updateInvoicePDF')}` : `📄 ${t('pages.maintenance.repairs.repairInvoice.createInvoicePDF')}`)}
              </button>
             <button
               onClick={onClose}
               style={{
                 backgroundColor: '#6b7280',
                 color: 'white',
                 border: 'none',
                 padding: '12px 24px',
                 borderRadius: '6px',
                 cursor: 'pointer'
               }}
             >
               {t('pages.maintenance.repairs.repairInvoice.cancel')}
             </button>
           </div>
        </div>
      </div>
    </div>
  );
}
