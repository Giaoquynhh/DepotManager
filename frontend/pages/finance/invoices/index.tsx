import Header from '@components/Header';
import Card from '@components/Card';
import useSWR, { mutate } from 'swr';
import Link from 'next/link';
import { financeApi } from '@services/finance';
import { useState, useEffect } from 'react';
import ContainersNeedInvoiceModal from '@components/ContainersNeedInvoiceModal';
import { api } from '@services/api';

export default function InvoiceList(){
  const [status, setStatus] = useState<string>('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  
  // Lấy thông tin user
  useEffect(() => {
    const loadUserInfo = async () => {
      try {
        const response = await api.get('/auth/me');
        setUserRole(response.data?.role || response.data?.roles?.[0]);
        setUserId(response.data?._id || response.data?.id);
      } catch (error) {
        console.error('Error loading user info:', error);
      }
    };
    
    loadUserInfo();
  }, []);
  
  const key = ['finance_invoices_details', status, userRole, userId].join(':');
  const { data: invoices } = useSWR(key, async ()=> {
    // Nếu là customer, chỉ lấy hóa đơn của họ
    if (userRole === 'CustomerAdmin' || userRole === 'CustomerUser') {
      return financeApi.listInvoicesWithDetails({ 
        status: status || undefined,
        created_by: userId 
      });
    }
    // Nếu là admin, lấy tất cả hóa đơn
    return financeApi.listInvoicesWithDetails({ status: status || undefined });
  });
  
  const getTypeLabel = (type: string) => {
    switch(type) {
      case 'IMPORT': return 'Nhập';
      case 'EXPORT': return 'Xuất';
      case 'CONVERT': return 'Chuyển đổi';
      default: return type || '-';
    }
  };

  const getStatusLabel = (invoice: any) => {
    if (invoice.serviceRequest?.is_paid) {
      return 'Đã thanh toán';
    }
    return 'Chưa thanh toán';
  };

  const getStatusClass = (invoice: any) => {
    if (invoice.serviceRequest?.is_paid) {
      return 'status-paid';
    }
    return 'status-unpaid';
  };

  return (
    <>
      <Header />
      <main className="container">
        <div className="grid" style={{gap:16}}>
          <Card title="Hóa đơn">
            <div style={{display:'flex', gap:8, marginBottom:16, justifyContent:'space-between', alignItems:'center'}}>
              <select 
                value={status} 
                onChange={e=>{ setStatus(e.target.value); mutate(key); }}
                style={{padding:'8px 12px', border:'1px solid #ddd', borderRadius:'4px'}}
              >
                <option value="">Tất cả</option>
                <option value="DRAFT">DRAFT</option>
                <option value="UNPAID">UNPAID</option>
                <option value="PARTIALLY_PAID">PARTIALLY_PAID</option>
                <option value="PAID">PAID</option>
                <option value="CANCELLED">CANCELLED</option>
              </select>
              {/* Chỉ hiển thị nút này cho admin */}
              {(userRole === 'SaleAdmin' || userRole === 'SystemAdmin') && (
                <button 
                  className="btn-containers-need-invoice"
                  onClick={() => setIsModalOpen(true)}
                  style={{
                    backgroundColor: '#28a745',
                    color: 'white',
                    border: 'none',
                    padding: '8px 16px',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '14px'
                  }}
                >
                  Danh sách container cần tạo hóa đơn
                </button>
              )}
            </div>
            
            <div style={{overflowX:'auto'}}>
              <table className="table" style={{minWidth:'1000px'}}>
                <thead>
                  <tr>
                    <th>Loại</th>
                    <th>Container No</th>
                    <th>Khách hàng</th>
                    <th>Mã Công ty</th>
                    <th>Trạng thái</th>
                    <th>Chi phí</th>
                    <th>EIR</th>
                    <th>Hành động</th>
                  </tr>
                </thead>
                <tbody>
                  {(invoices||[]).map((invoice:any)=> {
                    // Nếu là customer, chỉ hiển thị hóa đơn của họ
                    if (userRole === 'CustomerAdmin' || userRole === 'CustomerUser') {
                      if (invoice.serviceRequest?.created_by !== userId) {
                        return null; // Không hiển thị hóa đơn không phải của họ
                      }
                    }
                    
                    return (
                    <tr key={invoice.id}>
                      <td>
                        <span style={{
                          padding: '4px 8px',
                          borderRadius: '4px',
                          fontSize: '12px',
                          fontWeight: '500',
                          backgroundColor: invoice.serviceRequest?.type === 'IMPORT' ? '#e3f2fd' : '#f3e5f5',
                          color: invoice.serviceRequest?.type === 'IMPORT' ? '#1976d2' : '#7b1fa2'
                        }}>
                          {getTypeLabel(invoice.serviceRequest?.type)}
                        </span>
                      </td>
                      <td>{invoice.serviceRequest?.container_no || '-'}</td>
                      <td>{invoice.customer?.name || invoice.customer_id || '-'}</td>
                      <td>{invoice.customer?.tax_code || '-'}</td>
                      <td>
                        <span className={getStatusClass(invoice)} style={{
                          padding: '4px 8px',
                          borderRadius: '4px',
                          fontSize: '12px',
                          fontWeight: '500',
                          backgroundColor: invoice.serviceRequest?.is_paid ? '#e8f5e8' : '#fff3e0',
                          color: invoice.serviceRequest?.is_paid ? '#2e7d32' : '#f57c00'
                        }}>
                          {getStatusLabel(invoice)}
                        </span>
                      </td>
                      <td>{Number(invoice.total_amount||0).toLocaleString('vi-VN')} VND</td>
                      <td>
                        {invoice.serviceRequest?.container_no ? (
                          <button 
                            onClick={() => {
                              const eirUrl = `http://localhost:5002/finance/eir/container/${encodeURIComponent(invoice.serviceRequest.container_no)}`;
                              window.open(eirUrl, '_blank', 'noopener,noreferrer');
                            }}
                            style={{
                              color: '#1976d2',
                              textDecoration: 'none',
                              background: 'none',
                              border: 'none',
                              cursor: 'pointer',
                              padding: 0,
                              font: 'inherit'
                            }}
                          >
                            Xem EIR
                          </button>
                        ) : '-'}
                      </td>
                      <td style={{display:'flex', gap:6}}>
                        <Link className="btn" href={`/finance/invoices/${invoice.id}`} style={{padding:'4px 8px', fontSize:'12px'}}>
                          Xem
                        </Link>
                      </td>
                    </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            
            {(!invoices || invoices.length === 0) && (
              <div style={{textAlign:'center', padding:'40px 20px', color:'#666'}}>
                Không có hóa đơn nào
              </div>
            )}
          </Card>
        </div>
      </main>
      
      <ContainersNeedInvoiceModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
      
      <style jsx>{`
        .status-paid {
          color: #2e7d32;
        }
        .status-unpaid {
          color: #f57c00;
        }
        .table th {
          background-color: #f5f5f5;
          padding: 12px 8px;
          text-align: left;
          font-weight: 600;
          border-bottom: 2px solid #ddd;
        }
        .table td {
          padding: 12px 8px;
          border-bottom: 1px solid #eee;
          vertical-align: middle;
        }
        .table tr:hover {
          background-color: #f9f9f9;
        }
        .btn-containers-need-invoice:hover {
          background-color: #218838 !important;
        }
      `}</style>
    </>
  );
}



