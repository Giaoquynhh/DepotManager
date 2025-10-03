import React, { useEffect, useState } from 'react';
import { setupService, type ShippingLine, type TransportCompany, type ContainerType, type Customer } from '../../../services/setupService';
import { requestService } from '../../../services/requests';
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

	const [existingFiles, setExistingFiles] = useState<ExistingFile[]>([]);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setSubmitting(true);

		try {
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
							<RequestFormFields
								formData={formData}
								handleInputChange={handleInputChange}
								shippingLines={shippingLines as ShippingLine[]}
								transportCompanies={transportCompanies as TransportCompany[]}
								containerTypes={containerTypes as ContainerType[]}
								customers={customers as Customer[]}
							/>

							<DocumentsUploader
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
