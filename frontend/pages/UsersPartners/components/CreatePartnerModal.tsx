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
  phone: string;
  setPhone: (v: string) => void;
  note: string;
  setNote: (v: string) => void;
  errorText: string;
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
  phone,
  setPhone,
  note,
  setNote,
  errorText
}) => {
  const Label: React.FC<{ text: string; required?: boolean }> = ({ text, required }) => (
    <label style={{ display: 'block', fontSize: 12, color: '#6b7280', marginBottom: 6 }}>
      {text}
      {required && <span style={{ color: '#dc2626' }}> *</span>}
    </label>
  );
  return (
    <Modal title={title || 'Tạo đối tác'} visible={visible} onCancel={onCancel} size="sm">
      <div className="grid" style={{ gap: 12 }}>
        <div>
          <Label text="Mã đối tác" required />
          <input type="text" value={customerCode} onChange={e => setCustomerCode(e.target.value)} placeholder="VD: CUS001" />
        </div>
        <div>
          <Label text="Tên đối tác" required />
          <input type="text" value={customerName} onChange={e => setCustomerName(e.target.value)} placeholder="Tên khách hàng" />
        </div>
        <div>
          <Label text="Địa chỉ" />
          <input type="text" value={address} onChange={e => setAddress(e.target.value)} placeholder="Địa chỉ" />
        </div>
        <div className="grid grid-cols-2" style={{ gap: 12 }}>
          <div>
            <Label text="MST" />
            <input type="text" value={taxCode} onChange={e => setTaxCode(e.target.value)} placeholder="Mã số thuế" />
          </div>
          <div>
            <Label text="SDT" />
            <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="Số điện thoại" />
          </div>
        </div>
        <div>
          <Label text="Ghi chú" />
          <textarea value={note} onChange={e => setNote(e.target.value)} placeholder="Ghi chú thêm" rows={3} />
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
          <button className="btn btn-outline" onClick={onCancel}>Hủy</button>
          <button className="btn" style={{ background: '#7c3aed', color: '#fff' }} onClick={onSubmit}>Tạo</button>
        </div>
      </div>
    </Modal>
  );
};

export default CreatePartnerModal;


