# Agentic Powered Recruitment Platform Fullstack Architecture Document

## Introduction

This document outlines the complete fullstack architecture for the Agentic Powered Recruitment Platform, including backend systems, frontend implementation, and their integration. It serves as the single source of truth for AI-driven development, ensuring consistency across the entire technology stack.

This unified approach combines what would traditionally be separate backend and frontend architecture documents, streamlining the development process for modern fullstack applications where these concerns are increasingly intertwined.

### Starter Template or Existing Project

N/A - Greenfield project built from scratch using Next.js 15 with custom configuration optimized for our specific requirements.

### Change Log

| Date | Version | Description | Author |
|------|---------|-------------|---------|
| 2025-01-30 | 1.0 | Initial architecture document | Winston (Architect) |

## High Level Architecture

### Technical Summary

The platform employs a modern serverless-first architecture leveraging Next.js 15's App Router for the frontend, Supabase for backend services and PostgreSQL database, with Python-based microservices for AI/ML workloads. The system uses Edge Functions for real-time features, Supabase's built-in authentication and Row Level Security for data protection, and vector embeddings stored in Supabase's pgvector extension for AI matching. All components are deployed on Vercel's Edge Network for optimal performance, with Supabase handling the backend infrastructure, achieving sub-500ms API response times while supporting 10,000 concurrent users.

### Platform and Infrastructure Choice

**Platform:** Vercel + Supabase  
**Key Services:** Vercel (Frontend hosting, Edge Functions), Supabase (Database, Auth, Storage, Realtime, Vector embeddings), AWS Lambda (Python AI services)  
**Deployment Host and Regions:** Vercel Global Edge Network (Primary: US-East, EU-West), Supabase (US-East-1 primary, EU-West-1 replica)

### Repository Structure

**Structure:** Monorepo  
**Monorepo Tool:** Turborepo with pnpm workspaces  
**Package Organization:** apps/ for applications, packages/ for shared code, services/ for microservices

### High Level Architecture Diagram

```mermaid
graph TB
    subgraph "Client Layer"
        Web[Next.js 15 Web App]
        PWA[Progressive Web App]
    end
    
    subgraph "Edge Layer"
        CDN[Vercel CDN]
        EdgeFunc[Edge Functions]
    end
    
    subgraph "Application Layer"
        API[Next.js API Routes]
        RSC[React Server Components]
        Action[Server Actions]
    end
    
    subgraph "Supabase Platform"
        Auth[Supabase Auth]
        DB[(PostgreSQL + pgvector)]
        Storage[Supabase Storage]
        Realtime[Realtime Subscriptions]
        Edge[Edge Functions]
    end
    
    subgraph "AI Services"
        Match[Matching Engine Lambda]
        Parse[Resume Parser Lambda]
        Embed[Embedding Service]
    end
    
    subgraph "External Services"
        LinkedIn[LinkedIn API]
        Email[Resend Email]
        Payment[Stripe]
    end
    
    Web --> CDN
    PWA --> CDN
    CDN --> API
    CDN --> RSC
    RSC --> Action
    API --> Auth
    API --> DB
    Action --> DB
    API --> Storage
    DB --> Realtime
    API --> Edge
    Edge --> Match
    Edge --> Parse
    Match --> Embed
    Parse --> DB
    API --> LinkedIn
    API --> Email
    API --> Payment
```

### Architectural Patterns

- **Jamstack Architecture:** Static generation with dynamic API routes - _Rationale:_ Optimal performance and SEO for public-facing pages
- **Server Components First:** React Server Components for data fetching - _Rationale:_ Reduced client bundle size and improved performance
- **Database-First Authorization:** Row Level Security in Supabase - _Rationale:_ Centralized, secure authorization logic
- **Event-Driven Updates:** Supabase Realtime for live updates - _Rationale:_ Efficient real-time collaboration without polling
- **Edge Computing:** Vercel Edge Functions for low latency - _Rationale:_ Global performance optimization
- **Repository Pattern:** Abstract data access through services - _Rationale:_ Testability and database abstraction
- **Optimistic UI:** Client updates before server confirmation - _Rationale:_ Perceived performance improvement
- **Component-Based Architecture:** Reusable React components - _Rationale:_ Maintainability and consistency

## Tech Stack

### Technology Stack Table

| Category | Technology | Version | Purpose | Rationale |
|----------|------------|---------|---------|-----------|
| Frontend Language | TypeScript | 5.3+ | Type-safe frontend development | Type safety and developer experience |
| Frontend Framework | Next.js | 15.0+ | Full-stack React framework | App Router, RSC, Server Actions |
| UI Component Library | shadcn/ui | Latest | Reusable UI components | Customizable, accessible, modern |
| State Management | Zustand + React Query | 4.5+ / 5.0+ | Client state and server cache | Simple, powerful, TypeScript-first |
| Backend Language | TypeScript / Python | 5.3+ / 3.11+ | API and AI services | Type safety for APIs, Python for ML |
| Backend Framework | Next.js API / FastAPI | 15.0+ / 0.104+ | API routes and ML services | Integrated with frontend, async Python |
| API Style | REST + Server Actions | - | Data fetching and mutations | Simple, type-safe, efficient |
| Database | Supabase PostgreSQL | 15+ | Primary data storage | Managed, scalable, pgvector support |
| Cache | Redis (Upstash) | 7.0+ | Session and query caching | Serverless Redis for edge caching |
| File Storage | Supabase Storage | - | Resume and document storage | Integrated with auth and database |
| Authentication | Supabase Auth | - | User authentication | Built-in, supports MFA, social login |
| Frontend Testing | Vitest + Testing Library | 1.0+ / 14+ | Unit and component tests | Fast, ESM-native, React-focused |
| Backend Testing | Vitest + Supertest | 1.0+ / 6.3+ | API and integration tests | Consistent with frontend |
| E2E Testing | Playwright | 1.40+ | End-to-end testing | Cross-browser, reliable |
| Build Tool | Vite | 5.0+ | Development and building | Fast HMR, optimized builds |
| Bundler | Turbopack | Beta | Next.js bundling | Faster than webpack |
| IaC Tool | Terraform | 1.6+ | Infrastructure management | Declarative infrastructure |
| CI/CD | GitHub Actions | - | Automation pipeline | Native GitHub integration |
| Monitoring | Vercel Analytics + Sentry | - | Performance and error tracking | Integrated monitoring |
| Logging | Better Stack | - | Centralized logging | Modern, developer-friendly |
| CSS Framework | Tailwind CSS | 3.4+ | Utility-first styling | Rapid development, consistent design |

## Data Models

### User Model

**Purpose:** Core user entity for authentication and profile management

**Key Attributes:**
- id: UUID - Unique identifier from Supabase Auth
- email: string - User email address
- role: enum - 'employer' | 'candidate' | 'admin'
- created_at: timestamp - Account creation date
- updated_at: timestamp - Last modification date

**TypeScript Interface:**
```typescript
interface User {
  id: string,
  email: string,
  last_sign_in: string,
  full_name: string,
  role: 'employer' | 'candidate' | 'admin';
  created_at: string;
  updated_at: string;
}
```
Supabase users table 
```sql
 table public.users (
  id uuid not null,
  email text null,
  last_sign_in timestamp with time zone null default now(),
  created_at timestamp with time zone null default now(),
  full_name text null,
  role text null default ''::text,
  constraint users_pkey primary key (id),
  constraint users_email_key unique (email),
  constraint users_id_fkey foreign KEY (id) references auth.users (id) on delete CASCADE
) TABLESPACE pg_default;
```

**Relationships:**
- Has one EmployerProfile or CandidateProfile
- Has many Applications (if candidate)
- Has many Jobs (if employer)

### EmployerProfile Model

**Purpose:** Extended profile for employer users

**Key Attributes:**
- id: UUID - Primary key
- user_id: UUID - Foreign key to User
- company_name: string - Organization name
- company_size: string - Employee count range
- industry: string - Industry classification
- logo_url: string - Company logo storage reference

**TypeScript Interface:**
```typescript
interface EmployerProfile {
  id: string;
  user_id: string;
  company_name: string;
  company_size: string;
  industry: string;
  logo_url?: string;
  website?: string;
  description?: string;
}
```

**Relationships:**
- Belongs to User
- Has many TeamMembers
- Has many Jobs

### Job Model

**Purpose:** Job posting entity with requirements and metadata

**Key Attributes:**
- id: UUID - Primary key
- employer_id: UUID - Foreign key to EmployerProfile
- title: string - Job title
- description: text - Rich text job description
- requirements: jsonb - Structured requirements
- salary_min: integer - Minimum salary
- salary_max: integer - Maximum salary
- location: string - Job location
- remote_type: enum - 'onsite' | 'remote' | 'hybrid'
- status: enum - 'draft' | 'published' | 'closed'

**TypeScript Interface:**
```typescript
interface Job {
  id: string;
  employer_id: string;
  title: string;
  description: string;
  requirements: {
    skills: string[];
    experience_years: number;
    education?: string;
  };
  salary_min?: number;
  salary_max?: number;
  location: string;
  remote_type: 'onsite' | 'remote' | 'hybrid';
  status: 'draft' | 'published' | 'closed';
  created_at: string;
  updated_at: string;
}
```

**Relationships:**
- Belongs to EmployerProfile
- Has many Applications
- Has many JobMatches

### CandidateProfile Model

**Purpose:** Extended profile for job seekers

**Key Attributes:**
- id: UUID - Primary key
- user_id: UUID - Foreign key to User
- full_name: string - Candidate name
- resume_url: string - Resume storage reference
- skills: jsonb - Array of skills
- experience: jsonb - Work experience array
- education: jsonb - Education history
- embedding: vector(1536) - AI embedding for matching

**TypeScript Interface:**
```typescript
interface CandidateProfile {
  id: string;
  user_id: string;
  full_name: string;
  resume_url?: string;
  skills: string[];
  experience: {
    company: string;
    position: string;
    start_date: string;
    end_date?: string;
    description: string;
  }[];
  education: {
    institution: string;
    degree: string;
    field: string;
    graduation_date: string;
  }[];
  location?: string;
  desired_salary?: number;
}
```

**Relationships:**
- Belongs to User
- Has many Applications
- Has many AssessmentResults

### Application Model

**Purpose:** Track job applications and their status

**Key Attributes:**
- id: UUID - Primary key
- job_id: UUID - Foreign key to Job
- candidate_id: UUID - Foreign key to CandidateProfile
- status: enum - Application status
- cover_letter: text - Optional cover letter
- match_score: float - AI-generated match score

**TypeScript Interface:**
```typescript
interface Application {
  id: string;
  job_id: string;
  candidate_id: string;
  status: 'submitted' | 'reviewing' | 'interview' | 'rejected' | 'accepted';
  cover_letter?: string;
  match_score?: number;
  applied_at: string;
  updated_at: string;
}
```

**Relationships:**
- Belongs to Job
- Belongs to CandidateProfile
- Has many ApplicationEvents

## API Specification

### REST API with Server Actions

Since we're using Next.js 15 with Server Actions, we'll have a hybrid approach:

**Server Actions for Mutations:**
```typescript
// app/actions/jobs.ts
'use server'

export async function createJob(data: JobCreateInput): Promise<Job> {
  const supabase = createServerClient();
  const { data: job, error } = await supabase
    .from('jobs')
    .insert(data)
    .select()
    .single();
  
  if (error) throw new ApiError(error.message);
  return job;
}

export async function updateJobStatus(
  jobId: string, 
  status: Job['status']
): Promise<Job> {
  // Implementation
}
```

**API Routes for Complex Operations:**
```typescript
// app/api/matching/route.ts
export async function POST(request: Request) {
  const { jobId } = await request.json();
  
  // Call Python Lambda for AI matching
  const matches = await invokeMatchingEngine(jobId);
  
  return Response.json({ matches });
}
```

**Supabase Client for Queries:**
```typescript
// Direct database queries from Server Components
export default async function JobsPage() {
  const supabase = createServerClient();
  const { data: jobs } = await supabase
    .from('jobs')
    .select('*')
    .eq('status', 'published');
  
  return <JobsList jobs={jobs} />;
}
```

## Components

### Frontend Components

**Responsibility:** User interface and interactions

**Key Interfaces:**
- Server Components for data fetching
- Client Components for interactivity
- Shared UI components from shadcn/ui

**Dependencies:** React, Next.js, shadcn/ui, Tailwind CSS

**Technology Stack:** TypeScript, React 18, Next.js 15

### Authentication Service

**Responsibility:** User authentication and session management

**Key Interfaces:**
- Supabase Auth client
- JWT token validation
- Role-based access control

**Dependencies:** Supabase Auth, Next.js middleware

**Technology Stack:** Supabase Auth SDK, TypeScript

### Job Management Service

**Responsibility:** CRUD operations for job postings

**Key Interfaces:**
- Server Actions for mutations
- Supabase queries for reads
- Real-time subscriptions for updates

**Dependencies:** Supabase client, validation schemas

**Technology Stack:** TypeScript, Zod validation, Supabase

### AI Matching Engine

**Responsibility:** Generate embeddings and match candidates to jobs

**Key Interfaces:**
- REST API endpoint
- Lambda function invocation
- Vector similarity search

**Dependencies:** OpenAI API, pgvector, Python Lambda

**Technology Stack:** Python, FastAPI, LangChain, pgvector

### Assessment Service

**Responsibility:** Deliver and score assessments

**Key Interfaces:**
- Assessment delivery API
- Scoring algorithms
- Result storage

**Dependencies:** Database, Redis for session storage

**Technology Stack:** TypeScript, Next.js API routes

### Notification Service

**Responsibility:** Email and in-app notifications

**Key Interfaces:**
- Email sending (Resend)
- In-app notifications (Supabase Realtime)
- Notification preferences

**Dependencies:** Resend, Supabase Realtime

**Technology Stack:** TypeScript, Resend SDK

### Component Diagram

```mermaid
graph TB
    subgraph "Next.js Application"
        UI[UI Components]
        SC[Server Components]
        SA[Server Actions]
        API[API Routes]
        MW[Middleware]
    end
    
    subgraph "Services"
        Auth[Auth Service]
        Jobs[Job Service]
        Match[Matching Service]
        Notify[Notification Service]
    end
    
    subgraph "Data Layer"
        Supa[Supabase Client]
        Cache[Redis Cache]
    end
    
    UI --> SC
    UI --> SA
    SC --> Supa
    SA --> Supa
    API --> Services
    MW --> Auth
    Auth --> Supa
    Jobs --> Supa
    Match --> Supa
    Notify --> External
    Services --> Cache
```

## External APIs

### LinkedIn API

- **Purpose:** Import candidate profiles and post jobs
- **Documentation:** https://docs.microsoft.com/en-us/linkedin/
- **Base URL(s):** https://api.linkedin.com/v2
- **Authentication:** OAuth 2.0 with refresh tokens
- **Rate Limits:** 100,000 requests/day, 500/min

**Key Endpoints Used:**
- `GET /me` - Fetch user profile
- `POST /ugcPosts` - Share job postings
- `GET /people/(id)` - Get profile details

**Integration Notes:** Store tokens in encrypted database field, implement exponential backoff for rate limiting

### OpenAI API

- **Purpose:** Generate embeddings and AI assistance
- **Documentation:** https://platform.openai.com/docs
- **Base URL(s):** https://api.openai.com/v1
- **Authentication:** API Key
- **Rate Limits:** Based on tier, typically 3,500 RPM

**Key Endpoints Used:**
- `POST /embeddings` - Generate text embeddings
- `POST /chat/completions` - AI text generation

**Integration Notes:** Use streaming for long responses, implement retry logic

### Resend Email API

- **Purpose:** Transactional email delivery
- **Documentation:** https://resend.com/docs
- **Base URL(s):** https://api.resend.com
- **Authentication:** API Key
- **Rate Limits:** 100 emails/hour (free tier)

**Key Endpoints Used:**
- `POST /emails` - Send transactional emails

**Integration Notes:** Queue emails for batch sending, template management in codebase

## Core Workflows

```mermaid
sequenceDiagram
    participant C as Candidate
    participant W as Web App
    participant A as Auth Service
    participant D as Database
    participant AI as AI Service
    participant E as Email Service
    
    C->>W: Submit Application
    W->>A: Validate Session
    A-->>W: Valid Token
    W->>D: Store Application
    D-->>W: Application ID
    W->>AI: Generate Match Score
    AI->>D: Get Job Requirements
    D-->>AI: Requirements
    AI->>AI: Calculate Similarity
    AI-->>W: Match Score
    W->>D: Update Application Score
    W->>E: Send Confirmation
    E-->>C: Email Confirmation
    W-->>C: Success Response
```

## Database Schema

```sql
-- Enable UUID and vector extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "vector";

-- Users table (managed by Supabase Auth)
-- Profiles extend auth.users

-- Employer profiles
CREATE TABLE employer_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    company_name TEXT NOT NULL,
    company_size TEXT,
    industry TEXT,
    logo_url TEXT,
    website TEXT,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Candidate profiles
CREATE TABLE candidate_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    full_name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    location TEXT,
    resume_url TEXT,
    skills JSONB DEFAULT '[]',
    experience JSONB DEFAULT '[]',
    education JSONB DEFAULT '[]',
    embedding vector(1536),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Jobs table
CREATE TABLE jobs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employer_id UUID REFERENCES employer_profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    requirements JSONB DEFAULT '{}',
    salary_min INTEGER,
    salary_max INTEGER,
    location TEXT,
    remote_type TEXT CHECK (remote_type IN ('onsite', 'remote', 'hybrid')),
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'closed')),
    embedding vector(1536),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Applications table
CREATE TABLE applications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    job_id UUID REFERENCES jobs(id) ON DELETE CASCADE,
    candidate_id UUID REFERENCES candidate_profiles(id) ON DELETE CASCADE,
    status TEXT DEFAULT 'submitted',
    cover_letter TEXT,
    match_score FLOAT,
    applied_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(job_id, candidate_id)
);

-- Assessments table
CREATE TABLE assessments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    type TEXT CHECK (type IN ('technical', 'soft_skill')),
    questions JSONB NOT NULL,
    time_limit INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Assessment results
CREATE TABLE assessment_results (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    assessment_id UUID REFERENCES assessments(id),
    candidate_id UUID REFERENCES candidate_profiles(id),
    application_id UUID REFERENCES applications(id),
    answers JSONB NOT NULL,
    score FLOAT,
    completed_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_jobs_status ON jobs(status);
CREATE INDEX idx_jobs_employer ON jobs(employer_id);
CREATE INDEX idx_applications_job ON applications(job_id);
CREATE INDEX idx_applications_candidate ON applications(candidate_id);
CREATE INDEX idx_jobs_embedding ON jobs USING ivfflat (embedding vector_cosine_ops);
CREATE INDEX idx_candidates_embedding ON candidate_profiles USING ivfflat (embedding vector_cosine_ops);

-- Row Level Security Policies
ALTER TABLE employer_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE candidate_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;

-- Employers can only see their own profile
CREATE POLICY employer_profile_policy ON employer_profiles
    FOR ALL USING (auth.uid() = user_id);

-- Candidates can only see their own profile
CREATE POLICY candidate_profile_policy ON candidate_profiles
    FOR ALL USING (auth.uid() = user_id);

-- Published jobs are public, drafts are private
CREATE POLICY jobs_public_policy ON jobs
    FOR SELECT USING (status = 'published' OR employer_id IN (
        SELECT id FROM employer_profiles WHERE user_id = auth.uid()
    ));

-- Candidates see their applications, employers see applications to their jobs
CREATE POLICY applications_policy ON applications
    FOR SELECT USING (
        candidate_id IN (SELECT id FROM candidate_profiles WHERE user_id = auth.uid())
        OR job_id IN (SELECT id FROM jobs WHERE employer_id IN (
            SELECT id FROM employer_profiles WHERE user_id = auth.uid()
        ))
    );
```

## Frontend Architecture

### Theme Configuration

The application uses a sophisticated theme system with CSS custom properties for dynamic theming:

**Color System:**
- HSL-based colors for easy manipulation
- Automatic light/dark mode support
- Semantic color naming for maintainability
- Consistent color usage across components

**Shadow System:**
- Unique neomorphic shadow style with 2px solid offsets
- Progressive shadow depths from 2xs to 2xl
- Consistent shadow colors matching theme

**Typography:**
- Inter as primary font with system fallbacks
- Consistent type scale across breakpoints
- Font variables: --font-sans, --font-serif, --font-mono

**Spacing:**
- 4px (0.25rem) base unit
- Consistent spacing scale using Tailwind classes
- Custom --spacing property for fine control

**Example Theme Usage:**
```css
/* Using theme variables in components */
.custom-card {
  background: hsl(var(--card));
  color: hsl(var(--card-foreground));
  box-shadow: var(--shadow-md);
  border-radius: var(--radius);
}

/* Dark mode automatically handled */
.dark .custom-card {
  /* Colors automatically switch via CSS variables */
}
```

### Component Architecture

**Component Organization:**
```
app/
├── (auth)/
│   ├── login/
│   └── register/
├── (dashboard)/
│   ├── layout.tsx
│   ├── page.tsx
│   ├── jobs/
│   ├── candidates/
│   └── settings/
├── (public)/
│   ├── jobs/
│   └── companies/
├── api/
│   ├── matching/
│   └── webhooks/
└── actions/
    ├── jobs.ts
    ├── applications.ts
    └── profiles.ts

components/
├── ui/           # shadcn/ui components
├── forms/        # Form components
├── layouts/      # Layout components
└── features/     # Feature-specific components
```

**Component Template:**
```typescript
// components/features/job-card.tsx
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Job } from '@/types';
import { cn } from '@/lib/utils';

interface JobCardProps {
  job: Job;
  onApply?: () => void;
  className?: string;
}

export function JobCard({ job, onApply, className }: JobCardProps) {
  return (
    <Card className={cn(
      "p-6 transition-all duration-200",
      "hover:shadow-md hover:-translate-y-0.5",
      "bg-card text-card-foreground",
      className
    )}>
      <h3 className="text-xl font-semibold text-foreground">{job.title}</h3>
      <p className="text-muted-foreground mt-2">{job.company_name}</p>
      <div className="flex gap-2 mt-4">
        <Badge className="bg-accent text-accent-foreground">
          {job.location}
        </Badge>
        <Badge variant="secondary" className="bg-secondary text-secondary-foreground">
          {job.remote_type}
        </Badge>
      </div>
      {onApply && (
        <Button 
          onClick={onApply} 
          className="mt-4 bg-primary text-primary-foreground hover:shadow-md"
        >
          Apply Now
        </Button>
      )}
    </Card>
  );
}
```

### State Management Architecture

**State Structure:**
```typescript
// stores/use-app-store.ts
import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

interface AppState {
  user: User | null;
  notifications: Notification[];
  setUser: (user: User | null) => void;
  addNotification: (notification: Notification) => void;
}

export const useAppStore = create<AppState>()(
  devtools(
    persist(
      (set) => ({
        user: null,
        notifications: [],
        setUser: (user) => set({ user }),
        addNotification: (notification) =>
          set((state) => ({
            notifications: [...state.notifications, notification],
          })),
      }),
      {
        name: 'app-storage',
      }
    )
  )
);
```

**State Management Patterns:**
- Server state with React Query for caching
- Client state with Zustand for UI state
- Form state with react-hook-form
- URL state with Next.js router

### Routing Architecture

**Route Organization:**
```
app/
├── (auth)/          # Auth layout group
├── (dashboard)/     # Protected dashboard
├── (public)/        # Public pages
└── api/            # API routes
```

**Protected Route Pattern:**
```typescript
// app/(dashboard)/layout.tsx
import { createServerClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    redirect('/login');
  }
  
  return (
    <div className="flex h-screen">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
```

### Frontend Services Layer

**API Client Setup:**
```typescript
// lib/supabase/client.ts
import { createBrowserClient } from '@supabase/ssr';

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
```

**Service Example:**
```typescript
// services/jobs.service.ts
import { createClient } from '@/lib/supabase/client';
import { Job } from '@/types';

export class JobsService {
  private supabase = createClient();
  
  async getJobs(filters?: JobFilters): Promise<Job[]> {
    let query = this.supabase
      .from('jobs')
      .select('*')
      .eq('status', 'published');
    
    if (filters?.location) {
      query = query.eq('location', filters.location);
    }
    
    const { data, error } = await query;
    if (error) throw error;
    return data;
  }
  
  async applyToJob(jobId: string, data: ApplicationData) {
    const { error } = await this.supabase
      .from('applications')
      .insert({ job_id: jobId, ...data });
    
    if (error) throw error;
  }
}
```

## Backend Architecture

### Service Architecture

**Edge Function Organization:**
```
supabase/functions/
├── match-candidates/
│   └── index.ts
├── parse-resume/
│   └── index.ts
├── send-notifications/
│   └── index.ts
└── generate-embeddings/
    └── index.ts
```

**Function Template:**
```typescript
// supabase/functions/match-candidates/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

serve(async (req) => {
  const { jobId } = await req.json();
  
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );
  
  // Get job embedding
  const { data: job } = await supabase
    .from('jobs')
    .select('embedding')
    .eq('id', jobId)
    .single();
  
  // Find similar candidates using pgvector
  const { data: matches } = await supabase.rpc('match_candidates', {
    query_embedding: job.embedding,
    match_threshold: 0.7,
    match_count: 20
  });
  
  return new Response(JSON.stringify({ matches }), {
    headers: { 'Content-Type': 'application/json' },
  });
});
```

### Database Architecture

**Schema Design:** See Database Schema section above

**Data Access Layer:**
```typescript
// lib/db/repositories/job.repository.ts
import { SupabaseClient } from '@supabase/supabase-js';
import { Job, JobCreateInput } from '@/types';

export class JobRepository {
  constructor(private supabase: SupabaseClient) {}
  
  async create(data: JobCreateInput): Promise<Job> {
    const { data: job, error } = await this.supabase
      .from('jobs')
      .insert(data)
      .select()
      .single();
    
    if (error) throw new DatabaseError(error.message);
    return job;
  }
  
  async findById(id: string): Promise<Job | null> {
    const { data } = await this.supabase
      .from('jobs')
      .select('*')
      .eq('id', id)
      .single();
    
    return data;
  }
  
  async updateStatus(id: string, status: Job['status']): Promise<void> {
    const { error } = await this.supabase
      .from('jobs')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', id);
    
    if (error) throw new DatabaseError(error.message);
  }
}
```

### Authentication and Authorization

**Auth Flow:**
```mermaid
sequenceDiagram
    participant U as User
    participant A as App
    participant S as Supabase Auth
    participant D as Database
    
    U->>A: Login Request
    A->>S: Authenticate
    S-->>A: JWT Token
    A->>A: Store in Cookie
    A->>D: Request with Token
    D->>D: Verify RLS Policy
    D-->>A: Authorized Data
    A-->>U: Protected Content
```

**Middleware/Guards:**
```typescript
// middleware.ts
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req, res });
  
  const {
    data: { user },
  } = await supabase.auth.getUser();
  
  // Protect dashboard routes
  if (req.nextUrl.pathname.startsWith('/dashboard')) {
    if (!user) {
      return NextResponse.redirect(new URL('/login', req.url));
    }
  }
  
  return res;
}

export const config = {
  matcher: ['/dashboard/:path*', '/api/:path*'],
};
```

## Unified Project Structure

```
agentic-recruitment-platform/
├── .github/                    # CI/CD workflows
│   └── workflows/
│       ├── ci.yaml
│       └── deploy.yaml
├── apps/                       # Application packages
│   ├── web/                    # Next.js 15 application
│   │   ├── app/                # App router pages
│   │   ├── components/         # React components
│   │   ├── lib/               # Utilities and clients
│   │   ├── services/          # Business logic
│   │   ├── stores/            # State management
│   │   ├── styles/            # Global styles
│   │   ├── types/             # TypeScript types
│   │   └── package.json
│   └── ai/                     # Python AI services
│       ├── matching/           # Matching engine
│       ├── parser/            # Resume parser
│       ├── embeddings/        # Embedding generator
│       └── requirements.txt
├── packages/                   # Shared packages
│   ├── database/              # Database schemas and migrations
│   │   ├── migrations/
│   │   ├── seeds/
│   │   └── package.json
│   ├── ui/                    # Shared UI components
│   │   ├── src/
│   │   └── package.json
│   └── utils/                 # Shared utilities
│       ├── src/
│       └── package.json
├── supabase/                  # Supabase configuration
│   ├── functions/             # Edge functions
│   ├── migrations/            # Database migrations
│   └── config.toml
├── infrastructure/            # IaC definitions
│   ├── terraform/
│   └── docker/
├── scripts/                   # Build and deployment scripts
├── docs/                      # Documentation
│   ├── prd.md
│   ├── front-end-spec.md
│   └── architecture.md
├── .env.example              # Environment template
├── turbo.json               # Turborepo config
├── package.json             # Root package.json
├── pnpm-workspace.yaml      # PNPM workspace config
└── README.md
```

## Development Workflow

### Local Development Setup

**Prerequisites:**
```bash
# Required software
node --version  # 20.x or higher
pnpm --version  # 8.x or higher
python --version  # 3.11 or higher
supabase --version  # 1.x CLI
```

**Initial Setup:**
```bash
# Clone repository
git clone https://github.com/org/agentic-recruitment-platform.git
cd agentic-recruitment-platform

# Install dependencies
pnpm install

# Setup environment
cp .env.example .env.local
# Edit .env.local with your values

# Start Supabase locally
supabase start

# Run database migrations
pnpm db:migrate

# Seed database
pnpm db:seed
```

**Development Commands:**
```bash
# Start all services
pnpm dev

# Start frontend only
pnpm dev:web

# Start backend only
pnpm dev:api

# Run tests
pnpm test
pnpm test:e2e

# Type checking
pnpm type-check

# Linting
pnpm lint
```

### Environment Configuration

**Required Environment Variables:**
```bash
# Frontend (.env.local)
NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Backend (.env)
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
OPENAI_API_KEY=your-openai-key
RESEND_API_KEY=your-resend-key
STRIPE_SECRET_KEY=your-stripe-key
LINKEDIN_CLIENT_ID=your-linkedin-id
LINKEDIN_CLIENT_SECRET=your-linkedin-secret

# Shared
DATABASE_URL=postgresql://postgres:postgres@localhost:54322/postgres
REDIS_URL=redis://localhost:6379
```

## Deployment Architecture

### Deployment Strategy

**Frontend Deployment:**
- **Platform:** Vercel
- **Build Command:** `pnpm build:web`
- **Output Directory:** `apps/web/.next`
- **CDN/Edge:** Vercel Edge Network

**Backend Deployment:**
- **Platform:** Supabase Cloud + AWS Lambda
- **Build Command:** `pnpm build:functions`
- **Deployment Method:** Supabase CLI + Serverless Framework

### CI/CD Pipeline

```yaml
# .github/workflows/deploy.yaml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: pnpm/action-setup@v2
      - uses: actions/setup-node@v3
        with:
          node-version: 20
          cache: 'pnpm'
      - run: pnpm install
      - run: pnpm test
      - run: pnpm build

  deploy-web:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--prod'

  deploy-supabase:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: supabase/setup-cli@v1
      - run: supabase functions deploy --project-ref ${{ secrets.SUPABASE_PROJECT_REF }}
```

### Environments

| Environment | Frontend URL | Backend URL | Purpose |
|------------|--------------|-------------|---------|
| Development | http://localhost:3000 | http://localhost:54321 | Local development |
| Staging | https://staging.weavist.app | https://staging-api.weavist.app | Pre-production testing |
| Production | https://weavist.app | https://api.weavist.app | Live environment |

## Security and Performance

### Security Requirements

**Frontend Security:**
- CSP Headers: `default-src 'self'; script-src 'self' 'unsafe-inline' https://vercel.live;`
- XSS Prevention: React's built-in escaping, input sanitization
- Secure Storage: HTTPOnly cookies for auth tokens

**Backend Security:**
- Input Validation: Zod schemas for all inputs
- Rate Limiting: 100 requests/minute per IP
- CORS Policy: Whitelist specific origins

**Authentication Security:**
- Token Storage: Secure, HTTPOnly cookies
- Session Management: 7-day refresh, 1-hour access tokens
- Password Policy: Minimum 8 chars, complexity requirements

### Performance Optimization

**Frontend Performance:**
- Bundle Size Target: < 200KB initial JS
- Loading Strategy: Code splitting, lazy loading
- Caching Strategy: SWR for data fetching, service workers

**Backend Performance:**
- Response Time Target: < 500ms P95
- Database Optimization: Indexes, query optimization, connection pooling
- Caching Strategy: Redis for sessions, CDN for static assets

## Testing Strategy

### Testing Pyramid

```
        E2E Tests (10%)
       /              \
    Integration Tests (30%)
   /                      \
Unit Tests - Frontend (30%) Backend (30%)
```

### Test Organization

**Frontend Tests:**
```
apps/web/
├── __tests__/
│   ├── unit/
│   ├── integration/
│   └── components/
```

**Backend Tests:**
```
apps/api/
├── __tests__/
│   ├── unit/
│   ├── integration/
│   └── e2e/
```

**E2E Tests:**
```
e2e/
├── auth.spec.ts
├── job-posting.spec.ts
└── application.spec.ts
```

### Test Examples

**Frontend Component Test:**
```typescript
// __tests__/components/job-card.test.tsx
import { render, screen } from '@testing-library/react';
import { JobCard } from '@/components/features/job-card';
import '@testing-library/jest-dom';

describe('JobCard', () => {
  const mockJob = {
    id: '1',
    title: 'Senior Developer',
    employer_id: 'emp-1',
    company_name: 'Tech Corp',
    location: 'Remote',
    remote_type: 'remote' as const,
    description: 'Great opportunity',
    status: 'published' as const,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  it('renders job information correctly', () => {
    render(<JobCard job={mockJob} />);
    
    expect(screen.getByText('Senior Developer')).toBeInTheDocument();
    expect(screen.getByText('Tech Corp')).toBeInTheDocument();
    expect(screen.getByText('Remote')).toBeInTheDocument();
  });

  it('applies correct theme classes', () => {
    const { container } = render(<JobCard job={mockJob} />);
    const card = container.querySelector('[class*="bg-card"]');
    
    expect(card).toHaveClass('bg-card', 'text-card-foreground');
  });

  it('shows Apply button when onApply provided', () => {
    const handleApply = jest.fn();
    render(<JobCard job={mockJob} onApply={handleApply} />);
    
    const button = screen.getByText('Apply Now');
    expect(button).toHaveClass('bg-primary', 'text-primary-foreground');
  });
});
```

**Backend API Test:**
```typescript
// __tests__/api/jobs.test.ts
import { createMocks } from 'node-mocks-http';
import handler from '@/app/api/jobs/route';

describe('/api/jobs', () => {
  it('returns published jobs', async () => {
    const { req, res } = createMocks({
      method: 'GET',
    });
    
    await handler(req, res);
    
    expect(res._getStatusCode()).toBe(200);
    const data = JSON.parse(res._getData());
    expect(Array.isArray(data.jobs)).toBe(true);
  });
});
```

**E2E Test:**
```typescript
// e2e/job-application.spec.ts
import { test, expect } from '@playwright/test';

test('candidate can apply for job', async ({ page }) => {
  await page.goto('/jobs/senior-developer');
  await page.click('text=Apply Now');
  await page.fill('[name=cover_letter]', 'I am interested...');
  await page.click('text=Submit Application');
  
  await expect(page.locator('text=Application Submitted')).toBeVisible();
});
```

## Coding Standards

### Critical Fullstack Rules

- **Type Sharing:** Always define types in packages/types and import from there
- **API Calls:** Never make direct HTTP calls - use the service layer
- **Environment Variables:** Access only through config objects, never process.env directly
- **Error Handling:** All API routes must use the standard error handler
- **State Updates:** Never mutate state directly - use proper state management patterns
- **Database Access:** Always use repositories, never direct Supabase calls in components
- **Authentication:** Check auth in middleware, not in individual pages
- **Validation:** Validate all inputs with Zod schemas before processing

### Naming Conventions

| Element | Frontend | Backend | Example |
|---------|----------|---------|---------|
| Components | PascalCase | - | `JobCard.tsx` |
| Hooks | camelCase with 'use' | - | `useAuth.ts` |
| API Routes | - | kebab-case | `/api/job-matches` |
| Database Tables | - | snake_case | `employer_profiles` |
| Environment Variables | SCREAMING_SNAKE_CASE | SCREAMING_SNAKE_CASE | `NEXT_PUBLIC_API_URL` |
| Server Actions | camelCase | - | `createJob()` |
| CSS Variables | kebab-case | - | `--primary-foreground` |
| Tailwind Classes | kebab-case | - | `bg-primary text-foreground` |

### Tailwind Configuration

The project extends Tailwind with the custom theme properties:

```javascript
// tailwind.config.ts
import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: ['class'],
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
      },
      borderRadius: {
        DEFAULT: 'var(--radius)',
      },
      boxShadow: {
        '2xs': 'var(--shadow-2xs)',
        'xs': 'var(--shadow-xs)',
        'sm': 'var(--shadow-sm)',
        DEFAULT: 'var(--shadow)',
        'md': 'var(--shadow-md)',
        'lg': 'var(--shadow-lg)',
        'xl': 'var(--shadow-xl)',
        '2xl': 'var(--shadow-2xl)',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};

export default config;
```

## Error Handling Strategy

### Error Flow

```mermaid
sequenceDiagram
    participant C as Client
    participant A as API
    participant S as Service
    participant D as Database
    
    C->>A: Request
    A->>S: Process
    S->>D: Query
    D-->>S: Error
    S-->>A: Throw AppError
    A->>A: Error Handler
    A-->>C: Formatted Error Response
    C->>C: Display Error Toast
```

### Error Response Format

```typescript
interface ApiError {
  error: {
    code: string;
    message: string;
    details?: Record<string, any>;
    timestamp: string;
    requestId: string;
  };
}
```

### Frontend Error Handling

```typescript
// lib/error-handler.ts
export function handleError(error: unknown): string {
  if (error instanceof ApiError) {
    return error.message;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return 'An unexpected error occurred';
}

// Usage in component
try {
  await createJob(formData);
} catch (error) {
  toast.error(handleError(error));
}
```

### Backend Error Handling

```typescript
// lib/api-error.ts
export class ApiError extends Error {
  constructor(
    public code: string,
    public statusCode: number,
    message: string,
    public details?: any
  ) {
    super(message);
  }
}

// middleware/error-handler.ts
export function errorHandler(error: unknown, req: Request) {
  if (error instanceof ApiError) {
    return Response.json(
      {
        error: {
          code: error.code,
          message: error.message,
          details: error.details,
          timestamp: new Date().toISOString(),
          requestId: req.headers.get('x-request-id'),
        },
      },
      { status: error.statusCode }
    );
  }
  
  // Log unexpected errors
  console.error('Unexpected error:', error);
  
  return Response.json(
    {
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred',
      },
    },
    { status: 500 }
  );
}
```

## Monitoring and Observability

### Monitoring Stack

- **Frontend Monitoring:** Vercel Analytics for Web Vitals and performance
- **Backend Monitoring:** Supabase Dashboard for database and API metrics
- **Error Tracking:** Sentry for application errors and exceptions
- **Performance Monitoring:** Vercel Speed Insights for real user monitoring

### Key Metrics

**Frontend Metrics:**
- Core Web Vitals (LCP, FID, CLS)
- JavaScript errors rate
- API response times
- User interactions per session

**Backend Metrics:**
- Request rate and latency
- Error rate by endpoint
- Database query performance
- AI matching accuracy
- Queue depths and processing times

## Checklist Results Report

Architecture document is complete and ready for implementation. All sections have been thoroughly documented with specific attention to the Next.js 15, TypeScript, Supabase, Tailwind CSS, and shadcn/ui stack requirements.