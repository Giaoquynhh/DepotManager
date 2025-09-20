// Setup DTOs for Shipping Lines and Transport Companies

export interface CreateShippingLineDto {
  code: string;
  name: string;
  eir: string;
  note?: string;
}

export interface UpdateShippingLineDto {
  code?: string;
  name?: string;
  eir?: string;
  note?: string;
}

export interface CreateTransportCompanyDto {
  code: string;
  name: string;
  address?: string;
  mst?: string;
  phone?: string;
  note?: string;
}

export interface UpdateTransportCompanyDto {
  code?: string;
  name?: string;
  address?: string;
  mst?: string;
  phone?: string;
  note?: string;
}

export interface CreateContainerTypeDto {
  code: string;
  description: string;
  note?: string;
}

export interface UpdateContainerTypeDto {
  code?: string;
  description?: string;
  note?: string;
}

export interface ShippingLineResponse {
  id: string;
  code: string;
  name: string;
  eir: string;
  note?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface TransportCompanyResponse {
  id: string;
  code: string;
  name: string;
  address?: string;
  mst?: string;
  phone?: string;
  note?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ContainerTypeResponse {
  id: string;
  code: string;
  description: string;
  note?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface PaginationQuery {
  page?: number;
  limit?: number;
  search?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  details?: any[];
}

// Customer DTOs
export interface CreateCustomerDto {
  code: string;
  name: string;
  tax_code?: string;
  address?: string;
  email?: string;
  phone?: string;
}

export interface UpdateCustomerDto {
  name?: string;
  address?: string;
  email?: string;
  phone?: string;
  status?: string;
}

export interface CustomerResponse {
  id: string;
  code: string;
  name: string;
  tax_code?: string;
  address?: string;
  email?: string;
  phone?: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}

// PriceList DTOs
export interface CreatePriceListDto {
  serviceCode: string;
  serviceName: string;
  type: string; // "Nâng" | "Hạ" | "Tồn kho"
  price: number;
  note?: string;
}

export interface UpdatePriceListDto {
  serviceCode?: string;
  serviceName?: string;
  type?: string;
  price?: number;
  note?: string;
}

export interface PriceListResponse {
  id: string;
  serviceCode: string;
  serviceName: string;
  type: string;
  price: number;
  note?: string | null;
  createdAt: Date;
  updatedAt: Date;
}