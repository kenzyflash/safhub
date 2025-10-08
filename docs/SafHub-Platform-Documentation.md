# SafHub Platform - Comprehensive Documentation

## Table of Contents
1. [Executive Summary](#1-executive-summary)
2. [Platform Architecture](#2-platform-architecture)
3. [User Roles & Permissions](#3-user-roles--permissions)
4. [Core Features](#4-core-features)
5. [Database Schema](#5-database-schema)
6. [Security Implementation](#6-security-implementation)
7. [User Dashboards](#7-user-dashboards)
8. [API Integration Points](#8-api-integration-points)
9. [Installation & Setup](#9-installation--setup)
10. [Development Guidelines](#10-development-guidelines)
11. [Deployment](#11-deployment)
12. [Maintenance & Monitoring](#12-maintenance--monitoring)
13. [Troubleshooting](#13-troubleshooting)
14. [Future Enhancements](#14-future-enhancements)
15. [Support & Resources](#15-support--resources)

---

## 1. Executive Summary

**SafHub** is a comprehensive online learning platform designed specifically for Ethiopian students, built with modern web technologies. The platform provides a complete educational ecosystem with role-based access, gamification features, community forums, and robust security measures.

**Key Statistics:**
- Multi-role support (Student, Teacher, Parent, Admin)
- Bilingual interface (English & Amharic)
- Gamification system with 20+ achievements
- Community forums and course discussions
- Real-time progress tracking
- Secure data management with comprehensive audit logging

---

## 2. Platform Architecture

### 2.1 Technology Stack

**Frontend:**
- **Framework:** React 18.3.1 with TypeScript
- **Build Tool:** Vite
- **Styling:** Tailwind CSS with custom animations
- **UI Components:** Radix UI primitives + shadcn/ui
- **Routing:** React Router DOM v6
- **State Management:** React Context API + TanStack Query
- **Form Handling:** React Hook Form with Zod validation

**Backend:**
- **Database:** Supabase (PostgreSQL)
- **Authentication:** Supabase Auth
- **Storage:** Supabase Storage (4 buckets)
- **Real-time:** Supabase Realtime subscriptions
- **Security:** Row Level Security (RLS) policies

**Additional Libraries:**
- date-fns (date manipulation)
- recharts (analytics visualization)
- lucide-react (icons)
- sonner (toast notifications)

### 2.2 System Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    React Frontend                        │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐              │
│  │  Pages   │  │Components│  │ Contexts │              │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘              │
│       │             │              │                     │
│       └─────────────┴──────────────┘                     │
│                     │                                     │
└─────────────────────┼─────────────────────────────────┘
                      │
          ┌───────────▼───────────┐
          │  Supabase Client SDK  │
          └───────────┬───────────┘
                      │
┌─────────────────────▼─────────────────────────────────┐
│              Supabase Backend                          │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐            │
│  │PostgreSQL│  │   Auth   │  │ Storage  │            │
│  │    +     │  │ Service  │  │ Buckets  │            │
│  │   RLS    │  └──────────┘  └──────────┘            │
│  └──────────┘                                          │
│  ┌──────────────────────────────────────┐             │
│  │      Security Functions & Triggers   │             │
│  └──────────────────────────────────────┘             │
└────────────────────────────────────────────────────────┘
```

---

## 3. User Roles & Permissions

### 3.1 Role Hierarchy

#### **Student Role**
- View and enroll in courses
- Access enrolled course content
- Complete lessons and assignments
- Submit assignments
- Participate in discussions
- Track personal progress
- Earn achievements and points
- Set study goals

#### **Teacher Role**
- All student permissions
- Create and manage courses
- Create lessons and assignments
- Grade student work
- View student progress
- Manage course discussions
- Create community forums

#### **Parent Role**
- View linked children's progress
- Monitor study time and achievements
- Track course completion rates
- View performance metrics
- No content management access

#### **Admin Role**
- All system access
- User management
- Role assignment and modification
- Content moderation
- Security audit log access
- Contact inquiry management
- System analytics

### 3.2 Role Assignment

Roles are stored in `user_roles` table with security definer functions to prevent privilege escalation.

---

## 4. Core Features

### 4.1 Course Management System

**Course Structure:**
- Title, description, category, level
- Instructor assignment
- Thumbnail image
- Duration and pricing
- Student count and ratings

**Lesson Management:**
- Video content support
- Order-based sequencing
- Duration tracking
- Progress tracking per student

**Course Enrollment:**
- Simple enrollment process
- Progress percentage tracking
- Automated notifications

### 4.2 Learning Management

**Lesson Progress Tracking:**
- Completion status per lesson
- Watch time recording
- Course-wide progress aggregation
- Real-time updates

**Assignment System:**
- Teacher-created assignments
- Due date management
- File submissions
- Teacher review and grading

### 4.3 Gamification System

**Achievement System:**
- Pre-defined achievements:
  - Milestones (First Login, Profile Setup)
  - Learning (Course Completion, Perfect Assignment)
  - Consistency (Study Streak, Daily Login)
  - Community (First Post, Helpful Reply)

**User Progress:**
- Point accumulation
- Level progression (1-5)
- Achievement tracking
- Visual progress indicators

**Study Goals:**
- Weekly goal setting
- Study hours tracking
- Lesson completion goals
- Assignment completion targets

### 4.4 Community Features

**Forum System:**
- Multi-category forums
- Post and reply system
- Upvote/downvote voting
- Anonymized user IDs for privacy

**Course Discussions:**
- Course-specific discussions
- Threaded replies
- Voting system
- Enrollment-based access

### 4.5 Security Features

**Audit Logging:**
- All sensitive operations logged
- User ID, action, timestamp
- IP address and user agent capture
- Resource type and ID tracking

**Data Protection:**
- Profile access requires logging
- Admin operations use secure functions
- Student data anonymization
- Contact inquiry access restricted

**RLS Policies:**
- Table-level security enforcement
- User-specific data access
- Role-based permissions

### 4.6 Multi-language Support

**Language System:**
- English (default)
- Amharic (አማርኛ)
- Language selector in header
- LocalStorage persistence
- Context-based translation

---

## 5. Database Schema

### 5.1 Core Tables

**profiles**
- User profile information
- Audit logging on access

**user_roles**
- Enum-based role storage
- Security definer functions

**courses**
- Course metadata
- Instructor relationships

**lessons**
- Lesson content
- Video URLs
- Order sequencing

**course_enrollments**
- User-course relationships
- Progress percentage

**lesson_progress**
- Lesson completion
- Watch time tracking

### 5.2 Gamification Tables

**achievements**
- Achievement definitions

**user_achievements**
- User-achievement relationships

**user_points**
- Point accumulation
- Current level

**study_sessions**
- Daily study time tracking

**weekly_goals**
- User goal definitions

### 5.3 Community Tables

**forums**
- Forum metadata

**forum_posts**
- Post content
- Vote counts

**forum_post_replies**
- Reply content

**course_discussions**
- Course-specific discussions
- Thread support

### 5.4 Management Tables

**assignments**
- Assignment metadata

**assignment_submissions**
- Student submissions

**notifications**
- User notifications

**contact_inquiries**
- Contact form submissions
- Admin-only access

**security_audit_log**
- System-wide audit trail
- Admin-only access

**parent_child_relationships**
- Parent-student linkage

### 5.5 Storage Buckets

1. **avatars** (Public) - User profile pictures
2. **course-files** (Public) - Course documents
3. **course-thumbnails** (Public) - Course images
4. **lesson-videos** (Public) - Video content

---

## 6. Security Implementation

### 6.1 Authentication System

- Supabase Auth integration
- Email/password authentication
- JWT token-based security
- Session persistence

### 6.2 Row-Level Security (RLS)

Example policies:
```sql
-- Users see only their own profile
CREATE POLICY "Users can view own profile with audit"
ON profiles FOR SELECT
USING (auth.uid() = id AND log_profile_access(id, 'PROFILE_VIEW_OWN') IS NOT NULL);
```

### 6.3 Audit Logging

- All sensitive operations logged
- IP and user agent capture
- Admin-only log access
- Permanent records

### 6.4 Data Privacy

- Direct profile access blocked
- Admin access requires secure functions
- Anonymization in public contexts

---

## 7. User Dashboards

### 7.1 Student Dashboard

**Statistics:**
- Enrolled courses
- Completed courses
- Average progress

**Features:**
- Course progress cards
- Study goals widget
- Upcoming assignments
- Gamification progress

### 7.2 Teacher Dashboard

**Statistics:**
- Total courses created
- Total students enrolled
- Average rating

**Features:**
- Course management
- Assignment reviews
- Recent activity feed

### 7.3 Parent Dashboard

**Statistics:**
- Children tracked
- Combined study time
- Total achievements

**Features:**
- Per-child progress cards
- Achievement tracking

### 7.4 Admin Dashboard

**Features:**
- User management
- Course management
- Contact inquiries
- Security audit logs

---

## 8. API Integration Points

### 8.1 Supabase Client

```typescript
import { supabase } from "@/integrations/supabase/client";

// Query
const { data } = await supabase
  .from('courses')
  .select('*');

// Insert
await supabase
  .from('course_enrollments')
  .insert({ user_id, course_id });

// RPC call
await supabase.rpc('award_achievement', {
  user_id_param: userId,
  achievement_name_param: 'First Login'
});
```

### 8.2 Real-time Subscriptions

```typescript
const subscription = supabase
  .channel('role_changes')
  .on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: 'user_roles'
  }, handleChange)
  .subscribe();
```

---

## 9. Installation & Setup

### 9.1 Prerequisites

- Node.js v18+
- npm or bun
- Supabase account

### 9.2 Installation

```bash
git clone https://github.com/kenzyflash/yet-ephrat-academy
cd yet-ephrat-academy
npm install
npm run dev
```

---

## 10. Development Guidelines

### 10.1 Code Organization

```
src/
├── components/
├── contexts/
├── hooks/
├── pages/
├── translations/
└── utils/
```

### 10.2 Best Practices

- Never bypass RLS
- Use secure functions for admin
- Implement audit logging
- Validate inputs
- Use parameterized queries

---

## 11. Deployment

```bash
npm run build
npm run preview
```

Deploy to Vercel, Netlify, or custom server.

---

## 12. Maintenance & Monitoring

- Monitor user activity
- Review audit logs
- Regular backups
- Security audits

---

## 13. Troubleshooting

- Check Supabase logs
- Verify RLS policies
- Review audit trail
- Check browser console

---

## 14. Future Enhancements

- Live video streaming
- Real-time chat
- Mobile app
- AI recommendations
- Certificate system
- Payment integration

---

## 15. Support & Resources

**Team Leader:** Kaleab Fikru

**Team Members:**
1. Fiker Ayalneh
2. Fikir Nigusse
3. Fison Nasir
4. Hanan Feisel
5. Hasset Yonas
6. Helina Abush
7. Hiba Jemal
8. Husniya Kedir

**Contact:**
- Email: info@safhub.com
- Phone: +251 (911) 123-456
- Address: Addis Ababa, Ethiopia
