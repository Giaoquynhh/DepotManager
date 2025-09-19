import React, { useEffect, useState, useRef } from 'react';
import { useTranslation } from '../../../hooks/useTranslation';
import { setupService, type ShippingLine, type TransportCompany, type ContainerType } from '../../../services/setupService';
import { requestService } from '../../../services/requests';

interface CreateLowerRequestModalProps {
	isOpen: boolean;
	onClose: () => void;
	onSubmit: (data: LowerRequestData) => void;
}

export interface LowerRequestData {
	shippingLine: string;
	containerNumber: string;
	containerType: string;
	serviceType: string;
	customer: string;
	vehicleCompany?: string;
	vehicleNumber?: string;
	driver?: string;
	driverPhone?: string;
	appointmentTime?: string;
	documents?: File[];
	notes?: string;
}

export const CreateLowerRequestModal: React.FC<CreateLowerRequestModalProps> = ({
	isOpen,
	onClose,
	onSubmit
}) => {
	const { t } = useTranslation();
	const [formData, setFormData] = useState<LowerRequestData>({
		shippingLine: '',
		containerNumber: '',
		containerType: '',
		serviceType: 'Hạ container',
		customer: '',
		vehicleCompany: '',
		vehicleNumber: '',
		driver: '',
		driverPhone: '',
		appointmentTime: '',
		documents: [],
		notes: ''
	});

	const [errors, setErrors] = useState<Partial<LowerRequestData>>({});

	// Shipping lines (from Setup page)
	const [shippingLines, setShippingLines] = useState<ShippingLine[]>([]);
	const [selectedShippingLineName, setSelectedShippingLineName] = useState<string>('');
	// Transport companies (Nhà xe)
	const [transportCompanies, setTransportCompanies] = useState<TransportCompany[]>([]);
	const [selectedTransportCompanyName, setSelectedTransportCompanyName] = useState<string>('');
	// Container types (from Setup page)
	const [containerTypes, setContainerTypes] = useState<ContainerType[]>([]);

	// Custom dropdown states
	const [isShippingLineOpen, setIsShippingLineOpen] = useState(false);
	const [isContainerTypeOpen, setIsContainerTypeOpen] = useState(false);
	const [isTransportCompanyOpen, setIsTransportCompanyOpen] = useState(false);
	
	// Search states
	const [shippingLineSearch, setShippingLineSearch] = useState('');
	const [containerTypeSearch, setContainerTypeSearch] = useState('');
	const [transportCompanySearch, setTransportCompanySearch] = useState('');
	
	// File upload states
	const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
	const [isUploading, setIsUploading] = useState(false);

	useEffect(() => {
		(async () => {
			try {
				const [slRes, tcRes, ctRes] = await Promise.all([
					setupService.getShippingLines({ page: 1, limit: 100 }),
					setupService.getTransportCompanies({ page: 1, limit: 100 }),
					setupService.getContainerTypes({ page: 1, limit: 100 })
				]);
				if (slRes.success && slRes.data) setShippingLines(slRes.data.data);
				if (tcRes.success && tcRes.data) setTransportCompanies(tcRes.data.data);
				if (ctRes.success && ctRes.data) setContainerTypes(ctRes.data.data);
			} catch (_) {}
		})();
	}, []);

	// Close dropdowns when clicking outside
	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			const target = event.target as HTMLElement;
			if (!target.closest('.custom-dropdown-container')) {
				setIsShippingLineOpen(false);
				setIsContainerTypeOpen(false);
				setIsTransportCompanyOpen(false);
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

	// File upload handlers
	const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
		const files = event.target.files;
		if (files) {
			const newFiles = Array.from(files).filter(file => {
				const isValidType = file.type === 'application/pdf' || 
					file.type.startsWith('image/');
				const isValidSize = file.size <= 10 * 1024 * 1024; // 10MB limit
				return isValidType && isValidSize;
			});
			
			setUploadedFiles(prev => [...prev, ...newFiles]);
			setFormData(prev => ({
				...prev,
				documents: [...(prev.documents || []), ...newFiles]
			}));
		}
	};

	const handleFileRemove = (index: number) => {
		setUploadedFiles(prev => prev.filter((_, i) => i !== index));
		setFormData(prev => ({
			...prev,
			documents: prev.documents?.filter((_, i) => i !== index) || []
		}));
	};

	const formatFileSize = (bytes: number) => {
		if (bytes === 0) return '0 Bytes';
		const k = 1024;
		const sizes = ['Bytes', 'KB', 'MB', 'GB'];
		const i = Math.floor(Math.log(bytes) / Math.log(k));
		return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
	};

	const handleInputChange = (field: keyof LowerRequestData, value: string) => {
		setFormData(prev => ({
			...prev,
			[field]: value
		}));
		
		// Clear error when user starts typing
		if (errors[field]) {
			setErrors(prev => ({
				...prev,
				[field]: undefined
			}));
		}
	};

	const validateForm = (): boolean => {
		const newErrors: Partial<LowerRequestData> = {};

		if (!formData.shippingLine.trim()) {
			newErrors.shippingLine = 'Hãng tàu là bắt buộc';
		}
		if (!formData.containerNumber.trim()) {
			newErrors.containerNumber = 'Số container là bắt buộc';
		}
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
		
		if (validateForm()) {
			try {
				setIsUploading(true);
				
				// Prepare data for API
				const requestData = {
					type: 'EXPORT',
					container_no: formData.containerNumber,
					eta: formData.appointmentTime,
					shipping_line_id: formData.shippingLine,
					container_type_id: formData.containerType,
					customer_id: formData.customer,
					vehicle_company_id: formData.vehicleCompany,
					vehicle_number: formData.vehicleNumber,
					driver_name: formData.driver,
					driver_phone: formData.driverPhone,
					appointment_time: formData.appointmentTime,
					notes: formData.notes,
					files: formData.documents || []
				};

				// Call API to create request with files
				const response = await requestService.createRequest(requestData);
				
				if (response.data.success) {
					// Success - call parent onSubmit with response data
					onSubmit(formData);
					
					// Reset form
					setFormData({
						shippingLine: '',
						containerNumber: '',
						containerType: '',
						serviceType: 'Hạ container',
						customer: '',
						vehicleCompany: '',
						vehicleNumber: '',
						driver: '',
						driverPhone: '',
						appointmentTime: '',
						documents: [],
						notes: ''
					});
					setUploadedFiles([]);
					onClose();
				} else {
					alert('Có lỗi xảy ra: ' + response.data.message);
				}
			} catch (error: any) {
				console.error('Create request error:', error);
				alert('Có lỗi xảy ra khi tạo yêu cầu: ' + (error.response?.data?.message || error.message));
			} finally {
				setIsUploading(false);
			}
		}
	};

	const handleClose = () => {
		setErrors({});
		setIsShippingLineOpen(false);
		setIsContainerTypeOpen(false);
		setIsTransportCompanyOpen(false);
		setShippingLineSearch('');
		setContainerTypeSearch('');
		setTransportCompanySearch('');
		setUploadedFiles([]);
		onClose();
	};

	if (!isOpen) return null;

	const formGroupStyle = {
		display: 'flex',
		flexDirection: 'column' as const
	};

	const formLabelStyle = {
		fontSize: '14px',
		fontWeight: '600',
		color: '#374151',
		marginBottom: '6px',
		display: 'flex',
		alignItems: 'center',
		gap: '4px'
	};

	const requiredLabelStyle = {
		...formLabelStyle,
		color: '#1e293b'
	};

	const requiredAsteriskStyle = {
		color: '#ef4444',
		fontWeight: '700'
	};

	const formInputStyle = {
		padding: '12px 16px',
		border: '2px solid #e2e8f0',
		borderRadius: '8px',
		fontSize: '14px',
		color: '#374151',
		background: 'white',
		transition: 'all 0.2s ease',
		outline: 'none'
	};

	const formInputErrorStyle = {
		...formInputStyle,
		borderColor: '#ef4444',
		boxShadow: '0 0 0 3px rgba(239, 68, 68, 0.1)'
	};

	const formSelectStyle = {
		...formInputStyle,
		cursor: 'pointer'
	};

	const formSelectErrorStyle = {
		...formSelectStyle,
		borderColor: '#ef4444',
		boxShadow: '0 0 0 3px rgba(239, 68, 68, 0.1)'
	};

	const errorMessageStyle = {
		fontSize: '12px',
		color: '#ef4444',
		marginTop: '4px',
		fontWeight: '500'
	};

	const fullWidthStyle = {
		...formGroupStyle,
		gridColumn: '1 / -1'
	};

	// Custom scrollbar styles for dropdowns
	const dropdownScrollbarStyle = `
		.custom-dropdown-container {
			position: relative;
		}
		.custom-dropdown-button {
			width: 100%;
			text-align: left;
			background: white;
			border: 2px solid #e2e8f0;
			border-radius: 8px;
			padding: 12px 16px;
			font-size: 14px;
			color: #374151;
			cursor: pointer;
			transition: all 0.2s ease;
			outline: none;
			display: flex;
			justify-content: space-between;
			align-items: center;
		}
		.custom-dropdown-button:hover {
			border-color: #cbd5e1;
		}
		.custom-dropdown-button:focus {
			border-color: #3b82f6;
			box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
		}
		.custom-dropdown-button.error {
			border-color: #ef4444;
			box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1);
		}
		.custom-dropdown-arrow {
			transition: transform 0.2s ease;
		}
		.custom-dropdown-arrow.open {
			transform: rotate(180deg);
		}
		.custom-dropdown-list {
			position: absolute;
			top: 100%;
			left: 0;
			right: 0;
			background: white;
			border: 2px solid #e2e8f0;
			border-top: none;
			border-radius: 0 0 8px 8px;
			max-height: 200px;
			overflow-y: auto;
			z-index: 1000;
			box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
		}
		.custom-dropdown-list::-webkit-scrollbar {
			width: 8px;
		}
		.custom-dropdown-list::-webkit-scrollbar-track {
			background: #f1f5f9;
			border-radius: 4px;
		}
		.custom-dropdown-list::-webkit-scrollbar-thumb {
			background: #cbd5e1;
			border-radius: 4px;
		}
		.custom-dropdown-list::-webkit-scrollbar-thumb:hover {
			background: #94a3b8;
		}
		.custom-dropdown-option {
			padding: 12px 16px;
			cursor: pointer;
			transition: background-color 0.2s ease;
			border-bottom: 1px solid #f1f5f9;
		}
		.custom-dropdown-option:hover {
			background-color: #f8fafc;
		}
		.custom-dropdown-option:last-child {
			border-bottom: none;
		}
		.custom-dropdown-search {
			padding: 8px 12px;
			border: none;
			border-bottom: 1px solid #e2e8f0;
			width: 100%;
			font-size: 14px;
			outline: none;
			background: #f8fafc;
		}
		.custom-dropdown-search:focus {
			background: white;
			border-bottom-color: #3b82f6;
		}
		.custom-dropdown-no-results {
			padding: 12px 16px;
			color: #64748b;
			font-style: italic;
			text-align: center;
		}
		.file-upload-container {
			border: 2px dashed #cbd5e1;
			border-radius: 8px;
			padding: 20px;
			text-align: center;
			background: #f8fafc;
			transition: all 0.2s ease;
			cursor: pointer;
		}
		.file-upload-container:hover {
			border-color: #3b82f6;
			background: #eff6ff;
		}
		.file-upload-container.dragover {
			border-color: #3b82f6;
			background: #eff6ff;
		}
		.file-list {
			margin-top: 12px;
		}
		.file-item {
			display: flex;
			align-items: center;
			justify-content: space-between;
			padding: 8px 12px;
			background: white;
			border: 1px solid #e2e8f0;
			border-radius: 6px;
			margin-bottom: 8px;
		}
		.file-info {
			display: flex;
			align-items: center;
			gap: 8px;
		}
		.file-icon {
			width: 20px;
			height: 20px;
		}
		.file-name {
			font-size: 14px;
			color: #374151;
			font-weight: 500;
		}
		.file-size {
			font-size: 12px;
			color: #64748b;
		}
		.file-remove {
			background: none;
			border: none;
			color: #ef4444;
			cursor: pointer;
			padding: 4px;
			border-radius: 4px;
			transition: background-color 0.2s ease;
		}
		.file-remove:hover {
			background: #fef2f2;
		}
	`;

	return (
		<>
			<style>{dropdownScrollbarStyle}</style>
			<div 
				style={{
					position: 'fixed',
					top: 0,
					left: 0,
					right: 0,
					bottom: 0,
					background: 'rgba(0, 0, 0, 0.5)',
					backdropFilter: 'blur(4px)',
					display: 'flex',
					alignItems: 'center',
					justifyContent: 'center',
					zIndex: 1000,
					padding: '20px'
				}}
				onClick={handleClose}
			>
			<div 
				style={{
					background: 'white',
					borderRadius: '16px',
					boxShadow: '0 25px 50px rgba(0, 0, 0, 0.25)',
					maxWidth: '800px',
					width: '100%',
					maxHeight: '90vh',
					overflowY: 'auto'
				}}
				onClick={(e) => e.stopPropagation()}
			>
				{/* Header */}
				<div style={{
					display: 'flex',
					alignItems: 'center',
					justifyContent: 'space-between',
					padding: '24px 24px 0 24px',
					borderBottom: '1px solid #e2e8f0',
					paddingBottom: '20px',
					marginBottom: '24px'
				}}>
					<h2 style={{
						fontSize: '24px',
						fontWeight: '700',
						color: '#1e293b',
						margin: 0
					}}>Tạo yêu cầu hạ container</h2>
					<button 
						style={{
							background: 'none',
							border: 'none',
							cursor: 'pointer',
							padding: '8px',
							borderRadius: '8px',
							color: '#64748b',
							transition: 'all 0.2s ease'
						}}
						onClick={handleClose}
					>
						<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
							<path d="M18 6L6 18M6 6l12 12"/>
						</svg>
					</button>
				</div>

				{/* Form */}
				<form 
					onSubmit={handleSubmit} 
					style={{ padding: '0 24px 24px 24px' }}
				>
					<div style={{
						display: 'grid',
						gridTemplateColumns: '1fr 1fr',
						gap: '20px',
						marginBottom: '24px'
					}}>
						{/* Hãng tàu - Required */}
						<div style={formGroupStyle}>
							<label style={requiredLabelStyle}>
								Hãng tàu <span style={requiredAsteriskStyle}>*</span>
							</label>
							<div className="custom-dropdown-container">
								<button
									type="button"
									className={`custom-dropdown-button ${errors.shippingLine ? 'error' : ''}`}
									onClick={() => {
										setIsShippingLineOpen(!isShippingLineOpen);
										if (!isShippingLineOpen) {
											setShippingLineSearch('');
										}
									}}
								>
									<span>
										{formData.shippingLine 
											? `${shippingLines.find(s => s.id === formData.shippingLine)?.code} - ${shippingLines.find(s => s.id === formData.shippingLine)?.name}`
											: 'Chọn hãng tàu'
										}
									</span>
									<svg 
										className={`custom-dropdown-arrow ${isShippingLineOpen ? 'open' : ''}`}
										width="16" 
										height="16" 
										viewBox="0 0 24 24" 
										fill="none" 
										stroke="currentColor" 
										strokeWidth="2"
									>
										<polyline points="6,9 12,15 18,9"></polyline>
									</svg>
								</button>
								{isShippingLineOpen && (
									<div className="custom-dropdown-list">
										<input
											type="text"
											className="custom-dropdown-search"
											placeholder="Tìm kiếm hãng tàu..."
											value={shippingLineSearch}
											onChange={(e) => setShippingLineSearch(e.target.value)}
											onClick={(e) => e.stopPropagation()}
										/>
										{filteredShippingLines.length > 0 ? (
											filteredShippingLines.map(sl => (
												<div
													key={sl.id}
													className="custom-dropdown-option"
													onClick={() => {
														handleInputChange('shippingLine', sl.id);
														setSelectedShippingLineName(sl.name);
														setIsShippingLineOpen(false);
														setShippingLineSearch('');
													}}
												>
													{`${sl.code} - ${sl.name}`}
												</div>
											))
										) : (
											<div className="custom-dropdown-no-results">
												Không tìm thấy hãng tàu nào
											</div>
										)}
									</div>
								)}
							</div>
							{selectedShippingLineName && (
								<small style={{ color: '#64748b', marginTop: '6px' }}>Tên hãng tàu: {selectedShippingLineName}</small>
							)}
							{errors.shippingLine && <span style={errorMessageStyle}>{errors.shippingLine}</span>}
						</div>

						{/* Số container - Required */}
						<div style={formGroupStyle}>
							<label style={requiredLabelStyle}>
								Số container <span style={requiredAsteriskStyle}>*</span>
							</label>
							<input
								type="text"
								style={errors.containerNumber ? formInputErrorStyle : formInputStyle}
								value={formData.containerNumber}
								onChange={(e) => handleInputChange('containerNumber', e.target.value)}
								placeholder="Nhập số container"
							/>
							{errors.containerNumber && <span style={errorMessageStyle}>{errors.containerNumber}</span>}
						</div>

						{/* Loại container - Required (id mapping, display code + description) */}
						<div style={formGroupStyle}>
							<label style={requiredLabelStyle}>
								Loại container <span style={requiredAsteriskStyle}>*</span>
							</label>
							<div className="custom-dropdown-container">
								<button
									type="button"
									className={`custom-dropdown-button ${errors.containerType ? 'error' : ''}`}
									onClick={() => {
										setIsContainerTypeOpen(!isContainerTypeOpen);
										if (!isContainerTypeOpen) {
											setContainerTypeSearch('');
										}
									}}
								>
									<span>
										{formData.containerType 
											? `${containerTypes.find(ct => ct.id === formData.containerType)?.code} - ${containerTypes.find(ct => ct.id === formData.containerType)?.description}`
											: 'Chọn loại container'
										}
									</span>
									<svg 
										className={`custom-dropdown-arrow ${isContainerTypeOpen ? 'open' : ''}`}
										width="16" 
										height="16" 
										viewBox="0 0 24 24" 
										fill="none" 
										stroke="currentColor" 
										strokeWidth="2"
									>
										<polyline points="6,9 12,15 18,9"></polyline>
									</svg>
								</button>
								{isContainerTypeOpen && (
									<div className="custom-dropdown-list">
										<input
											type="text"
											className="custom-dropdown-search"
											placeholder="Tìm kiếm loại container..."
											value={containerTypeSearch}
											onChange={(e) => setContainerTypeSearch(e.target.value)}
											onClick={(e) => e.stopPropagation()}
										/>
										{filteredContainerTypes.length > 0 ? (
											filteredContainerTypes.map(ct => (
												<div
													key={ct.id}
													className="custom-dropdown-option"
													onClick={() => {
														handleInputChange('containerType', ct.id);
														setIsContainerTypeOpen(false);
														setContainerTypeSearch('');
													}}
												>
													{`${ct.code} - ${ct.description}`}
												</div>
											))
										) : (
											<div className="custom-dropdown-no-results">
												Không tìm thấy loại container nào
											</div>
										)}
									</div>
								)}
							</div>
							{errors.containerType && <span style={errorMessageStyle}>{errors.containerType}</span>}
						</div>

						{/* Loại dịch vụ - Required */}
						<div style={formGroupStyle}>
							<label style={requiredLabelStyle}>
								Loại dịch vụ <span style={requiredAsteriskStyle}>*</span>
							</label>
							<input
								type="text"
								style={{
									...formInputStyle,
									backgroundColor: '#f8f9fa',
									cursor: 'not-allowed'
								}}
								value={formData.serviceType}
								readOnly
							/>
						</div>

						{/* Khách hàng - Required */}
						<div style={formGroupStyle}>
							<label style={requiredLabelStyle}>
								Khách hàng <span style={requiredAsteriskStyle}>*</span>
							</label>
							<input
								type="text"
								style={errors.customer ? formInputErrorStyle : formInputStyle}
								value={formData.customer}
								onChange={(e) => handleInputChange('customer', e.target.value)}
								placeholder="Nhập tên khách hàng"
							/>
							{errors.customer && <span style={errorMessageStyle}>{errors.customer}</span>}
						</div>

						{/* Nhà xe - Optional (id mapping, display code + name) */}
						<div style={formGroupStyle}>
							<label style={formLabelStyle}>
								Nhà xe
							</label>
							<div className="custom-dropdown-container">
								<button
									type="button"
									className="custom-dropdown-button"
									onClick={() => {
										setIsTransportCompanyOpen(!isTransportCompanyOpen);
										if (!isTransportCompanyOpen) {
											setTransportCompanySearch('');
										}
									}}
								>
									<span>
										{formData.vehicleCompany 
											? `${transportCompanies.find(tc => tc.id === formData.vehicleCompany)?.code} - ${transportCompanies.find(tc => tc.id === formData.vehicleCompany)?.name}`
											: 'Chọn nhà xe'
										}
									</span>
									<svg 
										className={`custom-dropdown-arrow ${isTransportCompanyOpen ? 'open' : ''}`}
										width="16" 
										height="16" 
										viewBox="0 0 24 24" 
										fill="none" 
										stroke="currentColor" 
										strokeWidth="2"
									>
										<polyline points="6,9 12,15 18,9"></polyline>
									</svg>
								</button>
								{isTransportCompanyOpen && (
									<div className="custom-dropdown-list">
										<input
											type="text"
											className="custom-dropdown-search"
											placeholder="Tìm kiếm nhà xe..."
											value={transportCompanySearch}
											onChange={(e) => setTransportCompanySearch(e.target.value)}
											onClick={(e) => e.stopPropagation()}
										/>
										{filteredTransportCompanies.length > 0 ? (
											filteredTransportCompanies.map(tc => (
												<div
													key={tc.id}
													className="custom-dropdown-option"
													onClick={() => {
														handleInputChange('vehicleCompany', tc.id);
														setSelectedTransportCompanyName(tc.name);
														setIsTransportCompanyOpen(false);
														setTransportCompanySearch('');
													}}
												>
													{`${tc.code} - ${tc.name}`}
												</div>
											))
										) : (
											<div className="custom-dropdown-no-results">
												Không tìm thấy nhà xe nào
											</div>
										)}
									</div>
								)}
							</div>
							{selectedTransportCompanyName && (
								<small style={{ color: '#64748b', marginTop: '6px' }}>Tên nhà xe: {selectedTransportCompanyName}</small>
							)}
						</div>

						{/* Số xe - Optional */}
						<div style={formGroupStyle}>
							<label style={formLabelStyle}>
								Số xe
							</label>
							<input
								type="text"
								style={formInputStyle}
								value={formData.vehicleNumber}
								onChange={(e) => handleInputChange('vehicleNumber', e.target.value)}
								placeholder="Nhập số xe"
							/>
						</div>

						{/* Tài xế - Optional */}
						<div style={formGroupStyle}>
							<label style={formLabelStyle}>
								Tài xế
							</label>
							<input
								type="text"
								style={formInputStyle}
								value={formData.driver}
								onChange={(e) => handleInputChange('driver', e.target.value)}
								placeholder="Nhập tên tài xế"
							/>
						</div>

						{/* SDT Tài xế - Optional */}
						<div style={formGroupStyle}>
							<label style={formLabelStyle}>
								SĐT Tài xế
							</label>
							<input
								type="tel"
								style={formInputStyle}
								value={formData.driverPhone}
								onChange={(e) => handleInputChange('driverPhone', e.target.value)}
								placeholder="Nhập số điện thoại tài xế"
							/>
						</div>

						{/* Thời gian hẹn - Optional */}
						<div style={formGroupStyle}>
							<label style={formLabelStyle}>
								Thời gian hẹn
							</label>
							<input
								type="datetime-local"
								style={formInputStyle}
								value={formData.appointmentTime}
								onChange={(e) => handleInputChange('appointmentTime', e.target.value)}
							/>
						</div>

						{/* Chứng từ - Optional */}
						<div style={formGroupStyle}>
							<label style={formLabelStyle}>
								Chứng từ
							</label>
							<div className="file-upload-container">
								<input
									type="file"
									multiple
									accept=".pdf,.jpg,.jpeg,.png"
									onChange={handleFileUpload}
									style={{ display: 'none' }}
									id="file-upload-lower"
								/>
								<label htmlFor="file-upload-lower" style={{ cursor: 'pointer', display: 'block' }}>
									<svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ margin: '0 auto 12px', color: '#64748b' }}>
										<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
										<polyline points="14,2 14,8 20,8"></polyline>
										<line x1="16" y1="13" x2="8" y2="13"></line>
										<line x1="16" y1="17" x2="8" y2="17"></line>
										<polyline points="10,9 9,9 8,9"></polyline>
									</svg>
									<div style={{ fontSize: '16px', fontWeight: '600', color: '#374151', marginBottom: '4px' }}>
										Kéo thả file vào đây hoặc click để chọn
									</div>
									<div style={{ fontSize: '14px', color: '#64748b' }}>
										Hỗ trợ PDF, JPG, PNG (tối đa 10MB mỗi file)
									</div>
								</label>
							</div>
							{uploadedFiles.length > 0 && (
								<div className="file-list">
									{uploadedFiles.map((file, index) => (
										<div key={index} className="file-item">
											<div className="file-info">
												<svg className="file-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
													{file.type === 'application/pdf' ? (
														<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
													) : (
														<rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
													)}
												</svg>
												<div>
													<div className="file-name">{file.name}</div>
													<div className="file-size">{formatFileSize(file.size)}</div>
												</div>
											</div>
											<button
												type="button"
												className="file-remove"
												onClick={() => handleFileRemove(index)}
											>
												<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
													<line x1="18" y1="6" x2="6" y2="18"></line>
													<line x1="6" y1="6" x2="18" y2="18"></line>
												</svg>
											</button>
										</div>
									))}
								</div>
							)}
						</div>

						{/* Ghi chú - Optional */}
						<div style={fullWidthStyle}>
							<label style={formLabelStyle}>
								Ghi chú
							</label>
							<textarea
								style={{
									...formInputStyle,
									resize: 'vertical',
									minHeight: '80px',
									fontFamily: 'inherit'
								}}
								value={formData.notes}
								onChange={(e) => handleInputChange('notes', e.target.value)}
								placeholder="Nhập ghi chú (nếu có)"
								rows={3}
							/>
						</div>
					</div>

					{/* Actions */}
					<div style={{
						display: 'flex',
						gap: '12px',
						justifyContent: 'flex-end',
						paddingTop: '20px',
						borderTop: '1px solid #e2e8f0'
					}}>
						<button 
							type="button" 
							style={{
								padding: '12px 24px',
								borderRadius: '8px',
								fontSize: '14px',
								fontWeight: '600',
								cursor: 'pointer',
								transition: 'all 0.2s ease',
								background: '#f8fafc',
								color: '#64748b',
								border: '2px solid #e2e8f0'
							}}
							onClick={handleClose}
						>
							Hủy
						</button>
						<button 
							type="submit" 
							disabled={isUploading}
							style={{
								padding: '12px 24px',
								borderRadius: '8px',
								fontSize: '14px',
								fontWeight: '600',
								cursor: isUploading ? 'not-allowed' : 'pointer',
								transition: 'all 0.2s ease',
								border: 'none',
								background: isUploading ? 'linear-gradient(135deg, #94a3b8 0%, #64748b 100%)' : 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
								color: 'white',
								boxShadow: isUploading ? '0 2px 4px rgba(148, 163, 184, 0.3)' : '0 4px 6px rgba(59, 130, 246, 0.3)'
							}}
						>
							{isUploading ? 'Đang tạo yêu cầu...' : 'Tạo yêu cầu'}
						</button>
					</div>
				</form>
			</div>
		</div>
		</>
	);
};

