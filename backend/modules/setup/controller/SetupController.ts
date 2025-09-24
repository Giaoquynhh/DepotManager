import { Request, Response } from 'express';
import service from '../service/SetupService';
import { 
  CreateShippingLineDto, 
  UpdateShippingLineDto, 
  CreateTransportCompanyDto, 
  UpdateTransportCompanyDto,
  CreateContainerTypeDto,
  UpdateContainerTypeDto,
  CreateCustomerDto,
  UpdateCustomerDto,
  CreatePriceListDto,
  UpdatePriceListDto,
  PaginationQuery
} from '../dto/SetupDtos';

export class SetupController {
  // Shipping Lines
  async getShippingLines(req: Request, res: Response) {
    try {
      const query: PaginationQuery = {
        page: req.query.page ? parseInt(req.query.page as string) : undefined,
        limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
        search: req.query.search as string
      };

      const result = await service.getShippingLines(query);
      
      if (!result.success) {
        return res.status(400).json(result);
      }

      res.json(result);
    } catch (error) {
      console.error('Error in getShippingLines controller:', error);
      res.status(500).json({
        success: false,
        error: 'INTERNAL_SERVER_ERROR',
        message: 'An unexpected error occurred'
      });
    }
  }

  async getShippingLineById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const result = await service.getShippingLineById(id);
      
      if (!result.success) {
        const statusCode = result.error === 'NOT_FOUND' ? 404 : 400;
        return res.status(statusCode).json(result);
      }

      res.json(result);
    } catch (error) {
      console.error('Error in getShippingLineById controller:', error);
      res.status(500).json({
        success: false,
        error: 'INTERNAL_SERVER_ERROR',
        message: 'An unexpected error occurred'
      });
    }
  }

  async createShippingLine(req: Request, res: Response) {
    try {
      const data: CreateShippingLineDto = req.body;
      const result = await service.createShippingLine(data);
      
      if (!result.success) {
        const statusCode = result.error === 'VALIDATION_ERROR' ? 400 : 500;
        return res.status(statusCode).json(result);
      }

      res.status(201).json(result);
    } catch (error) {
      console.error('Error in createShippingLine controller:', error);
      res.status(500).json({
        success: false,
        error: 'INTERNAL_SERVER_ERROR',
        message: 'An unexpected error occurred'
      });
    }
  }

  async updateShippingLine(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const data: UpdateShippingLineDto = req.body;
      const result = await service.updateShippingLine(id, data);
      
      if (!result.success) {
        const statusCode = result.error === 'NOT_FOUND' ? 404 : 
                          result.error === 'VALIDATION_ERROR' ? 400 : 500;
        return res.status(statusCode).json(result);
      }

      res.json(result);
    } catch (error) {
      console.error('Error in updateShippingLine controller:', error);
      res.status(500).json({
        success: false,
        error: 'INTERNAL_SERVER_ERROR',
        message: 'An unexpected error occurred'
      });
    }
  }

  async deleteShippingLine(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const result = await service.deleteShippingLine(id);
      
      if (!result.success) {
        const statusCode = result.error === 'NOT_FOUND' ? 404 : 500;
        return res.status(statusCode).json(result);
      }

      res.json(result);
    } catch (error) {
      console.error('Error in deleteShippingLine controller:', error);
      res.status(500).json({
        success: false,
        error: 'INTERNAL_SERVER_ERROR',
        message: 'An unexpected error occurred'
      });
    }
  }

  // Transport Companies
  async getTransportCompanies(req: Request, res: Response) {
    try {
      const query: PaginationQuery = {
        page: req.query.page ? parseInt(req.query.page as string) : undefined,
        limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
        search: req.query.search as string
      };

      const result = await service.getTransportCompanies(query);
      
      if (!result.success) {
        return res.status(400).json(result);
      }

      res.json(result);
    } catch (error) {
      console.error('Error in getTransportCompanies controller:', error);
      res.status(500).json({
        success: false,
        error: 'INTERNAL_SERVER_ERROR',
        message: 'An unexpected error occurred'
      });
    }
  }

  async getTransportCompanyById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const result = await service.getTransportCompanyById(id);
      
      if (!result.success) {
        const statusCode = result.error === 'NOT_FOUND' ? 404 : 400;
        return res.status(statusCode).json(result);
      }

      res.json(result);
    } catch (error) {
      console.error('Error in getTransportCompanyById controller:', error);
      res.status(500).json({
        success: false,
        error: 'INTERNAL_SERVER_ERROR',
        message: 'An unexpected error occurred'
      });
    }
  }

  async createTransportCompany(req: Request, res: Response) {
    try {
      const data: CreateTransportCompanyDto = req.body;
      const result = await service.createTransportCompany(data);
      
      if (!result.success) {
        const statusCode = result.error === 'VALIDATION_ERROR' ? 400 : 500;
        return res.status(statusCode).json(result);
      }

      res.status(201).json(result);
    } catch (error) {
      console.error('Error in createTransportCompany controller:', error);
      res.status(500).json({
        success: false,
        error: 'INTERNAL_SERVER_ERROR',
        message: 'An unexpected error occurred'
      });
    }
  }

  async updateTransportCompany(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const data: UpdateTransportCompanyDto = req.body;
      const result = await service.updateTransportCompany(id, data);
      
      if (!result.success) {
        const statusCode = result.error === 'NOT_FOUND' ? 404 : 
                          result.error === 'VALIDATION_ERROR' ? 400 : 500;
        return res.status(statusCode).json(result);
      }

      res.json(result);
    } catch (error) {
      console.error('Error in updateTransportCompany controller:', error);
      res.status(500).json({
        success: false,
        error: 'INTERNAL_SERVER_ERROR',
        message: 'An unexpected error occurred'
      });
    }
  }

  async deleteTransportCompany(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const result = await service.deleteTransportCompany(id);
      
      if (!result.success) {
        const statusCode = result.error === 'NOT_FOUND' ? 404 : 500;
        return res.status(statusCode).json(result);
      }

      res.json(result);
    } catch (error) {
      console.error('Error in deleteTransportCompany controller:', error);
      res.status(500).json({
        success: false,
        error: 'INTERNAL_SERVER_ERROR',
        message: 'An unexpected error occurred'
      });
    }
  }

  // Bulk create shipping lines from Excel
  async bulkCreateShippingLines(req: Request, res: Response) {
    try {
      const { shippingLines } = req.body;
      
      if (!Array.isArray(shippingLines)) {
        return res.status(400).json({
          success: false,
          error: 'VALIDATION_ERROR',
          message: 'shippingLines must be an array'
        });
      }

      const results: {
        success: any[];
        failed: Array<{ data: any; error: string }>;
      } = {
        success: [],
        failed: []
      };

      for (const data of shippingLines) {
        try {
          const result = await service.createShippingLine(data);
          if (result.success && result.data) {
            results.success.push(result.data);
          } else {
            results.failed.push({
              data,
              error: result.message || 'Failed to create'
            });
          }
        } catch (error) {
          results.failed.push({
            data,
            error: 'Failed to create'
          });
        }
      }

      res.json({
        success: true,
        data: {
          imported: results.success.length,
          failed: results.failed.length,
          results: results
        },
        message: `Successfully imported ${results.success.length} shipping lines, ${results.failed.length} failed`
      });
    } catch (error) {
      console.error('Error in bulk create shipping lines:', error);
      res.status(500).json({
        success: false,
        error: 'INTERNAL_SERVER_ERROR',
        message: 'An unexpected error occurred'
      });
    }
  }

  // Upload transport company Excel file
  async uploadTransportCompanyExcel(req: Request, res: Response) {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          error: 'VALIDATION_ERROR',
          message: 'No file uploaded'
        });
      }

      const result = await service.uploadTransportCompanyExcel(req.file);
      
      if (!result.success) {
        const statusCode = result.error === 'VALIDATION_ERROR' ? 400 : 500;
        return res.status(statusCode).json(result);
      }

      res.json(result);
    } catch (error) {
      console.error('Error in uploadTransportCompanyExcel controller:', error);
      res.status(500).json({
        success: false,
        error: 'INTERNAL_SERVER_ERROR',
        message: 'An unexpected error occurred'
      });
    }
  }

  // Upload customer Excel file
  async uploadCustomerExcel(req: Request, res: Response) {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          error: 'VALIDATION_ERROR',
          message: 'No file uploaded'
        });
      }

      const result = await service.uploadCustomerExcel(req.file);

      if (!result.success) {
        const statusCode = result.error === 'VALIDATION_ERROR' ? 400 : 500;
        return res.status(statusCode).json(result);
      }

      res.json(result);
    } catch (error) {
      console.error('Error in uploadCustomerExcel controller:', error);
      res.status(500).json({
        success: false,
        error: 'INTERNAL_SERVER_ERROR',
        message: 'An unexpected error occurred'
      });
    }
  }

  // Upload container type Excel file
  async uploadContainerTypeExcel(req: Request, res: Response) {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          error: 'VALIDATION_ERROR',
          message: 'No file uploaded'
        });
      }

      const result = await service.uploadContainerTypeExcel(req.file);

      if (!result.success) {
        const statusCode = result.error === 'VALIDATION_ERROR' ? 400 : 500;
        return res.status(statusCode).json(result);
      }

      res.json(result);
    } catch (error) {
      console.error('Error in uploadContainerTypeExcel controller:', error);
      res.status(500).json({
        success: false,
        error: 'INTERNAL_SERVER_ERROR',
        message: 'An unexpected error occurred'
      });
    }
  }

  // Container Types
  async getContainerTypes(req: Request, res: Response) {
    try {
      const query: PaginationQuery = {
        page: req.query.page ? parseInt(req.query.page as string) : undefined,
        limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
        search: req.query.search as string
      };

      const result = await service.getContainerTypes(query);
      
      if (!result.success) {
        return res.status(400).json(result);
      }

      res.json(result);
    } catch (error) {
      console.error('Error in getContainerTypes controller:', error);
      res.status(500).json({
        success: false,
        error: 'INTERNAL_SERVER_ERROR',
        message: 'An unexpected error occurred'
      });
    }
  }

  async getContainerTypeById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const result = await service.getContainerTypeById(id);
      
      if (!result.success) {
        const statusCode = result.error === 'NOT_FOUND' ? 404 : 400;
        return res.status(statusCode).json(result);
      }

      res.json(result);
    } catch (error) {
      console.error('Error in getContainerTypeById controller:', error);
      res.status(500).json({
        success: false,
        error: 'INTERNAL_SERVER_ERROR',
        message: 'An unexpected error occurred'
      });
    }
  }

  async createContainerType(req: Request, res: Response) {
    try {
      const data: CreateContainerTypeDto = req.body;
      const result = await service.createContainerType(data);
      
      if (!result.success) {
        const statusCode = result.error === 'VALIDATION_ERROR' ? 400 : 500;
        return res.status(statusCode).json(result);
      }

      res.status(201).json(result);
    } catch (error) {
      console.error('Error in createContainerType controller:', error);
      res.status(500).json({
        success: false,
        error: 'INTERNAL_SERVER_ERROR',
        message: 'An unexpected error occurred'
      });
    }
  }

  async updateContainerType(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const data: UpdateContainerTypeDto = req.body;
      const result = await service.updateContainerType(id, data);
      
      if (!result.success) {
        const statusCode = result.error === 'NOT_FOUND' ? 404 : 
                          result.error === 'VALIDATION_ERROR' ? 400 : 500;
        return res.status(statusCode).json(result);
      }

      res.json(result);
    } catch (error) {
      console.error('Error in updateContainerType controller:', error);
      res.status(500).json({
        success: false,
        error: 'INTERNAL_SERVER_ERROR',
        message: 'An unexpected error occurred'
      });
    }
  }

  async deleteContainerType(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const result = await service.deleteContainerType(id);
      
      if (!result.success) {
        const statusCode = result.error === 'NOT_FOUND' ? 404 : 500;
        return res.status(statusCode).json(result);
      }

      res.json(result);
    } catch (error) {
      console.error('Error in deleteContainerType controller:', error);
      res.status(500).json({
        success: false,
        error: 'INTERNAL_SERVER_ERROR',
        message: 'An unexpected error occurred'
      });
    }
  }

  // Customers
  async getCustomers(req: Request, res: Response) {
    try {
      const query: PaginationQuery = {
        page: req.query.page ? parseInt(req.query.page as string) : undefined,
        limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
        search: req.query.search as string
      };

      const result = await service.getCustomers(query);
      
      if (!result.success) {
        return res.status(400).json(result);
      }

      res.json(result);
    } catch (error) {
      console.error('Error in getCustomers controller:', error);
      res.status(500).json({
        success: false,
        error: 'INTERNAL_SERVER_ERROR',
        message: 'An unexpected error occurred'
      });
    }
  }

  async getCustomerById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const result = await service.getCustomerById(id);
      
      if (!result.success) {
        const statusCode = result.error === 'NOT_FOUND' ? 404 : 400;
        return res.status(statusCode).json(result);
      }

      res.json(result);
    } catch (error) {
      console.error('Error in getCustomerById controller:', error);
      res.status(500).json({
        success: false,
        error: 'INTERNAL_SERVER_ERROR',
        message: 'An unexpected error occurred'
      });
    }
  }

  async createCustomer(req: Request, res: Response) {
    try {
      const data: CreateCustomerDto = req.body;
      const result = await service.createCustomer(data);
      
      if (!result.success) {
        const statusCode = result.error === 'VALIDATION_ERROR' ? 400 : 500;
        return res.status(statusCode).json(result);
      }

      res.status(201).json(result);
    } catch (error) {
      console.error('Error in createCustomer controller:', error);
      res.status(500).json({
        success: false,
        error: 'INTERNAL_SERVER_ERROR',
        message: 'An unexpected error occurred'
      });
    }
  }

  async updateCustomer(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const data: UpdateCustomerDto = req.body;
      const result = await service.updateCustomer(id, data);
      
      if (!result.success) {
        const statusCode = result.error === 'NOT_FOUND' ? 404 : 
                          result.error === 'VALIDATION_ERROR' ? 400 : 500;
        return res.status(statusCode).json(result);
      }

      res.json(result);
    } catch (error) {
      console.error('Error in updateCustomer controller:', error);
      res.status(500).json({
        success: false,
        error: 'INTERNAL_SERVER_ERROR',
        message: 'An unexpected error occurred'
      });
    }
  }

  async deleteCustomer(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const result = await service.deleteCustomer(id);
      
      if (!result.success) {
        const statusCode = result.error === 'NOT_FOUND' ? 404 : 500;
        return res.status(statusCode).json(result);
      }

      res.json(result);
    } catch (error) {
      console.error('Error in deleteCustomer controller:', error);
      res.status(500).json({
        success: false,
        error: 'INTERNAL_SERVER_ERROR',
        message: 'An unexpected error occurred'
      });
    }
  }

  async disableCustomer(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const result = await service.disableCustomer(id);
      
      if (!result.success) {
        const statusCode = result.error === 'NOT_FOUND' ? 404 : 500;
        return res.status(statusCode).json(result);
      }

      res.json(result);
    } catch (error) {
      console.error('Error in disableCustomer controller:', error);
      res.status(500).json({
        success: false,
        error: 'INTERNAL_SERVER_ERROR',
        message: 'An unexpected error occurred'
      });
    }
  }

  // PriceList
  async getPriceLists(req: Request, res: Response) {
    try {
      const query: PaginationQuery = {
        page: req.query.page ? parseInt(req.query.page as string) : undefined,
        limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
        search: req.query.search as string
      };

      const result = await service.getPriceLists(query);
      
      if (!result.success) {
        return res.status(400).json(result);
      }

      res.json(result);
    } catch (error) {
      console.error('Error in getPriceLists controller:', error);
      res.status(500).json({
        success: false,
        error: 'INTERNAL_SERVER_ERROR',
        message: 'An unexpected error occurred'
      });
    }
  }

  async getPriceListById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const result = await service.getPriceListById(id);
      
      if (!result.success) {
        const statusCode = result.error === 'NOT_FOUND' ? 404 : 400;
        return res.status(statusCode).json(result);
      }

      res.json(result);
    } catch (error) {
      console.error('Error in getPriceListById controller:', error);
      res.status(500).json({
        success: false,
        error: 'INTERNAL_SERVER_ERROR',
        message: 'An unexpected error occurred'
      });
    }
  }

  async createPriceList(req: Request, res: Response) {
    try {
      const data: CreatePriceListDto = req.body;
      const result = await service.createPriceList(data);
      
      if (!result.success) {
        const statusCode = result.error === 'VALIDATION_ERROR' ? 400 : 500;
        return res.status(statusCode).json(result);
      }

      res.status(201).json(result);
    } catch (error) {
      console.error('Error in createPriceList controller:', error);
      res.status(500).json({
        success: false,
        error: 'INTERNAL_SERVER_ERROR',
        message: 'An unexpected error occurred'
      });
    }
  }

  async updatePriceList(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const data: UpdatePriceListDto = req.body;
      const result = await service.updatePriceList(id, data);
      
      if (!result.success) {
        const statusCode = result.error === 'NOT_FOUND' ? 404 : 
                          result.error === 'VALIDATION_ERROR' ? 400 : 500;
        return res.status(statusCode).json(result);
      }

      res.json(result);
    } catch (error) {
      console.error('Error in updatePriceList controller:', error);
      res.status(500).json({
        success: false,
        error: 'INTERNAL_SERVER_ERROR',
        message: 'An unexpected error occurred'
      });
    }
  }

  async deletePriceList(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const result = await service.deletePriceList(id);
      
      if (!result.success) {
        const statusCode = result.error === 'NOT_FOUND' ? 404 : 500;
        return res.status(statusCode).json(result);
      }

      res.json(result);
    } catch (error) {
      console.error('Error in deletePriceList controller:', error);
      res.status(500).json({
        success: false,
        error: 'INTERNAL_SERVER_ERROR',
        message: 'An unexpected error occurred'
      });
    }
  }

  // Removed: uploadPriceListExcel
}

export default new SetupController();
