import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Create super admin user
  const superAdminPassword = await bcrypt.hash(process.env.SUPER_ADMIN_PASSWORD || 'superadmin123', 12);
  
  // Create platform organization for super admin
  const platformOrg = await prisma.organization.upsert({
    where: { slug: 'rentflow-platform' },
    update: {},
    create: {
      name: 'RentFlow Platform',
      slug: 'rentflow-platform',
      planId: 'platform',
      settings: {
        currency: 'USD',
        timezone: 'UTC',
        dateFormat: 'DD/MM/YYYY',
        language: 'en',
        features: {
          multipleProperties: true,
          advancedReports: true,
          apiAccess: true,
          customBranding: true,
          prioritySupport: true
        },
        limits: {
          maxProperties: 999999,
          maxTenants: 999999,
          maxUsers: 999999,
          storageGB: 999999
        }
      }
    }
  });

  // Create super admin user
  const superAdmin = await prisma.user.upsert({
    where: { email: process.env.SUPER_ADMIN_EMAIL || 'admin@rentflow.com' },
    update: {},
    create: {
      organizationId: platformOrg.id,
      email: process.env.SUPER_ADMIN_EMAIL || 'admin@rentflow.com',
      passwordHash: superAdminPassword,
      firstName: 'Super',
      lastName: 'Admin',
      role: 'SUPER_ADMIN'
    }
  });

  console.log('✅ Super Admin created:', {
    email: superAdmin.email,
    role: superAdmin.role,
    organizationId: superAdmin.organizationId
  });

  // Create demo organization
  const demoOrg = await prisma.organization.upsert({
    where: { slug: 'demo-organization' },
    update: {},
    create: {
      name: 'Demo Organization',
      slug: 'demo-organization',
      planId: 'plan-professional',
      email: 'demo@rentflow.com',
      settings: {
        currency: 'USD',
        timezone: 'America/Mexico_City',
        dateFormat: 'DD/MM/YYYY',
        language: 'es',
        features: {
          multipleProperties: true,
          advancedReports: false,
          apiAccess: false,
          customBranding: false,
          prioritySupport: true
        },
        limits: {
          maxProperties: 100,
          maxTenants: 200,
          maxUsers: 5,
          storageGB: 10
        }
      }
    }
  });

  // Create demo subscription
  const trialEnd = new Date();
  trialEnd.setDate(trialEnd.getDate() + 14);

  // Find existing subscription by organizationId (assuming only one subscription per organization)
  const existingSubscription = await prisma.subscription.findFirst({
    where: { organizationId: demoOrg.id }
  });

  await prisma.subscription.upsert({
    where: { id: existingSubscription?.id ?? '' }, // If not found, upsert will create new
    update: {},
    create: {
      organizationId: demoOrg.id,
      planId: 'plan-professional',
      status: 'TRIALING',
      currentPeriodStart: new Date(),
      currentPeriodEnd: trialEnd,
      trialEnd
    }
  });

  // Create demo admin user
  const demoPassword = await bcrypt.hash('demo123', 12);
  
  const demoUser = await prisma.user.upsert({
    where: { email: 'demo@rentflow.com' },
    update: {},
    create: {
      organizationId: demoOrg.id,
      email: 'demo@rentflow.com',
      passwordHash: demoPassword,
      firstName: 'Demo',
      lastName: 'Admin',
      role: 'ADMIN'
    }
  });

  console.log('✅ Demo User created:', {
    email: demoUser.email,
    role: demoUser.role,
    organizationId: demoUser.organizationId
  });

  console.log('✅ Database seeded successfully!');
  console.log('🔑 Super Admin: admin@rentflow.com / superadmin123');
  console.log('🎯 Demo User: demo@rentflow.com / demo123');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });