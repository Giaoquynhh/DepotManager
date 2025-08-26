import React from 'react';

interface Slot {
  id: string;
  code: string;
  status: 'EMPTY' | 'RESERVED' | 'OCCUPIED' | 'UNDER_MAINTENANCE' | 'EXPORT';
  isSuggested?: boolean;
  isSelected?: boolean;
  // Thuộc tính mới từ stack map
  occupied_count?: number;
  hold_count?: number;
}

interface Block {
  id: string;
  code: string;
  slots: Slot[];
}

interface Yard {
  id: string;
  name: string;
  blocks: Block[];
}

interface YardMapProps {
  yard: Yard;
  onSlotClick?: (slot: Slot) => void;
  suggestedSlots?: string[];
  selectedSlotId?: string;
}

export default function YardMap({ yard, onSlotClick, suggestedSlots = [], selectedSlotId }: YardMapProps) {
  const getSlotColor = (slot: Slot) => {
    if (slot.isSelected) return '#3b82f6'; // Xanh dương đậm cho slot được chọn
    if (slot.isSuggested) return '#93c5fd'; // Xanh dương nhạt cho slot gợi ý
    
    // Ưu tiên hiển thị theo số lượng stack nếu có dữ liệu
    if ((slot.occupied_count || 0) > 0) return '#94a3b8'; // Xám đậm khi có OCCUPIED trong stack
    if ((slot.hold_count || 0) > 0) return '#fde68a'; // Vàng khi có HOLD trong stack

    switch (slot.status) {
      case 'EMPTY': return '#e2e8f0'; // Xám nhạt cho slot trống
      case 'RESERVED': return '#fde68a'; // Vàng cho slot đã đặt
      case 'OCCUPIED': return '#94a3b8'; // Xám đậm cho slot đã chiếm
      case 'UNDER_MAINTENANCE': return '#fdba74'; // Cam cho slot bảo trì
      case 'EXPORT': return '#d1fae5'; // Xanh lá cho slot xuất khẩu
      default: return '#e2e8f0';
    }
  };

  const getSlotBorder = (slot: Slot) => {
    if (slot.isSelected) return '3px solid #1d4ed8';
    if (slot.isSuggested) return '2px solid #3b82f6';
    return '1px solid #cbd5e1';
  };

  const getSlotTooltip = (slot: Slot) => {
    const statusMap = {
      'EMPTY': 'Trống',
      'RESERVED': 'Đã đặt',
      'OCCUPIED': 'Đã chiếm',
      'UNDER_MAINTENANCE': 'Bảo trì',
      'EXPORT': 'Xuất khẩu'
    };
    const occ = slot.occupied_count || 0;
    const hold = slot.hold_count || 0;
    return `${slot.code} - ${statusMap[slot.status]} | O:${occ} H:${hold}`;
  };

  const handleSlotClick = (slot: Slot) => {
    if (onSlotClick) {
      onSlotClick(slot);
    }
  };

  return (
    <div className="yard-map">
      <div className="yard-header">
        <h3 className="yard-name">{yard.name}</h3>
      </div>
      
      <div className="yard-blocks">
        {yard.blocks.map((block) => (
          <div key={block.id} className="yard-block">
            <div className="block-header">
              <span className="block-code">{block.code}</span>
            </div>
            <div className="block-slots">
              {block.slots.map((slot) => {
                const isSuggested = suggestedSlots.includes(slot.id);
                const isSelected = slot.id === selectedSlotId;
                
                return (
                  <div
                    key={slot.id}
                    className={`yard-slot ${slot.status.toLowerCase()} ${isSuggested ? 'suggested' : ''} ${isSelected ? 'selected' : ''}`}
                    style={{
                      backgroundColor: getSlotColor({ ...slot, isSuggested, isSelected }),
                      border: getSlotBorder({ ...slot, isSuggested, isSelected }),
                    }}
                    title={getSlotTooltip(slot)}
                    onClick={() => handleSlotClick(slot)}
                  >
                    {slot.status === 'UNDER_MAINTENANCE' && (
                      <span className="maintenance-icon" title="Bảo trì">🔧</span>
                    )}
                    {isSuggested && (
                      <span className="suggested-label">Suggested</span>
                    )}
                    {isSelected && (
                      <span className="selected-label">Selected</span>
                    )}
                    {(slot.occupied_count || slot.hold_count) && (
                      <div style={{ position: 'absolute', right: 4, bottom: 4, display: 'flex', gap: 4 }}>
                        {!!slot.occupied_count && (
                          <span style={{ background: '#64748b', color: '#fff', padding: '0 4px', borderRadius: 4, fontSize: 10 }}
                                title="Occupied count">O:{slot.occupied_count}</span>
                        )}
                        {!!slot.hold_count && (
                          <span style={{ background: '#f59e0b', color: '#111827', padding: '0 4px', borderRadius: 4, fontSize: 10 }}
                                title="Hold count">H:{slot.hold_count}</span>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
      
      <div className="yard-legend">
        <div className="legend-item">
          <div className="legend-color" style={{ backgroundColor: '#e2e8f0' }}></div>
          <span>Trống</span>
        </div>
        <div className="legend-item">
          <div className="legend-color" style={{ backgroundColor: '#fde68a' }}></div>
          <span>Hold (Đã đặt)</span>
        </div>
        <div className="legend-item">
          <div className="legend-color" style={{ backgroundColor: '#93c5fd' }}></div>
          <span>Gợi ý</span>
        </div>
        <div className="legend-item">
          <div className="legend-color" style={{ backgroundColor: '#3b82f6' }}></div>
          <span>Đã chọn</span>
        </div>
        <div className="legend-item">
          <div className="legend-color" style={{ backgroundColor: '#94a3b8' }}></div>
          <span>Đã chiếm</span>
        </div>
        <div className="legend-item">
          <div className="legend-color" style={{ backgroundColor: '#fdba74' }}></div>
          <span>Bảo trì</span>
        </div>
      </div>
    </div>
  );
}
