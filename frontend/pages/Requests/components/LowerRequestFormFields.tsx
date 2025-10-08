import React from 'react';
import type { EditLowerRequestData } from './EditLowerRequestModal.types';
import type { Customer } from '../../../services/setupService';
import DateTimeInput from '../../../components/DateTimeInput';
import DateInput from '../../../components/DateInput';

interface LowerRequestFormFieldsProps {
	formData: EditLowerRequestData;
	handleInputChange: (field: keyof EditLowerRequestData, value: string) => void;
	shippingLines: ShippingLine[];
	transportCompanies: TransportCompany[];
	containerTypes: ContainerType[];
	customers: Customer[];
}

export const LowerRequestFormFields: React.FC<LowerRequestFormFieldsProps> = ({
	formData,
	handleInputChange,
	shippingLines,
	transportCompanies,
	containerTypes,
	customers
}) => {
	return (
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
						value={formData.containerNumber || ''}
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
							<option key={type.id} value={type.code}>{type.code} - {type.description}</option>
						))}
					</select>
				</div>
			</div>

			{/* Row 3: Customer Only (No Booking Bill for Lower Container) */}
			<div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '16px' }}>
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
							fontSize: '14px',
							maxHeight: '200px',
							overflowY: 'auto'
						}}
					>
						<option value="">Chọn khách hàng</option>
						{Array.isArray(customers) && customers.map(customer => (
							<option key={customer.id} value={customer.id}>
								{customer.code} - {customer.name}
							</option>
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
						value={formData.vehicleCompany || ''}
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
						value={formData.vehicleNumber || ''}
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

			{/* Row 5: Driver Name & Phone */}
			<div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
				<div>
					<label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#374151' }}>
						Tài xế
					</label>
					<input
						type="text"
						value={formData.driver || ''}
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
						SDT tài xế
					</label>
					<input
						type="tel"
						value={formData.driverPhone || ''}
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
			<div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '16px' }}>
				<div>
					<label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#374151' }}>
						Thời gian hẹn
					</label>
					<DateTimeInput
						value={formData.appointmentTime || ''}
						onChange={(value) => handleInputChange('appointmentTime', value)}
						placeholder="dd/mm/yyyy hh:mm"
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

			{/* Row 7: DEM/DET */}
			<div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '16px' }}>
				<div>
					<DateInput
						value={formData.demDet || ''}
						onChange={(value) => handleInputChange('demDet', value)}
						placeholder="dd/mm/yyyy"
						style={{
							width: '100%',
							padding: '12px 16px',
							border: '2px solid #e2e8f0',
							borderRadius: '8px',
							fontSize: '14px',
							color: '#374151',
							transition: 'all 0.2s ease',
							outline: 'none',
							backgroundColor: 'white'
						}}
					/>
				</div>
			</div>

			{/* Row 8: Notes */}
			<div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '16px' }}>
				<div>
					<label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#374151' }}>
						Ghi chú
					</label>
					<textarea
						value={formData.notes || ''}
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
		</div>
	);
};
