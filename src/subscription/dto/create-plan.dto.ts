import { IsString, IsNumber, IsArray, IsOptional } from 'class-validator';

export class CreatePlanDto {
  @IsString()
  name: string;

  @IsNumber()
  price: number;

  @IsArray()
  @IsString({ each: true })
  features: string[];

  @IsOptional()
  @IsString()
  description?: string;
}