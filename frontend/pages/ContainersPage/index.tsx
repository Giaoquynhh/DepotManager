import Header from '@components/Header';
import Card from '@components/Card';
import { useTranslation } from '@hooks/useTranslation';

import useSWR from 'swr';
import { useState } from 'react';
import { containersApi } from '@services/containers';
import React from 'react'; // Added for React.useMemo

function ContainersList(){
  const { t } = useTranslation();
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const pageSize = 20;
  const key = ['containers_page', q, status, page].join(':');
  const { data, mutate, error } = useSWR(key, async ()=> {
    const backendStatus = status === 'IN_YARD' ? 'OCCUPIED' : undefined;
    // Lấy tất cả container (không chỉ CHECKED) để bao gồm cả container SystemAdmin nhập
    const params: any = { 
      q: q || undefined, 
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
    
    // Debug: Log dữ liệu gốc
    console.log('🔍 Raw data from API:', data.items);
    console.log('🔍 Raw data count:', data.items.length);
    
    // Sử dụng Map để đảm bảo mỗi container_no chỉ xuất hiện một lần
    const containerMap = new Map();
    
    data.items.forEach((it: any) => {
      const inYard = !!it.slot_code;
      
      // Debug: Log từng item
      console.log(`📦 Processing container: ${it.container_no}, source: ${it.data_source}, status: ${it.service_status}, inYard: ${inYard}`);
      
      // Kiểm tra trạng thái IN_YARD và IN_CAR trước (đã được duyệt trên Forklift)
      if (it.service_status === 'IN_YARD') {
        // Container đã được duyệt và đặt vào vị trí trong bãi (cho IMPORT)
        containerMap.set(it.container_no, { ...it, derived_status: 'IN_YARD' });
        console.log(`✅ Set ${it.container_no} as IN_YARD`);
      } else if (it.service_status === 'IN_CAR') {
        // Container đã được duyệt và đặt lên xe (cho EXPORT) - ẨN khỏi danh sách
        containerMap.set(it.container_no, { ...it, derived_status: 'IN_CAR', hidden: true });
        console.log(`✅ Set ${it.container_no} as IN_CAR (hidden)`);
      } else if (containerMap.has(it.container_no)) {
        // Container đã tồn tại, kiểm tra ưu tiên
        const existing = containerMap.get(it.container_no);
        console.log(`⚠️  Duplicate found for ${it.container_no}: existing=${existing.data_source}, new=${it.data_source}`);
        
        // Ưu tiên ServiceRequest > RepairTicket > YardPlacement
        if (it.data_source === 'SERVICE_REQUEST' || 
            (it.data_source === 'REPAIR_TICKET' && existing.data_source !== 'SERVICE_REQUEST') ||
            (it.data_source === 'YARD_PLACEMENT' && existing.data_source === 'YARD_PLACEMENT')) {
          
          console.log(`🔄 Replacing ${it.container_no} with new data from ${it.data_source}`);
          
          if (inYard) {
            // Container có slot_code - đã xếp chỗ trong bãi
            if (it.service_status === 'CHECKED' || it.repair_checked === true) {
              // Container đã được kiểm tra (CHECKED) - trạng thái bình thường
              containerMap.set(it.container_no, { ...it, derived_status: 'ASSIGNED' });
              console.log(`✅ Set ${it.container_no} as ASSIGNED (replaced)`);
            } else if (it.service_status === 'SYSTEM_ADMIN_ADDED') {
              // Container được SystemAdmin nhập trực tiếp vào bãi
              containerMap.set(it.container_no, { ...it, derived_status: 'EMPTY_IN_YARD' });
              console.log(`✅ Set ${it.container_no} as EMPTY_IN_YARD (replaced)`);
            } else {
              // Container KHÔNG có service_status = 'CHECKED' nhưng có slot_code
              // => Đây là container được SystemAdmin nhập tùy ý
              containerMap.set(it.container_no, { ...it, derived_status: 'EMPTY_IN_YARD' });
              console.log(`✅ Set ${it.container_no} as EMPTY_IN_YARD (replaced, no status)`);
            }
          } else {
            // Container chưa có slot_code
            if (it.service_status === 'CHECKED' || it.repair_checked === true) {
              // Container đã kiểm tra nhưng chưa xếp chỗ - đang chờ sắp xếp
              containerMap.set(it.container_no, { ...it, derived_status: 'WAITING' });
              console.log(`✅ Set ${it.container_no} as WAITING (replaced)`);
            } else {
              // Container chưa được kiểm tra - không có derived_status
              containerMap.set(it.container_no, { ...it, derived_status: null });
              console.log(`✅ Set ${it.container_no} as null status (replaced)`);
            }
          }
        } else {
          console.log(`⏭️  Skipping ${it.container_no} - lower priority than existing ${existing.data_source}`);
        }
      } else {
        // Container mới, xử lý bình thường
        if (inYard) {
          // Container có slot_code - đã xếp chỗ trong bãi
          if (it.service_status === 'CHECKED' || it.repair_checked === true) {
            // Container đã được kiểm tra (CHECKED) - trạng thái bình thường
            containerMap.set(it.container_no, { ...it, derived_status: 'ASSIGNED' });
            console.log(`✅ Set ${it.container_no} as ASSIGNED (new)`);
          } else if (it.service_status === 'SYSTEM_ADMIN_ADDED') {
            // Container được SystemAdmin nhập trực tiếp vào bãi
            containerMap.set(it.container_no, { ...it, derived_status: 'EMPTY_IN_YARD' });
            console.log(`✅ Set ${it.container_no} as EMPTY_IN_YARD (new)`);
          } else {
            // Container KHÔNG có service_status = 'CHECKED' nhưng có slot_code
            // => Đây là container được SystemAdmin nhập tùy ý
            containerMap.set(it.container_no, { ...it, derived_status: 'EMPTY_IN_YARD' });
            console.log(`✅ Set ${it.container_no} as EMPTY_IN_YARD (new, no status)`);
          }
        } else {
          // Container chưa có slot_code
          if (it.service_status === 'CHECKED' || it.repair_checked === true) {
            // Container đã kiểm tra nhưng chưa xếp chỗ - đang chờ sắp xếp
            containerMap.set(it.container_no, { ...it, derived_status: 'WAITING' });
            console.log(`✅ Set ${it.container_no} as WAITING (new)`);
          } else {
            // Container chưa được kiểm tra - không có derived_status
            containerMap.set(it.container_no, { ...it, derived_status: null });
            console.log(`✅ Set ${it.container_no} as null status (new)`);
          }
        }
      }
    });
    
    const result = Array.from(containerMap.values());
    
    // Debug: Log kết quả cuối cùng
    console.log('🔍 Final processed items:', result);
    console.log('🔍 Final count:', result.length);
    console.log('🔍 Container map keys:', Array.from(containerMap.keys()));
    
    return result;
  }, [data?.items]);
  
  // Lọc theo trạng thái và ẩn container IN_CAR (đã lên xe)
  const visibleItems = processedItems.filter((i:any) => !i.hidden); // Loại bỏ container bị ẩn
  
  const filteredItems = status === 'WAITING' ? 
    visibleItems.filter((i:any) => i.derived_status === 'WAITING') : 
    status === 'ASSIGNED' ? 
    visibleItems.filter((i:any) => i.derived_status === 'ASSIGNED') : 
    status === 'IN_YARD' ?
    visibleItems.filter((i:any) => i.derived_status === 'IN_YARD') : // Container đã ở trong bãi
    status === 'IN_CAR' ?
    visibleItems.filter((i:any) => i.derived_status === 'IN_CAR') : // Container đã lên xe (không hiển thị)
    status === 'EMPTY_IN_YARD' ?
    visibleItems.filter((i:any) => i.derived_status === 'EMPTY_IN_YARD') : // Container rỗng có trong bãi
    visibleItems.filter((i:any) => i.derived_status !== null); // Lấy tất cả container có derived_status
  


  return (
    <>
      <div style={{display:'flex', gap:12, marginBottom:16, alignItems:'center', flexWrap:'wrap'}}>
        <input 
          placeholder={t('pages.containers.searchPlaceholder')} 
          value={q} 
          onChange={e=>{ setQ(e.target.value); setPage(1); mutate(); }}
          style={{padding:'8px 12px', border:'1px solid #d1d5db', borderRadius:6, minWidth:200}}
        />
        <select 
          value={status} 
          onChange={e=>{ setStatus(e.target.value); setPage(1); mutate(); }}
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
      <div style={{overflow:'hidden', borderRadius:12, border:'1px solid #e8eef6'}}>
        <table className="table">
          <thead style={{background:'#f7f9ff'}}>
            <tr>
              <th>{t('pages.containers.tableHeaders.container')}</th>
              <th>{t('pages.containers.tableHeaders.yard')}</th>
              <th>{t('pages.containers.tableHeaders.block')}</th>
              <th>{t('pages.containers.tableHeaders.slot')}</th>
              <th>{t('pages.containers.tableHeaders.status')}</th>
              <th>{t('pages.containers.tableHeaders.checkInfo')}</th>
            </tr>
          </thead>
          <tbody>
            {filteredItems.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ textAlign:'center', color:'#64748b' }}>
                  {data ? t('pages.containers.noDataSubtitle') : (error ? t('pages.containers.cannotLoadData') : t('common.loading'))}
                </td>
              </tr>
            ) : filteredItems.map((it:any)=>(
              <tr key={it.container_no}>
                <td style={{fontWeight:700}}>{it.container_no}</td>
                <td>{it.yard_name || '-'}</td>
                <td>{it.block_code || '-'}</td>
                <td>{it.slot_code || '-'}</td>
                                 <td>
                   <div style={{display:'flex', flexDirection:'column'}}>
                     {it.derived_status ? (
                       <>
                         <span
                           style={{
                             background: it.derived_status==='ASSIGNED' ? '#e0f2fe' : 
                                        it.derived_status==='IN_YARD' ? '#dcfce7' :
                                        it.derived_status==='IN_CAR' ? '#fef3c7' :
                                        it.derived_status==='EMPTY_IN_YARD' ? '#fef3c7' : '#fff7e6',
                             color: it.derived_status==='ASSIGNED' ? '#0c4a6e' : 
                                   it.derived_status==='IN_YARD' ? '#166534' :
                                   it.derived_status==='IN_CAR' ? '#92400e' :
                                   it.derived_status==='EMPTY_IN_YARD' ? '#92400e' : '#664d03',
                             padding:'4px 8px',
                             borderRadius:8,
                             fontWeight:700,
                             width:'fit-content'
                           }}
                         >
                           {it.derived_status==='ASSIGNED' ? t('pages.containers.statusAssigned') : 
                            it.derived_status==='IN_YARD' ? t('pages.containers.statusInYard') :
                            it.derived_status==='IN_CAR' ? t('pages.containers.statusInCar') :
                            it.derived_status==='EMPTY_IN_YARD' ? t('pages.containers.statusEmptyInYard') : t('pages.containers.statusWaiting')}
                         </span>
                         {(it.derived_status==='ASSIGNED' || it.derived_status==='IN_YARD' || it.derived_status==='EMPTY_IN_YARD') && (
                           <small className="muted" style={{marginTop:4}}>
                             {t('pages.containers.position')}: {it.yard_name || '-'} / {it.block_code || '-'} / {it.slot_code || '-'}</small>
                         )}
                       </>
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
                         {t('pages.containers.notChecked')}
                       </span>
                     )}
                   </div>
                 </td>
                                 <td>
                   <div style={{display:'flex', flexDirection:'column', gap:4}}>
                     {it.service_gate_checked_at && (
                       <small className="muted">
                         {t('pages.containers.checkedAt')}: {new Date(it.service_gate_checked_at).toLocaleString()} | {t('pages.containers.licensePlate')}: {it.service_license_plate || '-'} | {t('pages.containers.driver')}: {it.service_driver_name || '-'}</small>
                       )}
                     {!it.service_gate_checked_at && it.repair_checked && (
                       <small className="muted">
                         {t('pages.containers.checkedAt')}: {new Date(it.repair_updated_at).toLocaleString()} | {t('pages.containers.checkedViaRepair')}
                       </small>
                     )}
                     {it.derived_status === 'EMPTY_IN_YARD' && (
                       <small className="muted" style={{color: '#92400e', fontStyle: 'italic'}}>
                         {t('pages.containers.systemAdminAdded')}
                       </small>
                     )}
                   </div>
                 </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginTop:12}}>
        <div className="muted">{t('pages.containers.totalCurrentPage')}: {filteredItems.length}</div>
        <div style={{display:'flex', gap:8}}>
          <button className="btn" disabled={(data?.page||1)<=1} onClick={()=>{ setPage(p=>p-1); mutate(); }}>{t('common.prev')}</button>
          <div style={{alignSelf:'center'}}>{t('common.page')} {data?.page||1} / {Math.max(1, Math.ceil((data?.total||0)/pageSize))}</div>
          <button className="btn" disabled={(data?.page||1) >= Math.ceil((data?.total||0)/pageSize)} onClick={()=>{ setPage(p=>p+1); mutate(); }}>{t('common.next')}</button>
        </div>
      </div>
    </>
  );
}

export default function ContainersPage(){
  const { t } = useTranslation();
  const { mutate } = useSWR('containers_page');
  
  return (
    <>
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
