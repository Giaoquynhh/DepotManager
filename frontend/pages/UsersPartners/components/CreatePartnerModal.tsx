// Simple Create Partner Modal (UI only)
import React from 'react';
import Modal from '@components/Modal';

interface CreatePartnerModalProps {
  visible: boolean;
  onCancel: () => void;
  onSubmit: () => void;
  title?: string;
  // form fields
  customerCode: string;
  setCustomerCode: (v: string) => void;
  customerName: string;
  setCustomerName: (v: string) => void;
  address: string;
  setAddress: (v: string) => void;
  taxCode: string;
  setTaxCode: (v: string) => void;
  email: string;
  setEmail: (v: string) => void;
  phone: string;
  setPhone: (v: string) => void;
  note: string;
  setNote: (v: string) => void;
  errorText: string;
  // validation errors
  codeError?: string;
  emailError?: string;
  phoneError?: string;
  taxCodeError?: string;
}

export const CreatePartnerModal: React.FC<CreatePartnerModalProps> = ({
  visible,
  onCancel,
  onSubmit,
  title,
  customerCode,
  setCustomerCode,
  customerName,
  setCustomerName,
  address,
  setAddress,
  taxCode,
  setTaxCode,
  email,
  setEmail,
  phone,
  setPhone,
  note,
  setNote,
  errorText,
  codeError,
  emailError,
  phoneError,
  taxCodeError
}) => {
  return (
    <Modal title={title || 'Tạo đối tác'} visible={visible} onCancel={onCancel} size="sm">
      <div className="grid" style={{ gap: 12 }}>
        <div>
          <input 
            type="text" 
            value={customerCode} 
            onChange={e => setCustomerCode(e.target.value)} 
            placeholder="Mã khách hàng *" 
            style={{ borderColor: codeError ? '#ef4444' : undefined }}
          />
          {codeError && <div style={{ color: '#ef4444', fontSize: '12px', marginTop: '4px' }}>{codeError}</div>}
        </div>
        <div>
          <input type="text" value={customerName} onChange={e => setCustomerName(e.target.value)} placeholder="Tên khách hàng *" />
        </div>
        <div>
          <input type="text" value={address} onChange={e => setAddress(e.target.value)} placeholder="Địa chỉ (tùy chọn)" />
        </div>
        <div className="grid grid-cols-2" style={{ gap: 12 }}>
          <div>
            <input 
              type="text" 
              value={taxCode} 
              onChange={e => setTaxCode(e.target.value)} 
              placeholder="MST (tùy chọn)" 
              style={{ borderColor: taxCodeError ? '#ef4444' : undefined }}
            />
            {taxCodeError && <div style={{ color: '#ef4444', fontSize: '12px', marginTop: '4px' }}>{taxCodeError}</div>}
          </div>
          <div>
            <input 
              type="email" 
              value={email} 
              onChange={e => setEmail(e.target.value)} 
              placeholder="Email (tùy chọn)" 
              style={{ borderColor: emailError ? '#ef4444' : undefined }}
            />
            {emailError && <div style={{ color: '#ef4444', fontSize: '12px', marginTop: '4px' }}>{emailError}</div>}
          </div>
        </div>
        <div>
          <input 
            type="tel" 
            value={phone} 
            onChange={e => setPhone(e.target.value)} 
            placeholder="Số điện thoại (tùy chọn)" 
            style={{ borderColor: phoneError ? '#ef4444' : undefined }}
          />
          {phoneError && <div style={{ color: '#ef4444', fontSize: '12px', marginTop: '4px' }}>{phoneError}</div>}
        </div>
        <div>
          <textarea value={note} onChange={e => setNote(e.target.value)} placeholder="Ghi chú (tùy chọn)" rows={3} />
        </div>

        {errorText && (
          <div style={{
            background: '#fef2f2',
            border: '1px solid #fecaca',
            color: '#991b1b',
            borderRadius: 6,
            padding: '8px 12px',
            fontSize: 13
          }}>{errorText}</div>
        )}

        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button className="btn" style={{ background: '#7c3aed', color: '#fff' }} onClick={onSubmit}>
            {title?.includes('Cập nhật') ? 'Cập nhật' : 'Tạo'}
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default CreatePartnerModal;


