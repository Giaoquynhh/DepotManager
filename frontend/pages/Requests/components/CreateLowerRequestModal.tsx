import React, { useEffect, useState, useRef } from 'react';
import { useTranslation } from '../../../hooks/useTranslation';
import { setupService, type ShippingLine, type TransportCompany, type ContainerType, type Customer } from '../../../services/setupService';
import { requestService } from '../../../services/requests';
import { generateLowerRequestNumber } from '../../../utils/requestNumberGenerator';
import { ContainerSearchInput, type ContainerSearchResult } from '../../../components/ContainerSearchInput';
import DateTimeInput from '../../../components/DateTimeInput';

interface CreateLowerRequestModalProps {
	isOpen: boolean;
	onClose: () => void;
	onSubmit: (data: LowerRequestData) => void;
}

export interface LowerRequestData {
	requestNo?: string; // Auto-generated request number
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
	
	// Container validation states
	const [isCheckingContainer, setIsCheckingContainer] = useState(false);
	const [containerValidationError, setContainerValidationError] = useState<string>('');
	const containerCheckTimeoutRef = useRef<NodeJS.Timeout | null>(null);

	// Shipping lines (from Setup page)
	const [shippingLines, setShippingLines] = useState<ShippingLine[]>([]);
	const [selectedShippingLineName, setSelectedShippingLineName] = useState<string>('');
	// Transport companies (Nhà xe)
	const [transportCompanies, setTransportCompanies] = useState<TransportCompany[]>([]);
	const [selectedTransportCompanyName, setSelectedTransportCompanyName] = useState<string>('');
	// Container types (from Setup page)
	const [containerTypes, setContainerTypes] = useState<ContainerType[]>([]);
	// Customers (from Setup page)
	const [customers, setCustomers] = useState<Customer[]>([]);
	const [selectedCustomerName, setSelectedCustomerName] = useState<string>('');

	// Custom dropdown states
	const [isShippingLineOpen, setIsShippingLineOpen] = useState(false);
	const [isContainerTypeOpen, setIsContainerTypeOpen] = useState(false);
	const [isTransportCompanyOpen, setIsTransportCompanyOpen] = useState(false);
	const [isCustomerOpen, setIsCustomerOpen] = useState(false);
	
	// Search states
	const [shippingLineSearch, setShippingLineSearch] = useState('');
	const [containerTypeSearch, setContainerTypeSearch] = useState('');
	const [transportCompanySearch, setTransportCompanySearch] = useState('');
	const [customerSearch, setCustomerSearch] = useState('');
	
	// File upload states
	const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
	// Preview URLs for image files to render thumbnails
	const [previewUrls, setPreviewUrls] = useState<string[]>([]);
	const [isUploading, setIsUploading] = useState(false);
	const [selectedContainerInfo, setSelectedContainerInfo] = useState<ContainerSearchResult | null>(null);

	useEffect(() => {
		(async () => {
			try {
				console.log('🔍 Loading data for CreateLowerRequestModal...');
				console.log('🔑 Token from localStorage:', localStorage.getItem('token'));
				
				const [slRes, tcRes, ctRes, custRes] = await Promise.all([
					setupService.getShippingLines({ page: 1, limit: 100 }),
					setupService.getTransportCompanies({ page: 1, limit: 100 }),
					setupService.getContainerTypes({ page: 1, limit: 100 }),
					setupService.getCustomers({ page: 1, limit: 1000 })
				]);
				
				console.log('📊 All API responses:', { slRes, tcRes, ctRes, custRes });
				
				if (slRes.success && slRes.data) setShippingLines(slRes.data.data);
				if (tcRes.success && tcRes.data) setTransportCompanies(tcRes.data.data);
				if (ctRes.success && ctRes.data) setContainerTypes(ctRes.data.data);
				if (custRes.success && custRes.data) {
					console.log('✅ Customers loaded:', custRes.data.data);
					setCustomers(custRes.data.data || []);
				} else {
					console.log('❌ Failed to load customers:', custRes);
				}
			} catch (error) {
				console.error('💥 Error loading data:', error);
			}
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

	const filteredCustomers = customers.filter(customer => 
		(customer.tax_code || '').toLowerCase().includes(customerSearch.toLowerCase()) ||
		customer.name.toLowerCase().includes(customerSearch.toLowerCase()) ||
		customer.code.toLowerCase().includes(customerSearch.toLowerCase())
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
			// Create preview URLs for image files
			const newUrls = newFiles.map(f => f.type.startsWith('image/') ? URL.createObjectURL(f) : '');
			setPreviewUrls(prev => [...prev, ...newUrls]);
			setUploadedFiles(prev => [...prev, ...newFiles]);
			setFormData(prev => ({
				...prev,
				documents: [...(prev.documents || []), ...newFiles]
			}));
		}
	};

	const handleFileRemove = (index: number) => {
		// Revoke preview URL if exists
		setPreviewUrls(prev => {
			const url = prev[index];
			if (url) {
				try { URL.revokeObjectURL(url); } catch {}
			}
			return prev.filter((_, i) => i !== index);
		});
		setUploadedFiles(prev => prev.filter((_, i) => i !== index));
		setFormData(prev => ({
			...prev,
			documents: prev.documents?.filter((_, i) => i !== index) || []
		}));
	};

	// Customer handlers
	const handleCustomerSelect = (customer: Customer) => {
		setFormData(prev => ({
			...prev,
			customer: customer.id
		}));
		setSelectedCustomerName(`${customer.code} - ${customer.name}`);
		setIsCustomerOpen(false);
		setCustomerSearch('');
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

		// Clear container validation error when user starts typing
		if (field === 'containerNumber' && containerValidationError) {
			setContainerValidationError('');
		}

		// Trigger container validation when container number changes
		if (field === 'containerNumber' && value.trim()) {
			debouncedCheckContainer(value);
		}
	};

	// Check if container number already exists - Re-enabled with new validation logic
	const checkContainerExists = React.useCallback(async (containerNo: string) => {
		if (!containerNo.trim()) {
			setContainerValidationError('');
			setIsCheckingContainer(false);
			return;
		}

		setIsCheckingContainer(true);
		setContainerValidationError('');

		try {
			const response = await requestService.checkContainerExists(containerNo);
			
			if (response.data.success && response.data.exists) {
				setContainerValidationError(response.data.message);
			} else if (response.data.success && !response.data.exists) {
				// Container có thể tạo request mới - clear error
				setContainerValidationError('');
			} else {
				setContainerValidationError('');
			}
		} catch (error: any) {
			console.error('Error checking container:', error);
			setContainerValidationError('Lỗi khi kiểm tra container. Vui lòng thử lại.');
		} finally {
			setIsCheckingContainer(false);
		}
	}, []);

	// Debounced container check
	const debouncedCheckContainer = React.useCallback((containerNo: string) => {
		// Clear previous timeout
		if (containerCheckTimeoutRef.current) {
			clearTimeout(containerCheckTimeoutRef.current);
		}
		
		// Set new timeout
		containerCheckTimeoutRef.current = setTimeout(() => {
			checkContainerExists(containerNo);
		}, 1000); // 1000ms delay - tăng delay để tránh check quá nhiều
	}, [checkContainerExists]);

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

		// Container validation re-enabled - check for conflicts with export requests
		if (containerValidationError) {
			newErrors.containerNumber = containerValidationError;
		}

		setErrors(newErrors);
		return Object.keys(newErrors).length === 0;
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		
		if (validateForm()) {
			try {
				setIsUploading(true);
				
				// Generate request number automatically for LOWER (hạ container) - use custom HA prefix
                const requestNumber = await generateLowerRequestNumber();
				
            // Prepare data for API with auto-generated request number
            const requestData = {
                type: 'IMPORT',
                request_no: requestNumber, // Add auto-generated request number
                status: 'PENDING', // Default status for new lower (import) requests
                container_no: formData.containerNumber,
                eta: formData.appointmentTime,
                shipping_line_id: formData.shippingLine || undefined,
                container_type_id: formData.containerType || undefined,
                lower_customer_id: formData.customer || undefined,
                vehicle_company_id: formData.vehicleCompany || undefined,
                license_plate: formData.vehicleNumber,
                driver_name: formData.driver,
                driver_phone: formData.driverPhone,
                appointment_time: formData.appointmentTime,
                notes: formData.notes,
                files: formData.documents || []
            };

            console.log('Creating export request with data:', requestData);
            console.log('Token from localStorage:', localStorage.getItem('token'));

				// Call API to create request with files
				const response = await requestService.createRequest(requestData);
				
				if (response.data.success) {
					// Success - call parent onSubmit with response data including request number
					onSubmit({
						...formData,
						requestNo: requestNumber // Include auto-generated request number
					});
					
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
					setSelectedCustomerName('');
					setUploadedFiles([]);
					// Don't call onClose() here, let parent handle it
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
		// Revoke all preview URLs on close
		previewUrls.forEach(url => { if (url) { try { URL.revokeObjectURL(url); } catch {} } });
		// Clear container check timeout
		if (containerCheckTimeoutRef.current) {
			clearTimeout(containerCheckTimeoutRef.current);
		}
		setErrors({});
		setContainerValidationError('');
		setIsCheckingContainer(false);
		setIsShippingLineOpen(false);
		setIsContainerTypeOpen(false);
		setIsTransportCompanyOpen(false);
		setIsCustomerOpen(false);
		setShippingLineSearch('');
		setContainerTypeSearch('');
		setTransportCompanySearch('');
		setCustomerSearch('');
		setSelectedShippingLineName('');
		setSelectedTransportCompanyName('');
		setSelectedCustomerName('');
		setUploadedFiles([]);
		setPreviewUrls([]);
		onClose();
	};

	// Cleanup all preview URLs on unmount
	useEffect(() => {
		return () => {
			previewUrls.forEach(url => { if (url) { try { URL.revokeObjectURL(url); } catch {} } });
		};
	// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	// Cleanup container check timeout on unmount
	useEffect(() => {
		return () => {
			if (containerCheckTimeoutRef.current) {
				clearTimeout(containerCheckTimeoutRef.current);
			}
		};
	}, []);

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
								{isCheckingContainer && (
									<span style={{ marginLeft: '8px', fontSize: '12px', color: '#666' }}>
										(Đang kiểm tra...)
									</span>
								)}
							</label>
							<ContainerSearchInput
								value={formData.containerNumber || ''}
								onChange={(value) => handleInputChange('containerNumber', value)}
								placeholder="Nhập số container"
								style={errors.containerNumber ? formInputErrorStyle : formInputStyle}
								error={!!errors.containerNumber}
								onSelect={(c) => {
									setSelectedContainerInfo(c);
									
									// Auto-fill thông tin từ Container model
									if (c) {
										// Auto-fill container type
										if (c.container_type?.id) {
											handleInputChange('containerType', c.container_type.id);
										}
										
										// Auto-fill customer
										if (c.customer?.id) {
											handleInputChange('customer', c.customer.id);
											setSelectedCustomerName(c.customer.name);
										}
										
										// Auto-fill shipping line
										if (c.shipping_line?.id) {
											handleInputChange('shippingLine', c.shipping_line.id);
											setSelectedShippingLineName(c.shipping_line.name);
										}
									}
								}}
							/>
							{selectedContainerInfo && (
								<div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
									<div>Vị trí: {selectedContainerInfo.block_code}-{selectedContainerInfo.slot_code}{selectedContainerInfo.tier ? `, Tầng ${selectedContainerInfo.tier}` : ''}</div>
									{selectedContainerInfo.yard_name && <div>Bãi: {selectedContainerInfo.yard_name}</div>}
								</div>
							)}
							{/* Container validation error display */}
							{containerValidationError && (
								<div style={{
									marginTop: '6px',
									padding: '8px 12px',
									background: '#fef2f2',
									border: '1px solid #fecaca',
									borderRadius: '6px',
									fontSize: '12px',
									color: '#dc2626',
									lineHeight: '1.4'
								}}>
									<div style={{ fontWeight: '500', marginBottom: '2px' }}>
										⚠️ Container không hợp lệ
									</div>
									<div style={{ fontSize: '11px' }}>{containerValidationError}</div>
								</div>
							)}
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
							{formData.containerType && (
								<div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
									Mô tả: {containerTypes.find(ct => ct.id === formData.containerType)?.description}
								</div>
							)}
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
							<div className="custom-dropdown-container" style={{ position: 'relative' }}>
								<button
									type="button"
									style={errors.customer ? formInputErrorStyle : formInputStyle}
									onClick={() => setIsCustomerOpen(!isCustomerOpen)}
									className="custom-dropdown-button"
								>
									{formData.customer 
										? `${customers.find(c => c.id === formData.customer)?.code} - ${customers.find(c => c.id === formData.customer)?.name}`
										: 'Chọn khách hàng'
									}
									<svg
										width="12"
										height="12"
										viewBox="0 0 24 24"
										fill="none"
										stroke="currentColor"
										strokeWidth="2"
										style={{
											transform: isCustomerOpen ? 'rotate(180deg)' : 'rotate(0deg)',
											transition: 'transform 0.2s ease',
											marginLeft: 'auto'
										}}
									>
										<polyline points="6,9 12,15 18,9"></polyline>
									</svg>
								</button>
								
								{isCustomerOpen && (
									<div className="custom-dropdown-menu" style={{
										position: 'absolute',
										top: '100%',
										left: 0,
										right: 0,
										backgroundColor: 'white',
										border: '1px solid #e2e8f0',
										borderRadius: '8px',
										boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
										zIndex: 1000,
										maxHeight: '200px',
										overflowY: 'auto'
									}}>
										<input
											type="text"
											placeholder="Tìm kiếm khách hàng..."
											value={customerSearch}
											onChange={(e) => setCustomerSearch(e.target.value)}
											style={{
												width: '100%',
												padding: '8px 12px',
												border: 'none',
												borderBottom: '1px solid #e2e8f0',
												outline: 'none',
												fontSize: '14px'
											}}
										/>
										{filteredCustomers.map((customer) => (
											<button
												key={customer.id}
												type="button"
												onClick={() => handleCustomerSelect(customer)}
												style={{
													width: '100%',
													padding: '8px 12px',
													border: 'none',
													backgroundColor: 'transparent',
													textAlign: 'left',
													cursor: 'pointer',
													fontSize: '14px',
													display: 'flex',
													flexDirection: 'column',
													alignItems: 'flex-start'
												}}
												onMouseEnter={(e) => {
													e.currentTarget.style.backgroundColor = '#f8fafc';
												}}
												onMouseLeave={(e) => {
													e.currentTarget.style.backgroundColor = 'transparent';
												}}
											>
												<span style={{ fontWeight: '500' }}>{customer.code}</span>
												<span style={{ fontSize: '12px', color: '#64748b' }}>{customer.name}</span>
											</button>
										))}
										{filteredCustomers.length === 0 && (
											<div style={{
												padding: '8px 12px',
												color: '#64748b',
												fontSize: '14px',
												textAlign: 'center'
											}}>
												Không tìm thấy khách hàng
											</div>
										)}
									</div>
								)}
							</div>
							{formData.customer && (
								<div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
									{(() => {
										const customer = customers.find(c => c.id === formData.customer);
										return customer ? (
											<div>
												<div>Tên: {customer.name}</div>
												{customer.email && <div>Email: {customer.email}</div>}
												{customer.phone && <div>SĐT: {customer.phone}</div>}
												{customer.address && <div>Địa chỉ: {customer.address}</div>}
											</div>
										) : null;
									})()}
								</div>
							)}
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
							<DateTimeInput
								value={formData.appointmentTime || ''}
								onChange={(value) => handleInputChange('appointmentTime', value)}
								placeholder="dd/mm/yyyy hh:mm"
								style={formInputStyle}
							/>
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
										{file.type.startsWith('image/') && previewUrls[index] ? (
											<img
												src={previewUrls[index]}
												alt={file.name}
												style={{ width: 96, height: 96, objectFit: 'cover', borderRadius: 8, border: '1px solid #e2e8f0' }}
											/>
										) : (
											<svg className="file-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
												{file.type === 'application/pdf' ? (
													<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
												) : (
													<rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
												)}
											</svg>
										)}
										<div style={{ marginLeft: 8 }}>
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

