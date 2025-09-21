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
	quantity_exported: number;
	unit_price: number;
	pickup_location: string;
	status: 'ACTIVE' | 'INACTIVE';
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
		quantity_exported: 0,
		unit_price: 0,
		pickup_location: '',
		status: 'ACTIVE'
	});

	const [errors, setErrors] = useState<Partial<EditSealFormData>>({});

	// Shipping lines
	const [shippingLines, setShippingLines] = useState<ShippingLine[]>([]);
	const [selectedShippingLineName, setSelectedShippingLineName] = useState<string>('');

	// Custom dropdown states
	const [isShippingLineOpen, setIsShippingLineOpen] = useState(false);
	const [shippingLineSearch, setShippingLineSearch] = useState('');

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
			// Tìm ID hãng tàu từ tên
			const shippingLineId = shippingLines.find(line => line.name === seal.shipping_company)?.id || '';
			
			setFormData({
				shipping_company: shippingLineId,
				purchase_date: seal.purchase_date.split('T')[0],
				quantity_purchased: seal.quantity_purchased,
				quantity_exported: seal.quantity_exported,
				unit_price: Number(seal.unit_price),
				pickup_location: seal.pickup_location,
				status: seal.status as 'ACTIVE' | 'INACTIVE'
			});
		}
	}, [isOpen, seal, shippingLines]);

	// Close dropdowns when clicking outside
	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			const target = event.target as HTMLElement;
			if (!target.closest('.custom-dropdown-container')) {
				setIsShippingLineOpen(false);
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

	const handleInputChange = (field: keyof EditSealFormData, value: string | number) => {
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
		const newErrors: Partial<EditSealFormData> = {};

		if (!formData.shipping_company.trim()) {
			newErrors.shipping_company = 'Hãng tàu là bắt buộc';
		}
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
				// Tìm tên hãng tàu từ ID
				const selectedShippingLine = shippingLines.find(line => line.id === formData.shipping_company);
				const shippingCompanyName = selectedShippingLine ? selectedShippingLine.name : formData.shipping_company;

				// Chuyển đổi ngày thành ISO-8601 DateTime đầy đủ
				const purchaseDate = new Date(formData.purchase_date + 'T00:00:00.000Z').toISOString();

				const updateData: UpdateSealData = {
					...formData,
					shipping_company: shippingCompanyName, // Lưu tên hãng tàu vào database
					purchase_date: purchaseDate, // Chuyển đổi thành DateTime đầy đủ
					quantity_exported: formData.quantity_exported || 0
				};

				// Call parent onSubmit with data
				onSubmit(updateData);
				
				// Reset form
				setFormData({
					shipping_company: '',
					purchase_date: '',
					quantity_purchased: 0,
					quantity_exported: 0,
					unit_price: 0,
					pickup_location: '',
					status: 'ACTIVE'
				});
				setSelectedShippingLineName('');
				onClose();
			} catch (error: any) {
				console.error('Update seal error:', error);
				alert('Có lỗi xảy ra khi cập nhật seal: ' + (error.response?.data?.message || error.message));
			}
		}
	};

	const handleClose = () => {
		setErrors({});
		setIsShippingLineOpen(false);
		setShippingLineSearch('');
		setSelectedShippingLineName('');
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
						{/* Hãng tàu - Required */}
						<div style={formGroupStyle}>
							<label style={requiredLabelStyle}>
								Hãng tàu <span style={requiredAsteriskStyle}>*</span>
							</label>
							<div className="custom-dropdown-container">
								<button
									type="button"
									className={`custom-dropdown-button ${errors.shipping_company ? 'error' : ''}`}
									onClick={() => {
										setIsShippingLineOpen(!isShippingLineOpen);
										if (!isShippingLineOpen) {
											setShippingLineSearch('');
										}
									}}
								>
									<span>
										{formData.shipping_company 
											? `${shippingLines.find(s => s.id === formData.shipping_company)?.code} - ${shippingLines.find(s => s.id === formData.shipping_company)?.name}`
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
														handleInputChange('shipping_company', sl.id);
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
							{errors.shipping_company && <span style={errorMessageStyle}>{errors.shipping_company}</span>}
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

						{/* Số lượng đã xuất - Optional */}
						<div style={formGroupStyle}>
							<label style={formLabelStyle}>
								Số lượng đã xuất
							</label>
							<input
								type="number"
								min="0"
								style={formInputStyle}
								value={formData.quantity_exported || ''}
								onChange={(e) => handleInputChange('quantity_exported', parseInt(e.target.value) || 0)}
								placeholder="Nhập số lượng đã xuất"
							/>
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

						{/* Trạng thái - Optional */}
						<div style={formGroupStyle}>
							<label style={formLabelStyle}>
								Trạng thái
							</label>
							<select
								style={formInputStyle}
								value={formData.status}
								onChange={(e) => handleInputChange('status', e.target.value as 'ACTIVE' | 'INACTIVE')}
							>
								<option value="ACTIVE">Hoạt động</option>
								<option value="INACTIVE">Không hoạt động</option>
							</select>
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
							Cập nhật
						</button>
					</div>
				</form>
			</div>
		</div>
		</>
	);
};
