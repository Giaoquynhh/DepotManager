import Header from '@components/Header';
import useSWR, { mutate } from 'swr';
import { yardApi } from '@services/yard';
import { useMemo, useState, useCallback } from 'react';

import ModernYardMap from '@components/yard/ModernYardMap';
import KeyboardShortcuts from '@components/yard/KeyboardShortcuts';
import YardConfigurationModal from '@components/yard/YardConfigurationModal';
import Toast from '@components/common/Toast';
import { useTranslation } from '../../hooks/useTranslation';

// Dùng stack map mới
const fetcher = async () => yardApi.stackMap();

export default function YardPage() {
  const { data: map } = useSWR('yard_map', fetcher, {
    refreshInterval: 5000,
    revalidateOnFocus: false,
    dedupingInterval: 3000,
  });
  const [activeSlot, setActiveSlot] = useState<{ id: string; code: string } | null>(null);
  const [selectedSlotId, setSelectedSlotId] = useState<string>('');
  const [locating, setLocating] = useState(false);
  const [locateError, setLocateError] = useState('');
  const [locateSuccess, setLocateSuccess] = useState('');
  const [showConfigModal, setShowConfigModal] = useState(false);

  const { t } = useTranslation();
  
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
  const isLoading = map === undefined;
  const isEmpty = Array.isArray(transformedMap) && transformedMap.length === 0;

  const stats = useMemo(() => {
    if (!transformedMap) return { totalBlocks: 0, totalSlots: 0, totalOcc: 0, totalHold: 0 };
    const yard = transformedMap[0];
    let totalSlots = 0, totalOcc = 0, totalHold = 0;
    (yard?.blocks || []).forEach((b: any) => {
      totalSlots += (b?.slots || []).length;
      (b?.slots || []).forEach((s: any) => {
        totalOcc += s?.occupied_count || 0;
        totalHold += s?.hold_count || 0;
      });
    });
    return { totalBlocks: (yard?.blocks || []).length, totalSlots, totalOcc, totalHold };
  }, [transformedMap]);

  // 🎯 Enhanced search handler with modern features
  const handleModernSearch = useCallback(async (query: string) => {
    if (!query || query.length < 4) {
      setLocateError('Vui lòng nhập số container hợp lệ (>= 4 ký tự)');
      return;
    }
    
    try {
      setLocateError('');
      setLocateSuccess('');
      setLocating(true);
      const res = await yardApi.locate(query);
      const slotId = res?.slot_id || res?.slot?.id;
      const slotCode = res?.slot_code || res?.slot?.code || '';
      
      if (!slotId) {
        setLocateError('Không tìm thấy vị trí container');
        return;
      }
      
      setSelectedSlotId(String(slotId));
      setActiveSlot({ id: String(slotId), code: String(slotCode) });
      
      // 🎉 Success feedback
      setLocateSuccess(`Đã tìm thấy container ${query} tại vị trí ${slotCode}`);
      setTimeout(() => {
        const element = document.querySelector(`[data-slot-id="${slotId}"]`);
        if (element) {
          element.classList.add('search-success');
          setTimeout(() => element.classList.remove('search-success'), 2000);
        }
      }, 100);
      
    } catch (err: any) {
      setLocateError(err?.response?.data?.message || err?.message || 'Không tìm thấy vị trí container');
    } finally {
      setLocating(false);
    }
  }, []);

  // 🎯 Enhanced refresh handler
  const handleRefresh = useCallback(() => {
    mutate('yard_map');
    // 🎉 Refresh feedback
    const refreshBtn = document.querySelector('.yard-action-bubble');
    if (refreshBtn) {
      refreshBtn.classList.add('refresh-animation');
      setTimeout(() => refreshBtn.classList.remove('refresh-animation'), 1000);
    }
  }, []);

  // 🎯 Export handler
  const handleExport = useCallback(() => {
    // TODO: Implement export functionality
    console.log('Export yard data');
  }, []);

  // 🎯 Settings handler
  const handleSettings = useCallback(() => {
    setShowConfigModal(true);
  }, []);

  // 🎯 Handle configuration success
  const handleConfigSuccess = useCallback(() => {
    setShowConfigModal(false);
    // Refresh the yard data
    mutate('yard_map');
  }, []);

  return (
    <>
      <Header />
      <main className="container yard-page">
        {/* 🎯 Modern Page Header */}
        <div className="page-header modern-header">
          <div className="header-content">
            <div className="header-left">
              <h1 className="yard-title gradient-ultimate">{t('pages.yard.title')}</h1>
            </div>


          </div>
        </div>

        <div className="yard-layout">
          {/* 🎯 Modern Yard Design */}
          <div className="modern-yard-container">
            {isLoading && (
              <div className="yard-loading">
                <div className="yard-loading-spinner"></div>
              </div>
            )}
            
            {!isLoading && isEmpty && (
              <div className="yard-empty-state">
                <div className="yard-empty-icon">🏗️</div>
                <div className="yard-empty-title">Chưa có dữ liệu bãi</div>
                <div className="yard-empty-description">
                  Hãy tạo Yard/Block/Slot để hiển thị sơ đồ bãi hiện đại.
                </div>
              </div>
            )}
            
            {!isLoading && !isEmpty && transformedMap && transformedMap[0] && (
              <ModernYardMap
                yard={transformedMap[0]}
                onSlotClick={(slot) => { 
                  setSelectedSlotId(slot.id); 
                  setActiveSlot({ id: slot.id, code: slot.code }); 
                }}
                suggestedSlots={[]}
                selectedSlotId={selectedSlotId}
                onSearch={handleModernSearch}
                onRefresh={handleRefresh}
                onExport={handleExport}
                onSettings={handleSettings}
              />
            )}
            

          </div>
        </div>


        {/* ⌨️ Keyboard Shortcuts */}
        <KeyboardShortcuts
          onRefresh={handleRefresh}
          onSearch={() => {
            const searchInput = document.querySelector('.smart-search-input') as HTMLInputElement;
            if (searchInput) {
              searchInput.focus();
            }
          }}
          onExport={handleExport}
          onSettings={handleSettings}
          onToggleHeatmap={() => {
            // TODO: Implement heatmap toggle
            console.log('Toggle heatmap');
          }}
          onToggleDesign={() => {}}
          enabled={true}
        />

        {/* ⚙️ Yard Configuration Modal */}
        <YardConfigurationModal
          visible={showConfigModal}
          onCancel={() => setShowConfigModal(false)}
          onSuccess={handleConfigSuccess}
        />

        {/* 🍞 Toast Notifications */}
        <Toast
          message={locateError}
          type="error"
          visible={!!locateError}
          onClose={() => setLocateError('')}
          duration={6000}
        />
        <Toast
          message={locateSuccess}
          type="success"
          visible={!!locateSuccess}
          onClose={() => setLocateSuccess('')}
          duration={4000}
        />
      </main>
    </>
  );
}


