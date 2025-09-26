import Joi from 'joi';

export const dashboardQuerySchema = Joi.object({
  from: Joi.date().optional(),
  to: Joi.date().optional(),
  customer_id: Joi.string().optional()
});

export const customReportSchema = Joi.object({
  type: Joi.string().valid('revenue_by_day','payments_by_day','requests_status','yard_utilization','forklift_productivity','ar_aging').required(),
  filters: Joi.object({
    from: Joi.date().optional(),
    to: Joi.date().optional(),
    customer_id: Joi.string().optional()
  }).default({})
});

export const exportSchema = Joi.object({
  type: Joi.string().valid('revenue_by_day','payments_by_day','requests_status','yard_utilization','forklift_productivity','ar_aging').required(),
  format: Joi.string().valid('csv','pdf').default('csv'),
  filename: Joi.string().default('report'),
  filters: Joi.object({
    from: Joi.date().optional(),
    to: Joi.date().optional(),
    customer_id: Joi.string().optional()
  }).default({})
});

export const containerListQuerySchema = Joi.object({
  q: Joi.string().optional(),
  status: Joi.string().optional(),
  type: Joi.string().optional(),
  // Cho phép đặc biệt 'COMPLETED' (hợp nhất Gate checked hoặc RepairTicket COMPLETED)
  // và các trạng thái ServiceRequest hợp lệ khác để lọc trực tiếp theo trạng thái SR mới nhất
  service_status: Joi.string().valid(
    'COMPLETED',
    'PENDING','SCHEDULED','FORWARDED','GATE_IN','CHECKING','GATE_REJECTED','REJECTED','COMPLETED','EXPORTED','IN_YARD','LEFT_YARD','PENDING_ACCEPT','CHECKED','SYSTEM_ADMIN_ADDED'
  ).optional(),
  not_in_yard: Joi.boolean().optional(), // Lọc container chưa vào bãi
  page: Joi.number().integer().min(1).default(1),
  pageSize: Joi.number().integer().min(1).max(200).default(20)
});


