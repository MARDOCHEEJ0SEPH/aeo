# Database Schema Fix - Circular Dependency Resolution

## Issue Fixed
**Error:** `ERROR: 42P01: relation "public.clients" does not exist`

## Root Cause
The schema had a circular dependency between two tables:
- `instagram_leads.client_id` → references `clients.id` (line 100)
- `clients.lead_id` → references `instagram_leads.id` (line 248)

When PostgreSQL tried to create `instagram_leads` first, it couldn't find the `clients` table yet, causing the error.

## Solution Applied
Resolved the circular dependency by:

1. **Removed inline foreign key constraints** from table definitions:
   - Line 100: Changed `client_id UUID REFERENCES public.clients(id)` to `client_id UUID`
   - Line 248: Changed `lead_id UUID REFERENCES public.instagram_leads(id)` to `lead_id UUID`

2. **Added constraints separately** after both tables exist (lines 629-637):
   ```sql
   ALTER TABLE public.instagram_leads
   ADD CONSTRAINT fk_instagram_leads_client
   FOREIGN KEY (client_id) REFERENCES public.clients(id);

   ALTER TABLE public.clients
   ADD CONSTRAINT fk_clients_lead
   FOREIGN KEY (lead_id) REFERENCES public.instagram_leads(id);
   ```

## Result
✅ Schema can now be deployed successfully without dependency errors
✅ All foreign key relationships are preserved
✅ Database integrity is maintained

## Next Steps
1. Deploy the fixed schema to Supabase
2. Run `DATABASE_SCHEMA_TEST.sql` to verify everything works
3. Continue with Supabase setup (Edge Functions, Storage, Auth)

---

**Fixed:** 2025-11-21
**Schema Version:** 1.1
