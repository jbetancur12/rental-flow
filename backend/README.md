# RentFlow Backend API

A comprehensive SaaS backend for property management built with Express.js, TypeScript, and PostgreSQL.

## Features

- 🏢 **Multi-tenant SaaS Architecture** - Complete organization isolation
- 🔐 **JWT Authentication** - Secure token-based authentication
- 👥 **Role-based Access Control** - Super Admin, Admin, Manager, User roles
- 🏠 **Property Management** - Units, properties, tenants, contracts
- 💰 **Payment Processing** - Payment tracking and management
- 🔧 **Maintenance Requests** - Complete maintenance workflow
- 📊 **Reporting & Analytics** - Comprehensive reporting system
- 🔄 **Real-time Updates** - Socket.IO integration
- 📧 **Email Notifications** - Automated email system
- 💳 **Stripe Integration** - Payment processing and subscriptions

## Tech Stack

- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: JWT
- **Real-time**: Socket.IO
- **Email**: Nodemailer
- **Payments**: Stripe
- **Logging**: Winston
- **Validation**: Express Validator + Joi

## Quick Start

### Prerequisites

- Node.js 18+
- PostgreSQL 14+
- npm or yarn

### Installation

1. **Clone and setup**
   ```bash
   cd backend
   npm install
   ```

2. **Environment Setup**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. **Database Setup**
   ```bash
   # Generate Prisma client
   npx prisma generate
   
   # Run migrations
   npx prisma migrate dev
   
   # Seed database
   npm run seed
   ```

4. **Start Development Server**
   ```bash
   npm run dev
   ```

The API will be available at `http://localhost:3001`

## Environment Variables

Key environment variables to configure:

```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/rentflow_db"

# JWT
JWT_SECRET=your-super-secret-jwt-key-here
JWT_EXPIRES_IN=7d

# Email (Nodemailer)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# Stripe
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret

# Super Admin
SUPER_ADMIN_EMAIL=admin@rentflow.com
SUPER_ADMIN_PASSWORD=superadmin123
```

## API Endpoints

### Authentication
- `POST /api/v1/auth/register` - Register new organization
- `POST /api/v1/auth/login` - User login
- `GET /api/v1/auth/me` - Get current user
- `POST /api/v1/auth/logout` - User logout
- `POST /api/v1/auth/refresh` - Refresh token

### Organizations
- `GET /api/v1/organizations` - List organizations (Super Admin)
- `GET /api/v1/organizations/:id` - Get organization
- `PUT /api/v1/organizations/:id` - Update organization
- `PATCH /api/v1/organizations/:id/activate` - Activate organization
- `PATCH /api/v1/organizations/:id/deactivate` - Deactivate organization

### Properties & Units
- `GET /api/v1/units` - List units
- `POST /api/v1/units` - Create unit
- `GET /api/v1/units/:id` - Get unit
- `PUT /api/v1/units/:id` - Update unit
- `DELETE /api/v1/units/:id` - Delete unit

- `GET /api/v1/properties` - List properties
- `POST /api/v1/properties` - Create property
- `GET /api/v1/properties/:id` - Get property
- `PUT /api/v1/properties/:id` - Update property
- `DELETE /api/v1/properties/:id` - Delete property

### Additional Endpoints
- Tenants: `/api/v1/tenants/*`
- Contracts: `/api/v1/contracts/*`
- Payments: `/api/v1/payments/*`
- Maintenance: `/api/v1/maintenance/*`
- Reports: `/api/v1/reports/*`
- Subscriptions: `/api/v1/subscriptions/*`

## Database Schema

The application uses a comprehensive PostgreSQL schema with the following main entities:

- **Organizations** - Multi-tenant isolation
- **Users** - User management with roles
- **Subscriptions** - SaaS billing and plans
- **Units** - Buildings, houses, commercial spaces
- **Properties** - Individual rental units
- **Tenants** - Tenant management
- **Contracts** - Rental agreements
- **Payments** - Payment tracking
- **Maintenance Requests** - Maintenance workflow

## Authentication & Authorization

### JWT Authentication
- Stateless JWT tokens
- Automatic token refresh
- Secure password hashing with bcrypt

### Role-based Access Control
- **Super Admin**: Platform-wide access
- **Admin**: Organization-wide access
- **Manager**: Limited management access
- **User**: Basic access

### Multi-tenant Security
- Organization-level data isolation
- Automatic organization filtering
- Cross-organization access prevention

## Development

### Database Operations
```bash
# View database in browser
npx prisma studio

# Reset database
npx prisma migrate reset

# Deploy migrations to production
npx prisma migrate deploy
```

### Code Quality
```bash
# Type checking
npx tsc --noEmit

# Linting (if configured)
npm run lint
```

## Production Deployment

### Build
```bash
npm run build
npm start
```

### Environment
- Set `NODE_ENV=production`
- Use production database
- Configure proper CORS origins
- Set up SSL/TLS
- Configure rate limiting
- Set up monitoring and logging

### Database
- Use connection pooling
- Set up backups
- Monitor performance
- Configure SSL connections

## Security Features

- **Helmet.js** - Security headers
- **CORS** - Cross-origin protection
- **Rate Limiting** - DDoS protection
- **Input Validation** - SQL injection prevention
- **JWT Security** - Secure token handling
- **Password Hashing** - bcrypt with salt rounds
- **Organization Isolation** - Multi-tenant security

## Monitoring & Logging

- **Winston** - Structured logging
- **Morgan** - HTTP request logging
- **Error Handling** - Comprehensive error management
- **Health Checks** - `/health` endpoint

## Support

For questions and support:
- Check the API documentation
- Review the database schema
- Check logs for debugging
- Ensure environment variables are set correctly

## License

MIT License - see LICENSE file for details.