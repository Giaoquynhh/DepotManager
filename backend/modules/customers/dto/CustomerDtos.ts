import Joi from 'joi';

export const createCustomerSchema = Joi.object({
	code: Joi.string().required(),
	name: Joi.string().required(),
	tax_code: Joi.string().optional(),
	address: Joi.string().optional(),
	contact_email: Joi.string().email().optional()
});

export const updateCustomerSchema = Joi.object({
	name: Joi.string().optional(),
	address: Joi.string().optional(),
	contact_email: Joi.string().email().optional()
});
