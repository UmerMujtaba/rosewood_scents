# Rosewood Scents — Next.js + Supabase

## 1. Create .env.local in the project root
```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
NEXT_PUBLIC_APP_URL=http://localhost:3000
# Optional Stripe
STRIPE_SECRET_KEY=sk_test_...
```

## 2. Set up Supabase Database
- Go to Supabase → SQL Editor
- Run supabase/schema.sql
- Run supabase/seed.sql

## 3. Install & Run
```bash
npm install
npm run dev
```
Open http://localhost:3000

## 4. Set Admin
After registering, run in Supabase SQL Editor:
UPDATE profiles SET role = 'admin' WHERE id = 'your-user-uuid';

## Stack
- Next.js 15 (App Router)
- Supabase Auth + Database
- Tailwind CSS
- Stripe (optional)
