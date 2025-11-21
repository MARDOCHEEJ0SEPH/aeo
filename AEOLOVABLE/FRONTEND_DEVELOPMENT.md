# Frontend Development Guide - Lovable Platform

## 📘 Complete Frontend Implementation

**Version:** 1.0
**Last Updated:** 2025-11-21
**Part:** 3 of Implementation Module

---

## Table of Contents

1. [Lovable Platform Setup](#1-lovable-platform-setup)
2. [Project Structure & Configuration](#2-project-structure--configuration)
3. [Supabase Client Integration](#3-supabase-client-integration)
4. [Authentication System](#4-authentication-system)
5. [Component Library with shadcn/ui](#5-component-library-with-shadcnui)
6. [Marketing Website Pages](#6-marketing-website-pages)
7. [Admin Dashboard](#7-admin-dashboard)
8. [Client Portal](#8-client-portal)
9. [State Management](#9-state-management)
10. [Forms & Validation](#10-forms--validation)
11. [Real-time Features](#11-real-time-features)
12. [Responsive Design & Mobile](#12-responsive-design--mobile)

---

## 1. Lovable Platform Setup

### 1.1 Create Lovable Account & Project

**Step 1: Sign Up**
1. Go to [lovable.dev](https://lovable.dev)
2. Click "Get Started"
3. Sign in with GitHub
4. Complete onboarding

**Step 2: Create New Project**
1. Click "New Project"
2. Project details:
   - **Name:** AEO Agency Platform
   - **Template:** Next.js App Router + TypeScript
   - **Styling:** Tailwind CSS
3. Click "Create Project"

**Step 3: Connect GitHub Repository**
1. Click "Settings" → "GitHub Integration"
2. Connect to your GitHub account
3. Select repository: `aeolovable-project`
4. Enable auto-deploy on push

### 1.2 Local Development Setup

Lovable provides a local development option:

```bash
# Clone your Lovable project
git clone https://github.com/yourusername/aeolovable-project.git
cd aeolovable-project/frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

Visit `http://localhost:3000` to see your app.

### 1.3 Install Required Packages

```bash
# Core dependencies
npm install @supabase/supabase-js
npm install @supabase/auth-helpers-nextjs
npm install @supabase/auth-ui-react
npm install @supabase/auth-ui-shared

# UI Components
npm install @radix-ui/react-dialog
npm install @radix-ui/react-dropdown-menu
npm install @radix-ui/react-select
npm install @radix-ui/react-tabs
npm install @radix-ui/react-toast
npm install @radix-ui/react-avatar
npm install @radix-ui/react-popover
npm install lucide-react

# Forms & Validation
npm install react-hook-form
npm install zod
npm install @hookform/resolvers

# State Management
npm install zustand

# Data Fetching
npm install @tanstack/react-query

# Utilities
npm install clsx tailwind-merge
npm install date-fns
npm install recharts # For charts/analytics

# Development
npm install --save-dev @types/node
npm install --save-dev typescript
npm install --save-dev eslint
npm install --save-dev prettier
```

### 1.4 Configure Environment Variables

Create `.env.local`:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_APP_NAME="AEO Agency"

# Features Flags (optional)
NEXT_PUBLIC_ENABLE_ANALYTICS=true
NEXT_PUBLIC_ENABLE_NOTIFICATIONS=true
```

---

## 2. Project Structure & Configuration

### 2.1 Complete Directory Structure

```
frontend/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── (auth)/            # Auth group
│   │   │   ├── login/
│   │   │   │   └── page.tsx
│   │   │   ├── signup/
│   │   │   │   └── page.tsx
│   │   │   └── forgot-password/
│   │   │       └── page.tsx
│   │   ├── (marketing)/       # Marketing group
│   │   │   ├── page.tsx       # Homepage
│   │   │   ├── services/
│   │   │   ├── portfolio/
│   │   │   ├── pricing/
│   │   │   └── contact/
│   │   ├── admin/             # Admin dashboard
│   │   │   ├── layout.tsx
│   │   │   ├── page.tsx
│   │   │   ├── leads/
│   │   │   ├── campaigns/
│   │   │   ├── clients/
│   │   │   ├── projects/
│   │   │   └── settings/
│   │   ├── client/            # Client portal
│   │   │   ├── layout.tsx
│   │   │   ├── page.tsx
│   │   │   └── project/
│   │   ├── api/               # API routes
│   │   │   ├── auth/
│   │   │   └── webhooks/
│   │   ├── layout.tsx         # Root layout
│   │   └── globals.css        # Global styles
│   ├── components/
│   │   ├── marketing/
│   │   │   ├── Hero.tsx
│   │   │   ├── Features.tsx
│   │   │   ├── Services.tsx
│   │   │   ├── Portfolio.tsx
│   │   │   ├── Pricing.tsx
│   │   │   ├── Testimonials.tsx
│   │   │   ├── CTA.tsx
│   │   │   └── ContactForm.tsx
│   │   ├── admin/
│   │   │   ├── Sidebar.tsx
│   │   │   ├── Header.tsx
│   │   │   ├── LeadsTable.tsx
│   │   │   ├── LeadCard.tsx
│   │   │   ├── CampaignForm.tsx
│   │   │   ├── Analytics.tsx
│   │   │   └── QuickActions.tsx
│   │   ├── client/
│   │   │   ├── ProjectOverview.tsx
│   │   │   ├── Timeline.tsx
│   │   │   ├── FileUploader.tsx
│   │   │   ├── MessageThread.tsx
│   │   │   └── InvoiceView.tsx
│   │   ├── shared/
│   │   │   ├── Navigation.tsx
│   │   │   ├── Footer.tsx
│   │   │   ├── Logo.tsx
│   │   │   ├── UserMenu.tsx
│   │   │   ├── NotificationBell.tsx
│   │   │   ├── SearchBar.tsx
│   │   │   ├── DataTable.tsx
│   │   │   ├── EmptyState.tsx
│   │   │   └── LoadingSpinner.tsx
│   │   └── ui/                # shadcn/ui components
│   │       ├── button.tsx
│   │       ├── card.tsx
│   │       ├── dialog.tsx
│   │       ├── input.tsx
│   │       ├── select.tsx
│   │       ├── table.tsx
│   │       ├── tabs.tsx
│   │       └── toast.tsx
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── client.ts      # Browser client
│   │   │   ├── server.ts      # Server client
│   │   │   └── middleware.ts  # Middleware client
│   │   ├── utils.ts
│   │   ├── validations.ts
│   │   └── constants.ts
│   ├── hooks/
│   │   ├── useAuth.ts
│   │   ├── useUser.ts
│   │   ├── useLeads.ts
│   │   ├── useProjects.ts
│   │   ├── useNotifications.ts
│   │   └── useRealtime.ts
│   ├── stores/
│   │   ├── authStore.ts
│   │   ├── leadsStore.ts
│   │   └── uiStore.ts
│   ├── types/
│   │   ├── database.types.ts  # Generated from Supabase
│   │   ├── leads.types.ts
│   │   ├── projects.types.ts
│   │   └── index.ts
│   └── styles/
│       └── globals.css
├── public/
│   ├── images/
│   ├── icons/
│   └── fonts/
├── .env.local
├── .env.example
├── next.config.js
├── tailwind.config.js
├── tsconfig.json
├── package.json
└── README.md
```

### 2.2 TypeScript Configuration

```json
// tsconfig.json
{
  "compilerOptions": {
    "target": "ES2020",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "forceConsistentCasingInFileNames": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [
      {
        "name": "next"
      }
    ],
    "paths": {
      "@/*": ["./src/*"],
      "@/components/*": ["./src/components/*"],
      "@/lib/*": ["./src/lib/*"],
      "@/hooks/*": ["./src/hooks/*"],
      "@/types/*": ["./src/types/*"],
      "@/stores/*": ["./src/stores/*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

### 2.3 Tailwind Configuration

```javascript
// tailwind.config.js
/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: 0 },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: 0 },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}
```

### 2.4 Global Styles

```css
/* src/app/globals.css */
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 222.2 84% 4.9%;
    --card: 0 0% 100%;
    --card-foreground: 222.2 84% 4.9%;
    --popover: 0 0% 100%;
    --popover-foreground: 222.2 84% 4.9%;
    --primary: 221.2 83.2% 53.3%;
    --primary-foreground: 210 40% 98%;
    --secondary: 210 40% 96.1%;
    --secondary-foreground: 222.2 47.4% 11.2%;
    --muted: 210 40% 96.1%;
    --muted-foreground: 215.4 16.3% 46.9%;
    --accent: 210 40% 96.1%;
    --accent-foreground: 222.2 47.4% 11.2%;
    --destructive: 0 84.2% 60.2%;
    --destructive-foreground: 210 40% 98%;
    --border: 214.3 31.8% 91.4%;
    --input: 214.3 31.8% 91.4%;
    --ring: 221.2 83.2% 53.3%;
    --radius: 0.5rem;
  }

  .dark {
    --background: 222.2 84% 4.9%;
    --foreground: 210 40% 98%;
    --card: 222.2 84% 4.9%;
    --card-foreground: 210 40% 98%;
    --popover: 222.2 84% 4.9%;
    --popover-foreground: 210 40% 98%;
    --primary: 217.2 91.2% 59.8%;
    --primary-foreground: 222.2 47.4% 11.2%;
    --secondary: 217.2 32.6% 17.5%;
    --secondary-foreground: 210 40% 98%;
    --muted: 217.2 32.6% 17.5%;
    --muted-foreground: 215 20.2% 65.1%;
    --accent: 217.2 32.6% 17.5%;
    --accent-foreground: 210 40% 98%;
    --destructive: 0 62.8% 30.6%;
    --destructive-foreground: 210 40% 98%;
    --border: 217.2 32.6% 17.5%;
    --input: 217.2 32.6% 17.5%;
    --ring: 224.3 76.3% 48%;
  }
}

@layer base {
  * {
    @apply border-border;
  }
  body {
    @apply bg-background text-foreground;
  }
}

/* Custom utilities */
@layer utilities {
  .text-balance {
    text-wrap: balance;
  }
}
```

---

## 3. Supabase Client Integration

### 3.1 Client-Side Supabase Client

```typescript
// src/lib/supabase/client.ts
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import type { Database } from '@/types/database.types'

export const createClient = () => createClientComponentClient<Database>()

// Singleton instance for client components
export const supabase = createClient()
```

### 3.2 Server-Side Supabase Client

```typescript
// src/lib/supabase/server.ts
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import type { Database } from '@/types/database.types'

export const createServerClient = () => {
  const cookieStore = cookies()
  return createServerComponentClient<Database>({ cookies: () => cookieStore })
}
```

### 3.3 Middleware Client

```typescript
// src/lib/supabase/middleware.ts
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import type { Database } from '@/types/database.types'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient<Database>({ req, res })

  const {
    data: { session },
  } = await supabase.auth.getSession()

  // Check auth for protected routes
  if (!session && req.nextUrl.pathname.startsWith('/admin')) {
    return NextResponse.redirect(new URL('/login', req.url))
  }

  if (!session && req.nextUrl.pathname.startsWith('/client')) {
    return NextResponse.redirect(new URL('/login', req.url))
  }

  // Redirect authenticated users away from auth pages
  if (session && (req.nextUrl.pathname === '/login' || req.nextUrl.pathname === '/signup')) {
    // Redirect based on role
    const { data: user } = await supabase
      .from('users')
      .select('role')
      .eq('id', session.user.id)
      .single()

    const redirectPath = user?.role === 'admin' || user?.role === 'team_member'
      ? '/admin'
      : '/client'

    return NextResponse.redirect(new URL(redirectPath, req.url))
  }

  return res
}

export const config = {
  matcher: ['/admin/:path*', '/client/:path*', '/login', '/signup'],
}
```

### 3.4 Utility Functions

```typescript
// src/lib/supabase/utils.ts
import { supabase } from './client'
import type { Database } from '@/types/database.types'

type Tables = Database['public']['Tables']
type Lead = Tables['instagram_leads']['Row']
type Project = Tables['projects']['Row']

// Fetch leads with filters
export async function fetchLeads(filters?: {
  status?: string[]
  niche?: string[]
  followerMin?: number
  followerMax?: number
  leadScoreMin?: number
}) {
  let query = supabase
    .from('instagram_leads')
    .select('*')
    .is('deleted_at', null)

  if (filters?.status) {
    query = query.in('status', filters.status)
  }

  if (filters?.niche) {
    query = query.in('niche', filters.niche)
  }

  if (filters?.followerMin) {
    query = query.gte('follower_count', filters.followerMin)
  }

  if (filters?.followerMax) {
    query = query.lte('follower_count', filters.followerMax)
  }

  if (filters?.leadScoreMin) {
    query = query.gte('lead_score', filters.leadScoreMin)
  }

  const { data, error } = await query.order('created_at', { ascending: false })

  if (error) throw error
  return data as Lead[]
}

// Update lead status
export async function updateLeadStatus(leadId: string, status: string) {
  const { data, error } = await supabase
    .from('instagram_leads')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', leadId)
    .select()
    .single()

  if (error) throw error
  return data
}

// Fetch projects for a client
export async function fetchClientProjects(clientId: string) {
  const { data, error } = await supabase
    .from('projects')
    .select(`
      *,
      client:clients(*)
    `)
    .eq('client_id', clientId)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data as (Project & { client: any })[]
}

// Track analytics event
export async function trackEvent(
  eventType: string,
  eventData: Record<string, any>,
  userId?: string
) {
  const { error } = await supabase.from('analytics_events').insert({
    event_type: eventType,
    event_category: eventData.category || 'general',
    event_data: eventData,
    user_id: userId,
  })

  if (error) console.error('Error tracking event:', error)
}
```

---

## 4. Authentication System

### 4.1 Auth Hook

```typescript
// src/hooks/useAuth.ts
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'

interface UserProfile {
  id: string
  email: string
  full_name: string | null
  role: 'admin' | 'client' | 'team_member'
  avatar_url: string | null
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      if (session?.user) {
        fetchProfile(session.user.id)
      } else {
        setLoading(false)
      }
    })

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      if (session?.user) {
        fetchProfile(session.user.id)
      } else {
        setProfile(null)
        setLoading(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  async function fetchProfile(userId: string) {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single()

      if (error) throw error
      setProfile(data)
    } catch (error) {
      console.error('Error fetching profile:', error)
    } finally {
      setLoading(false)
    }
  }

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) throw error
    return data
  }

  const signUp = async (email: string, password: string, fullName: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
      },
    })

    if (error) throw error

    // Create user profile
    if (data.user) {
      await supabase.from('users').insert({
        id: data.user.id,
        email: data.user.email!,
        full_name: fullName,
        role: 'client', // Default role
      })
    }

    return data
  }

  const signOut = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
    router.push('/login')
  }

  const resetPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    })

    if (error) throw error
  }

  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!user) throw new Error('No user logged in')

    const { error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', user.id)

    if (error) throw error

    // Refresh profile
    await fetchProfile(user.id)
  }

  const isAdmin = profile?.role === 'admin' || profile?.role === 'team_member'
  const isClient = profile?.role === 'client'

  return {
    user,
    profile,
    loading,
    signIn,
    signUp,
    signOut,
    resetPassword,
    updateProfile,
    isAdmin,
    isClient,
  }
}
```

### 4.2 Login Page

```typescript
// src/app/(auth)/login/page.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2 } from 'lucide-react'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const { signIn } = useAuth()
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      await signIn(email, password)
      // Redirect handled by middleware based on user role
      router.refresh()
    } catch (err: any) {
      setError(err.message || 'Failed to sign in')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold">Welcome back</CardTitle>
          <CardDescription>
            Enter your credentials to access your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <Link
                  href="/forgot-password"
                  className="text-sm text-primary hover:underline"
                >
                  Forgot password?
                </Link>
              </div>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
              />
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Sign In
            </Button>

            <div className="text-center text-sm">
              Don't have an account?{' '}
              <Link href="/signup" className="text-primary hover:underline">
                Sign up
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
```

### 4.3 Sign Up Page

```typescript
// src/app/(auth)/signup/page.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, CheckCircle2 } from 'lucide-react'

export default function SignUpPage() {
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)
  const { signUp } = useAuth()
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    // Validation
    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters')
      return
    }

    setLoading(true)

    try {
      await signUp(email, password, fullName)
      setSuccess(true)

      // Redirect to login after 2 seconds
      setTimeout(() => {
        router.push('/login')
      }, 2000)
    } catch (err: any) {
      setError(err.message || 'Failed to create account')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <CheckCircle2 className="mx-auto h-12 w-12 text-green-500" />
              <h2 className="mt-4 text-xl font-semibold">Account Created!</h2>
              <p className="mt-2 text-sm text-gray-600">
                Please check your email to verify your account.
                Redirecting to login...
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl font-bold">Create an account</CardTitle>
          <CardDescription>
            Enter your information to get started
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="fullName">Full Name</Label>
              <Input
                id="fullName"
                type="text"
                placeholder="John Doe"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="At least 8 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                disabled={loading}
              />
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Account
            </Button>

            <div className="text-center text-sm">
              Already have an account?{' '}
              <Link href="/login" className="text-primary hover:underline">
                Sign in
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
```

---

*[Continue with sections 5-12...]*

---

**Progress Tracker:**

- [x] Lovable Platform Setup
- [x] Project Structure & Configuration
- [x] Supabase Client Integration
- [x] Authentication System
- [ ] Component Library with shadcn/ui
- [ ] Marketing Website Pages
- [ ] Admin Dashboard
- [ ] Client Portal
- [ ] State Management
- [ ] Forms & Validation
- [ ] Real-time Features
- [ ] Responsive Design

**Estimated Completion:** 35/100 pages

---

**Navigation:**

- **Previous:** [Part 2: Advanced Database Configuration ←](./SUPABASE_ADVANCED.md)
- **Next:** [Part 4: n8n Automation Setup →](./AUTOMATION_SETUP.md)

---

**Document Version:** 1.0
**Last Updated:** 2025-11-21
