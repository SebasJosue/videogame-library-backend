import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';

@Injectable()
export class CommentsService {
  constructor(private prisma: PrismaService) {}

  async create(createCommentDto: CreateCommentDto, userId: string) {
    const game = await this.prisma.game.findUnique({
      where: { id: createCommentDto.gameId },
    });

    if (!game) {
      throw new NotFoundException('Juego no encontrado');
    }

    return this.prisma.comment.create({
      data: {
        content: createCommentDto.content,
        gameId: createCommentDto.gameId,
        userId,
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
          },
        },
      },
    });
  }

  async findAllByGame(gameId: string) {
    return this.prisma.comment.findMany({
      where: { gameId },
      include: {
        user: {
          select: {
            id: true,
            username: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async update(id: string, updateCommentDto: UpdateCommentDto, userId: string) {
    const comment = await this.prisma.comment.findUnique({
      where: { id },
    });

    if (!comment) {
      throw new NotFoundException('Comentario no encontrado');
    }

    if (comment.userId !== userId) {
      throw new ForbiddenException('No tienes permiso para editar este comentario');
    }

    return this.prisma.comment.update({
      where: { id },
      data: updateCommentDto,
      include: {
        user: {
          select: {
            id: true,
            username: true,
          },
        },
      },
    });
  }

  async remove(id: string, userId: string) {
    const comment = await this.prisma.comment.findUnique({
      where: { id },
    });

    if (!comment) {
      throw new NotFoundException('Comentario no encontrado');
    }

    if (comment.userId !== userId) {
      throw new ForbiddenException('No tienes permiso para eliminar este comentario');
    }

    return this.prisma.comment.delete({
      where: { id },
    });
  }
}