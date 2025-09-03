import { api } from './api';

export const yardApi = {
  // Stack map (mới)
  async stackMap() {
    const { data } = await api.get('/yard/stack/map');
    return data;
  },

  // Alias để tương thích ngược: map() -> stackMap()
  async map() {
    const { data } = await api.get('/yard/stack/map');
    return data;
  },

  // Tra cứu vị trí theo container trong cơ chế stacking
  async locate(containerNo: string) {
    const { data } = await api.get(`/yard/stack/container/${encodeURIComponent(containerNo)}`);
    return data;
  },

  // Chi tiết các tier của một slot
  async stackSlot(slotId: string) {
    const { data } = await api.get(`/yard/stack/slot/${encodeURIComponent(slotId)}`);
    return data;
  },

  // Thao tác stack: HOLD / CONFIRM / RELEASE / REMOVE
  async hold(slotId: string, tier?: number) {
    const payload: any = { slot_id: slotId };
    if (typeof tier === 'number') payload.tier = tier;
    const { data } = await api.post('/yard/stack/hold', payload);
    return data;
  },
  async confirm(slotId: string, tier: number, containerNo: string) {
    const { data } = await api.post('/yard/stack/confirm', { slot_id: slotId, tier, container_no: containerNo });
    return data;
  },
  async release(slotId: string, tier: number) {
    const { data } = await api.post('/yard/stack/release', { slot_id: slotId, tier });
    return data;
  },
  async removeByContainer(containerNo: string) {
    const { data } = await api.post('/yard/stack/remove-by-container', { container_no: containerNo });
    return data;
  },

  // Các hàm legacy (giữ tạm để không vỡ chỗ khác, sẽ loại bỏ sau)
  async suggest(containerNo: string) {
    const { data } = await api.get('/yard/suggest-position', { params: { container_no: containerNo } });
    return data as Array<{ slot: any; score: number }>;
  },
  async assign(containerNo: string, slotId: string) {
    const { data } = await api.patch('/yard/assign-position', { container_no: containerNo, slot_id: slotId });
    return data;
  },

  // 🎯 Yard Configuration APIs
  async getConfiguration() {
    const { data } = await api.get('/yard/configuration');
    return data;
  },
  async configureYard(config: { depotCount: number; slotsPerDepot: number; tiersPerSlot: number }) {
    const { data } = await api.post('/yard/configure', config);
    return data;
  },
  async resetYard() {
    const { data } = await api.post('/yard/reset');
    return data;
  }
};


