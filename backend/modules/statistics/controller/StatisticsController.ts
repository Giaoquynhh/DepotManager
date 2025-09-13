import { Request, Response } from 'express';
import { StatisticsService } from '../service/StatisticsService';
import { PrismaClient } from '@prisma/client';
import { StatisticsResponse, TimeRangeQuery } from '../dto/StatisticsDtos';

export class StatisticsController {
  private statisticsService: StatisticsService;

  constructor() {
    const prisma = new PrismaClient();
    this.statisticsService = new StatisticsService(prisma);
  }

  async getOverview(req: Request, res: Response) {
    try {
      const { timeRange = 'today' } = req.query as { timeRange?: 'today' | 'week' | 'month' | 'year' };
      
      const data = await this.statisticsService.getOverview(timeRange);
      
      const response: StatisticsResponse<typeof data> = {
        success: true,
        data,
        message: 'Statistics overview retrieved successfully',
      };

      res.json(response);
    } catch (error) {
      console.error('Error getting statistics overview:', error);
      res.status(500).json({
        success: false,
        data: null,
        message: 'Internal server error',
      });
    }
  }

  async getContainers(req: Request, res: Response) {
    try {
      const { timeRange = 'today' } = req.query as { timeRange?: 'today' | 'week' | 'month' | 'year' };
      const overview = await this.statisticsService.getOverview(timeRange);
      
      const response: StatisticsResponse<typeof overview.containers> = {
        success: true,
        data: overview.containers,
        message: 'Container statistics retrieved successfully',
      };

      res.json(response);
    } catch (error) {
      console.error('Error getting container statistics:', error);
      res.status(500).json({
        success: false,
        data: null,
        message: 'Internal server error',
      });
    }
  }

  async getCustomers(req: Request, res: Response) {
    try {
      const { timeRange = 'today' } = req.query as { timeRange?: 'today' | 'week' | 'month' | 'year' };
      const overview = await this.statisticsService.getOverview(timeRange);
      
      const response: StatisticsResponse<typeof overview.customers> = {
        success: true,
        data: overview.customers,
        message: 'Customer statistics retrieved successfully',
      };

      res.json(response);
    } catch (error) {
      console.error('Error getting customer statistics:', error);
      res.status(500).json({
        success: false,
        data: null,
        message: 'Internal server error',
      });
    }
  }

  async getMaintenance(req: Request, res: Response) {
    try {
      const { timeRange = 'today' } = req.query as { timeRange?: 'today' | 'week' | 'month' | 'year' };
      const overview = await this.statisticsService.getOverview(timeRange);
      
      const response: StatisticsResponse<typeof overview.maintenance> = {
        success: true,
        data: overview.maintenance,
        message: 'Maintenance statistics retrieved successfully',
      };

      res.json(response);
    } catch (error) {
      console.error('Error getting maintenance statistics:', error);
      res.status(500).json({
        success: false,
        data: null,
        message: 'Internal server error',
      });
    }
  }

  async getFinancial(req: Request, res: Response) {
    try {
      const { timeRange = 'today' } = req.query as { timeRange?: 'today' | 'week' | 'month' | 'year' };
      const overview = await this.statisticsService.getOverview(timeRange);
      
      const response: StatisticsResponse<typeof overview.financial> = {
        success: true,
        data: overview.financial,
        message: 'Financial statistics retrieved successfully',
      };

      res.json(response);
    } catch (error) {
      console.error('Error getting financial statistics:', error);
      res.status(500).json({
        success: false,
        data: null,
        message: 'Internal server error',
      });
    }
  }

  async getOperational(req: Request, res: Response) {
    try {
      const { timeRange = 'today' } = req.query as { timeRange?: 'today' | 'week' | 'month' | 'year' };
      const overview = await this.statisticsService.getOverview(timeRange);
      
      const response: StatisticsResponse<typeof overview.operational> = {
        success: true,
        data: overview.operational,
        message: 'Operational statistics retrieved successfully',
      };

      res.json(response);
    } catch (error) {
      console.error('Error getting operational statistics:', error);
      res.status(500).json({
        success: false,
        data: null,
        message: 'Internal server error',
      });
    }
  }
}
