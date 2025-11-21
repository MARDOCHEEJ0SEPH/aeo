# Testing & Deployment Guide

## 📘 Complete Testing & Production Deployment

**Version:** 1.0
**Last Updated:** 2025-11-21
**Part:** 5 of Implementation Module

---

## Table of Contents

1. [Testing Strategy](#1-testing-strategy)
2. [Unit Testing](#2-unit-testing)
3. [Integration Testing](#3-integration-testing)
4. [End-to-End Testing](#4-end-to-end-testing)
5. [Performance Testing](#5-performance-testing)
6. [Security Testing](#6-security-testing)
7. [Deployment Preparation](#7-deployment-preparation)
8. [Production Deployment](#8-production-deployment)
9. [Monitoring & Maintenance](#9-monitoring--maintenance)
10. [Rollback Procedures](#10-rollback-procedures)

---

## 1. Testing Strategy

### 1.1 Testing Pyramid

```
       /\
      /E2E\       10% - End-to-End Tests
     /------\
    /Integration\ 30% - Integration Tests
   /------------\
  /   Unit Tests  \ 60% - Unit Tests
 /------------------\
```

### 1.2 Test Coverage Goals

| Component | Target Coverage | Priority |
|-----------|----------------|----------|
| Database Functions | 90% | High |
| API Routes | 85% | High |
| Business Logic | 80% | High |
| UI Components | 70% | Medium |
| Edge Functions | 85% | High |
| n8n Workflows | Manual | High |

### 1.3 Testing Tools

```bash
# Install testing dependencies
npm install --save-dev \
  @testing-library/react \
  @testing-library/jest-dom \
  @testing-library/user-event \
  @playwright/test \
  vitest \
  @vitest/ui \
  msw \
  @faker-js/faker
```

---

## 2. Unit Testing

### 2.1 Setup Vitest

```javascript
// vitest.config.ts
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'src/test/',
        '**/*.d.ts',
        '**/*.config.*',
        '**/mockData/*',
      ],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
```

### 2.2 Test Setup File

```typescript
// src/test/setup.ts
import '@testing-library/jest-dom'
import { cleanup } from '@testing-library/react'
import { afterEach, vi } from 'vitest'

// Cleanup after each test
afterEach(() => {
  cleanup()
})

// Mock Supabase client
vi.mock('@/lib/supabase/client', () => ({
  supabase: {
    from: vi.fn(),
    auth: {
      getSession: vi.fn(),
      onAuthStateChange: vi.fn(() => ({
        data: { subscription: { unsubscribe: vi.fn() } },
      })),
    },
  },
}))

// Mock Next.js router
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    refresh: vi.fn(),
  }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
}))
```

### 2.3 Component Tests

```typescript
// src/components/shared/__tests__/Button.test.tsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { Button } from '@/components/ui/button'

describe('Button Component', () => {
  it('renders button with text', () => {
    render(<Button>Click me</Button>)
    expect(screen.getByText('Click me')).toBeInTheDocument()
  })

  it('calls onClick handler when clicked', () => {
    const handleClick = vi.fn()
    render(<Button onClick={handleClick}>Click me</Button>)

    fireEvent.click(screen.getByText('Click me'))
    expect(handleClick).toHaveBeenCalledTimes(1)
  })

  it('is disabled when disabled prop is true', () => {
    render(<Button disabled>Click me</Button>)
    expect(screen.getByText('Click me')).toBeDisabled()
  })

  it('shows loading state', () => {
    render(<Button isLoading>Click me</Button>)
    expect(screen.getByRole('button')).toHaveAttribute('disabled')
    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument()
  })
})
```

### 2.4 Hook Tests

```typescript
// src/hooks/__tests__/useAuth.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase/client'

vi.mock('@/lib/supabase/client')

describe('useAuth Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns user when authenticated', async () => {
    const mockUser = {
      id: '123',
      email: 'test@example.com',
    }

    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: {
        session: {
          user: mockUser,
          access_token: 'token',
        },
      },
      error: null,
    })

    const { result } = renderHook(() => useAuth())

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.user).toEqual(mockUser)
  })

  it('signIn calls supabase auth', async () => {
    const { result } = renderHook(() => useAuth())

    await result.current.signIn('test@example.com', 'password')

    expect(supabase.auth.signInWithPassword).toHaveBeenCalledWith({
      email: 'test@example.com',
      password: 'password',
    })
  })
})
```

### 2.5 Utility Function Tests

```typescript
// src/lib/__tests__/utils.test.ts
import { describe, it, expect } from 'vitest'
import { cn, formatCurrency, calculateEngagementRate } from '@/lib/utils'

describe('Utility Functions', () => {
  describe('cn', () => {
    it('merges class names correctly', () => {
      const result = cn('text-red-500', 'bg-blue-500', 'text-green-500')
      expect(result).toBe('bg-blue-500 text-green-500')
    })
  })

  describe('formatCurrency', () => {
    it('formats USD correctly', () => {
      expect(formatCurrency(1234.56)).toBe('$1,234.56')
    })

    it('handles zero', () => {
      expect(formatCurrency(0)).toBe('$0.00')
    })
  })

  describe('calculateEngagementRate', () => {
    it('calculates rate correctly', () => {
      const rate = calculateEngagementRate({
        likes: 100,
        comments: 20,
        followers: 1000,
      })
      expect(rate).toBe(12) // (100 + 20) / 1000 * 100
    })

    it('returns 0 for zero followers', () => {
      const rate = calculateEngagementRate({
        likes: 100,
        comments: 20,
        followers: 0,
      })
      expect(rate).toBe(0)
    })
  })
})
```

### 2.6 Run Unit Tests

```bash
# Run all tests
npm run test

# Run with coverage
npm run test:coverage

# Run in watch mode
npm run test:watch

# Run specific test file
npm run test Button.test.tsx
```

---

## 3. Integration Testing

### 3.1 API Route Testing

```typescript
// src/app/api/leads/__tests__/route.test.ts
import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { createMocks } from 'node-mocks-http'
import { GET, POST } from '../route'
import { createClient } from '@supabase/supabase-js'

describe('/api/leads', () => {
  let supabase: any

  beforeAll(() => {
    supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
  })

  describe('GET /api/leads', () => {
    it('returns leads with correct structure', async () => {
      const { req } = createMocks({
        method: 'GET',
        query: { status: 'discovered' },
      })

      const response = await GET(req as any)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toHaveProperty('leads')
      expect(Array.isArray(data.leads)).toBe(true)
    })

    it('filters leads by status', async () => {
      const { req } = createMocks({
        method: 'GET',
        query: { status: 'contacted' },
      })

      const response = await GET(req as any)
      const data = await response.json()

      expect(data.leads.every((l: any) => l.status === 'contacted')).toBe(true)
    })

    it('requires authentication', async () => {
      const { req } = createMocks({
        method: 'GET',
        headers: {},
      })

      const response = await GET(req as any)

      expect(response.status).toBe(401)
    })
  })

  describe('POST /api/leads', () => {
    it('creates a new lead', async () => {
      const { req } = createMocks({
        method: 'POST',
        body: {
          instagram_username: 'test_user_' + Date.now(),
          follower_count: 25000,
          engagement_rate: 5.5,
        },
      })

      const response = await POST(req as any)
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data).toHaveProperty('id')

      // Cleanup
      await supabase.from('instagram_leads').delete().eq('id', data.id)
    })

    it('validates required fields', async () => {
      const { req } = createMocks({
        method: 'POST',
        body: {
          instagram_username: 'test_user',
          // missing follower_count
        },
      })

      const response = await POST(req as any)

      expect(response.status).toBe(400)
    })
  })
})
```

### 3.2 Database Integration Tests

```typescript
// src/lib/__tests__/database.integration.test.ts
import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { createClient } from '@supabase/supabase-js'
import { faker } from '@faker-js/faker'

describe('Database Integration', () => {
  let supabase: any
  let testLeadId: string

  beforeAll(() => {
    supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
  })

  describe('Instagram Leads', () => {
    it('creates a lead with auto-calculated score', async () => {
      const { data, error } = await supabase
        .from('instagram_leads')
        .insert({
          instagram_username: faker.internet.userName(),
          follower_count: 25000,
          engagement_rate: 5.5,
          has_website: false,
        })
        .select()
        .single()

      expect(error).toBeNull()
      expect(data.lead_score).toBeGreaterThan(0)
      expect(data.priority).toBeDefined()

      testLeadId = data.id
    })

    it('updates score when follower count changes', async () => {
      const { data: original } = await supabase
        .from('instagram_leads')
        .select('lead_score')
        .eq('id', testLeadId)
        .single()

      await supabase
        .from('instagram_leads')
        .update({ follower_count: 200000 })
        .eq('id', testLeadId)

      const { data: updated } = await supabase
        .from('instagram_leads')
        .select('lead_score')
        .eq('id', testLeadId)
        .single()

      expect(updated.lead_score).not.toBe(original.lead_score)
    })
  })

  describe('Row Level Security', () => {
    it('prevents unauthorized access to leads', async () => {
      const anonSupabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      )

      const { data, error } = await anonSupabase
        .from('instagram_leads')
        .select('*')

      expect(data).toHaveLength(0) // No access without auth
    })
  })

  afterAll(async () => {
    // Cleanup test data
    if (testLeadId) {
      await supabase.from('instagram_leads').delete().eq('id', testLeadId)
    }
  })
})
```

### 3.3 Edge Function Testing

```bash
# Test edge functions locally
cd backend/supabase

# Serve function
supabase functions serve analyze-lead

# In another terminal, test with curl
curl -i --location --request POST 'http://localhost:54321/functions/v1/analyze-lead' \
  --header 'Authorization: Bearer YOUR_ANON_KEY' \
  --header 'Content-Type: application/json' \
  --data '{
    "username": "test_user",
    "profile_data": {
      "id": "123",
      "username": "test_user",
      "full_name": "Test User",
      "follower_count": 25000,
      "following_count": 1500,
      "post_count": 342,
      "bio": "Fitness enthusiast",
      "engagement_rate": 5.5
    }
  }'

# Expected response:
# {
#   "success": true,
#   "data": {
#     "lead_id": "uuid-here",
#     "analysis": {
#       "niche": "fitness",
#       "lead_score": 10,
#       "priority": "urgent",
#       "has_website": false,
#       "engagement_rate": 5.5
#     }
#   }
# }
```

---

## 4. End-to-End Testing

### 4.1 Setup Playwright

```bash
# Install Playwright
npm init playwright@latest

# Install browsers
npx playwright install
```

### 4.2 Playwright Configuration

```typescript
// playwright.config.ts
import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',

  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
  ],

  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
})
```

### 4.3 E2E Test Examples

```typescript
// e2e/auth.spec.ts
import { test, expect } from '@playwright/test'

test.describe('Authentication Flow', () => {
  test('user can sign up', async ({ page }) => {
    await page.goto('/signup')

    await page.fill('[name="fullName"]', 'Test User')
    await page.fill('[name="email"]', `test${Date.now()}@example.com`)
    await page.fill('[name="password"]', 'SecurePassword123')
    await page.fill('[name="confirmPassword"]', 'SecurePassword123')

    await page.click('button[type="submit"]')

    // Should see success message
    await expect(page.locator('text=Account Created')).toBeVisible()
  })

  test('user can login', async ({ page }) => {
    await page.goto('/login')

    await page.fill('[name="email"]', 'admin@test.com')
    await page.fill('[name="password"]', 'password')

    await page.click('button[type="submit"]')

    // Should redirect to dashboard
    await expect(page).toHaveURL(/\/admin/)
  })

  test('shows error for invalid credentials', async ({ page }) => {
    await page.goto('/login')

    await page.fill('[name="email"]', 'wrong@example.com')
    await page.fill('[name="password"]', 'wrongpassword')

    await page.click('button[type="submit"]')

    // Should show error message
    await expect(page.locator('text=Failed to sign in')).toBeVisible()
  })
})
```

```typescript
// e2e/admin-dashboard.spec.ts
import { test, expect } from '@playwright/test'

test.describe('Admin Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    // Login as admin
    await page.goto('/login')
    await page.fill('[name="email"]', 'admin@test.com')
    await page.fill('[name="password"]', 'password')
    await page.click('button[type="submit"]')
    await page.waitForURL(/\/admin/)
  })

  test('displays leads table', async ({ page }) => {
    await page.goto('/admin/leads')

    // Should see leads table
    await expect(page.locator('[data-testid="leads-table"]')).toBeVisible()

    // Should have at least one lead
    const rows = page.locator('[data-testid="lead-row"]')
    await expect(rows).toHaveCountGreaterThan(0)
  })

  test('can filter leads by status', async ({ page }) => {
    await page.goto('/admin/leads')

    // Apply filter
    await page.selectOption('[name="status"]', 'discovered')

    // Wait for table to update
    await page.waitForTimeout(500)

    // All leads should have discovered status
    const statusBadges = page.locator('[data-testid="lead-status"]')
    const count = await statusBadges.count()

    for (let i = 0; i < count; i++) {
      const text = await statusBadges.nth(i).textContent()
      expect(text).toBe('discovered')
    }
  })

  test('can view lead details', async ({ page }) => {
    await page.goto('/admin/leads')

    // Click first lead
    await page.click('[data-testid="lead-row"]:first-child')

    // Should see lead details modal
    await expect(page.locator('[data-testid="lead-details"]')).toBeVisible()
  })

  test('can create new campaign', async ({ page }) => {
    await page.goto('/admin/campaigns')

    await page.click('button:has-text("New Campaign")')

    // Fill campaign form
    await page.fill('[name="name"]', 'Test Campaign')
    await page.fill('[name="messageTemplate"]', 'Hello {name}, ...')

    await page.click('button[type="submit"]')

    // Should see success message
    await expect(page.locator('text=Campaign created')).toBeVisible()
  })
})
```

### 4.4 Run E2E Tests

```bash
# Run all tests
npx playwright test

# Run in headed mode (see browser)
npx playwright test --headed

# Run specific test
npx playwright test auth.spec.ts

# Debug mode
npx playwright test --debug

# View report
npx playwright show-report
```

---

## 5. Performance Testing

### 5.1 Lighthouse Audit

```bash
# Install Lighthouse CLI
npm install -g lighthouse

# Run audit
lighthouse http://localhost:3000 \
  --output html \
  --output-path ./lighthouse-report.html \
  --view

# Target scores:
# - Performance: 90+
# - Accessibility: 95+
# - Best Practices: 90+
# - SEO: 95+
```

### 5.2 Load Testing with k6

```bash
# Install k6
brew install k6  # macOS
# or download from k6.io

# Create load test script
cat > load-test.js << 'EOF'
import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '1m', target: 10 },  // Ramp up to 10 users
    { duration: '3m', target: 10 },  // Stay at 10 users
    { duration: '1m', target: 50 },  // Ramp up to 50 users
    { duration: '3m', target: 50 },  // Stay at 50 users
    { duration: '1m', target: 0 },   // Ramp down
  ],
};

export default function () {
  // Test homepage
  const res = http.get('http://localhost:3000');
  check(res, {
    'status is 200': (r) => r.status === 200,
    'response time < 500ms': (r) => r.timings.duration < 500,
  });

  sleep(1);
}
EOF

# Run load test
k6 run load-test.js
```

### 5.3 Database Performance

```sql
-- Analyze query performance
EXPLAIN ANALYZE
SELECT * FROM instagram_leads
WHERE status = 'discovered'
  AND lead_score >= 7
ORDER BY lead_score DESC
LIMIT 20;

-- Check index usage
SELECT schemaname, tablename, indexname, idx_scan
FROM pg_stat_user_indexes
WHERE idx_scan = 0
  AND schemaname = 'public';

-- Find slow queries
SELECT query, mean_exec_time, calls
FROM pg_stat_statements
ORDER BY mean_exec_time DESC
LIMIT 10;
```

---

## 6. Security Testing

### 6.1 SQL Injection Testing

```typescript
// Test parameterized queries prevent SQL injection
test('prevents SQL injection', async () => {
  const maliciousInput = "'; DROP TABLE instagram_leads; --"

  const { error } = await supabase
    .from('instagram_leads')
    .select('*')
    .eq('instagram_username', maliciousInput)

  // Should not execute malicious SQL
  expect(error).toBeNull()

  // Table should still exist
  const { data } = await supabase
    .from('instagram_leads')
    .select('count')

  expect(data).toBeDefined()
})
```

### 6.2 XSS Protection Testing

```typescript
// Test XSS prevention
test('escapes user input to prevent XSS', () => {
  const maliciousInput = '<script>alert("XSS")</script>'

  render(<LeadCard bio={maliciousInput} />)

  // Should render as text, not execute script
  expect(screen.getByText(maliciousInput)).toBeInTheDocument()
  expect(document.querySelectorAll('script')).toHaveLength(0)
})
```

### 6.3 Authentication Testing

```typescript
// Test authentication enforcement
test('requires authentication for protected routes', async () => {
  const response = await fetch('http://localhost:3000/admin/leads')

  // Should redirect to login
  expect(response.status).toBe(302)
  expect(response.headers.get('location')).toContain('/login')
})

// Test authorization
test('enforces role-based access', async ({ page }) => {
  // Login as client
  await loginAsClient(page)

  // Try to access admin route
  await page.goto('/admin/leads')

  // Should be denied
  expect(page.url()).not.toContain('/admin')
})
```

### 6.4 Security Audit

```bash
# Run npm audit
npm audit

# Fix vulnerabilities
npm audit fix

# Check for known vulnerabilities
npm install -g snyk
snyk test

# Scan for secrets in code
npm install -g trufflehog
trufflehog git file://. --since_commit HEAD~10
```

---

## 7. Deployment Preparation

### 7.1 Environment Variables Checklist

```bash
# Create production .env
cat > .env.production << 'EOF'
# Supabase (Production)
NEXT_PUBLIC_SUPABASE_URL=https://your-prod-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-prod-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-prod-service-key

# Instagram (Production)
INSTAGRAM_ACCESS_TOKEN=your-prod-instagram-token
INSTAGRAM_BUSINESS_ACCOUNT_ID=your-prod-account-id

# OpenAI (Production)
OPENAI_API_KEY=your-prod-openai-key

# n8n (Production)
N8N_WEBHOOK_URL=https://n8n.yourdomain.com

# App URLs
NEXT_PUBLIC_APP_URL=https://yourdomain.com

# Feature Flags
NEXT_PUBLIC_ENABLE_ANALYTICS=true

# Email (Production)
RESEND_API_KEY=your-prod-resend-key
FROM_EMAIL=no-reply@yourdomain.com
EOF
```

### 7.2 Pre-Deployment Checklist

**Database:**
- [ ] All migrations applied to production
- [ ] RLS policies tested
- [ ] Indexes created and verified
- [ ] Backup strategy in place
- [ ] Connection pooling configured

**Frontend:**
- [ ] All tests passing
- [ ] Build succeeds without errors
- [ ] Environment variables set
- [ ] Error tracking configured (Sentry)
- [ ] Analytics configured (Google Analytics)

**Backend:**
- [ ] Edge Functions deployed
- [ ] API rate limiting configured
- [ ] Secrets properly secured
- [ ] Monitoring alerts set up

**Automation:**
- [ ] n8n workflows imported
- [ ] Credentials configured
- [ ] Test runs completed
- [ ] Rate limits appropriate

**Security:**
- [ ] SSL certificates valid
- [ ] CORS configured correctly
- [ ] API keys rotated
- [ ] Security headers set

**Documentation:**
- [ ] README updated
- [ ] API documentation complete
- [ ] Deployment runbook created
- [ ] Rollback procedures documented

---

*[Continue with sections 8-10...]*

---

**Progress Tracker:**

- [x] Testing Strategy
- [x] Unit Testing
- [x] Integration Testing
- [x] End-to-End Testing
- [x] Performance Testing
- [x] Security Testing
- [x] Deployment Preparation
- [ ] Production Deployment
- [ ] Monitoring & Maintenance
- [ ] Rollback Procedures

**Estimated Completion:** 75/100 pages

---

**Navigation:**

- **Previous:** [Part 4: n8n Automation Setup ←](./AUTOMATION_SETUP.md)
- **Next:** [Part 6: Troubleshooting & Optimization →](./TROUBLESHOOTING.md)

---

**Document Version:** 1.0
**Last Updated:** 2025-11-21
