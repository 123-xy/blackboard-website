# Fresh Supabase setup

This setup uses the existing Blackboard admin dashboard with a new PostgreSQL database. Authentication continues to use the app's AdminUser table and NextAuth; Supabase Auth users do not grant dashboard access.

1. Create a new Supabase project in your account. Save the database password privately. Keep the old project until the new site is verified.
2. In the new project's SQL Editor, run `prisma/new-project-setup.sql` once against the empty database. This creates reservations, inquiries, newsletter subscribers, restaurant settings, and admin accounts. It does not copy old data.
3. Copy the new project's connection details from Connect. Set DATABASE_URL privately in `.env.local`; use the actual database password with URL encoding when needed. Never commit the value.
4. Run `node scripts/setup-admin.cjs` in an interactive terminal. Enter your admin email and a password of at least 16 characters. Existing accounts are never overwritten.
5. Verify login at the local `/admin/login` and verify a test reservation and contact inquiry.
6. Update DATABASE_URL in Vercel for the project serving blackboardrestaurant.com and redeploy. Keep NEXTAUTH_SECRET private and keep NEXTAUTH_URL set to the production website URL. No Supabase service-role key is required by this server-side Prisma setup.
7. Verify production login, reservations, inquiries, and sign-out before using the new dashboard.

New tables enable row-level security with no public policies. The server uses the database role from DATABASE_URL. Do not add public read policies to AdminUser or customer tables.
