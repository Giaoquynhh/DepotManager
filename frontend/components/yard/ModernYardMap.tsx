import React, { useEffect, useState, useCallback } from 'react';
import SmartSearch from './SmartSearch';
import { FuturisticStackDetailsModal } from './FuturisticStackDetailsModal';
import YardConfigurationModal from './YardConfigurationModal';
import { useTranslation } from '../../hooks/useTranslation';

interface Slot {
  id: string;
  code: string;
  status: 'EMPTY' | 'RESERVED' | 'OCCUPIED' | 'UNDER_MAINTENANCE' | 'EXPORT';
  isSuggested?: boolean;
  isSelected?: boolean;
  occupied_count?: number;
  hold_count?: number;
  tier_capacity?: number;
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
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [heatmapMode, setHeatmapMode] = useState(false);
  const [showTooltip, setShowTooltip] = useState<{ slot: Slot; x: number; y: number } | null>(null);
  const [selectedSlotForModal, setSelectedSlotForModal] = useState<string | null>(null);
  const [showConfigModal, setShowConfigModal] = useState(false);

  // 🎯 Auto-scroll to selected slot (disabled when modal is open)
  useEffect(() => {
    if (!selectedSlotId) return;
    // Kiểm tra xem modal có đang mở không
    const isModalOpen = document.body.classList.contains('modal-open');
    if (isModalOpen) return; // Không scroll khi modal mở
    
    const element = document.querySelector(`[data-slot-id="${selectedSlotId}"]`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
    }
  }, [selectedSlotId]);



  // 🎯 Click outside to hide tooltip
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      // Only hide tooltip if clicking outside of slots and tooltip
      if (!target.closest('.yard-slot-tile') && 
          !target.closest('.yard-tooltip')) {
        setShowTooltip(null);
      }
    };

    if (showTooltip) {
      // Use mousedown to ensure it only triggers on actual clicks, not hover
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
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
      'EMPTY': t('pages.yard.slotStatus.empty'),
      'RESERVED': t('pages.yard.slotStatus.hold'),
      'OCCUPIED': t('pages.yard.slotStatus.occupied'),
      'UNDER_MAINTENANCE': t('pages.yard.slotStatus.under_maintenance'),
      'EXPORT': t('pages.yard.slotStatus.occupied')
    };
    
    const occ = slot.occupied_count || 0;
    const hold = slot.hold_count || 0;
    const status = statusMap[slot.status] || slot.status;
    
    return {
      code: slot.code,
      status,
      occupied: occ,
      hold: hold,
      details: occ > 0 ? `${occ} ${t('pages.yard.stackDetails.containers').toLowerCase()}` : hold > 0 ? `${hold} ${t('pages.yard.blockStats.hold').toLowerCase()}` : t('pages.yard.slotStatus.empty')
    };
  };

  // 🎯 Handle slot click with animation
  const handleSlotClick = useCallback((slot: Slot) => {
    // Hide tooltip when clicking on slot
    setShowTooltip(null);
    
    // Add click animation
    const element = document.querySelector(`[data-slot-id="${slot.id}"]`);
    if (element) {
      element.classList.add('clicked');
      setTimeout(() => element.classList.remove('clicked'), 300);
    }
    
    // Open futuristic modal
    setSelectedSlotForModal(slot.id);
    
    // Call parent handler
    if (onSlotClick) {
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
    const rect = event.currentTarget.getBoundingClientRect();
    const scrollX = window.pageXOffset || document.documentElement.scrollLeft;
    const scrollY = window.pageYOffset || document.documentElement.scrollTop;
    
    // Calculate tooltip position with smart positioning
    let x = rect.left + rect.width / 2 + scrollX;
    let y = rect.bottom + 10 + scrollY; // Position below the slot
    
    // Adjust position if tooltip would go off screen
    const tooltipWidth = 200; // Approximate tooltip width
    const tooltipHeight = 120; // Approximate tooltip height
    
    if (x - tooltipWidth / 2 < 10) {
      x = rect.left + scrollX + 10;
    } else if (x + tooltipWidth / 2 > window.innerWidth - 10) {
      x = rect.right + scrollX - 10;
    }
    
    // If tooltip would go off bottom of screen, show it above the slot
    if (y + tooltipHeight > window.innerHeight - 10) {
      y = rect.top - tooltipHeight - 10 + scrollY;
    }
    
    // Show tooltip immediately when hovering over a slot
    setShowTooltip({
      slot,
      x,
      y
    });
  };

  const handleSlotMouseLeave = () => {
    // Hide tooltip when mouse leaves the slot
    setShowTooltip(null);
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
      {/* 🎯 Simplified Search Portal */}
      <div className="yard-search-portal">
        <div className="yard-search-container">
          <SmartSearch
            onSearch={handleSearch}
            placeholder="Tìm kiếm container..."
            className="modern-search"
            disabled={isSearching}
          />
        </div>
      </div>

      {/* 🎨 Status Legend */}
      <div className="yard-legend">
        <div className="legend-items">
          <div className="legend-item legend-title-item">
            <span className="legend-title-text">{t('pages.yard.stackDetails.status')} {t('pages.yard.stackDetails.slot')}</span>
          </div>
          <div className="legend-item">
            <div className="legend-color status-empty"></div>
            <span>{t('pages.yard.slotStatus.empty')}</span>
          </div>
          <div className="legend-item">
            <div className="legend-color status-hold"></div>
            <span>{t('pages.yard.slotStatus.hold')}</span>
          </div>
          <div className="legend-item">
            <div className="legend-color status-suggested"></div>
            <span>{t('pages.yard.slotStatus.suggested')}</span>
          </div>
          <div className="legend-item">
            <div className="legend-color status-selected"></div>
            <span>{t('pages.yard.slotStatus.selected')}</span>
          </div>
          <div className="legend-item">
            <div className="legend-color status-occupied"></div>
            <span>{t('pages.yard.slotStatus.occupied')}</span>
          </div>
          <div className="legend-item">
            <div className="legend-color status-maintenance"></div>
            <span>{t('pages.yard.slotStatus.under_maintenance')}</span>
          </div>
        </div>
      </div>

      {/* 📊 Quick Stats Bar */}
      <div className="yard-stats-bar">
        <div className="yard-stat-card">
          <div className="yard-stat-icon">🏗️</div>
          <div className="yard-stat-content">
            <div className="yard-stat-value">{yard.blocks.length}</div>
            <div className="yard-stat-label">{t('pages.yard.blockStats.blocks')}</div>
          </div>
        </div>
        
        <div className="yard-stat-card">
          <div className="yard-stat-icon">📦</div>
          <div className="yard-stat-content">
            <div className="yard-stat-value">
              {yard.blocks.reduce((sum, block) => sum + block.slots.length, 0)}
            </div>
            <div className="yard-stat-label">{t('pages.yard.blockStats.totalSlots')}</div>
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
            <div className="yard-stat-label">{t('pages.yard.blockStats.occupied')}</div>
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
            <div className="yard-stat-label">{t('pages.yard.blockStats.hold')}</div>
          </div>
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
                    {stats.total} {t('pages.yard.blockStats.slots')} • {stats.utilization}% {t('pages.yard.blockStats.utilized')}
                  </div>
                </div>
                
                <div className="block-stats">
                  <div className="block-stat">
                    <span className="stat-value">{stats.occupied}</span>
                    <span className="stat-label">{t('pages.yard.blockStats.occupied')}</span>
                  </div>
                  <div className="block-stat">
                    <span className="stat-value">{stats.hold}</span>
                    <span className="stat-label">{t('pages.yard.blockStats.hold')}</span>
                  </div>
                  <div className="block-stat">
                    <span className="stat-value">{stats.empty}</span>
                    <span className="stat-label">{t('pages.yard.blockStats.empty')}</span>
                  </div>
                </div>
              </div>

              {/* 🎯 Interactive Container Grid */}
              <div className="yard-slot-grid">
                {block.slots
                  .sort((a, b) => {
                    // Sắp xếp theo thứ tự slot code (B1-1, B1-2, B1-3, ...)
                    const aNum = parseInt(a.code.split('-')[1]) || 0;
                    const bNum = parseInt(b.code.split('-')[1]) || 0;
                    return aNum - bNum;
                  })
                  .map((slot) => {
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
                        {/* Slot position code */}
                        <div className="slot-code">{slot.code}</div>
                        
                        {slot.status === 'UNDER_MAINTENANCE' && (
                          <span className="maintenance-icon">🔧</span>
                        )}
                        
                        {/* Hiển thị số container thực tế */}
                        <div className="slot-counters">
                          <div className="slot-count-display">
                            <div className="count-main">
                              {slot.occupied_count || 0}
                            </div>
                          </div>
                        </div>
                        
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


      {/* 🎭 Enhanced Tooltip */}
      {showTooltip && (
        <div 
          className="yard-tooltip show"
          style={{
            position: 'fixed',
            left: showTooltip.x,
            top: showTooltip.y,
            transform: 'translateX(-50%)',
            zIndex: 1002,
            pointerEvents: 'none'
          }}
        >
          <div className="tooltip-content">
            <div className="tooltip-header">
              <span className="tooltip-code">{showTooltip.slot.code}</span>
              <span className="tooltip-status">{getSlotTooltip(showTooltip.slot).status}</span>
            </div>
            <div className="tooltip-details">
              <div className="tooltip-detail">
                <span className="detail-label">{t('pages.yard.blockStats.occupied')}:</span>
                <span className="detail-value">{getSlotTooltip(showTooltip.slot).occupied}</span>
              </div>
              <div className="tooltip-detail">
                <span className="detail-label">{t('pages.yard.blockStats.hold')}:</span>
                <span className="detail-value">{getSlotTooltip(showTooltip.slot).hold}</span>
              </div>
              <div className="tooltip-detail">
                <span className="detail-label">{t('pages.yard.stackDetails.status')}:</span>
                <span className="detail-value">{getSlotTooltip(showTooltip.slot).details}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 🌟 Futuristic Stack Details Modal */}
      <FuturisticStackDetailsModal
        visible={!!selectedSlotForModal}
        slotId={selectedSlotForModal || ''}
        slotCode={yard?.blocks
          .flatMap(block => block.slots)
          .find(slot => slot.id === selectedSlotForModal)?.code}
        onCancel={() => setSelectedSlotForModal(null)}
        onActionDone={() => {
          // Refresh data if needed
          onRefresh?.();
        }}
      />
    </div>
  );
}
