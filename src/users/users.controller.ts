import { Controller, Get, Param, UseGuards, Post, Body, Delete, Patch } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { RegisterDto } from '../auth/dto/register.dto';

@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @Roles('ADMIN')
  findAll() {
    return this.usersService.findAll();
  }

  @Get('stats')
  @Roles('ADMIN')
  getStats() {
    return this.usersService.getStats();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  @Get('email/:email')
  @Roles('ADMIN')
  findByEmail(@Param('email') email: string) {
    return this.usersService.findByEmail(email);
  }

  @Post('create')
  @Roles('ADMIN')
  createUserByAdmin(@Body() registerDto: RegisterDto) {
    return this.usersService.createUser(registerDto);
  }

  @Patch(':id/suspend')
  @Roles('ADMIN')
  suspendUser(
    @Param('id') id: string,
    @Body() body: { days: number; reason: string }
  ) {
    return this.usersService.suspendUser(id, body.days, body.reason);
  }

  @Patch(':id/unsuspend')
  @Roles('ADMIN')
  unsuspendUser(@Param('id') id: string) {
    return this.usersService.unsuspendUser(id);
  }

  @Delete(':id')
  @Roles('ADMIN')
  deleteUser(@Param('id') id: string) {
    return this.usersService.deleteUser(id);
  }

  // ✅ NUEVO: Endpoint para que el admin cambie el plan de un usuario
  @Patch(':id/plan')
  @Roles('ADMIN')
  updateUserPlan(
    @Param('id') id: string,
    @Body() body: { plan: 'FREE' | 'BASIC' | 'PREMIUM' | 'VIP' }
  ) {
    return this.usersService.updateUserPlan(id, body.plan);
  }
}