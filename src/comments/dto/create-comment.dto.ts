import { IsString, IsNotEmpty, MinLength, MaxLength } from 'class-validator';

export class CreateCommentDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(5, { message: 'El comentario debe tener al menos 5 caracteres' })
  @MaxLength(500, { message: 'El comentario no puede exceder los 500 caracteres' })
  content: string;

  @IsString()
  @IsNotEmpty()
  gameId: string;
}