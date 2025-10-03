import { PrismaClient } from '@prisma/client';
import { GateAcceptData, GateRejectData, GateSearchParams, GateApproveData } from '../dto/GateDtos';
import { audit } from '../../../shared/middlewares/audit';

const prisma = new PrismaClient();

export class GateService {

  /**
   * Forward request từ Kho sang Gate
   */
  async forwardRequest(requestId: string, actorId: string): Promise<any> {
    const request = await prisma.serviceRequest.findUnique({
      where: { id: requestId },
      include: { docs: true }
    });

    if (!request) {
      throw new Error('Request không tồn tại');
    }

    if (request.status !== 'SCHEDULED') {
      throw new Error('Chỉ có thể forward request có trạng thái SCHEDULED');
    }

    const updatedRequest = await prisma.serviceRequest.update({
      where: { id: requestId },
      data: {
        status: 'FORWARDED',
        forwarded_at: new Date(),
        forwarded_by: actorId
      }
    });

    // Audit log
    await audit(actorId, 'REQUEST.FORWARDED', 'ServiceRequest', requestId, {
      previous_status: request.status,
      new_status: 'FORWARDED'
    });

    return updatedRequest;
  }

  /**
   * Gate chấp nhận xe vào (chuyển từ GATE_IN sang CHECKED)
   */
  async acceptGate(requestId: string, actorId: string, driverInfo: GateAcceptData): Promise<any> {
    const request = await prisma.serviceRequest.findUnique({
      where: { id: requestId }
    });

    if (!request) {
      throw new Error('Request không tồn tại');
    }

    if (request.status !== 'GATE_IN') {
      throw new Error('Chỉ có thể chấp nhận request có trạng thái GATE_IN');
    }

    const updatedRequest = await prisma.serviceRequest.update({
      where: { id: requestId },
      data: {
        status: 'CHECKED',
        gate_checked_at: new Date(),
        gate_checked_by: actorId,
        driver_name: driverInfo.driver_name,
        license_plate: driverInfo.license_plate,
        history: {
          ...(request.history as any || {}),
          gate_accept: {
            driver_name: driverInfo.driver_name,
            license_plate: driverInfo.license_plate,
            accepted_at: new Date().toISOString()
          }
        }
      }
    });

    // Audit log
    await audit(actorId, 'REQUEST.GATE_ACCEPTED', 'ServiceRequest', requestId, {
      previous_status: request.status,
      new_status: 'CHECKED',
      driver_info: driverInfo
    });

    return updatedRequest;
  }

  /**
   * Gate approve request (chuyển từ FORWARDED sang GATE_IN)
   */
  async approveGate(requestId: string, actorId: string, data?: GateApproveData): Promise<any> {
    const request = await prisma.serviceRequest.findUnique({
      where: { id: requestId },
      include: { docs: true }
    });

    if (!request) {
      throw new Error('Request không tồn tại');
    }

    if (request.status !== 'FORWARDED') {
      throw new Error('Chỉ có thể approve request có trạng thái FORWARDED');
    }

    // Luôn chuyển sang GATE_IN cho cả IMPORT và EXPORT
    const newStatus = 'GATE_IN';

    const currentTime = new Date();
    
    const updatedRequest = await prisma.serviceRequest.update({
      where: { id: requestId },
      data: {
        status: newStatus,
        gate_checked_at: currentTime,
        gate_checked_by: actorId,
        // Tự động điền thời gian vào khi chuyển sang GATE_IN
        time_in: currentTime,
        // Lưu thông tin tài xế và biển số xe
        driver_name: data?.driver_name || null,
        license_plate: data?.license_plate || null,
        history: {
          ...(request.history as any || {}),
          gate_approve: {
            ...(request as any).history?.gate_approve,
            driver_name: data?.driver_name || null,
            license_plate: data?.license_plate || null,
            approved_at: currentTime.toISOString(),
            time_in: currentTime.toISOString()
          }
        }
      }
    });

    // Tự động tạo ForkliftTask cho EXPORT requests khi chuyển sang GATE_IN
    if (request.type === 'EXPORT' && request.container_no) {
      try {
        await this.createForkliftTaskForExport(request.container_no, actorId);
      } catch (error) {
        console.error('Error creating forklift task for export:', error);
        // Không throw error để không ảnh hưởng đến việc approve gate
      }
    }

    // Audit log
    await audit(actorId, 'REQUEST.GATE_APPROVED', 'ServiceRequest', requestId, {
      previous_status: request.status,
      new_status: newStatus,
      request_type: request.type,
      license_plate: data?.license_plate || undefined
    });

    return updatedRequest;
  }

  /**
   * Tự động tạo ForkliftTask cho EXPORT requests khi chuyển sang GATE_IN
   */
  private async createForkliftTaskForExport(containerNo: string, actorId: string): Promise<void> {
    // Kiểm tra xem đã có ForkliftTask ACTIVE cho container này chưa
    const existingActiveTask = await prisma.forkliftTask.findFirst({
      where: { 
        container_no: containerNo,
        status: { in: ['PENDING', 'ASSIGNED', 'IN_PROGRESS', 'PENDING_APPROVAL'] }
      }
    });

    if (existingActiveTask) {
      console.log(`Active ForkliftTask already exists for container ${containerNo}`);
      return;
    }

    // Tìm vị trí hiện tại của container trong yard
    const currentLocation = await prisma.yardPlacement.findFirst({
      where: { 
        container_no: containerNo, 
        status: { in: ['HOLD', 'OCCUPIED'] } 
      },
      include: { 
        slot: { 
          include: { 
            block: { 
              include: { 
                yard: true 
              } 
            } 
          } 
        } 
      }
    });

    // Kiểm tra container có trong bãi không
    if (!currentLocation) {
      console.log(`Container ${containerNo} not found in yard, cannot create forklift task`);
      return;
    }

    // Tìm hoặc tạo slot đặc biệt cho gate (vị trí đích)
    let gateSlot = await prisma.yardSlot.findFirst({
      where: { 
        code: 'GATE_EXPORT',
        block: {
          code: 'GATE'
        }
      }
    });

    // Nếu chưa có slot gate, tạo mới
    if (!gateSlot) {
      // Tìm hoặc tạo yard và block cho gate
      let gateYard = await prisma.yard.findFirst({
        where: { name: 'Gate Yard' }
      });

      if (!gateYard) {
        gateYard = await prisma.yard.create({
          data: { name: 'Gate Yard' }
        });
      }

      let gateBlock = await prisma.yardBlock.findFirst({
        where: { 
          yard_id: gateYard.id,
          code: 'GATE'
        }
      });

      if (!gateBlock) {
        gateBlock = await prisma.yardBlock.create({
          data: {
            yard_id: gateYard.id,
            code: 'GATE'
          }
        });
      }

      gateSlot = await prisma.yardSlot.create({
        data: {
          block_id: gateBlock.id,
          code: 'GATE_EXPORT',
          status: 'RESERVED',
          kind: 'EXPORT',
          near_gate: 10, // Ưu tiên cao cho gate
          avoid_main: 0,
          is_odd: false
        }
      });
    }

    // Tạo ForkliftTask mới với đầy đủ thông tin
    const forkliftTask = await prisma.forkliftTask.create({
      data: {
        container_no: containerNo,
        from_slot_id: currentLocation?.slot_id || null, // Vị trí hiện tại của container trong yard
        to_slot_id: gateSlot.id, // Vị trí đích: Gate
        status: 'PENDING',
        assigned_driver_id: null,
        created_by: actorId,
        cost: 0
      }
    });

    // Audit log
    await audit(actorId, 'FORKLIFT.AUTO_CREATED', 'ForkliftTask', forkliftTask.id, {
      container_no: containerNo,
      trigger: 'GATE_IN_EXPORT',
      from_slot_id: currentLocation?.slot_id || null,
      to_slot_id: gateSlot.id,
      task_purpose: 'Move container from yard to gate for export'
    });

    console.log(`Auto-created ForkliftTask ${forkliftTask.id} for container ${containerNo} from ${currentLocation?.slot_id || 'unknown'} to ${gateSlot.id}`);
  }

  /**
   * Gate reject request
   */
  async rejectGate(requestId: string, actorId: string, rejectData: GateRejectData): Promise<any> {
    const request = await prisma.serviceRequest.findUnique({
      where: { id: requestId }
    });

    if (!request) {
      throw new Error('Request không tồn tại');
    }

    if (request.status !== 'FORWARDED') {
      throw new Error('Chỉ có thể từ chối request có trạng thái FORWARDED');
    }

    const updatedRequest = await prisma.serviceRequest.update({
      where: { id: requestId },
      data: {
        status: 'REJECTED',
        gate_checked_at: new Date(),
        gate_checked_by: actorId,
        gate_reason: rejectData.reason,
        rejected_reason: rejectData.reason,
        rejected_by: actorId,
        rejected_at: new Date()
      }
    });

    // Audit log
    await audit(actorId, 'REQUEST.GATE_REJECTED', 'ServiceRequest', requestId, {
      previous_status: request.status,
      new_status: 'REJECTED',
      reason: rejectData.reason
    });

    return updatedRequest;
  }

  /**
   * Tìm kiếm requests ở Gate
   */
  async searchRequests(params: GateSearchParams, actorId: string): Promise<any> {
    const { status, statuses, container_no, license_plate, type, page = 1, limit = 20 } = params;
    const skip = (page - 1) * limit;

    console.log('🔍 GateService.searchRequests - Input params:', params);

    const where: any = { depot_deleted_at: null, customer_deleted_at: null };

    // Xử lý status filter
    if (status) {
      // Nếu có status cụ thể, sử dụng nó
      where.status = status;
    } else if (statuses) {
      // Nếu có statuses (comma-separated), split và sử dụng
      const statusArray = statuses.split(',').map(s => s.trim());
      where.status = { in: statusArray };
    } else {
      // Default: bao gồm PENDING để thấy yêu cầu mới tạo ở LowerContainer, loại bỏ GATE_OUT vì đã được lưu trong lịch sử
      where.status = { in: ['PENDING', 'NEW_REQUEST', 'FORWARDED', 'IN_YARD', 'IN_CAR', 'GATE_IN', 'CHECKED'] };
    }

    if (container_no && container_no.trim()) {
      where.container_no = { contains: container_no.trim(), mode: 'insensitive' };
    }

    if (license_plate && license_plate.trim()) {
      where.license_plate = { contains: license_plate.trim(), mode: 'insensitive' };
    }

    if (type && type.trim()) {
      where.type = type.trim();
    }

    console.log('🔍 GateService.searchRequests - Final where clause:', where);
    console.log('🔍 GateService.searchRequests - Pagination:', { skip, limit, page });

    const [requests, total] = await Promise.all([
      prisma.serviceRequest.findMany({
        where,
        include: {
          docs: true,
          attachments: true,
          container_type: {
            select: {
              code: true
            }
          }
        },
        orderBy: { forwarded_at: 'desc' },
        skip,
        take: limit
      }),
      prisma.serviceRequest.count({ where })
    ]);

    console.log('🔍 GateService.searchRequests - Found requests:', requests.length);
    console.log('🔍 GateService.searchRequests - Total count:', total);

    // Với các IMPORT đã GATE_IN, tự động tạo RepairTicket nếu chưa có và đính kèm thông tin vào payload trả về
    const mapped = await Promise.all(requests.map(async (r: any) => {
      let repairTicket: any = null;
      if (r.type === 'IMPORT' && r.status === 'GATE_IN' && r.container_no) {
        // Tìm repair ticket theo container_no
        repairTicket = await prisma.repairTicket.findFirst({
          where: { container_no: r.container_no },
          orderBy: { createdAt: 'desc' }
        });

        // Nếu chưa có thì tạo mới
        if (!repairTicket) {
          const code = `RT-${new Date().toISOString().replace(/[-:TZ.]/g, '').slice(0, 14)}-${Math.floor(Math.random()*1000)}`;
          repairTicket = await prisma.repairTicket.create({
            data: {
              code,
              container_no: r.container_no,
              created_by: r.created_by || actorId,
              problem_description: 'Auto-created from Gate (GATE_IN)'
            }
          });
        }
      }

      // Ưu tiên sử dụng trường từ database, fallback về history nếu cần
      const licensePlate = r.license_plate || (r.history as any)?.gate_approve?.license_plate || null;
      const driverName = r.driver_name || (r.history as any)?.gate_approve?.driver_name || null;
      const driverPhone = r.driver_phone || null;
      
      return { 
        ...r, 
        license_plate: licensePlate, 
        driver_name: driverName,
        driver_phone: driverPhone,
        service_type: 'Nâng', // Loại dịch vụ là "Nâng" theo yêu cầu
        request_no: r.request_no || null,
        booking_bill: r.booking_bill || null,
        appointment_time: r.appointment_time || null,
        isCheck: r.isCheck || false,
        isRepair: r.isRepair || false,
        isPaid: r.is_paid || false, // Thêm field isPaid để frontend kiểm tra
        repair_ticket_id: repairTicket?.id || null,
        repair_ticket_code: repairTicket?.code || null,
        repair_ticket_status: repairTicket?.status || null
      };
    }));

    return {
      data: mapped,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }

  /**
   * Gate OUT - Xe rời kho
   * - Cho phép: IN_YARD, IN_CAR, FORKLIFTING (Import)
   */
  async gateOut(requestId: string, actorId: string): Promise<any> {
    const request = await prisma.serviceRequest.findUnique({
      where: { id: requestId }
    });

    if (!request) {
      throw new Error('Request không tồn tại');
    }

    // Cho phép từ IN_YARD hoặc IN_CAR; mở rộng: FORKLIFTING đối với Import
    const allowFromForklifting = request.type === 'IMPORT' && request.status === 'FORKLIFTING';
    const allowCommon = request.status === 'IN_YARD' || request.status === 'IN_CAR';
    if (!allowCommon && !allowFromForklifting) {
      throw new Error(`Không thể chuyển từ trạng thái ${request.status} sang GATE_OUT. Chỉ cho phép từ IN_YARD, IN_CAR hoặc FORKLIFTING (nhập khẩu).`);
    }

    const currentTime = new Date();
    
    const updatedRequest = await prisma.serviceRequest.update({
      where: { id: requestId },
      data: {
        status: 'GATE_OUT',
        // Tự động điền thời gian ra khi chuyển sang GATE_OUT
        time_out: currentTime,
        history: {
          ...(request.history as any || {}),
          gate_out: {
            previous_status: request.status,
            gate_out_at: currentTime.toISOString(),
            gate_out_by: actorId,
            time_out: currentTime.toISOString()
          }
        }
      }
    });

    // Audit log
    await audit(actorId, 'REQUEST.GATE_OUT', 'ServiceRequest', requestId, {
      previous_status: request.status,
      new_status: 'GATE_OUT',
      request_type: request.type
    });

    return updatedRequest;
  }

  /**
   * Lấy chi tiết request để xử lý ở Gate
   */
  async getRequestDetails(requestId: string): Promise<any> {
    const request = await prisma.serviceRequest.findUnique({
      where: { id: requestId },
      include: {
        docs: true,
        attachments: true
      }
    });

    if (!request) {
      throw new Error('Request không tồn tại');
    }

    // Ưu tiên sử dụng trường từ database, fallback về history nếu cần
    const licensePlate = request.license_plate || (request.history as any)?.gate_approve?.license_plate || null;
    const driverName = request.driver_name || (request.history as any)?.gate_approve?.driver_name || null;
    return { ...request, license_plate: licensePlate, driver_name: driverName };
  }

  /**
   * Validate thông tin tài xế với chứng từ
   */
  private async validateDriverInfo(request: any, driverInfo: GateAcceptData): Promise<boolean> {
    // TODO: Implement validation logic
    // So sánh container_no, seal number, booking info với chứng từ
    return true; // Tạm thời return true
  }

  /**
   * Lấy danh sách chứng từ của request
   */
  async getRequestDocuments(requestId: string): Promise<any> {
    console.log('🔍 GateService.getRequestDocuments - Input requestId:', requestId);
    
    // Tìm request theo ID hoặc request_no
    const request = await prisma.serviceRequest.findFirst({
      where: {
        OR: [
          { id: requestId },
          { request_no: requestId }
        ]
      },
      include: {
        attachments: {
          where: { deleted_at: null },
          orderBy: { uploaded_at: 'desc' }
        }
      }
    });

    if (!request) {
      console.log('❌ Không tìm thấy request với ID/request_no:', requestId);
      throw new Error('Request không tồn tại');
    }

    console.log('✅ Tìm thấy request:', {
      id: request.id,
      request_no: request.request_no,
      container_no: request.container_no,
      attachments_count: request.attachments.length
    });

    return {
      request_id: request.id,
      request_no: request.request_no,
      container_no: request.container_no,
      documents: request.attachments.map(att => ({
        id: att.id,
        type: att.file_type,
        name: att.file_name,
        size: att.file_size,
        version: 1,
        created_at: att.uploaded_at,
        storage_key: att.storage_url
      }))
    };
  }

  /**
   * Xem file chứng từ
   */
  async viewDocument(requestId: string, documentId: string): Promise<any> {
    // Kiểm tra request tồn tại
    const request = await prisma.serviceRequest.findUnique({
      where: { id: requestId }
    });

    if (!request) {
      throw new Error('Request không tồn tại');
    }

    // Lấy thông tin document
    const document = await prisma.documentFile.findFirst({
      where: {
        id: documentId,
        request_id: requestId,
        deleted_at: null
      }
    });

    if (!document) {
      throw new Error('Chứng từ không tồn tại');
    }

    // Đọc file từ storage
    const fs = require('fs');
    const path = require('path');
    
    try {
      const filePath = path.join(__dirname, '../../../uploads', document.storage_key);
      
      if (!fs.existsSync(filePath)) {
        throw new Error('File không tồn tại trên server');
      }

      const fileBuffer = fs.readFileSync(filePath);
      const contentType = this.getContentType(document.name);

      return {
        fileName: document.name,
        contentType,
        fileBuffer,
        size: document.size
      };
    } catch (error: any) {
      const errorMessage = error instanceof Error ? error.message : 'Lỗi không xác định';
      throw new Error('Không thể đọc file: ' + errorMessage);
    }
  }

  /**
   * Xác định content type của file
   */
  private getContentType(fileName: string): string {
    const ext = fileName.split('.').pop()?.toLowerCase();
    
    switch (ext) {
      case 'pdf':
        return 'application/pdf';
      case 'png':
        return 'image/png';
      case 'jpg':
      case 'jpeg':
        return 'image/jpeg';
      case 'gif':
        return 'image/gif';
      case 'doc':
        return 'application/msword';
      case 'docx':
        return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
      case 'xls':
        return 'application/vnd.ms-excel';
      case 'xlsx':
        return 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
      default:
        return 'application/octet-stream';
    }
  }

  /**
   * Check-in - Xe vào cổng từ trạng thái NEW_REQUEST
   */
  async checkIn(requestId: string, actorId: string): Promise<any> {
    const request = await prisma.serviceRequest.findUnique({
      where: { id: requestId }
    });

    if (!request) {
      throw new Error('Request không tồn tại');
    }

    if (request.status !== 'NEW_REQUEST' && request.status !== 'PENDING') {
      throw new Error('Chỉ có thể Check-in từ trạng thái NEW_REQUEST hoặc PENDING');
    }

    const currentTime = new Date();
    
    const updatedRequest = await prisma.serviceRequest.update({
      where: { id: requestId },
      data: {
        status: 'GATE_IN',
        gate_checked_at: currentTime,
        gate_checked_by: actorId,
        time_in: currentTime,
        history: {
          ...(request.history as any || {}),
          check_in: {
            checked_in_at: currentTime.toISOString(),
            checked_in_by: actorId,
            time_in: currentTime.toISOString()
          }
        }
      }
    });

    // Nếu là yêu cầu Nâng (EXPORT), tự động tạo ForkliftTask khi xe đã vào cổng
    if (request.type === 'EXPORT' && request.container_no) {
      try {
        await this.createForkliftTaskForExport(request.container_no, actorId);
      } catch (error) {
        console.error('Error auto-creating forklift task on check-in:', error);
      }
    }

    // Audit log
    await audit(actorId, 'REQUEST.CHECK_IN', 'ServiceRequest', requestId, {
      previous_status: request.status,
      new_status: 'GATE_IN',
      request_type: request.type
    });

    return updatedRequest;
  }

  /**
   * Check-out - Xe rời cổng từ trạng thái NEW_REQUEST
   */
  async checkOut(requestId: string, actorId: string): Promise<any> {
    const request = await prisma.serviceRequest.findUnique({
      where: { id: requestId }
    });

    if (!request) {
      throw new Error('Request không tồn tại');
    }

    if (request.status !== 'NEW_REQUEST' && request.status !== 'PENDING') {
      throw new Error('Chỉ có thể Check-out từ trạng thái NEW_REQUEST hoặc PENDING');
    }

    const currentTime = new Date();
    
    const updatedRequest = await prisma.serviceRequest.update({
      where: { id: requestId },
      data: {
        status: 'GATE_OUT',
        gate_checked_at: currentTime,
        gate_checked_by: actorId,
        time_out: currentTime,
        history: {
          ...(request.history as any || {}),
          check_out: {
            checked_out_at: currentTime.toISOString(),
            checked_out_by: actorId,
            time_out: currentTime.toISOString()
          }
        }
      }
    });

    // Audit log
    await audit(actorId, 'REQUEST.CHECK_OUT', 'ServiceRequest', requestId, {
      previous_status: request.status,
      new_status: 'GATE_OUT',
      request_type: request.type
    });

    return updatedRequest;
  }

  /**
   * Lấy lịch sử xe ra vào cổng
   */
  async getGateHistory(params: any): Promise<any> {
    const {
      container_no,
      driver_name,
      license_plate,
      page = 1,
      limit = 20,
      // Bỏ mặc định theo status; trang lịch sử cần tất cả xe đã có time_in
      status,
      type // Thêm filter theo type (IMPORT/EXPORT)
    } = params;

    // Convert string to number for pagination
    const pageNum = parseInt(page.toString(), 10);
    const limitNum = parseInt(limit.toString(), 10);
    const skip = (pageNum - 1) * limitNum;

    // Tạo điều kiện where
    const where: any = {
      // Trang lịch sử: hiển thị tất cả xe đã có time_in HOẶC time_out (đã check-in hoặc check-out)
      OR: [
        { time_in: { not: null } },
        { time_out: { not: null } }
      ]
    };

    // Nếu vẫn truyền status (tùy biến), áp dụng thêm bộ lọc
    if (status) {
      where.status = status;
    }

    // Filter theo type (IMPORT/EXPORT)
    if (type) {
      where.type = type;
    }

    if (container_no) {
      where.container_no = {
        contains: container_no,
        mode: 'insensitive'
      };
    }

    if (driver_name) {
      where.driver_name = {
        contains: driver_name,
        mode: 'insensitive'
      };
    }

    if (license_plate) {
      where.license_plate = {
        contains: license_plate,
        mode: 'insensitive'
      };
    }

    // Lấy dữ liệu
    const [requests, total] = await Promise.all([
      prisma.serviceRequest.findMany({
        where,
        select: {
          id: true,
          container_no: true,
          type: true,
          driver_name: true,
          license_plate: true,
          time_in: true,
          time_out: true,
          status: true,
          createdAt: true,
          updatedAt: true
        },
        orderBy: [
          // Ưu tiên hiển thị xe đã ra trước (time_out mới nhất), sau đó xe đã vào (time_in mới nhất)
          { time_out: 'desc' },
          { time_in: 'desc' }
        ],
        skip,
        take: limitNum
      }),
      prisma.serviceRequest.count({ where })
    ]);

    return {
      data: requests,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum)
      }
    };
  }

  /**
   * Cập nhật trạng thái kiểm tra container
   */
  async updateInspectionStatus(requestId: string, data: {
    isCheck: boolean;
    isRepair: boolean;
    inspectionStatus: string;
    images?: File[];
  }): Promise<any> {
    const request = await prisma.serviceRequest.findUnique({
      where: { id: requestId }
    });

    if (!request) {
      throw new Error('Request không tồn tại');
    }

    const updatedRequest = await prisma.serviceRequest.update({
      where: { id: requestId },
      data: {
        isCheck: data.isCheck,
        isRepair: data.isRepair,
        updatedAt: new Date()
      }
    });

    // TODO: Lưu hình ảnh nếu có
    if (data.images && data.images.length > 0) {
      // Logic để lưu hình ảnh vào storage
      console.log('Saving inspection images:', data.images.length);
    }

    return updatedRequest;
  }

  /**
   * Generate EIR cho container
   */
  async generateEIR(requestId: string): Promise<{ success: boolean; data?: any; message?: string }> {
    try {
      console.log('📄 GateService: Generating EIR for request:', requestId);

      // Lấy thông tin request với các thông tin liên quan
      const request = await prisma.serviceRequest.findUnique({
        where: { id: requestId },
        include: {
          customer: {
            select: { id: true, name: true, code: true, address: true, tax_code: true, phone: true }
          },
          shipping_line: {
            select: { id: true, name: true, code: true, template_eir: true }
          },
          container_type: {
            select: { id: true, code: true, description: true }
          }
        }
      });

      if (!request) {
        return {
          success: false,
          message: 'Request không tồn tại'
        };
      }

      if (request.status !== 'GATE_OUT') {
        return {
          success: false,
          message: 'Chỉ có thể tạo EIR cho container ở trạng thái GATE_OUT'
        };
      }

      console.log('📋 Request details:', {
        container_no: request.container_no,
        customer: request.customer?.name,
        shipping_line: request.shipping_line?.name,
        status: request.status
      });

      // Lấy template EIR từ shipping line
      const templateEir = request.shipping_line?.template_eir;
      if (!templateEir) {
        return {
          success: false,
          message: 'Hãng tàu chưa có template EIR'
        };
      }

      // Đọc template file
      const path = require('path');
      const fs = require('fs');
      const XLSX = require('xlsx');
      
      const templatePath = path.join(__dirname, '../../../uploads/shipping-lines-eir', templateEir);
      
      if (!fs.existsSync(templatePath)) {
        return {
          success: false,
          message: 'File template EIR không tồn tại'
        };
      }

      console.log('📁 Template path:', templatePath);

      // Đọc template Excel
      const workbook = XLSX.readFile(templatePath);
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      
      // Chuyển đổi thành JSON để xem cấu trúc
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });
      
      console.log('📋 Template structure loaded');

      // Tạo dữ liệu mới với thông tin container
      const currentDate = new Date();
      const day = currentDate.getDate();
      const month = currentDate.getMonth() + 1;
      const year = currentDate.getFullYear();
      
      const worksheetData = [
        // Row 1: Tên công ty
        ['', 'CÔNG TY CỔ PHẦN LOGISTICS THÁI BÌNH', '', '', '', '', '', '', '', ''],
        
        // Row 2: Địa chỉ
        ['', 'Địa chỉ: KCN Thái Bình, Phường Trần Lãm, TP.Thái Bình, Tỉnh Thái Bình', '', '', '', '', '', '', '', ''],
        
        // Row 3: Tel và MST
        ['', 'Tel: 0227.3745.678        MST: 3701587234', '', '', '', '', '', '', '', ''],
        
        // Row 4: Tiêu đề
        ['', '', '', '', 'PHIẾU THÔNG TIN CONTAINER', '', '', '', '', ''],
        
        // Row 5: Ngày
        ['', '', '', '', '', '', '', '', `Ngày ${day} tháng ${month} năm ${year}`, ''],
        
        // Row 6: Giao cho/Nhận của
        ['Giao cho/Nhận của:', '', request.customer?.name || 'CÔNG TY TNHH FORD VIỆT NAM', '', '', '', '', '', '', ''],
        
        // Row 7: Hãng tàu và Tác nghiệp
        ['Hãng tàu:', '', request.shipping_line?.code || 'KMTU', '', '', '', '', '', '', 'Tác nghiệp:'],
        
        // Row 8: Số container, seal, booking
        ['Số container:', '', request.container_no, '', '', '', '', '', 'Số seal:', 'Số Booking/Bill:'],
        
        // Row 9: Ghi chú
        ['GHI CHÚ\nEMPTY', '', '', '', '', '', '', '', '', ''],
        
        // Row 10: Số xe
        ['Số xe:', '', request.license_plate || '67H-395.20', '', '', '', '', '', '', ''],
        
        // Row 11: Tài xế và CMND
        [`Tài xế: ${request.driver_name || 'Trần Thị Bình'}`, '', '', '', '', '', `CMND: ${request.driver_phone || '714529869'}`, '', '', ''],
        
        // Row 12: Nhân viên giao nhận
        ['Nhân viên giao nhận\nGate Check', '', '', '', '', '', 'Nhân viên kiểm hàng\nYard Check', '', '', '']
      ];

      // Tạo workbook mới
      const newWorkbook = XLSX.utils.book_new();
      const newWorksheet = XLSX.utils.aoa_to_sheet(worksheetData);
      
      // Thiết lập độ rộng cột
      newWorksheet['!cols'] = [
        { width: 15 },  // Cột A
        { width: 20 },  // Cột B  
        { width: 15 },  // Cột C
        { width: 10 },   // Cột D
        { width: 10 },  // Cột E
        { width: 10 },  // Cột F
        { width: 10 },  // Cột G
        { width: 10 },  // Cột H
        { width: 15 },  // Cột I
        { width: 15 }   // Cột J
      ];

      // Thêm worksheet vào workbook
      XLSX.utils.book_append_sheet(newWorkbook, newWorksheet, 'EIR_Container');

      // Tạo buffer
      const buffer = XLSX.write(newWorkbook, { type: 'buffer', bookType: 'xlsx' });
      
      const filename = `EIR_${request.container_no}_${Date.now()}.xlsx`;
      
      console.log('✅ EIR generated successfully:', filename);

      return {
        success: true,
        data: {
          filename,
          fileBuffer: buffer
        }
      };

    } catch (error) {
      console.error('❌ Error generating EIR:', error);
      return {
        success: false,
        message: 'Lỗi khi tạo phiếu EIR: ' + (error instanceof Error ? error.message : 'Unknown error')
      };
    }
  }
}


