

## Fix: Admin Role Update Fails with "type app_role does not exist"

### Root Cause
The `update_user_role` database function has `SET search_path TO ''` (empty) for security hardening. However, the function body casts `new_role::app_role` without schema-qualifying the enum type. Since the search path is empty, Postgres cannot resolve `app_role` and throws "type app_role does not exist".

### Fix
Create a migration that replaces the `update_user_role` function, changing the single problematic line:

```sql
-- Before (line that fails):
VALUES (target_user_id, new_role::app_role);

-- After (schema-qualified):
VALUES (target_user_id, new_role::public.app_role);
```

The rest of the function body stays identical. No frontend changes needed.

### File Changed
- **New migration**: `supabase/migrations/..._fix_update_user_role_search_path.sql` — `CREATE OR REPLACE FUNCTION public.update_user_role(...)` with the schema-qualified cast.

### Verification
After the migration, changing a user's role from the Admin dashboard User Management tab should succeed without errors.

