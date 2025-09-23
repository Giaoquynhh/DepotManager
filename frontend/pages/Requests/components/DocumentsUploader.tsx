import React, { useRef } from 'react';
import { formatFileSize, isImage } from './fileUtils';
import type { ExistingFile, EditLiftRequestData } from './EditLiftRequestModal.types';

interface DocumentsUploaderProps {
	formData: EditLiftRequestData;
	setFormData: React.Dispatch<React.SetStateAction<EditLiftRequestData>>;
	existingFiles: ExistingFile[];
}

export const DocumentsUploader: React.FC<DocumentsUploaderProps> = ({ formData, setFormData, existingFiles }) => {
	const fileInputRef = useRef<HTMLInputElement>(null);

	const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const incoming = Array.from(e.target.files || []);
		const filtered = incoming.filter(file => {
			const isValidType = file.type === 'application/pdf' || file.type.startsWith('image/');
			const isValidSize = file.size <= 10 * 1024 * 1024;
			return isValidType && isValidSize;
		});
		if (!filtered.length) return;
		setFormData(prev => ({
			...prev,
			documents: [...(prev.documents || []), ...filtered]
		}));
	};

	const removeFile = (index: number) => {
		setFormData(prev => ({
			...prev,
			documents: prev.documents?.filter((_, i) => i !== index) || []
		}));
	};

	return (
		<div>
			<label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#374151' }}>
				Chứng từ
			</label>
			<input
				ref={fileInputRef}
				type="file"
				multiple
				accept=".pdf,.jpg,.jpeg,.png"
				onChange={handleFileChange}
				style={{ display: 'none' }}
				id="edit-documents"
			/>
			<label htmlFor="edit-documents" style={{
				display: 'block',
				textAlign: 'center',
				padding: '16px',
				border: '2px dashed #d1d5db',
				borderRadius: '8px',
				background: '#f9fafb',
				color: '#64748b',
				cursor: 'pointer'
			}}>
				<svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ display: 'block', margin: '0 auto 8px' }}>
					<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
					<polyline points="14,2 14,8 20,8"></polyline>
					<line x1="16" y1="13" x2="8" y2="13"></line>
					<line x1="16" y1="17" x2="8" y2="17"></line>
					<polyline points="10,9 9,9 8,9"></polyline>
				</svg>
				<div style={{ fontSize: '15px', fontWeight: 600, color: '#374151' }}>Kéo thả file vào đây hoặc click để chọn</div>
				<div style={{ fontSize: '13px', color: '#64748b' }}>Hỗ trợ PDF, JPG, PNG (tối đa 10MB mỗi file)</div>
			</label>

			{(existingFiles?.length || 0) > 0 && (
				<div style={{ marginTop: '12px' }}>
					{existingFiles.map((f) => (
						<div key={f.id} style={{
							display: 'flex',
							alignItems: 'center',
							gap: '10px',
							padding: '8px 12px',
							background: '#eef2ff',
							borderRadius: '6px',
							marginBottom: '8px'
						}}>
							{isImage(f.file_type || f.file_name) ? (
								<a href={f.storage_url} target="_blank" rel="noreferrer" style={{ display: 'inline-block' }}>
									<img src={f.storage_url} alt={f.file_name} style={{ width: 56, height: 56, objectFit: 'cover', borderRadius: 6, border: '1px solid #d1d5db' }} />
								</a>
							) : (
								<svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: '#64748b' }}>
									<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
									<polyline points="14,2 14,8 20,8"></polyline>
									<line x1="16" y1="13" x2="8" y2="13"></line>
									<line x1="16" y1="17" x2="8" y2="17"></line>
									<polyline points="10,9 9,9 8,9"></polyline>
								</svg>
							)}
							<div style={{ display: 'flex', flexDirection: 'column' }}>
								<a href={f.storage_url} target="_blank" rel="noreferrer" style={{ color: '#1d4ed8', textDecoration: 'none', fontSize: '14px' }}>
									{f.file_name}
								</a>
								<span style={{ fontSize: '12px', color: '#6b7280' }}>{formatFileSize(f.file_size)}</span>
							</div>
						</div>
					))}
				</div>
			)}

			{formData.documents && formData.documents.length > 0 && (
				<div style={{ marginTop: '12px' }}>
					{formData.documents.map((file, index) => (
						<div key={index} style={{
							display: 'flex',
							alignItems: 'center',
							gap: '10px',
							padding: '8px 12px',
							background: '#f3f4f6',
							borderRadius: '6px',
							marginBottom: '8px'
						}}>
							{isImage((file as any).type || file.name) ? (
								<img src={URL.createObjectURL(file)} alt={file.name} style={{ width: 56, height: 56, objectFit: 'cover', borderRadius: 6, border: '1px solid #d1d5db' }} />
							) : (
								<svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: '#64748b' }}>
									<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
									<polyline points="14,2 14,8 20,8"></polyline>
									<line x1="16" y1="13" x2="8" y2="13"></line>
									<line x1="16" y1="17" x2="8" y2="17"></line>
									<polyline points="10,9 9,9 8,9"></polyline>
								</svg>
							)}
							<div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
								<span style={{ fontSize: '14px', color: '#374151' }}>{file.name}</span>
								<span style={{ fontSize: '12px', color: '#6b7280' }}>{typeof file.size === 'number' ? formatFileSize(file.size) : ''}</span>
							</div>
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
	);
};


