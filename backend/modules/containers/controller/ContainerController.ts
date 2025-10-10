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
      
      // 🔄 LOGIC MỚI: Ưu tiên Container model (thông tin hiện tại) thay vì ServiceRequest (lịch sử)
      // Vì Container model lưu thông tin hiện tại của container, ServiceRequest lưu lịch sử
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
            dem_det: container.dem_det
          }
        });
      }

      // Fallback: tìm trong ServiceRequest nếu không có trong Container model
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
        // KHÔNG filter theo shipping_line_id để tránh bỏ sót container IMPORT
        const latestServiceRequest = await prisma.serviceRequest.findFirst({
          where: { 
            container_no,
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
        // VÀ ServiceRequest phải thuộc hãng tàu được chọn
        if (latestServiceRequest && 
            latestServiceRequest.type === 'IMPORT' &&
            latestServiceRequest.shipping_line_id === shipping_line_id &&
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
          console.log(`🔍 [Container Suggestion] Container ${container_no} - EXPORT REJECTED request details:`, {
            request_id: latestServiceRequest.id,
            status: latestServiceRequest.status,
            type: latestServiceRequest.type,
            shipping_line_id: latestServiceRequest.shipping_line_id,
            requested_shipping_line_id: shipping_line_id
          });
          
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

          if (importRequest && importRequest.shipping_line_id === shipping_line_id) {
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
            if (!importRequest) {
              console.log(`⚠️ [Container Suggestion] Container ${container_no} không tìm thấy ServiceRequest IMPORT hợp lệ`);
              
              // 🔄 BỔ SUNG LOGIC: Xử lý container EMPTY_IN_YARD có EXPORT REJECTED
              // Tìm trong bảng Container để lấy thông tin container
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
                console.log(`🔄 [Container Suggestion] Container ${container_no} là EMPTY_IN_YARD có EXPORT REJECTED, kiểm tra khả năng nâng lại`);
                
                // Kiểm tra container_quality
                const containerQualityRecord = await prisma.$queryRaw<Array<{container_quality: string | null}>>`
                  SELECT container_quality FROM "Container" WHERE container_no = ${container_no}
                `;
                
                let isGoodQuality = false;
                if (containerQualityRecord.length > 0 && containerQualityRecord[0].container_quality) {
                  isGoodQuality = containerQualityRecord[0].container_quality === 'GOOD';
                  console.log(`🔍 [Container Suggestion] Container ${container_no} (EMPTY_IN_YARD + EXPORT REJECTED) - container_quality: ${containerQualityRecord[0].container_quality} → isGoodQuality: ${isGoodQuality}`);
                } else {
                  // Fallback: Mặc định GOOD cho EMPTY_IN_YARD
                  isGoodQuality = true;
                  console.log(`🔍 [Container Suggestion] Container ${container_no} (EMPTY_IN_YARD + EXPORT REJECTED) - không có container_quality, mặc định GOOD`);
                }

                if (isGoodQuality) {
                  console.log(`✅ [Container Suggestion] Container ${container_no} sẵn sàng để nâng lại (EMPTY_IN_YARD + EXPORT REJECTED)`);
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
                    service_status: 'EMPTY_IN_YARD',
                    request_type: 'SYSTEM_ADMIN_ADDED',
                    container_quality: 'GOOD',
                    note: 'Có thể nâng lại sau khi hủy yêu cầu trước đó (EMPTY_IN_YARD)'
                  });
                }
              } else {
                console.log(`⚠️ [Container Suggestion] Container ${container_no} không có Container record hoặc shipping_line_id không khớp`);
              }
            } else {
              console.log(`⚠️ [Container Suggestion] Container ${container_no} có ServiceRequest IMPORT nhưng shipping_line_id không khớp (${importRequest.shipping_line_id} vs ${shipping_line_id})`);
            }
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
      
      // Debug log để kiểm tra request
      console.log(`🔍 [DEBUG] updateContainerInfo called for ${container_no}:`, {
        container_quality,
        customer_id,
        shipping_line_id,
        container_type_id,
        seal_number,
        dem_det
      });

      // 🔒 VALIDATION: Kiểm tra nếu đang cập nhật customer_id và container có yêu cầu LiftContainer active
      if (customer_id) {
        const activeLiftRequest = await prisma.serviceRequest.findFirst({
          where: {
            container_no,
            type: 'EXPORT', // LiftContainer request
            status: {
              notIn: ['REJECTED', 'GATE_OUT', 'GATE_REJECTED'] // Loại trừ các trạng thái đã kết thúc
            }
          }
        });

        if (activeLiftRequest) {
          console.log(`🚫 [VALIDATION] Container ${container_no} có yêu cầu LiftContainer active (ID: ${activeLiftRequest.id}, Status: ${activeLiftRequest.status})`);
          return res.status(400).json({
            success: false,
            message: `Không thể cập nhật khách hàng cho container ${container_no} vì đã có yêu cầu nâng container đang hoạt động (Trạng thái: ${activeLiftRequest.status})`
          });
        }
        console.log(`✅ [VALIDATION] Container ${container_no} không có yêu cầu LiftContainer active, cho phép cập nhật khách hàng`);
      }

      // Tìm ServiceRequest mới nhất cho container này
      const latestRequest = await prisma.serviceRequest.findFirst({
        where: { container_no },
        orderBy: { createdAt: 'desc' }
      });

      let updatedRequest = null;
      let customer = null;

      // 🔄 BỔ SUNG: LUÔN LUÔN cập nhật Container model để lưu thông tin vĩnh viễn
      const containerData: any = {
        updatedAt: new Date()
      };

      if (customer_id) containerData.customer_id = customer_id;
      if (shipping_line_id) containerData.shipping_line_id = shipping_line_id;
      if (container_type_id) containerData.container_type_id = container_type_id;
      if (seal_number !== undefined) containerData.seal_number = seal_number;
      if (dem_det !== undefined) containerData.dem_det = dem_det;
      if (container_quality) containerData.container_quality = container_quality;

      // Upsert Container record để đảm bảo thông tin được lưu vĩnh viễn
      const updatedContainer = await prisma.container.upsert({
        where: { container_no },
        update: containerData,
        create: {
          container_no,
          status: 'EMPTY_IN_YARD',
          created_by: req.user!._id,
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
      customer = updatedContainer.customer;
      console.log(`✅ Đã cập nhật Container model cho ${container_no} với customer_id: ${customer_id}`);

      // 🔄 LOGIC MỚI: ManagerCont CHỈ cập nhật Container model, KHÔNG động vào ServiceRequest
      // Vì:
      // 1. Container model lưu thông tin hiện tại của container
      // 2. ServiceRequest lưu lịch sử yêu cầu (không nên thay đổi từ ManagerCont)
      // 3. Khi tạo yêu cầu mới, nó sẽ lấy thông tin từ Container model
      console.log(`🔍 [LOGIC] ManagerCont CHỈ cập nhật Container model cho ${container_no}`);
      console.log(`✅ [LOGIC] KHÔNG cập nhật ServiceRequest để bảo vệ lịch sử yêu cầu`);
      updatedRequest = null; // Không cập nhật ServiceRequest

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
          console.log(`🔍 [DEBUG] Updating Container record for ${container_no}:`, {
            containerRecordId: containerRecord.id,
            currentQuality: containerRecord.container_quality,
            newQuality: container_quality
          });
          
          await prisma.$executeRaw`
            UPDATE "Container" 
            SET container_quality = ${container_quality}, "updatedAt" = NOW()
            WHERE id = ${containerRecord.id}
          `;
          console.log(`✅ Cập nhật Container record cho ${container_no}: quality → ${container_quality}`);
          
          // Verify update
          const updatedRecord = await prisma.container.findUnique({
            where: { id: containerRecord.id },
            select: { container_quality: true, updatedAt: true }
          });
          console.log(`🔍 [DEBUG] Verified update for ${container_no}:`, updatedRecord);
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

          // 🔒 BẢO VỆ: KHÔNG cập nhật RepairTicket khi thay đổi container_quality từ ManagerCont
          // RepairTicket chỉ nên được cập nhật thông qua quy trình kiểm tra container thực tế
          // Không phải thông qua việc cập nhật trạng thái từ ManagerCont
          console.log(`🔒 Bảo vệ RepairTicket cho container ${container_no}: Không cập nhật RepairTicket khi thay đổi container_quality từ ManagerCont`);
          console.log(`ℹ️ Container quality được cập nhật thành ${container_quality} nhưng RepairTicket giữ nguyên trạng thái ${latestRepairTicket.status}`);
          console.log(`ℹ️ RepairTicket chỉ nên được cập nhật thông qua quy trình kiểm tra container thực tế, không phải từ ManagerCont`);
        } else {
          // 🔒 BẢO VỆ: KHÔNG tự động tạo RepairTicket mới khi cập nhật container_quality
          // RepairTicket chỉ nên được tạo thông qua quy trình kiểm tra container thực tế
          // Không phải thông qua việc cập nhật trạng thái từ ManagerCont
          console.log(`🔒 Bảo vệ: Không tự động tạo RepairTicket mới cho container ${container_no} khi cập nhật container_quality thành ${container_quality}`);
          console.log(`ℹ️ Container quality được cập nhật thành ${container_quality} nhưng không tạo RepairTicket mới`);
        }
      }

      return res.json({
        success: true,
        message: 'Cập nhật thông tin container thành công',
        data: {
          container_no,
          customer: customer,
          shipping_line: updatedContainer?.shipping_line || null,
          container_type: updatedContainer?.container_type || null,
          seal_number: updatedContainer?.seal_number || null,
          dem_det: updatedContainer?.dem_det || null
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