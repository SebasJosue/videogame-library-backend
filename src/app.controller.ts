import { Controller, Get } from '@nestjs/common';

@Controller()
export class AppController {
  @Get()
  getRoot(): { message: string; version: string; endpoints: string[] } {
    return {
      message: '🎮 Welcome to Game Library API',
      version: '1.0.0',
      endpoints: [
        'POST /auth/register - Register new user',
        'POST /auth/login - Login user',
        'GET /users - Get all users (protected)',
        'GET /users/:id - Get user by ID (protected)',
        'GET /games - Get all games',
        'POST /games - Create new game (protected)',
        'GET /games/:id - Get game by ID',
        'PATCH /games/:id - Update game (protected)',
        'DELETE /games/:id - Delete game (protected)',
      ],
    };
  }
}