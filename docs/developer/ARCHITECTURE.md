# SafHub Architecture Documentation

## System Overview

SafHub is built using a modern, scalable architecture that separates concerns between the frontend presentation layer and the backend data/logic layer.

```
┌─────────────────────────────────────────────────────────┐
│                    User Browser                          │
│  ┌────────────────────────────────────────────────────┐ │
│  │         React Application (SPA)                    │ │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐         │ │
│  │  │  Pages   │  │Components│  │ Contexts │         │ │
│  │  └────┬─────┘  └────┬─────┘  └────┬─────┘         │ │
│  │       │             │              │                │ │
│  │       └─────────────┴──────────────┘                │ │
│  │                     │                                │ │
│  │       ┌─────────────▼─────────────┐                 │ │
│  │       │    TanStack Query Layer   │                 │ │
│  │       │  (Caching & State Mgmt)   │                 │ │
│  │       └─────────────┬─────────────┘                 │ │
│  │                     │                                │ │
│  │       ┌─────────────▼─────────────┐                 │ │
│  │       │   Supabase Client SDK     │                 │ │
│  │       └─────────────┬─────────────┘                 │ │
│  └─────────────────────┼─────────────────────────────┘ │
└─────────────────────────┼─────────────────────────────┘
                          │ HTTPS
                          │
┌─────────────────────────▼─────────────────────────────┐
│              Supabase Cloud Platform                   │
│  ┌────────────────────────────────────────────────┐   │
│  │           API Gateway & Auth Layer             │   │
│  └────────────┬───────────────────┬────────────────┘   │
│               │                   │                     │
│  ┌────────────▼──────┐  ┌────────▼─────────────┐      │
│  │   PostgreSQL      │  │   Storage Buckets    │      │
│  │   Database        │  │   (4 Buckets)        │      │
│  │   + RLS Policies  │  │                      │      │
│  └────────────┬──────┘  └──────────────────────┘      │
│               │                                         │
│  ┌────────────▼──────────────────────────────┐        │
│  │      Database Functions & Triggers         │        │
│  │  - Security Definer Functions              │        │
│  │  - RLS Helper Functions                    │        │
│  │  - Auto-update Triggers                    │        │
│  └────────────────────────────────────────────┘        │
└────────────────────────────────────────────────────────┘
```

## Frontend Architecture

### 1. Component Hierarchy

```
App.tsx (Root)
│
├── Contexts (Global State)
│   ├── AuthContext (Authentication & User State)
│   └── LanguageContext (i18n)
│
├── Router (React Router DOM)
│   ├── Public Routes
│   │   ├── Index (Landing Page)
│   │   ├── About
│   │   ├── Courses
│   │   ├── Contact
│   │   └── Forums
│   │
│   └── Protected Routes (Require Authentication)
│       ├── Student Dashboard
│       ├── Teacher Dashboard
│       ├── Parent Dashboard
│       ├── Admin Dashboard
│       ├── Course Page
│       ├── Forum Detail
│       └── Gamification
│
└── Shared Components
    ├── Header (Navigation)
    ├── Footer
    └── Modals (Auth, Settings)
```

### 2. State Management Strategy

**Global State (Context API):**
- Authentication state (`AuthContext`)
- User profile and role
- Language preference (`LanguageContext`)
- Theme preference

**Server State (TanStack Query):**
- All data fetching from Supabase
- Automatic caching and revalidation
- Optimistic updates
- Background refetching

**Local Component State (useState):**
- UI state (modals, dropdowns)
- Form inputs
- Temporary UI states

**Form State (React Hook Form):**
- Form data management
- Validation with Zod schemas
- Error handling

### 3. Data Flow Pattern

```
User Action
    ↓
Component Event Handler
    ↓
TanStack Query Mutation
    ↓
Supabase Client Call
    ↓
Supabase API (with Auth Token)
    ↓
RLS Policy Check
    ↓
Database Operation
    ↓
Response to Client
    ↓
TanStack Query Cache Update
    ↓
Component Re-render
```

### 4. Routing Architecture

**Route Protection:**
```typescript
// Protected Route wrapper checks authentication
<Route element={<ProtectedRoute />}>
  <Route path="/dashboard" element={<Dashboard />} />
</Route>

// Role-based rendering within components
{role === 'student' && <StudentDashboard />}
{role === 'teacher' && <TeacherDashboard />}
{role === 'parent' && <ParentDashboard />}
{role === 'admin' && <AdminDashboard />}
```

**Route Structure:**
- `/` - Public landing page
- `/about` - About page
- `/courses` - Course catalog
- `/courses/:id` - Course detail
- `/contact` - Contact form
- `/forums` - Forum list
- `/forums/:id` - Forum detail
- `/forums/:forumId/posts/:postId` - Post detail
- `/dashboard` - Role-based dashboard (protected)
- `/gamification` - Gamification page (protected)

## Backend Architecture

### 1. Database Schema Organization

**Core Tables:**
- `profiles` - User profile data
- `user_roles` - Role assignments (RBAC)
- `courses` - Course catalog
- `lessons` - Lesson content
- `course_enrollments` - User-course relationships
- `lesson_progress` - Progress tracking

**Community Tables:**
- `forums` - Forum metadata
- `forum_posts` - Forum posts
- `forum_post_replies` - Post replies
- `forum_post_votes` - Voting system
- `course_discussions` - Course-specific discussions

**Gamification Tables:**
- `achievements` - Achievement definitions
- `user_achievements` - Earned achievements
- `user_points` - Point tracking
- `study_sessions` - Study time tracking
- `weekly_goals` - User goals

**Management Tables:**
- `assignments` - Assignment definitions
- `assignment_submissions` - Student submissions
- `notifications` - User notifications
- `contact_inquiries` - Contact form submissions
- `security_audit_log` - Audit trail

**Relationship Tables:**
- `parent_child_relationships` - Parent-student links
- `discussion_upvotes` - Discussion voting
- `discussion_downvotes` - Discussion voting

### 2. Security Architecture

**Row-Level Security (RLS) Layers:**

1. **Authentication Layer:**
   - Supabase Auth validates JWT tokens
   - `auth.uid()` provides authenticated user ID

2. **Role-Based Access Control:**
   - `user_roles` table stores role assignments
   - `has_role()` function checks roles without RLS recursion
   - Security definer functions for privileged operations

3. **Data Isolation:**
   - Users can only access their own data
   - Teachers can access their course data
   - Parents can access their children's data
   - Admins use secure functions with audit logging

4. **Audit Logging:**
   - All sensitive operations logged
   - Automatic IP and user agent capture
   - Permanent audit trail

**Security Function Pattern:**
```sql
-- Security definer function bypasses RLS
CREATE FUNCTION has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT exists (
    SELECT 1 FROM user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;
```

### 3. Storage Architecture

**Bucket Organization:**

1. **avatars** (Public)
   - Path: `{user_id}/avatar.{ext}`
   - Size limit: 2MB
   - Allowed types: image/*

2. **course-thumbnails** (Public)
   - Path: `{course_id}/thumbnail.{ext}`
   - Size limit: 5MB
   - Allowed types: image/*

3. **course-files** (Public)
   - Path: `{course_id}/{file_name}`
   - Size limit: 10MB
   - Allowed types: pdf, doc, docx, ppt, pptx

4. **lesson-videos** (Public)
   - Path: `{lesson_id}/video.{ext}`
   - Size limit: 500MB
   - Allowed types: video/*

**Storage Policies:**
```sql
-- Users can upload their own avatars
CREATE POLICY "Users can upload own avatar"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'avatars' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);
```

### 4. Real-time Architecture

**Subscription Patterns:**

1. **Role Changes:**
   - Channel: `role_changes`
   - Table: `user_roles`
   - Filter: `user_id=eq.{userId}`
   - Purpose: Immediate role change reflection

2. **Notifications:**
   - Channel: `notifications`
   - Table: `notifications`
   - Filter: `user_id=eq.{userId}`
   - Purpose: Real-time notification updates

3. **Discussion Updates:**
   - Channel: `discussion_updates`
   - Table: `course_discussions`
   - Filter: `course_id=eq.{courseId}`
   - Purpose: Live discussion updates

## Performance Optimizations

### 1. Frontend Optimizations

**Code Splitting:**
- Lazy load route components
- Dynamic imports for heavy components
- Suspense boundaries for loading states

**Query Optimization:**
- TanStack Query caching (5-minute default)
- Background refetching
- Optimistic updates for mutations
- Prefetching for predictable navigation

**Asset Optimization:**
- Image lazy loading
- Vite build optimization
- Tree shaking for unused code
- CSS purging with Tailwind

### 2. Database Optimizations

**Indexes:**
```sql
-- Course lookups by instructor
CREATE INDEX idx_courses_instructor ON courses(instructor_id);

-- Enrollment lookups
CREATE INDEX idx_enrollments_user ON course_enrollments(user_id);
CREATE INDEX idx_enrollments_course ON course_enrollments(course_id);

-- Progress tracking
CREATE INDEX idx_progress_user_course ON lesson_progress(user_id, course_id);

-- Forum queries
CREATE INDEX idx_posts_forum ON forum_posts(forum_id);
CREATE INDEX idx_posts_created ON forum_posts(created_at DESC);
```

**Query Patterns:**
- Select only needed columns
- Use joins instead of multiple queries
- Implement pagination for large datasets
- Use RPC functions for complex operations

## Scalability Considerations

### 1. Frontend Scalability

- **Component Reusability:** Shared UI components
- **Code Organization:** Feature-based structure
- **State Management:** Efficient caching strategy
- **Bundle Size:** Code splitting and lazy loading

### 2. Database Scalability

- **Connection Pooling:** Supabase handles automatically
- **Query Optimization:** Proper indexing
- **Data Partitioning:** Consider for large tables
- **Caching:** Redis layer (future consideration)

### 3. Storage Scalability

- **CDN Integration:** Supabase CDN for assets
- **Compression:** Image optimization
- **Cleanup:** Orphaned file removal
- **Migration:** Hot/cold storage separation

## Deployment Architecture

```
Developer Machine
    ↓ (git push)
GitHub Repository
    ↓ (webhook)
Vercel/Netlify Build
    ↓
Production Deployment
    │
    ├── Static Assets (CDN)
    ├── API Routes (Serverless)
    └── Frontend SPA
        ↓ (API calls)
    Supabase Production
        ├── PostgreSQL Database
        ├── Auth Service
        ├── Storage
        └── Real-time Service
```

## Monitoring & Observability

### 1. Frontend Monitoring

- Browser console errors
- React error boundaries
- Performance metrics (Core Web Vitals)
- User session recording (optional)

### 2. Backend Monitoring

- Supabase Dashboard metrics
- Query performance logs
- Error rate tracking
- Audit log analysis

### 3. Security Monitoring

- Failed authentication attempts
- Privilege escalation attempts
- Unusual data access patterns
- Security audit log review

## Future Architecture Enhancements

1. **Microservices:** Break into smaller services as needed
2. **Message Queue:** Background job processing
3. **Caching Layer:** Redis for hot data
4. **Search Service:** Elasticsearch for advanced search
5. **Analytics Service:** Dedicated analytics pipeline
6. **Mobile Apps:** React Native with shared logic
7. **WebSockets:** Enhanced real-time features
8. **CDN:** Custom CDN for video streaming
9. **Load Balancer:** Multiple backend instances
10. **Disaster Recovery:** Multi-region deployment
