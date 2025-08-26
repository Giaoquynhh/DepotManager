import useSWR, { mutate } from 'swr';
import { useEffect, useMemo, useState } from 'react';
import Header from '@components/Header';
import Card from '@components/Card';
import { api } from '@services/api';
import { AppRole, isBusinessAdmin, isSystemAdmin } from '@utils/rbac';
import { PERMISSION_CATALOG, PermissionKey } from '@utils/permissionsCatalog';

const fetcher = (url: string) => api.get(url).then(r => r.data);

export default function PermissionsPage(){
  const [myRole, setMyRole] = useState<string>('');
  const [myEmail, setMyEmail] = useState<string>('');
  const [message, setMessage] = useState<string>('');
  const [keyword, setKeyword] = useState<string>('');
  const [loadingRow, setLoadingRow] = useState<string>('');
  const [selected, setSelected] = useState<Record<string, AppRole>>({});
  const [permSelections, setPermSelections] = useState<Record<string, string[]>>({});
  

  useEffect(()=>{
    if (typeof window !== 'undefined'){
      api.get('/auth/me')
        .then(r=>{ setMyRole(r.data?.role || r.data?.roles?.[0] || ''); setMyEmail(r.data?.email || ''); })
        .catch(()=>{});
    }
  },[]);

  const isAllowed = isSystemAdmin(myRole) || isBusinessAdmin(myRole);
  const { data: users } = useSWR(isAllowed ? ['/users?role=&page=1&limit=100'] : null, ([u]) => fetcher(u));

  const roleOptions: AppRole[] = useMemo(()=>[
    'SystemAdmin','BusinessAdmin','HRManager','SaleAdmin','CustomerAdmin','CustomerUser','PartnerAdmin','Security','YardManager','MaintenanceManager','Accountant'
  ], []);

  // Group catalog by group for rendering
  const catalogByGroup = useMemo(()=>{
    const groups = new Map<string, Array<{ key: PermissionKey; label: string }>>();
    for (const it of PERMISSION_CATALOG) {
      const arr = groups.get(it.group) || [];
      arr.push({ key: it.key, label: it.label });
      groups.set(it.group, arr);
    }
    return Array.from(groups.entries());
  }, []);

  // Presets theo vai trò (dùng để hiển thị mặc định dấu ✓ theo role khi user chưa có permissions riêng)
  const rolePresets: Partial<Record<AppRole, PermissionKey[]>> = useMemo(()=>{
    const all = PERMISSION_CATALOG.map(i=>i.key) as PermissionKey[];
    return {
      SystemAdmin: all,
      BusinessAdmin: [
        'users_partners.view',
        'permissions.manage',
        'requests.depot',
        'reports.view',
        'account.view',
      ],
      HRManager: [
        'reports.view',
        'account.view',
      ],
      SaleAdmin: [
        'requests.depot',
        'yard.view',
        'containers.manage',
        'forklift.view',
        'maintenance.repairs',
        'maintenance.inventory',
        'finance.invoices',
        'finance.create_invoice',
        'reports.view',
        'account.view',
      ],
      CustomerAdmin: [
        'users_partners.view', // nếu muốn cho CustomerAdmin xem người dùng/đối tác, có thể gỡ nếu không cần
        'requests.customer',
        'reports.view',
        'account.view',
      ],
      CustomerUser: [
        'requests.customer',
        'reports.view',
        'account.view',
      ],
      PartnerAdmin: [
        'reports.view',
        'account.view',
      ],
      Security: [
        'gate.use',
        'account.view',
      ],
      YardManager: [
        'yard.view',
        'containers.manage',
        'forklift.view',
        'reports.view',
        'account.view',
      ],
      MaintenanceManager: [
        'maintenance.repairs',
        'maintenance.inventory',
        'reports.view',
        'account.view',
      ],
      Accountant: [
        'requests.depot',
        'finance.invoices',
        'finance.create_invoice',
        'reports.view',
        'account.view',
      ],
    };
  }, []);

  const list = (users?.data || []) as Array<any>;

  const filtered = useMemo(()=>{
    const kw = keyword.trim().toLowerCase();
    if (!kw) return list;
    return list.filter((u)=>
      String(u.email || '').toLowerCase().includes(kw) ||
      String(u.full_name || '').toLowerCase().includes(kw) ||
      String(u.role || '').toLowerCase().includes(kw)
    );
  }, [list, keyword]);

  const sameStringSet = (a: string[] = [], b: string[] = []): boolean => {
    if (a.length !== b.length) return false;
    const sa = new Set(a);
    for (const x of b) if (!sa.has(x)) return false;
    return true;
  };


  const saveRole = async (user: any) => {
    const id = user.id || user._id;
    const newRole = selected[id] || user.role;
    if (!id) return;
    if (newRole === user.role) return;
    if (String(user.email || '') === myEmail) { setMessage('Không thể tự đổi vai trò của chính mình.'); return; }
    setMessage('');
    setLoadingRow(id);
    try{
      await api.patch(`/users/${id}`, { role: newRole });
      setMessage(`Đã cập nhật vai trò cho ${user.email} -> ${newRole}`);
      setSelected((s)=>({ ...s, [id]: newRole }));
      mutate(['/users?role=&page=1&limit=100']);
    }catch(e:any){
      setMessage(e?.response?.data?.message || 'Lỗi cập nhật vai trò');
    }finally{
      setLoadingRow('');
    }
  };

  const savePermissions = async (user: any) => {
    const id = user.id || user._id;
    if (!id) return;
    if (String(user.email || '') === myEmail) { setMessage('Không thể tự đổi chức năng của chính mình.'); return; }
    const currentPerms: string[] = Array.isArray(user.permissions) ? user.permissions : [];
    const selRole = selected[id] || user.role;
    const roleDefault = rolePresets[selRole]?.slice(0,50) || [];
    const newPerms = (permSelections[id] ?? (currentPerms.length ? currentPerms : roleDefault)).slice(0, 50);
    if (sameStringSet(newPerms, currentPerms)) return; // no changes
    setMessage('');
    setLoadingRow(id);
    try {
      await api.patch(`/users/${id}`, { permissions: newPerms });
      setMessage(`Đã cập nhật chức năng cho ${user.email}`);
      mutate(['/users?role=&page=1&limit=100']);
    } catch (e:any) {
      setMessage(e?.response?.data?.message || 'Lỗi cập nhật chức năng');
    } finally {
      setLoadingRow('');
    }
  };


  if (!isAllowed) {
    return (
      <>
        <Header />
        <main className="container">
          <Card title="Quyền truy cập" subtitle="Chỉ Admin được phép truy cập trang này">
            Bạn không có quyền truy cập trang này.
          </Card>
        </main>
      </>
    );
  }

  return (
    <>
      <Header />
      <main className="container">
        <Card 
          title="Phân quyền vai trò"
          subtitle="Chỉ SystemAdmin/BusinessAdmin được phép thay đổi vai trò và chức năng của người dùng"
          actions={(
            <div style={{display:'flex', gap:8}}>
              <input 
                type="text" 
                placeholder="Tìm theo email, họ tên, vai trò..." 
                value={keyword}
                onChange={e=>setKeyword(e.target.value)}
                style={{ padding:'8px 12px', border:'1px solid #d1d5db', borderRadius:6 }}
              />
            </div>
          )}
        >
          <div className="table-container">
            <table className="table">
              <thead style={{background:'#f8fafc'}}>
                <tr>
                  <th>Email</th>
                  <th>Họ tên</th>
                  <th>Vai trò hiện tại</th>
                  <th>Đổi vai trò</th>
                  <th>Các chức năng</th>
                  <th>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((u:any)=>{
                  const id = u.id || u._id;
                  const current = u.role as AppRole;
                  const sel = selected[id] || current;
                  const isSelf = String(u.email || '') === myEmail;
                  const currPerms: string[] = Array.isArray(u.permissions) ? u.permissions : [];
                  const roleDefault: string[] = rolePresets[sel]?.slice(0,50) || [];
                  const checkedPerms: string[] = permSelections[id] ?? (currPerms.length ? currPerms : roleDefault);
                  return (
                    <tr key={id}>
                      <td style={{fontWeight:600, color:'#1e40af'}}>{u.email}</td>
                      <td>{u.full_name}</td>
                      <td>
                        <span className="badge" style={{
                          background: current === 'SystemAdmin' ? '#dc2626' : 
                                     current === 'BusinessAdmin' ? '#7c3aed' :
                                     current === 'HRManager' ? '#059669' :
                                     current === 'SaleAdmin' ? '#ea580c' :
                                     current === 'CustomerAdmin' ? '#0891b2' : '#6b7280',
                          color: 'white', padding:'4px 8px', borderRadius:4, fontSize:12
                        }}>{current}</span>
                      </td>
                      <td>
                        <select 
                          value={sel}
                          onChange={(e)=>{
                            const newRole = e.target.value as AppRole;
                            setSelected((s)=>({ ...s, [id]: newRole }));
                            const preset = (rolePresets[newRole] || []).slice(0,50) as string[];
                            setPermSelections(prev=>({ ...prev, [id]: preset }));
                          }}
                          disabled={isSelf || loadingRow === id}
                          style={{ padding:'6px 8px', border:'1px solid #d1d5db', borderRadius:6, background:'white' }}
                        >
                          {roleOptions.map(r => (
                            <option key={r} value={r}>{r}</option>
                          ))}
                        </select>
                        {isSelf && (
                          <div className="muted" style={{fontSize:12}}>Không thể đổi vai trò của chính mình</div>
                        )}
                      </td>
                      <td>
                        <div style={{maxHeight: 220, overflowY: 'auto', border:'1px solid #e5e7eb', padding:8, borderRadius:6, width: 380}}>
                          {catalogByGroup.map(([group, items]) => (
                            <div key={group} style={{marginBottom:8}}>
                              <div className="muted" style={{fontSize:12, fontWeight:600, color:'#374151', marginBottom:4}}>{group}</div>
                              {items.map(({key, label}) => (
                                <label key={key} style={{display:'flex', alignItems:'center', gap:6, fontSize:12, padding:'2px 0'}}>
                                  <input
                                    type="checkbox"
                                    checked={checkedPerms.includes(key)}
                                    disabled={isSelf || loadingRow === id}
                                    onChange={(e)=>{
                                      setPermSelections(prev=>{
                                        const base = prev[id] ?? (currPerms.length ? currPerms : roleDefault);
                                        const has = base.includes(key);
                                        let next = base;
                                        if (e.target.checked) next = has ? base : [...base, key];
                                        else next = base.filter(k=>k!==key);
                                        if (next.length > 50) next = next.slice(0, 50);
                                        return { ...prev, [id]: next };
                                      });
                                    }}
                                  />
                                  <span>{label}</span>
                                </label>
                              ))}
                            </div>
                          ))}
                        </div>
                        <div style={{display:'flex', gap:8, marginTop:6}}>
                          <button
                            className="btn btn-sm btn-outline"
                            disabled={isSelf || loadingRow === id}
                            onClick={()=> setPermSelections(prev=>({ ...prev, [id]: (PERMISSION_CATALOG.map(i=>i.key) as string[]).slice(0,50) }))}
                          >Chọn tất cả</button>
                          <button
                            className="btn btn-sm btn-outline"
                            disabled={isSelf || loadingRow === id}
                            onClick={()=> setPermSelections(prev=>({ ...prev, [id]: [] }))}
                          >Bỏ chọn</button>
                          {rolePresets[sel] && (
                            <button
                              className="btn btn-sm btn-outline"
                              disabled={isSelf || loadingRow === id}
                              onClick={()=> setPermSelections(prev=>({ ...prev, [id]: (rolePresets[sel] || []).slice(0,50) }))}
                            >Áp dụng theo vai trò</button>
                          )}
                        </div>
                      </td>
                      <td>
                        <button 
                          className="btn btn-sm"
                          disabled={isSelf || sel === current || loadingRow === id}
                          onClick={()=>saveRole(u)}
                          style={{ background: '#0b2b6d', color: 'white', fontSize:12, padding:'6px 10px', marginRight:8 }}
                          title={sel === current ? 'Chưa có thay đổi' : 'Lưu thay đổi vai trò'}
                        >
                          {loadingRow === id ? 'Đang lưu...' : 'Cập nhật vai trò'}
                        </button>
                        <button
                          className="btn btn-sm"
                          disabled={isSelf || loadingRow === id}
                          onClick={()=>savePermissions(u)}
                          style={{ background: '#065f46', color: 'white', fontSize:12, padding:'6px 10px' }}
                          title="Lưu thay đổi chức năng"
                        >
                          {loadingRow === id ? 'Đang lưu...' : 'Lưu chức năng'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {message && (
            <div style={{
              marginTop: 16,
              padding: '12px 16px',
              background: '#ecfdf5',
              color: '#065f46',
              borderRadius: 8,
              border: '1px solid #a7f3d0',
              fontSize: 14
            }}>
              {message}
            </div>
          )}
        </Card>
      </main>
    </>
  );
}
