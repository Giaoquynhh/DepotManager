import repo from '../repository/SetupRepository';
import { 
  CreateShippingLineDto, 
  UpdateShippingLineDto, 
  CreateTransportCompanyDto, 
  UpdateTransportCompanyDto,
  PaginationQuery,
  ApiResponse,
  ShippingLineResponse,
  TransportCompanyResponse,
  PaginatedResponse
} from '../dto/SetupDtos';
import * as XLSX from 'xlsx';

export class SetupService {
  // Shipping Lines
  async getShippingLines(query: PaginationQuery = {}): Promise<ApiResponse<PaginatedResponse<ShippingLineResponse>>> {
    try {
      const result = await repo.getShippingLines(query);
      return {
        success: true,
        data: {
          data: result.shippingLines,
          pagination: result.pagination
        }
      };
    } catch (error) {
      console.error('Error getting shipping lines:', error);
      return {
        success: false,
        error: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to get shipping lines'
      };
    }
  }

  async getShippingLineById(id: string): Promise<ApiResponse<ShippingLineResponse>> {
    try {
      const shippingLine = await repo.getShippingLineById(id);
      if (!shippingLine) {
        return {
          success: false,
          error: 'NOT_FOUND',
          message: 'Shipping line not found'
        };
      }
      return {
        success: true,
        data: shippingLine
      };
    } catch (error) {
      console.error('Error getting shipping line:', error);
      return {
        success: false,
        error: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to get shipping line'
      };
    }
  }

  async createShippingLine(data: CreateShippingLineDto): Promise<ApiResponse<ShippingLineResponse>> {
    try {
      // Validation
      if (!data.code?.trim()) {
        return {
          success: false,
          error: 'VALIDATION_ERROR',
          message: 'Shipping line code is required',
          details: [{ field: 'code', message: 'Code is required' }]
        };
      }
      if (!data.name?.trim()) {
        return {
          success: false,
          error: 'VALIDATION_ERROR',
          message: 'Shipping line name is required',
          details: [{ field: 'name', message: 'Name is required' }]
        };
      }
      if (!data.eir?.trim()) {
        return {
          success: false,
          error: 'VALIDATION_ERROR',
          message: 'EIR is required',
          details: [{ field: 'eir', message: 'EIR is required' }]
        };
      }

      // Check for duplicate code
      const existing = await repo.getShippingLineByCode(data.code.trim());
      if (existing) {
        return {
          success: false,
          error: 'VALIDATION_ERROR',
          message: 'Shipping line code already exists',
          details: [{ field: 'code', message: 'Code already exists' }]
        };
      }

      const shippingLine = await repo.createShippingLine({
        code: data.code.trim(),
        name: data.name.trim(),
        eir: data.eir.trim(),
        note: data.note?.trim()
      });

      return {
        success: true,
        data: shippingLine,
        message: 'Shipping line created successfully'
      };
    } catch (error) {
      console.error('Error creating shipping line:', error);
      return {
        success: false,
        error: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to create shipping line'
      };
    }
  }

  async updateShippingLine(id: string, data: UpdateShippingLineDto): Promise<ApiResponse<ShippingLineResponse>> {
    try {
      // Check if shipping line exists
      const existing = await repo.getShippingLineById(id);
      if (!existing) {
        return {
          success: false,
          error: 'NOT_FOUND',
          message: 'Shipping line not found'
        };
      }

      // Check for duplicate code if code is being updated
      if (data.code && data.code !== existing.code) {
        const duplicate = await repo.getShippingLineByCode(data.code.trim());
        if (duplicate) {
          return {
            success: false,
            error: 'VALIDATION_ERROR',
            message: 'Shipping line code already exists',
            details: [{ field: 'code', message: 'Code already exists' }]
          };
        }
      }

      const updateData: any = {};
      if (data.code) updateData.code = data.code.trim();
      if (data.name) updateData.name = data.name.trim();
      if (data.eir) updateData.eir = data.eir.trim();
      if (data.note !== undefined) updateData.note = data.note?.trim() || null;

      const shippingLine = await repo.updateShippingLine(id, updateData);

      return {
        success: true,
        data: shippingLine,
        message: 'Shipping line updated successfully'
      };
    } catch (error) {
      console.error('Error updating shipping line:', error);
      return {
        success: false,
        error: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to update shipping line'
      };
    }
  }

  async deleteShippingLine(id: string): Promise<ApiResponse<null>> {
    try {
      const existing = await repo.getShippingLineById(id);
      if (!existing) {
        return {
          success: false,
          error: 'NOT_FOUND',
          message: 'Shipping line not found'
        };
      }

      await repo.deleteShippingLine(id);

      return {
        success: true,
        message: 'Shipping line deleted successfully'
      };
    } catch (error) {
      console.error('Error deleting shipping line:', error);
      return {
        success: false,
        error: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to delete shipping line'
      };
    }
  }

  // Transport Companies
  async getTransportCompanies(query: PaginationQuery = {}): Promise<ApiResponse<PaginatedResponse<TransportCompanyResponse>>> {
    try {
      const result = await repo.getTransportCompanies(query);
      return {
        success: true,
        data: {
          data: result.transportCompanies,
          pagination: result.pagination
        }
      };
    } catch (error) {
      console.error('Error getting transport companies:', error);
      return {
        success: false,
        error: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to get transport companies'
      };
    }
  }

  async getTransportCompanyById(id: string): Promise<ApiResponse<TransportCompanyResponse>> {
    try {
      const transportCompany = await repo.getTransportCompanyById(id);
      if (!transportCompany) {
        return {
          success: false,
          error: 'NOT_FOUND',
          message: 'Transport company not found'
        };
      }
      return {
        success: true,
        data: transportCompany
      };
    } catch (error) {
      console.error('Error getting transport company:', error);
      return {
        success: false,
        error: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to get transport company'
      };
    }
  }

  async createTransportCompany(data: CreateTransportCompanyDto): Promise<ApiResponse<TransportCompanyResponse>> {
    try {
      // Validation
      if (!data.code?.trim()) {
        return {
          success: false,
          error: 'VALIDATION_ERROR',
          message: 'Transport company code is required',
          details: [{ field: 'code', message: 'Code is required' }]
        };
      }
      if (!data.name?.trim()) {
        return {
          success: false,
          error: 'VALIDATION_ERROR',
          message: 'Transport company name is required',
          details: [{ field: 'name', message: 'Name is required' }]
        };
      }

      // Check for duplicate code
      const existing = await repo.getTransportCompanyByCode(data.code.trim());
      if (existing) {
        return {
          success: false,
          error: 'VALIDATION_ERROR',
          message: 'Transport company code already exists',
          details: [{ field: 'code', message: 'Code already exists' }]
        };
      }

      const transportCompany = await repo.createTransportCompany({
        code: data.code.trim(),
        name: data.name.trim(),
        address: data.address?.trim(),
        mst: data.mst?.trim(),
        phone: data.phone?.trim(),
        note: data.note?.trim()
      });

      return {
        success: true,
        data: transportCompany,
        message: 'Transport company created successfully'
      };
    } catch (error) {
      console.error('Error creating transport company:', error);
      return {
        success: false,
        error: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to create transport company'
      };
    }
  }

  async updateTransportCompany(id: string, data: UpdateTransportCompanyDto): Promise<ApiResponse<TransportCompanyResponse>> {
    try {
      // Check if transport company exists
      const existing = await repo.getTransportCompanyById(id);
      if (!existing) {
        return {
          success: false,
          error: 'NOT_FOUND',
          message: 'Transport company not found'
        };
      }

      // Check for duplicate code if code is being updated
      if (data.code && data.code !== existing.code) {
        const duplicate = await repo.getTransportCompanyByCode(data.code.trim());
        if (duplicate) {
          return {
            success: false,
            error: 'VALIDATION_ERROR',
            message: 'Transport company code already exists',
            details: [{ field: 'code', message: 'Code already exists' }]
          };
        }
      }

      const updateData: any = {};
      if (data.code) updateData.code = data.code.trim();
      if (data.name) updateData.name = data.name.trim();
      if (data.address !== undefined) updateData.address = data.address?.trim() || null;
      if (data.mst !== undefined) updateData.mst = data.mst?.trim() || null;
      if (data.phone !== undefined) updateData.phone = data.phone?.trim() || null;
      if (data.note !== undefined) updateData.note = data.note?.trim() || null;

      const transportCompany = await repo.updateTransportCompany(id, updateData);

      return {
        success: true,
        data: transportCompany,
        message: 'Transport company updated successfully'
      };
    } catch (error) {
      console.error('Error updating transport company:', error);
      return {
        success: false,
        error: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to update transport company'
      };
    }
  }

  async deleteTransportCompany(id: string): Promise<ApiResponse<null>> {
    try {
      const existing = await repo.getTransportCompanyById(id);
      if (!existing) {
        return {
          success: false,
          error: 'NOT_FOUND',
          message: 'Transport company not found'
        };
      }

      await repo.deleteTransportCompany(id);

      return {
        success: true,
        message: 'Transport company deleted successfully'
      };
    } catch (error) {
      console.error('Error deleting transport company:', error);
      return {
        success: false,
        error: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to delete transport company'
      };
    }
  }

  // Upload transport company Excel file
  async uploadTransportCompanyExcel(file: Express.Multer.File): Promise<ApiResponse<TransportCompanyResponse[]>> {
    try {
      // Read Excel file
      const workbook = XLSX.read(file.buffer, { type: 'buffer' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      
      // Convert to JSON
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
      
      // Skip header row and process data
      const rows = jsonData.slice(1) as string[][];
      const transportCompanies: TransportCompanyResponse[] = [];
      const errors: string[] = [];
      
      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        
        // Skip empty rows
        if (!row || row.length === 0 || !row.some(cell => cell && cell.toString().trim())) {
          continue;
        }
        
        // Validate required fields
        if (row.length < 2 || !row[0] || !row[1]) {
          errors.push(`Row ${i + 2}: Missing required fields (Code and Name)`);
          continue;
        }
        
        const code = row[0].toString().trim();
        const name = row[1].toString().trim();
        const address = row[2] ? row[2].toString().trim() : '';
        const mst = row[3] ? row[3].toString().trim() : '';
        const phone = row[4] ? row[4].toString().trim() : '';
        const note = row[5] ? row[5].toString().trim() : '';
        
        // Check for duplicate code
        const isDuplicate = transportCompanies.some(tc => 
          tc.code.toLowerCase() === code.toLowerCase()
        );
        
        if (isDuplicate) {
          errors.push(`Row ${i + 2}: Duplicate code "${code}"`);
          continue;
        }
        
        // Create transport company data
        const transportCompanyData: CreateTransportCompanyDto = {
          code,
          name,
          address: address || undefined,
          mst: mst || undefined,
          phone: phone || undefined,
          note: note || undefined
        };
        
        try {
          const result = await this.createTransportCompany(transportCompanyData);
          if (result.success && result.data) {
            transportCompanies.push(result.data);
          } else {
            errors.push(`Row ${i + 2}: ${result.message || 'Failed to create'}`);
          }
        } catch (error) {
          errors.push(`Row ${i + 2}: Failed to create transport company`);
        }
      }
      
      if (errors.length > 0) {
        return {
          success: false,
          error: 'VALIDATION_ERROR',
          message: 'Some rows failed to process',
          details: errors
        };
      }
      
      if (transportCompanies.length === 0) {
        return {
          success: false,
          error: 'VALIDATION_ERROR',
          message: 'No valid data found in Excel file'
        };
      }
      
      return {
        success: true,
        data: transportCompanies,
        message: `Successfully uploaded ${transportCompanies.length} transport companies`
      };
    } catch (error) {
      console.error('Error uploading transport company Excel:', error);
      return {
        success: false,
        error: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to process Excel file'
      };
    }
  }
}

export default new SetupService();
