import { SubscriptionPlan } from '../../types/auth';

export const plans: SubscriptionPlan[] = [
  {
    id: 'plan-basic',
    name: 'Básico',
    description: 'Perfecto para pequeños propietarios',
    price: 29,
    billingCycle: 'monthly',
    features: [
      'Hasta 10 propiedades',
      'Hasta 20 inquilinos',
      'Reportes básicos',
      'Soporte por email',
      '5GB de almacenamiento'
    ],
    limits: {
      maxProperties: 10,
      maxTenants: 20,
      maxUsers: 2,
      storageGB: 5,
    },
    isActive: true,
  },
  {
    id: 'plan-professional',
    name: 'Profesional',
    description: 'Para gestores de propiedades',
    price: 79,
    billingCycle: 'monthly',
    features: [
      'Hasta 100 propiedades',
      'Hasta 200 inquilinos',
      'Reportes avanzados',
      'Soporte prioritario',
      '10GB de almacenamiento',
      'Múltiples usuarios'
    ],
    limits: {
      maxProperties: 100,
      maxTenants: 200,
      maxUsers: 5,
      storageGB: 10,
    },
    isActive: true,
  },
  {
    id: 'plan-enterprise',
    name: 'Empresarial',
    description: 'Para grandes inmobiliarias',
    price: 199,
    billingCycle: 'monthly',
    features: [
      'Propiedades ilimitadas',
      'Inquilinos ilimitados',
      'Reportes personalizados',
      'Soporte 24/7',
      '100GB de almacenamiento',
      'API personalizada',
      'Marca personalizada'
    ],
    limits: {
      maxProperties: 1000,
      maxTenants: 2000,
      maxUsers: 20,
      storageGB: 100,
    },
    isActive: true,
  },
]; 