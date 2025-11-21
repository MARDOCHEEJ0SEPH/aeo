# Database Schema Testing Guide

## 🧪 Testing the AEOLOVABLE Database Schema

This guide explains how to test the database schema before deployment.

---

## Prerequisites

- PostgreSQL 15+ (or Supabase account)
- `psql` command-line tool
- Database with schema already applied
- Or: Access to Supabase SQL Editor

---

## Quick Start

### Option 1: Test Locally with Docker

```bash
# 1. Start PostgreSQL container
docker run --name aeo-test-db \
  -e POSTGRES_PASSWORD=testpassword \
  -e POSTGRES_DB=aeotest \
  -p 5432:5432 \
  -d postgres:15

# 2. Apply schema
psql -h localhost -U postgres -d aeotest -f DATABASE_SCHEMA.sql

# 3. Run tests
psql -h localhost -U postgres -d aeotest -f DATABASE_SCHEMA_TEST.sql

# 4. Cleanup
docker stop aeo-test-db
docker rm aeo-test-db
```

### Option 2: Test on Supabase

**Using Supabase Dashboard:**

1. Go to your Supabase project
2. Navigate to **SQL Editor**
3. Create new query
4. Copy contents of `DATABASE_SCHEMA.sql`
5. Click **Run**
6. Create another new query
7. Copy contents of `DATABASE_SCHEMA_TEST.sql`
8. Click **Run**
9. Review output in the **Results** panel

**Using Supabase CLI:**

```bash
# 1. Login to Supabase
supabase login

# 2. Link your project
supabase link --project-ref YOUR_PROJECT_REF

# 3. Apply schema
supabase db push

# 4. Run tests
psql -h db.YOUR_PROJECT_REF.supabase.co \
  -U postgres \
  -d postgres \
  -f DATABASE_SCHEMA_TEST.sql
```

### Option 3: Test with Local Supabase

```bash
# 1. Start Supabase locally
supabase start

# 2. Apply migrations
supabase db reset

# 3. Run tests
supabase db test
```

---

## Test Suite Overview

The test suite (`DATABASE_SCHEMA_TEST.sql`) performs **11 comprehensive tests**:

### ✅ Test 1: Table Existence
- Verifies all 11 tables were created
- Checks table structure

### ✅ Test 2: Index Existence
- Confirms all indexes are present
- Validates critical performance indexes

### ✅ Test 3: Trigger Functions
- Tests all 5 trigger functions exist
- Validates function signatures

### ✅ Test 4: Triggers
- Confirms triggers are attached to tables
- Tests trigger firing conditions

### ✅ Test 5: Row Level Security (RLS)
- Verifies RLS is enabled on all tables
- Checks policy existence
- Validates admin policies

### ✅ Test 6: Lead Scoring Logic
- Tests automatic score calculation
- Validates priority assignment
- Tests score recalculation on updates

### ✅ Test 7: Outreach Campaigns
- Tests campaign creation
- Validates message sending
- Checks automatic stats updates

### ✅ Test 8: Client & Project Relationships
- Tests foreign key relationships
- Validates LTV calculation trigger
- Checks project count updates

### ✅ Test 9: Constraints & Validation
- Tests check constraints
- Validates unique constraints
- Ensures invalid data is rejected

### ✅ Test 10: Views
- Tests all materialized views
- Validates view queries

### ✅ Test 11: Performance
- Measures query execution time
- Identifies potential bottlenecks

---

## Expected Output

When tests run successfully, you'll see output like:

```
============================================================
TEST 1: CHECKING TABLE EXISTENCE
============================================================
NOTICE:  ✅ All 11 tables exist

============================================================
TEST 2: CHECKING INDEX EXISTENCE
============================================================
NOTICE:  ✅ Found 25 custom indexes
NOTICE:  ✅ Critical index: idx_leads_status_score exists
NOTICE:  ✅ Full-text search index exists

============================================================
TEST 3: CHECKING TRIGGER FUNCTIONS
============================================================
NOTICE:  ✅ Function: update_updated_at_column exists
NOTICE:  ✅ Function: recalculate_lead_score exists
NOTICE:  ✅ Function: update_campaign_stats_on_send exists
NOTICE:  ✅ Function: notify_interested_lead exists
NOTICE:  ✅ Function: update_client_ltv exists

============================================================
TEST 4: CHECKING TRIGGERS
============================================================
NOTICE:  ✅ Found 15 triggers
NOTICE:  ✅ Trigger: calculate_score_on_insert exists
NOTICE:  ✅ Trigger: calculate_score_on_update exists

============================================================
TEST 5: CHECKING ROW LEVEL SECURITY
============================================================
NOTICE:  ✅ RLS enabled on 11 tables
NOTICE:  ✅ Found 18 RLS policies
NOTICE:  ✅ Admin policies exist

============================================================
TEST 6: TESTING LEAD INSERTION & SCORE CALCULATION
============================================================
NOTICE:  ✅ Lead inserted with ID: [uuid]
NOTICE:  ✅ Auto-calculated score: 10 (expected: 10)
NOTICE:  ✅ Auto-calculated priority: urgent (expected: urgent)
NOTICE:  ✅ Lead scoring trigger working correctly
NOTICE:  ✅ Priority calculation working correctly
NOTICE:  ✅ After follower update: score = 8, priority = high
NOTICE:  ✅ Test lead cleaned up

============================================================
TEST 7: TESTING OUTREACH CAMPAIGNS
============================================================
NOTICE:  ✅ Campaign created with ID: [uuid]
NOTICE:  ✅ Message sent with ID: [uuid]
NOTICE:  ✅ Campaign stats trigger working correctly
NOTICE:  ✅ Response recorded successfully
NOTICE:  ✅ Test data cleaned up

============================================================
TEST 8: TESTING CLIENT & PROJECT RELATIONSHIPS
============================================================
NOTICE:  ✅ Test user created
NOTICE:  ✅ Client created with ID: [uuid]
NOTICE:  ✅ Project created with ID: [uuid]
NOTICE:  ✅ Client LTV trigger working correctly: $2500.00
NOTICE:  ✅ Project count updated correctly
NOTICE:  ✅ LTV accumulated correctly: $4000.00
NOTICE:  ✅ Test data cleaned up

============================================================
TEST 9: TESTING CONSTRAINTS & VALIDATION
============================================================
NOTICE:  ✅ Lead score constraint working correctly
NOTICE:  ✅ Status constraint working correctly
NOTICE:  ✅ Unique username constraint working correctly

============================================================
TEST 10: TESTING VIEWS
============================================================
NOTICE:  ✅ All views exist
NOTICE:  ✅ lead_pipeline view is queryable
NOTICE:  ✅ campaign_performance view is queryable
NOTICE:  ✅ project_dashboard view is queryable

============================================================
TEST 11: PERFORMANCE CHECK
============================================================
NOTICE:  ✅ Lead query executed in 00:00:00.025
NOTICE:  ✅ Excellent performance (< 100ms)

============================================================
TEST SUITE COMPLETED SUCCESSFULLY
============================================================

All tests passed! ✅

Schema is ready for production deployment.

Next steps:
1. Deploy schema to production database
2. Set up Supabase Edge Functions
3. Configure Row Level Security policies
4. Start building frontend application

ROLLBACK
```

---

## Troubleshooting

### Issue: "relation does not exist"

**Cause:** Schema not applied before running tests

**Solution:**
```bash
# Apply schema first
psql -h localhost -U postgres -d aeotest -f DATABASE_SCHEMA.sql

# Then run tests
psql -h localhost -U postgres -d aeotest -f DATABASE_SCHEMA_TEST.sql
```

### Issue: "function does not exist"

**Cause:** Extensions not enabled

**Solution:**
```sql
-- Run these first
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
```

### Issue: Tests fail with constraint violations

**Cause:** Old test data still in database

**Solution:**
```sql
-- Clean up test data
DELETE FROM instagram_leads WHERE instagram_username LIKE 'test_%';
DELETE FROM outreach_campaigns WHERE name = 'Test Campaign';
```

### Issue: RLS policies not found

**Cause:** RLS policies not created

**Solution:**
Ensure you ran the complete `DATABASE_SCHEMA.sql` file, not just portions.

---

## Manual Testing

After automated tests pass, perform manual testing:

### 1. Test Lead Creation

```sql
-- Insert a lead
INSERT INTO instagram_leads (
  instagram_username,
  follower_count,
  engagement_rate,
  has_website,
  bio,
  location
) VALUES (
  'manual_test_user',
  35000,
  6.2,
  false,
  'Content creator and entrepreneur',
  'Los Angeles, CA'
) RETURNING *;

-- Check calculated fields
SELECT
  instagram_username,
  follower_count,
  lead_score,
  priority,
  created_at
FROM instagram_leads
WHERE instagram_username = 'manual_test_user';

-- Expected:
-- lead_score: 10 (4 + 3 + 3)
-- priority: 'urgent'
```

### 2. Test Lead Update

```sql
-- Update follower count
UPDATE instagram_leads
SET follower_count = 250000
WHERE instagram_username = 'manual_test_user'
RETURNING lead_score, priority;

-- Expected:
-- lead_score: 8 (2 + 3 + 3)
-- priority: 'high'
```

### 3. Test Campaign Stats

```sql
-- Create campaign
INSERT INTO outreach_campaigns (
  name,
  message_template,
  is_active
) VALUES (
  'Manual Test Campaign',
  'Hello {name}!',
  true
) RETURNING id;

-- Send message (use campaign ID from above)
INSERT INTO outreach_messages (
  lead_id,
  campaign_id,
  message_text,
  sent_at,
  delivered
) VALUES (
  (SELECT id FROM instagram_leads WHERE instagram_username = 'manual_test_user'),
  '[CAMPAIGN_ID]',
  'Test message',
  NOW(),
  true
);

-- Check campaign stats updated
SELECT total_sent, messages_sent
FROM outreach_campaigns
WHERE name = 'Manual Test Campaign';

-- Expected: total_sent = 1, messages_sent = 1
```

### 4. Test RLS Policies

```sql
-- As anon user (should see nothing)
SET ROLE anon;
SELECT count(*) FROM instagram_leads;
-- Expected: 0

-- As admin (should see all)
SET ROLE authenticated;
SET request.jwt.claims.sub TO '[ADMIN_USER_ID]';
SELECT count(*) FROM instagram_leads;
-- Expected: > 0

RESET ROLE;
```

---

## Performance Benchmarks

Expected performance benchmarks:

| Query Type | Target Time | Notes |
|-----------|-------------|-------|
| Lead list (20 items) | < 50ms | With proper indexes |
| Lead search (fulltext) | < 100ms | Using GIN index |
| Campaign stats | < 30ms | Simple aggregation |
| Project dashboard | < 150ms | Complex joins |
| Analytics queries | < 500ms | May require optimization |

---

## Cleanup

After testing, clean up test data:

```sql
-- Remove test leads
DELETE FROM instagram_leads
WHERE instagram_username LIKE 'test_%'
   OR instagram_username LIKE 'manual_%';

-- Remove test campaigns
DELETE FROM outreach_campaigns
WHERE name LIKE '%Test%';

-- Remove test users
DELETE FROM users
WHERE email LIKE 'test_%';

-- Verify cleanup
SELECT COUNT(*) FROM instagram_leads;
SELECT COUNT(*) FROM outreach_campaigns;
SELECT COUNT(*) FROM users;
```

---

## CI/CD Integration

To integrate tests into your CI/CD pipeline:

```yaml
# .github/workflows/test-database.yml
name: Database Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest

    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: testpassword
          POSTGRES_DB: aeotest
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432

    steps:
      - uses: actions/checkout@v3

      - name: Apply schema
        run: |
          psql -h localhost -U postgres -d aeotest \
            -f AEOLOVABLE/DATABASE_SCHEMA.sql

      - name: Run tests
        run: |
          psql -h localhost -U postgres -d aeotest \
            -f AEOLOVABLE/DATABASE_SCHEMA_TEST.sql
```

---

## Support

If tests fail or you encounter issues:

1. Check the error message carefully
2. Review the TROUBLESHOOTING.md guide
3. Ensure all prerequisites are met
4. Verify PostgreSQL version (15+)
5. Check that extensions are enabled

---

**Last Updated:** 2025-11-21
**Test Suite Version:** 1.0
