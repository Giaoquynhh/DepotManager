import React, { useEffect, useMemo, useState } from 'react';
import Modal from '@components/Modal';
import { yardApi } from '@services/yard';
import { reportsApi } from '@services/reports';

interface StackDetailsModalProps {
  visible: boolean;
  slotId: string;
  slotCode?: string;
  onCancel: () => void;
  onActionDone?: () => void; // gọi để refresh map bên ngoài
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

export const StackDetailsModal: React.FC<StackDetailsModalProps> = ({ visible, slotId, slotCode, onCancel, onActionDone }) => {
  const [details, setDetails] = useState<SlotDetails | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [inputByTier, setInputByTier] = useState<Record<number, string>>({});
  const [globalContainerNo, setGlobalContainerNo] = useState('');
  const [now, setNow] = useState<number>(Date.now());
  
  // State cho container filter
  const [showContainerFilter, setShowContainerFilter] = useState(false);
  const [availableContainers, setAvailableContainers] = useState<Array<{container_no: string, service_gate_checked_at: string}>>([]);
  const [filterLoading, setFilterLoading] = useState(false);
  const [focusedTier, setFocusedTier] = useState<number | null>(null);

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

  // Fetch containers đang chờ sắp xếp
  const fetchAvailableContainers = async () => {
    try {
      setFilterLoading(true);
      const data = await reportsApi.listContainers({
        service_status: 'CHECKED',
        page: 1,
        pageSize: 100
      });
      
      // Lọc chỉ lấy container có derived_status = 'WAITING' (đang chờ sắp xếp)
      const waitingContainers = data.items.filter((item: any) => {
        if (item.service_status === 'CHECKED' || item.repair_checked === true) {
          const inYard = !!item.slot_code;
          return !inYard; // Chỉ lấy container chưa được sắp xếp vào slot
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

  // Thêm state để track container validation
  const [containerValidation, setContainerValidation] = useState<Record<number, {isValid: boolean, message: string}>>({});

  // Validate container input
  const validateContainerInput = (tier: number, containerNo: string): {isValid: boolean, message: string} => {
    if (!containerNo || containerNo.trim().length < 4) {
      return { isValid: false, message: 'Vui lòng nhập số container hợp lệ (>= 4 ký tự)' };
    }
    
    // Kiểm tra container có trong danh sách available không
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
      
      // Sau khi HOLD thành công, hiển thị container filter
      setShowContainerFilter(true);
      await fetchAvailableContainers();
    } catch (e: any) {
      setError(e?.response?.data?.message || e?.message || 'Lỗi HOLD');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async (tier: number, containerNo?: string) => {
    const value = (containerNo ?? inputByTier[tier] ?? globalContainerNo).trim();
    
    // Kiểm tra validation trước khi gửi request
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
      
      // Clear input và validation sau khi thành công
      setInputByTier(prev => ({ ...prev, [tier]: '' }));
      setContainerValidation(prev => ({ ...prev, [tier]: { isValid: true, message: '' } }));
    } catch (e: any) {
      const errorMessage = e?.response?.data?.message || e?.message || 'Lỗi CONFIRM';
      setError(errorMessage);
      
      // Nếu lỗi từ backend validation, cập nhật validation state
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
    // Nếu có tier đang được focus, điền vào tier đó
    if (focusedTier !== null) {
      setInputByTier(prev => ({ ...prev, [focusedTier]: containerNo }));
      // Cập nhật validation cho tier này
      const validation = validateContainerInput(focusedTier, containerNo);
      setContainerValidation(prev => ({ ...prev, [focusedTier]: validation }));
    } else {
      // Nếu không có tier nào được focus, điền vào global input
      setGlobalContainerNo(containerNo);
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

  return (
    <Modal
      title={`Chi tiết Stack: ${details?.block?.yard?.name || ''} / ${details?.block?.code || ''} / ${details?.code || slotCode || ''}`}
      visible={visible}
      onCancel={onCancel}
      size="lg"
    >
      {error && (
        <div className="message-banner error" style={{ marginBottom: 12 }}>
          <p>{error}</p>
          <button className="close-btn" onClick={() => setError('')}>×</button>
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <button type="button" className="btn btn-primary" onClick={handleHold} disabled={loading}>
          ➕ HOLD tier kế tiếp
        </button>
        <div style={{ 
          fontSize: '12px', 
          color: '#374151', 
          background: '#f0f9ff', 
          padding: '6px 12px', 
          borderRadius: '6px',
          border: '1px solid #0ea5e9'
        }}>
          ℹ️ Chỉ nhận container có trạng thái "Đang chờ sắp xếp" (CHECKED)
        </div>
      </div>



      <div style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: 12, maxHeight: '60vh', overflow: 'auto' }}>
        {[...Array(Math.max(capacity || 0, (details?.placements?.length || 0)))].map((_, idx) => {
          const tier = idx + 1;
          const p = byTier.get(tier);
          const status = p?.status || 'EMPTY';
          const activeHold = p ? isHoldActive(p) : false;
          const isTopOcc = p?.status === 'OCCUPIED' && !p?.removed_at && occTopTier === tier;

          return (
            <div key={tier} style={{ display: 'grid', gridTemplateColumns: '60px 1fr auto', alignItems: 'center', gap: 8, padding: '8px 0', borderBottom: '1px dashed #e5e7eb' }}>
              <div style={{ fontWeight: 700 }}>T{tier}</div>
              <div>
                {status === 'EMPTY' && <span style={{ color: '#6b7280' }}>Trống</span>}
                {status === 'HOLD' && (
                  <span style={{ color: activeHold ? '#b45309' : '#9ca3af' }}>
                    HOLD{!activeHold ? ' (hết hạn)' : ''}{p?.hold_expires_at ? ` · TTL: ${formatRemain(p.hold_expires_at)}` : ''}
                  </span>
                )}
                {status === 'OCCUPIED' && (
                  <span style={{ color: '#374151' }}>Đã chiếm · {p?.container_no || 'N/A'}</span>
                )}
                {status === 'REMOVED' && <span style={{ color: '#9ca3af' }}>Đã gỡ</span>}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                {status === 'HOLD' && activeHold && (
                  <>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 200 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <input
                          placeholder="Container No"
                          value={inputByTier[tier] || ''}
                          onChange={e => handleContainerInputChange(tier, e.target.value)}
                          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); void handleConfirm(tier); } }}
                          style={{ width: 160 }}
                        />
                        <button 
                          type="button" 
                          className="btn btn-outline" 
                          onClick={() => {
                            setFocusedTier(tier);
                            setShowContainerFilter(!showContainerFilter);
                            if (!showContainerFilter) {
                              fetchAvailableContainers();
                            }
                          }}
                          title="Filter containers cho tier này"
                          style={{ fontSize: '10px', padding: '2px 6px' }}
                        >
                          🔍
                        </button>
                      </div>
                      
                      {/* Hiển thị validation message */}
                      {containerValidation[tier] && !containerValidation[tier].isValid && (
                        <div style={{ 
                          color: '#dc2626', 
                          fontSize: '11px', 
                          marginTop: '2px',
                          padding: '2px 4px',
                          background: '#fef2f2',
                          border: '1px solid #fecaca',
                          borderRadius: '4px'
                        }}>
                          {containerValidation[tier].message}
                        </div>
                      )}
                      
                      {/* Container Filter cho tier này */}
                      {showContainerFilter && focusedTier === tier && (
                        <div style={{ 
                          border: '1px solid #e5e7eb', 
                          borderRadius: 6, 
                          padding: 8, 
                          background: '#f9fafb',
                          maxHeight: '150px',
                          overflow: 'auto'
                        }}>
                          
                          {filterLoading ? (
                            <div style={{ textAlign: 'center', padding: '10px', color: '#6b7280', fontSize: '11px' }}>
                              Đang tải...
                            </div>
                          ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                              {availableContainers
                                .slice(0, 5) // Chỉ hiển thị tối đa 5 container
                                .map(container => (
                                  <div
                                    key={container.container_no}
                                    style={{
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'space-between',
                                      padding: '4px 8px',
                                      border: '1px solid #e5e7eb',
                                      borderRadius: 4,
                                      background: 'white',
                                      cursor: 'pointer',
                                      transition: 'all 0.2s',
                                      fontSize: '11px'
                                    }}
                                    onMouseEnter={(e) => {
                                      e.currentTarget.style.background = '#f3f4f6';
                                    }}
                                    onMouseLeave={(e) => {
                                      e.currentTarget.style.background = 'white';
                                    }}
                                    onClick={() => handleSelectContainer(container.container_no)}
                                  >
                                    <span style={{ fontWeight: 600 }}>{container.container_no}</span>
                                    <span style={{ fontSize: '10px', color: '#6b7280' }}>
                                      {container.service_gate_checked_at ? 
                                        new Date(container.service_gate_checked_at).toLocaleDateString() : 
                                        'Sửa chữa'
                                      }
                                    </span>
                                  </div>
                                ))
                              }
                              {availableContainers.length === 0 && (
                                <div style={{ textAlign: 'center', padding: '8px', color: '#6b7280', fontSize: '10px' }}>
                                  Không có container đang chờ sắp xếp
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                      
                      <div style={{ display: 'flex', gap: 4 }}>
                        <button 
                          className="btn btn-primary" 
                          disabled={loading || !containerValidation[tier]?.isValid || !inputByTier[tier]?.trim()} 
                          onClick={() => handleConfirm(tier)}
                        >
                          ✅ Confirm
                        </button>
                        <button className="btn btn-secondary" disabled={loading} onClick={() => handleRelease(tier)}>
                          ❌ Release
                        </button>
                      </div>
                    </div>
                  </>
                )}
                {status === 'OCCUPIED' && isTopOcc && p?.container_no && (
                  <button className="btn btn-danger" disabled={loading} onClick={() => handleRemove(p.container_no!)}>
                    🗑️ Remove
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </Modal>
  );
};
