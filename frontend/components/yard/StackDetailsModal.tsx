import React, { useEffect, useMemo, useState } from 'react';
import Modal from '@components/Modal';
import { yardApi } from '@services/yard';

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
    } catch (e: any) {
      setError(e?.response?.data?.message || e?.message || 'Lỗi HOLD');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async (tier: number, containerNo?: string) => {
    const value = (containerNo ?? inputByTier[tier] ?? globalContainerNo).trim();
    if (!value || value.length < 4) { setError('Vui lòng nhập số container hợp lệ (>= 4 ký tự)'); return; }
    try {
      setLoading(true);
      setError('');
      await yardApi.confirm(slotId, tier, value);
      await load();
      onActionDone?.();
    } catch (e: any) {
      setError(e?.response?.data?.message || e?.message || 'Lỗi CONFIRM');
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
        <button type="button" className="btn" onClick={load} disabled={loading} title="Tải lại chi tiết">
          🔄 Refresh
        </button>
        <input
          placeholder="Container No (dùng nhanh cho Confirm)"
          value={globalContainerNo}
          onChange={e => setGlobalContainerNo(e.target.value)}
          style={{ flex: 1, minWidth: 220 }}
        />
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
                    <input
                      placeholder="Container No"
                      value={inputByTier[tier] || ''}
                      onChange={e => setInputByTier(s => ({ ...s, [tier]: e.target.value }))}
                      onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); void handleConfirm(tier); } }}
                      style={{ width: 160 }}
                    />
                    <button className="btn btn-primary" disabled={loading} onClick={() => handleConfirm(tier)}>
                      ✅ Confirm
                    </button>
                    <button className="btn btn-secondary" disabled={loading} onClick={() => handleRelease(tier)}>
                      ❌ Release
                    </button>
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
