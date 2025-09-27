import React, { useEffect, useState } from 'react';
import { useTranslation } from '../../../hooks/useTranslation';
import { setupService, type ShippingLine } from '../../../services/setupService';
import { sealsApi, type UpdateSealData, type Seal } from '../../../services/seals';

interface EditSealModalProps {
	isOpen: boolean;
	onClose: () => void;
	onSubmit: (data: UpdateSealData) => void;
	seal: Seal | null;
}

export interface EditSealFormData {
	shipping_company: string;
	purchase_date: string;
	quantity_purchased: number;
	unit_price: number;
	pickup_location: string;
}

export interface EditSealFormErrors {
	shipping_company?: string;
	purchase_date?: string;
	quantity_purchased?: string;
	unit_price?: string;
	pickup_location?: string;
}

export const EditSealModal: React.FC<EditSealModalProps> = ({
	isOpen,
	onClose,
	onSubmit,
	seal
}) => {
	const { t } = useTranslation();
	const [formData, setFormData] = useState<EditSealFormData>({
		shipping_company: '',
		purchase_date: '',
		quantity_purchased: 0,
		unit_price: 0,
		pickup_location: ''
	});

	const [errors, setErrors] = useState<EditSealFormErrors>({});

	// Shipping lines (chỉ để hiển thị tên hãng tàu)
	const [shippingLines, setShippingLines] = useState<ShippingLine[]>([]);

	// Load shipping lines
	useEffect(() => {
		(async () => {
			try {
				const slRes = await setupService.getShippingLines({ page: 1, limit: 100 });
				if (slRes.success && slRes.data) setShippingLines(slRes.data.data);
			} catch (_) {}
		})();
	}, []);

	// Load seal data when modal opens
	useEffect(() => {
		if (isOpen && seal) {
			setFormData({
				shipping_company: seal.shipping_company, // Giữ nguyên tên hãng tàu
				purchase_date: seal.purchase_date.split('T')[0],
				quantity_purchased: seal.quantity_purchased,
				unit_price: Number(seal.unit_price),
				pickup_location: seal.pickup_location
			});
		}
	}, [isOpen, seal]);

	// Không cần dropdown logic nữa vì hãng tàu không thể sửa

	const handleInputChange = (field: keyof EditSealFormData, value: string | number) => {
		// Không cho phép thay đổi hãng tàu
		if (field === 'shipping_company') {
			return;
		}
		
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
		const newErrors: EditSealFormErrors = {};

		// Không validate hãng tàu vì không thể sửa
		if (!formData.purchase_date.trim()) {
			newErrors.purchase_date = 'Ngày mua là bắt buộc';
		}
		if (!formData.quantity_purchased || formData.quantity_purchased <= 0) {
			newErrors.quantity_purchased = 'Số lượng mua phải lớn hơn 0';
		}
		if (!formData.unit_price || formData.unit_price <= 0) {
			newErrors.unit_price = 'Đơn giá phải lớn hơn 0';
		}
		if (!formData.pickup_location.trim()) {
			newErrors.pickup_location = 'Nơi lấy là bắt buộc';
		}

		setErrors(newErrors);
		return Object.keys(newErrors).length === 0;
	};

	const formatNumber = (num: number) => {
		return new Intl.NumberFormat('vi-VN').format(num);
	};

	const parseFormattedNumber = (str: string) => {
		return parseInt(str.replace(/\./g, '')) || 0;
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		
		if (validateForm()) {
			try {
				// Chuyển đổi ngày thành ISO-8601 DateTime đầy đủ
				const purchaseDate = new Date(formData.purchase_date + 'T00:00:00.000Z').toISOString();

				const updateData: UpdateSealData = {
					// Không gửi shipping_company vì không thể sửa
					purchase_date: purchaseDate,
					quantity_purchased: formData.quantity_purchased,
					unit_price: formData.unit_price,
					pickup_location: formData.pickup_location
				};

				// Call parent onSubmit with data
				onSubmit(updateData);
				
				// Reset form
				setFormData({
					shipping_company: '',
					purchase_date: '',
					quantity_purchased: 0,
					unit_price: 0,
					pickup_location: ''
				});
				onClose();
			} catch (error: any) {
				console.error('Update seal error:', error);
				alert('Có lỗi xảy ra khi cập nhật seal: ' + (error.response?.data?.message || error.message));
			}
		}
	};

	const handleClose = () => {
		setErrors({});
		onClose();
	};

	if (!isOpen || !seal) return null;

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

	const formInputDisabledStyle = {
		...formInputStyle,
		background: '#f8fafc',
		color: '#64748b',
		cursor: 'not-allowed',
		borderColor: '#e2e8f0'
	};

	const formInputErrorStyle = {
		...formInputStyle,
		borderColor: '#ef4444',
		boxShadow: '0 0 0 3px rgba(239, 68, 68, 0.1)'
	};

	const errorMessageStyle = {
		fontSize: '12px',
		color: '#ef4444',
		marginTop: '4px',
		fontWeight: '500'
	};

	// Không cần CSS cho dropdown vì hãng tàu không thể sửa

	return (
		<>
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
					}}>Sửa Seal</h2>
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
						{/* Hãng tàu - Read Only */}
						<div style={formGroupStyle}>
							<label style={formLabelStyle}>
								Hãng tàu
							</label>
							<input
								type="text"
								style={formInputDisabledStyle}
								value={seal?.shipping_company || ''}
								readOnly
								disabled
							/>
							<div style={{
								background: '#fef3c7',
								border: '1px solid #f59e0b',
								borderRadius: '6px',
								padding: '8px 12px',
								marginTop: '8px',
								fontSize: '13px',
								color: '#92400e',
								display: 'flex',
								alignItems: 'center',
								gap: '6px'
							}}>
								<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
									<path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"/>
								</svg>
								Hãng tàu không thể thay đổi
							</div>
						</div>

						{/* Ngày mua - Required */}
						<div style={formGroupStyle}>
							<label style={requiredLabelStyle}>
								Ngày mua <span style={requiredAsteriskStyle}>*</span>
							</label>
							<input
								type="date"
								style={errors.purchase_date ? formInputErrorStyle : formInputStyle}
								value={formData.purchase_date}
								onChange={(e) => handleInputChange('purchase_date', e.target.value)}
							/>
							{errors.purchase_date && <span style={errorMessageStyle}>{errors.purchase_date}</span>}
						</div>

						{/* Số lượng mua - Required */}
						<div style={formGroupStyle}>
							<label style={requiredLabelStyle}>
								Số lượng mua <span style={requiredAsteriskStyle}>*</span>
							</label>
							<input
								type="number"
								min="1"
								style={errors.quantity_purchased ? formInputErrorStyle : formInputStyle}
								value={formData.quantity_purchased || ''}
								onChange={(e) => handleInputChange('quantity_purchased', parseInt(e.target.value) || 0)}
								placeholder="Nhập số lượng mua"
							/>
							{errors.quantity_purchased && <span style={errorMessageStyle}>{errors.quantity_purchased}</span>}
						</div>


						{/* Đơn giá - Required */}
						<div style={formGroupStyle}>
							<label style={requiredLabelStyle}>
								Đơn giá (VND) <span style={requiredAsteriskStyle}>*</span>
							</label>
							<input
								type="text"
								style={errors.unit_price ? formInputErrorStyle : formInputStyle}
								value={formData.unit_price > 0 ? formatNumber(formData.unit_price) : ''}
								onChange={(e) => {
									const value = parseFormattedNumber(e.target.value);
									handleInputChange('unit_price', value);
								}}
								placeholder="Nhập đơn giá (VD: 1.000.000)"
							/>
							{errors.unit_price && <span style={errorMessageStyle}>{errors.unit_price}</span>}
						</div>

						{/* Nơi lấy - Required */}
						<div style={formGroupStyle}>
							<label style={requiredLabelStyle}>
								Nơi lấy <span style={requiredAsteriskStyle}>*</span>
							</label>
							<input
								type="text"
								style={errors.pickup_location ? formInputErrorStyle : formInputStyle}
								value={formData.pickup_location}
								onChange={(e) => handleInputChange('pickup_location', e.target.value)}
								placeholder="Nhập nơi lấy"
							/>
							{errors.pickup_location && <span style={errorMessageStyle}>{errors.pickup_location}</span>}
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
							Cập nhật
						</button>
					</div>
				</form>
			</div>
		</div>
		</>
	);
};
