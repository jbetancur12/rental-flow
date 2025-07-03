import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import 'dotenv/config';


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
        name: 'Portal de Gudalupe',
        type: 'BUILDING',
        address: 'Calle 34 No 13 - 73',
        totalFloors: 5,
      }
    });
  }

  console.log('✅ Demo Unit created:', {
    id: demoUnit.id, // Now this will be a real UUID
    name: demoUnit.name,
  });


  // Create demo properties (apartments) for the demo unit
  // We will create apartments with unit numbers and floors
  // Ensure we don't create duplicates by checking existing properties
  

 const locales = [
    { unitNumber: 'Local 1', floor: 1 },
    { unitNumber: 'Local 2', floor: 1 },
  ];

  for (const local of locales) {
    const name = `${local.unitNumber}`;
    const exists = await prisma.property.findFirst({
      where: { name, organizationId: demoOrg.id }
    });

    if (!exists) {
      const created = await prisma.property.create({
        data: {
          organizationId: demoOrg.id,
          unitId: demoUnit.id,
          name,
          type: 'COMMERCIAL',
          address: 'Calle 34 No 13-73',
          size: 60,
          rooms: 3,
          bathrooms: 1,
          rent: 1800000,
          unitNumber: local.unitNumber,
          status: 'AVAILABLE',
          floor: local.floor,
        }
      });

      console.log(`✅ ${name} creado:`, { name: created.name });
    } else {
      console.log(`ℹ️ ${name} ya existía, no se creó duplicado.`);
    }
  }

  const apartamentos = [
    { unitNumber: '201', floor: 2 },
    { unitNumber: '202', floor: 2 },
    { unitNumber: '301', floor: 3 },
    { unitNumber: '302', floor: 3 },
    { unitNumber: '401', floor: 4 },
    { unitNumber: '402', floor: 4 },
    { unitNumber: '501', floor: 5 },
    { unitNumber: '502', floor: 5 },
  ];

  for (const apt of apartamentos) {
    const name = `Apartamento ${apt.unitNumber}`;
    const exists = await prisma.property.findFirst({
      where: { name, organizationId: demoOrg.id }
    });

    if (!exists) {
      const created = await prisma.property.create({
        data: {
          organizationId: demoOrg.id,
          unitId: demoUnit.id,
          name,
          type: 'APARTMENT',
          address: 'Calle 34 No 13-73',
          size: 50,
          rooms: 3,
          bathrooms: 1,
          rent: 900000,
          unitNumber: apt.unitNumber,
          status: 'AVAILABLE',
          floor: apt.floor,
        }
      });

      console.log(`✅ ${name} creado:`, { name: created.name });
    } else {
      console.log(`ℹ️ ${name} ya existía, no se creó duplicado.`);
    }
  }

  let demoTenant1 = await prisma.tenant.findFirst({
    where: { email: 'juan.inquilino@demo.com', organizationId: demoOrg.id }
  });
  if (!demoTenant1) {
    demoTenant1 = await prisma.tenant.create({
      data: {
        organizationId: demoOrg.id,
        firstName: 'Juan',
        lastName: 'Inquilino',
        email: 'juan.inquilino@demo.com',
        phone: '555-1234',
        applicationDate: new Date(),
        status: 'APPROVED',
        creditScore: 700,
        emergencyContact: { name: 'Maria Inquilino', phone: '555-5678', relationship: 'hermana' },
        employment: { employer: 'Empresa Demo', position: 'Desarrollador', income: 60000 }
      }
    });
  }
  console.log('✅ Demo Tenant 1 created:', { email: demoTenant1.email });

  // Create demo tenant 2
  let demoTenant2 = await prisma.tenant.findFirst({
    where: { email: 'ana.arrendataria@demo.com', organizationId: demoOrg.id }
  });
  if (!demoTenant2) {
    demoTenant2 = await prisma.tenant.create({
      data: {
        organizationId: demoOrg.id,
        firstName: 'Ana',
        lastName: 'Arrendataria',
        email: 'ana.arrendataria@demo.com',
        phone: '555-8765',
        applicationDate: new Date(),
        status: 'APPROVED',
        creditScore: 720,
        emergencyContact: { name: 'Carlos Contacto', phone: '555-4321', relationship: 'esposo' },
        employment: { employer: 'Diseños Creativos', position: 'Diseñadora', income: 75000 }
      }
    });
  }
  console.log('✅ Demo Tenant 2 created:', { email: demoTenant2.email });

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