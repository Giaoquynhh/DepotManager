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

  // Map trạng thái request -> nhãn tiếng Việt
  const getRequestStatusLabel = (status: string) => {
    if (!status) return 'Không xác định';
    const map: Record<string, string> = {
      'PENDING': 'Thêm mới',
      'CHECKED': 'Chấp nhận',
      'GATE_IN': 'Đã vào cổng',
      'FORKLIFTING': 'Đang hạ container',
      'IN_YARD': 'Đã hạ thành công',
      'GATE_OUT': 'Xe đã rời khỏi bãi'
    };
    return map[status] || status;
  };

  // Map trạng thái request -> CSS class cho badge
  const getRequestStatusBadgeClass = (status: string) => {
    if (!status) return 'status-unknown';
    const map: Record<string, string> = {
      'PENDING': 'status-đang-xử-lý',
      'CHECKED': 'status-hoàn-thành',
      'GATE_IN': 'status-đang-xử-lý',
      'FORKLIFTING': 'status-đang-xử-lý',
      'IN_YARD': 'status-hoàn-thành',
      'GATE_OUT': 'status-hoàn-thành'
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
      showSuccess('Không có phiếu sửa chữa cho container này');
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
  const [selectedCustomerId, setSelectedCustomerId] = React.useState<string>('');
  const [selectedStatus, setSelectedStatus] = React.useState<string>('');
  const [selectedSealNumber, setSelectedSealNumber] = React.useState<string>('');
  const [selectedDemDet, setSelectedDemDet] = React.useState<string>('');

  const handleUpdateInfo = async (row: TableData) => {
    setSelectedRow(row);
    setIsUpdateModalOpen(true);
    setSelectedCustomerId(''); // Reset customer selection
    setSelectedStatus(row.containerQuality || 'GOOD'); // Set initial status
    setSelectedSealNumber(row.sealNumber || ''); // Set initial seal number
    setSelectedDemDet(row.demDet === 'Không có' ? '' : row.demDet || ''); // Set initial DEM/DET
    
    // Fetch customers when opening modal
    try {
      const response = await setupService.getCustomers({ limit: 1000 });
      if (response.success && response.data) {
        setCustomers(response.data.data || []);
      }
    } catch (error) {
      console.error('Error fetching customers:', error);
    }
  };

  const handleCancel = (id: string) => {
    // TODO: Implement cancel functionality
    console.log('Cancel for:', id);
    showSuccess('Đã hủy yêu cầu!');
  };


  // Function để fetch danh sách request và fill record theo yêu cầu
  const fetchImportRequests = async () => {
    setLoading(true);
    try {
      // Chỉ lấy IMPORT requests, không lấy EXPORT requests
      const response = await requestService.getRequests('IMPORT');
      if (!response?.data?.success) {
        setTableData([]);
        return;
      }

      const requests: any[] = response.data.data || [];
      
      // Lấy container EMPTY_IN_YARD nếu được bật
      let emptyInYardContainers: ContainerItem[] = [];
      if (includeEmptyInYard) {
        try {
          console.log('🔍 Fetching EMPTY_IN_YARD containers...');
          const emptyResponse = await reportsService.getContainers({
            service_status: 'SYSTEM_ADMIN_ADDED',
            page: 1,
            pageSize: 200
          });
          emptyInYardContainers = emptyResponse.data.items || [];
          console.log('📦 EMPTY_IN_YARD containers found:', emptyInYardContainers.length);
          console.log('📋 Container details:', emptyInYardContainers.map(c => ({
            container_no: c.container_no,
            service_status: c.service_status,
            data_source: c.data_source,
            yard_name: c.yard_name,
            slot_code: c.slot_code
          })));
        } catch (error) {
          console.error('❌ Error fetching EMPTY_IN_YARD containers:', error);
        }
      }

      // Xử lý container EMPTY_IN_YARD - hiển thị "Container tốt" vì không có request
      const emptyInYardData: TableData[] = emptyInYardContainers.map((container: ContainerItem) => ({
        id: `empty_${container.container_no}`, // ID giả để phân biệt
        shippingLine: container.shipping_line?.name || '',
        containerNumber: container.container_no || '',
        containerType: container.container_type?.code || '',
        status: 'EMPTY_IN_YARD',
        repairTicketStatus: undefined, // Không có repair ticket cho empty containers
        customer: container.customer?.name || '',
        documents: '',
        documentsCount: 0,
        repairImagesCount: 0,
        repairTicketId: undefined,
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
        sealNumber: container.seal_number || '',
        demDet: container.dem_det || '',
        containerQuality: 'GOOD' as const // Không có request nên hiển thị "Container tốt"
      }));

      const transformedData: TableData[] = await Promise.all(
        requests.map(async (request: any) => {
          console.log(`🔍 Processing container: ${request.container_no} (ID: ${request.id})`);
          console.log(`📋 Request details:`, {
            type: request.type,
            status: request.status,
            container_no: request.container_no
          });
          
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
                createdAt: t.createdAt,
                updatedAt: t.updatedAt
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
                containerQuality = (repairTicketStatus === 'COMPLETE') ? 'GOOD' : 'NEED_REPAIR';
                console.log(`✅ Selected repair ticket for ${request.container_no}: ID=${latest.id}, Status=${latest.status}, Quality=${containerQuality}`);
                try {
                  const imgs = await maintenanceApi.getRepairImages(latest.id);
                  repairImagesCount = Array.isArray(imgs?.data) ? imgs.data.length : 0;
                } catch {}
              } else {
                // Không có repair ticket cho IMPORT, hiển thị "Cần sửa chữa" theo yêu cầu
                containerQuality = 'NEED_REPAIR';
                repairTicketStatus = undefined; // Không set status khi không có repair ticket
                console.log(`⚠️ No repair tickets found for ${request.container_no}, using NEED_REPAIR status`);
                console.log(`⚠️ This means the container will show as "CẦN SỬA CHỮA"`);
              }
            } catch (error) {
              // Lỗi khi lấy repair ticket cho IMPORT, hiển thị "Cần sửa chữa" theo yêu cầu
              containerQuality = 'NEED_REPAIR';
              repairTicketStatus = undefined; // Không set status khi có lỗi
              console.log(`❌ Error fetching repair tickets for ${request.container_no}:`, error);
              console.log(`❌ Error details:`, {
                message: error.message,
                stack: error.stack,
                response: error.response?.data,
                status: error.response?.status,
                config: {
                  url: error.config?.url,
                  method: error.config?.method,
                  headers: error.config?.headers
                }
              });
              console.log(`❌ Using NEED_REPAIR status due to error`);
              console.log(`❌ This means the container will show as "CẦN SỬA CHỮA"`);
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
            status: request.status || '',
            customer: request.customer?.name || '',
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
            repairTicketStatus
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
        })
      );

      // Lọc container theo trạng thái request: chỉ hiển thị CHECKED, FORKLIFTING, IN_YARD, GATE_OUT
      const allowedStatuses = ['CHECKED', 'FORKLIFTING', 'IN_YARD', 'GATE_OUT'];
      const filteredTransformedData = transformedData.filter(request => 
        allowedStatuses.includes(request.status)
      );
      
      console.log('🔍 Filtering containers by request status:');
      console.log('📊 Total requests before filter:', transformedData.length);
      console.log('📊 Total requests after filter:', filteredTransformedData.length);
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
      const allData = [...filteredTransformedData, ...emptyInYardData];
      console.log('📊 Total data after combining:', allData.length);
      console.log('📋 ServiceRequest data:', filteredTransformedData.length);
      console.log('📦 EMPTY_IN_YARD data:', emptyInYardData.length);
      setTableData(allData);
    } catch (error) {
      console.error('Error fetching requests:', error);
      showSuccess('Có lỗi xảy ra khi tải dữ liệu');
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
                      <th>Trạng thái Request</th>
                      <th>Hình ảnh</th>
                      <th>Vị trí</th>
                      <th>Số seal</th>
                      <th>Khách hàng</th>
                      <th>DEM/DET</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tableData.length === 0 ? (
                      <tr>
                        <td colSpan={11} className="no-data">
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
                          <td>
                            <span className={`status-badge ${getRequestStatusBadgeClass(row.status)}`}>
                              {getRequestStatusLabel(row.status)}
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
                          <td>{row.sealNumber || ''}</td>
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
                  }} 
                  style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer' }}
                >×</button>
              </div>
              <div style={{ padding: 20 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
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
                      onChange={(e) => setSelectedSealNumber(e.target.value)}
                      style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: 6 }}
                    />
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
                  className="btn btn-secondary" 
                  onClick={() => {
                    setIsUpdateModalOpen(false);
                    setSelectedRow(null);
                    setSelectedCustomerId('');
                    setSelectedStatus('');
                    setSelectedSealNumber('');
                    setSelectedDemDet('');
                  }}
                >
                  Hủy
                </button>
                <button 
                  className="btn btn-primary"
                  onClick={async () => {
                    try {
                      if (selectedRow?.containerNumber) {
                        console.log('🔄 Updating container:', selectedRow.containerNumber, 'with customer:', selectedCustomerId);
                        
                        // Gọi API cập nhật thông tin container
                        const updateData: any = {};
                        if (selectedCustomerId) {
                          updateData.customer_id = selectedCustomerId;
                        }
                        if (selectedStatus !== selectedRow.containerQuality) {
                          updateData.container_quality = selectedStatus;
                        }
                        if (selectedSealNumber !== selectedRow.sealNumber) {
                          updateData.seal_number = selectedSealNumber;
                        }
                        if (selectedDemDet !== (selectedRow.demDet === 'Không có' ? '' : selectedRow.demDet || '')) {
                          updateData.dem_det = selectedDemDet;
                        }
                        
                        const response = await containersApi.update(selectedRow.containerNumber, updateData);
                        console.log('✅ API response:', response);
                        
                        // Cập nhật local state
                        const updatedData = tableData.map(item => 
                          item.containerNumber === selectedRow.containerNumber 
                            ? { 
                                ...item, 
                                customer: selectedCustomerId ? customers.find(c => c.id === selectedCustomerId)?.name || item.customer : item.customer,
                                containerQuality: selectedStatus !== selectedRow.containerQuality ? selectedStatus as "GOOD" | "NEED_REPAIR" | "UNKNOWN" : item.containerQuality,
                                sealNumber: selectedSealNumber !== selectedRow.sealNumber ? selectedSealNumber : item.sealNumber,
                                demDet: selectedDemDet !== (selectedRow.demDet === 'Không có' ? '' : selectedRow.demDet || '') ? selectedDemDet : item.demDet
                              }
                            : item
                        );
                        setTableData(updatedData);
                        
                        if (selectedCustomerId) {
                          showSuccess(`Cập nhật thông tin thành công! Khách hàng đã được cập nhật.`);
                        } else {
                          showSuccess('Cập nhật thông tin thành công!');
                        }
                      }
                      
                      setIsUpdateModalOpen(false);
                      setSelectedRow(null);
                      setSelectedCustomerId('');
                      setSelectedStatus('');
                      setSelectedSealNumber('');
                      setSelectedDemDet('');
                    } catch (error) {
                      console.error('❌ Error updating container:', error);
                      showError('Có lỗi xảy ra khi cập nhật thông tin!');
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
