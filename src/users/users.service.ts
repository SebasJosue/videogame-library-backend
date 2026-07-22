import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto } from '../auth/dto/register.dto';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.user.findMany({
      select: {
        id: true,
        email: true,
        username: true,
        role: true,
        isSuspended: true,
        suspensionReason: true,
        suspensionUntil: true,
        createdAt: true,
        games: {
          select: {
            id: true,
            title: true,
          },
        },
        subscription: true,
      },
    });
  }

  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        username: true,
        role: true,
        isSuspended: true,
        suspensionReason: true,
        suspensionUntil: true,
        createdAt: true,
        games: true,
        subscription: true,
      },
    });

    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    return user;
  }

  async findByEmail(email: string) {
    const user = await this.prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        username: true,
        role: true,
        createdAt: true,
      },
    });

    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    return user;
  }

  async createUser(registerDto: RegisterDto) {
    const { email, password, username } = registerDto;

    const existingUser = await this.prisma.user.findFirst({
      where: {
        OR: [{ email }, { username }],
      },
    });

    if (existingUser) {
      throw new ConflictException('Email o username ya están en uso');
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await this.prisma.user.create({
      data: {
        email,
        username,
        password: hashedPassword,
        role: 'USER',
      },
      select: {
        id: true,
        email: true,
        username: true,
        role: true,
        createdAt: true,
      },
    });

    return user;
  }

  async suspendUser(userId: string, days: number, reason: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    if (user.role === 'ADMIN') {
      throw new BadRequestException('No se puede suspender a un administrador');
    }

    const suspensionUntil = new Date();
    suspensionUntil.setDate(suspensionUntil.getDate() + days);

    return this.prisma.user.update({
      where: { id: userId },
      data: {
        isSuspended: true,
        suspensionReason: reason,
        suspensionUntil: suspensionUntil,
      },
      select: {
        id: true,
        username: true,
        isSuspended: true,
        suspensionReason: true,
        suspensionUntil: true,
      },
    });
  }

  async unsuspendUser(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    return this.prisma.user.update({
      where: { id: userId },
      data: {
        isSuspended: false,
        suspensionReason: null,
        suspensionUntil: null,
      },
      select: {
        id: true,
        username: true,
        isSuspended: true,
      },
    });
  }

  async deleteUser(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    if (user.role === 'ADMIN') {
      throw new BadRequestException('No se puede eliminar a un administrador');
    }

    return this.prisma.user.delete({
      where: { id: userId },
    });
  }

  async getStats() {
    const totalUsers = await this.prisma.user.count();
    const totalGames = await this.prisma.game.count();
    const suspendedUsers = await this.prisma.user.count({
      where: { isSuspended: true },
    });
    const adminUsers = await this.prisma.user.count({
      where: { role: 'ADMIN' },
    });

    return {
      totalUsers,
      totalGames,
      suspendedUsers,
      adminUsers,
    };
  }

  // ✅ NUEVO: Método para que el admin actualice el plan de un usuario
  async updateUserPlan(userId: string, plan: 'FREE' | 'BASIC' | 'PREMIUM' | 'VIP') {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    const endDate = plan === 'FREE' ? null : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    const isActive = plan !== 'FREE';

    return this.prisma.subscription.upsert({
      where: { userId },
      update: {
        plan,
        endDate,
        isActive,
      },
      create: {
        userId,
        plan,
        endDate,
        isActive,
      },
    });
  }
}