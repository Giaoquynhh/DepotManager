import { Request, Response, NextFunction } from 'express';
import { validate as classValidate, ValidationError } from 'class-validator';
import { plainToClass } from 'class-transformer';

export const validate = (dtoClass: any, source: 'body' | 'query' | 'params' = 'body') => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = req[source];
      const dto = plainToClass(dtoClass, data);
      const errors = await classValidate(dto);

      if (errors.length > 0) {
        const errorMessages = errors.map((error: ValidationError) => {
          const constraints = error.constraints || {};
          return Object.values(constraints).join(', ');
        });

        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errorMessages
        });
      }

      // Attach validated data to request
      (req as any)[`validated${source.charAt(0).toUpperCase() + source.slice(1)}`] = dto;
      next();
    } catch (error) {
      console.error('Validation error:', error);
      return res.status(500).json({
        success: false,
        message: 'Validation error'
      });
    }
  };
};
