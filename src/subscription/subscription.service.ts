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

    // ✅ CREAR PLANES POR DEFECTO EN LA BASE DE DATOS
    this.seedDefaultPlans();
  }

  // ✅ SEMBRAR PLANES POR DEFECTO
  async seedDefaultPlans() {
    const defaultPlans = [
      {
        name: 'FREE',
        displayName: 'FREE',
        price: 0,
        features: ['Ver juegos', 'Votar reseñas', 'Comentar', 'Publicar reseñas', 'Subir imágenes'],
        description: 'Plan gratuito básico',
        color: '#6b7280',
      },
      {
        name: 'BASIC',
        displayName: 'BASIC',
        price: 4.99,
        features: ['Todo lo de FREE', 'Publicar reseñas (3/mes)', 'Subir imágenes', 'Estadísticas'],
        description: 'Plan básico para usuarios regulares',
        color: '#2563eb',
      },
      {
        name: 'PREMIUM',
        displayName: 'PREMIUM',
        price: 9.99,
        features: ['Todo lo de BASIC', 'Publicar reseñas ilimitadas', 'Subir imágenes (10/reseña)', 'Estadísticas básicas'],
        description: 'Plan premium para usuarios avanzados',
        color: '#9333ea',
      },
      {
        name: 'VIP',
        displayName: 'VIP',
        price: 19.99,
        features: ['Todo lo de PREMIUM', 'Imágenes ilimitadas', 'Estadísticas avanzadas', 'Soporte prioritario 24/7', 'Experiencia sin anuncios'],
        description: 'Plan VIP para usuarios premium',
        color: '#eab308',
      },
    ];

    try {
      for (const plan of defaultPlans) {
        await this.prisma.plan.upsert({
          where: { name: plan.name },
          update: plan,
          create: plan,
        });
      }
      console.log('✅ Planes por defecto creados/actualizados en la BD');
    } catch (error) {
      console.error('❌ Error al sembrar planes por defecto:', error);
    }
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

  // ✅ AHORA SOLO OBTIENE PLANES DE LA BASE DE DATOS
  async getAllPlans() {
    return this.prisma.plan.findMany({
      orderBy: { price: 'asc' },
    });
  }

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

  async updatePlan(id: string, data: any) {
    return this.prisma.plan.update({
      where: { id },
      data,
    });
  }

  async deletePlan(id: string) {
    return this.prisma.plan.delete({
      where: { id },
    });
  }

  async upgradePlan(userId: string, plan: string) {
    const subscription = await this.getUserSubscription(userId);
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + 1);

    return this.prisma.subscription.update({
      where: { id: subscription.id },
      data: {
        plan: plan.toUpperCase() as any,
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

    const userPermissions = permissions[plan] || permissions['PREMIUM'];

    return userPermissions.includes(feature) || false;
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
      console.error('❌ Error al crear PaymentIntent de Stripe:', error);
      throw new InternalServerErrorException(
        error.message || 'Error al procesar el pago con Stripe'
      );
    }
  }
}