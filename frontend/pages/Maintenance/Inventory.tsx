import Header from '@components/Header';
import Card from '@components/Card';
import useSWR, { mutate } from 'swr';
import { maintenanceApi } from '@services/maintenance';
import { useEffect, useState } from 'react';
import { useTranslation } from '@hooks/useTranslation';

export default function InventoryPage(){
  const { t } = useTranslation();
  const [search, setSearch] = useState('');
  const [onlyLow, setOnlyLow] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const key = ['inventory', search, onlyLow ? 'low' : 'all'].join(':');
  const { data: items } = useSWR(key, async ()=> maintenanceApi.listInventory({ q: search || undefined, low: onlyLow }));
  const [msg, setMsg] = useState('');
  const [drafts, setDrafts] = useState<Record<string, { qty: number; rp: number; price: number }>>({});
  const [newItem, setNewItem] = useState({ name: '', uom: '', qty: 0, rp: 0, price: 0 });

  useEffect(()=>{
    const map: Record<string, { qty: number; rp: number; price: number }> = {};
    (items||[]).forEach((it:any)=>{ map[it.id] = { qty: it.qty_on_hand, rp: it.reorder_point, price: it.unit_price || 0 }; });
    setDrafts(map);
  }, [items]);

  const save = async (id: string) => {
    setMsg('');
    const d = drafts[id] ?? (()=>{
      const it = (items||[]).find((x:any)=>x.id===id);
      return { qty: it?.qty_on_hand ?? 0, rp: it?.reorder_point ?? 0, price: it?.unit_price ?? 0 };
    })();
    const payload = { qty_on_hand: Number(d.qty), reorder_point: Number(d.rp), unit_price: Number(d.price) };
    try{
      await maintenanceApi.updateInventory(id, payload);
      await mutate(key);
      setMsg(t('pages.maintenance.inventory.messages.updated'));
    }catch(e:any){ setMsg(e?.response?.data?.message || t('pages.maintenance.inventory.messages.updateError')); }
  };

  const addNewItem = async () => {
    if (!newItem.name || !newItem.uom) {
      setMsg(t('pages.maintenance.inventory.messages.pleaseEnterNameAndUnit'));
      return;
    }
    
    setMsg('');
    try {
      const payload = {
        name: newItem.name,
        uom: newItem.uom,
        qty_on_hand: Number(newItem.qty),
        reorder_point: Number(newItem.rp),
        unit_price: Number(newItem.price)
      };
      
      await maintenanceApi.createInventory(payload);
      await mutate(key);
      setNewItem({ name: '', uom: '', qty: 0, rp: 0, price: 0 });
      setShowAddForm(false);
      setMsg(t('pages.maintenance.inventory.messages.productAdded'));
    } catch(e:any) {
      setMsg(e?.response?.data?.message || t('pages.maintenance.inventory.messages.addProductError'));
    }
  };

  return (
    <>
      <Header />
      <main className="container depot-requests">
        <div className="page-header modern-header">
          <div className="header-content">
            <div className="header-left">
              <h1 className="page-title gradient gradient-ultimate">{t('pages.maintenance.inventory.title')}</h1>
            </div>
            <div className="header-actions">
            </div>
          </div>
        </div>

        <div className="search-filter-section modern-search">
          <div className="search-row">
            <div className="search-section">
              <div className="search-input-group">
                <span className="search-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="11" cy="11" r="8"></circle>
                    <path d="m21 21-4.35-4.35"></path>
                  </svg>
                </span>
                <input
                  type="text"
                  placeholder={t('pages.maintenance.inventory.searchPlaceholder')}
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="search-input"
                />
              </div>
            </div>
            <div className="filter-group">
              <button 
                className="btn btn-outline add-product-btn"
                onClick={() => setShowAddForm(!showAddForm)}
                title={showAddForm ? t('pages.maintenance.inventory.cancelAddProduct') : t('pages.maintenance.inventory.addNewProduct')}
              >
                {showAddForm ? '❌ ' + t('common.cancel') : '➕ ' + t('pages.maintenance.inventory.addProduct')}
              </button>
            </div>
            <div className="filter-group">
              <label className="filter-label">
                <input 
                  type="checkbox" 
                  checked={onlyLow} 
                  onChange={e => setOnlyLow(e.target.checked)}
                  style={{ marginRight: '8px' }}
                />
                {t('pages.maintenance.inventory.onlyShowLowStock')}
              </label>
            </div>
          </div>
        </div>

        <Card>
            
            {showAddForm && (
              <div style={{
                border: '1px solid #e5e7eb', 
                borderRadius: '8px', 
                padding: '16px', 
                marginBottom: '16px',
                backgroundColor: '#f9fafb'
              }}>
                <h4 style={{margin: '0 0 16px 0', color: '#1f2937'}}>{t('pages.maintenance.inventory.addNewProduct')}</h4>
                <div style={{display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr auto', gap: '12px', alignItems: 'end'}}>
                  <div>
                    <label style={{display: 'block', fontSize: '12px', marginBottom: '4px', color: '#6b7280'}}>{t('pages.maintenance.inventory.form.productName')}</label>
                    <input
                      type="text"
                      placeholder={t('pages.maintenance.inventory.form.productNamePlaceholder')}
                      value={newItem.name}
                      onChange={e => setNewItem(prev => ({ ...prev, name: e.target.value }))}
                      style={{width: '100%', padding: '8px', border: '1px solid #d1d5db', borderRadius: '4px'}}
                    />
                  </div>
                  <div>
                    <label style={{display: 'block', fontSize: '12px', marginBottom: '4px', color: '#6b7280'}}>{t('pages.maintenance.inventory.form.unitOfMeasurement')}</label>
                    <input
                      type="text"
                      placeholder={t('pages.maintenance.inventory.form.unitOfMeasurementPlaceholder')}
                      value={newItem.uom}
                      onChange={e => setNewItem(prev => ({ ...prev, uom: e.target.value }))}
                      style={{width: '100%', padding: '8px', border: '1px solid #d1d5db', borderRadius: '4px'}}
                    />
                  </div>
                  <div>
                    <label style={{display: 'block', fontSize: '12px', marginBottom: '4px', color: '#6b7280'}}>{t('pages.maintenance.inventory.form.stock')}</label>
                    <input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      placeholder="0"
                      value={String(newItem.qty)}
                      onChange={e => {
                        const cleaned = e.target.value.replace(/[^0-9]/g, '');
                        const next = cleaned === '' ? 0 : parseInt(cleaned, 10);
                        setNewItem(prev => ({ ...prev, qty: next }));
                      }}
                      style={{width: '100%', padding: '8px', border: '1px solid #d1d5db', borderRadius: '4px'}}
                    />
                  </div>
                  <div>
                    <label style={{display: 'block', fontSize: '12px', marginBottom: '4px', color: '#6b7280'}}>{t('pages.maintenance.inventory.form.reorderPoint')}</label>
                    <input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      placeholder="0"
                      value={String(newItem.rp)}
                      onChange={e => {
                        const cleaned = e.target.value.replace(/[^0-9]/g, '');
                        const next = cleaned === '' ? 0 : parseInt(cleaned, 10);
                        setNewItem(prev => ({ ...prev, rp: next }));
                      }}
                      style={{width: '100%', padding: '8px', border: '1px solid #d1d5db', borderRadius: '4px'}}
                    />
                  </div>
                  <div>
                    <label style={{display: 'block', fontSize: '12px', marginBottom: '4px', color: '#6b7280'}}>{t('pages.maintenance.inventory.form.unitPrice')}</label>
                    <input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      placeholder="0"
                      value={String(newItem.price)}
                      onChange={e => {
                        const cleaned = e.target.value.replace(/[^0-9]/g, '');
                        const next = cleaned === '' ? 0 : parseInt(cleaned, 10);
                        setNewItem(prev => ({ ...prev, price: next }));
                      }}
                      style={{width: '100%', padding: '8px', border: '1px solid #d1d5db', borderRadius: '4px'}}
                    />
                  </div>
                  <button 
                    className="btn" 
                    onClick={addNewItem}
                    style={{backgroundColor: '#059669', padding: '8px 16px'}}
                  >
                    {t('pages.maintenance.inventory.form.add')}
                  </button>
                </div>
              </div>
            )}
            
            <table className="table">
            <thead><tr>
              <th>{t('pages.maintenance.inventory.tableHeaders.name')}</th>
              <th>{t('pages.maintenance.inventory.tableHeaders.unitOfMeasurement')}</th>
              <th>{t('pages.maintenance.inventory.tableHeaders.stock')}</th>
              <th>{t('pages.maintenance.inventory.tableHeaders.reorderPoint')}</th>
              <th>{t('pages.maintenance.inventory.tableHeaders.unitPrice')}</th>
              <th>{t('pages.maintenance.inventory.tableHeaders.actions')}</th>
            </tr></thead>
            <tbody>
              {(items||[]).map((it:any)=>{
                const d = drafts[it.id] || { qty: it.qty_on_hand, rp: it.reorder_point, price: it.unit_price || 0 };
                const isLow = (d.qty <= d.rp);
                return (
                  <tr key={it.id} style={{background: isLow ? '#fff7ed' : undefined}}>
                    <td>{it.name}</td>
                    <td>{it.uom}</td>
                    <td>
                      <input
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        style={{width:90}}
                        value={String(d.qty)}
                        onChange={e=>setDrafts(prev=>{
                          const cur = prev[it.id] ?? { qty: it.qty_on_hand, rp: it.reorder_point, price: it.unit_price || 0 };
                          const cleaned = e.target.value.replace(/[^0-9]/g, '');
                          const next = cleaned === '' ? 0 : parseInt(cleaned, 10);
                          return { ...prev, [it.id]: { ...cur, qty: next } };
                        })}
                      />
                    </td>
                    <td>
                      <input
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        style={{width:90}}
                        value={String(d.rp)}
                        onChange={e=>setDrafts(prev=>{
                          const cur = prev[it.id] ?? { qty: it.qty_on_hand, rp: it.reorder_point, price: it.unit_price || 0 };
                          const cleaned = e.target.value.replace(/[^0-9]/g, '');
                          const next = cleaned === '' ? 0 : parseInt(cleaned, 10);
                          return { ...prev, [it.id]: { ...cur, rp: next } };
                        })}
                      />
                    </td>
                    <td>
                      <input
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        style={{width:120}}
                        value={String(d.price)}
                        onChange={e=>setDrafts(prev=>{
                          const cur = prev[it.id] ?? { qty: it.qty_on_hand, rp: it.reorder_point, price: it.unit_price || 0 };
                          const cleaned = e.target.value.replace(/[^0-9]/g, '');
                          const next = cleaned === '' ? 0 : parseInt(cleaned, 10);
                          return { ...prev, [it.id]: { ...cur, price: next } };
                        })}
                      />
                    </td>
                    <td><button className="btn" onClick={()=>save(it.id)}>{t('pages.maintenance.inventory.actions.save')}</button></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {msg && <div style={{fontSize:12, color:'#1e3a8a', marginTop:8}}>{msg}</div>}
        </Card>
      </main>
    </>
  );
}


