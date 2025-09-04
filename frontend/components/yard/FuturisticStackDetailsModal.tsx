import React, { useEffect, useMemo, useState } from 'react';
import { yardApi } from '@services/yard';
import { containersApi } from '@services/containers';
import { authApi } from '@services/auth';
import { useTranslation } from '../../hooks/useTranslation';

interface FuturisticStackDetailsModalProps {
  visible: boolean;
  slotId: string;
  slotCode?: string;
  onCancel: () => void;
  onActionDone?: () => void;
}

interface Placement {
  id: string;
  tier: number;
  status: 'HOLD' | 'OCCUPIED' | 'REMOVED';
  container_no?: string | null;
  hold_expires_at?: string | null;
  removed_at?: string | null;
  created_at?: string;
}

interface SlotDetails {
  id: string;
  code: string;
  tier_capacity?: number | null;
  placements: Placement[];
  block?: { id: string; code: string; yard?: { id: string; name: string } };
}

function isHoldActive(p: Placement): boolean {
  if (p.status !== 'HOLD') return false;
  if (!p.hold_expires_at) return true;
  return new Date(p.hold_expires_at) > new Date();
}

export const FuturisticStackDetailsModal: React.FC<FuturisticStackDetailsModalProps> = ({ 
  visible, 
  slotId, 
  slotCode, 
  onCancel, 
  onActionDone 
}) => {
  const { t } = useTranslation();
  const [details, setDetails] = useState<SlotDetails | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [inputByTier, setInputByTier] = useState<Record<number, string>>({});
  const [now, setNow] = useState<number>(Date.now());
  
  // State cho container filter
  const [showContainerFilter, setShowContainerFilter] = useState(false);
  const [availableContainers, setAvailableContainers] = useState<Array<{container_no: string, service_gate_checked_at?: string}>>([]);
  const [filterLoading, setFilterLoading] = useState(false);
  const [focusedTier, setFocusedTier] = useState<number | null>(null);
  
  // State cho SystemAdmin
  const [isSystemAdmin, setIsSystemAdmin] = useState(false);
  const [containerValidation, setContainerValidation] = useState<Record<number, {isValid: boolean, message: string}>>({});

  // Kiểm tra role của user hiện tại
  useEffect(() => {
    const checkUserRole = async () => {
      try {
        const userData = await authApi.me();
        setIsSystemAdmin(userData?.role === 'SystemAdmin');
      } catch (error) {
        console.error('Error checking user role:', error);
        setIsSystemAdmin(false);
      }
    };
    
    if (visible) {
      checkUserRole();
    }
  }, [visible]);

  const load = async () => {
    if (!visible || !slotId) return;
    try {
      setLoading(true);
      setError('');
      const data = await yardApi.stackSlot(slotId);
      setDetails(data);
    } catch (e: any) {
      setError(e?.response?.data?.message || e?.message || 'Lỗi tải chi tiết');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [visible, slotId]);
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  // Ngăn chặn scroll body khi modal mở
  useEffect(() => {
    if (visible) {
      // Lưu vị trí scroll hiện tại
      const scrollY = window.scrollY;
      document.body.style.setProperty('--scroll-y', `${scrollY}px`);
      document.body.classList.add('modal-open');
    } else {
      document.body.classList.remove('modal-open');
      // Khôi phục vị trí scroll
      const scrollY = document.body.style.getPropertyValue('--scroll-y');
      if (scrollY) {
        window.scrollTo(0, parseInt(scrollY));
      }
      document.body.style.removeProperty('--scroll-y');
    }
    
    // Cleanup khi component unmount
    return () => {
      document.body.classList.remove('modal-open');
      document.body.style.removeProperty('--scroll-y');
    };
  }, [visible]);

  // Fetch containers đang chờ sắp xếp
  const fetchAvailableContainers = async () => {
    try {
      setFilterLoading(true);
      const data = await containersApi.list({
        service_status: 'CHECKED',
        page: 1,
        pageSize: 100
      });
      
      const waitingContainers = data.items.filter((item: any) => {
        if (item.service_status === 'CHECKED' || item.repair_checked === true) {
          const inYard = !!item.slot_code;
          return !inYard;
        }
        return false;
      });
      
      setAvailableContainers(waitingContainers);
    } catch (error) {
      console.error('Error fetching available containers:', error);
    } finally {
      setFilterLoading(false);
    }
  };

  // Validate container input
  const validateContainerInput = (tier: number, containerNo: string): {isValid: boolean, message: string} => {
    if (!containerNo || containerNo.trim().length < 4) {
      return { isValid: false, message: 'Vui lòng nhập số container hợp lệ (>= 4 ký tự)' };
    }
    
    if (isSystemAdmin) {
      return { isValid: true, message: '' };
    }
    
    const isAvailable = availableContainers.some(container => 
      container.container_no.toLowerCase() === containerNo.trim().toLowerCase()
    );
    
    if (!isAvailable) {
      return { isValid: false, message: 'Container không có trong danh sách đang chờ sắp xếp' };
    }
    
    return { isValid: true, message: '' };
  };

  // Update validation khi input thay đổi
  const handleContainerInputChange = (tier: number, value: string) => {
    setInputByTier(prev => ({ ...prev, [tier]: value }));
    
    if (value.trim()) {
      const validation = validateContainerInput(tier, value);
      setContainerValidation(prev => ({ ...prev, [tier]: validation }));
    } else {
      setContainerValidation(prev => ({ ...prev, [tier]: { isValid: true, message: '' } }));
    }
  };

  const occTopTier = useMemo(() => {
    if (!details) return null;
    const occ = details.placements.filter(p => p.status === 'OCCUPIED' && !p.removed_at);
    if (occ.length === 0) return null;
    return Math.max(...occ.map(p => p.tier));
  }, [details]);

  const capacity = useMemo(() => details?.tier_capacity || Math.max( (details?.placements||[]).reduce((mx, p) => Math.max(mx, p.tier), 0), 0 ) || 5, [details]);

  const byTier = useMemo(() => {
    const map = new Map<number, Placement>();
    (details?.placements || []).forEach(p => map.set(p.tier, p));
    return map;
  }, [details]);

  const handleHold = async () => {
    try {
      setLoading(true);
      setError('');
      await yardApi.hold(slotId);
      await load();
      onActionDone?.();
      setShowContainerFilter(true);
      await fetchAvailableContainers();
    } catch (e: any) {
      setError(e?.response?.data?.message || e?.message || 'Lỗi HOLD');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async (tier: number, containerNo?: string) => {
    const value = (containerNo ?? inputByTier[tier] ?? '').trim();
    
    const validation = validateContainerInput(tier, value);
    if (!validation.isValid) {
      setError(validation.message);
      return;
    }
    
    try {
      setLoading(true);
      setError('');
      await yardApi.confirm(slotId, tier, value);
      await load();
      onActionDone?.();
      
      setInputByTier(prev => ({ ...prev, [tier]: '' }));
      setContainerValidation(prev => ({ ...prev, [tier]: { isValid: true, message: '' } }));
    } catch (e: any) {
      const errorMessage = e?.response?.data?.message || e?.message || 'Lỗi CONFIRM';
      setError(errorMessage);
      
      if (errorMessage.includes('Container không tồn tại') || 
          errorMessage.includes('Container chưa được kiểm tra') ||
          errorMessage.includes('Container đã được đặt vào yard')) {
        setContainerValidation(prev => ({ 
          ...prev, 
          [tier]: { isValid: false, message: errorMessage } 
        }));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRelease = async (tier: number) => {
    try {
      setLoading(true);
      setError('');
      await yardApi.release(slotId, tier);
      await load();
      onActionDone?.();
    } catch (e: any) {
      setError(e?.response?.data?.message || e?.message || 'Lỗi RELEASE');
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (containerNo: string) => {
    try {
      setLoading(true);
      setError('');
      if (typeof window !== 'undefined') {
        const ok = window.confirm(`Xác nhận REMOVE container ${containerNo}?`);
        if (!ok) { setLoading(false); return; }
      }
      await yardApi.removeByContainer(containerNo);
      await load();
      onActionDone?.();
    } catch (e: any) {
      setError(e?.response?.data?.message || e?.message || 'Lỗi REMOVE');
    } finally {
      setLoading(false);
    }
  };

  // Select container từ filter
  const handleSelectContainer = (containerNo: string) => {
    if (focusedTier !== null) {
      setInputByTier(prev => ({ ...prev, [focusedTier]: containerNo }));
      const validation = validateContainerInput(focusedTier, containerNo);
      setContainerValidation(prev => ({ ...prev, [focusedTier]: validation }));
    }
    
    setShowContainerFilter(false);
    setFocusedTier(null);
  };

  const formatRemain = (expires?: string | null) => {
    if (!expires) return '';
    const ms = new Date(expires).getTime() - now;
    if (ms <= 0) return '(hết hạn)';
    const sec = Math.floor(ms / 1000);
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    const s = sec % 60;
    const pad = (n: number) => String(n).padStart(2, '0');
    return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${m}:${pad(s)}`;
  };

  const getTierStatusText = (status: string, p?: Placement) => {
    switch (status) {
      case 'EMPTY':
        return t('pages.yard.stackDetails.empty');
      case 'HOLD':
        const activeHold = p ? isHoldActive(p) : false;
        return `${t('pages.yard.stackDetails.tierHoldStatus')}${!activeHold ? ` (${t('pages.yard.stackDetails.expired')})` : ''}${p?.hold_expires_at ? ` · TTL: ${formatRemain(p.hold_expires_at)}` : ''}`;
      case 'OCCUPIED':
        return `${t('pages.yard.stackDetails.occupied')} · ${p?.container_no || 'N/A'}`;
      case 'REMOVED':
        return t('pages.yard.stackDetails.removed');
      default:
        return status;
    }
  };

  const getTierStatusColor = (status: string, p?: Placement) => {
    switch (status) {
      case 'HOLD':
        const activeHold = p ? isHoldActive(p) : false;
        return activeHold ? '#ff8c00' : '#9ca3af';
      case 'OCCUPIED':
        return '#374151';
      case 'REMOVED':
        return '#9ca3af';
      default:
        return '#6b7280';
    }
  };

  if (!visible) return null;

  return (
    <div className="futuristic-modal-overlay" onClick={onCancel}>
      <div className="futuristic-modal" onClick={(e) => e.stopPropagation()}>
        {/* 🗂️ Dynamic Header */}
        <div className="futuristic-modal-header">
          <div className="futuristic-breadcrumb">
            <span className="futuristic-breadcrumb-item">
              {details?.block?.yard?.name || 'Depot'}
            </span>
            <span className="futuristic-breadcrumb-separator">→</span>
            <span className="futuristic-breadcrumb-item">
              {details?.block?.code || 'Block'}
            </span>
            <span className="futuristic-breadcrumb-separator">→</span>
            <span className="futuristic-breadcrumb-item">
              {details?.code || slotCode || 'Slot'}
            </span>
          </div>
          <h2 className="futuristic-modal-title">
            {t('pages.yard.stackDetails.title')}
          </h2>
          <button className="futuristic-close-btn" onClick={onCancel}>
            ×
          </button>
        </div>

        {/* 🎯 Holographic Tier System */}
        <div className="futuristic-modal-content">
          {error && (
            <div style={{ 
              background: 'rgba(239, 68, 68, 0.1)', 
              border: '1px solid rgba(239, 68, 68, 0.3)', 
              borderRadius: '12px', 
              padding: '16px', 
              marginBottom: '24px',
              color: '#ef4444',
              fontSize: '14px'
            }}>
              {error}
            </div>
          )}

          {/* 🎈 Quick Actions Toolbar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '32px' }}>
            <button 
              className="futuristic-fab" 
              onClick={handleHold} 
              disabled={loading}
            >
              ➕ {t('pages.yard.stackDetails.holdNextTier')}
            </button>
            
            <div style={{ 
              fontSize: '12px', 
              color: 'rgba(255, 255, 255, 0.8)', 
              background: 'rgba(255, 255, 255, 0.1)', 
              padding: '8px 16px', 
              borderRadius: '20px',
              border: '1px solid rgba(255, 255, 255, 0.2)'
            }}>
              {isSystemAdmin ? (
                `🔑 ${t('pages.yard.stackDetails.systemAdminNote')}`
              ) : (
                `ℹ️ ${t('pages.yard.stackDetails.receiveCheckedContainers')}`
              )}
            </div>
          </div>

          {/* 🏗️ Vertical Tower Visualization */}
          <div className="futuristic-tier-tower">
            {[...Array(Math.max(capacity || 0, (details?.placements?.length || 0)))].map((_, idx) => {
              const tier = idx + 1;
              const p = byTier.get(tier);
              const status = p?.status || 'EMPTY';
              const activeHold = p ? isHoldActive(p) : false;
              const isTopOcc = p?.status === 'OCCUPIED' && !p?.removed_at && occTopTier === tier;

              return (
                <div 
                  key={tier} 
                  className={`futuristic-tier-card ${status.toLowerCase()} ${status === 'HOLD' && activeHold ? 'holding' : ''}`}
                >
                  {/* 🎯 Tier Header */}
                  <div className="futuristic-tier-header">
                    <div className="futuristic-tier-label">T{tier}</div>
                    <div className="futuristic-tier-status" style={{ color: getTierStatusColor(status, p) }}>
                      {status === 'HOLD' && activeHold && (
                        <div className="futuristic-ttl-timer">
                          <div className="futuristic-ttl-circle">
                            <div className="futuristic-ttl-progress"></div>
                          </div>
                          <span className="futuristic-ttl-text">
                            {p?.hold_expires_at ? formatRemain(p.hold_expires_at) : '∞'}
                          </span>
                        </div>
                      )}
                      <span>{getTierStatusText(status, p)}</span>
                    </div>
                  </div>

                  {/* 🎪 Futuristic Action Panel */}
                  {status === 'HOLD' && activeHold && (
                    <div className="futuristic-action-panel">
                      {/* SystemAdmin Note */}
                      {isSystemAdmin && (
                        <div style={{ 
                          background: 'rgba(59, 130, 246, 0.1)', 
                          border: '1px solid rgba(59, 130, 246, 0.3)', 
                          borderRadius: '12px', 
                          padding: '12px', 
                          marginBottom: '16px',
                          fontSize: '12px',
                          color: '#3b82f6'
                        }}>
                          🔑 {t('pages.yard.stackDetails.systemAdminNote')}
                        </div>
                      )}
                      
                                             {/* Smart Input Field */}
                       <div className="futuristic-input-group">
                         <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                           <input
                             className="futuristic-floating-input"
                             placeholder="Ví dụ: ABCD1234567"
                             value={inputByTier[tier] || ''}
                             onChange={e => handleContainerInputChange(tier, e.target.value)}
                             onKeyDown={(e) => { 
                               if (e.key === 'Enter') { 
                                 e.preventDefault(); 
                                 void handleConfirm(tier); 
                               } 
                             }}
                             onFocus={() => setFocusedTier(tier)}
                           />
                          {!isSystemAdmin && (
                            <button 
                              className="futuristic-fab"
                              style={{ padding: '8px 12px', fontSize: '12px' }}
                              onClick={() => {
                                setFocusedTier(tier);
                                setShowContainerFilter(!showContainerFilter);
                                if (!showContainerFilter) {
                                  fetchAvailableContainers();
                                }
                              }}
                              title={t('pages.yard.stackDetails.filterContainers')}
                            >
                              🔍
                            </button>
                          )}
                        </div>
                        
                        {/* Validation Message */}
                        {containerValidation[tier] && !containerValidation[tier].isValid && (
                          <div style={{ 
                            color: '#ef4444', 
                            fontSize: '12px', 
                            marginTop: '8px',
                            padding: '8px 12px',
                            background: 'rgba(239, 68, 68, 0.1)',
                            border: '1px solid rgba(239, 68, 68, 0.3)',
                            borderRadius: '8px'
                          }}>
                            {containerValidation[tier].message}
                          </div>
                        )}
                        
                        {/* Container Filter */}
                        {!isSystemAdmin && showContainerFilter && focusedTier === tier && (
                          <div style={{ 
                            border: '1px solid rgba(255, 255, 255, 0.2)', 
                            borderRadius: '12px', 
                            padding: '16px', 
                            background: 'rgba(255, 255, 255, 0.05)',
                            marginTop: '12px',
                            maxHeight: '200px',
                            overflow: 'auto'
                          }}>
                            {filterLoading ? (
                              <div style={{ textAlign: 'center', padding: '20px', color: 'rgba(255, 255, 255, 0.6)' }}>
                                {t('pages.yard.stackDetails.loading')}
                              </div>
                            ) : (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                {availableContainers.slice(0, 5).map(container => (
                                  <div
                                    key={container.container_no}
                                    style={{
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'space-between',
                                      padding: '12px 16px',
                                      border: '1px solid rgba(255, 255, 255, 0.2)',
                                      borderRadius: '8px',
                                      background: 'rgba(255, 255, 255, 0.05)',
                                      cursor: 'pointer',
                                      transition: 'all 0.3s ease',
                                      fontSize: '14px'
                                    }}
                                    onMouseEnter={(e) => {
                                      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                                      e.currentTarget.style.transform = 'translateY(-2px)';
                                    }}
                                    onMouseLeave={(e) => {
                                      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                                      e.currentTarget.style.transform = 'translateY(0)';
                                    }}
                                    onClick={() => handleSelectContainer(container.container_no)}
                                  >
                                    <span style={{ fontWeight: 600, color: 'white' }}>
                                      {container.container_no}
                                    </span>
                                    <span style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.6)' }}>
                                      {container.service_gate_checked_at ? 
                                        new Date(container.service_gate_checked_at).toLocaleDateString() : 
                                        t('pages.yard.stackDetails.repair')
                                      }
                                    </span>
                                  </div>
                                ))}
                                {availableContainers.length === 0 && (
                                  <div style={{ textAlign: 'center', padding: '20px', color: 'rgba(255, 255, 255, 0.6)' }}>
                                    {t('pages.yard.stackDetails.noContainersWaiting')}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                      
                      {/* Spectacular Command Buttons */}
                      <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
                        <button 
                          className="futuristic-fab futuristic-btn-confirm"
                          disabled={loading || !containerValidation[tier]?.isValid || !inputByTier[tier]?.trim()} 
                          onClick={() => handleConfirm(tier)}
                        >
                          ✅ {t('pages.yard.stackDetails.confirm')}
                        </button>
                        <button 
                          className="futuristic-fab futuristic-btn-release"
                          disabled={loading} 
                          onClick={() => handleRelease(tier)}
                        >
                          ❌ {t('pages.yard.stackDetails.release')}
                        </button>
                      </div>
                    </div>
                  )}
                  
                  {/* Remove Button for Top Occupied */}
                  {status === 'OCCUPIED' && isTopOcc && p?.container_no && (
                    <div style={{ marginTop: '16px' }}>
                      <button 
                        className="futuristic-fab futuristic-btn-release"
                        disabled={loading} 
                        onClick={() => handleRemove(p.container_no!)}
                      >
                        🗑️ {t('pages.yard.stackDetails.remove')}
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
