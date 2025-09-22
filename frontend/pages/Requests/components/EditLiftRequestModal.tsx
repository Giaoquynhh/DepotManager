import React, { useEffect, useState, useRef } from 'react';
import { useTranslation } from '../../../hooks/useTranslation';
import { setupService, type ShippingLine, type TransportCompany, type ContainerType, type Customer } from '../../../services/setupService';
import { requestService } from '../../../services/requests';

interface EditLiftRequestModalProps {
	isOpen: boolean;
	onClose: () => void;
	onSubmit: (data: EditLiftRequestData) => void;
	requestData: any; // Data from API
}

export interface EditLiftRequestData {
	requestNo: string;
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

export const EditLiftRequestModal: React.FC<EditLiftRequestModalProps> = ({
	isOpen,
	onClose,
	onSubmit,
	requestData
}) => {
	const { t } = useTranslation();
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
	const fileInputRef = useRef<HTMLInputElement>(null);

	// Load initial data
	useEffect(() => {
		if (isOpen) {
			loadInitialData();
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
				shippingLine: requestData.shipping_line?.name || '',
				bookingBill: requestData.booking_bill || '',
				containerNumber: requestData.container_no || '',
				containerType: requestData.container_type?.code || '',
				serviceType: 'Nâng container',
				customer: requestData.customer?.name || '',
				vehicleCompany: requestData.vehicle_company?.name || '',
				vehicleNumber: requestData.license_plate || '',
				driver: requestData.driver_name || '',
				driverPhone: requestData.driver_phone || '',
				appointmentTime: requestData.appointment_time ? new Date(requestData.appointment_time).toISOString().slice(0, 16) : '',
				documents: [],
				notes: requestData.appointment_note || ''
			});
		}
	}, [requestData, isOpen, loading, shippingLines, containerTypes, customers, transportCompanies]);

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

	const handleInputChange = (field: keyof EditLiftRequestData, value: string) => {
		setFormData(prev => ({
			...prev,
			[field]: value
		}));
	};

	const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const files = Array.from(e.target.files || []);
		setFormData(prev => ({
			...prev,
			documents: [...(prev.documents || []), ...files]
		}));
	};

	const removeFile = (index: number) => {
		setFormData(prev => ({
			...prev,
			documents: prev.documents?.filter((_, i) => i !== index) || []
		}));
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setSubmitting(true);

		try {
			// Find IDs for selected options
			const shippingLineId = Array.isArray(shippingLines) ? shippingLines.find(sl => sl.name === formData.shippingLine)?.id : undefined;
			const containerTypeId = Array.isArray(containerTypes) ? containerTypes.find(ct => ct.code === formData.containerType)?.id : undefined;
			const customerId = Array.isArray(customers) ? customers.find(c => c.name === formData.customer)?.id : undefined;
			const vehicleCompanyId = Array.isArray(transportCompanies) ? transportCompanies.find(tc => tc.name === formData.vehicleCompany)?.id : undefined;

			const updateData = {
				type: 'IMPORT',
				request_no: formData.requestNo,
				container_no: formData.containerNumber,
				shipping_line_id: shippingLineId,
				container_type_id: containerTypeId,
				customer_id: customerId,
				vehicle_company_id: vehicleCompanyId,
				vehicle_number: formData.vehicleNumber,
				driver_name: formData.driver,
				driver_phone: formData.driverPhone,
				appointment_time: formData.appointmentTime,
				booking_bill: formData.bookingBill,
				notes: formData.notes,
				files: formData.documents
			};

			await requestService.updateRequest(requestData.id, updateData);
			onSubmit(formData);
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
				<div style={{
					padding: '24px 32px 16px',
					borderBottom: '1px solid #e5e7eb',
					display: 'flex',
					alignItems: 'center',
					justifyContent: 'space-between'
				}}>
					<h2 style={{
						margin: 0,
						fontSize: '20px',
						fontWeight: '600',
						color: '#1f2937'
					}}>
						Chỉnh sửa yêu cầu nâng container
					</h2>
					<button
						onClick={onClose}
						style={{
							background: 'none',
							border: 'none',
							fontSize: '24px',
							cursor: 'pointer',
							color: '#6b7280',
							padding: '4px',
							borderRadius: '4px',
							transition: 'all 0.2s'
						}}
						onMouseOver={(e) => {
							e.currentTarget.style.background = '#f3f4f6';
							e.currentTarget.style.color = '#374151';
						}}
						onMouseOut={(e) => {
							e.currentTarget.style.background = 'none';
							e.currentTarget.style.color = '#6b7280';
						}}
					>
						×
					</button>
				</div>

				{/* Form */}
				<form onSubmit={handleSubmit} style={{ padding: '32px' }}>
					{loading ? (
						<div style={{ textAlign: 'center', padding: '40px' }}>
							<div style={{ fontSize: '18px', color: '#6b7280' }}>Đang tải dữ liệu...</div>
						</div>
					) : (
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
											<option key={line.id} value={line.name}>{line.name}</option>
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
											<option key={type.id} value={type.code}>{type.code} - {type.name}</option>
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
											<option key={customer.id} value={customer.name}>{customer.name}</option>
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
											<option key={company.id} value={company.name}>{company.name}</option>
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

							{/* File Upload */}
							<div>
								<label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#374151' }}>
									Tài liệu đính kèm
								</label>
								<input
									ref={fileInputRef}
									type="file"
									multiple
									onChange={handleFileChange}
									style={{ display: 'none' }}
								/>
								<button
									type="button"
									onClick={() => fileInputRef.current?.click()}
									style={{
										padding: '12px 16px',
										border: '2px dashed #d1d5db',
										borderRadius: '8px',
										background: '#f9fafb',
										color: '#6b7280',
										cursor: 'pointer',
										width: '100%',
										fontSize: '14px',
										transition: 'all 0.2s'
									}}
									onMouseOver={(e) => {
										e.currentTarget.style.borderColor = '#9ca3af';
										e.currentTarget.style.background = '#f3f4f6';
									}}
									onMouseOut={(e) => {
										e.currentTarget.style.borderColor = '#d1d5db';
										e.currentTarget.style.background = '#f9fafb';
									}}
								>
									+ Thêm tài liệu
								</button>
								
								{formData.documents && formData.documents.length > 0 && (
									<div style={{ marginTop: '12px' }}>
										{formData.documents.map((file, index) => (
											<div key={index} style={{
												display: 'flex',
												alignItems: 'center',
												justifyContent: 'space-between',
												padding: '8px 12px',
												background: '#f3f4f6',
												borderRadius: '6px',
												marginBottom: '8px'
											}}>
												<span style={{ fontSize: '14px', color: '#374151' }}>
													{file.name}
												</span>
												<button
													type="button"
													onClick={() => removeFile(index)}
													style={{
														background: 'none',
														border: 'none',
														color: '#ef4444',
														cursor: 'pointer',
														fontSize: '16px',
														padding: '4px'
													}}
												>
													×
												</button>
											</div>
										))}
									</div>
								)}
							</div>
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
