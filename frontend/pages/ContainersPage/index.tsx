import Header from '@components/Header';
import Card from '@components/Card';
import { useTranslation } from '@hooks/useTranslation';
import UpdateContainerModal from '@components/UpdateContainerModal';
import ContainerImagesModal from '@components/ContainerImagesModal';

import useSWR from 'swr';
import { useState, useEffect, useCallback } from 'react';
import { containersApi } from '@services/containers';
import React from 'react'; // Added for React.useMemo

function ContainersList(){
  const { t } = useTranslation();
  const [q, setQ] = useState('');
  const [debouncedQ, setDebouncedQ] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const pageSize = 20;
  const [selectedContainer, setSelectedContainer] = useState<any>(null);
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  
  // Container images modal states
  const [isImagesModalOpen, setIsImagesModalOpen] = useState(false);
  const [selectedContainerForImages, setSelectedContainerForImages] = useState<any>(null);
  const [imageModalType, setImageModalType] = useState<'inspection' | 'documents'>('inspection');

  // Debounce search query để giảm số lần gọi API
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQ(q);
      setPage(1); // Reset về trang 1 khi tìm kiếm mới
    }, 500); // Delay 500ms

    return () => clearTimeout(timer);
  }, [q]);

  const key = ['containers_page', debouncedQ, status, page].join(':');
  const { data, mutate, error } = useSWR(key, async ()=> {
    const backendStatus = status === 'IN_YARD' ? 'OCCUPIED' : undefined;
    // Lấy tất cả container (không chỉ CHECKED) để bao gồm cả container SystemAdmin nhập
    const params: any = { 
      q: debouncedQ || undefined, 
      status: backendStatus, 
      // Bỏ service_status filter để lấy cả container SystemAdmin nhập
      page, 
      pageSize 
    };
    
    return await containersApi.list(params);
  });

  // Xử lý dữ liệu một lần và cache lại để tránh tính toán lại
  const processedItems = React.useMemo(() => {
    if (!data?.items) return [];
    
    // Sử dụng Map để đảm bảo mỗi container_no chỉ xuất hiện một lần
    const containerMap = new Map();
    
    data.items.forEach((it: any) => {
      const inYard = !!it.slot_code;
      
      // Kiểm tra trạng thái IN_YARD và IN_CAR trước (đã được duyệt trên Forklift)
      if (it.service_status === 'IN_YARD') {
        // Container đã được duyệt và đặt vào vị trí trong bãi (cho IMPORT)
        containerMap.set(it.container_no, { ...it, derived_status: 'IN_YARD' });
      } else if (it.service_status === 'IN_CAR') {
        // Container đã được duyệt và đặt lên xe (cho EXPORT) - ẨN khỏi danh sách
        containerMap.set(it.container_no, { ...it, derived_status: 'IN_CAR', hidden: true });
      } else if (containerMap.has(it.container_no)) {
        // Container đã tồn tại, kiểm tra ưu tiên
        const existing = containerMap.get(it.container_no);
        
        // Ưu tiên ServiceRequest > RepairTicket > YardPlacement
        if (it.data_source === 'SERVICE_REQUEST' || 
            (it.data_source === 'REPAIR_TICKET' && existing.data_source !== 'SERVICE_REQUEST') ||
            (it.data_source === 'YARD_PLACEMENT' && existing.data_source === 'YARD_PLACEMENT')) {
          
          if (inYard) {
            // Container có slot_code - đã xếp chỗ trong bãi
            if (it.service_status === 'CHECKED' || it.repair_checked === true) {
              // Container đã được kiểm tra (CHECKED) - trạng thái bình thường
              containerMap.set(it.container_no, { ...it, derived_status: 'ASSIGNED' });
            } else if (it.service_status === 'SYSTEM_ADMIN_ADDED') {
              // Container được SystemAdmin nhập trực tiếp vào bãi
              containerMap.set(it.container_no, { ...it, derived_status: 'EMPTY_IN_YARD' });
            } else {
              // Container KHÔNG có service_status = 'CHECKED' nhưng có slot_code
              // => Đây là container được SystemAdmin nhập tùy ý
              containerMap.set(it.container_no, { ...it, derived_status: 'EMPTY_IN_YARD' });
            }
          } else {
            // Container chưa có slot_code
            if (it.service_status === 'CHECKED' || it.repair_checked === true) {
              // Container đã kiểm tra nhưng chưa xếp chỗ - đang chờ sắp xếp
              containerMap.set(it.container_no, { ...it, derived_status: 'WAITING' });
            } else {
              // Container chưa được kiểm tra - không có derived_status
              containerMap.set(it.container_no, { ...it, derived_status: null });
            }
          }
        }
      } else {
        // Container mới, xử lý bình thường
        if (inYard) {
          // Container có slot_code - đã xếp chỗ trong bãi
          if (it.service_status === 'CHECKED' || it.repair_checked === true) {
            // Container đã được kiểm tra (CHECKED) - trạng thái bình thường
            containerMap.set(it.container_no, { ...it, derived_status: 'ASSIGNED' });
          } else if (it.service_status === 'SYSTEM_ADMIN_ADDED') {
            // Container được SystemAdmin nhập trực tiếp vào bãi
            containerMap.set(it.container_no, { ...it, derived_status: 'EMPTY_IN_YARD' });
          } else {
            // Container KHÔNG có service_status = 'CHECKED' nhưng có slot_code
            // => Đây là container được SystemAdmin nhập tùy ý
            containerMap.set(it.container_no, { ...it, derived_status: 'EMPTY_IN_YARD' });
          }
        } else {
          // Container chưa có slot_code
          if (it.service_status === 'CHECKED' || it.repair_checked === true) {
            // Container đã kiểm tra nhưng chưa xếp chỗ - đang chờ sắp xếp
            containerMap.set(it.container_no, { ...it, derived_status: 'WAITING' });
          } else {
            // Container chưa được kiểm tra - không có derived_status
            containerMap.set(it.container_no, { ...it, derived_status: null });
          }
        }
      }
    });
    
    return Array.from(containerMap.values());
  }, [data?.items]);
  
  // Lọc theo trạng thái và ẩn container IN_CAR (đã lên xe) - memoize để tránh tính toán lại
  const filteredItems = React.useMemo(() => {
    const visibleItems = processedItems.filter((i:any) => !i.hidden); // Loại bỏ container bị ẩn
    
    if (status === 'WAITING') {
      return visibleItems.filter((i:any) => i.derived_status === 'WAITING');
    } else if (status === 'ASSIGNED') {
      return visibleItems.filter((i:any) => i.derived_status === 'ASSIGNED');
    } else if (status === 'IN_YARD') {
      return visibleItems.filter((i:any) => i.derived_status === 'IN_YARD');
    } else if (status === 'IN_CAR') {
      return visibleItems.filter((i:any) => i.derived_status === 'IN_CAR');
    } else if (status === 'EMPTY_IN_YARD') {
      return visibleItems.filter((i:any) => i.derived_status === 'EMPTY_IN_YARD');
    } else {
      return visibleItems.filter((i:any) => i.derived_status !== null);
    }
  }, [processedItems, status]);
  
  // Handler cho việc mở modal hình ảnh
  const handleOpenImagesModal = (container: any, type: 'inspection' | 'documents') => {
    setSelectedContainerForImages(container);
    setImageModalType(type);
    setIsImagesModalOpen(true);
  };

  // Handler cho việc đóng modal hình ảnh
  const handleCloseImagesModal = () => {
    setIsImagesModalOpen(false);
    setSelectedContainerForImages(null);
  };

  return (
    <>
      <div style={{display:'flex', gap:12, marginBottom:16, alignItems:'center', flexWrap:'wrap'}}>
        <input 
          placeholder={t('pages.containers.searchPlaceholder')} 
          value={q} 
          onChange={e=>{ setQ(e.target.value); }}
          style={{padding:'8px 12px', border:'1px solid #d1d5db', borderRadius:6, minWidth:300}}
        />
        <select 
          value={status} 
          onChange={e=>{ setStatus(e.target.value); setPage(1); }}
          style={{padding:'8px 12px', border:'1px solid #d1d5db', borderRadius:6, width: 'fit-content'}}
        >
          <option value="">{t('pages.containers.allStatuses')}</option>
          <option value="WAITING">{t('pages.containers.statusWaiting')}</option>
          <option value="ASSIGNED">{t('pages.containers.statusAssigned')}</option>
          <option value="IN_YARD">{t('pages.containers.statusInYard')}</option>
          <option value="EMPTY_IN_YARD">{t('pages.containers.statusEmptyInYard')}</option>
        </select>
      </div>
      {error && (
        <div style={{marginBottom:12, border:'1px solid #fecaca', background:'#fef2f2', color:'#7f1d1d', padding:10, borderRadius:8}}>
          {t('pages.containers.loadDataError')}: {((error as any)?.response?.data?.message) || ((error as any)?.message) || t('common.unknownError')}
        </div>
      )}
      {!data && !error && (
        <div className="muted" style={{marginBottom:12}}>{t('common.loading')}</div>
      )}
      <div className="gate-table-container">
        <table className="gate-table">
          <thead>
            <tr>
              <th data-column="shippingLine">Hãng tàu</th>
              <th data-column="container">Số cont</th>
              <th data-column="containerType">Loại cont</th>
              <th data-column="status">Trạng thái</th>
              <th data-column="images">Hình ảnh</th>
              <th data-column="position">Vị trí</th>
              <th data-column="seal">Số seal</th>
              <th data-column="customer">Khách hàng</th>
              <th data-column="demDet">DEM/DET</th>
              <th data-column="action">Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredItems.length === 0 ? (
              <tr>
                <td colSpan={10} style={{ textAlign:'center', color:'#64748b' }}>
                  {data ? t('pages.containers.noDataSubtitle') : (error ? t('pages.containers.cannotLoadData') : t('common.loading'))}
                </td>
              </tr>
            ) : filteredItems.map((it:any)=>(
              <tr key={it.container_no} className="table-row">
                <td data-column="shippingLine">{it.shipping_line?.name || '-'}</td>
                <td data-column="container" style={{fontWeight:700}}>{it.container_no}</td>
                <td data-column="containerType">{it.container_type?.code || '-'}</td>
                <td data-column="status">
                   <div style={{display:'flex', flexDirection:'column'}}>
                     {/* Hiển thị trạng thái dựa trên repairTicket */}
                     {it.repair_ticket ? (
                       <span
                         style={{
                           background: it.repair_ticket.status === 'COMPLETE' ? '#dcfce7' : '#fef2f2',
                           color: it.repair_ticket.status === 'COMPLETE' ? '#166534' : '#dc2626',
                           padding:'4px 8px',
                           borderRadius:8,
                           fontWeight:700,
                           width:'fit-content'
                         }}
                       >
                         {it.repair_ticket.status === 'COMPLETE' ? 'Cont tốt' : 'Cần sửa chữa'}
                       </span>
                     ) : (
                       <span
                         style={{
                           background: '#f3f4f6',
                           color: '#6b7280',
                           padding:'4px 8px',
                           borderRadius:8,
                           fontWeight:700,
                           width:'fit-content'
                         }}
                       >
                         Chưa kiểm tra
                       </span>
                     )}
                   </div>
                 </td>
                <td data-column="images">
                   <div style={{display:'flex', flexDirection:'column', gap:4}}>
                     <button 
                       style={{
                         background: '#e0f2fe',
                         color: '#0369a1',
                         border: '1px solid #bae6fd',
                         borderRadius: '6px',
                         padding: '4px 8px',
                         fontSize: '12px',
                         fontWeight: '500',
                         cursor: 'pointer',
                         transition: 'all 0.2s'
                       }}
                       onMouseOver={(e) => {
                         e.currentTarget.style.background = '#bae6fd';
                       }}
                       onMouseOut={(e) => {
                         e.currentTarget.style.background = '#e0f2fe';
                       }}
                       onClick={() => handleOpenImagesModal(it, 'inspection')}
                     >
                       {it.attachments?.filter((att: any) => att.file_type?.startsWith('image/')).length || 0} ảnh kiểm tra
                     </button>
                     <button 
                       style={{
                         background: '#e0f2fe',
                         color: '#0369a1',
                         border: '1px solid #bae6fd',
                         borderRadius: '6px',
                         padding: '4px 8px',
                         fontSize: '12px',
                         fontWeight: '500',
                         cursor: 'pointer',
                         transition: 'all 0.2s'
                       }}
                       onMouseOver={(e) => {
                         e.currentTarget.style.background = '#bae6fd';
                       }}
                       onMouseOut={(e) => {
                         e.currentTarget.style.background = '#e0f2fe';
                       }}
                       onClick={() => handleOpenImagesModal(it, 'documents')}
                     >
                       {it.attachments?.filter((att: any) => !att.file_type?.startsWith('image/')).length || 0} ảnh chứng từ
                     </button>
                   </div>
                 </td>
                <td data-column="position">
                   <div style={{display:'flex', flexDirection:'column'}}>
                     <span>{it.yard_name || '-'}</span>
                     <small className="muted">{it.block_code || '-'} / {it.slot_code || '-'}</small>
                   </div>
                 </td>
                <td data-column="seal">{it.seal_number || '-'}</td>
                <td data-column="customer">{it.customer?.name || '-'}</td>
                <td data-column="demDet">{it.dem_det || '-'}</td>
                <td data-column="action">
                   <button 
                     className="btn btn-sm" 
                     style={{padding: '4px 8px', fontSize: '12px'}}
                     onClick={() => {
                       setSelectedContainer(it);
                       setIsUpdateModalOpen(true);
                     }}
                   >
                     Cập nhật
                   </button>
                 </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginTop:12}}>
        <div className="muted">{t('pages.containers.totalCurrentPage')}: {filteredItems.length}</div>
        <div style={{display:'flex', gap:8}}>
          <button className="btn" disabled={(data?.page||1)<=1} onClick={()=>{ setPage(p=>p-1); }}>{t('common.prev')}</button>
          <div style={{alignSelf:'center'}}>{t('common.page')} {data?.page||1} / {Math.max(1, Math.ceil((data?.total||0)/pageSize))}</div>
          <button className="btn" disabled={(data?.page||1) >= Math.ceil((data?.total||0)/pageSize)} onClick={()=>{ setPage(p=>p+1); }}>{t('common.next')}</button>
        </div>
      </div>
      
      <UpdateContainerModal
        isOpen={isUpdateModalOpen}
        onClose={() => {
          setIsUpdateModalOpen(false);
          setSelectedContainer(null);
        }}
        container={selectedContainer}
        onUpdate={async (containerData) => {
          try {
            await containersApi.update(containerData.container_no, {
              shipping_line_id: containerData.shipping_line_id,
              container_type_id: containerData.container_type_id,
              customer_id: containerData.customer_id,
              vehicle_company_id: containerData.vehicle_company_id,
              dem_det: containerData.dem_det,
              seal_number: containerData.seal_number
            });
            // Refresh data after update
            mutate();
          } catch (error) {
            console.error('Error updating container:', error);
          }
        }}
      />

      <ContainerImagesModal
        isOpen={isImagesModalOpen}
        onClose={handleCloseImagesModal}
        containerNo={selectedContainerForImages?.container_no || ''}
        attachments={selectedContainerForImages?.attachments || []}
        imageType={imageModalType}
      />
    </>
  );
}

export default function ContainersPage(){
  const { t } = useTranslation();
  const { mutate } = useSWR('containers_page');
  
  return (
    <>
      <style>{`
        /* Mobile scroll fix for Containers page */
        @media (max-width: 768px) {
          body {
            overflow-y: auto !important;
            overflow-x: hidden !important;
            -webkit-overflow-scrolling: touch;
          }
          
          .container.depot-requests {
            overflow: visible !important;
            padding-bottom: 2rem;
          }
        }
      `}</style>
      <Header />
      <main className="container depot-requests">
        {/* Page Header */}
        <div className="page-header modern-header">
          <div className="header-content">
            <div className="header-left">
              <h1 className="page-title gradient gradient-ultimate">{t('pages.containers.title')}</h1>
            </div>

            <div className="header-actions">
            </div>
          </div>
        </div>

        <Card>
          <ContainersList />
        </Card>
      </main>
    </>
  );
}
