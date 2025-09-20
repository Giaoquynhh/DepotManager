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
  const [showMessage, setShowMessage] = useState(false);
  
  // Form states
  const [customerCode, setCustomerCode] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [address, setAddress] = useState('');
  const [taxCode, setTaxCode] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [note, setNote] = useState('');
  const [errorText, setErrorText] = useState('');
  
  // Validation error states
  const [codeError, setCodeError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [taxCodeError, setTaxCodeError] = useState('');

  // Load customers on component mount
  useEffect(() => {
    loadCustomers();
  }, []);

  // Auto-hide message after 3 seconds
  useEffect(() => {
    if (showMessage) {
      console.log('showMessage is true, setting timer');
      const timer = setTimeout(() => {
        console.log('Timer expired, hiding message');
        setShowMessage(false);
        setMessage('');
      }, 3000);
      
      return () => clearTimeout(timer);
    }
  }, [showMessage]);

  // Debug showMessage state
  useEffect(() => {
    console.log('showMessage state changed:', showMessage);
    console.log('message state:', message);
  }, [showMessage, message]);

  const resetForm = () => {
    setCustomerCode('');
    setCustomerName('');
    setAddress('');
    setTaxCode('');
    setEmail('');
    setPhone('');
    setNote('');
    setErrorText('');
    setCodeError('');
    setEmailError('');
    setPhoneError('');
    setTaxCodeError('');
    setShowMessage(false);
    setMessage('');
    setEditingCustomer(null);
  };

  // Validation functions
  const validateEmail = (email: string) => {
    if (!email.trim()) return true; // Empty is valid
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email.trim());
  };

  const validatePhone = (phone: string) => {
    if (!phone.trim()) return true; // Empty is valid
    const phoneRegex = /^[0-9+\-\s()]+$/;
    return phoneRegex.test(phone.trim()) && phone.trim().length >= 8;
  };

  const validateCode = (code: string) => {
    if (!code.trim()) return false;
    const codeRegex = /^[A-Za-z0-9_]+$/;
    return codeRegex.test(code.trim());
  };

  const validateTaxCode = (taxCode: string) => {
    if (!taxCode.trim()) return true; // Empty is valid
    const taxCodeRegex = /^[0-9]+$/;
    return taxCodeRegex.test(taxCode.trim()) && taxCode.trim().length >= 10;
  };

  // Real-time validation handlers
  const handleCodeChange = (value: string) => {
    setCustomerCode(value);
    if (value.trim() && !validateCode(value)) {
      setCodeError('Mã khách hàng chỉ được chứa chữ cái, số và dấu gạch dưới');
    } else {
      setCodeError('');
    }
  };

  const handleEmailChange = (value: string) => {
    setEmail(value);
    if (value.trim() && !validateEmail(value)) {
      setEmailError('Định dạng email không hợp lệ');
    } else {
      setEmailError('');
    }
  };

  const handlePhoneChange = (value: string) => {
    setPhone(value);
    if (value.trim() && !validatePhone(value)) {
      setPhoneError('Số điện thoại không hợp lệ');
    } else {
      setPhoneError('');
    }
  };

  const handleTaxCodeChange = (value: string) => {
    setTaxCode(value);
    if (value.trim() && !validateTaxCode(value)) {
      setTaxCodeError('Mã số thuế phải là số và có ít nhất 10 chữ số');
    } else {
      setTaxCodeError('');
    }
  };

  const loadCustomers = async () => {
    setLoading(true);
    try {
      console.log('Loading customers...');
      const response = await setupService.getCustomers({ page: 1, limit: 100 });
      console.log('Load customers response:', JSON.stringify(response, null, 2));
      if (response && response.data) {
        setCustomers(response.data.data || response.data || []);
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

    // Validate customer code format
    if (!validateCode(customerCode)) {
      setErrorText('Mã khách hàng chỉ được chứa chữ cái, số và dấu gạch dưới');
      return;
    }

    // Validate email format if provided
    if (!validateEmail(email)) {
      setErrorText('Định dạng email không hợp lệ. Vui lòng nhập email đúng định dạng (ví dụ: example@domain.com)');
      return;
    }

    // Validate phone format if provided
    if (!validatePhone(phone)) {
      setErrorText('Số điện thoại không hợp lệ. Vui lòng nhập số điện thoại đúng định dạng');
      return;
    }

    // Validate tax code format if provided
    if (!validateTaxCode(taxCode)) {
      setErrorText('Mã số thuế phải là số và có ít nhất 10 chữ số');
      return;
    }

    setErrorText('');
    setLoading(true);

    try {
      if (editingCustomer) {
        // Update existing customer (tax_code is immutable, so we only update name, address, email, phone)
        const updateData: any = {
          name: customerName.trim()
        };
        
        if (address.trim()) updateData.address = address.trim();
        if (email.trim()) updateData.email = email.trim();
        if (phone.trim()) updateData.phone = phone.trim();
        
        console.log('Updating customer with data:', updateData);
        const response = await setupService.updateCustomer(editingCustomer.id, updateData);

        if (response && response.success && response.data) {
          // Refresh the entire list to ensure data consistency
          await loadCustomers();
          console.log('Setting success message for update');
          setMessage('Cập nhật khách hàng thành công');
          setShowMessage(true);
          
          // Delay closing modal to show notification
          setTimeout(() => {
            setShowPartnerModal(false);
            setEditingCustomer(null);
          }, 1000);
        } else {
          // Kiểm tra lỗi cụ thể
          if (response.message && response.message.includes('Mã khách hàng đã tồn tại')) {
            setErrorText(`Khách hàng có mã "${customerCode.trim()}" đã tồn tại. Vui lòng nhập mã khác`);
          } else if (response.message && response.message.includes('Mã số thuế đã tồn tại')) {
            setErrorText(`Mã số thuế "${taxCode.trim()}" đã tồn tại. Vui lòng nhập mã số thuế khác`);
          } else if (response.message && response.message.includes('Email format is invalid')) {
            setErrorText('Định dạng email không hợp lệ. Vui lòng nhập email đúng định dạng (ví dụ: example@domain.com)');
          } else if (response.message && response.message.includes('Please enter a valid email address')) {
            setErrorText('Định dạng email không hợp lệ. Vui lòng nhập email đúng định dạng (ví dụ: example@domain.com)');
          } else {
            setErrorText(response.message || 'Lỗi khi cập nhật khách hàng');
          }
          return;
        }
      } else {
        // Create new customer
        console.log('Creating customer with data:', {
          code: customerCode.trim(),
          name: customerName.trim(),
          tax_code: taxCode.trim() ? taxCode.trim() : undefined,
          address: address.trim() ? address.trim() : undefined,
          email: email.trim() ? email.trim() : undefined,
          phone: phone.trim() ? phone.trim() : undefined
        });
        
        // Prepare data object, only include non-empty fields
        const customerData: any = {
          code: customerCode.trim(),
          name: customerName.trim()
        };
        
        if (taxCode.trim()) customerData.tax_code = taxCode.trim();
        if (address.trim()) customerData.address = address.trim();
        if (email.trim()) {
          customerData.email = email.trim();
          console.log('Email being sent:', customerData.email);
        }
        if (phone.trim()) customerData.phone = phone.trim();
        
        console.log('Sending customer data:', customerData);
        
        const response = await setupService.createCustomer(customerData);
        
        console.log('API response:', JSON.stringify(response, null, 2));
        console.log('Response success:', response?.success);
        console.log('Response data:', response?.data);
        console.log('Response message:', response?.message);

        if (response && response.success && response.data) {
          // Refresh the entire list to ensure data consistency
          await loadCustomers();
          console.log('Setting success message for create');
          setMessage('Tạo khách hàng thành công');
          setShowMessage(true);
          
          // Delay closing modal to show notification
          setTimeout(() => {
            setShowPartnerModal(false);
            setEditingCustomer(null);
          }, 1000);
        } else {
          // Kiểm tra lỗi cụ thể
          if (response && response.message && response.message.includes('Mã khách hàng đã tồn tại')) {
            setErrorText(`Khách hàng có mã "${customerCode.trim()}" đã tồn tại. Vui lòng nhập mã khác`);
          } else if (response && response.message && response.message.includes('Mã số thuế đã tồn tại')) {
            setErrorText(`Mã số thuế "${taxCode.trim()}" đã tồn tại. Vui lòng nhập mã số thuế khác`);
          } else if (response && response.message && response.message.includes('Email format is invalid')) {
            setErrorText('Định dạng email không hợp lệ. Vui lòng nhập email đúng định dạng (ví dụ: example@domain.com)');
          } else if (response && response.message && response.message.includes('Please enter a valid email address')) {
            setErrorText('Định dạng email không hợp lệ. Vui lòng nhập email đúng định dạng (ví dụ: example@domain.com)');
          } else {
            setErrorText(response?.message || 'Lỗi khi tạo khách hàng');
          }
          return;
        }
      }

      // Reset form (only if not successful)
      // Note: Successful cases are handled in the if blocks above
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
                      setEmail('');
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
              {showMessage && message && (
                <div style={{
                  position: 'fixed',
                  top: '20px',
                  right: '20px',
                  zIndex: 9999,
                  padding: '12px 16px',
                  background: '#ecfdf5',
                  color: '#065f46',
                  borderRadius: '8px',
                  border: '1px solid #a7f3d0',
                  fontSize: '14px',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                  opacity: 1,
                  transform: 'translateY(0)',
                  transition: 'opacity 0.3s ease-in-out, transform 0.3s ease-in-out'
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
                        <th>Mã khách hàng</th>
                        <th>Tên khách hàng</th>
                        <th>Địa chỉ</th>
                        <th>Mã số thuế</th>
                        <th>Email</th>
                        <th>Số điện thoại</th>
                        <th>Hành động</th>
                      </tr>
                    </thead>
                    <tbody>
                      {customers.length === 0 ? (
                        <tr>
                          <td colSpan={7} style={{textAlign: 'center', padding: '40px', color: '#666'}}>
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
                            <td>{customer.email || '-'}</td>
                            <td>{customer.phone || '-'}</td>
                            <td>
                              <div style={{display:'flex', gap:8}}>
                                <button 
                                  className="btn btn-xs" 
                                  onClick={() => {
                                    // open edit modal with existing values
                                    resetForm();
                                    setCustomerCode(customer.code);
                                    setCustomerName(customer.name);
                                    setAddress(customer.address || '');
                                    setTaxCode(customer.tax_code || '');
                                    setEmail(customer.email || '');
                                    setPhone(customer.phone || '');
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
                  resetForm();
                }}
                onSubmit={validateAndCreate}
                title={editingCustomer ? 'Cập nhật khách hàng' : 'Tạo khách hàng'}
                customerCode={customerCode}
                setCustomerCode={handleCodeChange}
                customerName={customerName}
                setCustomerName={setCustomerName}
                address={address}
                setAddress={setAddress}
                taxCode={taxCode}
                setTaxCode={handleTaxCodeChange}
                email={email}
                setEmail={handleEmailChange}
                phone={phone}
                setPhone={handlePhoneChange}
                note={note}
                setNote={setNote}
                errorText={errorText}
                codeError={codeError}
                emailError={emailError}
                phoneError={phoneError}
                taxCodeError={taxCodeError}
              />
            </Card>
          </div>
        </div>
      </main>
    </>
  );
}
