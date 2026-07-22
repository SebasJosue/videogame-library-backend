import { Injectable, UnauthorizedException, ConflictException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async register(registerDto: RegisterDto) {
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
      },
    });

    const token = this.generateToken(user.id, user.email, user.role);

    return {
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        role: user.role,
      },
      token,
    };
  }

  async login(loginDto: LoginDto) {
    const { email, password } = loginDto;

    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    const token = this.generateToken(user.id, user.email, user.role);

    return {
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        role: user.role,
      },
      token,
    };
  }

  // Crear el primer ADMIN (solo si no hay usuarios en la DB)
  async seedAdmin(registerDto: RegisterDto) {
    const userCount = await this.prisma.user.count();

    if (userCount > 0) {
      throw new BadRequestException('Ya existen usuarios en la base de datos. Usa el login normal o el endpoint create-admin.');
    }

    const { email, password, username } = registerDto;

    const hashedPassword = await bcrypt.hash(password, 10);

    const admin = await this.prisma.user.create({
      data: {
        email,
        username,
        password: hashedPassword,
        role: 'ADMIN',
      },
    });

    const token = this.generateToken(admin.id, admin.email, admin.role);

    return {
      message: 'ADMIN creado exitosamente',
      user: {
        id: admin.id,
        email: admin.email,
        username: admin.username,
        role: admin.role,
      },
      token,
    };
  }

  // NUEVO: Crear un ADMIN en cualquier momento (solo valida que el email/username no exista)
  async createAdmin(registerDto: RegisterDto) {
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

    const admin = await this.prisma.user.create({
      data: {
        email,
        username,
        password: hashedPassword,
        role: 'ADMIN', // Forzamos el rol de ADMIN
      },
    });

    const token = this.generateToken(admin.id, admin.email, admin.role);

    return {
      message: 'ADMIN creado exitosamente',
      user: {
        id: admin.id,
        email: admin.email,
        username: admin.username,
        role: admin.role,
      },
      token,
    };
  }

  private generateToken(userId: string, email: string, role: string) {
    const payload = { sub: userId, email, role };
    return this.jwtService.sign(payload);
  }
}