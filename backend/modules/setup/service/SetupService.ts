import repo from '../repository/SetupRepository';
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
  PaginationQuery,
  ApiResponse,
  ShippingLineResponse,
  TransportCompanyResponse,
  ContainerTypeResponse,
  CustomerResponse,
  PriceListResponse,
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

  // Upload customer Excel file
  async uploadCustomerExcel(file: Express.Multer.File): Promise<ApiResponse<CustomerResponse[]>> {
    try {
      const workbook = XLSX.read(file.buffer, { type: 'buffer' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];

      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

      // Expected columns order:
      // [STT?, Mã khách hàng, Tên khách hàng, Địa chỉ, MST, SĐT, Ghi chú]
      const rows = (jsonData.slice(1) as any[][]);
      const customers: CustomerResponse[] = [];
      const errors: string[] = [];

      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        if (!row || row.length === 0 || !row.some(cell => cell && cell.toString().trim())) {
          continue;
        }

        // Some sheets may include STT at column A; shift if needed to ensure code at index 1
        const hasSttFirst = row.length >= 2 && typeof row[0] !== 'undefined' && typeof row[1] !== 'undefined' && (row[1] + '').trim();
        const colOffset = hasSttFirst && (row[0] + '').match(/^\d+$/) ? 1 : 0;

        const code = (row[0 + colOffset] ?? '').toString().trim();
        const name = (row[1 + colOffset] ?? '').toString().trim();
        const address = (row[2 + colOffset] ?? '').toString().trim();
        const tax_code = (row[3 + colOffset] ?? '').toString().trim();
        const phone = (row[4 + colOffset] ?? '').toString().trim();
        const note = (row[5 + colOffset] ?? '').toString().trim();

        if (!code || !name) {
          errors.push(`Row ${i + 2}: Missing required fields (Code and Name)`);
          continue;
        }

        // Prevent duplicates within the same upload batch
        const dupInBatch = customers.some(c => c.code.toLowerCase() === code.toLowerCase());
        if (dupInBatch) {
          errors.push(`Row ${i + 2}: Duplicate code in file "${code}"`);
          continue;
        }

        const createData: CreateCustomerDto = {
          code,
          name,
          address: address || undefined,
          tax_code: tax_code || undefined,
          email: undefined,
          phone: phone || undefined
        };

        try {
          const result = await this.createCustomer(createData);
          if (result.success && result.data) {
            customers.push(result.data);
          } else {
            errors.push(`Row ${i + 2}: ${result.message || 'Failed to create'}`);
          }
        } catch (err) {
          errors.push(`Row ${i + 2}: Failed to create customer`);
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

      if (customers.length === 0) {
        return {
          success: false,
          error: 'VALIDATION_ERROR',
          message: 'No valid data found in Excel file'
        };
      }

      return {
        success: true,
        data: customers,
        message: `Successfully uploaded ${customers.length} customers`
      };
    } catch (error) {
      console.error('Error uploading customer Excel:', error);
      return {
        success: false,
        error: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to process Excel file'
      };
    }
  }

  // Upload container type Excel file
  async uploadContainerTypeExcel(file: Express.Multer.File): Promise<ApiResponse<ContainerTypeResponse[]>> {
    try {
      const workbook = XLSX.read(file.buffer, { type: 'buffer' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];

      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

      // Expect columns: Code, Description, Note
      const rows = jsonData.slice(1) as string[][];
      const containerTypes: ContainerTypeResponse[] = [];
      const errors: string[] = [];

      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        if (!row || row.length === 0 || !row.some(cell => cell && cell.toString().trim())) {
          continue;
        }

        if (row.length < 2 || !row[0] || !row[1]) {
          errors.push(`Row ${i + 2}: Missing required fields (Code and Description)`);
          continue;
        }

        const code = row[0].toString().trim();
        const description = row[1].toString().trim();
        const note = row[2] ? row[2].toString().trim() : '';

        // Check duplicate in current batch
        const isDuplicate = containerTypes.some(ct => ct.code.toLowerCase() === code.toLowerCase());
        if (isDuplicate) {
          errors.push(`Row ${i + 2}: Duplicate code "${code}"`);
          continue;
        }

        const createData: CreateContainerTypeDto = {
          code,
          description,
          note: note || undefined
        };

        try {
          const result = await this.createContainerType(createData);
          if (result.success && result.data) {
            containerTypes.push(result.data);
          } else {
            errors.push(`Row ${i + 2}: ${result.message || 'Failed to create'}`);
          }
        } catch (error) {
          errors.push(`Row ${i + 2}: Failed to create container type`);
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

      if (containerTypes.length === 0) {
        return {
          success: false,
          error: 'VALIDATION_ERROR',
          message: 'No valid data found in Excel file'
        };
      }

      return {
        success: true,
        data: containerTypes,
        message: `Successfully uploaded ${containerTypes.length} container types`
      };
    } catch (error) {
      console.error('Error uploading container type Excel:', error);
      return {
        success: false,
        error: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to process Excel file'
      };
    }
  }
  // Container Types
  async getContainerTypes(query: PaginationQuery = {}): Promise<ApiResponse<PaginatedResponse<ContainerTypeResponse>>> {
    try {
      const result = await repo.getContainerTypes(query);
      return {
        success: true,
        data: {
          data: result.containerTypes,
          pagination: result.pagination
        }
      };
    } catch (error) {
      console.error('Error getting container types:', error);
      return {
        success: false,
        error: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to get container types'
      };
    }
  }

  async getContainerTypeById(id: string): Promise<ApiResponse<ContainerTypeResponse>> {
    try {
      const containerType = await repo.getContainerTypeById(id);
      if (!containerType) {
        return {
          success: false,
          error: 'NOT_FOUND',
          message: 'Container type not found'
        };
      }
      return {
        success: true,
        data: containerType
      };
    } catch (error) {
      console.error('Error getting container type by id:', error);
      return {
        success: false,
        error: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to get container type'
      };
    }
  }

  async createContainerType(data: CreateContainerTypeDto): Promise<ApiResponse<ContainerTypeResponse>> {
    try {
      // Validation
      if (!data.code || !data.description) {
        return {
          success: false,
          error: 'VALIDATION_ERROR',
          message: 'Code and description are required'
        };
      }

      const containerType = await repo.createContainerType(data);
      return {
        success: true,
        data: containerType
      };
    } catch (error: any) {
      console.error('Error creating container type:', error);
      
      // Handle unique constraint error
      if (error.code === 'P2002') {
        return {
          success: false,
          error: 'VALIDATION_ERROR',
          message: 'Container type code already exists'
        };
      }

      return {
        success: false,
        error: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to create container type'
      };
    }
  }

  async updateContainerType(id: string, data: UpdateContainerTypeDto): Promise<ApiResponse<ContainerTypeResponse>> {
    try {
      // Validation
      if (data.code !== undefined && !data.code) {
        return {
          success: false,
          error: 'VALIDATION_ERROR',
          message: 'Code cannot be empty'
        };
      }
      if (data.description !== undefined && !data.description) {
        return {
          success: false,
          error: 'VALIDATION_ERROR',
          message: 'Description cannot be empty'
        };
      }

      const containerType = await repo.updateContainerType(id, data);
      if (!containerType) {
        return {
          success: false,
          error: 'NOT_FOUND',
          message: 'Container type not found'
        };
      }

      return {
        success: true,
        data: containerType
      };
    } catch (error: any) {
      console.error('Error updating container type:', error);
      
      // Handle unique constraint error
      if (error.code === 'P2002') {
        return {
          success: false,
          error: 'VALIDATION_ERROR',
          message: 'Container type code already exists'
        };
      }

      return {
        success: false,
        error: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to update container type'
      };
    }
  }

  async deleteContainerType(id: string): Promise<ApiResponse<null>> {
    try {
      const deleted = await repo.deleteContainerType(id);
      if (!deleted) {
        return {
          success: false,
          error: 'NOT_FOUND',
          message: 'Container type not found'
        };
      }

      return {
        success: true,
        data: null,
        message: 'Container type deleted successfully'
      };
    } catch (error) {
      console.error('Error deleting container type:', error);
      return {
        success: false,
        error: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to delete container type'
      };
    }
  }

  // Customers
  async getCustomers(query: PaginationQuery = {}): Promise<ApiResponse<PaginatedResponse<CustomerResponse>>> {
    try {
      const result = await repo.getCustomers(query);
      return {
        success: true,
        data: {
          data: result.customers,
          pagination: result.pagination
        }
      };
    } catch (error) {
      console.error('Error getting customers:', error);
      return {
        success: false,
        error: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to get customers'
      };
    }
  }

  async getCustomerById(id: string): Promise<ApiResponse<CustomerResponse>> {
    try {
      const customer = await repo.getCustomerById(id);
      if (!customer) {
        return {
          success: false,
          error: 'NOT_FOUND',
          message: 'Customer not found'
        };
      }
      return {
        success: true,
        data: customer
      };
    } catch (error) {
      console.error('Error getting customer:', error);
      return {
        success: false,
        error: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to get customer'
      };
    }
  }

  async createCustomer(data: CreateCustomerDto): Promise<ApiResponse<CustomerResponse>> {
    try {
      // Validation
      if (!data.code?.trim()) {
        return {
          success: false,
          error: 'VALIDATION_ERROR',
          message: 'Customer code is required',
          details: [{ field: 'code', message: 'Code is required' }]
        };
      }
      if (!data.name?.trim()) {
        return {
          success: false,
          error: 'VALIDATION_ERROR',
          message: 'Customer name is required',
          details: [{ field: 'name', message: 'Name is required' }]
        };
      }

      // Check for duplicate code
      const existing = await repo.getCustomerByCode(data.code.trim());
      if (existing) {
        return {
          success: false,
          error: 'VALIDATION_ERROR',
          message: 'Customer code already exists',
          details: [{ field: 'code', message: 'Code already exists' }]
        };
      }

      // Check for duplicate tax code if provided
      if (data.tax_code?.trim()) {
        const existingTax = await repo.getCustomerByTaxCode(data.tax_code.trim());
        if (existingTax) {
          return {
            success: false,
            error: 'VALIDATION_ERROR',
            message: 'Tax code already exists',
            details: [{ field: 'tax_code', message: 'Tax code already exists' }]
          };
        }
      }

      // Validate email format if provided
      if (data.email?.trim()) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(data.email.trim())) {
          return {
            success: false,
            error: 'VALIDATION_ERROR',
            message: 'Email format is invalid',
            details: [{ field: 'email', message: 'Please enter a valid email address' }]
          };
        }
      }

      const customer = await repo.createCustomer({
        code: data.code.trim(),
        name: data.name.trim(),
        tax_code: data.tax_code?.trim(),
        address: data.address?.trim(),
        email: data.email?.trim(),
        phone: data.phone?.trim()
      });

      return {
        success: true,
        data: customer,
        message: 'Customer created successfully'
      };
    } catch (error) {
      console.error('Error creating customer:', error);
      return {
        success: false,
        error: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to create customer'
      };
    }
  }

  async updateCustomer(id: string, data: UpdateCustomerDto): Promise<ApiResponse<CustomerResponse>> {
    try {
      // Check if customer exists
      const existing = await repo.getCustomerById(id);
      if (!existing) {
        return {
          success: false,
          error: 'NOT_FOUND',
          message: 'Customer not found'
        };
      }

      // Validate email format if provided
      if (data.email !== undefined && data.email?.trim()) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(data.email.trim())) {
          return {
            success: false,
            error: 'VALIDATION_ERROR',
            message: 'Email format is invalid',
            details: [{ field: 'email', message: 'Please enter a valid email address' }]
          };
        }
      }

      const updateData: any = {};
      if (data.name) updateData.name = data.name.trim();
      if (data.address !== undefined) updateData.address = data.address?.trim() || null;
      if (data.email !== undefined) updateData.email = data.email?.trim() || null;
      if (data.phone !== undefined) updateData.phone = data.phone?.trim() || null;

      const customer = await repo.updateCustomer(id, updateData);

      return {
        success: true,
        data: customer,
        message: 'Customer updated successfully'
      };
    } catch (error) {
      console.error('Error updating customer:', error);
      return {
        success: false,
        error: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to update customer'
      };
    }
  }

  async deleteCustomer(id: string): Promise<ApiResponse<null>> {
    try {
      const existing = await repo.getCustomerById(id);
      if (!existing) {
        return {
          success: false,
          error: 'NOT_FOUND',
          message: 'Customer not found'
        };
      }

      await repo.deleteCustomer(id);

      return {
        success: true,
        message: 'Customer deleted successfully'
      };
    } catch (error) {
      console.error('Error deleting customer:', error);
      return {
        success: false,
        error: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to delete customer'
      };
    }
  }

  async disableCustomer(id: string): Promise<ApiResponse<CustomerResponse>> {
    try {
      const existing = await repo.getCustomerById(id);
      if (!existing) {
        return {
          success: false,
          error: 'NOT_FOUND',
          message: 'Customer not found'
        };
      }

      const customer = await repo.updateCustomer(id, { status: 'INACTIVE' });

      return {
        success: true,
        data: customer,
        message: 'Customer disabled successfully'
      };
    } catch (error) {
      console.error('Error disabling customer:', error);
      return {
        success: false,
        error: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to disable customer'
      };
    }
  }

  // PriceList
  async getPriceLists(query: PaginationQuery = {}): Promise<ApiResponse<PaginatedResponse<PriceListResponse>>> {
    try {
      const result = await repo.getPriceLists(query);
      return {
        success: true,
        data: {
          data: result.priceLists,
          pagination: result.pagination
        }
      };
    } catch (error) {
      console.error('Error getting price lists:', error);
      return {
        success: false,
        error: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to get price lists'
      };
    }
  }

  async getPriceListById(id: string): Promise<ApiResponse<PriceListResponse>> {
    try {
      const priceList = await repo.getPriceListById(id);
      if (!priceList) {
        return {
          success: false,
          error: 'NOT_FOUND',
          message: 'Price list not found'
        };
      }
      return {
        success: true,
        data: priceList
      };
    } catch (error) {
      console.error('Error getting price list:', error);
      return {
        success: false,
        error: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to get price list'
      };
    }
  }

  async createPriceList(data: CreatePriceListDto): Promise<ApiResponse<PriceListResponse>> {
    try {
      // Validation
      if (!data.serviceCode?.trim()) {
        return {
          success: false,
          error: 'VALIDATION_ERROR',
          message: 'Service code is required',
          details: [{ field: 'serviceCode', message: 'Service code is required' }]
        };
      }
      if (!data.serviceName?.trim()) {
        return {
          success: false,
          error: 'VALIDATION_ERROR',
          message: 'Service name is required',
          details: [{ field: 'serviceName', message: 'Service name is required' }]
        };
      }
      if (!data.type?.trim()) {
        return {
          success: false,
          error: 'VALIDATION_ERROR',
          message: 'Type is required',
          details: [{ field: 'type', message: 'Type is required' }]
        };
      }
      if (!data.price || data.price <= 0) {
        return {
          success: false,
          error: 'VALIDATION_ERROR',
          message: 'Price must be greater than 0',
          details: [{ field: 'price', message: 'Price must be greater than 0' }]
        };
      }

      // Validate type values
      const validTypes = ['Nâng', 'Hạ', 'Tồn kho'];
      if (!validTypes.includes(data.type)) {
        return {
          success: false,
          error: 'VALIDATION_ERROR',
          message: 'Type must be one of: Nâng, Hạ, Tồn kho',
          details: [{ field: 'type', message: 'Type must be one of: Nâng, Hạ, Tồn kho' }]
        };
      }

      // Check for duplicate service code
      const existing = await repo.getPriceListByServiceCode(data.serviceCode.trim());
      if (existing) {
        return {
          success: false,
          error: 'VALIDATION_ERROR',
          message: 'Service code already exists',
          details: [{ field: 'serviceCode', message: 'Service code already exists' }]
        };
      }

      const priceList = await repo.createPriceList({
        serviceCode: data.serviceCode.trim(),
        serviceName: data.serviceName.trim(),
        type: data.type.trim(),
        price: data.price,
        note: data.note?.trim()
      });

      return {
        success: true,
        data: priceList,
        message: 'Price list created successfully'
      };
    } catch (error) {
      console.error('Error creating price list:', error);
      return {
        success: false,
        error: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to create price list'
      };
    }
  }

  async updatePriceList(id: string, data: UpdatePriceListDto): Promise<ApiResponse<PriceListResponse>> {
    try {
      // Check if price list exists
      const existing = await repo.getPriceListById(id);
      if (!existing) {
        return {
          success: false,
          error: 'NOT_FOUND',
          message: 'Price list not found'
        };
      }

      // Validate type if provided
      if (data.type && data.type.trim()) {
        const validTypes = ['Nâng', 'Hạ', 'Tôn'];
        if (!validTypes.includes(data.type.trim())) {
          return {
            success: false,
            error: 'VALIDATION_ERROR',
            message: 'Type must be one of: Nâng, Hạ, Tôn',
            details: [{ field: 'type', message: 'Type must be one of: Nâng, Hạ, Tồn kho' }]
          };
        }
      }

      // Validate price if provided
      if (data.price !== undefined && data.price <= 0) {
        return {
          success: false,
          error: 'VALIDATION_ERROR',
          message: 'Price must be greater than 0',
          details: [{ field: 'price', message: 'Price must be greater than 0' }]
        };
      }

      // Check for duplicate service code if code is being updated
      if (data.serviceCode && data.serviceCode !== existing.serviceCode) {
        const duplicate = await repo.getPriceListByServiceCode(data.serviceCode.trim());
        if (duplicate) {
          return {
            success: false,
            error: 'VALIDATION_ERROR',
            message: 'Service code already exists',
            details: [{ field: 'serviceCode', message: 'Service code already exists' }]
          };
        }
      }

      const updateData: any = {};
      if (data.serviceCode) updateData.serviceCode = data.serviceCode.trim();
      if (data.serviceName) updateData.serviceName = data.serviceName.trim();
      if (data.type) updateData.type = data.type.trim();
      if (data.price !== undefined) updateData.price = data.price;
      if (data.note !== undefined) updateData.note = data.note?.trim() || null;

      const priceList = await repo.updatePriceList(id, updateData);

      return {
        success: true,
        data: priceList,
        message: 'Price list updated successfully'
      };
    } catch (error) {
      console.error('Error updating price list:', error);
      return {
        success: false,
        error: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to update price list'
      };
    }
  }

  async deletePriceList(id: string): Promise<ApiResponse<null>> {
    try {
      const existing = await repo.getPriceListById(id);
      if (!existing) {
        return {
          success: false,
          error: 'NOT_FOUND',
          message: 'Price list not found'
        };
      }

      const deleted = await repo.deletePriceList(id);
      if (!deleted) {
        return {
          success: false,
          error: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to delete price list'
        };
      }

      return {
        success: true,
        message: 'Price list deleted successfully'
      };
    } catch (error) {
      console.error('Error deleting price list:', error);
      return {
        success: false,
        error: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to delete price list'
      };
    }
  }

  // Removed: uploadPriceListExcel
}

export default new SetupService();
