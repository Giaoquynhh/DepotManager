import React, { useEffect, useState } from 'react';
import { useTranslation } from '../../../hooks/useTranslation';
import { setupService, type ShippingLine, type TransportCompany, type ContainerType } from '../../../services/setupService';

interface CreateLiftRequestModalProps {
	isOpen: boolean;
	onClose: () => void;
	onSubmit: (data: LiftRequestData) => void;
}

export interface LiftRequestData {
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
	documents?: string;
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
		documents: '',
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

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		
		if (validateForm()) {
			onSubmit(formData);
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
				documents: '',
				notes: ''
			});
			onClose();
		}
	};

	const handleClose = () => {
		setErrors({});
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

	return (
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
							<select
								style={errors.shippingLine ? formSelectErrorStyle : formSelectStyle}
								value={formData.shippingLine}
								onChange={(e) => {
									const id = e.target.value;
									handleInputChange('shippingLine', id);
									const sl = shippingLines.find(s => s.id === id);
									setSelectedShippingLineName(sl?.name || '');
								}}
							>
								<option value="">Chọn hãng tàu</option>
								{shippingLines.map(sl => (
									<option key={sl.id} value={sl.id}>{`${sl.code} - ${sl.name}`}</option>
								))}
							</select>
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
							<input
								type="text"
								style={formInputStyle}
								value={formData.containerNumber}
								onChange={(e) => handleInputChange('containerNumber', e.target.value)}
								placeholder="Nhập số container"
							/>
						</div>

						{/* Loại cont - Required (id mapping, display code + description) */}
						<div style={formGroupStyle}>
							<label style={requiredLabelStyle}>
								Loại container <span style={requiredAsteriskStyle}>*</span>
							</label>
							<select
								style={errors.containerType ? formSelectErrorStyle : formSelectStyle}
								value={formData.containerType}
								onChange={(e) => handleInputChange('containerType', e.target.value)}
							>
								<option value="">Chọn loại container</option>
								{containerTypes.map(ct => (
									<option key={ct.id} value={ct.id}>{`${ct.code} - ${ct.description}`}</option>
								))}
							</select>
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
							<select
								style={formSelectStyle}
								value={formData.vehicleCompany || ''}
								onChange={(e) => {
									const id = e.target.value;
									handleInputChange('vehicleCompany', id);
									const tc = transportCompanies.find(c => c.id === id);
									setSelectedTransportCompanyName(tc?.name || '');
								}}
							>
								<option value="">Chọn nhà xe</option>
								{transportCompanies.map(tc => (
									<option key={tc.id} value={tc.id}>{`${tc.code} - ${tc.name}`}</option>
								))}
							</select>
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
							<input
								type="file"
								style={formInputStyle}
								accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
								onChange={(e) => handleInputChange('documents', e.target.files?.[0]?.name || '')}
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
							style={{
								padding: '12px 24px',
								borderRadius: '8px',
								fontSize: '14px',
								fontWeight: '600',
								cursor: 'pointer',
								transition: 'all 0.2s ease',
								border: 'none',
								background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
								color: 'white',
								boxShadow: '0 4px 6px rgba(59, 130, 246, 0.3)'
							}}
						>
							Tạo yêu cầu
						</button>
					</div>
				</form>
			</div>
		</div>
	);
};