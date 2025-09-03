import React, { useEffect, useState, useCallback } from 'react';
import SmartSearch from './SmartSearch';

interface Slot {
  id: string;
  code: string;
  status: 'EMPTY' | 'RESERVED' | 'OCCUPIED' | 'UNDER_MAINTENANCE' | 'EXPORT';
  isSuggested?: boolean;
  isSelected?: boolean;
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

interface ModernYardMapProps {
  yard: Yard;
  onSlotClick?: (slot: Slot) => void;
  suggestedSlots?: string[];
  selectedSlotId?: string;
  onSearch?: (query: string) => void;
  onRefresh?: () => void;
  onExport?: () => void;
  onSettings?: () => void;
}

export default function ModernYardMap({ 
  yard, 
  onSlotClick, 
  suggestedSlots = [], 
  selectedSlotId,
  onSearch,
  onRefresh,
  onExport,
  onSettings
}: ModernYardMapProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [heatmapMode, setHeatmapMode] = useState(false);
  const [showTooltip, setShowTooltip] = useState<{ slot: Slot; x: number; y: number } | null>(null);
  const [tooltipDelay, setTooltipDelay] = useState<NodeJS.Timeout | null>(null);

  // 🎯 Auto-scroll to selected slot
  useEffect(() => {
    if (!selectedSlotId) return;
    const element = document.querySelector(`[data-slot-id="${selectedSlotId}"]`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
    }
  }, [selectedSlotId]);

  // 🧹 Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (tooltipDelay) {
        clearTimeout(tooltipDelay);
      }
    };
  }, [tooltipDelay]);

  // 🎯 Click outside to hide tooltip
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      // Only hide tooltip if clicking outside of slots and tooltip, and not on close button
      if (!target.closest('.yard-slot-tile') && 
          !target.closest('.yard-tooltip') && 
          !target.closest('.tooltip-close')) {
        setShowTooltip(null);
      }
    };

    if (showTooltip) {
      // Use click instead of mousedown to avoid immediate hiding
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [showTooltip]);



  // 🎨 Get slot styling based on status
  const getSlotStatus = (slot: Slot) => {
    if (slot.isSelected) return 'selected';
    if (slot.isSuggested) return 'suggested';
    if ((slot.occupied_count || 0) > 0) return 'occupied';
    if ((slot.hold_count || 0) > 0) return 'hold';
    return slot.status.toLowerCase();
  };

  // 🎭 Get slot tooltip content
  const getSlotTooltip = (slot: Slot) => {
    const statusMap = {
      'EMPTY': 'Trống',
      'RESERVED': 'Đã đặt (Hold)',
      'OCCUPIED': 'Đã chiếm',
      'UNDER_MAINTENANCE': 'Bảo trì',
      'EXPORT': 'Xuất khẩu'
    };
    
    const occ = slot.occupied_count || 0;
    const hold = slot.hold_count || 0;
    const status = statusMap[slot.status] || slot.status;
    
    return {
      code: slot.code,
      status,
      occupied: occ,
      hold: hold,
      details: occ > 0 ? `${occ} container(s)` : hold > 0 ? `${hold} hold(s)` : 'Sẵn sàng'
    };
  };

  // 🎯 Handle slot click with animation
  const handleSlotClick = useCallback((slot: Slot) => {
    // Hide tooltip when clicking on slot
    setShowTooltip(null);
    
    if (onSlotClick) {
      // Add click animation
      const element = document.querySelector(`[data-slot-id="${slot.id}"]`);
      if (element) {
        element.classList.add('clicked');
        setTimeout(() => element.classList.remove('clicked'), 300);
      }
      onSlotClick(slot);
    }
  }, [onSlotClick]);

  // 🔍 Handle search with debouncing
  const handleSearch = useCallback(async (query: string) => {
    setSearchQuery(query);
    if (query.length >= 3 && onSearch) {
      setIsSearching(true);
      try {
        await onSearch(query);
      } finally {
        setIsSearching(false);
      }
    }
  }, [onSearch]);

  // 🎭 Handle mouse events for tooltip
  const handleSlotMouseEnter = (slot: Slot, event: React.MouseEvent) => {
    // Clear any existing delay
    if (tooltipDelay) {
      clearTimeout(tooltipDelay);
      setTooltipDelay(null);
    }
    
    const rect = event.currentTarget.getBoundingClientRect();
    const scrollX = window.pageXOffset || document.documentElement.scrollLeft;
    const scrollY = window.pageYOffset || document.documentElement.scrollTop;
    
    // Show tooltip immediately when hovering over a slot
    setShowTooltip({
      slot,
      x: rect.left + rect.width / 2 + scrollX,
      y: rect.top - 10 + scrollY
    });
  };

  const handleSlotMouseLeave = () => {
    // Keep tooltip visible - no auto-hide
    // Tooltip will only hide when hovering over another slot or clicking outside
  };

  // 📊 Calculate block statistics
  const getBlockStats = (block: Block) => {
    const totalSlots = block.slots.length;
    const occupiedSlots = block.slots.filter(s => (s.occupied_count || 0) > 0).length;
    const holdSlots = block.slots.filter(s => (s.hold_count || 0) > 0).length;
    const emptySlots = totalSlots - occupiedSlots - holdSlots;
    const utilization = totalSlots > 0 ? Math.round((occupiedSlots / totalSlots) * 100) : 0;

    return {
      total: totalSlots,
      occupied: occupiedSlots,
      hold: holdSlots,
      empty: emptySlots,
      utilization
    };
  };

  // 🎨 Get heatmap intensity for slot
  const getHeatmapIntensity = (slot: Slot) => {
    const occ = slot.occupied_count || 0;
    const hold = slot.hold_count || 0;
    const total = occ + hold;
    
    if (total === 0) return 0;
    if (total <= 2) return 1;
    if (total <= 4) return 2;
    return 3;
  };

  return (
    <div className="modern-yard-container">
      {/* 🎯 Floating Search Portal with Smart Search - Under Header */}
      <div className="yard-search-portal">
        <div className="yard-search-container">
          <div className="search-header">
            <h3 className="search-title">🔍 Tìm kiếm Container Thông Minh</h3>
            <div className="search-input-wrapper">
              <SmartSearch
                onSearch={handleSearch}
                placeholder="Nhập số container để định vị (VD: ABCU1234567)"
                className="modern-search"
                disabled={isSearching}
              />
            </div>
          </div>
        </div>
      </div>

      {/* 📊 Quick Stats Bar */}
      <div className="yard-stats-bar">
        <div className="yard-stat-card">
          <div className="yard-stat-icon">🏗️</div>
          <div className="yard-stat-content">
            <div className="yard-stat-value">{yard.blocks.length}</div>
            <div className="yard-stat-label">Blocks</div>
          </div>
        </div>
        
        <div className="yard-stat-card">
          <div className="yard-stat-icon">📦</div>
          <div className="yard-stat-content">
            <div className="yard-stat-value">
              {yard.blocks.reduce((sum, block) => sum + block.slots.length, 0)}
            </div>
            <div className="yard-stat-label">Total Slots</div>
          </div>
        </div>
        
        <div className="yard-stat-card">
          <div className="yard-stat-icon">✅</div>
          <div className="yard-stat-content">
            <div className="yard-stat-value">
              {yard.blocks.reduce((sum, block) => 
                sum + block.slots.reduce((s, slot) => s + (slot.occupied_count || 0), 0), 0
              )}
            </div>
            <div className="yard-stat-label">Occupied</div>
          </div>
        </div>
        
        <div className="yard-stat-card">
          <div className="yard-stat-icon">⏳</div>
          <div className="yard-stat-content">
            <div className="yard-stat-value">
              {yard.blocks.reduce((sum, block) => 
                sum + block.slots.reduce((s, slot) => s + (slot.hold_count || 0), 0), 0
              )}
            </div>
            <div className="yard-stat-label">Hold</div>
          </div>
        </div>
      </div>

      {/* 🏗️ Dynamic Block Cards */}
      <div className="yard-blocks-container">
        {yard.blocks.map((block) => {
          const stats = getBlockStats(block);
          
          return (
            <div key={block.id} className="yard-block-card">
              <div className="block-header">
                <div className="block-title-section">
                  <h3 className="block-title">{block.code}</h3>
                  <div className="block-subtitle">
                    {stats.total} slots • {stats.utilization}% utilized
                  </div>
                </div>
                
                <div className="block-stats">
                  <div className="block-stat">
                    <span className="stat-value">{stats.occupied}</span>
                    <span className="stat-label">Occupied</span>
                  </div>
                  <div className="block-stat">
                    <span className="stat-value">{stats.hold}</span>
                    <span className="stat-label">Hold</span>
                  </div>
                  <div className="block-stat">
                    <span className="stat-value">{stats.empty}</span>
                    <span className="stat-label">Empty</span>
                  </div>
                </div>
              </div>

              {/* 🎯 Interactive Container Grid */}
              <div className="yard-slot-grid">
                {block.slots.map((slot) => {
                  const status = getSlotStatus(slot);
                  const isSuggested = suggestedSlots.includes(slot.id);
                  const isSelected = slot.id === selectedSlotId;
                  const heatmapIntensity = getHeatmapIntensity(slot);
                  
                  return (
                    <div
                      key={slot.id}
                      className={`yard-slot-tile status-${status} ${isSuggested ? 'suggested' : ''} ${isSelected ? 'selected' : ''} ${heatmapMode ? `heatmap-${heatmapIntensity}` : ''}`}
                      data-slot-id={slot.id}
                      onClick={() => handleSlotClick(slot)}
                      onMouseEnter={(e) => handleSlotMouseEnter(slot, e)}
                      onMouseLeave={handleSlotMouseLeave}
                      title={`${slot.code} - ${getSlotTooltip(slot).status}`}
                    >
                      {/* Slot content */}
                      <div className="slot-content">
                        {slot.status === 'UNDER_MAINTENANCE' && (
                          <span className="maintenance-icon">🔧</span>
                        )}
                        
                        {(slot.occupied_count || slot.hold_count) && (
                          <div className="slot-counters">
                            {slot.occupied_count && slot.occupied_count > 0 && (
                              <span className="counter occupied">O:{slot.occupied_count}</span>
                            )}
                            {slot.hold_count && slot.hold_count > 0 && (
                              <span className="counter hold">H:{slot.hold_count}</span>
                            )}
                          </div>
                        )}
                        
                        {isSuggested && (
                          <span className="suggestion-badge">💡</span>
                        )}
                        
                        {isSelected && (
                          <span className="selection-badge">✓</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* 🎪 Action Bubbles */}
      <div className="yard-action-bubbles">
        <button 
          className="yard-action-bubble"
          onClick={onRefresh}
          title="Làm mới dữ liệu"
        >
          🔄
        </button>
        <button 
          className="yard-action-bubble"
          onClick={onExport}
          title="Xuất báo cáo"
        >
          📤
        </button>
        <button 
          className="yard-action-bubble"
          onClick={onSettings}
          title="Cài đặt"
        >
          ⚙️
        </button>
      </div>

      {/* 🎭 Enhanced Tooltip */}
      {showTooltip && (
        <div 
          className="yard-tooltip"
          style={{
            position: 'fixed',
            left: showTooltip.x,
            top: showTooltip.y,
            transform: 'translateX(-50%)',
            zIndex: 1002
          }}
          onMouseEnter={() => {
            // Keep tooltip visible when hovering over it
          }}
          onMouseLeave={() => {
            // Keep tooltip visible - no auto-hide
          }}
        >
          <div className="tooltip-content">
            <div className="tooltip-header">
              <span className="tooltip-code">{showTooltip.slot.code}</span>
              <span className="tooltip-status">{getSlotTooltip(showTooltip.slot).status}</span>
              <button 
                className="tooltip-close"
                onClick={() => setShowTooltip(null)}
                title="Đóng"
              >
                ×
              </button>
            </div>
            <div className="tooltip-details">
              <div className="tooltip-detail">
                <span className="detail-label">Occupied:</span>
                <span className="detail-value">{getSlotTooltip(showTooltip.slot).occupied}</span>
              </div>
              <div className="tooltip-detail">
                <span className="detail-label">Hold:</span>
                <span className="detail-value">{getSlotTooltip(showTooltip.slot).hold}</span>
              </div>
              <div className="tooltip-detail">
                <span className="detail-label">Status:</span>
                <span className="detail-value">{getSlotTooltip(showTooltip.slot).details}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 🎨 Status Legend */}
      <div className="yard-legend">
        <div className="legend-title">Trạng thái Slot</div>
        <div className="legend-items">
          <div className="legend-item">
            <div className="legend-color status-empty"></div>
            <span>Trống</span>
          </div>
          <div className="legend-item">
            <div className="legend-color status-hold"></div>
            <span>Hold (Đã đặt)</span>
          </div>
          <div className="legend-item">
            <div className="legend-color status-suggested"></div>
            <span>Gợi ý</span>
          </div>
          <div className="legend-item">
            <div className="legend-color status-selected"></div>
            <span>Đã chọn</span>
          </div>
          <div className="legend-item">
            <div className="legend-color status-occupied"></div>
            <span>Đã chiếm</span>
          </div>
          <div className="legend-item">
            <div className="legend-color status-maintenance"></div>
            <span>Bảo trì</span>
          </div>
        </div>
      </div>
    </div>
  );
}
