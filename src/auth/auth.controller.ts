import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  // Endpoint para crear el primer ADMIN (solo si no hay usuarios)
  @Post('seed-admin')
  async seedAdmin(@Body() registerDto: RegisterDto) {
    return this.authService.seedAdmin(registerDto);
  }

  // NUEVO: Endpoint para crear un ADMIN en cualquier momento
  @Post('create-admin')
  async createAdmin(@Body() registerDto: RegisterDto) {
    return this.authService.createAdmin(registerDto);
  }
}