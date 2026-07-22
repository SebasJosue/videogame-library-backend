import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCategoryDto } from './dto/create-category.dto';

@Injectable()
export class CategoriesService {
  constructor(private prisma: PrismaService) {}

  async getAllCategories() {
    return this.prisma.category.findMany({
      include: {
        _count: { select: { games: true } },
      },
      orderBy: { name: 'asc' },
    });
  }

  async createCategory(data: CreateCategoryDto) {
    return this.prisma.category.create({ 
      data: {
        name: data.name,
        icon: data.icon,
        color: data.color || '#6366f1',
      } 
    });
  }

  async updateCategory(name: string, data: CreateCategoryDto) {
    const category = await this.prisma.category.findUnique({ where: { name } });
    if (!category) throw new NotFoundException('Categoría no encontrada');
    
    return this.prisma.category.update({
      where: { name },
      data,
    });
  }

  async deleteCategory(name: string) {
    const category = await this.prisma.category.findUnique({ where: { name } });
    if (!category) throw new NotFoundException('Categoría no encontrada');
    
    return this.prisma.category.delete({ where: { name } });
  }

  async getCategoryByName(name: string) {
    const category = await this.prisma.category.findUnique({
      where: { name },
      include: {
        _count: { select: { games: true } },
      },
    });
    
    if (!category) throw new NotFoundException('Categoría no encontrada');
    return category;
  }
}