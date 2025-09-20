import Header from '@components/Header';
import Card from '@components/Card';
import useSWR, { mutate } from 'swr';
import Link from 'next/link';
import { financeApi } from '@services/finance';
import { useState, useEffect } from 'react';
import ContainersNeedInvoiceModal from '@components/ContainersNeedInvoiceModal';
import { api } from '@services/api';
import { useTranslation } from '@hooks/useTranslation';

export default function InvoiceList(){
  const { t } = useTranslation();
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
      case 'IMPORT': return t('pages.finance.invoices.types.import');
      case 'EXPORT': return t('pages.finance.invoices.types.export');
      case 'CONVERT': return t('pages.finance.invoices.types.convert');
      default: return type || '-';
    }
  };

  const getStatusLabel = (invoice: any) => {
    if (invoice.serviceRequest?.is_paid) {
      return t('pages.finance.invoices.status.paid');
    }
    return t('pages.finance.invoices.status.unpaid');
  };

  const getStatusClass = (invoice: any) => {
    if (invoice.serviceRequest?.is_paid) {
      return 'status-paid';
    }
    return 'status-unpaid';
  };

  return (
    <>
      <style>{`
        /* Mobile scroll fix for Finance Invoices page */
        @media (max-width: 768px) {
          body {
            overflow-y: auto !important;
            overflow-x: hidden !important;
            -webkit-overflow-scrolling: touch;
          }
          
          .container.depot-requests.invoice-page {
            overflow: visible !important;
            padding-bottom: 2rem;
          }
        }
      `}</style>
      <Header />
      <main className="container depot-requests invoice-page">
        <div className="page-header modern-header">
          <div className="header-content">
            <div className="header-left">
              <h1 className="page-title gradient gradient-ultimate">{t('pages.finance.invoices.title')}</h1>
            </div>
            <div className="header-actions">
            </div>
          </div>
        </div>

        <div className="search-filter-section modern-search" style={{display: 'flex !important', justifyContent: 'space-between !important', alignItems: 'center !important'}}>
          <div className="filter-group">
            <label className="filter-label">{t('pages.finance.invoices.filterByStatus')}</label>
            <select 
              value={status} 
              onChange={e=>{ setStatus(e.target.value); mutate(key); }}
              className="filter-select"
            >
              <option value="">{t('pages.finance.invoices.allStatuses')}</option>
              <option value="DRAFT">{t('pages.finance.invoices.statusOptions.draft')}</option>
              <option value="UNPAID">{t('pages.finance.invoices.statusOptions.unpaid')}</option>
              <option value="PARTIALLY_PAID">{t('pages.finance.invoices.statusOptions.partiallyPaid')}</option>
              <option value="PAID">{t('pages.finance.invoices.statusOptions.paid')}</option>
              <option value="CANCELLED">{t('pages.finance.invoices.statusOptions.cancelled')}</option>
            </select>
          </div>
          {/* Chỉ hiển thị nút này cho admin - đặt sát bên phải */}
          {(userRole === 'SaleAdmin' || userRole === 'SystemAdmin') && (
            <button 
              className="btn btn-outline containers-need-invoice-btn"
              onClick={() => setIsModalOpen(true)}
              title={t('pages.finance.invoices.containersNeedInvoice')}
            >
              📋 {t('pages.finance.invoices.containersNeedInvoice')}
            </button>
          )}
        </div>

        <Card>
            
            <div style={{overflowX:'auto'}}>
              <table className="table" style={{minWidth:'1000px'}}>
                <thead>
                  <tr>
                    <th>{t('pages.finance.invoices.tableHeaders.invoiceNumber')}</th>
                    <th>{t('pages.finance.invoices.tableHeaders.requestNumber')}</th>
                    <th>{t('pages.finance.invoices.tableHeaders.requestType')}</th>
                    <th>{t('pages.finance.invoices.tableHeaders.customer')}</th>
                    <th>{t('pages.finance.invoices.tableHeaders.taxCode')}</th>
                    <th>{t('pages.finance.invoices.tableHeaders.phoneNumber')}</th>
                    <th>{t('pages.finance.invoices.tableHeaders.totalAmount')}</th>
                    <th>{t('pages.finance.invoices.tableHeaders.actions')}</th>
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
                      <td>{invoice.invoice_number || invoice.id || '-'}</td>
                      <td>{invoice.serviceRequest?.request_id || '-'}</td>
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
                      <td>{invoice.customer?.name || invoice.customer_id || '-'}</td>
                      <td>{invoice.customer?.tax_code || '-'}</td>
                      <td>{invoice.customer?.phone || '-'}</td>
                      <td>{Number(invoice.total_amount||0).toLocaleString('vi-VN')} VND</td>
                      <td style={{display:'flex', gap:6}}>
                        <Link className="btn" href={`/finance/invoices/${invoice.id}`} style={{padding:'4px 8px', fontSize:'12px'}}>
                          {t('pages.finance.invoices.actions.view')}
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
                {t('pages.finance.invoices.messages.noInvoices')}
              </div>
            )}
          </Card>
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



