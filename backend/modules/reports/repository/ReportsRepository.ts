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

  async containerList(params: { q?: string; status?: string; type?: string; service_status?: string; page: number; pageSize: number }){
    // Hợp nhất: ServiceRequest mới nhất + RepairTicket đã CHECKED (bảo trì)
    const raw = await prisma.$queryRaw<any[]>`
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
        ORDER BY sr.container_no, sr."createdAt" DESC
      ),
      rt_checked AS (
        SELECT DISTINCT ON (rt.container_no)
               rt.container_no,
               TRUE as repair_checked,
               rt."updatedAt" as updated_at
        FROM "RepairTicket" rt
        WHERE rt.status::text = 'CHECKED'
        ORDER BY rt.container_no, rt."updatedAt" DESC
      ),
      base_containers AS (
        SELECT container_no FROM latest_sr
        UNION
        SELECT container_no FROM rt_checked
      )
      SELECT bc.container_no,
             cm.dem_date, cm.det_date,
             ys.status as slot_status, ys.code as slot_code, yb.code as block_code, y.name as yard_name,
             ls.service_status as service_status,
             ls.gate_checked_at as service_gate_checked_at,
             ls.driver_name as service_driver_name,
             ls.license_plate as service_license_plate,
             ls.gate_ref as service_gate_ref,
             COALESCE(rt.repair_checked, FALSE) as repair_checked
      FROM base_containers bc
      LEFT JOIN latest_sr ls ON ls.container_no = bc.container_no
      LEFT JOIN rt_checked rt ON rt.container_no = bc.container_no
      LEFT JOIN "ContainerMeta" cm ON cm.container_no = bc.container_no
      LEFT JOIN "YardSlot" ys ON ys."occupant_container_no" = bc.container_no
      LEFT JOIN "YardBlock" yb ON yb.id = ys.block_id
      LEFT JOIN "Yard" y ON y.id = yb.yard_id
      WHERE (${params.q ?? null} IS NULL OR bc.container_no ILIKE '%' || ${params.q ?? null} || '%')
        AND (${params.status ?? null} IS NULL OR ys.status = ${params.status ?? null})
        AND (
          ${params.service_status ?? null} IS NULL OR
          (${params.service_status ?? null} = 'CHECKED' AND (ls.gate_checked_at IS NOT NULL OR COALESCE(rt.repair_checked, FALSE) = TRUE)) OR
          (${params.service_status ?? null} <> 'CHECKED' AND ls.service_status = ${params.service_status ?? null})
        )
      ORDER BY bc.container_no
      LIMIT ${params.pageSize} OFFSET ${(params.page-1) * params.pageSize}
    `;
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
        ORDER BY sr.container_no, sr."createdAt" DESC
      ),
      rt_checked AS (
        SELECT DISTINCT ON (rt.container_no)
               rt.container_no,
               TRUE as repair_checked,
               rt."updatedAt" as updated_at
        FROM "RepairTicket" rt
        WHERE rt.status::text = 'CHECKED'
        ORDER BY rt.container_no, rt."updatedAt" DESC
      ),
      base_containers AS (
        SELECT container_no FROM latest_sr
        UNION
        SELECT container_no FROM rt_checked
      )
      SELECT COUNT(*)::int as cnt
      FROM base_containers bc
      LEFT JOIN latest_sr ls ON ls.container_no = bc.container_no
      LEFT JOIN rt_checked rt ON rt.container_no = bc.container_no
      LEFT JOIN "YardSlot" ys ON ys."occupant_container_no" = bc.container_no
      WHERE (${params.q ?? null} IS NULL OR bc.container_no ILIKE '%' || ${params.q ?? null} || '%')
        AND (${params.status ?? null} IS NULL OR ys.status = ${params.status ?? null})
        AND (
          ${params.service_status ?? null} IS NULL OR
          (${params.service_status ?? null} = 'CHECKED' AND (ls.gate_checked_at IS NOT NULL OR COALESCE(rt.repair_checked, FALSE) = TRUE)) OR
          (${params.service_status ?? null} <> 'CHECKED' AND ls.service_status = ${params.service_status ?? null})
        )
    `)[0]?.cnt || 0;
    return { items: raw, total, page: params.page, pageSize: params.pageSize };
  }
}

export default new ReportsRepository();


