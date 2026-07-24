import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  UseGuards,
  Request,
  Body,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { SubscriptionService } from './subscription.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';

@Controller('subscription')
@UseGuards(JwtAuthGuard)
export class SubscriptionController {
  constructor(private readonly subscriptionService: SubscriptionService) {}

  @Get()
  async getSubscription(@Request() req) {
    try {
      return await this.subscriptionService.getUserSubscription(req.user.id);
    } catch (error: any) {
      throw new HttpException(
        error.message || 'Error al obtener la suscripción',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('plans')
  async getAllPlans() {
    return this.subscriptionService.getAllPlans();
  }

  @Post('plans')
  @Roles('ADMIN')
  async createPlan(@Body() data: any) {
    try {
      return await this.subscriptionService.createPlan(data);
    } catch (error: any) {
      throw new HttpException(
        error.message || 'Error al crear el plan',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // ✅ SIN VALIDACIONES - AHORA TODOS LOS PLANES SON EDITABLES
  @Put('plans/:id')
  @Roles('ADMIN')
  async updatePlan(@Param('id') id: string, @Body() data: any) {
    try {
      return await this.subscriptionService.updatePlan(id, data);
    } catch (error: any) {
      throw new HttpException(
        error.message || 'Error al actualizar el plan',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Delete('plans/:id')
  @Roles('ADMIN')
  async deletePlan(@Param('id') id: string) {
    try {
      return await this.subscriptionService.deletePlan(id);
    } catch (error: any) {
      throw new HttpException(
        error.message || 'Error al eliminar el plan',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('upgrade/:plan')
  async upgradePlan(@Request() req, @Param('plan') plan: string) {
    try {
      const availablePlans = await this.subscriptionService.getAllPlans();
      const planExists = availablePlans.some(
        (p: any) => p.name.toLowerCase() === plan.toLowerCase()
      );

      if (!planExists) {
        throw new HttpException('Plan no válido o no existe', HttpStatus.BAD_REQUEST);
      }

      return await this.subscriptionService.upgradePlan(req.user.id, plan.toUpperCase());
    } catch (error: any) {
      throw new HttpException(
        error.message || 'Error al actualizar el plan',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('check/:feature')
  async checkPermission(@Request() req, @Param('feature') feature: string) {
    try {
      const hasPermission = await this.subscriptionService.checkPermission(
        req.user.id,
        feature,
      );
      return { hasPermission };
    } catch (error: any) {
      throw new HttpException(
        error.message || 'Error al verificar permisos',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('create-payment-intent')
  async createPaymentIntent(
    @Request() req,
    @Body() body: { plan: string; amount: number; currency: string },
  ) {
    if (!body.plan || !body.amount || !body.currency) {
      throw new HttpException(
        'Faltan campos obligatorios: plan, amount, currency',
        HttpStatus.BAD_REQUEST,
      );
    }

    if (typeof body.amount !== 'number' || body.amount <= 0) {
      throw new HttpException(
        'El monto debe ser un número mayor a 0',
        HttpStatus.BAD_REQUEST,
      );
    }

    try {
      const result = await this.subscriptionService.createPaymentIntent(
        req.user.id,
        {
          plan: body.plan.toUpperCase(),
          amount: body.amount,
          currency: body.currency.toLowerCase(),
        },
      );
      return result;
    } catch (error: any) {
      throw new HttpException(
        error.message || 'Error al procesar el pago con Stripe',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}