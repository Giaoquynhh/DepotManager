import React, { useState, useEffect, useRef } from 'react';
import { containersApi } from '../services/containers';

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
	service_status?: string; // EMPTY_IN_YARD hoặc GATE_OUT
	request_type?: string; // SYSTEM_ADMIN_ADDED hoặc IMPORT
}

interface ContainerSearchInputProps {
	value: string;
	onChange: (value: string) => void;
	onSelect?: (container: ContainerSearchResult | null) => void;
	placeholder?: string;
	style?: React.CSSProperties;
	error?: boolean;
	shippingLineId?: string;
	containerTypeId?: string;
	disabled?: boolean;
}

export const ContainerSearchInput: React.FC<ContainerSearchInputProps> = ({
	value,
	onChange,
	onSelect,
	placeholder = "Chọn container hoặc nhập để tìm kiếm",
	style,
	error = false,
	shippingLineId,
	containerTypeId,
	disabled = false
}) => {
	const [isOpen, setIsOpen] = useState(false);
	const [searchResults, setSearchResults] = useState<ContainerSearchResult[]>([]);
	const [isSearching, setIsSearching] = useState(false);
	const [searchQuery, setSearchQuery] = useState('');
	const dropdownRef = useRef<HTMLDivElement>(null);
	const inputRef = useRef<HTMLInputElement>(null);

	// Search containers based on shipping line and container type
	const searchContainers = async (query: string = '') => {
		if (!shippingLineId) {
			setSearchResults([]);
			return;
		}

		setIsSearching(true);
		try {
			// Gọi API với tham số lọc theo shipping line và container type
			const response = await containersApi.getContainersInYardByShippingLineAndType(
				shippingLineId,
				containerTypeId,
				query.length > 0 ? query : undefined
			);
			
			if (response.success && response.data) {
				setSearchResults(response.data);
			} else {
				setSearchResults([]);
			}
		} catch (error) {
			console.error('Error searching containers:', error);
			setSearchResults([]);
		} finally {
			setIsSearching(false);
		}
	};

	// Debounced search
	useEffect(() => {
		const timeoutId = setTimeout(() => {
			if (shippingLineId && searchQuery.length >= 2) {
				searchContainers(searchQuery);
			} else if (shippingLineId && searchQuery.length === 0) {
				// Show all containers when search is cleared
				searchContainers('');
			}
		}, 300);

		return () => clearTimeout(timeoutId);
	}, [searchQuery, shippingLineId, containerTypeId]);

	// Load containers when shipping line or container type changes
	useEffect(() => {
		if (shippingLineId) {
			searchContainers('');
		} else {
			setSearchResults([]);
		}
	}, [shippingLineId, containerTypeId]);

	// Close dropdown when clicking outside
	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
				setIsOpen(false);
			}
		};

		document.addEventListener('mousedown', handleClickOutside);
		return () => document.removeEventListener('mousedown', handleClickOutside);
	}, []);

	const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const newValue = e.target.value;
		onChange(newValue);
		setSearchQuery(newValue);
		setIsOpen(true);
	};

	const handleInputFocus = () => {
		if (shippingLineId) {
			setIsOpen(true);
		}
	};

	const handleContainerSelect = (container: ContainerSearchResult) => {
		onChange(container.container_no);
		setIsOpen(false);
		setSearchQuery('');
		onSelect?.(container);
	};

	const handleClear = () => {
		onChange('');
		setSearchQuery('');
		setIsOpen(false);
		onSelect?.(null);
	};

	return (
		<div style={{ position: 'relative', width: '100%' }} ref={dropdownRef}>
			<input
				ref={inputRef}
				type="text"
				value={value}
				onChange={handleInputChange}
				onFocus={handleInputFocus}
				placeholder={placeholder}
				disabled={disabled}
				style={{
					width: '100%',
					padding: '12px',
					border: `1px solid ${error ? '#ef4444' : '#d1d5db'}`,
					borderRadius: '8px',
					fontSize: '14px',
					background: disabled ? '#f9fafb' : 'white',
					color: disabled ? '#6b7280' : '#374151',
					...style
				}}
			/>
			
			{/* Clear button */}
			{value && !disabled && (
				<button
					type="button"
					onClick={handleClear}
					style={{
						position: 'absolute',
						right: '8px',
						top: '50%',
						transform: 'translateY(-50%)',
						background: 'none',
						border: 'none',
						color: '#6b7280',
						cursor: 'pointer',
						padding: '4px',
						fontSize: '16px'
					}}
				>
					×
				</button>
			)}

			{/* Dropdown */}
			{isOpen && (
				<div style={{
					position: 'absolute',
					top: '100%',
					left: 0,
					right: 0,
					background: 'white',
					border: '1px solid #d1d5db',
					borderRadius: '8px',
					boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
					zIndex: 1000,
					maxHeight: '300px',
					overflow: 'auto'
				}}>
					{/* Header */}
					<div style={{
						padding: '8px 12px',
						borderBottom: '1px solid #e2e8f0',
						background: '#f8fafc'
					}}>
						<span style={{ fontSize: '12px', color: '#64748b', fontWeight: '500' }}>
							{searchQuery.length > 0 ? `Tìm kiếm: "${searchQuery}"` : 'Danh sách container'}
						</span>
						<button
							type="button"
							onClick={(e) => {
								e.stopPropagation();
								setIsOpen(false);
							}}
							style={{
								float: 'right',
								background: 'none',
								border: 'none',
								color: '#6b7280',
								cursor: 'pointer',
								fontSize: '16px'
							}}
						>
							×
						</button>
					</div>

					{/* Content */}
					{isSearching ? (
						<div style={{ padding: '12px 16px', textAlign: 'center', color: '#64748b' }}>
							Đang tải danh sách container...
						</div>
					) : searchResults.length > 0 ? (
						<div>
							{searchResults.map((container) => (
								<div
									key={container.container_no}
									style={{
										padding: '12px 16px',
										cursor: 'pointer',
										borderBottom: '1px solid #f1f5f9',
										transition: 'background-color 0.2s'
									}}
									onMouseEnter={(e) => {
										e.currentTarget.style.backgroundColor = '#f8fafc';
									}}
									onMouseLeave={(e) => {
										e.currentTarget.style.backgroundColor = 'white';
									}}
									onClick={() => handleContainerSelect(container)}
								>
									<div style={{ fontWeight: '600', color: '#1f2937' }}>
										{container.container_no}
									</div>
									<div style={{ fontSize: '12px', color: '#64748b' }}>
										{container.shipping_line?.name} • {container.container_type?.code}
									</div>
									<div style={{ fontSize: '11px', color: '#64748b' }}>
										Vị trí: {container.block_code}-{container.slot_code}
										{container.tier && `, Tầng ${container.tier}`}
									</div>
									{container.customer && (
										<div style={{ fontSize: '11px', color: '#64748b' }}>
											Khách hàng: {container.customer.name}
										</div>
									)}
								</div>
							))}
						</div>
					) : searchQuery.length >= 2 ? (
						<div style={{ padding: '12px 16px', color: '#64748b', textAlign: 'center' }}>
							Không tìm thấy container nào phù hợp
						</div>
					) : (
						<div style={{ padding: '12px 16px', color: '#64748b', textAlign: 'center' }}>
							{!shippingLineId ? 'Vui lòng chọn hãng tàu' : 
							 !containerTypeId ? 'Vui lòng chọn loại container' :
							 'Không có container nào có thể nâng'}
						</div>
					)}
				</div>
			)}

			{/* Status messages */}
			{!shippingLineId && (
				<div style={{ fontSize: '12px', color: '#f59e0b', marginTop: '4px' }}>
					⚠️ Vui lòng chọn hãng tàu để xem danh sách container
				</div>
			)}
			{shippingLineId && !containerTypeId && (
				<div style={{ fontSize: '12px', color: '#f59e0b', marginTop: '4px' }}>
					⚠️ Vui lòng chọn loại container để lọc danh sách
				</div>
			)}
			{shippingLineId && containerTypeId && searchResults.length > 0 && (
				<div style={{ fontSize: '12px', color: '#10b981', marginTop: '4px' }}>
					✅ Tìm thấy {searchResults.length} container có thể nâng (EMPTY_IN_YARD hoặc GATE_OUT-IMPORT)
				</div>
			)}
			{shippingLineId && containerTypeId && searchResults.length === 0 && !isSearching && (
				<div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
					ℹ️ Không có container nào có thể nâng cho hãng tàu và loại container này
				</div>
			)}
		</div>
	);
};