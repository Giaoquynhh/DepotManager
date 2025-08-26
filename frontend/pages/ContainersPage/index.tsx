import Header from '@components/Header';
import Card from '@components/Card';

import useSWR from 'swr';
import { useState } from 'react';
import { reportsApi } from '@services/reports';
 

function ContainersList(){
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('');
  const [gateFilter, setGateFilter] = useState<'ALL'|'CHECKED'>('CHECKED');
  const [page, setPage] = useState(1);
  const pageSize = 20;
  const key = ['containers_page', q, status, gateFilter, page].join(':');
  const { data, mutate } = useSWR(key, async ()=> {
    const backendStatus = status === 'IN_YARD' ? 'OCCUPIED' : undefined;
    const params: any = { q: q || undefined, status: backendStatus, page, pageSize };
    if (gateFilter === 'CHECKED') params.service_status = 'CHECKED';
    return reportsApi.listContainers(params);
  });

  const items = (data?.items || []).map((it:any) => {
    const inYard = !!it.slot_code;
    return { ...it, derived_status: inYard ? 'IN_YARD' : 'WAITING' };
  });
  const filteredItems = status === 'WAITING' ? items.filter((i:any)=>i.derived_status==='WAITING') : status === 'IN_YARD' ? items.filter((i:any)=>i.derived_status==='IN_YARD') : items;

  return (
    <>
      <div style={{display:'grid', gridTemplateColumns:'1fr 220px 220px', gap:12, marginBottom:12}}>
        <input placeholder="Tìm container_no" value={q} onChange={e=>{ setQ(e.target.value); setPage(1); mutate(); }} />
        <select value={status} onChange={e=>{ setStatus(e.target.value); setPage(1); mutate(); }}>
          <option value="">Tất cả trạng thái</option>
          <option value="WAITING">Đang chờ sắp xếp</option>
          <option value="IN_YARD">Ở trong bãi</option>
        </select>
        <select value={gateFilter} onChange={e=>{ setGateFilter(e.target.value as any); setPage(1); mutate(); }}>
          <option value="CHECKED">Chỉ container đã kiểm tra</option>
          <option value="ALL">Tất cả (không lọc kiểm tra)</option>
        </select>
      </div>
      <div style={{overflow:'hidden', borderRadius:12, border:'1px solid #e8eef6'}}>
        <table className="table">
          <thead style={{background:'#f7f9ff'}}><tr><th>Container</th><th>Yard</th><th>Block</th><th>Slot</th><th>Trạng thái</th><th>Gate</th><th>DEM</th><th>DET</th></tr></thead>
          <tbody>
            {filteredItems.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ textAlign:'center', color:'#64748b' }}>
                  Không có container phù hợp bộ lọc.
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
                    <span
                      style={{
                        background: it.derived_status==='IN_YARD' ? '#e6f9f0' : '#fff7e6',
                        color: it.derived_status==='IN_YARD' ? '#0f5132' : '#664d03',
                        padding:'4px 8px',
                        borderRadius:8,
                        fontWeight:700,
                        width:'fit-content'
                      }}
                    >
                      {it.derived_status==='IN_YARD' ? 'Ở trong bãi' : 'Đang chờ sắp xếp'}
                    </span>
                    {it.derived_status==='IN_YARD' && (
                      <small className="muted" style={{marginTop:4}}>
                        Vị trí: {it.yard_name || '-'} / {it.block_code || '-'} / {it.slot_code || '-'}</small>
                    )}
                  </div>
                </td>
                <td>
                  <div style={{display:'flex', flexDirection:'column', gap:4}}>
                    <span style={{
                      background:'#eef2ff', color:'#3730a3', padding:'2px 6px', borderRadius:6, fontSize:12, fontWeight:600, width:'fit-content'
                    }}>{(it.service_gate_checked_at || it.repair_checked) ? 'CHECKED' : (it.service_status || '-')}</span>
                    {it.service_gate_checked_at && (
                      <small className="muted">
                        Lúc: {new Date(it.service_gate_checked_at).toLocaleString()} | Biển số: {it.service_license_plate || '-'} | Tài xế: {it.service_driver_name || '-'}</small>
                    )}
                    {!it.service_gate_checked_at && it.repair_checked && (
                      <small className="muted">Đã kiểm tra qua RepairTicket</small>
                    )}
                  </div>
                </td>
                <td>{it.dem_date ? new Date(it.dem_date).toLocaleDateString() : '-'}</td>
                <td>{it.det_date ? new Date(it.det_date).toLocaleDateString() : '-'}</td>
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
  return (
    <>
      <Header />
      <main className="container">
        <Card title="Containers">
          <ContainersList />
        </Card>
      </main>
    </>
  );
}
