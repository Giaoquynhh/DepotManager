import React from 'react';
import { useRouter } from 'next/router';
import Header from '@components/Header';
import Card from '@components/Card';
import { useTranslation } from '../hooks/useTranslation';
import { useToast } from '../hooks/useToastHook';
import { useRouteRefresh } from '../hooks/useRouteRefresh';
import { requestService } from '../services/requests';
import { maintenanceApi } from '../services/maintenance';
import { setupService, Customer } from '../services/setupService';
import { containersApi } from '../services/containers';
import { yardApi } from '../services/yard';
import { reportsService, ContainerItem } from '../services/reports';
import { sealsApi } from '../services/seals';

// Interface cho dữ liệu bảng
interface TableData {
  id: string;
  shippingLine: string; // Hãng tàu
  containerNumber: string; // Số Cont
  containerType: string; // Loại Cont
  status: string; // Trạng thái
  repairTicketStatus?: string; // Trạng thái phiếu sửa chữa (nếu có)
  customer: string; // Khách hàng
  documents: string; // Chứng từ
  documentsCount?: number; // Số lượng chứng từ
  repairImagesCount?: number; // Số lượng ảnh kiểm tra
  repairTicketId?: string; // ID của repair ticket
  position?: string; // Vị trí bãi
  sealNumber?: string; // Số seal
  demDet?: string; // DEM/DET
  attachments?: any[]; // Danh sách file đính kèm ở mức container
  containerQuality?: 'GOOD' | 'NEED_REPAIR' | 'UNKNOWN'; // Trạng thái hiển thị
  yardName?: string;
  blockCode?: string;
  slotCode?: string;
  requestType?: 'IMPORT' | 'EXPORT'; // Loại request để hiển thị đúng trạng thái
}

export default function ManagerCont(){
  const router = useRouter();
  const { t } = useTranslation();
  const { showSuccess, showError, ToastContainer } = useToast();
  const [localSearch, setLocalSearch] = React.useState('');
  const [localType, setLocalType] = React.useState('all');
  const [localStatus, setLocalStatus] = React.useState('all');
  const [includeEmptyInYard, setIncludeEmptyInYard] = React.useState(true); // Tự động bật mặc định
  const [refreshTrigger, setRefreshTrigger] = React.useState(0);
  const routeRefreshKey = useRouteRefresh();
  const [loading, setLoading] = React.useState(false);
  
  // Pagination states
  const [currentPage, setCurrentPage] = React.useState(1);
  const [itemsPerPage] = React.useState(6);
  const [totalItems, setTotalItems] = React.useState(0);
  
  // Map trạng thái container -> nhãn tiếng Việt (đồng bộ với Maintenance/Repairs)
  const getContainerStatusLabel = (ticketStatus?: string, containerQuality?: 'GOOD' | 'NEED_REPAIR' | 'UNKNOWN') => {
    // Nếu có containerQuality từ logic xử lý, ưu tiên sử dụng nó
    if (containerQuality === 'GOOD') return 'Container tốt';
    if (containerQuality === 'NEED_REPAIR') return 'Cần sửa chữa';
    
    // Fallback về logic cũ nếu có ticketStatus
    if (!ticketStatus) return 'Không xác định';
    const map: Record<string, string> = {
      'COMPLETE': 'Container tốt',
      'COMPLETE_NEEDREPAIR': 'Container xấu có thể sửa chữa',
      'COMPLETE_NEED_REPAIR': 'Container xấu có thể sửa chữa',
      'PENDING': 'Chưa kiểm tra',
      'REJECT': 'Container xấu không thể sửa chữa',
      'REJECTED': 'Container xấu không thể sửa chữa',
      // Thêm các trạng thái khác để tương thích
      'CHECKING': 'Đang kiểm tra',
      'PENDING_ACCEPT': 'Chờ xác nhận',
      'REPAIRING': 'Đang sửa chữa',
      'CHECKED': 'Đã kiểm tra'
    };
    return map[ticketStatus] || 'Không xác định';
  };

  // Map trạng thái -> CSS class cho badge
  const getStatusBadgeClass = (status?: string, containerQuality?: 'GOOD' | 'NEED_REPAIR' | 'UNKNOWN') => {
    // Nếu có containerQuality từ logic xử lý, ưu tiên sử dụng nó
    if (containerQuality === 'GOOD') return 'status-hoàn-thành';
    if (containerQuality === 'NEED_REPAIR') return 'status-cần-sửa-chữa';
    
    // Fallback về logic cũ nếu có status
    if (!status) return 'status-đang-xử-lý';
    const map: Record<string, string> = {
      'COMPLETE': 'status-hoàn-thành',
      'COMPLETE_NEEDREPAIR': 'status-cần-sửa-chữa',
      'COMPLETE_NEED_REPAIR': 'status-cần-sửa-chữa',
      'PENDING': 'status-đang-xử-lý',
      'REJECT': 'status-từ-chối',
      'REJECTED': 'status-từ-chối',
      'CHECKING': 'status-đang-xử-lý',
      'PENDING_ACCEPT': 'status-đang-xử-lý',
      'REPAIRING': 'status-đang-xử-lý',
      'CHECKED': 'status-hoàn-thành'
    };
    return map[status] || 'status-đang-xử-lý';
  };

  // Map trạng thái request -> nhãn tiếng Việt (cần biết loại request để hiển thị đúng)
  const getRequestStatusLabel = (status: string, requestType?: string) => {
    if (!status) return 'Không xác định';
    
    const map: Record<string, string> = {
      'PENDING': 'Thêm mới',
      'NEW_REQUEST': 'Thêm mới',
      'CHECKED': 'Chấp nhận',
      'GATE_IN': 'Đã vào cổng',
      'FORKLIFTING': requestType === 'EXPORT' ? 'Đang nâng container' : 'Đang hạ container',
      'DONE_LIFTING': 'Đã nâng xong',
      'GATE_OUT': 'Xe đã rời khỏi bãi',
      'IN_YARD': 'Đã hạ thành công', // Chỉ dành cho IMPORT
      'EMPTY_IN_YARD': 'Container trong bãi'
    };
    return map[status] || status;
  };

  // Map trạng thái request -> CSS class cho badge
  const getRequestStatusBadgeClass = (status: string) => {
    if (!status) return 'status-unknown';
    
    const map: Record<string, string> = {
      'PENDING': 'status-đang-xử-lý',
      'NEW_REQUEST': 'status-đang-xử-lý',
      'CHECKED': 'status-hoàn-thành',
      'GATE_IN': 'status-đang-xử-lý',
      'FORKLIFTING': 'status-đang-xử-lý',
      'DONE_LIFTING': 'status-hoàn-thành',
      'IN_YARD': 'status-hoàn-thành',
      'GATE_OUT': 'status-hoàn-thành',
      'EMPTY_IN_YARD': 'status-empty-in-yard'
    };
    return map[status] || 'status-unknown';
  };
  
  // Documents modal states
  const [isDocsOpen, setIsDocsOpen] = React.useState(false);
  const [selectedRequest, setSelectedRequest] = React.useState<{id: string, containerNo: string} | null>(null);
  const [attachments, setAttachments] = React.useState<any[]>([]);
  const [docsLoading, setDocsLoading] = React.useState(false);
  const [docsError, setDocsError] = React.useState<string | null>(null);

  // Repair images modal states
  const [isRepairImagesOpen, setIsRepairImagesOpen] = React.useState(false);
  const [selectedRepairTicket, setSelectedRepairTicket] = React.useState<{id: string, containerNo: string} | null>(null);
  const [repairImages, setRepairImages] = React.useState<any[]>([]);
  const [repairImagesLoading, setRepairImagesLoading] = React.useState(false);
  const [repairImagesError, setRepairImagesError] = React.useState<string | null>(null);

  // Dữ liệu bảng từ database
  const [tableData, setTableData] = React.useState<TableData[]>([]);
  const [allData, setAllData] = React.useState<TableData[]>([]); // Lưu tất cả dữ liệu để phân trang
  
  // State để theo dõi thời gian container mất vị trí
  const [containerPositionTimestamps, setContainerPositionTimestamps] = React.useState<Map<string, number>>(new Map());
  const [positionCheckInterval, setPositionCheckInterval] = React.useState<NodeJS.Timeout | null>(null);

  // Tính toán dữ liệu hiển thị dựa trên trang hiện tại
  const paginatedData = React.useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return allData.slice(startIndex, endIndex);
  }, [allData, currentPage, itemsPerPage]);

  // Cập nhật tableData khi paginatedData thay đổi
  React.useEffect(() => {
    setTableData(paginatedData);
  }, [paginatedData]);

  // Force refresh when route changes to ensure fresh data
  React.useEffect(() => {
    if (router.isReady) {
      setRefreshTrigger(prev => prev + 1);
    }
  }, [router.pathname, router.isReady]);

  // Additional refresh when route changes (using custom hook)
  React.useEffect(() => {
    setRefreshTrigger(prev => prev + 1);
  }, [routeRefreshKey]);

  // Fetch data when component mounts
  React.useEffect(() => {
    fetchImportRequests();
  }, [refreshTrigger, includeEmptyInYard]);

  // BỔ SUNG: Kiểm tra định kỳ container có vị trí trống và tự động xóa
  React.useEffect(() => {
    const checkPositionAndRemove = () => {
      const now = Date.now();
      const REMOVAL_DELAY = 5 * 60 * 1000; // 5 phút
      
      setAllData(prevData => {
        const updatedData = prevData.filter(container => {
          const hasPosition = container.yardName || container.blockCode || container.slotCode;
          
          if (!hasPosition) {
            // Container không có vị trí - kiểm tra thời gian
            const containerKey = container.containerNumber;
            const lastSeenWithPosition = containerPositionTimestamps.get(containerKey);
            
            if (lastSeenWithPosition) {
              const timeWithoutPosition = now - lastSeenWithPosition;
              if (timeWithoutPosition >= REMOVAL_DELAY) {
                console.log(`🗑️ Auto-removing container ${container.containerNumber} - no position for ${Math.round(timeWithoutPosition / 1000)}s`);
                return false; // Xóa container
              }
            } else {
              // Lần đầu tiên thấy container không có vị trí - ghi nhận thời gian
              setContainerPositionTimestamps(prev => {
                const newMap = new Map(prev);
                newMap.set(containerKey, now);
                return newMap;
              });
            }
          } else {
            // Container có vị trí - xóa khỏi danh sách theo dõi
            setContainerPositionTimestamps(prev => {
              const newMap = new Map(prev);
              newMap.delete(container.containerNumber);
              return newMap;
            });
          }
          
          return true; // Giữ lại container
        });
        
        return updatedData;
      });
    };

    // Kiểm tra mỗi 30 giây
    const interval = setInterval(checkPositionAndRemove, 30000);
    setPositionCheckInterval(interval);

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [containerPositionTimestamps]);

  // Cleanup interval khi component unmount
  React.useEffect(() => {
    return () => {
      if (positionCheckInterval) {
        clearInterval(positionCheckInterval);
      }
    };
  }, [positionCheckInterval]);

  // Documents modal functions
  const openDocuments = async (row: TableData) => {
    try {
      setSelectedRequest({ id: row.id, containerNo: row.containerNumber });
      setIsDocsOpen(true);
      setDocsLoading(true);
      setDocsError(null);
      const res = await requestService.getFiles(row.id);
      if (res.data?.success) {
        setAttachments(res.data.data || res.data.attachments || []);
      } else {
        setAttachments([]);
        setDocsError(res.data?.message || 'Không thể tải danh sách chứng từ');
      }
    } catch (err: any) {
      setDocsError(err.response?.data?.message || err.message || 'Có lỗi xảy ra khi tải chứng từ');
      setAttachments([]);
    } finally {
      setDocsLoading(false);
    }
  };

  const closeDocuments = () => {
    setIsDocsOpen(false);
    setSelectedRequest(null);
    setAttachments([]);
    setDocsError(null);
  };

  // Repair images modal functions
  const openRepairImages = async (row: TableData) => {
    if (!row.repairTicketId) {
      showSuccess('Không có phiếu sửa chữa cho container này', undefined, 2000);
      return;
    }
    
    try {
      setSelectedRepairTicket({ id: row.repairTicketId, containerNo: row.containerNumber });
      setIsRepairImagesOpen(true);
      setRepairImagesLoading(true);
      setRepairImagesError(null);
      const res = await maintenanceApi.getRepairImages(row.repairTicketId);
      if (res.success) {
        setRepairImages(res.data || []);
      } else {
        setRepairImages([]);
        setRepairImagesError('Không thể tải danh sách ảnh kiểm tra');
      }
    } catch (err: any) {
      setRepairImagesError(err.response?.data?.message || err.message || 'Có lỗi xảy ra khi tải ảnh kiểm tra');
      setRepairImages([]);
    } finally {
      setRepairImagesLoading(false);
    }
  };

  const closeRepairImages = () => {
    setIsRepairImagesOpen(false);
    setSelectedRepairTicket(null);
    setRepairImages([]);
    setRepairImagesError(null);
  };

  // Update modal states
  const [isUpdateModalOpen, setIsUpdateModalOpen] = React.useState(false);
  const [selectedRow, setSelectedRow] = React.useState<TableData | null>(null);
  const [customers, setCustomers] = React.useState<Customer[]>([]);
  const [shippingLines, setShippingLines] = React.useState<any[]>([]);
  const [containerTypes, setContainerTypes] = React.useState<any[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = React.useState<string>('');
  const [selectedShippingLineId, setSelectedShippingLineId] = React.useState<string>('');
  const [selectedContainerTypeId, setSelectedContainerTypeId] = React.useState<string>('');
  const [selectedStatus, setSelectedStatus] = React.useState<string>('');
  const [selectedSealNumber, setSelectedSealNumber] = React.useState<string>('');
  const [selectedDemDet, setSelectedDemDet] = React.useState<string>('');

  const handleUpdateInfo = async (row: TableData) => {
    setSelectedRow(row);
    setIsUpdateModalOpen(true);
    setSelectedCustomerId(''); // Reset customer selection
    setSelectedShippingLineId(''); // Reset shipping line selection
    setSelectedContainerTypeId(''); // Reset container type selection
    setSelectedStatus(row.containerQuality || 'GOOD'); // Set initial status
    setSelectedSealNumber(row.sealNumber || ''); // Set initial seal number
    setSelectedDemDet(row.demDet === 'Không có' ? '' : row.demDet || ''); // Set initial DEM/DET
    
    // Fetch customers, shipping lines, and container types when opening modal
    try {
      const [customersRes, shippingLinesRes, containerTypesRes] = await Promise.all([
        setupService.getCustomers({ limit: 1000 }),
        setupService.getShippingLines({ limit: 1000 }),
        setupService.getContainerTypes({ limit: 1000 })
      ]);
      
      if (customersRes.success && customersRes.data) {
        setCustomers(customersRes.data.data || []);
      }
      
      if (shippingLinesRes.success && shippingLinesRes.data) {
        setShippingLines(shippingLinesRes.data.data || []);
      }
      
      if (containerTypesRes.success && containerTypesRes.data) {
        setContainerTypes(containerTypesRes.data.data || []);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  const handleCancel = (id: string) => {
    // TODO: Implement cancel functionality
    console.log('Cancel for:', id);
    showSuccess('Đã hủy yêu cầu!', undefined, 2000);
  };

  // Pagination handlers
  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };


  // Function để fetch danh sách request và fill record theo yêu cầu
  const fetchImportRequests = async () => {
    setLoading(true);
    try {
      // Lấy cả IMPORT và EXPORT requests để hiển thị đầy đủ trạng thái
      // Loại bỏ containers đã hoàn thành hoặc bị reject để chỉ hiển thị containers đang trong quy trình quản lý
      const [importResponse, exportResponse] = await Promise.all([
        requestService.getRequests('IMPORT', undefined, 'PENDING,NEW_REQUEST,FORWARDED,GATE_IN,IN_YARD,IN_CAR,FORKLIFTING,CHECKED'),
        requestService.getRequests('EXPORT', undefined, 'PENDING,NEW_REQUEST,FORWARDED,GATE_IN,IN_YARD,IN_CAR,FORKLIFTING,CHECKED')
      ]);
      
      const importRequests = importResponse?.data?.success ? (importResponse.data.data || []) : [];
      const exportRequests = exportResponse?.data?.success ? (exportResponse.data.data || []) : [];
      let allRequests = [...importRequests, ...exportRequests];
      
      // FIXED: Không return sớm khi không có requests để vẫn hiển thị container SYSTEM_ADMIN_ADDED (như SA11)
      // Trước đây, khi không có IMPORT/EXPORT requests, hàm sẽ return sớm và không hiển thị container do SystemAdmin thêm
      // Bây giờ vẫn tiếp tục xử lý để lấy emptyInYardContainers (SYSTEM_ADMIN_ADDED)
      // if (allRequests.length === 0) {
      //   setTableData([]);
      //   return;
      // }

      // Nhóm requests theo container_no và chỉ lấy request mới nhất cho mỗi container
      const latestRequestsMap = new Map<string, any>();
      allRequests.forEach((req: any) => {
        const existingReq = latestRequestsMap.get(req.container_no);
        // Sử dụng updatedAt thay vì createdAt để lấy request được cập nhật gần nhất
        const reqTime = new Date(req.updatedAt || req.createdAt);
        const existingTime = new Date(existingReq?.updatedAt || existingReq?.createdAt);
        if (!existingReq || reqTime > existingTime) {
          latestRequestsMap.set(req.container_no, req);
        }
      });
      const requests = Array.from(latestRequestsMap.values());
      console.log('🔍 Raw requests data:', requests.map(r => ({
        id: r.id,
        container_no: r.container_no,
        status: r.status,
        type: r.type
      })));
      
      // Lấy container EMPTY_IN_YARD nếu được bật
      let emptyInYardContainers: ContainerItem[] = [];
      if (includeEmptyInYard) {
        try {
          console.log('🔍 Fetching containers in yard...');
          // BỔ SUNG: Lấy tất cả container trong yard, không chỉ SYSTEM_ADMIN_ADDED
          const emptyResponse = await reportsService.getContainers({
            // Không filter theo service_status để lấy tất cả container trong yard
            page: 1,
            pageSize: 200
          });
          emptyInYardContainers = emptyResponse.data.items || [];
          console.log('📦 Containers in yard found:', emptyInYardContainers.length);
          console.log('📋 Container details:', emptyInYardContainers.map(c => ({
            container_no: c.container_no,
            service_status: c.service_status,
            data_source: c.data_source,
            yard_name: c.yard_name,
            slot_code: c.slot_code
          })));
        } catch (error) {
          console.error('❌ Error fetching containers in yard:', error);
        }
      }

      // Lọc ra tất cả container đã có ServiceRequest để tránh trùng lặp
      const containersWithServiceRequests = new Set(
        requests.map((req: any) => req.container_no)
      );
      
      // Xử lý container trong yard - bao gồm cả container không có ServiceRequest và container có GATE_OUT
       const emptyInYardData: TableData[] = await Promise.all(
         emptyInYardContainers
           .filter((container: ContainerItem) => {
             // BỔ SUNG: Chỉ xử lý container có vị trí
             const hasPosition = container.yard_name || container.block_code || container.slot_code;
             if (!hasPosition) {
               console.log(`🗑️ Skipping EMPTY_IN_YARD container ${container.container_no} - no position data`);
               return false;
             }
             return !containersWithServiceRequests.has(container.container_no);
           })
           .map(async (container: ContainerItem) => {
             // Lấy thông tin từ ServiceRequest GATE_OUT nếu có
             let serviceRequestData: any = null;
             try {
               const gateOutResponse = await requestService.getRequests('IMPORT', 'GATE_OUT');
               if (gateOutResponse?.data?.success) {
                 const gateOutRequests = gateOutResponse.data.data || [];
                 const matchingRequest = gateOutRequests.find((req: any) => req.container_no === container.container_no);
                 if (matchingRequest) {
                   serviceRequestData = matchingRequest;
                   console.log(`🔍 Found GATE_OUT ServiceRequest for ${container.container_no}:`, serviceRequestData);
                 }
               }
             } catch (error) {
               console.log(`⚠️ Error fetching ServiceRequest for ${container.container_no}:`, error);
             }
             // Kiểm tra RepairTicket cho emptyInYard containers để giữ nguyên trạng thái
             let containerQuality: 'GOOD' | 'NEED_REPAIR' | 'UNKNOWN' = 'GOOD'; // Mặc định GOOD
             let repairTicketStatus: string | undefined = undefined;
             let repairTicketId: string | undefined = undefined;
             let repairImagesCount = 0;
             
             try {
               const tickets = await maintenanceApi.listRepairs({ container_no: container.container_no });
               if (tickets.data && tickets.data.length > 0) {
                 const latest = tickets.data[0];
                 repairTicketStatus = latest.status;
                 repairTicketId = latest.id;
                 
                 if (repairTicketStatus === 'COMPLETE') {
                   containerQuality = 'GOOD';
                 } else if (repairTicketStatus === 'COMPLETE_NEEDREPAIR' || repairTicketStatus === 'COMPLETE_NEED_REPAIR') {
                   containerQuality = 'NEED_REPAIR';
                 } else {
                   containerQuality = 'UNKNOWN';
                 }
                 
                 // Lấy số lượng ảnh kiểm tra
                 try {
                   const imgs = await maintenanceApi.getRepairImages(latest.id);
                   repairImagesCount = Array.isArray(imgs?.data) ? imgs.data.length : 0;
                 } catch {}
                 
                 console.log(`🔍 EmptyInYard container ${container.container_no}: RepairTicket=${repairTicketStatus}, Quality=${containerQuality}`);
               }
             } catch (error) {
               console.log(`⚠️ No repair tickets found for emptyInYard container ${container.container_no}`);
             }
             
             return {
               id: `empty_${container.container_no}`, // ID giả để phân biệt
               shippingLine: serviceRequestData?.shipping_line?.name || container.shipping_line?.name || '',
               containerNumber: container.container_no || '',
               containerType: serviceRequestData?.container_type?.code || container.container_type?.code || '',
               status: 'EMPTY_IN_YARD',
               repairTicketStatus: repairTicketStatus,
                customer: '', // Không tự động fill trường khách hàng
               documents: '',
               documentsCount: 0,
               repairImagesCount: repairImagesCount,
               repairTicketId: repairTicketId,
               position: (() => {
                 if (container.yard_name || container.block_code || container.slot_code) {
                   const pos = `${container.block_code || ''} / ${container.slot_code || ''}`;
                   return container.yard_name ? `${container.yard_name} • ${pos}` : pos;
                 }
                 return '';
               })(),
               yardName: container.yard_name,
               blockCode: container.block_code,
               slotCode: container.slot_code,
               sealNumber: serviceRequestData?.seal_number || container.seal_number || '',
               demDet: serviceRequestData?.dem_det || container.dem_det || '',
               containerQuality: containerQuality, // Sử dụng containerQuality từ RepairTicket
               requestType: serviceRequestData?.type || undefined // Sử dụng type từ ServiceRequest nếu có
             };
           })
       );

      const transformedData: TableData[] = await Promise.all(
        requests.map(async (request: any) => {
          console.log(`🔍 Processing container: ${request.container_no} (ID: ${request.id})`);
          console.log(`📋 Request details:`, {
            type: request.type,
            status: request.status,
            container_no: request.container_no
          });
          
          try {
          
          // Số ảnh kiểm tra: chỉ tính cho IMPORT bằng repair ticket
          let repairImagesCount = 0;
          let repairTicketId = '';
          let documentsCount = 0;
          let documentsList: any[] = [];
          let containerQuality: 'GOOD' | 'NEED_REPAIR' | 'UNKNOWN' = 'UNKNOWN';
          let repairTicketStatus: string | undefined = undefined;
          let demDetValue = '';
          
          // Không sử dụng emptyInYardContainers làm fallback cho request containers
          // vì chúng là hai loại container khác nhau
          
          if (request.type === 'IMPORT') {
            // Với IMPORT: lấy DEM/DET từ request, nếu không có thì hiển thị "Không có"
            demDetValue = request.dem_det || request.demDet || 'Không có';
            
            // Luôn ưu tiên lấy từ maintenanceApi (trạng thái mới nhất)
            try {
              console.log(`🔧 Fetching repair tickets for container: ${request.container_no}`);
              console.log(`🔧 API call: maintenanceApi.listRepairs({ container_no: '${request.container_no}', limit: 10 })`);
              
              // Debug: Kiểm tra token
              const token = localStorage.getItem('token');
              const refreshToken = localStorage.getItem('refresh_token');
              const userId = localStorage.getItem('user_id');
              console.log(`🔑 Auth tokens:`, {
                hasToken: !!token,
                hasRefreshToken: !!refreshToken,
                hasUserId: !!userId,
                tokenLength: token?.length || 0
              });
              
              const repairResponse = await maintenanceApi.listRepairs({
                container_no: request.container_no,
                limit: 10
              });
              
              console.log(`🔍 Raw repair response for ${request.container_no}:`, repairResponse);
              console.log(`🔍 Response type:`, typeof repairResponse);
              console.log(`🔍 Response has data:`, !!repairResponse?.data);
              console.log(`🔍 Response data type:`, typeof repairResponse?.data);
              console.log(`🔍 Response data is array:`, Array.isArray(repairResponse?.data));
              
              // Debug: Kiểm tra chi tiết response
              if (repairResponse?.data) {
                console.log(`🔍 Full response data for ${request.container_no}:`, JSON.stringify(repairResponse.data, null, 2));
              } else {
                console.log(`❌ No data in response for ${request.container_no}`);
              }
              
              const tickets = Array.isArray(repairResponse?.data) ? repairResponse.data : [];
              console.log(`📋 Found ${tickets.length} repair tickets for ${request.container_no}:`, tickets.map(t => ({ 
                id: t.id, 
                status: t.status, 
                container_no: t.container_no,
                createdAt: (t as any).createdAt,
                updatedAt: (t as any).updatedAt
              })));
              if (tickets.length > 0) {
                // Xếp hạng trạng thái để tie-break khi thiếu/giống thời gian
                const statusPriority: Record<string, number> = {
                  'COMPLETE': 4,
                  'COMPLETE_NEED_REPAIR': 3,
                  'COMPLETE_NEEDREPAIR': 3,
                  'PENDING': 2,
                  'CHECKING': 2,
                  'REPAIRING': 2,
                  'PENDING_ACCEPT': 2,
                  'CHECKED': 2,
                  'REJECT': 1,
                  'REJECTED': 1
                };
                // Sắp xếp theo updatedAt/createdAt giảm dần, nếu bằng nhau ưu tiên theo statusPriority
                tickets.sort((a: any, b: any) => {
                  const ta = new Date(a.updatedAt || a.createdAt || 0).getTime();
                  const tb = new Date(b.updatedAt || b.createdAt || 0).getTime();
                  if (tb !== ta) return tb - ta;
                  const pa = statusPriority[a.status] ?? 0;
                  const pb = statusPriority[b.status] ?? 0;
                  return pb - pa;
                });
                const latest = tickets[0];
                repairTicketId = latest.id;
                repairTicketStatus = latest.status;
                // Áp dụng logic: if repairTicket.status == COMPLETE then "Container tốt" else "Cần sửa chữa"
                // Chỉ áp dụng cho IMPORT requests
                if (repairTicketStatus === 'COMPLETE') {
                  containerQuality = 'GOOD';
                } else if (repairTicketStatus === 'COMPLETE_NEEDREPAIR' || repairTicketStatus === 'COMPLETE_NEED_REPAIR') {
                  containerQuality = 'NEED_REPAIR';
                } else {
                  containerQuality = 'UNKNOWN';
                }
                console.log(`✅ Selected repair ticket for ${request.container_no}: ID=${latest.id}, Status=${latest.status}, Quality=${containerQuality}`);
                try {
                  const imgs = await maintenanceApi.getRepairImages(latest.id);
                  repairImagesCount = Array.isArray(imgs?.data) ? imgs.data.length : 0;
                } catch {}
              } else {
                // Không có repair ticket cho IMPORT, hiển thị "Không xác định" (mặc định)
                containerQuality = 'UNKNOWN';
                repairTicketStatus = undefined; // Không set status khi không có repair ticket
                console.log(`⚠️ No repair tickets found for ${request.container_no}, using UNKNOWN status`);
                console.log(`⚠️ This means the container will show as "Không xác định"`);
              }
            } catch (error: any) {
              // Lỗi khi lấy repair ticket cho IMPORT, hiển thị "Không xác định" (mặc định)
              containerQuality = 'UNKNOWN';
              repairTicketStatus = undefined; // Không set status khi có lỗi
              console.log(`❌ Error fetching repair tickets for ${request.container_no}:`, error);
              console.log(`❌ Error details:`, {
                message: error?.message,
                stack: error?.stack,
                response: error?.response?.data,
                status: error?.response?.status,
                config: {
                  url: error?.config?.url,
                  method: error?.config?.method,
                  headers: error?.config?.headers
                }
              });
              console.log(`❌ Using GOOD status due to error`);
              console.log(`❌ This means the container will show as "CONTAINER TỐT"`);
            }
          } else if (request.type === 'EXPORT') {
            // Với EXPORT: mặc định là "Container tốt" (không áp dụng logic repair ticket)
            demDetValue = 'Không có';
            containerQuality = 'GOOD';
            repairTicketStatus = undefined; // Không set repair ticket status cho EXPORT
            console.log(`📦 EXPORT container ${request.container_no}: using GOOD status (no repair ticket logic)`);
          } else {
            // Không có request hoặc loại request không xác định: hiển thị "Container tốt"
            demDetValue = 'Không có';
            containerQuality = 'GOOD';
            repairTicketStatus = undefined; // Không set repair ticket status
            console.log(`❓ Unknown request type for ${request.container_no}: using GOOD status`);
          }

          // Đếm chứng từ thực tế của request (đồng nhất với modal)
          try {
            const filesRes = await requestService.getFiles(request.id);
            if (filesRes?.data?.success) {
              documentsList = filesRes.data.data || filesRes.data.attachments || [];
              documentsCount = documentsList.length;
            }
          } catch {}

          // Tính toán vị trí: ưu tiên dữ liệu từ request; nếu thiếu thì tra cứu từ Yard
          let yardNameCalc: string = request.yard_name || request.yard?.name || request.actual_location?.yard_name || '';
          let blockCodeCalc: string = request.block_code || request.actual_location?.block_code || '';
          let slotCodeCalc: string = request.slot_code || request.actual_location?.slot_code || '';

          if (!yardNameCalc && !blockCodeCalc && !slotCodeCalc && request.container_no) {
            try {
              const located = await yardApi.locate(String(request.container_no));
              yardNameCalc = located?.yard_name || located?.slot?.block?.yard?.name || yardNameCalc || '';
              blockCodeCalc = located?.block_code || located?.slot?.block?.code || blockCodeCalc || '';
              slotCodeCalc = located?.slot_code || located?.slot?.code || slotCodeCalc || '';
            } catch {}
          }

          const result = {
            id: request.id,
            shippingLine: request.shipping_line?.name || '',
            containerNumber: request.container_no || '',
            containerType: request.container_type?.code || '',
            status: request.status === 'DONE_LIFTING' ? 'GATE_OUT' : (request.status || ''),
            customer: '', // Không tự động fill trường khách hàng
            documents: documentsList.map((att: any) => att.file_name).join(', '),
            documentsCount,
            repairImagesCount,
            repairTicketId: repairTicketId || undefined,
            position: (() => {
              if (yardNameCalc || blockCodeCalc || slotCodeCalc) {
                const pos = `${blockCodeCalc || '-'} / ${slotCodeCalc || '-'}`;
                return yardNameCalc ? `${yardNameCalc} • ${pos}` : pos;
              }
              return '';
            })(),
            yardName: yardNameCalc,
            blockCode: blockCodeCalc,
            slotCode: slotCodeCalc,
            sealNumber: request.seal_number || request.seal_no || request.seal || '',
            demDet: demDetValue,
            containerQuality,
            repairTicketStatus,
            requestType: request.type // Thêm requestType để phân biệt IMPORT/EXPORT
          };
          
          console.log(`📊 Final result for ${request.container_no}:`, {
            containerNumber: result.containerNumber,
            status: result.status,
            repairTicketStatus: result.repairTicketStatus,
            containerQuality: result.containerQuality,
            repairTicketId: result.repairTicketId
          });
          
          // Debug: Kiểm tra kết quả cuối cùng
          const expectedLabel = getContainerStatusLabel(result.repairTicketStatus, result.containerQuality);
          console.log(`🎯 Container ${request.container_no} will display as:`, {
            repairTicketStatus: result.repairTicketStatus,
            containerQuality: result.containerQuality,
            expectedLabel: expectedLabel
          });
          
          return result;
          } catch (error) {
            console.error(`❌ Error processing container ${request.container_no}:`, error);
            // Trả về container với thông tin cơ bản nếu có lỗi
            return {
              id: request.id,
              shippingLine: request.shipping_line?.name || '',
              containerNumber: request.container_no || '',
              containerType: request.container_type?.code || '',
              status: request.status || '',
              customer: '', // Không tự động fill trường khách hàng
              documents: '',
              documentsCount: 0,
              repairImagesCount: 0,
              repairTicketId: undefined,
              position: '',
              yardName: '',
              blockCode: '',
              slotCode: '',
              sealNumber: request.seal_number || '',
              demDet: request.dem_det || '',
              containerQuality: 'GOOD' as const,
              repairTicketStatus: undefined,
              requestType: request.type // Thêm requestType cho error case
            };
          }
        })
      );

      // BỔ SUNG: Lọc chỉ container có vị trí trước khi filter theo trạng thái
      const serviceRequestContainersWithPosition = transformedData.filter(container => {
        const hasPosition = container.yardName || container.blockCode || container.slotCode;
        if (!hasPosition) {
          console.log(`🗑️ Skipping ServiceRequest container ${container.containerNumber} - no position data`);
        }
        return hasPosition;
      });

      // BỔ SUNG: Lọc ẩn các record có trạng thái request là PENDING, REJECTED
      // GATE_IN được giữ lại nếu container có vị trí trong yard
      const filteredTransformedData = serviceRequestContainersWithPosition.filter(container => {
        const requestStatus = container.status;
        const hasPosition = container.yardName || container.blockCode || container.slotCode;
        
        // Chỉ ẩn PENDING và REJECTED
        // GATE_IN được hiển thị nếu có vị trí trong yard
        const shouldHide = ['PENDING', 'REJECTED'].includes(requestStatus);
        
        if (shouldHide) {
          console.log(`🚫 Hiding container ${container.containerNumber} with status: ${requestStatus}`);
        } else if (requestStatus === 'GATE_IN' && hasPosition) {
          console.log(`✅ Showing GATE_IN container ${container.containerNumber} with position: ${container.yardName || 'N/A'}`);
        }
        
        return !shouldHide;
      });
      
      console.log('🔍 Filtering containers by request status (PENDING, REJECTED hidden; GATE_IN with position shown):');
      console.log('📊 Total requests before filter:', serviceRequestContainersWithPosition.length);
      console.log('📊 Total requests after filter:', filteredTransformedData.length);
      console.log('📋 All request statuses before filter:', serviceRequestContainersWithPosition.map(r => ({ 
        container: r.containerNumber, 
        status: r.status
      })));
      console.log('📋 Filtered requests by status:', filteredTransformedData.reduce((acc, req) => {
        acc[req.status] = (acc[req.status] || 0) + 1;
        return acc;
      }, {} as Record<string, number>));
      
      // Debug: Log chi tiết từng container sau khi xử lý
      console.log('🔍 Detailed container data after processing:');
      filteredTransformedData.forEach(container => {
        console.log(`Container ${container.containerNumber}:`, {
          repairTicketStatus: container.repairTicketStatus,
          containerQuality: container.containerQuality,
          status: container.status
        });
        
        // Debug: Kiểm tra logic hiển thị
        const statusLabel = getContainerStatusLabel(container.repairTicketStatus, container.containerQuality);
        
        console.log(`🎯 Container ${container.containerNumber} display logic:`, {
          repairTicketStatus: container.repairTicketStatus,
          containerQuality: container.containerQuality,
          statusLabel: statusLabel,
          willShowAs: statusLabel
        });
      });

      // Kết hợp dữ liệu từ filtered requests và EMPTY_IN_YARD containers
      const combinedData = [...filteredTransformedData, ...emptyInYardData];
      
      // Loại bỏ trùng lặp dựa trên containerNumber, ưu tiên ServiceRequest data
      const uniqueDataMap = new Map<string, TableData>();
      
      // Thêm EMPTY_IN_YARD data trước (ưu tiên thấp hơn)
      emptyInYardData.forEach(item => {
        if (!uniqueDataMap.has(item.containerNumber)) {
          uniqueDataMap.set(item.containerNumber, item);
        }
      });
      
      // Thêm ServiceRequest data sau (ưu tiên cao hơn, sẽ ghi đè EMPTY_IN_YARD)
      filteredTransformedData.forEach(item => {
        uniqueDataMap.set(item.containerNumber, item);
      });
      
      const finalData = Array.from(uniqueDataMap.values());
      
      // BỔ SUNG: Chỉ hiển thị container có vị trí (yardName, blockCode, hoặc slotCode)
      const finalContainersWithPosition = finalData.filter(container => {
        const hasPosition = container.yardName || container.blockCode || container.slotCode;
        if (!hasPosition) {
          console.log(`🗑️ Filtering out container ${container.containerNumber} - no position data`);
        }
        return hasPosition;
      });
      
      console.log('📊 Total data after combining:', finalData.length);
      console.log('📋 ServiceRequest data:', filteredTransformedData.length);
      console.log('📦 EMPTY_IN_YARD data:', emptyInYardData.length);
      console.log('🔄 Final unique data:', finalData.length);
      console.log('📍 Containers with position:', finalContainersWithPosition.length);
      
      // Lưu tất cả dữ liệu và cập nhật pagination (chỉ container có vị trí)
      setAllData(finalContainersWithPosition);
      setTotalItems(finalContainersWithPosition.length);
      
      // Reset về trang 1 khi có dữ liệu mới
      setCurrentPage(1);
    } catch (error) {
      console.error('Error fetching requests:', error);
      showSuccess('Có lỗi xảy ra khi tải dữ liệu', undefined, 2000);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style>{`
        /* Mobile scroll fix for ManagerCont page */
        @media (max-width: 768px) {
          body {
            overflow-y: auto !important;
            overflow-x: hidden !important;
            -webkit-overflow-scrolling: touch;
          }
          
          .container.depot-requests {
            overflow: visible !important;
            padding-bottom: 2rem;
          }
        }

        .search-filter-section {
          margin-bottom: 1.5rem;
        }

        .search-filter-container {
          background: #f8f9fa;
          border-radius: 8px;
          padding: 1rem 1.5rem;
          display: flex;
          align-items: center;
          gap: 1rem;
          flex-wrap: wrap;
        }

        .search-input-wrapper {
          position: relative;
          flex: 1;
          min-width: 300px;
        }

        .search-icon {
          position: absolute;
          left: 0.75rem;
          top: 50%;
          transform: translateY(-50%);
          color: #6b7280;
        }

        .search-input {
          width: 100%;
          padding: 0.75rem 0.75rem 0.75rem 2.5rem;
          border: 1px solid #d1d5db;
          border-radius: 6px;
          font-size: 0.875rem;
          background: white;
          transition: border-color 0.2s;
        }

        .search-input:focus {
          outline: none;
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }

        .filter-select {
          padding: 0.75rem 1rem;
          border: 1px solid #d1d5db;
          border-radius: 6px;
          font-size: 0.875rem;
          background: white;
          min-width: 180px;
          transition: border-color 0.2s;
          cursor: pointer;
        }

        .filter-select:focus {
          outline: none;
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }

        .btn {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.75rem 1.5rem;
          border: none;
          border-radius: 6px;
          font-size: 0.875rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
          text-decoration: none;
          white-space: nowrap;
        }

        .btn-primary {
          background: #10b981;
          color: white;
        }

        .btn-primary:hover {
          background: #059669;
          transform: translateY(-1px);
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        }

        .btn-light {
          background: #f8f9fa !important;
          color: #1e3a8a !important;
          border: 1px solid #d1d5db !important;
          font-weight: 500 !important;
        }

        .btn-light:hover {
          background: #e5e7eb !important;
          border-color: #9ca3af !important;
          color: #1e40af !important;
        }

        .btn-secondary {
          background: #6b7280;
          color: white;
        }

        .btn-secondary:hover {
          background: #4b5563;
        }

        /* Specific styling for documents button */
        .data-table .btn-light {
          background: #f8f9fa !important;
          color: #1e3a8a !important;
          border: 1px solid #d1d5db !important;
          font-weight: 500 !important;
        }

        .data-table .btn-light:hover {
          background: #e5e7eb !important;
          border-color: #9ca3af !important;
          color: #1e40af !important;
        }

        .table-section {
          margin-top: 1.5rem;
        }

        .table-container {
          background: white;
          border-radius: 12px;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
          overflow: hidden;
        }

        .table-wrapper {
          overflow-x: auto;
        }

        .data-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 0.875rem;
        }

        .data-table th {
          background: #f3f4f6;
          padding: 0.75rem 0.5rem;
          text-align: left;
          font-weight: 600;
          color: #374151;
          border-bottom: 2px solid #e5e7eb;
          white-space: nowrap;
          position: sticky;
          top: 0;
          z-index: 10;
        }

        .data-table td {
          padding: 0.75rem 0.5rem;
          border-bottom: 1px solid #e5e7eb;
          vertical-align: middle;
          white-space: nowrap;
        }

        .data-table tr:hover {
          background: #f9fafb;
        }

        .status-badge {
          display: inline-block;
          padding: 0.25rem 0.5rem;
          border-radius: 0.375rem;
          font-size: 0.75rem;
          font-weight: 500;
          text-transform: uppercase;
        }

        .status-đang-xử-lý {
          background: #fef3c7;
          color: #92400e;
        }

        .status-hoàn-thành {
          background: #d1fae5;
          color: #065f46;
        }

        .status-empty-in-yard {
          background: #fef3c7;
          color: #92400e;
        }

        .status-done-lifting {
          background: #dbeafe;
          color: #1e40af;
        }

        .status-unknown {
          background: #f3f4f6;
          color: #6b7280;
        }


        .action-buttons {
          display: flex;
          gap: 0.5rem;
          align-items: center;
        }

        .btn-sm {
          padding: 0.375rem 0.5rem;
          font-size: 0.75rem;
          border-radius: 0.375rem;
          border: none;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 0.25rem;
          transition: all 0.2s;
        }

        .btn-primary {
          background: #3b82f6;
          color: white;
        }

        .btn-primary:hover {
          background: #2563eb;
        }

        .btn-danger {
          background: #ef4444;
          color: white;
        }

        .btn-danger:hover {
          background: #dc2626;
        }

        .loading-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 3rem;
          color: #6b7280;
        }

        .loading-spinner {
          width: 40px;
          height: 40px;
          border: 4px solid #f3f4f6;
          border-top: 4px solid #3b82f6;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin-bottom: 1rem;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .no-data {
          text-align: center;
          padding: 3rem;
          color: #6b7280;
          font-style: italic;
        }

        @media (max-width: 768px) {
          .search-filter-container {
            padding: 0.75rem;
            flex-direction: column;
            gap: 0.75rem;
          }

          .search-input-wrapper {
            min-width: 100%;
          }

          .filter-select {
            min-width: 100%;
          }

          .btn {
            width: 100%;
            justify-content: center;
          }
        }

        @media (max-width: 1200px) {
          .data-table th,
          .data-table td {
            padding: 0.5rem 0.25rem;
            font-size: 0.75rem;
          }
        }
      `}</style>
      <Header />
      <main className="container depot-requests">
        {/* Page Header */}
        <div className="page-header modern-header">
          <div className="header-content">
            <div className="header-left">
              <h1 className="page-title gradient gradient-ultimate">Quản lý container</h1>
            </div>

            <div className="header-actions">
            </div>
          </div>
        </div>

        {/* Search and Filter Section */}
        <div className="search-filter-section">
          <div className="search-filter-container">
              <div className="search-input-wrapper">
                <svg className="search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="11" cy="11" r="8"></circle>
                  <path d="m21 21-4.35-4.35"></path>
                </svg>
                <input
                  type="text"
                  className="search-input"
                  placeholder="Tìm kiếm theo mã container"
                  value={localSearch}
                  onChange={(e) => setLocalSearch(e.target.value)}
                />
            </div>
            
                <select
                  className="filter-select"
                  value={localStatus}
                  onChange={(e) => setLocalStatus(e.target.value)}
                >
                  <option value="all">Tất cả trạng thái</option>
                  <option value="active">Hoạt động</option>
                  <option value="inactive">Không hoạt động</option>
                </select>
                
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', whiteSpace: 'nowrap', color: '#6b7280', fontSize: '14px' }}>
                  <input
                    type="checkbox"
                    checked={includeEmptyInYard}
                    onChange={(e) => setIncludeEmptyInYard(e.target.checked)}
                    style={{ margin: 0 }}
                  />
                  Bao gồm container rỗng trong bãi (tự động bật)
                </label>
          </div>
        </div>

        {/* Table Section */}
        <div className="table-section">
          <div className="table-container">
            
            <div className="table-wrapper">
              {loading ? (
                <div className="loading-container">
                  <div className="loading-spinner"></div>
                  <p>Đang tải dữ liệu...</p>
                </div>
              ) : (
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Hãng tàu</th>
                      <th>Số Cont</th>
                      <th>Loại Cont</th>
                      <th>Trạng thái</th>
                      <th style={{ display: 'none' }}>Trạng thái Request</th>
                      <th>Hình ảnh</th>
                      <th>Vị trí</th>
                      <th>Số seal</th>
                      <th>Khách hàng</th>
                      <th>DEM/DET</th>
                      <th>Hành động</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tableData.length === 0 ? (
                      <tr>
                        <td colSpan={10} className="no-data">
                          Không có dữ liệu
                        </td>
                      </tr>
                    ) : (
                      tableData.map((row) => (
                        <tr key={row.id}>
                          <td>{row.shippingLine}</td>
                          <td>{row.containerNumber}</td>
                          <td>{row.containerType}</td>
                          <td>
                            {(() => {
                              const statusLabel = getContainerStatusLabel(row.repairTicketStatus, row.containerQuality);
                              const badgeClass = getStatusBadgeClass(row.repairTicketStatus, row.containerQuality);
                              console.log(`🎨 Rendering status for ${row.containerNumber}:`, {
                                repairTicketStatus: row.repairTicketStatus,
                                containerQuality: row.containerQuality,
                                statusLabel: statusLabel,
                                badgeClass: badgeClass
                              });
                              return (
                                <span className={`status-badge ${badgeClass}`}>
                                  {statusLabel}
                                </span>
                              );
                            })()}
                          </td>
                          <td style={{ display: 'none' }}>
                            <span className={`status-badge ${getRequestStatusBadgeClass(row.status)}`}>
                              {getRequestStatusLabel(row.status, row.requestType)}
                            </span>
                          </td>
                          <td>
                            <div style={{ display: 'flex', gap: '8px', flexDirection: 'column' }}>
                              <button
                                type="button"
                                className="btn btn-sm btn-light"
                                onClick={() => openRepairImages(row)}
                                title="Xem ảnh kiểm tra"
                                style={{ padding: '4px 8px', fontSize: '12px', width: '100%' }}
                              >
                                {(row.repairImagesCount ?? 0)} ảnh kiểm tra
                              </button>
                              <button
                                type="button"
                                className="btn btn-sm btn-light"
                                onClick={() => openDocuments(row)}
                                title="Xem chứng từ"
                                style={{ padding: '4px 8px', fontSize: '12px', width: '100%' }}
                              >
                                {(row.documentsCount ?? 0)} chứng từ
                              </button>
                            </div>
                          </td>
                          <td>
                            <div style={{display:'flex', flexDirection:'column'}}>
                              <span>{row.yardName || ''}</span>
                              <small className="muted">{row.blockCode || ''} / {row.slotCode || ''}</small>
                            </div>
                          </td>
                          <td>{row.sealNumber || 'Không có'}</td>
                          <td>{row.customer || ''}</td>
                          <td>{row.demDet || ''}</td>
                          <td>
                            <button
                              className="btn btn-sm btn-primary"
                              onClick={() => handleUpdateInfo(row)}
                              title="Cập nhật thông tin"
                            >
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                              </svg>
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>

        {/* Pagination */}
        {totalItems > itemsPerPage && (
          <div className="pagination-container" style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            marginTop: '1.5rem',
            padding: '1rem',
            background: 'white',
            borderRadius: '8px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
          }}>
            <div style={{ color: '#6b7280', fontSize: '14px' }}>
              Hiển thị {((currentPage - 1) * itemsPerPage) + 1} - {Math.min(currentPage * itemsPerPage, totalItems)} trong tổng số {totalItems} container
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <button
                onClick={handlePrevPage}
                disabled={currentPage === 1}
                style={{
                  padding: '0.5rem 1rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  background: currentPage === 1 ? '#f9fafb' : 'white',
                  color: currentPage === 1 ? '#9ca3af' : '#374151',
                  cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                  fontSize: '14px',
                  fontWeight: '500'
                }}
              >
                Trước
              </button>
              
              <div style={{ display: 'flex', gap: '0.25rem' }}>
                {Array.from({ length: Math.ceil(totalItems / itemsPerPage) }, (_, i) => i + 1).map(page => (
                  <button
                    key={page}
                    onClick={() => handlePageChange(page)}
                    style={{
                      padding: '0.5rem 0.75rem',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      background: currentPage === page ? '#3b82f6' : 'white',
                      color: currentPage === page ? 'white' : '#374151',
                      cursor: 'pointer',
                      fontSize: '14px',
                      fontWeight: '500',
                      minWidth: '40px'
                    }}
                  >
                    {page}
                  </button>
                ))}
              </div>
              
              <button
                onClick={handleNextPage}
                disabled={currentPage === Math.ceil(totalItems / itemsPerPage)}
                style={{
                  padding: '0.5rem 1rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  background: currentPage === Math.ceil(totalItems / itemsPerPage) ? '#f9fafb' : 'white',
                  color: currentPage === Math.ceil(totalItems / itemsPerPage) ? '#9ca3af' : '#374151',
                  cursor: currentPage === Math.ceil(totalItems / itemsPerPage) ? 'not-allowed' : 'pointer',
                  fontSize: '14px',
                  fontWeight: '500'
                }}
              >
                Sau
              </button>
            </div>
          </div>
        )}

        {/* Documents Modal */}
        {isDocsOpen && (
          <div
            style={{
              position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
              background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(2px)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100
            }}
            onClick={closeDocuments}
          >
            <div
              style={{ background: '#fff', borderRadius: 12, width: '720px', maxWidth: '95vw', maxHeight: '85vh', overflow: 'auto', boxShadow: '0 20px 40px rgba(0,0,0,0.25)' }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid #e5e7eb' }}>
                <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>Chứng từ - {selectedRequest?.containerNo || ''}</h3>
                <button onClick={closeDocuments} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer' }}>×</button>
              </div>
              <div style={{ padding: 20 }}>
                {docsLoading ? (
                  <div style={{ textAlign: 'center', color: '#64748b' }}>Đang tải...</div>
                ) : docsError ? (
                  <div style={{ color: '#ef4444' }}>{docsError}</div>
                ) : attachments.length === 0 ? (
                  <div style={{ color: '#64748b' }}>Không có chứng từ</div>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    {attachments.map((f, idx) => (
                      <div key={f.id || idx} style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: 12, display: 'flex', alignItems: 'center', gap: 12 }}>
                        {f.file_type === 'image' ? (
                          <img src={f.storage_url} alt={f.file_name} style={{ width: 64, height: 64, objectFit: 'cover', borderRadius: 6, border: '1px solid #e5e7eb' }} />
                        ) : (
                          <div style={{ width: 64, height: 64, border: '1px solid #e5e7eb', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}>PDF</div>
                        )}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontWeight: 600, color: '#111827', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.file_name}</div>
                          <div style={{ fontSize: 12, color: '#6b7280' }}>{Math.round((f.file_size || 0) / 1024)} KB</div>
                          <a href={f.storage_url} target="_blank" rel="noreferrer" style={{ fontSize: 12 }}>Mở</a>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div style={{ padding: 12, borderTop: '1px solid #e5e7eb', display: 'flex', justifyContent: 'flex-end' }}>
                <button className="btn btn-secondary" onClick={closeDocuments}>Đóng</button>
              </div>
            </div>
          </div>
        )}

        {/* Repair Images Modal */}
        {isRepairImagesOpen && (
          <div
            style={{
              position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
              background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(2px)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100
            }}
            onClick={closeRepairImages}
          >
            <div
              style={{ background: '#fff', borderRadius: 12, width: '720px', maxWidth: '95vw', maxHeight: '85vh', overflow: 'auto', boxShadow: '0 20px 40px rgba(0,0,0,0.25)' }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid #e5e7eb' }}>
                <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>Ảnh kiểm tra - {selectedRepairTicket?.containerNo || ''}</h3>
                <button onClick={closeRepairImages} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer' }}>×</button>
              </div>
              <div style={{ padding: 20 }}>
                {repairImagesLoading ? (
                  <div style={{ textAlign: 'center', color: '#64748b' }}>Đang tải...</div>
                ) : repairImagesError ? (
                  <div style={{ color: '#ef4444' }}>{repairImagesError}</div>
                ) : repairImages.length === 0 ? (
                  <div style={{ color: '#64748b' }}>Không có ảnh kiểm tra</div>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    {repairImages.map((img, idx) => (
                      <div key={img.id || idx} style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: 12, display: 'flex', alignItems: 'center', gap: 12 }}>
                        <img src={img.storage_url} alt={img.file_name} style={{ width: 64, height: 64, objectFit: 'cover', borderRadius: 6, border: '1px solid #e5e7eb' }} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontWeight: 600, color: '#111827', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{img.file_name}</div>
                          <div style={{ fontSize: 12, color: '#6b7280' }}>{Math.round((img.file_size || 0) / 1024)} KB</div>
                          <a href={img.storage_url} target="_blank" rel="noreferrer" style={{ fontSize: 12 }}>Mở</a>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div style={{ padding: 12, borderTop: '1px solid #e5e7eb', display: 'flex', justifyContent: 'flex-end' }}>
                <button className="btn btn-secondary" onClick={closeRepairImages}>Đóng</button>
              </div>
            </div>
          </div>
        )}

        {/* Update Modal */}
        {isUpdateModalOpen && selectedRow && (
          <div
            style={{
              position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
              background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(2px)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100
            }}
            onClick={() => {
              setIsUpdateModalOpen(false);
              setSelectedRow(null);
              setSelectedCustomerId('');
              setSelectedShippingLineId('');
              setSelectedContainerTypeId('');
              setSelectedStatus('');
              setSelectedSealNumber('');
              setSelectedDemDet('');
            }}
          >
            <div
              style={{ background: '#fff', borderRadius: 12, width: '600px', maxWidth: '95vw', maxHeight: '85vh', overflow: 'auto', boxShadow: '0 20px 40px rgba(0,0,0,0.25)' }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid #e5e7eb' }}>
                <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>Cập nhật thông tin - {selectedRow.containerNumber}</h3>
                <button 
                  onClick={() => {
                    setIsUpdateModalOpen(false);
                    setSelectedRow(null);
                    setSelectedCustomerId('');
                    setSelectedShippingLineId('');
                    setSelectedContainerTypeId('');
                    setSelectedStatus('');
                    setSelectedSealNumber('');
                    setSelectedDemDet('');
                  }} 
                  style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer' }}
                >×</button>
              </div>
              <div style={{ padding: 20 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: 8, fontWeight: 600 }}>Hãng tàu</label>
                    <select
                      value={selectedShippingLineId}
                      onChange={(e) => setSelectedShippingLineId(e.target.value)}
                      disabled={selectedRow.shippingLine && selectedRow.shippingLine.trim() !== ''}
                      style={{ 
                        width: '100%', 
                        padding: '8px 12px', 
                        border: '1px solid #d1d5db', 
                        borderRadius: 6,
                        maxHeight: '200px',
                        overflowY: 'auto',
                        backgroundColor: (selectedRow.shippingLine && selectedRow.shippingLine.trim() !== '') ? '#f9fafb' : 'white',
                        color: (selectedRow.shippingLine && selectedRow.shippingLine.trim() !== '') ? '#6b7280' : '#374151',
                        cursor: (selectedRow.shippingLine && selectedRow.shippingLine.trim() !== '') ? 'not-allowed' : 'pointer'
                      }}
                    >
                      <option value="">{selectedRow.shippingLine || 'Chưa có hãng tàu'}</option>
                      {shippingLines.map((shippingLine) => (
                        <option key={shippingLine.id} value={shippingLine.id}>
                          {shippingLine.code} - {shippingLine.name}
                        </option>
                      ))}
                    </select>
                    <div style={{ marginTop: 4, fontSize: '12px', color: '#6b7280' }}>
                      {(selectedRow.shippingLine && selectedRow.shippingLine.trim() !== '') 
                        ? '🔒 Không thể chỉnh sửa hãng tàu (đã có dữ liệu)' 
                        : 'Có thể cập nhật hãng tàu mới'}
                    </div>
                  </div>
                  
                  <div>
                    <label style={{ display: 'block', marginBottom: 8, fontWeight: 600 }}>Loại container</label>
                    <select
                      value={selectedContainerTypeId}
                      onChange={(e) => setSelectedContainerTypeId(e.target.value)}
                      disabled={selectedRow.containerType && selectedRow.containerType.trim() !== ''}
                      style={{ 
                        width: '100%', 
                        padding: '8px 12px', 
                        border: '1px solid #d1d5db', 
                        borderRadius: 6,
                        maxHeight: '200px',
                        overflowY: 'auto',
                        backgroundColor: (selectedRow.containerType && selectedRow.containerType.trim() !== '') ? '#f9fafb' : 'white',
                        color: (selectedRow.containerType && selectedRow.containerType.trim() !== '') ? '#6b7280' : '#374151',
                        cursor: (selectedRow.containerType && selectedRow.containerType.trim() !== '') ? 'not-allowed' : 'pointer'
                      }}
                    >
                      <option value="">{selectedRow.containerType || 'Chưa có loại container'}</option>
                      {containerTypes.map((containerType) => (
                        <option key={containerType.id} value={containerType.id}>
                          {containerType.code} - {containerType.description}
                        </option>
                      ))}
                    </select>
                    <div style={{ marginTop: 4, fontSize: '12px', color: '#6b7280' }}>
                      {(selectedRow.containerType && selectedRow.containerType.trim() !== '') 
                        ? '🔒 Không thể chỉnh sửa loại container (đã có dữ liệu)' 
                        : 'Có thể cập nhật loại container mới'}
                    </div>
                  </div>
                  
                  <div>
                    <label style={{ display: 'block', marginBottom: 8, fontWeight: 600 }}>Khách hàng</label>
                    <select
                      value={selectedCustomerId}
                      onChange={(e) => setSelectedCustomerId(e.target.value)}
                      style={{ 
                        width: '100%', 
                        padding: '8px 12px', 
                        border: '1px solid #d1d5db', 
                        borderRadius: 6,
                        maxHeight: '200px',
                        overflowY: 'auto'
                      }}
                    >
                      <option value="">{selectedRow.customer || 'Chưa có khách hàng'}</option>
                      {customers.map((customer) => (
                        <option key={customer.id} value={customer.id}>
                          {customer.code} - {customer.name}
                        </option>
                      ))}
                    </select>
                    <div style={{ marginTop: 4, fontSize: '12px', color: '#6b7280' }}>
                      {selectedCustomerId ? 'Sẽ cập nhật khách hàng khi lưu' : 'Giữ nguyên khách hàng hiện tại'}
                    </div>
                  </div>
                   <div>
                     <label style={{ display: 'block', marginBottom: 8, fontWeight: 600 }}>Số seal</label>
                     <input
                       type="text"
                       value={selectedSealNumber}
                       onChange={(e) => {
                         // Cho phép nhập text tự do, không giới hạn chỉ số
                         setSelectedSealNumber(e.target.value);
                       }}
                       disabled={false}
                       style={{ 
                         width: '100%', 
                         padding: '8px 12px', 
                         border: '1px solid #d1d5db', 
                         borderRadius: 6,
                         backgroundColor: 'white',
                         color: '#374151',
                         cursor: 'text'
                       }}
                       placeholder="Nhập số seal (có thể là text hoặc số)"
                     />
                     <div style={{ 
                       fontSize: 12, 
                       color: '#6b7280', 
                       marginTop: 4,
                       display: 'flex',
                       alignItems: 'center',
                       gap: '4px'
                     }}>
                       💡 Có thể nhập số seal dạng text hoặc số (không bắt buộc)
                     </div>
                   </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: 8, fontWeight: 600 }}>DEM/DET (dd/mm/yyyy)</label>
                    <input
                      type="text"
                      value={selectedDemDet}
                      onChange={(e) => {
                        // Format input to dd/mm/yyyy
                        let value = e.target.value.replace(/\D/g, '');
                        if (value.length >= 2) {
                          value = value.substring(0, 2) + '/' + value.substring(2);
                        }
                        if (value.length >= 5) {
                          value = value.substring(0, 5) + '/' + value.substring(5, 9);
                        }
                        setSelectedDemDet(value);
                      }}
                      placeholder="dd/mm/yyyy"
                      style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: 6 }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: 8, fontWeight: 600 }}>Trạng thái</label>
                    <select
                      value={selectedStatus}
                      onChange={(e) => setSelectedStatus(e.target.value)}
                      style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: 6 }}
                    >
                      <option value="GOOD">Container tốt</option>
                      <option value="NEED_REPAIR">Cần sửa chữa</option>
                    </select>
                  </div>
                </div>
              </div>
              <div style={{ padding: 12, borderTop: '1px solid #e5e7eb', display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                <button 
                  className="btn btn-primary"
                  onClick={async () => {
                    try {
                      if (selectedRow?.containerNumber) {
                        console.log('🔄 Updating container:', selectedRow.containerNumber, 'with customer:', selectedCustomerId);
                        
                        // Gọi API cập nhật thông tin container
                        const updateData: any = {};
                        
                        // Debug: Log các giá trị để kiểm tra
                        console.log('🔍 Debug update data:');
                        console.log('  selectedCustomerId:', selectedCustomerId);
                        console.log('  selectedShippingLineId:', selectedShippingLineId);
                        console.log('  selectedContainerTypeId:', selectedContainerTypeId);
                        console.log('  selectedStatus:', selectedStatus, 'vs selectedRow.containerQuality:', selectedRow.containerQuality);
                        console.log('  selectedSealNumber:', selectedSealNumber, 'vs selectedRow.sealNumber:', selectedRow.sealNumber);
                        console.log('  selectedDemDet:', selectedDemDet, 'vs selectedRow.demDet:', selectedRow.demDet);
                        
                        // Luôn cập nhật nếu có giá trị được chọn (không cần so sánh)
                        if (selectedCustomerId && selectedCustomerId !== '') {
                          updateData.customer_id = selectedCustomerId;
                        }
                        if (selectedShippingLineId && selectedShippingLineId !== '') {
                          updateData.shipping_line_id = selectedShippingLineId;
                        }
                        if (selectedContainerTypeId && selectedContainerTypeId !== '') {
                          updateData.container_type_id = selectedContainerTypeId;
                        }
                        if (selectedStatus && selectedStatus !== '') {
                          updateData.container_quality = selectedStatus;
                        }
                        if (selectedSealNumber && selectedSealNumber.trim() !== '') {
                          // Cho phép cập nhật seal number mà không cần bắt buộc có hãng tàu
                          updateData.seal_number = selectedSealNumber;
                        }
                        if (selectedDemDet && selectedDemDet.trim() !== '') {
                          updateData.dem_det = selectedDemDet;
                        }
                        
                        console.log('📤 Update data to send:', updateData);
                        
                        const response = await containersApi.update(selectedRow.containerNumber, updateData);
                        console.log('✅ API response:', response);

                        // Cập nhật số lượng đã xuất seal nếu có nhập số seal mới và có hãng tàu
                        if (selectedSealNumber && selectedSealNumber !== selectedRow.sealNumber && selectedSealNumber.trim() !== '') {
                          try {
                            // Lấy tên hãng tàu từ selectedShippingLineId hoặc từ selectedRow
                            let shippingCompanyName = '';
                            if (selectedShippingLineId) {
                              const shippingLine = shippingLines.find(sl => sl.id === selectedShippingLineId);
                              shippingCompanyName = shippingLine?.name || '';
                            } else if (selectedRow.shippingLine) {
                              shippingCompanyName = selectedRow.shippingLine;
                            }

                            if (shippingCompanyName) {
                              console.log('🔄 Updating seal exported quantity for shipping company:', shippingCompanyName);
                              await sealsApi.incrementExportedQuantity(
                                shippingCompanyName,
                                selectedSealNumber,
                                selectedRow.containerNumber,
                                selectedRow.id // Sử dụng request ID để lấy booking từ ServiceRequest
                              );
                              console.log('✅ Seal exported quantity updated successfully');
                            } else {
                              console.log('ℹ️ Seal number updated but no shipping company found - skipping seal quantity update');
                            }
                          } catch (sealError: any) {
                            console.error('❌ Error updating seal exported quantity:', sealError);
                            // Không hiển thị lỗi seal để không làm gián đoạn quá trình cập nhật container
                            // Chỉ log để debug
                          }
                        }
                        
                         // Cập nhật local state cho allData - chỉ cập nhật các trường có thay đổi
                         const updatedAllData = allData.map(item => {
                           if (item.containerNumber === selectedRow.containerNumber) {
                             const updatedItem = { ...item };
                             
                             // Chỉ cập nhật nếu có giá trị mới
                             if (selectedCustomerId && selectedCustomerId !== '') {
                               const customerName = customers.find(c => c.id === selectedCustomerId)?.name;
                               if (customerName) {
                                 updatedItem.customer = customerName;
                               }
                             }
                             if (selectedShippingLineId && selectedShippingLineId !== '') {
                               updatedItem.shippingLine = shippingLines.find(sl => sl.id === selectedShippingLineId)?.name || item.shippingLine;
                             }
                             if (selectedContainerTypeId && selectedContainerTypeId !== '') {
                               updatedItem.containerType = containerTypes.find(ct => ct.id === selectedContainerTypeId)?.code || item.containerType;
                             }
                             if (selectedStatus && selectedStatus !== '') {
                               updatedItem.containerQuality = selectedStatus as "GOOD" | "NEED_REPAIR" | "UNKNOWN";
                             }
                             if (selectedSealNumber && selectedSealNumber.trim() !== '') {
                               updatedItem.sealNumber = selectedSealNumber;
                             }
                             if (selectedDemDet && selectedDemDet.trim() !== '') {
                               updatedItem.demDet = selectedDemDet;
                             }
                             
                             return updatedItem;
                           }
                           return item;
                         });
                        setAllData(updatedAllData);
                        
                        // Không cần refresh data từ server vì đã cập nhật local state
                        // await fetchImportRequests(); // Comment out để tránh ghi đè local state
                        
                        const updatedFields = [];
                        if (selectedCustomerId && selectedCustomerId !== '') updatedFields.push('khách hàng');
                        if (selectedShippingLineId && selectedShippingLineId !== '') updatedFields.push('hãng tàu');
                        if (selectedContainerTypeId && selectedContainerTypeId !== '') updatedFields.push('loại container');
                        if (selectedStatus !== selectedRow.containerQuality) updatedFields.push('trạng thái');
                        if (selectedSealNumber !== selectedRow.sealNumber) updatedFields.push('số seal');
                        if (selectedDemDet !== (selectedRow.demDet === 'Không có' ? '' : selectedRow.demDet || '')) updatedFields.push('DEM/DET');
                        
                        if (updatedFields.length > 0) {
                          showSuccess(`Cập nhật thông tin thành công! Đã cập nhật: ${updatedFields.join(', ')}.`, undefined, 2000);
                        }
                      }
                      
                      setIsUpdateModalOpen(false);
                      setSelectedRow(null);
                      setSelectedCustomerId('');
                      setSelectedShippingLineId('');
                      setSelectedContainerTypeId('');
                      setSelectedStatus('');
                      setSelectedSealNumber('');
                      setSelectedDemDet('');
                    } catch (error) {
                      console.error('❌ Error updating container:', error);
                      showError('Có lỗi xảy ra khi cập nhật thông tin!', undefined, 3000);
                    }
                  }}
                >
                  Lưu
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Toast Container */}
        <ToastContainer />
      </main>
    </>
  );
}