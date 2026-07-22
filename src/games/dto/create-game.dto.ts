import { IsString, IsOptional, IsNumber, IsDateString, Min, Max, IsArray, IsUrl } from 'class-validator';

export class CreateGameDto {
  @IsString()
  title: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  platform: string;

  @IsString()
  genre: string;

  @IsDateString()
  @IsOptional()
  releaseDate?: string;

  @IsNumber()
  @Min(0)
  @Max(10)
  @IsOptional()
  rating?: number;

  @IsString()
  @IsOptional()
  coverUrl?: string;

  @IsArray()
  @IsUrl({}, { each: true })
  @IsOptional()
  images?: string[];
}