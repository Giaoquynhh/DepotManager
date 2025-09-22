import Joi from 'joi';
import { Request, Response, NextFunction } from 'express';

export const holdSchema = Joi.object({
  slot_id: Joi.string().required(),
  tier: Joi.number().integer().min(1).optional(),
});

export const confirmSchema = Joi.object({
  slot_id: Joi.string().required(),
  tier: Joi.number().integer().min(1).required(),
  container_no: Joi.string().required(),
});

export const releaseSchema = Joi.object({
  slot_id: Joi.string().required(),
  tier: Joi.number().integer().min(1).required(),
});

export const removeByContainerSchema = Joi.object({
  container_no: Joi.string().required(),
});

export const liftContainerSchema = Joi.object({
  container_no: Joi.string().required(),
});

export const validate = (schema: Joi.ObjectSchema) => (req: Request, res: Response, next: NextFunction) => {
  const options = { abortEarly: false, stripUnknown: true, convert: true } as const;
  const { error, value } = schema.validate(req.body, options);
  if (error) {
    return res.status(400).json({
      message: 'Dữ liệu không hợp lệ',
      details: error.details.map((d) => d.message),
    });
  }
  req.body = value;
  next();
};
