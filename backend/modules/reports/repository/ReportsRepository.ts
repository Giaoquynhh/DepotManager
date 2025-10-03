import { prisma } from '../../../shared/config/database';

export type DateRange = { from?: Date; to?: Date };

function dateFilter(column: string, range: DateRange){
  const where: any = {};
  if (range.from || range.to){
    where[column] = { gte: range.from ?? undefined, lte: range.to ?? undefined };
  }
  return where;
}

export class ReportsRepository {
  async revenueByDay(range: DateRange, customerId?: string){
    // Sum revenue from issued invoices (UNPAID/PARTIALLY_PAID/PAID)
    const rows = await prisma.invoice.groupBy({
      by: ['issue_date'],
      where: {
        issue_date: { not: null, gte: range.from ?? undefined, lte: range.to ?? undefined },
        status: { in: ['UNPAID','PARTIALLY_PAID','PAID'] },
        customer_id: customerId ?? undefined as any
      },
      _sum: { total_amount: true }
    });
    return rows.filter(r=>r.issue_date).map(r=>({ day: (r.issue_date as Date).toISOString().slice(0,10), revenue: Number(r._sum.total_amount || 0) }));
  }

  async paymentsByDay(range: DateRange, customerId?: string){
    const rows = await prisma.payment.groupBy({
      by: ['paid_date'],
      where: { paid_date: { gte: range.from ?? undefined, lte: range.to ?? undefined }, customer_id: customerId ?? undefined as any },
      _sum: { amount: true }
    });
    return rows.map(r=>({ day: (r.paid_date as Date).toISOString().slice(0,10), amount: Number(r._sum.amount || 0) }));
  }

  async requestsStatus(range: DateRange){
    const rows = await prisma.serviceRequest.groupBy({
      by: ['status'],
      where: { createdAt: { gte: range.from ?? undefined, lte: range.to ?? undefined } },
      _count: { _all: true }
    });
    return rows.map(r=>({ status: r.status, count: r._count._all }));
  }

  async yardUtilization(){
    const total = await prisma.yardSlot.count();
    const occupied = await prisma.yardSlot.count({ where: { status: { in: ['OCCUPIED','RESERVED','UNDER_MAINTENANCE'] } } });
    return { total, occupied, utilization: total ? Math.round(occupied*10000/total)/100 : 0 };
  }

  async forkliftProductivity(range: DateRange){
    const rows = await prisma.forkliftTask.groupBy({
      by: ['status'],
      where: { createdAt: { gte: range.from ?? undefined, lte: range.to ?? undefined } },
      _count: { _all: true }
    });
    return rows.map(r=>({ status: r.status, count: r._count._all }));
  }

  async arAging(asOf: Date, customerId?: string){
    // Outstanding = total_amount - paid_total for issued invoices
    const invoices = await prisma.invoice.findMany({ where: { status: { in: ['UNPAID','PARTIALLY_PAID'] }, customer_id: customerId ?? undefined as any } });
    const buckets = { b0_30: 0, b31_60: 0, b61_90: 0, b90_plus: 0 } as Record<string, number>;
    for (const inv of invoices){
      if (!inv.issue_date) continue;
      const age = Math.floor((asOf.getTime() - new Date(inv.issue_date).getTime())/ (24*3600*1000));
      const outstanding = Number(inv.total_amount) - Number(inv.paid_total);
      if (outstanding <= 0) continue;
      if (age <= 30) buckets.b0_30 += outstanding; else if (age <= 60) buckets.b31_60 += outstanding; else if (age <= 90) buckets.b61_90 += outstanding; else buckets.b90_plus += outstanding;
    }
    return buckets;
  }

  async containerList(params: { q?: string; status?: string; type?: string; service_status?: string; not_in_yard?: boolean; page: number; pageSize: number }){
    // Sửa lại query để đảm bảo container từ YardPlacement được trả về và tránh duplicate
    const raw = await prisma.$queryRaw<any[]>`
      WITH latest_sr AS (
        SELECT DISTINCT ON (sr.container_no)
          sr.container_no,
          sr.status as service_status,
          sr.gate_checked_at as gate_checked_at,
          sr.driver_name as driver_name,
          sr.license_plate as license_plate,
          sr.gate_ref as gate_ref,
          sr."createdAt" as created_at,
          sr.shipping_line_id,
          sr.container_type_id,
          sr.customer_id,
          sr.vehicle_company_id,
          sr.dem_det,
          sr.seal_number,
          sr.request_no
        FROM "ServiceRequest" sr
        WHERE sr.container_no IS NOT NULL
          AND sr.status NOT IN ('GATE_OUT', 'DONE_LIFTING', 'IN_CAR', 'REJECTED', 'GATE_REJECTED')
        ORDER BY sr.container_no, sr."createdAt" DESC
      ),
      rt_checked AS (
        SELECT DISTINCT ON (rt.container_no)
          rt.container_no,
          TRUE as repair_checked,
          rt."updatedAt" as updated_at
        FROM "RepairTicket" rt
        WHERE rt.status::text = 'COMPLETE' AND rt.container_no IS NOT NULL
        ORDER BY rt.container_no, rt."updatedAt" DESC
      ),
      base_containers AS (
        -- Ưu tiên: ServiceRequest trước, sau đó RepairTicket, cuối cùng YardPlacement
        SELECT DISTINCT ON (container_no)
          container_no,
          source,
          priority
        FROM (
          -- ServiceRequest có ưu tiên cao nhất
          SELECT container_no, 'SERVICE_REQUEST' as source, 1 as priority FROM latest_sr
          UNION ALL
          -- RepairTicket có ưu tiên thứ 2
          SELECT container_no, 'REPAIR_TICKET' as source, 2 as priority FROM rt_checked
          UNION ALL
          -- YardPlacement có ưu tiên thấp nhất (chỉ khi không có trong 2 nguồn trên)
          SELECT yp.container_no, 'YARD_PLACEMENT' as source, 3 as priority
          FROM "YardPlacement" yp 
          WHERE yp.status = 'OCCUPIED' 
            AND yp.removed_at IS NULL
            AND yp.container_no IS NOT NULL
            AND yp.container_no NOT IN (
              SELECT container_no FROM latest_sr
              UNION
              SELECT container_no FROM rt_checked
            )
        ) all_sources
        ORDER BY container_no, priority
      ),
      params AS (
        SELECT
          CAST(${params.q ?? null} AS TEXT)             AS q,
          CAST(${params.status ?? null} AS TEXT)        AS status,
          CAST(${params.service_status ?? null} AS TEXT) AS service_status,
          CAST(${params.not_in_yard ?? null} AS BOOLEAN) AS not_in_yard
      )
      SELECT DISTINCT ON (bc.container_no)
        bc.container_no,
        cm.dem_date, 
        cm.det_date,
        yp.status as placement_status, 
        ys.code as slot_code, 
        yb.code as block_code, 
        y.name as yard_name,
        CASE 
          WHEN bc.source = 'YARD_PLACEMENT' THEN 'SYSTEM_ADMIN_ADDED'
          ELSE COALESCE(ls.service_status, 'UNKNOWN')
        END as service_status,
        ls.gate_checked_at as service_gate_checked_at,
        ls.driver_name as service_driver_name,
        ls.license_plate as service_license_plate,
        ls.gate_ref as service_gate_ref,
        COALESCE(rt.repair_checked, FALSE) as repair_checked,
        rt.updated_at as repair_updated_at,
        yp.tier as placement_tier,
        bc.source as data_source,
        -- Thông tin từ request hoặc container (ưu tiên request)
        COALESCE(ls.shipping_line_id, c.shipping_line_id) as shipping_line_id,
        COALESCE(ls.container_type_id, c.container_type_id) as container_type_id,
        COALESCE(ls.customer_id, c.customer_id) as customer_id,
        ls.vehicle_company_id,
        COALESCE(ls.dem_det, c.dem_det) as dem_det,
        COALESCE(ls.seal_number, c.seal_number) as seal_number,
        ls.request_no
      FROM base_containers bc
      LEFT JOIN latest_sr ls ON ls.container_no = bc.container_no
      LEFT JOIN rt_checked rt ON rt.container_no = bc.container_no
      LEFT JOIN "Container" c ON c.container_no = bc.container_no
      LEFT JOIN "ContainerMeta" cm ON cm.container_no = bc.container_no
      LEFT JOIN "YardPlacement" yp ON yp.container_no = bc.container_no AND yp.status = 'OCCUPIED' AND yp.removed_at IS NULL
      LEFT JOIN "YardSlot" ys ON ys.id = yp.slot_id
      LEFT JOIN "YardBlock" yb ON yb.id = ys.block_id
      LEFT JOIN "Yard" y ON y.id = yb.yard_id
      CROSS JOIN params p
      WHERE (p.q IS NULL OR bc.container_no ILIKE ('%' || p.q || '%'))
        AND (p.status IS NULL OR ys.status::text = p.status)
        AND (p.not_in_yard IS NULL OR (p.not_in_yard = TRUE AND yp.container_no IS NULL) OR (p.not_in_yard = FALSE AND yp.container_no IS NOT NULL))
        AND (
          p.service_status IS NULL OR
          -- Chỉ lấy container đã kiểm tra: có gate_checked_at (từ ServiceRequest) hoặc repair_checked = TRUE (từ RepairTicket)
          (p.service_status = 'COMPLETED' AND (ls.gate_checked_at IS NOT NULL OR COALESCE(rt.repair_checked, FALSE) = TRUE)) OR
          -- Lấy container đã CHECKED: phải có ServiceRequest CHECKED + gate_checked_at VÀ RepairTicket COMPLETE (GOOD quality)
          (p.service_status = 'CHECKED' AND (
            (ls.service_status::text = 'CHECKED' AND ls.gate_checked_at IS NOT NULL AND COALESCE(rt.repair_checked, FALSE) = TRUE)
          )) OR
          -- Lấy container theo service_status khác
          (p.service_status NOT IN ('COMPLETED', 'CHECKED') AND (
            ls.service_status::text = p.service_status OR 
            (bc.source = 'YARD_PLACEMENT' AND p.service_status = 'SYSTEM_ADMIN_ADDED')
          ))
        )
      ORDER BY bc.container_no, bc.priority
      LIMIT ${params.pageSize} OFFSET ${(params.page-1) * params.pageSize}
    `;
    
    // Lấy thông tin chi tiết từ các bảng liên quan
    const containersWithDetails = await Promise.all(
      raw.map(async (container: any) => {
        const details: any = {};
        
        // Lấy thông tin shipping line
        if (container.shipping_line_id) {
          const shippingLine = await prisma.shippingLine.findUnique({
            where: { id: container.shipping_line_id },
            select: { name: true, code: true }
          });
          details.shipping_line = shippingLine;
        }
        
        // Lấy thông tin container type
        if (container.container_type_id) {
          const containerType = await prisma.containerType.findUnique({
            where: { id: container.container_type_id },
            select: { code: true, description: true }
          });
          details.container_type = containerType;
        }
        
        // Lấy thông tin customer
        if (container.customer_id) {
          const customer = await prisma.customer.findUnique({
            where: { id: container.customer_id },
            select: { name: true, code: true }
          });
          details.customer = customer;
        }
        
        // Lấy thông tin transport company
        if (container.vehicle_company_id) {
          const transportCompany = await prisma.transportCompany.findUnique({
            where: { id: container.vehicle_company_id },
            select: { name: true, code: true }
          });
          details.transport_company = transportCompany;
        }
        
        // Lấy thông tin repair ticket để xác định trạng thái
        if (container.container_no) {
          // Chọn ticket mới nhất theo updatedAt (ưu tiên chính xác trạng thái hiện hành)
          const repairTicket = await prisma.repairTicket.findFirst({
            where: { container_no: container.container_no },
            orderBy: { updatedAt: 'desc' },
            select: { status: true, id: true }
          });
          details.repair_ticket = repairTicket;
        }
        
        // Lấy thông tin attachments từ request
        if (container.request_no) {
          const request = await prisma.serviceRequest.findFirst({
            where: { request_no: container.request_no },
            include: {
              attachments: {
                where: { deleted_at: null },
                select: { 
                  id: true, 
                  file_name: true, 
                  file_type: true, 
                  storage_url: true,
                  file_size: true
                }
              }
            }
          });
          details.attachments = request?.attachments || [];
        }
        
        return { ...container, ...details };
      })
    );
    
    const total = (await prisma.$queryRaw<any[]>`
      WITH latest_sr AS (
        SELECT DISTINCT ON (sr.container_no)
          sr.container_no,
          sr.status as service_status,
          sr.gate_checked_at as gate_checked_at,
          sr.driver_name as driver_name,
          sr.license_plate as license_plate,
          sr.gate_ref as gate_ref,
          sr."createdAt" as created_at
        FROM "ServiceRequest" sr
        WHERE sr.container_no IS NOT NULL
          AND sr.status NOT IN ('GATE_OUT', 'DONE_LIFTING', 'IN_CAR', 'REJECTED', 'GATE_REJECTED')
        ORDER BY sr.container_no, sr."createdAt" DESC
      ),
      rt_checked AS (
        SELECT DISTINCT ON (rt.container_no)
          rt.container_no,
          TRUE as repair_checked,
          rt."updatedAt" as updated_at
        FROM "RepairTicket" rt
        WHERE rt.status::text = 'COMPLETE' AND rt.container_no IS NOT NULL
        ORDER BY rt.container_no, rt."updatedAt" DESC
      ),
      base_containers AS (
        -- Ưu tiên: ServiceRequest trước, sau đó RepairTicket, cuối cùng YardPlacement
        SELECT DISTINCT ON (container_no)
          container_no,
          source,
          priority
        FROM (
          -- ServiceRequest có ưu tiên cao nhất
          SELECT container_no, 'SERVICE_REQUEST' as source, 1 as priority FROM latest_sr
          UNION ALL
          -- RepairTicket có ưu tiên thứ 2
          SELECT container_no, 'REPAIR_TICKET' as source, 2 as priority FROM rt_checked
          UNION ALL
          -- YardPlacement có ưu tiên thấp nhất (chỉ khi không có trong 2 nguồn trên)
          SELECT yp.container_no, 'YARD_PLACEMENT' as source, 3 as priority
          FROM "YardPlacement" yp 
          WHERE yp.status = 'OCCUPIED' 
            AND yp.removed_at IS NULL
            AND yp.container_no IS NOT NULL
            AND yp.container_no NOT IN (
              SELECT container_no FROM latest_sr
              UNION
              SELECT container_no FROM rt_checked
            )
        ) all_sources
        ORDER BY container_no, priority
      ),
      params AS (
        SELECT
          CAST(${params.q ?? null} AS TEXT)             AS q,
          CAST(${params.status ?? null} AS TEXT)        AS status,
          CAST(${params.service_status ?? null} AS TEXT) AS service_status,
          CAST(${params.not_in_yard ?? null} AS BOOLEAN) AS not_in_yard
      )
      SELECT COUNT(DISTINCT bc.container_no)::int as cnt
      FROM base_containers bc
      LEFT JOIN latest_sr ls ON ls.container_no = bc.container_no
      LEFT JOIN rt_checked rt ON rt.container_no = bc.container_no
      LEFT JOIN "YardPlacement" yp ON yp.container_no = bc.container_no AND yp.status = 'OCCUPIED' AND yp.removed_at IS NULL
      LEFT JOIN "YardSlot" ys ON ys.id = yp.slot_id
      CROSS JOIN params p
      WHERE (p.q IS NULL OR bc.container_no ILIKE ('%' || p.q || '%'))
        AND (p.status IS NULL OR ys.status::text = p.status)
        AND (p.not_in_yard IS NULL OR (p.not_in_yard = TRUE AND yp.container_no IS NULL) OR (p.not_in_yard = FALSE AND yp.container_no IS NOT NULL))
        AND (
          p.service_status IS NULL OR
          -- Chỉ lấy container đã kiểm tra: có gate_checked_at (từ ServiceRequest) hoặc repair_checked = TRUE (từ RepairTicket)
          (p.service_status = 'COMPLETED' AND (ls.gate_checked_at IS NOT NULL OR COALESCE(rt.repair_checked, FALSE) = TRUE)) OR
          -- Lấy container đã CHECKED: phải có ServiceRequest CHECKED + gate_checked_at VÀ RepairTicket COMPLETE (GOOD quality)
          (p.service_status = 'CHECKED' AND (
            (ls.service_status::text = 'CHECKED' AND ls.gate_checked_at IS NOT NULL AND COALESCE(rt.repair_checked, FALSE) = TRUE)
          )) OR
          -- Lấy container theo service_status khác
          (p.service_status NOT IN ('COMPLETED', 'CHECKED') AND (
            ls.service_status::text = p.service_status OR 
            (bc.source = 'YARD_PLACEMENT' AND p.service_status = 'SYSTEM_ADMIN_ADDED')
          ))
        )
    `)[0]?.cnt || 0;
    
    return { items: containersWithDetails, total, page: params.page, pageSize: params.pageSize };
  }
}

export default new ReportsRepository();


