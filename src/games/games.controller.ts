import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request, Query } from '@nestjs/common';
import { GamesService } from './games.service';
import { CreateGameDto } from './dto/create-game.dto';
import { UpdateGameDto } from './dto/update-game.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@Controller('games')
export class GamesController {
  constructor(private readonly gamesService: GamesService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  create(@Body() createGameDto: CreateGameDto, @Request() req) {
    return this.gamesService.create(createGameDto, req.user.id);
  }

  // ✅ RECIBE EL PARÁMETRO 'genre' Y SE LO PASA AL SERVICIO
  @Get()
  findAll(@Query('userId') userId?: string, @Query('genre') genre?: string) {
    return this.gamesService.findAll(userId, genre);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Request() req) {
    const currentUserId = req.user?.id;
    return this.gamesService.findOne(id, currentUserId);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  update(@Param('id') id: string, @Body() updateGameDto: UpdateGameDto, @Request() req) {
    return this.gamesService.update(id, updateGameDto, req.user.id, req.user.role);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  remove(@Param('id') id: string, @Request() req) {
    return this.gamesService.remove(id, req.user.id, req.user.role);
  }

  @Delete('admin/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  adminDelete(@Param('id') id: string) {
    return this.gamesService.adminDeleteGame(id);
  }

  @Post(':id/vote')
  @UseGuards(JwtAuthGuard)
  vote(@Param('id') id: string, @Request() req) {
    return this.gamesService.vote(id, req.user.id);
  }
}