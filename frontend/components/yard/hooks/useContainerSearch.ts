import { useState } from 'react';
import { yardApi } from '@services/yard';
import { api } from '@services/api';
import { getStatusText, getContainerType } from '../../utils/containerUtils';

// Function tạo mock data cho vị trí cổng
const getMockGateLocation = (containerNo: string): string => {
  // Sử dụng container number để tạo vị trí cổng ngẫu nhiên nhưng nhất quán
  const hash = containerNo.split('').reduce((a, b) => {
    a = ((a << 5) - a + b.charCodeAt(0)) & 0xffffffff;
    return a;
  }, 0);
  
  const gateNumber = (Math.abs(hash) % 8) + 1; // Tạo 8 cổng từ 1-8
  return `Gate ${gateNumber}`;
};

export const useContainerSearch = () => {
  const [containerInfo, setContainerInfo] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');
  const [isDuplicate, setIsDuplicate] = useState(false);
  const [existingContainers, setExistingContainers] = useState<any[]>([]);

  const searchContainer = async (containerNo: string, gateLocationFilter: string = '') => {
    if (!containerNo.trim()) {
      setMsg('Vui lòng nhập Container No');
      return;
    }

    // Kiểm tra độ dài tối thiểu của container number
    if (containerNo.trim().length < 4) {
      setMsg('Container No phải có ít nhất 4 ký tự');
      return;
    }


    try {
      setLoading(true);
      setMsg('');
      setContainerInfo(null);
      setIsDuplicate(false);
      
      // Tìm kiếm container trong database
      const searchResponse = await api.get(`/gate/requests/search?container_no=${encodeURIComponent(containerNo.trim())}&limit=100`);
      
      // Debug: Kiểm tra cấu trúc response
      console.log({
        hasData: !!searchResponse.data,
        dataKeys: searchResponse.data ? Object.keys(searchResponse.data) : [],
        hasDataArray: !!searchResponse.data?.data,
        hasItems: !!searchResponse.data?.items,
        dataType: typeof searchResponse.data?.data,
        itemsType: typeof searchResponse.data?.items
      });
      
      // Thử nhiều cách để lấy danh sách containers
      let existingContainers: any[] = [];
      if (searchResponse.data?.data && Array.isArray(searchResponse.data.data)) {
        existingContainers = searchResponse.data.data;
      } else if (searchResponse.data?.items && Array.isArray(searchResponse.data.items)) {
        existingContainers = searchResponse.data.items;
      } else if (Array.isArray(searchResponse.data)) {
        existingContainers = searchResponse.data;
      } else {
        existingContainers = [];
      }
      
      
      // Tìm container exact match
      const foundContainer = existingContainers.find((c: any) => {
        return c.container_no === containerNo.trim();
      });
      
      // Nếu không tìm thấy container trong database, báo lỗi
      if (!foundContainer) {
        setContainerInfo(null);
        setMsg('Không có thông tin về container');
        return;
      }
      
      
      // Kiểm tra xem container có trạng thái GATE_IN không
      const hasGateInStatus = foundContainer.status === 'GATE_IN' || 
                             foundContainer.status === 'Gate In' ||
                             foundContainer.status?.toUpperCase() === 'GATE_IN';
      
      console.log({
        status: foundContainer.status,
        statusEqualsGATE_IN: foundContainer.status === 'GATE_IN',
        statusEqualsGateIn: foundContainer.status === 'Gate In',
        statusToUpper: foundContainer.status?.toUpperCase()
      });
      
      if (hasGateInStatus) {
        
        // Kiểm tra filter vị trí cổng xe vào
        if (gateLocationFilter && gateLocationFilter !== '') {
          const containerGateLocation = foundContainer.gate_location || getMockGateLocation(containerNo.trim());
          if (containerGateLocation !== gateLocationFilter) {
            setContainerInfo(null);
            setMsg(`Container không ở vị trí cổng ${gateLocationFilter}`);
            return;
          }
        }
        
        // Nếu tìm thấy container với trạng thái GATE_IN, hiển thị thông tin
        setIsDuplicate(true);
        setExistingContainers(existingContainers);
        
        // Tạo container data từ database
        const containerData = {
          container_no: containerNo.trim(),
          status: foundContainer.status || 'GATE_IN',
          status_text: getStatusText(foundContainer.status || 'GATE_IN'),
          type: getContainerType(foundContainer.type) || 'Chưa xác định',
          location: foundContainer.location || null,
          block_code: foundContainer.block_code || null,
          slot_code: foundContainer.slot_code || null,
          dem_date: foundContainer.dem_date,
          det_date: foundContainer.det_date,
          yard_name: foundContainer.yard_name || 'Chưa xác định',
          gate_status: foundContainer.status || 'GATE_IN',
          gate_location: foundContainer.gate_location || getMockGateLocation(containerNo.trim())
        };
        
        setContainerInfo(containerData);
        setMsg('Đã tìm thấy container với trạng thái Gate In');
        return;
      } else {
        // Container có trong database nhưng không có trạng thái GATE_IN
        setContainerInfo(null);
        setMsg('Container không có trạng thái Gate In');
        return;
      }
      
    } catch (error: any) {
      console.error('🚨 Lỗi khi tìm kiếm container:', error);
      console.error('Error response:', error.response);
      if (error.response?.status === 404) {
        setMsg('Không có thông tin về container');
      } else {
        setMsg(error?.response?.data?.message || 'Lỗi khi tìm kiếm container');
      }
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setContainerInfo(null);
    setMsg('');
    setIsDuplicate(false);
    setExistingContainers([]);
  };

  return {
    containerInfo,
    loading,
    msg,
    isDuplicate,
    existingContainers,
    searchContainer,
    reset,
    setMsg
  };
};
