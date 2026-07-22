import { Module } from '@nestjs/common';
import { GamesController } from './games.controller';
import { GamesService } from './games.service';
import { CategoriesController } from './categories.controller';
import { CategoriesService } from './categories.service';

@Module({
  controllers: [GamesController, CategoriesController], // ✅ Ambos controladores registrados
  providers: [GamesService, CategoriesService],
  exports: [GamesService],
})
export class GamesModule {}