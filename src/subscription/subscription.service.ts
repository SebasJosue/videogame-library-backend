import { Injectable, NotFoundException, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import Stripe from 'stripe';

@Injectable()
export class SubscriptionService {
  private stripe: Stripe;

  constructor(private prisma: PrismaService) {
    const secretKey = process.env.STRIPE_SECRET_KEY;

    if (!secretKey || secretKey.includes('dummy')) {
      console.error('⚠️ ERROR CRÍTICO: STRIPE_SECRET_KEY no se encontró en el .env');
      throw new Error('STRIPE_SECRET_KEY no está configurada en el .env');
    } else {
      console.log('✅ Stripe inicializado correctamente con la clave:', secretKey.substring(0, 15) + '...');
    }

    this.stripe = new Stripe(secretKey, {
      apiVersion: '2023-10-16' as any, 
    });
  }

  async getUserSubscription(userId: string) {
    let subscription = await this.prisma.subscription.findUnique({
      where: { userId },
    });

    if (!subscription) {
      subscription = await this.prisma.subscription.create({
        data: {
          userId,
          plan: 'FREE',
        },
      });
    }

    return subscription;
  }

  // ✅ NUEVO: Obtener todos los planes personalizados
  async getAllPlans() {
    return this.prisma.plan.findMany({
      orderBy: { price: 'asc' },
    });
  }

  // ✅ NUEVO: Crear plan personalizado
  async createPlan(data: {
    name: string;
    displayName: string;
    price: number;
    features: string[];
    description?: string;
    color?: string;
  }) {
    return this.prisma.plan.create({
      data: {
        name: data.name.toUpperCase(),
        displayName: data.displayName,
        price: data.price,
        features: data.features,
        description: data.description,
        color: data.color || '#6366f1',
        isActive: true,
      },
    });
  }

  // ✅ NUEVO: Actualizar plan
  async updatePlan(id: string, data: any) {
    return this.prisma.plan.update({
      where: { id },
      data,
    });
  }

  // ✅ NUEVO: Eliminar plan
  async deletePlan(id: string) {
    return this.prisma.plan.delete({
      where: { id },
    });
  }

  async upgradePlan(userId: string, plan: 'BASIC' | 'PREMIUM' | 'VIP') {
    const subscription = await this.getUserSubscription(userId);
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + 1);

    return this.prisma.subscription.update({
      where: { id: subscription.id },
      data: {
        plan,
        endDate,
        isActive: true,
      },
    });
  }

  async checkPermission(userId: string, feature: string): Promise<boolean> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { subscription: true },
    });

    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    if (user.role === 'ADMIN') {
      return true;
    }

    const plan = user.subscription?.plan || 'FREE';
    const permissions: Record<string, string[]> = {
      FREE: ['view_games', 'vote', 'comment'],
      BASIC: ['view_games', 'vote', 'comment', 'publish_reviews'],
      PREMIUM: ['view_games', 'vote', 'comment', 'publish_reviews', 'upload_images', 'analytics'],
      VIP: ['view_games', 'vote', 'comment', 'publish_reviews', 'upload_images', 'analytics', 'priority_support', 'ad_free'],
    };

    return permissions[plan]?.includes(feature) || false;
  }

  async createPaymentIntent(userId: string, data: { plan: string; amount: number; currency: string }) {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        throw new NotFoundException('Usuario no encontrado');
      }

      const paymentIntent = await this.stripe.paymentIntents.create({
        amount: data.amount,
        currency: data.currency,
        automatic_payment_methods: { enabled: true },
        metadata: {
          userId,
          plan: data.plan,
        },
      });

      return { clientSecret: paymentIntent.client_secret };
    } catch (error: any) {
      console.error(' Error al crear PaymentIntent de Stripe:', error);
      throw new InternalServerErrorException(
        error.message || 'Error al procesar el pago con Stripe'
      );
    }
  }
}