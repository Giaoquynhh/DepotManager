import React, { useState, useEffect } from 'react';
import { useTranslation } from '../../../hooks/useTranslation';
import { requestService } from '../../../services/requests';
import { setupService } from '../../../services/setupService';

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

            const updateData = {
                container_no: formData.containerType, // This should be container number, not type
                shipping_line_id: shippingLineId,
                container_type_id: containerTypeId,
                customer_id: customerId,
                vehicle_company_id: transportCompanyId,
                vehicle_number: formData.vehicleNumber,
                driver_name: formData.driverName,
                driver_phone: formData.driverPhone,
                appointment_time: formData.appointmentTime ? new Date(formData.appointmentTime).toISOString() : null,
                appointment_note: formData.notes
            };

            await requestService.updateRequest(requestData.id, updateData);
            
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
