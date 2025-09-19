import React, { useState, useEffect } from 'react';
import { useTranslation } from '../../hooks/useTranslation';
import Header from '../../components/Header';
import Card from '../../components/Card';
import CreatePartnerModal from '../UsersPartners/components/CreatePartnerModal';
import { setupService, Customer } from '../../services/setupService';

// Import translations
import { translations } from '../UsersPartners/translations';

export default function Customers() {
  const { t, currentLanguage } = useTranslation();
  const language = currentLanguage as 'vi' | 'en';

  // State for customers
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(false);
  const [showPartnerModal, setShowPartnerModal] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [message, setMessage] = useState('');
  
  // Form states
  const [customerCode, setCustomerCode] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [address, setAddress] = useState('');
  const [taxCode, setTaxCode] = useState('');
  const [phone, setPhone] = useState('');
  const [note, setNote] = useState('');
  const [errorText, setErrorText] = useState('');

  // Load customers on component mount
  useEffect(() => {
    loadCustomers();
  }, []);

  const loadCustomers = async () => {
    setLoading(true);
    try {
      console.log('Loading customers...');
      const response = await setupService.getCustomers({ page: 1, limit: 100 });
      console.log('Load customers response:', JSON.stringify(response, null, 2));
      if (response && response.data) {
        setCustomers(response.data || []);
        setMessage(''); // Clear any previous error
      } else {
        setMessage(response.message || 'Lỗi khi tải danh sách khách hàng');
      }
    } catch (error) {
      console.error('Error loading customers:', error);
      setMessage('Lỗi khi tải danh sách khách hàng');
    } finally {
      setLoading(false);
    }
  };

  // Validation and create/update function
  const validateAndCreate = async () => {
    if (!customerCode.trim()) {
      setErrorText('Mã khách hàng không được để trống');
      return;
    }
    if (!customerName.trim()) {
      setErrorText('Tên khách hàng không được để trống');
      return;
    }

    setErrorText('');
    setLoading(true);

    try {
      if (editingCustomer) {
        // Update existing customer (tax_code is immutable, so we only update name, address, contact_email)
        const response = await setupService.updateCustomer(editingCustomer.id, {
          name: customerName.trim(),
          address: address.trim() || undefined,
          contact_email: phone.trim() || undefined
        });

        if (response && response.id) {
          setCustomers(prev => prev.map(c => c.id === editingCustomer.id ? response : c));
          setMessage('Cập nhật khách hàng thành công');
        } else {
          // Kiểm tra lỗi cụ thể
          if (response.message && response.message.includes('Mã khách hàng đã tồn tại')) {
            setErrorText(`Khách hàng có mã "${customerCode.trim()}" đã tồn tại. Vui lòng nhập mã khác`);
          } else if (response.message && response.message.includes('Mã số thuế đã tồn tại')) {
            setErrorText(`Mã số thuế "${taxCode.trim()}" đã tồn tại. Vui lòng nhập mã số thuế khác`);
          } else {
            setErrorText(response.message || 'Lỗi khi cập nhật khách hàng');
          }
          return;
        }
      } else {
        // Create new customer
        try {
          console.log('Creating customer with data:', {
            code: customerCode.trim(),
            name: customerName.trim(),
            tax_code: taxCode.trim() || undefined,
            address: address.trim() || undefined,
            contact_email: phone.trim() || undefined
          });
          
          const response = await setupService.createCustomer({
            code: customerCode.trim(),
            name: customerName.trim(),
            tax_code: taxCode.trim() || undefined,
            address: address.trim() || undefined,
            contact_email: phone.trim() || undefined
          });
          
          console.log('API response:', JSON.stringify(response, null, 2));

          if (response && response.id) {
            setCustomers(prev => [...prev, response]);
            setMessage('Tạo khách hàng thành công');
          } else {
            // Kiểm tra lỗi cụ thể
            if (response && response.message && response.message.includes('Mã khách hàng đã tồn tại')) {
              setErrorText(`Khách hàng có mã "${customerCode.trim()}" đã tồn tại. Vui lòng nhập mã khác`);
            } else if (response && response.message && response.message.includes('Mã số thuế đã tồn tại')) {
              setErrorText(`Mã số thuế "${taxCode.trim()}" đã tồn tại. Vui lòng nhập mã số thuế khác`);
            } else {
              setErrorText(response?.message || 'Lỗi khi tạo khách hàng');
            }
            return;
          }
        } catch (error) {
          console.error('Unexpected error:', error);
          setErrorText('Lỗi khi tạo khách hàng');
          return;
        }
      }

      // Reset form
      setCustomerCode('');
      setCustomerName('');
      setAddress('');
      setTaxCode('');
      setPhone('');
      setNote('');
      setErrorText('');
      setShowPartnerModal(false);
      setEditingCustomer(null);
    } catch (error) {
      console.error('Error saving customer:', error);
      setErrorText('Lỗi khi lưu khách hàng');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Header />
      <main className="container">
        <div className="grid grid-cols-3" style={{gap: 20}}>
          <div style={{gridColumn: 'span 3'}}>
            <Card title={undefined as any}>
              {/* Header with buttons */}
              <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12}}>
                <h3 style={{margin:0, fontSize:18, fontWeight:700, color:'#0b2b6d'}}>
                  Danh sách khách hàng
                </h3>
                <div style={{display:'flex', gap:8}}>
                  <button
                    className="btn"
                    onClick={() => {
                      // open create modal
                      setEditingCustomer(null);
                      setCustomerCode('');
                      setCustomerName('');
                      setAddress('');
                      setTaxCode('');
                      setPhone('');
                      setNote('');
                      setErrorText('');
                      setShowPartnerModal(true);
                    }}
                    style={{background:'#7c3aed', color:'#fff'}}
                    disabled={loading}
                  >
                    {loading ? 'Đang tải...' : 'Tạo khách hàng'}
                  </button>
                </div>
              </div>

              {/* Success Message */}
              {message && (
                <div style={{
                  marginBottom: 16,
                  padding: '12px 16px',
                  background: '#ecfdf5',
                  color: '#065f46',
                  borderRadius: '8px',
                  border: '1px solid #a7f3d0',
                  fontSize: '14px'
                }}>
                  {message}
                </div>
              )}

              {/* Table */}
              <div className="table-container">
                {loading ? (
                  <div style={{textAlign: 'center', padding: '40px', color: '#666'}}>
                    Đang tải dữ liệu...
                  </div>
                ) : (
                  <table className="table">
                    <thead style={{background: '#f8fafc'}}>
                      <tr>
                        <th>{translations[language].partnerCode}</th>
                        <th>{translations[language].partnerName}</th>
                        <th>{translations[language].address}</th>
                        <th>{translations[language].taxCode}</th>
                        <th>{translations[language].phone}</th>
                        <th>{translations[language].actions}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {customers.length === 0 ? (
                        <tr>
                          <td colSpan={6} style={{textAlign: 'center', padding: '40px', color: '#666'}}>
                            Chưa có khách hàng nào
                          </td>
                        </tr>
                      ) : (
                        customers.map((customer) => (
                          <tr key={customer.code}>
                            <td style={{fontFamily:'monospace'}}>{customer.code}</td>
                            <td style={{fontWeight:600}}>{customer.name}</td>
                            <td>{customer.address || '-'}</td>
                            <td>{customer.tax_code || '-'}</td>
                            <td>{customer.contact_email || '-'}</td>
                            <td>
                              <div style={{display:'flex', gap:8}}>
                                <button 
                                  className="btn btn-xs" 
                                  onClick={() => {
                                    // open edit modal with existing values
                                    setCustomerCode(customer.code);
                                    setCustomerName(customer.name);
                                    setAddress(customer.address || '');
                                    setTaxCode(customer.tax_code || '');
                                    setPhone(customer.contact_email || '');
                                    setNote('');
                                    setErrorText('');
                                    setEditingCustomer(customer);
                                    setShowPartnerModal(true);
                                  }}
                                  disabled={loading}
                                >
                                  Cập nhật
                                </button>
                                <button 
                                  className="btn btn-xs btn-outline" 
                                  onClick={async () => {
                                    if (confirm('Bạn có chắc chắn muốn xóa khách hàng này?')) {
                                      setLoading(true);
                                      try {
                                        console.log('Deleting customer with ID:', customer.id);
                                        const response = await setupService.deleteCustomer(customer.id);
                                        console.log('Delete response:', JSON.stringify(response, null, 2));
                                        if (response && response.success) {
                                          setCustomers(prev => prev.filter(c => c.id !== customer.id));
                                          setMessage('Xóa khách hàng thành công');
                                        } else {
                                          setMessage(response.message || 'Lỗi khi xóa khách hàng');
                                        }
                                      } catch (error) {
                                        setMessage('Lỗi khi xóa khách hàng');
                                      } finally {
                                        setLoading(false);
                                      }
                                    }
                                  }}
                                  disabled={loading}
                                >
                                  Xóa
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                )}
              </div>

              {/* Modal */}
              <CreatePartnerModal
                visible={showPartnerModal}
                onCancel={() => { 
                  setShowPartnerModal(false); 
                  setEditingCustomer(null);
                  setErrorText('');
                }}
                onSubmit={validateAndCreate}
                title={editingCustomer ? 'Cập nhật khách hàng' : 'Tạo khách hàng'}
                customerCode={customerCode}
                setCustomerCode={setCustomerCode}
                customerName={customerName}
                setCustomerName={setCustomerName}
                address={address}
                setAddress={setAddress}
                taxCode={taxCode}
                setTaxCode={setTaxCode}
                phone={phone}
                setPhone={setPhone}
                note={note}
                setNote={setNote}
                errorText={errorText}
              />
            </Card>
          </div>
        </div>
      </main>
    </>
  );
}
