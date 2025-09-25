import React, { useState, useEffect } from 'react';
import { useTranslation } from '../../../hooks/useTranslation';
import { requestService } from '../../../services/requests';
import { setupService } from '../../../services/setupService';
import { api } from '../../../services/api';

interface UpdateRequestModalProps {
    isOpen: boolean;
    onClose: () => void;
    onUpdate: () => void;
    requestData: {
        id: string;
        containerNo: string;
        requestNo: string;
        shippingLine: string;
        containerType: string;
        customer: string;
        transportCompany: string;
        vehicleNumber: string;
        driverName: string;
        driverPhone: string;
        appointmentTime: string;
        notes: string;
    } | null;
}

interface ShippingLine {
    id: string;
    code: string;
    name: string;
}

interface TransportCompany {
    id: string;
    code: string;
    name: string;
}

interface ContainerType {
    id: string;
    code: string;
    description: string;
}

interface Customer {
    id: string;
    name: string;
}

export const UpdateRequestModal: React.FC<UpdateRequestModalProps> = ({
    isOpen,
    onClose,
    onUpdate,
    requestData
}) => {
    const { t } = useTranslation();
    const [formData, setFormData] = useState({
        shippingLine: '',
        containerType: '',
        customer: '',
        transportCompany: '',
        vehicleNumber: '',
        driverName: '',
        driverPhone: '',
        appointmentTime: '',
        notes: ''
    });

    const [errors, setErrors] = useState<Record<string, string>>({});
    const [isLoading, setIsLoading] = useState(false);

    // File upload states
    const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
    const [previewUrls, setPreviewUrls] = useState<string[]>([]);
    const [existingFiles, setExistingFiles] = useState<Array<{ id: string; file_name: string; file_type: string; file_size: number; storage_url: string }>>([]);
    const [filesToDelete, setFilesToDelete] = useState<string[]>([]);

    // Dropdown data
    const [shippingLines, setShippingLines] = useState<ShippingLine[]>([]);
    const [transportCompanies, setTransportCompanies] = useState<TransportCompany[]>([]);
    const [containerTypes, setContainerTypes] = useState<ContainerType[]>([]);
    const [customers, setCustomers] = useState<Customer[]>([]);

    // Dropdown states
    const [isShippingLineOpen, setIsShippingLineOpen] = useState(false);
    const [isContainerTypeOpen, setIsContainerTypeOpen] = useState(false);
    const [isTransportCompanyOpen, setIsTransportCompanyOpen] = useState(false);
    const [isCustomerOpen, setIsCustomerOpen] = useState(false);

    // Search states
    const [shippingLineSearch, setShippingLineSearch] = useState('');
    const [containerTypeSearch, setContainerTypeSearch] = useState('');
    const [transportCompanySearch, setTransportCompanySearch] = useState('');
    const [customerSearch, setCustomerSearch] = useState('');

    // Load dropdown data
    useEffect(() => {
        const loadData = async () => {
            try {
                const [slRes, tcRes, ctRes, custRes] = await Promise.all([
                    setupService.getShippingLines({ page: 1, limit: 100 }),
                    setupService.getTransportCompanies({ page: 1, limit: 100 }),
                    setupService.getContainerTypes({ page: 1, limit: 100 }),
                    setupService.getCustomers()
                ]);

                if (slRes.success && slRes.data) setShippingLines(slRes.data.data);
                if (tcRes.success && tcRes.data) setTransportCompanies(tcRes.data.data);
                if (ctRes.success && ctRes.data) setContainerTypes(ctRes.data.data);
                if (custRes.success && custRes.data) setCustomers(custRes.data.data);
            } catch (error) {
                console.error('Error loading dropdown data:', error);
            }
        };

        if (isOpen) {
            loadData();
        }
    }, [isOpen]);

    // Populate form when requestData changes
    useEffect(() => {
        if (requestData) {
            setFormData({
                shippingLine: requestData.shippingLine,
                containerType: requestData.containerType,
                customer: requestData.customer,
                transportCompany: requestData.transportCompany,
                vehicleNumber: requestData.vehicleNumber,
                driverName: requestData.driverName,
                driverPhone: requestData.driverPhone,
                appointmentTime: requestData.appointmentTime ? new Date(requestData.appointmentTime).toISOString().slice(0, 16) : '',
                notes: requestData.notes
            });
        }
    }, [requestData]);

    // Reset file states when modal closes
    useEffect(() => {
        if (!isOpen) {
            setUploadedFiles([]);
            setPreviewUrls([]);
            setExistingFiles([]);
            setFilesToDelete([]);
            // Clean up preview URLs
            previewUrls.forEach(url => {
                if (url) {
                    URL.revokeObjectURL(url);
                }
            });
        }
    }, [isOpen, previewUrls]);

    // Close dropdowns when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as HTMLElement;
            if (!target.closest('.custom-dropdown-container')) {
                setIsShippingLineOpen(false);
                setIsContainerTypeOpen(false);
                setIsTransportCompanyOpen(false);
                setIsCustomerOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    // Load existing files when modal opens
    useEffect(() => {
        const loadExistingFiles = async () => {
            if (isOpen && requestData?.id) {
                try {
                    const response = await requestService.getFiles(requestData.id);
                    if (response.data?.success) {
                        setExistingFiles(response.data.data || []);
                    }
                } catch (error) {
                    console.error('Error loading existing files:', error);
                }
            }
        };

        loadExistingFiles();
    }, [isOpen, requestData?.id]);

    // File upload handlers
    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        const validFiles = files.filter(file => {
            const isValidType = file.type === 'application/pdf' || file.type.startsWith('image/');
            const isValidSize = file.size <= 10 * 1024 * 1024; // 10MB
            return isValidType && isValidSize;
        });

        setUploadedFiles(prev => [...prev, ...validFiles]);

        // Generate preview URLs for images
        validFiles.forEach(file => {
            if (file.type.startsWith('image/')) {
                const url = URL.createObjectURL(file);
                setPreviewUrls(prev => [...prev, url]);
            } else {
                setPreviewUrls(prev => [...prev, '']);
            }
        });
    };

    const handleFileRemove = (index: number) => {
        setUploadedFiles(prev => prev.filter((_, i) => i !== index));
        setPreviewUrls(prev => {
            const newUrls = [...prev];
            if (newUrls[index]) {
                URL.revokeObjectURL(newUrls[index]);
            }
            return newUrls.filter((_, i) => i !== index);
        });
    };

    const handleExistingFileRemove = (fileId: string) => {
        setFilesToDelete(prev => [...prev, fileId]);
        setExistingFiles(prev => prev.filter(file => file.id !== fileId));
    };

    const formatFileSize = (bytes: number) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    // Filter data based on search terms
    const filteredShippingLines = shippingLines.filter(sl => 
        sl.code.toLowerCase().includes(shippingLineSearch.toLowerCase()) ||
        sl.name.toLowerCase().includes(shippingLineSearch.toLowerCase())
    );

    const filteredContainerTypes = containerTypes.filter(ct => 
        ct.code.toLowerCase().includes(containerTypeSearch.toLowerCase()) ||
        ct.description.toLowerCase().includes(containerTypeSearch.toLowerCase())
    );

    const filteredTransportCompanies = transportCompanies.filter(tc => 
        tc.code.toLowerCase().includes(transportCompanySearch.toLowerCase()) ||
        tc.name.toLowerCase().includes(transportCompanySearch.toLowerCase())
    );

    const filteredCustomers = customers.filter(c => 
        c.name.toLowerCase().includes(customerSearch.toLowerCase())
    );

    const validateForm = () => {
        const newErrors: Record<string, string> = {};

        if (!formData.containerType.trim()) {
            newErrors.containerType = 'Loại container là bắt buộc';
        }
        if (!formData.customer.trim()) {
            newErrors.customer = 'Khách hàng là bắt buộc';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!validateForm() || !requestData) return;

        try {
            setIsLoading(true);

            // Find IDs for selected values
            const shippingLineId = shippingLines.find(sl => sl.name === formData.shippingLine)?.id || null;
            const containerTypeId = containerTypes.find(ct => ct.code === formData.containerType)?.id || null;
            const customerId = customers.find(c => c.name === formData.customer)?.id || null;
            const transportCompanyId = transportCompanies.find(tc => tc.name === formData.transportCompany)?.id || null;

            // First, delete files that need to be removed
            if (filesToDelete.length > 0) {
                console.log('Deleting files:', filesToDelete);
                for (const fileId of filesToDelete) {
                    try {
                        console.log('Deleting file:', fileId);
                        const result = await requestService.deleteFile(fileId);
                        console.log('Delete result:', result);
                    } catch (error) {
                        console.error('Error deleting file:', error);
                        // Continue with other operations even if one file deletion fails
                    }
                }
            }

            // Update request with new data and files using FormData
            const updateFormData = new FormData();
            
            // Add text fields
            updateFormData.append('container_no', requestData.containerNo);
            if (shippingLineId) updateFormData.append('shipping_line_id', shippingLineId);
            if (containerTypeId) updateFormData.append('container_type_id', containerTypeId);
            if (customerId) updateFormData.append('customer_id', customerId);
            if (transportCompanyId) updateFormData.append('vehicle_company_id', transportCompanyId);
            if (formData.vehicleNumber) updateFormData.append('license_plate', formData.vehicleNumber);
            if (formData.driverName) updateFormData.append('driver_name', formData.driverName);
            if (formData.driverPhone) updateFormData.append('driver_phone', formData.driverPhone);
            if (formData.appointmentTime) updateFormData.append('appointment_time', new Date(formData.appointmentTime).toISOString());
            if (formData.notes) updateFormData.append('notes', formData.notes);
            
            // Add new files
            if (uploadedFiles.length > 0) {
                uploadedFiles.forEach((file) => {
                    updateFormData.append('files', file);
                });
            }

            // Use direct API call with FormData
            const response = await api.patch(`/requests/${requestData.id}`, updateFormData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
            
            alert('Cập nhật thông tin thành công!');
            onUpdate();
            onClose();

        } catch (error: any) {
            console.error('Update request error:', error);
            alert('Có lỗi xảy ra khi cập nhật thông tin: ' + (error.response?.data?.message || error.message));
        } finally {
            setIsLoading(false);
        }
    };

    if (!isOpen || !requestData) return null;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>Cập nhật thông tin yêu cầu</h2>
                    <button className="modal-close" onClick={onClose}>×</button>
                </div>

                <form onSubmit={handleSubmit} className="modal-body">
                    <div className="form-group">
                        <label>Số container:</label>
                        <input 
                            type="text" 
                            value={requestData.containerNo} 
                            disabled 
                            className="form-input"
                        />
                    </div>

                    <div className="form-group">
                        <label>Số yêu cầu:</label>
                        <input 
                            type="text" 
                            value={requestData.requestNo} 
                            disabled 
                            className="form-input"
                        />
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label>Hãng tàu:</label>
                            <div className="custom-dropdown-container">
                                <input
                                    type="text"
                                    className="form-input"
                                    value={formData.shippingLine}
                                    onChange={(e) => {
                                        setFormData({...formData, shippingLine: e.target.value});
                                        setShippingLineSearch(e.target.value);
                                        setIsShippingLineOpen(true);
                                    }}
                                    onFocus={() => setIsShippingLineOpen(true)}
                                    placeholder="Chọn hãng tàu"
                                />
                                {isShippingLineOpen && (
                                    <div className="dropdown-menu">
                                        {filteredShippingLines.map(sl => (
                                            <div
                                                key={sl.id}
                                                className="dropdown-item"
                                                onClick={() => {
                                                    setFormData({...formData, shippingLine: sl.name});
                                                    setIsShippingLineOpen(false);
                                                }}
                                            >
                                                {sl.code} - {sl.name}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="form-group">
                            <label>Loại container:</label>
                            <div className="custom-dropdown-container">
                                <input
                                    type="text"
                                    className="form-input"
                                    value={formData.containerType}
                                    onChange={(e) => {
                                        setFormData({...formData, containerType: e.target.value});
                                        setContainerTypeSearch(e.target.value);
                                        setIsContainerTypeOpen(true);
                                    }}
                                    onFocus={() => setIsContainerTypeOpen(true)}
                                    placeholder="Chọn loại container"
                                />
                                {isContainerTypeOpen && (
                                    <div className="dropdown-menu">
                                        {filteredContainerTypes.map(ct => (
                                            <div
                                                key={ct.id}
                                                className="dropdown-item"
                                                onClick={() => {
                                                    setFormData({...formData, containerType: ct.code});
                                                    setIsContainerTypeOpen(false);
                                                }}
                                            >
                                                {ct.code} - {ct.description}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                            {errors.containerType && <span className="error-text">{errors.containerType}</span>}
                        </div>
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label>Khách hàng:</label>
                            <div className="custom-dropdown-container">
                                <input
                                    type="text"
                                    className="form-input"
                                    value={formData.customer}
                                    onChange={(e) => {
                                        setFormData({...formData, customer: e.target.value});
                                        setCustomerSearch(e.target.value);
                                        setIsCustomerOpen(true);
                                    }}
                                    onFocus={() => setIsCustomerOpen(true)}
                                    placeholder="Chọn khách hàng"
                                />
                                {isCustomerOpen && (
                                    <div className="dropdown-menu">
                                        {filteredCustomers.map(c => (
                                            <div
                                                key={c.id}
                                                className="dropdown-item"
                                                onClick={() => {
                                                    setFormData({...formData, customer: c.name});
                                                    setIsCustomerOpen(false);
                                                }}
                                            >
                                                {c.name}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                            {errors.customer && <span className="error-text">{errors.customer}</span>}
                        </div>

                        <div className="form-group">
                            <label>Nhà xe:</label>
                            <div className="custom-dropdown-container">
                                <input
                                    type="text"
                                    className="form-input"
                                    value={formData.transportCompany}
                                    onChange={(e) => {
                                        setFormData({...formData, transportCompany: e.target.value});
                                        setTransportCompanySearch(e.target.value);
                                        setIsTransportCompanyOpen(true);
                                    }}
                                    onFocus={() => setIsTransportCompanyOpen(true)}
                                    placeholder="Chọn nhà xe"
                                />
                                {isTransportCompanyOpen && (
                                    <div className="dropdown-menu">
                                        {filteredTransportCompanies.map(tc => (
                                            <div
                                                key={tc.id}
                                                className="dropdown-item"
                                                onClick={() => {
                                                    setFormData({...formData, transportCompany: tc.name});
                                                    setIsTransportCompanyOpen(false);
                                                }}
                                            >
                                                {tc.code} - {tc.name}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label>Số xe:</label>
                            <input
                                type="text"
                                className="form-input"
                                value={formData.vehicleNumber}
                                onChange={(e) => setFormData({...formData, vehicleNumber: e.target.value})}
                                placeholder="Nhập số xe"
                            />
                        </div>

                        <div className="form-group">
                            <label>Tên tài xế:</label>
                            <input
                                type="text"
                                className="form-input"
                                value={formData.driverName}
                                onChange={(e) => setFormData({...formData, driverName: e.target.value})}
                                placeholder="Nhập tên tài xế"
                            />
                        </div>
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label>SĐT tài xế:</label>
                            <input
                                type="tel"
                                className="form-input"
                                value={formData.driverPhone}
                                onChange={(e) => setFormData({...formData, driverPhone: e.target.value})}
                                placeholder="Nhập số điện thoại tài xế"
                            />
                        </div>

                        <div className="form-group">
                            <label>Thời gian hẹn:</label>
                            <input
                                type="datetime-local"
                                className="form-input"
                                value={formData.appointmentTime}
                                onChange={(e) => setFormData({...formData, appointmentTime: e.target.value})}
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label>Ghi chú:</label>
                        <textarea
                            className="form-textarea"
                            value={formData.notes}
                            onChange={(e) => setFormData({...formData, notes: e.target.value})}
                            placeholder="Nhập ghi chú (nếu có)"
                            rows={3}
                        />
                    </div>

                    {/* Chứng từ */}
                    <div className="form-group">
                        <label>Chứng từ:</label>
                        
                        {/* Existing files */}
                        {existingFiles.length > 0 && (
                            <div style={{ marginBottom: '16px' }}>
                                <h4 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '8px', color: '#374151' }}>
                                    Chứng từ hiện có:
                                </h4>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '12px' }}>
                                    {existingFiles.map((file) => (
                                        <div key={file.id} style={{ 
                                            border: '1px solid #e5e7eb', 
                                            borderRadius: '8px', 
                                            padding: '12px', 
                                            display: 'flex', 
                                            alignItems: 'center', 
                                            gap: '12px',
                                            backgroundColor: '#f9fafb'
                                        }}>
                                            {file.file_type === 'image' ? (
                                                <img 
                                                    src={file.storage_url} 
                                                    alt={file.file_name} 
                                                    style={{ 
                                                        width: 48, 
                                                        height: 48, 
                                                        objectFit: 'cover', 
                                                        borderRadius: '6px',
                                                        border: '1px solid #e5e7eb'
                                                    }} 
                                                />
                                            ) : (
                                                <div style={{ 
                                                    width: 48, 
                                                    height: 48, 
                                                    border: '1px solid #e5e7eb', 
                                                    borderRadius: '6px', 
                                                    display: 'flex', 
                                                    alignItems: 'center', 
                                                    justifyContent: 'center', 
                                                    color: '#64748b',
                                                    backgroundColor: '#fff'
                                                }}>
                                                    PDF
                                                </div>
                                            )}
                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                <div style={{ 
                                                    fontWeight: '600', 
                                                    color: '#111827', 
                                                    overflow: 'hidden', 
                                                    textOverflow: 'ellipsis', 
                                                    whiteSpace: 'nowrap',
                                                    fontSize: '12px'
                                                }}>
                                                    {file.file_name}
                                                </div>
                                                <div style={{ fontSize: '11px', color: '#6b7280' }}>
                                                    {formatFileSize(file.file_size)}
                                                </div>
                                                <a 
                                                    href={file.storage_url} 
                                                    target="_blank" 
                                                    rel="noreferrer" 
                                                    style={{ fontSize: '11px', color: '#3b82f6' }}
                                                >
                                                    Xem
                                                </a>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => handleExistingFileRemove(file.id)}
                                                style={{
                                                    background: 'none',
                                                    border: 'none',
                                                    color: '#ef4444',
                                                    cursor: 'pointer',
                                                    padding: '4px',
                                                    borderRadius: '4px'
                                                }}
                                                title="Xóa file"
                                            >
                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                    <line x1="18" y1="6" x2="6" y2="18"></line>
                                                    <line x1="6" y1="6" x2="18" y2="18"></line>
                                                </svg>
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* File upload area */}
                        <div className="file-upload-container" style={{
                            border: '2px dashed #d1d5db',
                            borderRadius: '8px',
                            padding: '24px',
                            textAlign: 'center',
                            backgroundColor: '#fafafa',
                            transition: 'all 0.2s ease'
                        }}>
                            <input
                                type="file"
                                multiple
                                accept=".pdf,.jpg,.jpeg,.png"
                                onChange={handleFileUpload}
                                style={{ display: 'none' }}
                                id="file-upload-update"
                            />
                            <label htmlFor="file-upload-update" style={{ cursor: 'pointer', display: 'block' }}>
                                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ margin: '0 auto 12px', color: '#64748b' }}>
                                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                                    <polyline points="14,2 14,8 20,8"></polyline>
                                    <line x1="16" y1="13" x2="8" y2="13"></line>
                                    <line x1="16" y1="17" x2="8" y2="17"></line>
                                    <polyline points="10,9 9,9 8,9"></polyline>
                                </svg>
                                <div style={{ fontSize: '16px', fontWeight: '600', color: '#374151', marginBottom: '4px' }}>
                                    Thêm chứng từ mới
                                </div>
                                <div style={{ fontSize: '14px', color: '#64748b' }}>
                                    Hỗ trợ PDF, JPG, PNG (tối đa 10MB mỗi file)
                                </div>
                            </label>
                        </div>

                        {/* New uploaded files */}
                        {uploadedFiles.length > 0 && (
                            <div style={{ marginTop: '16px' }}>
                                <h4 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '8px', color: '#374151' }}>
                                    Chứng từ mới:
                                </h4>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '12px' }}>
                                    {uploadedFiles.map((file, index) => (
                                        <div key={index} style={{ 
                                            border: '1px solid #e5e7eb', 
                                            borderRadius: '8px', 
                                            padding: '12px', 
                                            display: 'flex', 
                                            alignItems: 'center', 
                                            gap: '12px',
                                            backgroundColor: '#f0f9ff'
                                        }}>
                                            {file.type.startsWith('image/') && previewUrls[index] ? (
                                                <img 
                                                    src={previewUrls[index]} 
                                                    alt={file.name} 
                                                    style={{ 
                                                        width: 48, 
                                                        height: 48, 
                                                        objectFit: 'cover', 
                                                        borderRadius: '6px',
                                                        border: '1px solid #e5e7eb'
                                                    }} 
                                                />
                                            ) : (
                                                <div style={{ 
                                                    width: 48, 
                                                    height: 48, 
                                                    border: '1px solid #e5e7eb', 
                                                    borderRadius: '6px', 
                                                    display: 'flex', 
                                                    alignItems: 'center', 
                                                    justifyContent: 'center', 
                                                    color: '#64748b',
                                                    backgroundColor: '#fff'
                                                }}>
                                                    PDF
                                                </div>
                                            )}
                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                <div style={{ 
                                                    fontWeight: '600', 
                                                    color: '#111827', 
                                                    overflow: 'hidden', 
                                                    textOverflow: 'ellipsis', 
                                                    whiteSpace: 'nowrap',
                                                    fontSize: '12px'
                                                }}>
                                                    {file.name}
                                                </div>
                                                <div style={{ fontSize: '11px', color: '#6b7280' }}>
                                                    {formatFileSize(file.size)}
                                                </div>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => handleFileRemove(index)}
                                                style={{
                                                    background: 'none',
                                                    border: 'none',
                                                    color: '#ef4444',
                                                    cursor: 'pointer',
                                                    padding: '4px',
                                                    borderRadius: '4px'
                                                }}
                                                title="Xóa file"
                                            >
                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                    <line x1="18" y1="6" x2="6" y2="18"></line>
                                                    <line x1="6" y1="6" x2="18" y2="18"></line>
                                                </svg>
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="modal-actions">
                        <button type="button" className="btn btn-secondary" onClick={onClose}>
                            Hủy
                        </button>
                        <button type="submit" className="btn btn-primary" disabled={isLoading}>
                            {isLoading ? 'Đang cập nhật...' : 'Cập nhật'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
