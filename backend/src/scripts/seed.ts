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

  const existingSubscription = await prisma.subscription.findFirst({
    where: { organizationId: demoOrg.id }
  });

  await prisma.subscription.upsert({
    where: { id: existingSubscription?.id ?? '' }, 
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

  // Create a demo unit for the demo organization
  // Find existing unit by name (since name is not unique, we need to check manually)
  let demoUnit = await prisma.unit.findFirst({
    where: { name: 'Edificio Demo', organizationId: demoOrg.id }
  });

  if (!demoUnit) {
    demoUnit = await prisma.unit.create({
      data: {
        organizationId: demoOrg.id,
        name: 'Edificio Demo',
        type: 'BUILDING',
        address: '123 Calle Falsa, Ciudad Demo',
        totalFloors: 5,
      }
    });
  }

  console.log('✅ Demo Unit created:', {
    id: demoUnit.id, // Now this will be a real UUID
    name: demoUnit.name,
  });

  // Create a demo property for the demo organization
  // Try to find an existing property by name and organization (since name is not unique, we need to check manually)
  let demoProperty = await prisma.property.findFirst({
    where: { name: 'Apartamento 101', organizationId: demoOrg.id }
  });

  if (!demoProperty) {
    demoProperty = await prisma.property.create({
      data: {
        organizationId: demoOrg.id,
        unitId: demoUnit.id,
        name: 'Apartamento 101',
        unitNumber: '101',
        type: 'APARTMENT',
        address: '123 Calle Falsa, Apto 101, Ciudad Demo',
        size: 80,
        rooms: 2,
        bathrooms: 1,
        rent: 1200,
        status: 'AVAILABLE'
      }
    });
  }

  console.log('✅ Demo Property created:', {
    id: demoProperty.id, // Now this will be a real UUID
    name: demoProperty.name,
  });

  // Create a demo tenant for the demo organization
  let demoTenant = await prisma.tenant.findFirst({
    where: { email: 'tenant@demo.com', organizationId: demoOrg.id }
  });

  if (demoTenant) {
    demoTenant = await prisma.tenant.update({
      where: { id: demoTenant.id },
      data: {
        firstName: 'Juan',
        lastName: 'Inquilino',
        phone: '555-1234',
        applicationDate: new Date(),
        status: 'ACTIVE',
        emergencyContact: {
          name: 'Maria Inquilino',
          phone: '555-5678',
          relationship: 'hermana'
        },
        creditScore: 700,
        employment: {
          employer: 'Empresa Demo',
          position: 'Desarrollador',
          income: 60000
        }
      }
    });
  } else {
    demoTenant = await prisma.tenant.create({
      data: {
        organizationId: demoOrg.id,
        firstName: 'Juan',
        lastName: 'Inquilino',
        email: 'tenant@demo.com',
        phone: '555-1234',
        applicationDate: new Date(),
        status: 'ACTIVE',
        emergencyContact: {
          name: 'Maria Inquilino',
          phone: '555-5678',
          relationship: 'hermana'
        },
        employment: {
          employer: 'Empresa Demo',
          position: 'Desarrollador',
          income: 60000
        }
      }
    });
  }

  console.log('✅ Demo Tenant created:', {
    id: demoTenant.id, // Now this will be a real UUID
    email: demoTenant.email,
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