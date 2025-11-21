# 🚀 Quick Start: Test Your Database Schema

## ⚡ 3 Ways to Test in 5 Minutes

The interactive script requires a terminal, but here are the best ways to test your schema:

---

## Method 1: Supabase Dashboard (Easiest) ⭐

**Perfect for: First-time testing, visual feedback**

### Steps:

1. **Go to your Supabase project**
   - Visit [app.supabase.com](https://app.supabase.com)
   - Select your project

2. **Open SQL Editor**
   - Click "SQL Editor" in the sidebar
   - Click "New Query"

3. **Apply Schema (if not done)**
   - Copy entire contents of `DATABASE_SCHEMA.sql`
   - Paste into editor
   - Click **"Run"** (or Ctrl/Cmd + Enter)
   - Wait ~10 seconds

4. **Run Tests**
   - Create **another new query**
   - Copy entire contents of `DATABASE_SCHEMA_TEST.sql`
   - Paste into editor
   - Click **"Run"**
   - See results in **"Results"** panel

5. **Review Output**
   - Look for ✅ (tests passed)
   - Look for ⚠️ (warnings - usually OK)
   - Look for ❌ (failures - need fixing)

**Expected Time:** 2-3 minutes

---

## Method 2: Docker + psql (Isolated Testing) 🐳

**Perfect for: Testing without affecting anything**

### Steps:

```bash
# 1. Start PostgreSQL in Docker
docker run --name aeo-test-db \
  -e POSTGRES_PASSWORD=testpassword \
  -e POSTGRES_DB=aeotest \
  -p 5432:5432 \
  -d postgres:15

# 2. Wait for startup
sleep 5

# 3. Apply schema
psql -h localhost -U postgres -d aeotest -W \
  -f AEOLOVABLE/DATABASE_SCHEMA.sql
# Enter password: testpassword

# 4. Run tests
psql -h localhost -U postgres -d aeotest -W \
  -f AEOLOVABLE/DATABASE_SCHEMA_TEST.sql
# Enter password: testpassword

# 5. Cleanup (when done)
docker stop aeo-test-db
docker rm aeo-test-db
```

**Expected Time:** 3-4 minutes

**Note:** You'll see lots of `NOTICE:` messages - that's good! Look for ✅

---

## Method 3: Local PostgreSQL (If Already Installed) 💻

**Perfect for: Development environment testing**

### Prerequisites:
- PostgreSQL 15+ installed
- Database created

### Steps:

```bash
# 1. Create test database (if needed)
createdb aeotest

# 2. Apply schema
psql -d aeotest -f AEOLOVABLE/DATABASE_SCHEMA.sql

# 3. Run tests
psql -d aeotest -f AEOLOVABLE/DATABASE_SCHEMA_TEST.sql

# 4. Review output
# Look for "All tests passed! ✅" at the end
```

**Expected Time:** 2 minutes

---

## What Success Looks Like ✅

At the end of the test run, you should see:

```
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

**Key Indicators:**
- ✅ Multiple checkmarks throughout output
- "All tests passed! ✅" at the end
- "ROLLBACK" at the very end (this is good - means no test data left behind)

---

## What Failure Looks Like ❌

If tests fail, you'll see:

```
❌ Expected 11 tables, found 10
```

or

```
❌ Missing function: recalculate_lead_score
```

**What to do:**
1. Read the error message carefully
2. Check if schema was fully applied
3. See `TESTING_README.md` for troubleshooting
4. Fix the issue
5. Run tests again

---

## Common Issues & Quick Fixes

### Issue: "psql: command not found"

**Fix:**
```bash
# macOS
brew install postgresql

# Ubuntu/Debian
sudo apt install postgresql-client

# Windows
# Download from postgresql.org
```

### Issue: "connection refused"

**Fix:**
- Check if PostgreSQL is running
- Verify connection details (host, port, database, user)
- For Docker: wait a few more seconds, then retry

### Issue: "relation does not exist"

**Fix:**
- You didn't apply the schema first
- Run `DATABASE_SCHEMA.sql` before `DATABASE_SCHEMA_TEST.sql`

### Issue: "function does not exist"

**Fix:**
```sql
-- Enable required extensions first
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
```

---

## Understanding the Test Output

### Test 1-5: Structure Tests
These validate that tables, indexes, functions, triggers, and RLS are all set up correctly.

**Look for:**
- `✅ All 11 tables exist`
- `✅ Found 25 custom indexes`
- `✅ Function: recalculate_lead_score exists`

### Test 6-8: Logic Tests
These test that automatic calculations work (lead scoring, campaign stats, client LTV).

**Look for:**
- `✅ Auto-calculated score: 10 (expected: 10)`
- `✅ Campaign stats trigger working correctly`
- `✅ Client LTV trigger working correctly: $2500.00`

### Test 9-10: Data Tests
These validate constraints and views.

**Look for:**
- `✅ Lead score constraint working correctly`
- `✅ All views exist`

### Test 11: Performance
This measures query speed.

**Look for:**
- `✅ Excellent performance (< 100ms)`

---

## After Tests Pass

### 1. Celebrate! 🎉
Your schema is production-ready!

### 2. Deploy to Staging
```bash
# Supabase CLI
supabase db push --db-url postgresql://staging...

# Or use Supabase Dashboard → Database → Migrations
```

### 3. Run Tests on Staging
Repeat the test process on staging environment

### 4. Deploy to Production
```bash
supabase db push --db-url postgresql://production...
```

### 5. Monitor Production
- Set up alerts
- Monitor query performance
- Check error logs

---

## Additional Resources

| File | Purpose |
|------|---------|
| **TESTING_README.md** | Detailed testing documentation |
| **TEST_DEMO_OUTPUT.md** | Complete example of test output |
| **TROUBLESHOOTING.md** | Fix common issues |
| **DATABASE_SCHEMA.sql** | The schema being tested |
| **DATABASE_SCHEMA_TEST.sql** | The test suite |

---

## Need Help?

1. **Read the error message** - It usually tells you what's wrong
2. **Check TESTING_README.md** - Comprehensive troubleshooting
3. **Review TEST_DEMO_OUTPUT.md** - See what success looks like
4. **Verify prerequisites** - PostgreSQL 15+, extensions enabled

---

## Test Summary

**What gets tested:**
- ✅ 11 tables
- ✅ 25+ indexes
- ✅ 5 trigger functions
- ✅ 15+ triggers
- ✅ 18+ RLS policies
- ✅ Data constraints
- ✅ Views
- ✅ Performance

**Test duration:** 2-3 seconds

**Test safety:** All tests ROLLBACK (no permanent changes)

**When to run:**
- Before deploying to staging
- Before deploying to production
- After schema changes
- In CI/CD pipeline

---

## Pro Tips

💡 **Run tests often** - They're fast and catch issues early

💡 **Use Docker method** - Isolated, repeatable, safe

💡 **Check Supabase logs** - See queries in real-time

💡 **Save test output** - Compare results over time

💡 **Automate in CI/CD** - Run on every commit

---

**Ready to test?** Choose your method above and run the tests! 🚀

---

**Last Updated:** 2025-11-21
