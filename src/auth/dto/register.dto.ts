import { IsEmail, IsString, MinLength } from 'class-validator';

export class RegisterDto {
  @IsEmail({}, { message: 'Email inválido' })
  email!: string;

  @IsString()
  @MinLength(3, { message: 'Username debe tener al menos 3 caracteres' })
  username!: string;

  @IsString()
  @MinLength(6, { message: 'Password debe tener al menos 6 caracteres' })
  password!: string;
}