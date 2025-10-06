import { Request, Response } from 'express';
import { prisma } from '../../../shared/config/database';
import { AuthRequest } from '../../../shared/middlewares/auth';

class ContainerController {
  /**
   * Lấy thông tin container
   */
  async get(req: AuthRequest, res: Response) {
    try {
      const { container_no } = req.params;
      
      // Ưu tiên tìm trong ServiceRequest trước (dữ liệu mới nhất)
      const latestRequest = await prisma.serviceRequest.findFirst({
        where: { container_no },
        orderBy: { createdAt: 'desc' },
        include: {
          customer: {
            select: { id: true, name: true, code: true }
          },
          shipping_line: {
            select: { id: true, name: true, code: true }
          },
          container_type: {
            select: { id: true, code: true, description: true }
          }
        }
      });

      if (latestRequest) {
        return res.json({
          success: true,
          data: {
            container_no,
            customer: latestRequest.customer,
            shipping_line: latestRequest.shipping_line,
            container_type: latestRequest.container_type,
            seal_number: latestRequest.seal_number,
            dem_det: latestRequest.dem_det
          }
        });
      }

      // Fallback: tìm trong Container model (cho EMPTY_IN_YARD)
      const container = await prisma.container.findUnique({
        where: { container_no },
        include: {
          customer: {
            select: { id: true, name: true, code: true }
          },
          shipping_line: {
            select: { id: true, name: true, code: true }
          },
          container_type: {
            select: { id: true, code: true, description: true }
          }
        }
      });

      if (container) {
        return res.json({
          success: true,
          data: {
            container_no,
            customer: container.customer,
            shipping_line: container.shipping_line,
            container_type: container.container_type,
            seal_number: container.seal_number,
            dem_det: container.dem_det,
            yard_name: container.yard_name,
            block_code: container.block_code,
            slot_code: container.slot_code
          }
        });
      }

      return res.status(404).json({ 
        success: false, 
        message: 'Không tìm thấy container' 
      });

    } catch (error: any) {
      console.error('Error getting container:', error);
      return res.status(500).json({ 
        success: false, 
        message: error.message || 'Có lỗi xảy ra khi lấy thông tin container' 
      });
    }
  }

  /**
   * Lấy danh sách alerts
   */
  async alerts(req: AuthRequest, res: Response) {
    try {
      // TODO: Implement alerts logic
      return res.json({
        success: true,
        data: []
      });
    } catch (error: any) {
      console.error('Error getting alerts:', error);
      return res.status(500).json({ 
        success: false, 
        message: error.message || 'Có lỗi xảy ra khi lấy danh sách alerts' 
      });
    }
  }

  /**
   * Cập nhật thông tin container (alias cho updateContainerInfo)
   */
  async updateContainer(req: AuthRequest, res: Response) {
    return this.updateContainerInfo(req, res);
  }

  /**
   * Lấy containers trong yard theo shipping line cho lift request (Simple version)
   * Chỉ lấy containers có trạng thái:
   * - EMPTY_IN_YARD (được SystemAdmin thêm)
   * - GATE_OUT với type IMPORT
   */
  async getContainersInYardByShippingLine(req: AuthRequest, res: Response, shipping_line_id: string, searchQuery?: string) {
    try {
      console.log('Debug - shipping_line_id:', shipping_line_id);
      console.log('Debug - searchQuery:', searchQuery);

      // Bước 1: Lấy tất cả containers trong yard
      const yardContainers = await prisma.yardPlacement.findMany({
        where: {
          status: 'OCCUPIED',
          removed_at: null,
          container_no: { not: null },
          ...(searchQuery && searchQuery.trim() && {
            container_no: {
              contains: searchQuery.trim(),
              mode: 'insensitive'
            }
          })
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
        },
        take: 100
      });

      console.log(`Debug - Found ${yardContainers.length} containers in yard`);

      const result = [];

      // Bước 2: Kiểm tra từng container
      for (const yardContainer of yardContainers) {
        const container_no = yardContainer.container_no;
        if (!container_no) continue;

        // Tìm ServiceRequest mới nhất cho container này (chỉ lấy request chưa bị xóa)
        const latestServiceRequest = await prisma.serviceRequest.findFirst({
          where: { 
            container_no,
            shipping_line_id,
            depot_deleted_at: null // Chỉ lấy request chưa bị soft-delete
          },
          orderBy: { createdAt: 'desc' },
          include: {
            shipping_line: {
              select: { id: true, name: true, code: true }
            },
            container_type: {
              select: { id: true, code: true, description: true }
            },
            customer: {
              select: { id: true, name: true, code: true }
            }
          }
        });

        // Kiểm tra điều kiện 2: IN_YARD hoặc GATE_OUT với type IMPORT và quality GOOD
        if (latestServiceRequest && 
            latestServiceRequest.type === 'IMPORT' &&
            (latestServiceRequest.status === 'IN_YARD' || latestServiceRequest.status === 'GATE_OUT')) {
          
          // Kiểm tra container quality - phải có RepairTicket với status COMPLETE (GOOD)
          const repairTicket = await prisma.repairTicket.findFirst({
            where: { 
              container_no,
              status: 'COMPLETE' // Container quality GOOD
            },
            orderBy: { updatedAt: 'desc' }
          });

          // Chỉ thêm vào kết quả nếu container có quality GOOD
          if (repairTicket) {
            result.push({
              container_no,
              slot_code: yardContainer.slot?.code || '',
              block_code: yardContainer.slot?.block?.code || '',
              yard_name: yardContainer.slot?.block?.yard?.name || '',
              tier: yardContainer.tier,
              placed_at: yardContainer.placed_at,
              shipping_line: latestServiceRequest.shipping_line,
              container_type: latestServiceRequest.container_type,
              customer: latestServiceRequest.customer,
              seal_number: latestServiceRequest.seal_number,
              dem_det: latestServiceRequest.dem_det,
              service_status: latestServiceRequest.status,
              request_type: 'IMPORT',
              container_quality: 'GOOD' // Thêm thông tin quality
            });
          }
          continue;
        }

        // Kiểm tra điều kiện 1: EMPTY_IN_YARD (SystemAdmin thêm) hoặc container đã từng có request nhưng request đã bị xóa
        if (!latestServiceRequest) {
          // Tìm trong bảng Container
          const container = await prisma.container.findUnique({
            where: { container_no },
            include: {
              shipping_line: {
                select: { id: true, name: true, code: true }
              },
              container_type: {
                select: { id: true, code: true, description: true }
              },
              customer: {
                select: { id: true, name: true, code: true }
              }
            }
          });

          if (container && container.shipping_line_id === shipping_line_id) {
            // Kiểm tra xem container có từng có request không (kể cả request đã bị xóa)
            const hasAnyRequest = await prisma.serviceRequest.findFirst({
              where: { 
                container_no,
                shipping_line_id 
              }
            });

            result.push({
              container_no,
              slot_code: yardContainer.slot?.code || '',
              block_code: yardContainer.slot?.block?.code || '',
              yard_name: yardContainer.slot?.block?.yard?.name || '',
              tier: yardContainer.tier,
              placed_at: yardContainer.placed_at,
              shipping_line: container.shipping_line,
              container_type: container.container_type,
              customer: container.customer,
              seal_number: container.seal_number,
              dem_det: container.dem_det,
              service_status: hasAnyRequest ? 'DELETED_REQUEST' : 'EMPTY_IN_YARD',
              request_type: hasAnyRequest ? 'DELETED_REQUEST' : 'SYSTEM_ADMIN_ADDED'
            });
          }
        }
      }

      console.log(`Debug - Final result: ${result.length} containers`);

      return res.json({
        success: true,
        data: result,
        total: result.length
      });

    } catch (error) {
      console.error('Error getting containers in yard by shipping line:', error);
      console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
      return res.status(500).json({ 
        success: false, 
        message: 'Lỗi khi lấy danh sách container trong yard',
        error: process.env.NODE_ENV === 'development' ? error : undefined
      });
    }
  }

  /**
   * Lấy containers trong yard theo shipping line và container type cho edit modal
   * Chỉ lấy containers có trạng thái:
   * - EMPTY_IN_YARD (được SystemAdmin thêm)
   * - GATE_OUT với type IMPORT
   * Và lọc thêm theo container_type_id nếu có
   */
  async getContainersInYardByShippingLineAndType(req: AuthRequest, res: Response, shipping_line_id: string, container_type_id?: string, searchQuery?: string) {
    try {
      console.log('Debug - shipping_line_id:', shipping_line_id);
      console.log('Debug - container_type_id:', container_type_id);
      console.log('Debug - searchQuery:', searchQuery);

      // Bước 1: Lấy tất cả containers trong yard
      const yardContainers = await prisma.yardPlacement.findMany({
        where: {
          status: 'OCCUPIED',
          removed_at: null,
          container_no: { not: null },
          ...(searchQuery && searchQuery.trim() && {
            container_no: {
              contains: searchQuery.trim(),
              mode: 'insensitive'
            }
          })
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
        },
        take: 100
      });

      console.log(`Debug - Found ${yardContainers.length} containers in yard`);

      const result = [];

      // Bước 2: Kiểm tra từng container
      for (const yardContainer of yardContainers) {
        const container_no = yardContainer.container_no;
        if (!container_no) continue;

        // Tìm ServiceRequest mới nhất cho container này (chỉ lấy request chưa bị xóa)
        const latestServiceRequest = await prisma.serviceRequest.findFirst({
          where: { 
            container_no,
            shipping_line_id,
            depot_deleted_at: null // Chỉ lấy request chưa bị soft-delete
          },
          orderBy: { createdAt: 'desc' },
          include: {
            shipping_line: {
              select: { id: true, name: true, code: true }
            },
            container_type: {
              select: { id: true, code: true, description: true }
            },
            customer: {
              select: { id: true, name: true, code: true }
            }
          }
        });

        // Kiểm tra điều kiện 2: IN_YARD hoặc GATE_OUT với type IMPORT và quality GOOD
        if (latestServiceRequest && 
            latestServiceRequest.type === 'IMPORT' &&
            (latestServiceRequest.status === 'IN_YARD' || latestServiceRequest.status === 'GATE_OUT')) {
          
          // Lọc theo container type nếu có
          if (container_type_id && latestServiceRequest.container_type_id !== container_type_id) {
            continue;
          }

          // Kiểm tra container quality - phải có RepairTicket với status COMPLETE (GOOD)
          const repairTicket = await prisma.repairTicket.findFirst({
            where: { 
              container_no,
              status: 'COMPLETE' // Container quality GOOD
            },
            orderBy: { updatedAt: 'desc' }
          });

          // Chỉ thêm vào kết quả nếu container có quality GOOD
          if (repairTicket) {
            result.push({
              container_no,
              slot_code: yardContainer.slot?.code || '',
              block_code: yardContainer.slot?.block?.code || '',
              yard_name: yardContainer.slot?.block?.yard?.name || '',
              tier: yardContainer.tier,
              placed_at: yardContainer.placed_at,
              shipping_line: latestServiceRequest.shipping_line,
              container_type: latestServiceRequest.container_type,
              customer: latestServiceRequest.customer,
              seal_number: latestServiceRequest.seal_number,
              dem_det: latestServiceRequest.dem_det,
              service_status: latestServiceRequest.status,
              request_type: 'IMPORT',
              container_quality: 'GOOD'
            });
          }
          continue;
        }

        // Kiểm tra điều kiện 1: EMPTY_IN_YARD (SystemAdmin thêm) hoặc container đã từng có request nhưng request đã bị xóa
        if (!latestServiceRequest) {
          // Tìm trong bảng Container
          const container = await prisma.container.findUnique({
            where: { container_no },
            include: {
              shipping_line: {
                select: { id: true, name: true, code: true }
              },
              container_type: {
                select: { id: true, code: true, description: true }
              },
              customer: {
                select: { id: true, name: true, code: true }
              }
            }
          });

          if (container && container.shipping_line_id === shipping_line_id) {
            // Lọc theo container type nếu có
            if (container_type_id && container.container_type_id !== container_type_id) {
              continue;
            }

            // Kiểm tra xem container có từng có request không (kể cả request đã bị xóa)
            const hasAnyRequest = await prisma.serviceRequest.findFirst({
              where: { 
                container_no,
                shipping_line_id 
              }
            });

            result.push({
              container_no,
              slot_code: yardContainer.slot?.code || '',
              block_code: yardContainer.slot?.block?.code || '',
              yard_name: yardContainer.slot?.block?.yard?.name || '',
              tier: yardContainer.tier,
              placed_at: yardContainer.placed_at,
              shipping_line: container.shipping_line,
              container_type: container.container_type,
              customer: container.customer,
              seal_number: container.seal_number,
              dem_det: container.dem_det,
              service_status: hasAnyRequest ? 'DELETED_REQUEST' : 'EMPTY_IN_YARD',
              request_type: hasAnyRequest ? 'DELETED_REQUEST' : 'SYSTEM_ADMIN_ADDED'
            });
          }
        }
      }

      console.log(`Debug - Final result: ${result.length} containers`);

      return res.json({
        success: true,
        data: result,
        total: result.length
      });

    } catch (error) {
      console.error('Error getting containers in yard by shipping line and type:', error);
      console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
      return res.status(500).json({ 
        success: false, 
        message: 'Lỗi khi lấy danh sách container trong yard',
        error: process.env.NODE_ENV === 'development' ? error : undefined
      });
    }
  }

  /**
   * Cập nhật thông tin container
   */
  async updateContainerInfo(req: AuthRequest, res: Response) {
    try {
      const { container_no } = req.params;
      const { customer_id, shipping_line_id, container_type_id, seal_number, dem_det, container_quality } = req.body;

      // Tìm ServiceRequest mới nhất cho container này
      const latestRequest = await prisma.serviceRequest.findFirst({
        where: { container_no },
        orderBy: { createdAt: 'desc' }
      });

      let updatedRequest = null;
      let customer = null;

      if (latestRequest) {
        // Cập nhật thông tin ServiceRequest nếu có
        updatedRequest = await prisma.serviceRequest.update({
          where: { id: latestRequest.id },
          data: {
            ...(customer_id && { customer_id }),
            ...(shipping_line_id && { shipping_line_id }),
            ...(container_type_id && { container_type_id }),
            ...(seal_number !== undefined && { seal_number }),
            ...(dem_det !== undefined && { dem_det }),
            updatedAt: new Date()
          },
          include: {
            customer: {
              select: { id: true, name: true, code: true }
            },
            shipping_line: {
              select: { id: true, name: true, code: true }
            },
            container_type: {
              select: { id: true, code: true, description: true }
            }
          }
        });
        customer = updatedRequest.customer;
        
        // BỔ SUNG: Cập nhật tất cả ServiceRequest của container này để đảm bảo tính nhất quán
        if (customer_id || shipping_line_id || container_type_id || seal_number !== undefined || dem_det !== undefined) {
          await prisma.serviceRequest.updateMany({
            where: { container_no },
            data: {
              ...(customer_id && { customer_id }),
              ...(shipping_line_id && { shipping_line_id }),
              ...(container_type_id && { container_type_id }),
              ...(seal_number !== undefined && { seal_number }),
              ...(dem_det !== undefined && { dem_det }),
              updatedAt: new Date()
            }
          });
          console.log(`✅ Đã cập nhật customer_id, shipping_line_id, container_type_id, seal_number và dem_det cho tất cả ServiceRequest của container ${container_no}`);
        }
      } else {
        // Container không có ServiceRequest - chỉ cập nhật Container model
        const containerData: any = {
          container_no,
          status: 'EMPTY_IN_YARD',
          created_by: req.user!._id,
          updatedAt: new Date()
        };

        if (customer_id) containerData.customer_id = customer_id;
        if (shipping_line_id) containerData.shipping_line_id = shipping_line_id;
        if (container_type_id) containerData.container_type_id = container_type_id;
        if (seal_number !== undefined) containerData.seal_number = seal_number;
        if (dem_det !== undefined) containerData.dem_det = dem_det;

        // Upsert Container record
        const container = await prisma.container.upsert({
          where: { container_no },
          update: containerData,
          create: {
            ...containerData,
            createdAt: new Date()
          },
          include: {
            customer: {
              select: { id: true, name: true, code: true }
            },
            shipping_line: {
              select: { id: true, name: true, code: true }
            },
            container_type: {
              select: { id: true, code: true, description: true }
            }
          }
        });

        customer = container.customer;
        updatedRequest = null; // Không có ServiceRequest để cập nhật
      }

      // Cập nhật container_quality bằng cách cập nhật RepairTicket
      if (container_quality) {
        const repairTickets = await prisma.repairTicket.findMany({
          where: { container_no },
          orderBy: { createdAt: 'desc' }
        });

        if (repairTickets.length > 0) {
          // Cập nhật tất cả RepairTicket của container này
          let repairStatus: 'COMPLETE' | 'COMPLETE_NEEDREPAIR' | 'PENDING' = 'PENDING';
          if (container_quality === 'GOOD') {
            repairStatus = 'COMPLETE';
          } else if (container_quality === 'NEED_REPAIR') {
            repairStatus = 'COMPLETE_NEEDREPAIR';
          }
          
          await prisma.repairTicket.updateMany({
            where: { container_no },
            data: { 
              status: repairStatus,
              updatedAt: new Date()
            }
          });
        } else if (container_quality === 'NEED_REPAIR') {
          // Tạo RepairTicket mới nếu chưa có và cần sửa chữa
          await prisma.repairTicket.create({
            data: {
              container_no,
              status: 'COMPLETE_NEEDREPAIR',
              problem_description: 'Container cần sửa chữa',
              code: `RT-${Date.now()}`, // Tạo code unique
              created_by: req.user!._id,
              createdAt: new Date(),
              updatedAt: new Date()
            }
          });
        } else if (container_quality === 'GOOD') {
          // Nếu container tốt và không có repair ticket, không cần làm gì
          // Chỉ cần đảm bảo không có repair ticket nào đang pending
        }
      }

      return res.json({
        success: true,
        message: 'Cập nhật thông tin container thành công',
        data: {
          container_no,
          customer: customer,
          shipping_line: updatedRequest?.shipping_line || null,
          container_type: updatedRequest?.container_type || null,
          seal_number: updatedRequest?.seal_number || null,
          dem_det: updatedRequest?.dem_det || null
        }
      });

    } catch (error: any) {
      console.error('Error updating container info:', error);
      return res.status(500).json({ 
        success: false, 
        message: error.message || 'Có lỗi xảy ra khi cập nhật thông tin container' 
      });
    }
  }
}

export default new ContainerController();