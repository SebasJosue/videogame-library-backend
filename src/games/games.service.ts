import { Injectable, NotFoundException, ForbiddenException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateGameDto } from './dto/create-game.dto';
import { UpdateGameDto } from './dto/update-game.dto';

@Injectable()
export class GamesService {
  constructor(private prisma: PrismaService) {}

  async create(createGameDto: CreateGameDto, userId: string) {
    return this.prisma.game.create({
      data: {
        ...createGameDto,
        releaseDate: createGameDto.releaseDate ? new Date(createGameDto.releaseDate) : null,
        userId,
      },
      include: {
        user: { select: { id: true, username: true, email: true } },
      },
    });
  }

  // ✅ FILTRA POR GÉNERO DIRECTAMENTE EN LA BASE DE DATOS
  async findAll(userId?: string, genre?: string) {
    const where: any = {};
    
    if (userId) where.userId = userId;
    
    if (genre) {
      where.genre = {
        equals: genre,
        mode: 'insensitive', // Ignora mayúsculas/minúsculas y acentos
      };
    }
    
    return this.prisma.game.findMany({
      where,
      include: {
        user: { select: { id: true, username: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string, currentUserId?: string) {
    const game = await this.prisma.game.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, username: true, email: true } },
        gameVotes: currentUserId ? { where: { userId: currentUserId }, select: { id: true } } : false,
      },
    });
    if (!game) throw new NotFoundException('Juego no encontrado');
    return game;
  }

  async update(id: string, updateGameDto: UpdateGameDto, userId: string, userRole: string) {
    const game = await this.prisma.game.findUnique({ where: { id } });
    if (!game) throw new NotFoundException('Juego no encontrado');
    if (game.userId !== userId && userRole !== 'ADMIN') {
      throw new ForbiddenException('No tienes permiso para editar este juego');
    }
    return this.prisma.game.update({
      where: { id },
      data: { ...updateGameDto, releaseDate: updateGameDto.releaseDate ? new Date(updateGameDto.releaseDate) : undefined },
      include: { user: { select: { id: true, username: true, email: true } } },
    });
  }

  async remove(id: string, userId: string, userRole: string) {
    const game = await this.prisma.game.findUnique({ where: { id } });
    if (!game) throw new NotFoundException('Juego no encontrado');
    if (game.userId !== userId && userRole !== 'ADMIN') {
      throw new ForbiddenException('No tienes permiso para eliminar este juego');
    }
    return this.prisma.game.delete({ where: { id } });
  }

  async adminDeleteGame(id: string) {
    const game = await this.prisma.game.findUnique({ where: { id } });
    if (!game) throw new NotFoundException('Juego no encontrado');
    return this.prisma.game.delete({ where: { id } });
  }

  async vote(gameId: string, userId: string) {
    const game = await this.prisma.game.findUnique({ where: { id: gameId } });
    if (!game) throw new NotFoundException('Juego no encontrado');

    const existingVote = await this.prisma.vote.findUnique({
      where: { userId_gameId: { userId, gameId } },
    });
    if (existingVote) throw new ConflictException('Ya has votado por este juego');

    await this.prisma.vote.create({ data: { userId, gameId } });

    return this.prisma.game.update({
      where: { id: gameId },
      data: { votes: { increment: 1 } },
      include: { user: { select: { id: true, username: true, email: true } } },
    });
  }
}