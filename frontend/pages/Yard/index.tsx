import Header from '@components/Header';
import Card from '@components/Card';
import useSWR, { mutate } from 'swr';
import { yardApi } from '@services/yard';
import { useState } from 'react';
import { YardMap, StackDetailsModal } from '@components/yard';

// Dùng stack map mới
const fetcher = async () => yardApi.stackMap();

export default function YardPage() {
  const { data: map } = useSWR('yard_map', fetcher, { refreshInterval: 5000 });
  const [activeSlot, setActiveSlot] = useState<{ id: string; code: string } | null>(null);
  const [selectedSlotId, setSelectedSlotId] = useState<string>('');
  const [searchContainer, setSearchContainer] = useState('');
  const [locating, setLocating] = useState(false);
  const [locateError, setLocateError] = useState('');
  
  // UI mới: chỉ hiển thị bản đồ bãi từ stack map

  // Transform data cho YardMap component
  const transformMapData = (mapData: any) => {
    if (!mapData) return null;
    
    return mapData.map((yard: any) => ({
      ...yard,
      blocks: yard.blocks.map((block: any) => ({
        ...block,
        slots: block.slots.map((slot: any) => {
          const baseStatus = slot.status as string | undefined;
          let status = 'EMPTY';
          if (baseStatus === 'UNDER_MAINTENANCE' || baseStatus === 'EXPORT') {
            status = baseStatus as any;
          } else if (slot.occupied_count && slot.occupied_count > 0) {
            status = 'OCCUPIED';
          } else if (slot.hold_count && slot.hold_count > 0) {
            status = 'RESERVED';
          } else {
            status = 'EMPTY';
          }
          return {
            ...slot,
            status,
            isSuggested: false,
            isSelected: false
          };
        })
      }))
    }));
  };

  const transformedMap = transformMapData(map);

  return (
    <>
      <Header />
      <main className="container">
        <div className="page-header">
          <div className="page-header-content">
            <h1 className="page-title">Quản lý Bãi Container</h1>
            <p className="page-subtitle">Sơ đồ bãi và tìm kiếm thông tin container</p>
          </div>
        </div>

        <div className="yard-layout">
          {/* Left Column - Yard Map */}
          <div className="yard-left">
            <Card title="Sơ đồ bãi">
              {/* Locate Container */}
              <div style={{ display: 'flex', gap: 8, marginBottom: 12, alignItems: 'center' }}>
                <input
                  placeholder="Nhập số container để định vị (VD: ABCU1234567)"
                  value={searchContainer}
                  onChange={(e) => setSearchContainer(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') {
                    (async () => {
                      const v = searchContainer.trim();
                      if (!v || v.length < 4) { setLocateError('Vui lòng nhập số container hợp lệ (>= 4 ký tự)'); return; }
                      try {
                        setLocateError(''); setLocating(true);
                        const res = await yardApi.locate(v);
                        const slotId = res?.slot_id || res?.slot?.id;
                        const slotCode = res?.slot_code || res?.slot?.code || '';
                        if (!slotId) { setLocateError('Không tìm thấy vị trí container'); return; }
                        setSelectedSlotId(String(slotId));
                        setActiveSlot({ id: String(slotId), code: String(slotCode) });
                      } catch (err: any) {
                        setLocateError(err?.response?.data?.message || err?.message || 'Không tìm thấy vị trí container');
                      } finally { setLocating(false); }
                    })();
                  }}}
                  style={{ flex: 1 }}
                />
                <button
                  className="btn btn-primary"
                  disabled={locating}
                  onClick={async () => {
                    const v = searchContainer.trim();
                    if (!v || v.length < 4) { setLocateError('Vui lòng nhập số container hợp lệ (>= 4 ký tự)'); return; }
                    try {
                      setLocateError(''); setLocating(true);
                      const res = await yardApi.locate(v);
                      const slotId = res?.slot_id || res?.slot?.id;
                      const slotCode = res?.slot_code || res?.slot?.code || '';
                      if (!slotId) { setLocateError('Không tìm thấy vị trí container'); return; }
                      setSelectedSlotId(String(slotId));
                      setActiveSlot({ id: String(slotId), code: String(slotCode) });
                    } catch (err: any) {
                      setLocateError(err?.response?.data?.message || err?.message || 'Không tìm thấy vị trí container');
                    } finally { setLocating(false); }
                  }}
                >
                  🔎 Locate
                </button>
                {selectedSlotId && (
                  <button className="btn btn-secondary" onClick={() => { setSelectedSlotId(''); }}>
                    Bỏ chọn
                  </button>
                )}
              </div>
              {locateError && (
                <div className="message-banner error" style={{ marginBottom: 12 }}>
                  <p>{locateError}</p>
                  <button className="close-btn" onClick={() => setLocateError('')}>×</button>
                </div>
              )}
              {!transformedMap && <div>Đang tải…</div>}
              {transformedMap && (
                <YardMap
                  yard={transformedMap[0]}
                  onSlotClick={(slot) => { setSelectedSlotId(slot.id); setActiveSlot({ id: slot.id, code: slot.code }); }}
                  suggestedSlots={[]}
                  selectedSlotId={selectedSlotId}
                />
              )}
            </Card>
          </div>
        </div>
        {/* Modal chi tiết Stack */}
        {activeSlot && (
          <StackDetailsModal
            visible={!!activeSlot}
            slotId={activeSlot.id}
            slotCode={activeSlot.code}
            onCancel={() => setActiveSlot(null)}
            onActionDone={() => mutate('yard_map')}
          />
        )}
      </main>
    </>
  );
}


