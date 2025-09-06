import Joi from 'joi';

export const createRequestSchema = Joi.object({
	type: Joi.string().valid('IMPORT','EXPORT','CONVERT').required(),
	container_no: Joi.when('type', {
		is: 'IMPORT',
		then: Joi.string().min(4).max(20).required(),
		otherwise: Joi.string().min(4).max(20).optional()
	}),
	eta: Joi.date().required()
});

export const updateRequestStatusSchema = Joi.object({
	status: Joi.string().valid('PENDING','PICK_CONTAINER','SCHEDULED','SCHEDULED_INFO_ADDED','FORWARDED','SENT_TO_GATE','CHECKING','REJECTED','COMPLETED','POSITIONED','FORKLIFTING','IN_YARD').required(),
	reason: Joi.string().optional()
});

export const updateContainerNoSchema = Joi.object({
	container_no: Joi.string().min(4).max(20).required()
});

export const rejectRequestSchema = Joi.object({
	reason: Joi.string().optional()
});

export const softDeleteRequestSchema = Joi.object({
	scope: Joi.string().valid('depot', 'customer').required()
});

export const restoreRequestSchema = Joi.object({
	scope: Joi.string().valid('depot', 'customer').required()
});

export const queryRequestSchema = Joi.object({
	type: Joi.string().optional(),
	status: Joi.string().optional(),
	actor: Joi.string().valid('depot', 'customer').optional(),
	includeHidden: Joi.boolean().optional(),
	page: Joi.number().integer().min(1).optional(),
	limit: Joi.number().integer().min(1).max(100).optional()
});

export const uploadDocSchema = Joi.object({
	type: Joi.string().valid('EIR','LOLO','INVOICE','SUPPLEMENT','EXPORT_DOC').required()
});

// New DTOs for State Machine
export const scheduleRequestSchema = Joi.object({
	appointment_time: Joi.date().required(),
	appointment_location_type: Joi.string().valid('gate', 'yard').optional(),
	appointment_location_id: Joi.string().allow('').optional(),
	gate_ref: Joi.string().allow('').optional(),
	appointment_note: Joi.string().allow('').optional()
});

export const addInfoSchema = Joi.object({
	documents: Joi.array().items(Joi.object({
		name: Joi.string().required(),
		type: Joi.string().required(),
		size: Joi.number().required()
	})).optional(),
	notes: Joi.string().optional()
});

export const sendToGateSchema = Joi.object({});

export const completeRequestSchema = Joi.object({});
