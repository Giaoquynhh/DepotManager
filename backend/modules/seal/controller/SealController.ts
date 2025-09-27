import { Request, Response } from 'express';
import { AuthRequest } from '../../../shared/middlewares/auth';
import { audit } from '../../../shared/middlewares/audit';
import service from '../service/SealService';
import { CreateSealDto, UpdateSealDto, SealListQueryDto } from '../dto/SealDtos';

export class SealController {
  async create(req: AuthRequest, res: Response) {
    try {
      const data: CreateSealDto = req.body;
      const userId = req.user!._id;

      const seal = await service.create(data, userId);

      // Audit log
      await audit(userId, 'SEAL_CREATED', 'SEAL', seal.id, {
        shipping_company: seal.shipping_company,
        quantity_purchased: seal.quantity_purchased,
        unit_price: seal.unit_price
      });

      return res.status(201).json({
        success: true,
        message: 'Seal created successfully',
        data: seal
      });
    } catch (error: any) {
      console.error('Error creating seal:', error);
      return res.status(400).json({
        success: false,
        message: error.message || 'Failed to create seal'
      });
    }
  }

  async list(req: Request, res: Response) {
    try {
      const query: SealListQueryDto = {
        search: req.query.search as string || '',
        shipping_company: req.query.shipping_company as string || '',
        status: req.query.status as string || '',
        page: req.query.page ? parseInt(req.query.page as string) : 1,
        pageSize: req.query.pageSize ? parseInt(req.query.pageSize as string) : 20
      };
      const result = await service.list(query);

      return res.json({
        success: true,
        data: result
      });
    } catch (error: any) {
      console.error('Error listing seals:', error);
      return res.status(500).json({
        success: false,
        message: error.message || 'Failed to list seals'
      });
    }
  }

  async getById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const seal = await service.getById(id);

      return res.json({
        success: true,
        data: seal
      });
    } catch (error: any) {
      console.error('Error getting seal:', error);
      return res.status(404).json({
        success: false,
        message: error.message || 'Seal not found'
      });
    }
  }

  async update(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const data: UpdateSealDto = req.body;
      const userId = req.user!._id;

      const seal = await service.update(id, data, userId);

      // Audit log
      await audit(userId, 'SEAL_UPDATED', 'SEAL', id, {
        updated_fields: Object.keys(data),
        previous_data: req.body._previousData || {}
      });

      return res.json({
        success: true,
        message: 'Seal updated successfully',
        data: seal
      });
    } catch (error: any) {
      console.error('Error updating seal:', error);
      return res.status(400).json({
        success: false,
        message: error.message || 'Failed to update seal'
      });
    }
  }

  async delete(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const userId = req.user!._id;

      const result = await service.delete(id);

      // Audit log
      await audit(userId, 'SEAL_DELETED', 'SEAL', id);

      return res.json({
        success: true,
        message: result.message
      });
    } catch (error: any) {
      console.error('Error deleting seal:', error);
      return res.status(400).json({
        success: false,
        message: error.message || 'Failed to delete seal'
      });
    }
  }

  async getStatistics(req: Request, res: Response) {
    try {
      const statistics = await service.getStatistics();

      return res.json({
        success: true,
        data: statistics
      });
    } catch (error: any) {
      console.error('Error getting seal statistics:', error);
      return res.status(500).json({
        success: false,
        message: error.message || 'Failed to get seal statistics'
      });
    }
  }

  async incrementExportedQuantity(req: AuthRequest, res: Response) {
    try {
      const { shipping_company, seal_number, container_number, request_id } = req.body;
      const userId = req.user!._id;

      if (!shipping_company) {
        return res.status(400).json({
          success: false,
          message: 'Shipping company is required'
        });
      }

      const updatedSeal = await service.incrementExportedQuantity(
        shipping_company, 
        userId, 
        seal_number, 
        container_number, 
        request_id
      );

      // Audit log
      await audit(userId, 'SEAL_EXPORTED', 'SEAL', updatedSeal.id, {
        shipping_company: updatedSeal.shipping_company,
        quantity_exported: updatedSeal.quantity_exported,
        quantity_remaining: updatedSeal.quantity_remaining
      });

      return res.json({
        success: true,
        message: 'Seal exported quantity updated successfully',
        data: updatedSeal
      });
    } catch (error: any) {
      console.error('Error incrementing exported quantity:', error);
      return res.status(400).json({
        success: false,
        message: error.message || 'Failed to update exported quantity'
      });
    }
  }

  async getUsageHistory(req: Request, res: Response) {
    try {
      const { id } = req.params;

      if (!id) {
        return res.status(400).json({
          success: false,
          message: 'Seal ID is required'
        });
      }

      const history = await service.getUsageHistory(id);

      return res.json({
        success: true,
        data: history
      });
    } catch (error: any) {
      console.error('Error getting seal usage history:', error);
      return res.status(500).json({
        success: false,
        message: error.message || 'Failed to get seal usage history'
      });
    }
  }
}

export default new SealController();
