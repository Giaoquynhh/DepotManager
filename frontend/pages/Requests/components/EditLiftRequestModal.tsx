import React, { useEffect, useState, useRef } from 'react';
import { setupService, type ShippingLine, type TransportCompany, type ContainerType, type Customer } from '../../../services/setupService';
import { requestService } from '../../../services/requests';
import { containersApi } from '../../../services/containers';
import type { EditLiftRequestModalProps, EditLiftRequestData, ExistingFile } from './EditLiftRequestModal.types';
import { ModalHeader } from './ModalHeader';
import { RequestFormFields } from './RequestFormFields';
import { DocumentsUploader } from './DocumentsUploader';

export const EditLiftRequestModal: React.FC<EditLiftRequestModalProps> = ({
	isOpen,
	onClose,
	onSubmit,
	requestData
}) => {
	const [formData, setFormData] = useState<EditLiftRequestData>({
		requestNo: '',
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


	const [shippingLines, setShippingLines] = useState<ShippingLine[]>([]);
	const [transportCompanies, setTransportCompanies] = useState<TransportCompany[]>([]);
	const [containerTypes, setContainerTypes] = useState<ContainerType[]>([]);
	const [customers, setCustomers] = useState<Customer[]>([]);
	const [loading, setLoading] = useState(false);
	const [submitting, setSubmitting] = useState(false);

	// Container validation states - giống hệt CreateLiftRequestModal
	const [containerValidationError, setContainerValidationError] = useState<string>('');
	const [isCheckingContainer, setIsCheckingContainer] = useState(false);
	const [containerSearchResults, setContainerSearchResults] = useState<any[]>([]);
	const [isSearchingContainers, setIsSearchingContainers] = useState(false);
	const [selectedContainerInfo, setSelectedContainerInfo] = useState<any>(null);
	const [selectedCustomerName, setSelectedCustomerName] = useState<string>('');
	const [selectedShippingLineName, setSelectedShippingLineName] = useState<string>('');
	const [selectedTransportCompanyName, setSelectedTransportCompanyName] = useState<string>('');

	// Debounce timer ref
	const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

	// Load initial data
	useEffect(() => {
		if (isOpen) {
			loadInitialData();
			// Load existing attachments for this request to show already uploaded documents
			(async () => {
				try {
					const res = await requestService.getRequestFiles(requestData.id);
					const files = res?.data?.data || [];
					if (Array.isArray(files) && files.length) {
						// We cannot reconstruct File objects from server; display names in a readonly list area
						setFormData(prev => ({ ...prev, documents: prev.documents || [] }));
						setExistingFiles(files);
					}
				} catch (_) {}
			})();
		}
	}, [isOpen]);

	// Load form data after dropdown data is loaded
	useEffect(() => {
		if (requestData && isOpen && !loading && 
			(shippingLines.length > 0 || containerTypes.length > 0 || customers.length > 0 || transportCompanies.length > 0)) {
			
			console.log('Loading form data:', {
				requestData,
				shippingLine: requestData.shipping_line?.name,
				containerType: requestData.container_type?.code,
				customer: requestData.customer?.name,
				vehicleCompany: requestData.vehicle_company?.name
			});
			
			setFormData({
				requestNo: requestData.request_no || '',
				shippingLine: requestData.shipping_line?.id || '',
				bookingBill: requestData.booking_bill || '',
				containerNumber: requestData.container_no || '',
				containerType: requestData.container_type?.id || '',
				serviceType: 'Nâng container',
				customer: requestData.customer?.id || '',
				vehicleCompany: requestData.vehicle_company?.id || '',
				vehicleNumber: requestData.license_plate || '',
				driver: requestData.driver_name || '',
				driverPhone: requestData.driver_phone || '',
				appointmentTime: requestData.appointment_time ? new Date(requestData.appointment_time).toISOString().slice(0, 16) : '',
				documents: [],
				notes: requestData.appointment_note || ''
			});

			// Set selected names for display
			setSelectedShippingLineName(requestData.shipping_line?.name || '');
			setSelectedCustomerName(requestData.customer?.name || '');
			setSelectedTransportCompanyName(requestData.vehicle_company?.name || '');
		}
	}, [requestData, isOpen, loading, shippingLines, containerTypes, customers, transportCompanies]);

	// Update selected names when form data changes
	useEffect(() => {
		if (formData.shippingLine) {
			const shippingLine = shippingLines.find(sl => sl.id === formData.shippingLine);
			if (shippingLine) {
				setSelectedShippingLineName(shippingLine.name);
			}
		}
	}, [formData.shippingLine, shippingLines]);

	useEffect(() => {
		if (formData.customer) {
			const customer = customers.find(c => c.id === formData.customer);
			if (customer) {
				setSelectedCustomerName(customer.name);
			}
		}
	}, [formData.customer, customers]);

	useEffect(() => {
		if (formData.vehicleCompany) {
			const transportCompany = transportCompanies.find(tc => tc.id === formData.vehicleCompany);
			if (transportCompany) {
				setSelectedTransportCompanyName(transportCompany.name);
			}
		}
	}, [formData.vehicleCompany, transportCompanies]);

	// Update selectedCustomerName when selectedContainerInfo changes
	useEffect(() => {
		if (selectedContainerInfo?.customer?.name) {
			setSelectedCustomerName(selectedContainerInfo.customer.name);
		}
	}, [selectedContainerInfo]);


	// Cleanup debounce timer on unmount
	useEffect(() => {
		return () => {
			if (debounceTimerRef.current) {
				clearTimeout(debounceTimerRef.current);
			}
		};
	}, []);

	const loadInitialData = async () => {
		setLoading(true);
		try {
			console.log('Starting to load dropdown data...');
			
			const [shippingLinesData, transportCompaniesData, containerTypesData, customersData] = await Promise.all([
				setupService.getShippingLines().catch(err => {
					console.error('Error loading shipping lines:', err);
					return { data: { data: [] } };
				}),
				setupService.getTransportCompanies().catch(err => {
					console.error('Error loading transport companies:', err);
					return { data: { data: [] } };
				}),
				setupService.getContainerTypes().catch(err => {
					console.error('Error loading container types:', err);
					return { data: { data: [] } };
				}),
				setupService.getCustomers().catch(err => {
					console.error('Error loading customers:', err);
					return { data: { data: [] } };
				})
			]);

			console.log('Raw API responses:', {
				shippingLinesData,
				transportCompaniesData,
				containerTypesData,
				customersData
			});

			// Extract data from response structure
			const shippingLinesArray = Array.isArray(shippingLinesData?.data?.data) ? shippingLinesData.data.data : 
									  Array.isArray(shippingLinesData?.data) ? shippingLinesData.data : [];
			const transportCompaniesArray = Array.isArray(transportCompaniesData?.data?.data) ? transportCompaniesData.data.data : 
										   Array.isArray(transportCompaniesData?.data) ? transportCompaniesData.data : [];
			const containerTypesArray = Array.isArray(containerTypesData?.data?.data) ? containerTypesData.data.data : 
									   Array.isArray(containerTypesData?.data) ? containerTypesData.data : [];
			const customersArray = Array.isArray(customersData?.data?.data) ? customersData.data.data : 
								  Array.isArray(customersData?.data) ? customersData.data : [];
			
			console.log('Processed dropdown data:', {
				shippingLines: shippingLinesArray,
				transportCompanies: transportCompaniesArray,
				containerTypes: containerTypesArray,
				customers: customersArray
			});
			
			setShippingLines(shippingLinesArray);
			setTransportCompanies(transportCompaniesArray);
			setContainerTypes(containerTypesArray);
			setCustomers(customersArray);
		} catch (error) {
			console.error('Error loading initial data:', error);
			// Set fallback data on error
			setShippingLines([
				{ id: '1', code: 'TITANIC', name: 'Titanic', eir: 'TIT', createdAt: '', updatedAt: '' },
				{ id: '2', code: 'AS', name: 'AS', eir: 'AS', createdAt: '', updatedAt: '' }
			]);
			setTransportCompanies([
				{ id: '1', code: 'THANHHOA', name: 'ThanhHoa', address: '', mst: '', phone: '', createdAt: '', updatedAt: '' }
			]);
			setContainerTypes([
				{ id: '1', code: 'CC110', description: 'Container 20ft', createdAt: '', updatedAt: '' }
			]);
			setCustomers([
				{ id: '1', code: 'SON', name: 'Sơn', tax_code: '', address: '', email: '', phone: '', status: 'ACTIVE', createdAt: '', updatedAt: '' }
			]);
		} finally {
			setLoading(false);
		}
	};

	// Function để validate container
	const validateContainer = async (containerNumber: string) => {
		if (!containerNumber || containerNumber.trim().length < 4) {
			setContainerValidationError('');
			return true; // Không validate nếu container quá ngắn
		}

		try {
			// Kiểm tra container có tồn tại trong bãi hay không
			const existsResponse = await containersApi.checkContainerExistsInYard(containerNumber.trim());
			
			if (!existsResponse.success || !existsResponse.data.exists) {
				setContainerValidationError('⚠️ Container không có trong bãi');
				return false;
			}

			// Kiểm tra container có đang được sử dụng cho export request khác hay không
			// Sử dụng API có sẵn để kiểm tra - GIỐNG HỆT CreateLiftRequestModal
			try {
				const requestsResponse = await requestService.getRequests('EXPORT');
				if (requestsResponse.data.success && requestsResponse.data.data) {
					const existingRequests = requestsResponse.data.data;
					const containerInUse = existingRequests.find((request: any) => 
						request.container_no === containerNumber.trim() && 
						request.status !== 'GATE_OUT' && 
						request.status !== 'GATE_REJECTED' &&
						request.status !== 'REJECTED' && // Loại trừ request bị hủy
						request.id !== requestData.id // Loại trừ request hiện tại đang edit
					);
					
					if (containerInUse) {
						setContainerValidationError('⚠️ Container đã được nâng');
						return false;
					}
				}
			} catch (error) {
				console.warn('Could not check if container is in use:', error);
				// Không block validation nếu không thể kiểm tra
			}

			// Container hợp lệ
			setContainerValidationError('');
			return true;
		} catch (error) {
			console.error('Error validating container:', error);
			setContainerValidationError('⚠️ Không thể kiểm tra container. Vui lòng thử lại.');
			return false;
		}
	};

	// Debounced container validation
	const debouncedValidateContainer = (containerNumber: string) => {
		if (debounceTimerRef.current) {
			clearTimeout(debounceTimerRef.current);
		}
		
		debounceTimerRef.current = setTimeout(() => {
			validateContainer(containerNumber);
		}, 500);
	};

	// Search containers by shipping line - COPY TỪ CreateLiftRequestModal
	const searchContainersByShippingLine = async (shippingLineId: string, query: string, customerId?: string) => {
		if (!shippingLineId) {
			setContainerSearchResults([]);
			return;
		}

		setIsSearchingContainers(true);
		try {
			const response = await containersApi.getContainersInYardByShippingLine(
				shippingLineId, 
				query.length > 0 ? query : undefined
			);
			
			if (response.success && response.data) {
				let containersWithDetails = response.data.map((container: any) => ({
					container_no: container.container_no,
					slot_code: container.slot_code || '',
					block_code: container.block_code || '',
					yard_name: container.yard_name || '',
					tier: container.tier,
					placed_at: container.placed_at || '',
					customer: container.customer,
					shipping_line: container.shipping_line,
					container_type: container.container_type,
					seal_number: container.seal_number,
					dem_det: container.dem_det,
					service_status: container.service_status,
					request_type: container.request_type
				}));

				// Filter by customer if specified
				if (customerId) {
					containersWithDetails = containersWithDetails.filter((container: any) => 
						container.customer && container.customer.id === customerId
					);
				}

				// 🔄 BỔ SUNG: Thêm container gốc của request vào danh sách nếu chưa có
				if (requestData?.container_no && requestData.container_no.trim()) {
					console.log('🔍 [EditLiftRequestModal] Adding original container to list:', requestData.container_no);
					
					const originalContainerExists = containersWithDetails.some((container: any) => 
						container.container_no === requestData.container_no.trim()
					);
					
					if (!originalContainerExists) {
						// Tìm container gốc trong danh sách API response để lấy thông tin vị trí
						const originalContainerFromAPI = response.data.find((container: any) => 
							container.container_no === requestData.container_no.trim()
						);
						
						console.log('🔍 [EditLiftRequestModal] Original container from API:', originalContainerFromAPI);
						
						if (originalContainerFromAPI) {
							// Sử dụng thông tin từ API response (giống như các container khác)
							containersWithDetails.unshift({
								container_no: originalContainerFromAPI.container_no,
								slot_code: originalContainerFromAPI.slot_code || '',
								block_code: originalContainerFromAPI.block_code || '',
								yard_name: originalContainerFromAPI.yard_name || '',
								tier: originalContainerFromAPI.tier || '',
								placed_at: originalContainerFromAPI.placed_at || '',
								customer: originalContainerFromAPI.customer || requestData?.customer || null,
								shipping_line: originalContainerFromAPI.shipping_line || requestData?.shipping_line || null,
								container_type: originalContainerFromAPI.container_type || requestData?.container_type || null,
								seal_number: originalContainerFromAPI.seal_number || '',
								dem_det: originalContainerFromAPI.dem_det || '',
								service_status: originalContainerFromAPI.service_status || '',
								request_type: 'ORIGINAL'
							});
							console.log('✅ [EditLiftRequestModal] Added original container with API position data');
						} else {
							// Fallback: thêm container gốc mà không có thông tin vị trí
							containersWithDetails.unshift({
								container_no: requestData.container_no.trim(),
								slot_code: '',
								block_code: '',
								yard_name: '',
								tier: '',
								placed_at: requestData?.placed_at || '',
								customer: requestData?.customer || null,
								shipping_line: requestData?.shipping_line || null,
								container_type: requestData?.container_type || null,
								seal_number: requestData?.seal_number || '',
								dem_det: requestData?.dem_det || '',
								service_status: requestData?.service_status || '',
								request_type: 'ORIGINAL'
							});
							console.log('⚠️ [EditLiftRequestModal] Added original container without position data (not found in API)');
						}
					}
				}
				
				setContainerSearchResults(containersWithDetails);
			} else {
				// Nếu API không trả về dữ liệu nhưng có container gốc của request, vẫn hiển thị container đó
				if (requestData?.container_no && requestData.container_no.trim()) {
					// Lấy thông tin vị trí từ YardPlacement nếu có
					let containerPosition = {
						slot_code: '',
						block_code: '',
						yard_name: '',
						tier: ''
					};

					// Thử lấy thông tin từ requestData trước
					if (requestData?.yard_placement) {
						containerPosition = {
							slot_code: requestData.yard_placement.slot_code || '',
							block_code: requestData.yard_placement.block_code || '',
							yard_name: requestData.yard_placement.yard_name || '',
							tier: requestData.yard_placement.tier || ''
						};
					} else if (requestData?.slot_code || requestData?.block_code) {
						// Fallback: lấy từ requestData trực tiếp
						containerPosition = {
							slot_code: requestData.slot_code || '',
							block_code: requestData.block_code || '',
							yard_name: requestData.yard_name || '',
							tier: requestData.tier || ''
						};
					}

					setContainerSearchResults([{
						container_no: requestData.container_no.trim(),
						slot_code: containerPosition.slot_code,
						block_code: containerPosition.block_code,
						yard_name: containerPosition.yard_name,
						tier: containerPosition.tier,
						placed_at: requestData?.placed_at || '',
						customer: requestData?.customer || null,
						shipping_line: requestData?.shipping_line || null,
						container_type: requestData?.container_type || null,
						seal_number: requestData?.seal_number || '',
						dem_det: requestData?.dem_det || '',
						service_status: requestData?.service_status || '',
						request_type: 'ORIGINAL'
					}]);
				} else {
					setContainerSearchResults([]);
				}
			}
		} catch (error) {
			console.error('Error searching containers in yard by shipping line:', error);
			setContainerSearchResults([]);
		} finally {
			setIsSearchingContainers(false);
		}
	};

	// Load containers when shipping line is selected - COPY TỪ CreateLiftRequestModal
	useEffect(() => {
		if (formData.shippingLine) {
			searchContainersByShippingLine(formData.shippingLine, '', formData.customer);
		}
	}, [formData.shippingLine, formData.customer]);

	// Load container info when container number is set
	useEffect(() => {
		if (formData.containerNumber && formData.containerNumber.trim()) {
			// Tạo thông tin container hiện tại để hiển thị
			const currentContainerInfo = {
				container_no: formData.containerNumber.trim(),
				slot_code: requestData?.slot_code || '',
				block_code: requestData?.block_code || '',
				yard_name: requestData?.yard_name || '',
				tier: requestData?.tier || '',
				placed_at: requestData?.placed_at || '',
				customer: requestData?.customer || null,
				shipping_line: requestData?.shipping_line || null,
				container_type: requestData?.container_type || null,
				seal_number: requestData?.seal_number || '',
				dem_det: requestData?.dem_det || '',
				service_status: requestData?.service_status || '',
				request_type: 'CURRENT'
			};
			setSelectedContainerInfo(currentContainerInfo);
		}
	}, [formData.containerNumber, requestData]);


	const handleInputChange = (field: keyof EditLiftRequestData, value: string) => {
		setFormData(prev => ({
			...prev,
			[field]: value
		}));

		// Clear container validation error when user starts typing
		if (field === 'containerNumber' && containerValidationError) {
			setContainerValidationError('');
		}

		// Trigger container validation when container number changes
		if (field === 'containerNumber' && value.trim()) {
			debouncedValidateContainer(value);
		}

		// Search containers when shipping line or customer changes - COPY TỪ CreateLiftRequestModal
		// Chỉ search khi thay đổi shipping line hoặc customer, KHÔNG search khi thay đổi container number
		if (field === 'shippingLine' || field === 'customer') {
			const shippingLineId = field === 'shippingLine' ? value : formData.shippingLine;
			const customerId = field === 'customer' ? value : formData.customer;
			
			if (shippingLineId) {
				searchContainersByShippingLine(shippingLineId, '', customerId);
			}
		}
	};

	// Hàm riêng để xử lý chọn container từ gợi ý (không trigger search)
	const handleSelectContainer = (container: any) => {
		setFormData(prev => ({
			...prev,
			containerNumber: container.container_no
		}));
		setSelectedContainerInfo(container);
		
		// Clear validation error
		setContainerValidationError('');

		// Auto-fill container type nếu container được chọn có thông tin
		if (container?.container_type?.id) {
			setFormData(prev => ({
				...prev,
				containerType: container.container_type.id
			}));
		}
		
		// Auto-fill customer nếu container được chọn có thông tin và không phải IMPORT
		if (container?.customer?.id && container.request_type !== 'IMPORT') {
			setFormData(prev => ({
				...prev,
				customer: container.customer.id
			}));
		}
	};

	const [existingFiles, setExistingFiles] = useState<ExistingFile[]>([]);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setSubmitting(true);

		try {
			// Validate container if provided
			if (formData.containerNumber && formData.containerNumber.trim()) {
				const isValidContainer = await validateContainer(formData.containerNumber.trim());
				if (!isValidContainer) {
					setSubmitting(false);
					return;
				}
			}

			// Use IDs directly since formData now contains IDs
			const shippingLineId = formData.shippingLine;
			const containerTypeId = formData.containerType;
			const customerId = formData.customer;
			const vehicleCompanyId = formData.vehicleCompany;

			const updateData = {
				type: requestData.type || 'EXPORT', // Giữ nguyên type của request hiện tại, mặc định là EXPORT cho trang nâng container
				request_no: formData.requestNo,
				container_no: formData.containerNumber,
				shipping_line_id: shippingLineId,
				container_type_id: containerTypeId,
				customer_id: customerId,
				vehicle_company_id: vehicleCompanyId,
				license_plate: formData.vehicleNumber,
				driver_name: formData.driver,
				driver_phone: formData.driverPhone,
				appointment_time: formData.appointmentTime,
				booking_bill: formData.bookingBill,
				notes: formData.notes,
				files: formData.documents
			};

			// Update request data first
			await requestService.updateRequest(requestData.id, updateData);
			
			// Upload files if there are any new documents
			if (formData.documents && formData.documents.length > 0) {
				await requestService.uploadFiles(requestData.id, formData.documents);
			}
			
			onSubmit(formData);
			onClose();
		} catch (error) {
			console.error('Error updating request:', error);
			alert('Có lỗi xảy ra khi cập nhật yêu cầu');
		} finally {
			setSubmitting(false);
		}
	};

	if (!isOpen) return null;

	return (
		<div style={{
			position: 'fixed',
			top: 0,
			left: 0,
			width: '100%',
			height: '100%',
			background: 'rgba(0, 0, 0, 0.5)',
			zIndex: 10000,
			display: 'flex',
			alignItems: 'center',
			justifyContent: 'center',
			fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
		}}>
			<div style={{
				background: 'white',
				borderRadius: '16px',
				boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
				maxWidth: '800px',
				width: '90%',
				maxHeight: '90vh',
				overflow: 'auto',
				animation: 'modalSlideIn 0.2s ease-out'
			}}>
			{/* Header */}
				<ModalHeader title="Chỉnh sửa yêu cầu nâng container" onClose={onClose} />

				{/* Form */}
				<form onSubmit={handleSubmit} style={{ padding: '32px' }}>
					{loading ? (
						<div style={{ textAlign: 'center', padding: '40px' }}>
							<div style={{ fontSize: '18px', color: '#6b7280' }}>Đang tải dữ liệu...</div>
						</div>
					) : (
						<div style={{ display: 'grid', gap: '24px' }}>
							{/* COPY FORM FIELDS TỪ CreateLiftRequestModal */}
							<div style={{ display: 'grid', gap: '24px' }}>
								{/* Row 1: Request Number & Shipping Line */}
								<div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
									<div>
										<label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#374151' }}>
											Số yêu cầu *
										</label>
										<input
											type="text"
											value={formData.requestNo}
											onChange={(e) => handleInputChange('requestNo', e.target.value)}
											required
											style={{
												width: '100%',
												padding: '12px',
												border: '1px solid #d1d5db',
												borderRadius: '8px',
												fontSize: '14px',
												background: '#f9fafb',
												color: '#6b7280'
											}}
											readOnly
										/>
										<small style={{ color: '#6b7280', fontSize: '12px' }}>Số yêu cầu không thể thay đổi</small>
									</div>
									<div>
										<label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#374151' }}>
											Hãng tàu *
										</label>
										<select
											value={formData.shippingLine}
											onChange={(e) => handleInputChange('shippingLine', e.target.value)}
											required
											style={{
												width: '100%',
												padding: '12px',
												border: '1px solid #d1d5db',
												borderRadius: '8px',
												fontSize: '14px'
											}}
										>
											<option value="">Chọn hãng tàu</option>
											{Array.isArray(shippingLines) && shippingLines.map(line => (
												<option key={line.id} value={line.id}>{line.name}</option>
											))}
										</select>
									</div>
								</div>

								{/* Row 2: Container Number & Type */}
								<div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
									<div>
										<label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#374151' }}>
											Số container
										</label>
										<input
											type="text"
											value={formData.containerNumber}
											onChange={(e) => handleInputChange('containerNumber', e.target.value)}
											placeholder="Nhập số container"
											style={{
												width: '100%',
												padding: '12px',
												border: containerValidationError ? '1px solid #ef4444' : '1px solid #d1d5db',
												borderRadius: '8px',
												fontSize: '14px'
											}}
										/>
										
										{/* Container validation error */}
										{containerValidationError && (
											<div style={{ fontSize: '12px', color: '#ef4444', marginTop: '4px' }}>
												{containerValidationError}
											</div>
										)}
										
										{/* Container search results */}
										{formData.shippingLine && containerSearchResults.length > 0 && (
											<div style={{ marginTop: '8px' }}>
												<div style={{ fontSize: '12px', color: '#10b981', marginBottom: '4px' }}>
													✅ Tìm thấy {containerSearchResults.length} container có thể nâng 
													{formData.customer ? ' (theo hãng tàu và khách hàng đã chọn)' : ' (theo hãng tàu đã chọn)'}
												</div>
												<div style={{ 
													maxHeight: '200px', 
													overflowY: 'auto', 
													border: '1px solid #e5e7eb', 
													borderRadius: '6px',
													backgroundColor: '#f9fafb'
												}}>
													{containerSearchResults.map((container, index) => (
														<div
															key={index}
															onClick={() => handleSelectContainer(container)}
															style={{
																padding: '8px 12px',
																cursor: 'pointer',
																borderBottom: index < containerSearchResults.length - 1 ? '1px solid #e5e7eb' : 'none',
																backgroundColor: selectedContainerInfo?.container_no === container.container_no ? '#dbeafe' : 'transparent',
																borderLeft: container.request_type === 'ORIGINAL' ? '3px solid #f59e0b' : 'none'
															}}
														>
															<div style={{ fontWeight: '500', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
																{container.container_no}
																{container.request_type === 'ORIGINAL' && (
																	<span style={{ 
																		fontSize: '10px', 
																		backgroundColor: '#f59e0b', 
																		color: 'white', 
																		padding: '2px 6px', 
																		borderRadius: '4px',
																		fontWeight: 'normal'
																	}}>
																		Container gốc
																	</span>
																)}
															</div>
															<div style={{ fontSize: '12px', color: '#6b7280' }}>
																Vị trí: {container.block_code}-{container.slot_code}{container.tier ? `, Tầng ${container.tier}` : ''}
																{container.yard_name && ` • Bãi: ${container.yard_name}`}
															</div>
															{container.customer && (
																<div style={{ fontSize: '12px', color: '#dc2626' }}>
																	Khách hàng: {container.customer.name}
																</div>
															)}
														</div>
													))}
												</div>
											</div>
										)}
										
										{formData.shippingLine && containerSearchResults.length === 0 && !isSearchingContainers && !formData.containerNumber && (
											<div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
												ℹ️ Không có container nào có thể nâng 
												{formData.customer ? ' cho hãng tàu và khách hàng này' : ' cho hãng tàu này'}
											</div>
										)}
										
										{selectedContainerInfo && (
											<div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
												<div>Vị trí: {selectedContainerInfo.block_code}-{selectedContainerInfo.slot_code}{selectedContainerInfo.tier ? `, Tầng ${selectedContainerInfo.tier}` : ''}</div>
												{selectedContainerInfo.yard_name && <div>Bãi: {selectedContainerInfo.yard_name}</div>}
											</div>
										)}
									</div>
									<div>
										<label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#374151' }}>
											Loại container *
										</label>
										<select
											value={formData.containerType}
											onChange={(e) => handleInputChange('containerType', e.target.value)}
											required
											style={{
												width: '100%',
												padding: '12px',
												border: '1px solid #d1d5db',
												borderRadius: '8px',
												fontSize: '14px'
											}}
										>
											<option value="">Chọn loại container</option>
											{Array.isArray(containerTypes) && containerTypes.map(type => (
												<option key={type.id} value={type.id}>{type.code} - {type.description}</option>
											))}
										</select>
									</div>
								</div>

								{/* Row 3: Booking Bill & Customer */}
								<div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
									<div>
										<label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#374151' }}>
											Số Booking/Bill
										</label>
										<input
											type="text"
											value={formData.bookingBill}
											onChange={(e) => handleInputChange('bookingBill', e.target.value)}
											style={{
												width: '100%',
												padding: '12px',
												border: '1px solid #d1d5db',
												borderRadius: '8px',
												fontSize: '14px'
											}}
										/>
									</div>
									<div>
										<label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#374151' }}>
											Khách hàng *
										</label>
										<select
											value={formData.customer}
											onChange={(e) => handleInputChange('customer', e.target.value)}
											required
											style={{
												width: '100%',
												padding: '12px',
												border: '1px solid #d1d5db',
												borderRadius: '8px',
												fontSize: '14px'
											}}
										>
											<option value="">Chọn khách hàng</option>
											{Array.isArray(customers) && customers.map(customer => (
												<option key={customer.id} value={customer.id}>{customer.name}</option>
											))}
										</select>
									</div>
								</div>

								{/* Row 4: Vehicle Company & Vehicle Number */}
								<div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
									<div>
										<label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#374151' }}>
											Nhà xe
										</label>
										<select
											value={formData.vehicleCompany}
											onChange={(e) => handleInputChange('vehicleCompany', e.target.value)}
											style={{
												width: '100%',
												padding: '12px',
												border: '1px solid #d1d5db',
												borderRadius: '8px',
												fontSize: '14px'
											}}
										>
											<option value="">Chọn nhà xe</option>
											{Array.isArray(transportCompanies) && transportCompanies.map(company => (
												<option key={company.id} value={company.id}>{company.name}</option>
											))}
										</select>
									</div>
									<div>
										<label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#374151' }}>
											Số xe
										</label>
										<input
											type="text"
											value={formData.vehicleNumber}
											onChange={(e) => handleInputChange('vehicleNumber', e.target.value)}
											style={{
												width: '100%',
												padding: '12px',
												border: '1px solid #d1d5db',
												borderRadius: '8px',
												fontSize: '14px'
											}}
										/>
									</div>
								</div>

								{/* Row 5: Driver & Driver Phone */}
								<div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
									<div>
										<label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#374151' }}>
											Tài xế
										</label>
										<input
											type="text"
											value={formData.driver}
											onChange={(e) => handleInputChange('driver', e.target.value)}
											style={{
												width: '100%',
												padding: '12px',
												border: '1px solid #d1d5db',
												borderRadius: '8px',
												fontSize: '14px'
											}}
										/>
									</div>
									<div>
										<label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#374151' }}>
											SĐT tài xế
										</label>
										<input
											type="tel"
											value={formData.driverPhone}
											onChange={(e) => handleInputChange('driverPhone', e.target.value)}
											style={{
												width: '100%',
												padding: '12px',
												border: '1px solid #d1d5db',
												borderRadius: '8px',
												fontSize: '14px'
											}}
										/>
									</div>
								</div>

								{/* Row 6: Appointment Time */}
								<div>
									<label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#374151' }}>
										Thời gian hẹn
									</label>
									<input
										type="datetime-local"
										value={formData.appointmentTime}
										onChange={(e) => handleInputChange('appointmentTime', e.target.value)}
										style={{
											width: '100%',
											padding: '12px',
											border: '1px solid #d1d5db',
											borderRadius: '8px',
											fontSize: '14px'
										}}
									/>
								</div>

								{/* Row 7: Notes */}
								<div>
									<label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#374151' }}>
										Ghi chú
									</label>
									<textarea
										value={formData.notes}
										onChange={(e) => handleInputChange('notes', e.target.value)}
										rows={3}
										style={{
											width: '100%',
											padding: '12px',
											border: '1px solid #d1d5db',
											borderRadius: '8px',
											fontSize: '14px',
											resize: 'vertical'
										}}
									/>
								</div>
							</div>

							<DocumentsUploader<EditLiftRequestData>
								formData={formData}
								setFormData={setFormData}
								existingFiles={existingFiles}
							/>
						</div>
					)}

					{/* Footer */}
					<div style={{
						display: 'flex',
						justifyContent: 'flex-end',
						marginTop: '32px',
						paddingTop: '24px',
						borderTop: '1px solid #e5e7eb'
					}}>
						<button
							type="submit"
							disabled={submitting || loading}
							style={{
								padding: '12px 24px',
								border: 'none',
								background: submitting ? '#9ca3af' : '#3b82f6',
								color: 'white',
								borderRadius: '8px',
								fontSize: '14px',
								fontWeight: '500',
								cursor: submitting ? 'not-allowed' : 'pointer',
								transition: 'all 0.2s'
							}}
						>
							{submitting ? 'Đang cập nhật...' : 'Cập nhật yêu cầu'}
						</button>
					</div>
				</form>
			</div>

			<style jsx>{`
				@keyframes modalSlideIn {
					from {
						opacity: 0;
						transform: scale(0.95) translateY(-10px);
					}
					to {
						opacity: 1;
						transform: scale(1) translateY(0);
					}
				}
			`}</style>
		</div>
	);
};
