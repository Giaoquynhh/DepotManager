import React, { useEffect, useState, useRef } from 'react';
import { useTranslation } from '../../../hooks/useTranslation';
import { setupService, type ShippingLine, type TransportCompany, type ContainerType, type Customer } from '../../../services/setupService';
import { requestService } from '../../../services/requests';
import { generateNewRequestNumber } from '../../../utils/requestNumberGenerator';
import { containersApi } from '../../../services/containers';

export interface ContainerSearchResult {
	container_no: string;
	slot_code: string;
	block_code: string;
	yard_name: string;
	tier?: number;
	placed_at: string;
	customer?: {
		id: string;
		name: string;
		code: string;
	};
	shipping_line?: {
		id: string;
		name: string;
		code: string;
	};
	container_type?: {
		id: string;
		code: string;
		description: string;
	};
	seal_number?: string;
	dem_det?: string;
}

interface CreateLiftRequestModalProps {
	isOpen: boolean;
	onClose: () => void;
	onSubmit: (data: LiftRequestData) => void;
}

export interface LiftRequestData {
	requestNo?: string; // Auto-generated request number
	shippingLine: string;
	bookingBill: string;
	containerNumber?: string;
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

export const CreateLiftRequestModal: React.FC<CreateLiftRequestModalProps> = ({
	isOpen,
	onClose,
	onSubmit
}) => {
	const { t } = useTranslation();
	const [formData, setFormData] = useState<LiftRequestData>({
		shippingLine: '',
		bookingBill: '',
		containerNumber: '',
		containerType: '',
		serviceType: 'Nâng container',
		customer: '',
		vehicleCompany: '',
		vehicleNumber: '',
		driver: '',
		driverPhone: '',
		appointmentTime: '',
		documents: [],
		notes: ''
	});

	const [errors, setErrors] = useState<Partial<LiftRequestData>>({});

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
	
	// Container search states
	const [containerSearchResults, setContainerSearchResults] = useState<ContainerSearchResult[]>([]);
	const [isContainerSearchOpen, setIsContainerSearchOpen] = useState(false);
	const [containerSearchQuery, setContainerSearchQuery] = useState('');
	const [isSearchingContainers, setIsSearchingContainers] = useState(false);
	const [isRefreshingContainerInfo, setIsRefreshingContainerInfo] = useState(false);

	useEffect(() => {
		(async () => {
			try {
				const [slRes, tcRes, ctRes, custRes] = await Promise.all([
					setupService.getShippingLines({ page: 1, limit: 100 }),
					setupService.getTransportCompanies({ page: 1, limit: 100 }),
					setupService.getContainerTypes({ page: 1, limit: 100 }),
					setupService.getCustomers({ page: 1, limit: 1000 })
				]);
				if (slRes.success && slRes.data) setShippingLines(slRes.data.data);
				if (tcRes.success && tcRes.data) setTransportCompanies(tcRes.data.data);
				if (ctRes.success && ctRes.data) setContainerTypes(ctRes.data.data);
				if (custRes.success && custRes.data) {
					setCustomers(custRes.data.data || []);
				}
			} catch (_) {}
		})();
	}, []);

	// Close dropdowns when clicking outside
	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			const target = event.target as HTMLElement;
			if (!target.closest('.custom-dropdown-container') && !target.closest('.container-search-dropdown')) {
				setIsShippingLineOpen(false);
				setIsContainerTypeOpen(false);
				setIsTransportCompanyOpen(false);
				setIsContainerSearchOpen(false);
			}
		};

		document.addEventListener('mousedown', handleClickOutside);
		return () => {
			document.removeEventListener('mousedown', handleClickOutside);
		};
	}, []);

	// Close other dropdowns when opening a new one
	const closeAllDropdowns = () => {
		setIsShippingLineOpen(false);
		setIsContainerTypeOpen(false);
		setIsTransportCompanyOpen(false);
		setIsContainerSearchOpen(false);
	};

	// Refresh container data
	const refreshContainerData = async () => {
		if (formData.shippingLine) {
			await searchContainersByShippingLine(formData.shippingLine, containerSearchQuery);
		}
	};

	// Refresh selected container info with latest data
	const refreshSelectedContainerInfo = async () => {
		if (formData.containerNumber) {
			setIsRefreshingContainerInfo(true);
			try {
				const containerResponse = await containersApi.get(formData.containerNumber);
				
				if (containerResponse.success && containerResponse.data) {
					const containerData = containerResponse.data;
					
					// Update selected container info with latest data
					const updatedContainerInfo = {
						container_no: formData.containerNumber,
						slot_code: selectedContainerInfo?.slot_code || '',
						block_code: selectedContainerInfo?.block_code || '',
						yard_name: selectedContainerInfo?.yard_name || '',
						tier: selectedContainerInfo?.tier,
						placed_at: selectedContainerInfo?.placed_at || '',
						customer: containerData.customer,
						shipping_line: containerData.shipping_line,
						container_type: containerData.container_type,
						seal_number: containerData.seal_number,
						dem_det: containerData.dem_det
					};
					
					setSelectedContainerInfo(updatedContainerInfo);

					// Update form data with latest information
					if (containerData.container_type?.id) {
						handleInputChange('containerType', containerData.container_type.id);
					}
					
					if (containerData.customer?.id) {
						handleInputChange('customer', containerData.customer.id);
						setSelectedCustomerName(containerData.customer.name);
					}
				}
			} catch (error) {
				console.error('Error refreshing container info:', error);
			} finally {
				setIsRefreshingContainerInfo(false);
			}
		}
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

	const filteredCustomers = customers.filter(customer => 
		(customer.tax_code || '').toLowerCase().includes(customerSearch.toLowerCase()) ||
		customer.name.toLowerCase().includes(customerSearch.toLowerCase()) ||
		customer.code.toLowerCase().includes(customerSearch.toLowerCase())
	);

	// Search containers by shipping line using containers API
	const searchContainersByShippingLine = async (shippingLineId: string, query: string) => {
		if (!shippingLineId) {
			setContainerSearchResults([]);
			return;
		}

		setIsSearchingContainers(true);
		try {
			// Sử dụng containers API để lấy tất cả container, sau đó filter theo shipping_line_id
			const response = await containersApi.list({
				q: query.length > 0 ? query : undefined,
				page: 1,
				pageSize: 100
			});
			
			if (response.items) {
				// Filter containers theo shipping_line_id
				const filteredContainers = response.items.filter((container: any) => {
					return container.shipping_line_id === shippingLineId;
				});
				
				// Transform data thành format cần thiết
				const containersWithDetails = filteredContainers.map((container: any) => ({
					container_no: container.container_no,
					slot_code: container.slot_code || '',
					block_code: container.block_code || '',
					yard_name: container.yard_name || '',
					tier: container.placement_tier,
					placed_at: container.placed_at || '',
					customer: container.customer,
					shipping_line: container.shipping_line,
					container_type: container.container_type,
					seal_number: container.seal_number,
					dem_det: container.dem_det
				}));
				
				setContainerSearchResults(containersWithDetails);
			} else {
				setContainerSearchResults([]);
			}
		} catch (error) {
			console.error('Error searching containers:', error);
			setContainerSearchResults([]);
		} finally {
			setIsSearchingContainers(false);
		}
	};

	// Load containers when shipping line is selected
	useEffect(() => {
		if (formData.shippingLine) {
			// Load all containers for the selected shipping line
			searchContainersByShippingLine(formData.shippingLine, '');
		} else {
			setContainerSearchResults([]);
			setIsContainerSearchOpen(false);
		}
	}, [formData.shippingLine]);

	// Refresh container info when shipping line changes (in case container was moved to different shipping line)
	useEffect(() => {
		if (formData.containerNumber && formData.shippingLine) {
			// Refresh container info to get latest data including new shipping line info
			refreshSelectedContainerInfo();
		}
	}, [formData.shippingLine]);

	// Refresh container data when modal opens
	useEffect(() => {
		if (isOpen && formData.shippingLine) {
			// Refresh container data when modal opens
			searchContainersByShippingLine(formData.shippingLine, containerSearchQuery);
		}
	}, [isOpen]);

	// Auto-refresh selected container info when modal opens
	useEffect(() => {
		if (isOpen && formData.containerNumber) {
			// Auto-refresh container info when modal opens to get latest data
			refreshSelectedContainerInfo();
		}
	}, [isOpen]);

	// Update selectedCustomerName when formData.customer changes
	useEffect(() => {
		if (formData.customer && customers.length > 0) {
			const customer = customers.find(c => c.id === formData.customer);
			if (customer) {
				setSelectedCustomerName(customer.name);
			}
		}
	}, [formData.customer, customers]);

	// Update selectedCustomerName when selectedContainerInfo changes
	useEffect(() => {
		if (selectedContainerInfo?.customer?.name) {
			setSelectedCustomerName(selectedContainerInfo.customer.name);
		}
	}, [selectedContainerInfo]);

	// Refresh container data when container number changes (user might have updated in ManagerCont)
	useEffect(() => {
		if (formData.containerNumber && formData.shippingLine) {
			// Refresh container data to get latest information
			refreshContainerData();
			// Also refresh the selected container info to get latest customer/container type data
			refreshSelectedContainerInfo();
		}
	}, [formData.containerNumber]);

	// Debounced container search when typing
	useEffect(() => {
		const timeoutId = setTimeout(() => {
			if (formData.shippingLine && containerSearchQuery.length >= 2) {
				searchContainersByShippingLine(formData.shippingLine, containerSearchQuery);
			} else if (formData.shippingLine && containerSearchQuery.length === 0) {
				// Show all containers when search is cleared
				searchContainersByShippingLine(formData.shippingLine, '');
			}
		}, 300);

		return () => clearTimeout(timeoutId);
	}, [containerSearchQuery]);

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

	const handleInputChange = (field: keyof LiftRequestData, value: string) => {
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

		// Reset container search when shipping line changes
		if (field === 'shippingLine') {
			setContainerSearchQuery('');
			setContainerSearchResults([]);
			setSelectedContainerInfo(null);
			// Clear container number when shipping line changes
			setFormData(prev => ({
				...prev,
				containerNumber: ''
			}));
		}
	};

	const validateForm = (): boolean => {
		const newErrors: Partial<LiftRequestData> = {};

		if (!formData.shippingLine.trim()) {
			newErrors.shippingLine = 'Hãng tàu là bắt buộc';
		}
		if (!formData.bookingBill.trim()) {
			newErrors.bookingBill = 'Số Booking/Bill là bắt buộc';
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
				
                // Generate request number automatically for EXPORT (nâng container)
                const requestNumber = await generateNewRequestNumber('export');
				
            // Prepare data for API with auto-generated request number
            const requestData = {
                type: 'EXPORT', // Yêu cầu nâng container phải là EXPORT
                request_no: requestNumber, // Add auto-generated request number
                status: 'NEW_REQUEST', // Trạng thái ban đầu là NEW_REQUEST cho yêu cầu nâng container
                container_no: formData.containerNumber,
                eta: formData.appointmentTime,
                shipping_line_id: formData.shippingLine || undefined,
                container_type_id: formData.containerType || undefined,
                customer_id: formData.customer || undefined,
                vehicle_company_id: formData.vehicleCompany || undefined,
                license_plate: formData.vehicleNumber,
                driver_name: formData.driver,
                driver_phone: formData.driverPhone,
                appointment_time: formData.appointmentTime,
                booking_bill: formData.bookingBill, // Add booking/bill field
                notes: formData.notes,
                files: formData.documents || []
            };

				// Debug logging

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
						bookingBill: '',
						containerNumber: '',
						containerType: '',
						serviceType: 'Nâng container',
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
		// Revoke all preview URLs on close
		previewUrls.forEach(url => { if (url) { try { URL.revokeObjectURL(url); } catch {} } });
		setErrors({});
		setIsShippingLineOpen(false);
		setIsContainerTypeOpen(false);
		setIsTransportCompanyOpen(false);
		setIsCustomerOpen(false);
		setIsContainerSearchOpen(false);
		setShippingLineSearch('');
		setContainerTypeSearch('');
		setTransportCompanySearch('');
		setCustomerSearch('');
		setContainerSearchQuery('');
		setContainerSearchResults([]);
		setSelectedCustomerName('');
		setSelectedContainerInfo(null);
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
		cursor: 'pointer',
		appearance: 'none' as const,
		backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6,9 12,15 18,9'%3e%3c/polyline%3e%3c/svg%3e")`,
		backgroundRepeat: 'no-repeat' as const,
		backgroundPosition: 'right 12px center',
		backgroundSize: '16px',
		paddingRight: '40px'
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
					}}>Tạo yêu cầu nâng container</h2>
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
										closeAllDropdowns();
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

						{/* Số Booking/Bill - Required */}
						<div style={formGroupStyle}>
							<label style={requiredLabelStyle}>
								Số Booking/Bill <span style={requiredAsteriskStyle}>*</span>
							</label>
							<input
								type="text"
								style={errors.bookingBill ? formInputErrorStyle : formInputStyle}
								value={formData.bookingBill}
								onChange={(e) => handleInputChange('bookingBill', e.target.value)}
								placeholder="Nhập số Booking/Bill"
							/>
							{errors.bookingBill && <span style={errorMessageStyle}>{errors.bookingBill}</span>}
						</div>

		{/* Số cont - Optional */}
						<div style={formGroupStyle}>
							<label style={formLabelStyle}>
								Số container
							</label>
							<div className="container-search-dropdown" style={{ position: 'relative' }}>
								<input
									type="text"
								style={formInputStyle}
									value={formData.containerNumber || ''}
									onChange={(e) => {
										handleInputChange('containerNumber', e.target.value);
										setContainerSearchQuery(e.target.value);
										setIsContainerSearchOpen(true);
									}}
									onFocus={() => {
										if (formData.shippingLine) {
											closeAllDropdowns();
											setIsContainerSearchOpen(true);
										}
									}}
									onClick={() => {
										if (formData.shippingLine) {
											closeAllDropdowns();
											setIsContainerSearchOpen(true);
										}
									}}
									placeholder={formData.shippingLine ? "Chọn container hoặc nhập để tìm kiếm" : "Chọn hãng tàu trước"}
									disabled={!formData.shippingLine}
								/>
								
								{isContainerSearchOpen && formData.shippingLine && (
									<div style={{
										position: 'absolute',
										top: '100%',
										left: 0,
										right: 0,
										background: 'white',
										border: '2px solid #e2e8f0',
										borderTop: 'none',
										borderRadius: '0 0 8px 8px',
										maxHeight: '200px',
										overflowY: 'auto',
										zIndex: 1000,
										boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
									}}>
										{/* Header với nút refresh */}
										<div style={{
											display: 'flex',
											justifyContent: 'space-between',
											alignItems: 'center',
											padding: '8px 12px',
											borderBottom: '1px solid #e2e8f0',
											background: '#f8fafc'
										}}>
											<span style={{ fontSize: '12px', color: '#64748b', fontWeight: '500' }}>
												{containerSearchQuery.length > 0 ? `Tìm kiếm: "${containerSearchQuery}"` : 'Danh sách container'}
											</span>
											<button
												type="button"
												onClick={(e) => {
													e.stopPropagation();
													refreshContainerData();
												}}
												disabled={isSearchingContainers}
												style={{
													background: 'none',
													border: 'none',
													cursor: isSearchingContainers ? 'not-allowed' : 'pointer',
													padding: '4px',
													borderRadius: '4px',
													color: isSearchingContainers ? '#9ca3af' : '#64748b',
													transition: 'all 0.2s'
												}}
												title="Làm mới danh sách container"
											>
												<svg 
													width="16" 
													height="16" 
													viewBox="0 0 24 24" 
													fill="none" 
													stroke="currentColor" 
													strokeWidth="2"
													style={{
														transform: isSearchingContainers ? 'rotate(180deg)' : 'rotate(0deg)',
														transition: 'transform 0.3s ease'
													}}
												>
													<polyline points="23 4 23 10 17 10"></polyline>
													<polyline points="1 20 1 14 7 14"></polyline>
													<path d="m3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>
												</svg>
											</button>
										</div>
										{isSearchingContainers ? (
											<div style={{ padding: '12px 16px', textAlign: 'center', color: '#64748b' }}>
												Đang tải danh sách container...
											</div>
										) : containerSearchResults.length > 0 ? (
											<div>
												{containerSearchResults.map((container) => (
													<div
														key={container.container_no}
														style={{
															padding: '12px 16px',
															cursor: 'pointer',
															borderBottom: '1px solid #f1f5f9',
															transition: 'background-color 0.2s ease'
														}}
														onMouseEnter={(e) => {
															e.currentTarget.style.backgroundColor = '#f8fafc';
														}}
														onMouseLeave={(e) => {
															e.currentTarget.style.backgroundColor = 'white';
														}}
													onClick={async () => {
														handleInputChange('containerNumber', container.container_no);
														setIsContainerSearchOpen(false);
														setContainerSearchQuery('');
														
														// Lấy thông tin chi tiết container để auto-fill
														try {
															const containerResponse = await containersApi.get(container.container_no);
															
															if (containerResponse.success && containerResponse.data) {
																const containerData = containerResponse.data;
																
																// Auto-fill container type với dữ liệu mới nhất
																if (containerData.container_type?.id) {
																	handleInputChange('containerType', containerData.container_type.id);
																}
																
																// Auto-fill customer với dữ liệu mới nhất
																if (containerData.customer?.id) {
																	handleInputChange('customer', containerData.customer.id);
																	setSelectedCustomerName(containerData.customer.name);
																}
																
																// Cập nhật selectedContainerInfo với dữ liệu mới nhất từ database
																const updatedContainerInfo = {
																	container_no: container.container_no,
																	slot_code: container.slot_code || '',
																	block_code: container.block_code || '',
																	yard_name: container.yard_name || '',
																	tier: container.tier,
																	placed_at: container.placed_at || '',
																	customer: containerData.customer,
																	shipping_line: containerData.shipping_line,
																	container_type: containerData.container_type,
																	seal_number: containerData.seal_number,
																	dem_det: containerData.dem_det
																};
																
																setSelectedContainerInfo(updatedContainerInfo);
															} else {
																// Fallback: sử dụng dữ liệu có sẵn
																setSelectedContainerInfo(container);
																if (container.container_type?.id) {
																	handleInputChange('containerType', container.container_type.id);
																}
																if (container.customer?.id) {
																	handleInputChange('customer', container.customer.id);
																	setSelectedCustomerName(container.customer.name);
																}
															}
														} catch (error) {
															console.error('Error fetching container details:', error);
															// Fallback: sử dụng dữ liệu có sẵn
															setSelectedContainerInfo(container);
															if (container.container_type?.id) {
																handleInputChange('containerType', container.container_type.id);
															}
															if (container.customer?.id) {
																handleInputChange('customer', container.customer.id);
																setSelectedCustomerName(container.customer.name);
															}
														}
													}}
													>
														<div style={{ fontWeight: '500', color: '#1f2937' }}>
															{container.container_no}
														</div>
														<div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
															{container.container_type?.code} - {container.container_type?.description}
														</div>
														<div style={{ fontSize: '12px', color: '#64748b' }}>
															{container.customer?.name} | {container.yard_name} - {container.block_code}-{container.slot_code}
														</div>
													</div>
												))}
											</div>
										) : containerSearchQuery.length >= 2 ? (
											<div style={{ padding: '12px 16px', color: '#64748b', textAlign: 'center' }}>
												Không tìm thấy container nào phù hợp
											</div>
										) : (
											<div style={{ padding: '12px 16px', color: '#64748b', textAlign: 'center' }}>
												{formData.shippingLine ? 'Click vào ô để xem danh sách container' : 'Chọn hãng tàu để xem danh sách container'}
											</div>
										)}
									</div>
								)}
							</div>
							{selectedContainerInfo && (
								<div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
									<div style={{ 
										display: 'flex', 
										justifyContent: 'space-between', 
										alignItems: 'center', 
										marginBottom: '8px',
										padding: '8px',
										background: '#f8fafc',
										borderRadius: '6px',
										border: '1px solid #e2e8f0'
									}}>
										<span style={{ fontWeight: '500', color: '#374151' }}>Thông tin container đã chọn:</span>
										<button
											type="button"
											onClick={refreshSelectedContainerInfo}
											disabled={isRefreshingContainerInfo}
											style={{
												background: isRefreshingContainerInfo ? '#9ca3af' : '#3b82f6',
												border: 'none',
												cursor: isRefreshingContainerInfo ? 'not-allowed' : 'pointer',
												padding: '4px 8px',
												borderRadius: '4px',
												color: 'white',
												fontSize: '11px',
												fontWeight: '500',
												transition: 'all 0.2s',
												display: 'flex',
												alignItems: 'center',
												gap: '4px'
											}}
											title={isRefreshingContainerInfo ? "Đang cập nhật..." : "Làm mới thông tin container từ database"}
											onMouseEnter={(e) => {
												if (!isRefreshingContainerInfo) {
													e.currentTarget.style.background = '#2563eb';
												}
											}}
											onMouseLeave={(e) => {
												if (!isRefreshingContainerInfo) {
													e.currentTarget.style.background = '#3b82f6';
												}
											}}
										>
											<svg 
												width="12" 
												height="12" 
												viewBox="0 0 24 24" 
												fill="none" 
												stroke="currentColor" 
												strokeWidth="2"
												style={{
													transform: isRefreshingContainerInfo ? 'rotate(180deg)' : 'rotate(0deg)',
													transition: 'transform 0.3s ease'
												}}
											>
												<polyline points="23 4 23 10 17 10"></polyline>
												<polyline points="1 20 1 14 7 14"></polyline>
												<path d="m3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>
											</svg>
											{isRefreshingContainerInfo ? 'Đang cập nhật...' : 'Cập nhật'}
										</button>
									</div>
									<div style={{ padding: '0 8px' }}>
									<div>Vị trí: {selectedContainerInfo.block_code}-{selectedContainerInfo.slot_code}{selectedContainerInfo.tier ? `, Tầng ${selectedContainerInfo.tier}` : ''}</div>
									<div>Bãi: {selectedContainerInfo.yard_name}</div>
									<div>Thời điểm vào bãi: {new Date(selectedContainerInfo.placed_at).toLocaleString()}</div>
										{selectedContainerInfo.container_type && (
											<div style={{ color: '#059669', fontWeight: '500' }}>Loại container: {selectedContainerInfo.container_type.code} - {selectedContainerInfo.container_type.description}</div>
										)}
										{selectedContainerInfo.customer && (
											<div style={{ color: '#dc2626', fontWeight: '500' }}>Khách hàng: {selectedContainerInfo.customer.name}</div>
										)}
									</div>
								</div>
							)}
							{!formData.shippingLine && (
								<div style={{ fontSize: '12px', color: '#f59e0b', marginTop: '4px' }}>
									⚠️ Vui lòng chọn hãng tàu để xem danh sách container
								</div>
							)}
							{formData.shippingLine && containerSearchResults.length > 0 && (
								<div style={{ fontSize: '12px', color: '#10b981', marginTop: '4px' }}>
									✅ Click vào ô để xem {containerSearchResults.length} container thuộc hãng tàu này
								</div>
							)}
						</div>

						{/* Loại cont - Required (id mapping, display code + description) */}
						<div style={formGroupStyle}>
							<label style={requiredLabelStyle}>
								Loại container <span style={requiredAsteriskStyle}>*</span>
							</label>
							<div className="custom-dropdown-container">
								<button
									type="button"
									className={`custom-dropdown-button ${errors.containerType ? 'error' : ''}`}
									onClick={() => {
										closeAllDropdowns();
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
									onClick={() => {
										closeAllDropdowns();
										setIsCustomerOpen(!isCustomerOpen);
									}}
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
										closeAllDropdowns();
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
									id="file-upload"
								/>
								<label htmlFor="file-upload" style={{ cursor: 'pointer', display: 'block' }}>
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
						{/* Cancel button removed per requirement */}
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