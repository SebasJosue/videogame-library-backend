import { Controller, Get, Post, Put, Delete, Param, Body, UseGuards } from '@nestjs/common';
import { CategoriesService } from './categories.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { CreateCategoryDto } from './dto/create-category.dto';

@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Get()
  getAllCategories() {
    return this.categoriesService.getAllCategories();
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @Roles('ADMIN')
  createCategory(@Body() createCategoryDto: CreateCategoryDto) {
    return this.categoriesService.createCategory(createCategoryDto);
  }

  @Put(':name')
  @UseGuards(JwtAuthGuard)
  @Roles('ADMIN')
  updateCategory(@Param('name') name: string, @Body() updateCategoryDto: CreateCategoryDto) {
    return this.categoriesService.updateCategory(name, updateCategoryDto);
  }

  @Delete(':name')
  @UseGuards(JwtAuthGuard)
  @Roles('ADMIN')
  deleteCategory(@Param('name') name: string) {
    return this.categoriesService.deleteCategory(name);
  }
}