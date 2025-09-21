import { IsString, IsNumber, IsDateString, IsOptional, IsEnum, Min, Max } from 'class-validator';

export class CreateSealDto {
  @IsString()
  shipping_company!: string;

  @IsDateString()
  purchase_date!: string;

  @IsNumber()
  @Min(1)
  quantity_purchased!: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  quantity_exported?: number = 0;

  @IsNumber()
  @Min(0)
  unit_price!: number;

  @IsString()
  pickup_location!: string;

  @IsEnum(['ACTIVE', 'INACTIVE'])
  @IsOptional()
  status?: string = 'ACTIVE';
}

export class UpdateSealDto {
  @IsString()
  @IsOptional()
  shipping_company?: string;

  @IsDateString()
  @IsOptional()
  purchase_date?: string;

  @IsNumber()
  @Min(1)
  @IsOptional()
  quantity_purchased?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  quantity_exported?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  unit_price?: number;

  @IsString()
  @IsOptional()
  pickup_location?: string;

  @IsEnum(['ACTIVE', 'INACTIVE'])
  @IsOptional()
  status?: string;
}

export class SealListQueryDto {
  @IsString()
  @IsOptional()
  shipping_company?: string;

  @IsString()
  @IsOptional()
  status?: string;

  @IsString()
  @IsOptional()
  search?: string;

  @IsNumber()
  @Min(1)
  @IsOptional()
  page?: number;

  @IsNumber()
  @Min(1)
  @Max(100)
  @IsOptional()
  pageSize?: number;
}
