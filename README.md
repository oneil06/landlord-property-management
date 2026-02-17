# Landlord Property Management App

A comprehensive property management application built with Next.js 16, Prisma, and Tailwind CSS.

## Features

- **User Authentication** - Secure login and registration system
- **Dashboard** - Overview of properties, tenants, income, and maintenance requests
- **Properties Management** - Add, view, and manage rental properties
- **Tenants Management** - Track tenant information and property assignments
- **Leases Management** - Manage lease agreements with date tracking
- **Rent Reminders** - Schedule and track rent payments
- **Maintenance Requests** - Handle tenant maintenance requests
- **Expenses Tracking** - Record property expenses with recurring options

## Tech Stack

- **Frontend**: Next.js 16 (App Router), React 19, Tailwind CSS 4
- **Backend**: Next.js API Routes
- **Database**: SQLite (development) / PostgreSQL (production)
- **ORM**: Prisma 5
- **State Management**: Zustand
- **Form Handling**: React Hook Form + Zod
- **Icons**: Lucide React

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone https://github.com/oneil06/landlord-property-management.git
cd landlord-property-management
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
```

4. Initialize the database:
```bash
npx prisma db push
```

5. Start the development server:
```bash
npm run dev
```

6. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Deployment on Vercel

### Important: Database Configuration

This app uses SQLite for local development, but SQLite is not supported on Vercel. You need to use a cloud database for production.

### Option 1: Vercel Postgres (Recommended)

1. Create a new Vercel Postgres database in your Vercel project dashboard
2. Add the database connection string to your environment variables:
   - `DATABASE_URL` - Your Vercel Postgres connection string
3. Update `prisma/schema.prisma` to use PostgreSQL:
   ```prisma
   datasource db {
     provider  = "postgresql"
     url       = env("DATABASE_URL")
     directUrl = env("DATABASE_URL")
   }
   ```
4. Deploy your project

### Option 2: Supabase

1. Create a Supabase project at [supabase.com](https://supabase.com)
2. Copy the database connection string from Project Settings > Database
3. Add `DATABASE_URL` to your Vercel environment variables
4. Update `prisma/schema.prisma` to use PostgreSQL (see above)
5. Deploy your project

### Option 3: PlanetScale

1. Create a PlanetScale database at [planetscale.com](https://planetscale.com)
2. Copy the connection string
3. Add `DATABASE_URL` to your Vercel environment variables
4. Update `prisma/schema.prisma` to use MySQL:
   ```prisma
   datasource db {
     provider = "mysql"
     url      = env("DATABASE_URL")
   }
   ```
5. Deploy your project

### Deploy Steps

1. Push your code to GitHub
2. Import your repository on [Vercel](https://vercel.com/new)
3. Add your `DATABASE_URL` environment variable
4. Deploy!

## Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | Database connection string | `file:./dev.db` (local) or PostgreSQL URL (production) |

## Project Structure

```
src/
├── app/
│   ├── (auth)/           # Authentication pages (login, register)
│   ├── (dashboard)/      # Dashboard and management pages
│   ├── api/              # API routes
│   └── globals.css       # Global styles
├── lib/
│   ├── auth.ts           # Authentication store (Zustand)
│   └── prisma.ts         # Prisma client
└── ...
prisma/
├── schema.prisma         # Database schema
└── migrations/           # Database migrations
```

## License

MIT
