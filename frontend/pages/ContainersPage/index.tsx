import Header from '@components/Header';
import Card from '@components/Card';
import TestContainerEmpty from '@components/TestContainerEmpty';

import useSWR from 'swr';
import { useState } from 'react';
import { reportsApi } from '@services/reports';

function ContainersList(){
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
    
    return await reportsApi.listContainers(params);
  });

  const items = (data?.items || []).map((it:any) => {
    const inYard = !!it.slot_code;
    
    if (inYard) {
      // Container có slot_code - đã xếp chỗ trong bãi
      if (it.service_status === 'CHECKED' || it.repair_checked === true) {
        // Container đã được kiểm tra (CHECKED) - trạng thái bình thường
        return { ...it, derived_status: 'ASSIGNED' };
      } else if (it.service_status === 'SYSTEM_ADMIN_ADDED') {
        // Container được SystemAdmin nhập trực tiếp vào bãi
        return { ...it, derived_status: 'EMPTY_IN_YARD' };
      } else {
        // Container KHÔNG có service_status = 'CHECKED' nhưng có slot_code
        // => Đây là container được SystemAdmin nhập tùy ý
        return { ...it, derived_status: 'EMPTY_IN_YARD' };
      }
    } else {
      // Container chưa có slot_code
      if (it.service_status === 'CHECKED' || it.repair_checked === true) {
        // Container đã kiểm tra nhưng chưa xếp chỗ - đang chờ sắp xếp
        return { ...it, derived_status: 'WAITING' };
      } else {
        // Container chưa được kiểm tra - không có derived_status
        return { ...it, derived_status: null };
      }
    }
  });
  
  // Lọc theo trạng thái
  const filteredItems = status === 'WAITING' ? 
    items.filter((i:any) => i.derived_status === 'WAITING') : 
    status === 'ASSIGNED' ? 
    items.filter((i:any) => i.derived_status === 'ASSIGNED') : 
    status === 'EMPTY_IN_YARD' ?
    items.filter((i:any) => i.derived_status === 'EMPTY_IN_YARD') : // Container rỗng có trong bãi
    items.filter((i:any) => i.derived_status !== null); // Lấy tất cả container có derived_status
  


  return (
    <>
      <div style={{display:'flex', gap:12, marginBottom:16, alignItems:'center', flexWrap:'wrap'}}>
        <input 
          placeholder="Tìm container_no" 
          value={q} 
          onChange={e=>{ setQ(e.target.value); setPage(1); mutate(); }}
          style={{padding:'8px 12px', border:'1px solid #d1d5db', borderRadius:6, minWidth:200}}
        />
        <select 
          value={status} 
          onChange={e=>{ setStatus(e.target.value); setPage(1); mutate(); }}
          style={{padding:'8px 12px', border:'1px solid #d1d5db', borderRadius:6, minWidth:160}}
        >
          <option value="">Tất cả trạng thái</option>
          <option value="WAITING">Đang chờ sắp xếp</option>
          <option value="ASSIGNED">Đã xếp chỗ trong bãi</option>
          <option value="EMPTY_IN_YARD">Container rỗng có trong bãi</option>
        </select>
                           <div style={{display:'flex', alignItems:'center', gap:8, padding:'8px 12px', background:'#f0f9ff', border:'1px solid #0ea5e9', borderRadius:6}}>
            <input 
              type="checkbox" 
              id="show-checked-only" 
              checked={true} 
              disabled={true}
              style={{margin:0}}
            />
            <label htmlFor="show-checked-only" style={{fontSize:14, color:'#0369a1', cursor:'default', fontWeight:500}}>
              Hiển thị tất cả container - Bao gồm cả container SystemAdmin nhập
            </label>
          </div>
      </div>
      {error && (
        <div style={{marginBottom:12, border:'1px solid #fecaca', background:'#fef2f2', color:'#7f1d1d', padding:10, borderRadius:8}}>
          Lỗi tải dữ liệu: {((error as any)?.response?.data?.message) || ((error as any)?.message) || 'Không xác định'}
        </div>
      )}
      {!data && !error && (
        <div className="muted" style={{marginBottom:12}}>Đang tải dữ liệu...</div>
      )}
      <div style={{overflow:'hidden', borderRadius:12, border:'1px solid #e8eef6'}}>
        <table className="table">
          <thead style={{background:'#f7f9ff'}}><tr><th>Container</th><th>Yard</th><th>Block</th><th>Slot</th><th>Trạng thái</th><th>Thông tin kiểm tra</th></tr></thead>
          <tbody>
            {filteredItems.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ textAlign:'center', color:'#64748b' }}>
                  {data ? 'Không có container phù hợp bộ lọc.' : (error ? 'Không thể tải dữ liệu.' : 'Đang tải...')}
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
                                        it.derived_status==='EMPTY_IN_YARD' ? '#fef3c7' : '#fff7e6',
                             color: it.derived_status==='ASSIGNED' ? '#0c4a6e' : 
                                   it.derived_status==='EMPTY_IN_YARD' ? '#92400e' : '#664d03',
                             padding:'4px 8px',
                             borderRadius:8,
                             fontWeight:700,
                             width:'fit-content'
                           }}
                         >
                           {it.derived_status==='ASSIGNED' ? 'Đã xếp chỗ trong bãi' : 
                            it.derived_status==='EMPTY_IN_YARD' ? 'Container rỗng có trong bãi' : 'Đang chờ sắp xếp'}
                         </span>
                         {(it.derived_status==='ASSIGNED' || it.derived_status==='EMPTY_IN_YARD') && (
                           <small className="muted" style={{marginTop:4}}>
                             Vị trí: {it.yard_name || '-'} / {it.block_code || '-'} / {it.slot_code || '-'}</small>
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
                         Chưa kiểm tra
                       </span>
                     )}
                   </div>
                 </td>
                                 <td>
                   <div style={{display:'flex', flexDirection:'column', gap:4}}>
                     {it.service_gate_checked_at && (
                       <small className="muted">
                         Lúc: {new Date(it.service_gate_checked_at).toLocaleString()} | Biển số: {it.service_license_plate || '-'} | Tài xế: {it.service_driver_name || '-'}</small>
                       )}
                     {!it.service_gate_checked_at && it.repair_checked && (
                       <small className="muted">
                         Lúc: {new Date(it.repair_updated_at).toLocaleString()} | Đã kiểm tra qua phiếu sửa chữa
                       </small>
                     )}
                     {it.derived_status === 'EMPTY_IN_YARD' && (
                       <small className="muted" style={{color: '#92400e', fontStyle: 'italic'}}>
                         Container được SystemAdmin nhập trực tiếp vào bãi
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
        <div className="muted">Tổng (trang hiện tại): {filteredItems.length}</div>
        <div style={{display:'flex', gap:8}}>
          <button className="btn" disabled={(data?.page||1)<=1} onClick={()=>{ setPage(p=>p-1); mutate(); }}>Prev</button>
          <div style={{alignSelf:'center'}}>Trang {data?.page||1} / {Math.max(1, Math.ceil((data?.total||0)/pageSize))}</div>
          <button className="btn" disabled={(data?.page||1) >= Math.ceil((data?.total||0)/pageSize)} onClick={()=>{ setPage(p=>p+1); mutate(); }}>Next</button>
        </div>
      </div>
    </>
  );
}

export default function ContainersPage(){
  const { mutate } = useSWR('containers_page');
  
  return (
    <>
      <Header />
      <main className="container">
        <TestContainerEmpty onTest={() => mutate()} />
        <Card title="Quản lý container" subtitle="Hiển thị tất cả container - Bao gồm cả container được SystemAdmin nhập trực tiếp vào bãi">
          <ContainersList />
        </Card>
      </main>
    </>
  );
}
