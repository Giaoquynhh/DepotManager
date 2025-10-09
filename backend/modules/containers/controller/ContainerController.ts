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
          
          // 🔄 SỬA LOGIC: Kiểm tra container_quality từ bảng Container thay vì RepairTicket status
          // Ưu tiên container_quality từ database (được cập nhật từ ManagerCont)
          const containerRecord = await prisma.$queryRaw<Array<{container_quality: string | null}>>`
            SELECT container_quality FROM "Container" WHERE container_no = ${container_no}
          `;

          // Nếu không có container_quality, fallback về RepairTicket status
          let isGoodQuality = false;
          if (containerRecord.length > 0 && containerRecord[0].container_quality) {
            isGoodQuality = containerRecord[0].container_quality === 'GOOD';
            console.log(`🔍 [Container Suggestion] Container ${container_no} - container_quality: ${containerRecord[0].container_quality} → isGoodQuality: ${isGoodQuality}`);
          } else {
            // Fallback: Kiểm tra RepairTicket status
            const repairTicket = await prisma.repairTicket.findFirst({
              where: { 
                container_no,
                status: 'COMPLETE'
              },
              orderBy: { updatedAt: 'desc' }
            });
            isGoodQuality = !!repairTicket;
            console.log(`🔍 [Container Suggestion] Container ${container_no} - fallback RepairTicket status: ${repairTicket?.status || 'NONE'} → isGoodQuality: ${isGoodQuality}`);
          }

          // Chỉ thêm vào kết quả nếu container có quality GOOD
          if (isGoodQuality) {
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

        // 🔄 BỔ SUNG LOGIC: Xử lý container có ServiceRequest bị REJECTED (yêu cầu nâng bị hủy)
        if (latestServiceRequest && 
            latestServiceRequest.type === 'EXPORT' &&
            latestServiceRequest.status === 'REJECTED') {
          
          console.log(`🔄 [Container Suggestion] Container ${container_no} có yêu cầu nâng bị hủy, kiểm tra khả năng nâng lại`);
          
          // Tìm ServiceRequest IMPORT gần nhất để lấy thông tin container
          const importRequest = await prisma.serviceRequest.findFirst({
            where: { 
              container_no,
              type: 'IMPORT',
              status: { in: ['IN_YARD', 'GATE_OUT'] },
              depot_deleted_at: null
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

          if (importRequest) {
            // 🔄 SỬA LOGIC: Kiểm tra container_quality từ bảng Container thay vì RepairTicket status
            const containerRecord = await prisma.$queryRaw<Array<{container_quality: string | null}>>`
              SELECT container_quality FROM "Container" WHERE container_no = ${container_no}
            `;

            // Nếu không có container_quality, fallback về RepairTicket status
            let isGoodQuality = false;
            if (containerRecord.length > 0 && containerRecord[0].container_quality) {
              isGoodQuality = containerRecord[0].container_quality === 'GOOD';
              console.log(`🔍 [Container Suggestion] Container ${container_no} (EXPORT REJECTED) - container_quality: ${containerRecord[0].container_quality} → isGoodQuality: ${isGoodQuality}`);
            } else {
              // Fallback: Kiểm tra RepairTicket status
              const repairTicket = await prisma.repairTicket.findFirst({
                where: { 
                  container_no,
                  status: 'COMPLETE'
                },
                orderBy: { updatedAt: 'desc' }
              });
              isGoodQuality = !!repairTicket;
              console.log(`🔍 [Container Suggestion] Container ${container_no} (EXPORT REJECTED) - fallback RepairTicket status: ${repairTicket?.status || 'NONE'} → isGoodQuality: ${isGoodQuality}`);
            }

            // Chỉ thêm vào kết quả nếu container có quality GOOD
            if (isGoodQuality) {
              console.log(`✅ [Container Suggestion] Container ${container_no} sẵn sàng để nâng lại sau khi hủy yêu cầu`);
              result.push({
                container_no,
                slot_code: yardContainer.slot?.code || '',
                block_code: yardContainer.slot?.block?.code || '',
                yard_name: yardContainer.slot?.block?.yard?.name || '',
                tier: yardContainer.tier,
                placed_at: yardContainer.placed_at,
                shipping_line: importRequest.shipping_line,
                container_type: importRequest.container_type,
                customer: importRequest.customer,
                seal_number: importRequest.seal_number,
                dem_det: importRequest.dem_det,
                service_status: importRequest.status,
                request_type: 'IMPORT',
                container_quality: 'GOOD',
                note: 'Có thể nâng lại sau khi hủy yêu cầu trước đó' // Thêm ghi chú
              });
            } else {
              console.log(`⚠️ [Container Suggestion] Container ${container_no} không có RepairTicket COMPLETE, không thể nâng lại`);
            }
          } else {
            console.log(`⚠️ [Container Suggestion] Container ${container_no} không tìm thấy ServiceRequest IMPORT hợp lệ`);
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

          console.log(`🔍 [Container Suggestion] Container ${container_no} - Container record:`, {
            exists: !!container,
            shipping_line_id: container?.shipping_line_id,
            requested_shipping_line_id: shipping_line_id,
            matches: container?.shipping_line_id === shipping_line_id
          });

          // 🔄 BỔ SUNG LOGIC: Xử lý container không có shipping_line_id hoặc có shipping_line_id khác
          if (container) {
            // Kiểm tra xem container có từng có request không (kể cả request đã bị xóa)
            const hasAnyRequest = await prisma.serviceRequest.findFirst({
              where: { 
                container_no,
                shipping_line_id 
              }
            });

            // 🔄 LOGIC MỚI: Nếu container không có shipping_line_id hoặc có shipping_line_id khác,
            // nhưng có ServiceRequest với shipping line đã chọn, vẫn hiển thị
            if (container.shipping_line_id === shipping_line_id || !container.shipping_line_id) {
              // 🔄 BỔ SUNG: Kiểm tra container_quality cho EMPTY_IN_YARD
              const containerQualityRecord = await prisma.$queryRaw<Array<{container_quality: string | null}>>`
                SELECT container_quality FROM "Container" WHERE container_no = ${container_no}
              `;
              
              let isGoodQuality = false;
              if (containerQualityRecord.length > 0 && containerQualityRecord[0].container_quality) {
                isGoodQuality = containerQualityRecord[0].container_quality === 'GOOD';
                console.log(`🔍 [Container Suggestion] Container ${container_no} (EMPTY_IN_YARD) - container_quality: ${containerQualityRecord[0].container_quality} → isGoodQuality: ${isGoodQuality}`);
              } else {
                // Fallback: Mặc định GOOD cho EMPTY_IN_YARD
                isGoodQuality = true;
                console.log(`🔍 [Container Suggestion] Container ${container_no} (EMPTY_IN_YARD) - không có container_quality, mặc định GOOD`);
              }

              if (isGoodQuality) {
                console.log(`✅ [Container Suggestion] Container ${container_no} sẵn sàng để nâng (EMPTY_IN_YARD hoặc không có shipping_line_id)`);
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
                request_type: hasAnyRequest ? 'DELETED_REQUEST' : 'SYSTEM_ADMIN_ADDED',
                note: !container.shipping_line_id ? 'Container không có shipping line, có thể nâng cho bất kỳ hãng tàu nào' : undefined
                });
              } else {
                console.log(`⚠️ [Container Suggestion] Container ${container_no} (EMPTY_IN_YARD) có container_quality không tốt, bỏ qua`);
              }
            } else {
              console.log(`⚠️ [Container Suggestion] Container ${container_no} có shipping_line_id khác (${container.shipping_line_id} vs ${shipping_line_id}), bỏ qua`);
            }
          } else {
            console.log(`⚠️ [Container Suggestion] Container ${container_no} không tìm thấy trong bảng Container`);
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
   * Kiểm tra container có tồn tại trong bãi hay không
   */
  async checkContainerExistsInYard(req: AuthRequest, res: Response) {
    try {
      const { container_no } = req.params;

      if (!container_no) {
        return res.status(400).json({
          success: false,
          message: 'Container number is required'
        });
      }

      // Kiểm tra container có trong yard placement không
      const yardPlacement = await prisma.yardPlacement.findFirst({
        where: {
          container_no,
          status: 'OCCUPIED',
          removed_at: null
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

      if (yardPlacement) {
        return res.json({
          success: true,
          data: {
            exists: true,
            container_no,
            slot_code: yardPlacement.slot?.code || '',
            block_code: yardPlacement.slot?.block?.code || '',
            yard_name: yardPlacement.slot?.block?.yard?.name || '',
            tier: yardPlacement.tier,
            placed_at: yardPlacement.placed_at
          },
          message: `Container ${container_no} có trong bãi`
        });
      }

      return res.json({
        success: true,
        data: {
          exists: false,
          container_no
        },
        message: `Container ${container_no} không có trong bãi`
      });

    } catch (error: any) {
      console.error('Error checking container in yard:', error);
      return res.status(500).json({
        success: false,
        message: error.message || 'Có lỗi xảy ra khi kiểm tra container trong bãi'
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

      // Cập nhật container_quality
      if (container_quality) {
        // 🔄 LUU CONTAINER_QUALITY VÀO DATABASE
        // Tìm hoặc tạo Container record để lưu container_quality
        let containerRecord = await prisma.container.findFirst({
          where: { container_no }
        });

        if (!containerRecord) {
          // Tạo Container record mới nếu chưa có
          await prisma.$executeRaw`
            INSERT INTO "Container" (id, container_no, container_quality, created_by, "createdAt", "updatedAt")
            VALUES (gen_random_uuid(), ${container_no}, ${container_quality}, ${req.user!._id}, NOW(), NOW())
          `;
          console.log(`✅ Tạo mới Container record cho ${container_no} với quality: ${container_quality}`);
        } else {
          // Cập nhật Container record hiện có
          await prisma.$executeRaw`
            UPDATE "Container" 
            SET container_quality = ${container_quality}, "updatedAt" = NOW()
            WHERE id = ${containerRecord.id}
          `;
          console.log(`✅ Cập nhật Container record cho ${container_no}: quality → ${container_quality}`);
        }

        // Tìm RepairTicket mới nhất của container này
        const latestRepairTicket = await prisma.repairTicket.findFirst({
          where: { container_no },
          orderBy: { createdAt: 'desc' }
        });

        if (latestRepairTicket) {
          // 🔒 BẢO VỆ: Kiểm tra ServiceRequest status trước khi cập nhật RepairTicket
          const serviceRequest = await prisma.serviceRequest.findFirst({
            where: { 
              container_no,
              type: 'IMPORT'
            },
            orderBy: { createdAt: 'desc' }
          });

          // Nếu ServiceRequest đã ở trạng thái IN_YARD hoặc GATE_OUT, KHÔNG cập nhật RepairTicket
          if (serviceRequest && (serviceRequest.status === 'IN_YARD' || serviceRequest.status === 'GATE_OUT')) {
            console.log(`🔒 Bảo vệ RepairTicket cho container ${container_no}: ServiceRequest đã ở trạng thái ${serviceRequest.status}, không cập nhật RepairTicket`);
            console.log(`ℹ️ Container quality được cập nhật thành ${container_quality} nhưng RepairTicket giữ nguyên trạng thái ${latestRepairTicket.status}`);
          } else {
            // Chỉ cập nhật RepairTicket khi ServiceRequest chưa ở trạng thái cuối
            let repairStatus: 'COMPLETE' | 'COMPLETE_NEEDREPAIR' | 'PENDING' = 'PENDING';
            if (container_quality === 'GOOD') {
              repairStatus = 'COMPLETE';
            } else if (container_quality === 'NEED_REPAIR') {
              repairStatus = 'COMPLETE_NEEDREPAIR';
            }
            
            console.log(`🔄 Cập nhật RepairTicket cho container ${container_no}: ${latestRepairTicket.status} → ${repairStatus}`);
            
            await prisma.repairTicket.update({
              where: { id: latestRepairTicket.id },
              data: { 
                status: repairStatus,
                updatedAt: new Date()
              }
            });
          }
        } else if (container_quality === 'NEED_REPAIR') {
          // Tạo RepairTicket mới nếu chưa có và cần sửa chữa
          const code = `RT-${new Date().toISOString().replace(/[-:TZ.]/g, '').slice(0, 14)}-${Math.floor(Math.random()*1000)}`;
          await prisma.repairTicket.create({
            data: {
              container_no,
              status: 'COMPLETE_NEEDREPAIR',
              problem_description: 'Container cần sửa chữa - Manual creation',
              code,
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