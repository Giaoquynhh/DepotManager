import React from 'react';
import { maintenanceApi } from '@services/maintenance';
import { useTranslation } from '@hooks/useTranslation';

interface RepairTableProps {
  repairs: any[];
  onPassStandard: (id: string) => void;
  onFailStandard: (id: string) => void;
  onRepairable: (id: string) => void;
  onUnrepairable: (id: string) => void;
  onEditInvoice: (id: string) => void;
  onRequestConfirmation: (id: string) => void;
  onStartRepair: (id: string) => void;
  onCompleteRepair: (id: string) => void;
}

export default function RepairTable({ repairs, onPassStandard, onFailStandard, onRepairable, onUnrepairable, onEditInvoice, onRequestConfirmation, onStartRepair, onCompleteRepair }: RepairTableProps) {
  const { t } = useTranslation();
  const fmt = (n: any) => {
    const num = Number(n || 0);
    return num.toLocaleString('vi-VN');
  };

  const handleViewPDF = async (repairId: string) => {
    try {
      // Gọi API với authentication để lấy PDF
      const response = await maintenanceApi.downloadRepairInvoicePDF(repairId);
      
      // Tạo blob từ response data
      const blob = new Blob([response], { type: 'application/pdf' });
      
      // Tạo URL cho blob
      const url = window.URL.createObjectURL(blob);
      
      // Mở PDF trong tab mới
      window.open(url, '_blank');
      
      // Cleanup URL sau khi sử dụng
      setTimeout(() => window.URL.revokeObjectURL(url), 1000);
    } catch (error: any) {
      console.error('Lỗi khi tải PDF:', error);
      alert('Lỗi khi tải PDF: ' + (error.message || 'Không thể tải file'));
    }
  };

  return (
    <div style={{ overflow: 'auto' }}>
      <table className="table" style={{ width: '100%', minWidth: '1200px' }}>
        <thead>
          <tr>
            <th style={{ padding: '12px 8px', textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>{t('pages.maintenance.repairs.tableHeaders.code')}</th>
            <th style={{ padding: '12px 8px', textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>{t('pages.maintenance.repairs.tableHeaders.containerNo')}</th>
            <th style={{ padding: '12px 8px', textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>{t('pages.maintenance.repairs.tableHeaders.containerType')}</th>
            <th style={{ padding: '12px 8px', textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>{t('pages.maintenance.repairs.tableHeaders.vehicleNumber')}</th>
            <th style={{ padding: '12px 8px', textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>{t('pages.maintenance.repairs.tableHeaders.driver')}</th>
            <th style={{ padding: '12px 8px', textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>{t('pages.maintenance.repairs.tableHeaders.driverPhone')}</th>
            <th style={{ padding: '12px 8px', textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>{t('pages.maintenance.repairs.tableHeaders.status')}</th>
            <th style={{ padding: '12px 8px', textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>{t('pages.maintenance.repairs.tableHeaders.startTime')}</th>
            <th style={{ padding: '12px 8px', textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>{t('pages.maintenance.repairs.tableHeaders.endTime')}</th>
            <th style={{ padding: '12px 8px', textAlign: 'center', borderBottom: '1px solid #e5e7eb' }}>{t('pages.maintenance.repairs.tableHeaders.image')}</th>
            <th style={{ padding: '12px 8px', textAlign: 'center', borderBottom: '1px solid #e5e7eb' }}>{t('pages.maintenance.repairs.tableHeaders.actions')}</th>
          </tr>
        </thead>
        <tbody>
          {(repairs || []).map((r: any) => (
            <tr key={r.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
              <td style={{ padding: '12px 8px' }}>{r.code}</td>
              <td style={{ padding: '12px 8px' }}>{r.container_no || r.equipment?.code || '-'}</td>
              <td style={{ padding: '12px 8px' }}>{r.equipment?.type || r.container_type || '-'}</td>
              <td style={{ padding: '12px 8px' }}>{r.vehicle_number || r.equipment?.vehicle_number || '-'}</td>
              <td style={{ padding: '12px 8px' }}>{r.driver_name || r.equipment?.driver_name || '-'}</td>
              <td style={{ padding: '12px 8px' }}>{r.driver_phone || r.equipment?.driver_phone || '-'}</td>
              <td style={{ padding: '12px 8px' }}>
                <span style={{
                  padding: '4px 8px',
                  borderRadius: '12px',
                  fontSize: '12px',
                  fontWeight: '500',
                                     background: r.status === 'CHECKING' ? '#fbbf24' :
                              r.status === 'PENDING_ACCEPT' ? '#f59e0b' :
                              r.status === 'ACCEPT' ? '#10b981' :
                              r.status === 'REPAIRING' ? '#3b82f6' :
                              r.status === 'CHECKED' ? '#10b981' :
                              r.status === 'REJECTED' ? '#ef4444' : '#fee2e2',
                  color: r.status === 'CHECKING' ? '#78350f' :
                         r.status === 'PENDING_ACCEPT' ? '#92400e' :
                         r.status === 'ACCEPT' ? '#065f46' :
                         r.status === 'REPAIRING' ? '#1e40af' :
                         r.status === 'CHECKED' ? '#065f46' : 
                         r.status === 'REJECTED' ? '#991b1b' : '#991b1b'
                }}>
                                     {r.status === 'CHECKING' ? t('pages.maintenance.repairs.status.checking') :
                    r.status === 'PENDING_ACCEPT' ? t('pages.maintenance.repairs.status.pendingAccept') :
                    r.status === 'ACCEPT' ? t('pages.maintenance.repairs.status.accept') :
                    r.status === 'REPAIRING' ? t('pages.maintenance.repairs.status.repairing') :
                    r.status === 'CHECKED' ? t('pages.maintenance.repairs.status.checked') :
                    r.status === 'REJECTED' ? t('pages.maintenance.repairs.status.rejected') : t('pages.maintenance.repairs.status.unknown')}
                </span>
              </td>
              <td style={{ padding: '12px 8px' }}>
                {r.createdAt ? new Date(r.createdAt).toLocaleString('vi-VN') : '-'}
              </td>
              <td style={{ padding: '12px 8px' }}>
                {r.updatedAt ? new Date(r.updatedAt).toLocaleString('vi-VN') : '-'}
              </td>
              <td style={{ padding: '12px 8px', textAlign: 'center' }}>
                {r.image_url ? (
                  <img 
                    src={r.image_url} 
                    alt="Container image" 
                    style={{ 
                      width: '40px', 
                      height: '40px', 
                      objectFit: 'cover', 
                      borderRadius: '4px',
                      cursor: 'pointer'
                    }}
                    onClick={() => window.open(r.image_url, '_blank')}
                    title="Xem hình ảnh"
                  />
                ) : (
                  <span style={{ color: '#6b7280', fontSize: '12px' }}>-</span>
                )}
              </td>
                             <td style={{ padding: '12px 8px', textAlign: 'center' }}>

                 {r.status === 'PENDING_ACCEPT' && (
                   <div style={{ display: 'flex', gap: 6, justifyContent: 'center', flexWrap: 'wrap' }}>
                     <button 
                       onClick={() => onEditInvoice(r.id)}
                       style={{
                         padding: '4px 8px',
                         border: 'none',
                         borderRadius: '4px',
                         background: '#3b82f6',
                         color: 'white',
                         cursor: 'pointer',
                         fontSize: '12px'
                       }}
                       title={t('pages.maintenance.repairs.actions.editInvoiceTitle')}
                     >
                       ✏️ {t('pages.maintenance.repairs.actions.editInvoice')}
                     </button>
                     <button 
                       onClick={() => onRequestConfirmation(r.id)}
                       style={{
                         padding: '4px 8px',
                         border: 'none',
                         borderRadius: '4px',
                         background: '#f59e0b',
                         color: 'white',
                         cursor: 'pointer',
                         fontSize: '12px'
                       }}
                       title={t('pages.maintenance.repairs.actions.requestConfirmationTitle')}
                     >
                       📧 {t('pages.maintenance.repairs.actions.requestConfirmation')}
                     </button>
                   </div>
                 )}

                 {r.status === 'ACCEPT' && (
                   <div style={{ display: 'flex', gap: 6, justifyContent: 'center', flexWrap: 'wrap' }}>
                     <button 
                       onClick={() => onStartRepair(r.id)}
                       style={{
                         padding: '4px 8px',
                         border: 'none',
                         borderRadius: '4px',
                         background: '#10b981',
                         color: 'white',
                         cursor: 'pointer',
                         fontSize: '12px'
                       }}
                       title={t('pages.maintenance.repairs.actions.startRepairTitle')}
                     >
                       🔧 {t('pages.maintenance.repairs.actions.startRepair')}
                     </button>
                   </div>
                 )}

                 {r.status === 'REPAIRING' && (
                   <div style={{ display: 'flex', gap: 6, justifyContent: 'center', flexWrap: 'wrap' }}>
                     <button 
                       onClick={() => onCompleteRepair(r.id)}
                       style={{
                         padding: '4px 8px',
                         border: 'none',
                         borderRadius: '4px',
                         background: '#059669',
                         color: 'white',
                         cursor: 'pointer',
                         fontSize: '12px'
                       }}
                       title={t('pages.maintenance.repairs.actions.completeRepairTitle')}
                     >
                       ✅ {t('pages.maintenance.repairs.actions.completeRepair')}
                     </button>
                   </div>
                 )}
                {r.status === 'CHECKING' && !r.manager_comment?.includes('không đạt chuẩn') && (
                  <div style={{ display: 'flex', gap: 6, justifyContent: 'center' }}>
                    <button 
                      onClick={() => onPassStandard(r.id)}
                      style={{
                        padding: '4px 8px',
                        border: 'none',
                        borderRadius: '4px',
                        background: '#10b981',
                        color: 'white',
                        cursor: 'pointer',
                        fontSize: '12px'
                      }}
                    >
                      {t('pages.maintenance.repairs.actions.passStandard')}
                    </button>
                    <button 
                      onClick={() => onFailStandard(r.id)}
                      style={{
                        padding: '4px 8px',
                        border: 'none',
                        borderRadius: '4px',
                        background: '#f59e0b',
                        color: 'white',
                        cursor: 'pointer',
                        fontSize: '12px'
                      }}
                    >
                      {t('pages.maintenance.repairs.actions.failStandard')}
                    </button>
                  </div>
                )}
                {r.status === 'CHECKING' && r.manager_comment?.includes('không đạt chuẩn') && (
                  <div style={{ display: 'flex', gap: 6, justifyContent: 'center' }}>
                    <button 
                      onClick={() => onRepairable(r.id)}
                      style={{
                        padding: '4px 8px',
                        border: 'none',
                        borderRadius: '4px',
                        background: '#3b82f6',
                        color: 'white',
                        cursor: 'pointer',
                        fontSize: '12px'
                      }}
                    >
                      {t('pages.maintenance.repairs.actions.repairable')}
                    </button>
                    <button 
                      onClick={() => onUnrepairable(r.id)}
                      style={{
                        padding: '4px 8px',
                        border: 'none',
                        borderRadius: '4px',
                        background: '#ef4444',
                        color: 'white',
                        cursor: 'pointer',
                        fontSize: '12px'
                      }}
                    >
                      {t('pages.maintenance.repairs.actions.unrepairable')}
                    </button>
                  </div>
                )}
              </td>
            </tr>
          ))}
          {(!repairs || repairs.length === 0) && (
            <tr>
              <td colSpan={11} style={{
                padding: '40px 8px',
                textAlign: 'center',
                color: '#6b7280',
                fontSize: '14px'
              }}>
                {t('pages.maintenance.repairs.noDataSubtitle')}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
