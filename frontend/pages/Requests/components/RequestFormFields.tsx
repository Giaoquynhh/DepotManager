import React, { useState } from 'react';
import type { EditLiftRequestData } from './EditLiftRequestModal.types';
import type { ShippingLine, TransportCompany, ContainerType, Customer } from '../../../services/setupService';
import DateTimeInput from '../../../components/DateTimeInput';
import { ContainerSearchInput, type ContainerSearchResult } from '../../../components/ContainerSearchInput';

interface RequestFormFieldsProps {
	formData: EditLiftRequestData;
	handleInputChange: (field: keyof EditLiftRequestData, value: string) => void;
	shippingLines: ShippingLine[];
	transportCompanies: TransportCompany[];
	containerTypes: ContainerType[];
	customers: Customer[];
	// Container validation props
	containerValidationError?: string;
	containerSearchResults?: any[];
	isSearchingContainers?: boolean;
	selectedContainerInfo?: any;
	setSelectedContainerInfo?: (info: any) => void;
	selectedCustomerName?: string;
	selectedShippingLineName?: string;
	selectedTransportCompanyName?: string;
}

export const RequestFormFields: React.FC<RequestFormFieldsProps> = ({
	formData,
	handleInputChange,
	shippingLines,
	transportCompanies,
	containerTypes,
	customers,
	// Container validation props
	containerValidationError,
	containerSearchResults = [],
	isSearchingContainers = false,
	selectedContainerInfo: propSelectedContainerInfo,
	setSelectedContainerInfo: propSetSelectedContainerInfo,
	selectedCustomerName,
	selectedShippingLineName,
	selectedTransportCompanyName
}) => {
	const [localSelectedContainerInfo, setLocalSelectedContainerInfo] = useState<ContainerSearchResult | null>(null);
	
	// Use prop values if available, otherwise use local state
	const selectedContainerInfo = propSelectedContainerInfo || localSelectedContainerInfo;
	const setSelectedContainerInfo = propSetSelectedContainerInfo || setLocalSelectedContainerInfo;

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
							<option key={line.id} value={line.id}>{line.name}</option>
						))}
					</select>
					{selectedShippingLineName && (
						<div style={{ fontSize: '12px', color: '#10b981', marginTop: '4px' }}>
							✅ Đã chọn: {selectedShippingLineName}
						</div>
					)}
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
										onClick={() => {
											handleInputChange('containerNumber', container.container_no);
											setSelectedContainerInfo(container);
											
											// Auto-fill container type nếu container được chọn có thông tin
											if (container?.container_type?.id) {
												handleInputChange('containerType', container.container_type.id);
											}
											
											// Auto-fill customer nếu container được chọn có thông tin và không phải IMPORT
											if (container?.customer?.id && container.request_type !== 'IMPORT') {
												handleInputChange('customer', container.customer.id);
											}
										}}
										style={{
											padding: '8px 12px',
											cursor: 'pointer',
											borderBottom: index < containerSearchResults.length - 1 ? '1px solid #e5e7eb' : 'none',
											backgroundColor: selectedContainerInfo?.container_no === container.container_no ? '#dbeafe' : 'transparent'
										}}
									>
										<div style={{ fontWeight: '500', fontSize: '14px' }}>{container.container_no}</div>
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
					
					{formData.shippingLine && containerSearchResults.length === 0 && !isSearchingContainers && (
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
					{selectedCustomerName && (
						<div style={{ fontSize: '12px', color: '#10b981', marginTop: '4px' }}>
							✅ Đã chọn: {selectedCustomerName}
						</div>
					)}
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
					{selectedTransportCompanyName && (
						<div style={{ fontSize: '12px', color: '#10b981', marginTop: '4px' }}>
							✅ Đã chọn: {selectedTransportCompanyName}
						</div>
					)}
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
				<DateTimeInput
					value={formData.appointmentTime}
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
	);
};


