# Database Schema Documentation

## Overview

SafHub uses PostgreSQL (via Supabase) with comprehensive Row-Level Security (RLS) policies, custom functions, and audit logging.

## Schema Diagram

```
┌─────────────────┐
│   auth.users    │ (Supabase managed)
└────────┬────────┘
         │
         ├──────────────────────────────────┐
         │                                  │
    ┌────▼────────┐                  ┌─────▼──────┐
    │  profiles   │                  │ user_roles │
    └────┬────────┘                  └─────┬──────┘
         │                                  │
         ├──────────────┬───────────────────┼────────────┐
         │              │                   │            │
    ┌────▼────────┐ ┌──▼──────────┐  ┌─────▼──────┐ ┌──▼──────────┐
    │   courses   │ │course_enroll│  │user_points │ │user_achieve │
    └────┬────────┘ └──┬──────────┘  └────────────┘ └──┬──────────┘
         │             │                               │
    ┌────▼────────┐   │                          ┌────▼────────┐
    │   lessons   │   │                          │achievements │
    └────┬────────┘   │                          └─────────────┘
         │             │
    ┌────▼────────────▼───┐
    │  lesson_progress    │
    └─────────────────────┘
```

## Core Tables

### profiles

Stores user profile information with strict access controls.

```sql
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL,
  school TEXT,
  grade TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

**Indexes:**
- Primary key on `id`
- Unique index on `email`

**RLS Policies:**
- Users can view own profile with audit logging
- Users can update own profile with audit logging
- Admins can access via secure functions only
- All access requires audit log entry

**Relationships:**
- `id` → `auth.users.id` (one-to-one)

---

### user_roles

Stores role assignments using enum type for security.

```sql
CREATE TYPE app_role AS ENUM ('student', 'teacher', 'parent', 'admin');

CREATE TABLE user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, role)
);
```

**Indexes:**
- Primary key on `id`
- Unique index on `(user_id, role)`
- Index on `user_id` for fast lookups

**RLS Policies:**
- Users can view own roles
- Admins can view all roles
- No direct INSERT/UPDATE/DELETE (use secure functions)

**Relationships:**
- `user_id` → `auth.users.id`

---

### courses

Stores course catalog information.

```sql
CREATE TABLE courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  instructor_id UUID REFERENCES auth.users(id),
  instructor_name TEXT NOT NULL,
  category TEXT,
  level TEXT,
  duration TEXT,
  price TEXT DEFAULT 'Free',
  image_url TEXT,
  total_lessons INTEGER DEFAULT 0,
  student_count INTEGER DEFAULT 0,
  rating NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

**Indexes:**
- Primary key on `id`
- Index on `instructor_id`
- Index on `category`
- Index on `level`

**RLS Policies:**
- Anyone can view courses
- Teachers can manage their own courses
- Admins can manage all courses

**Relationships:**
- `instructor_id` → `auth.users.id`

---

### lessons

Stores individual lesson content.

```sql
CREATE TABLE lessons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  video_url TEXT,
  order_index INTEGER NOT NULL,
  duration_minutes INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

**Indexes:**
- Primary key on `id`
- Index on `course_id`
- Index on `(course_id, order_index)`

**RLS Policies:**
- Anyone can view lessons
- Teachers can manage lessons for their courses

**Relationships:**
- `course_id` → `courses.id` (cascade delete)

---

### course_enrollments

Tracks student enrollments in courses.

```sql
CREATE TABLE course_enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  enrolled_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  progress NUMERIC DEFAULT 0,
  UNIQUE(user_id, course_id)
);
```

**Indexes:**
- Primary key on `id`
- Unique index on `(user_id, course_id)`
- Index on `user_id`
- Index on `course_id`

**RLS Policies:**
- Users can view their own enrollments
- Users can enroll in courses
- Users can update their enrollment progress

**Relationships:**
- `user_id` → `auth.users.id` (cascade delete)
- `course_id` → `courses.id` (cascade delete)

---

### lesson_progress

Tracks individual lesson completion.

```sql
CREATE TABLE lesson_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  lesson_id UUID NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  completed BOOLEAN DEFAULT false,
  watch_time_minutes INTEGER DEFAULT 0,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, lesson_id)
);
```

**Indexes:**
- Primary key on `id`
- Unique index on `(user_id, lesson_id)`
- Compound index on `(user_id, course_id)`
- Index on `lesson_id`

**RLS Policies:**
- Users can view their own progress
- Users can create/update their own progress

**Relationships:**
- `user_id` → `auth.users.id` (cascade delete)
- `lesson_id` → `lessons.id` (cascade delete)
- `course_id` → `courses.id` (cascade delete)

---

## Gamification Tables

### achievements

Defines available achievements.

```sql
CREATE TABLE achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  icon TEXT DEFAULT 'trophy',
  category TEXT DEFAULT 'general',
  points INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

**Default Achievements:**
- First Login (10 points)
- Course Complete (50 points)
- 5 Courses Complete (100 points)
- Discussion Starter (20 points)
- Helpful Community Member (30 points)

**RLS Policies:**
- Anyone can view achievements
- Admins can manage achievements

---

### user_achievements

Tracks earned achievements.

```sql
CREATE TABLE user_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  achievement_id UUID REFERENCES achievements(id) ON DELETE SET NULL,
  earned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, achievement_id)
);
```

**Indexes:**
- Unique index on `(user_id, achievement_id)`

**RLS Policies:**
- Users can view their own achievements
- System can insert achievements

---

### user_points

Tracks total points and level.

```sql
CREATE TABLE user_points (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  total_points INTEGER DEFAULT 0,
  level INTEGER DEFAULT 1,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

**Level Thresholds:**
- Level 1: 0-99 points
- Level 2: 100-299 points
- Level 3: 300-599 points
- Level 4: 600-999 points
- Level 5: 1000+ points

**RLS Policies:**
- Users can view their own points
- Users can update their own points

---

### study_sessions

Tracks daily study time.

```sql
CREATE TABLE study_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  minutes_studied INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, date)
);
```

**RLS Policies:**
- Users can manage their own study sessions

---

### weekly_goals

Stores user-defined weekly goals.

```sql
CREATE TABLE weekly_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  week_start_date DATE NOT NULL,
  study_hours_goal INTEGER DEFAULT 15,
  lessons_goal INTEGER DEFAULT 10,
  assignments_goal INTEGER DEFAULT 3,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, week_start_date)
);
```

**RLS Policies:**
- Users can manage their own weekly goals

---

## Community Tables

### forums

Forum categories and metadata.

```sql
CREATE TABLE forums (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  category TEXT DEFAULT 'general',
  created_by UUID NOT NULL REFERENCES auth.users(id),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

**Categories:**
- general
- academics
- technology
- career
- support

**RLS Policies:**
- Anyone can view active forums
- Teachers/admins can create forums
- Creators can update their forums

---

### forum_posts

Forum post content.

```sql
CREATE TABLE forum_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  forum_id UUID REFERENCES forums(id) ON DELETE SET NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  upvotes INTEGER DEFAULT 0,
  downvotes INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

**Indexes:**
- Index on `forum_id`
- Index on `created_at DESC` for sorting

**RLS Policies:**
- Anyone can view posts
- Authenticated users can create posts
- Users can update their own posts

---

### forum_post_replies

Threaded replies to posts.

```sql
CREATE TABLE forum_post_replies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES forum_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

**RLS Policies:**
- Anyone can view replies
- Authenticated users can create replies
- Users can update their own replies

---

### forum_post_votes

Vote tracking for posts.

```sql
CREATE TABLE forum_post_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES forum_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  vote_type TEXT NOT NULL CHECK (vote_type IN ('upvote', 'downvote')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(post_id, user_id)
);
```

**RLS Policies:**
- Anyone can view votes
- Users can manage their own votes

---

### course_discussions

Course-specific discussions.

```sql
CREATE TABLE course_discussions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES course_discussions(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  upvotes INTEGER DEFAULT 0,
  downvotes INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

**RLS Policies:**
- Enrolled users can view course discussions
- Authenticated users can create discussions
- Users can update their own discussions

---

## Assignment Tables

### assignments

Assignment definitions.

```sql
CREATE TABLE assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  due_date TIMESTAMPTZ NOT NULL,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

**RLS Policies:**
- Students can view assignments for enrolled courses
- Teachers can manage assignments for their courses

---

### assignment_submissions

Student assignment submissions.

```sql
CREATE TABLE assignment_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id UUID NOT NULL REFERENCES assignments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  file_url TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_type TEXT NOT NULL,
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(assignment_id, user_id)
);
```

**RLS Policies:**
- Students can create their own submissions
- Students can view their own submissions
- Teachers can view submissions for their assignments
- Teachers can update submission grades

---

## System Tables

### notifications

User notification system.

```sql
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'general',
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

**Notification Types:**
- general
- course
- assignment
- achievement
- system

**RLS Policies:**
- Users can view their own notifications
- Users can update their own notifications
- System can insert notifications

---

### contact_inquiries

Contact form submissions.

```sql
CREATE TABLE contact_inquiries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  status TEXT DEFAULT 'new' CHECK (status IN ('new', 'in-progress', 'resolved')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

**RLS Policies:**
- Anyone can submit inquiries
- Admins can view with audit logging

---

### security_audit_log

Comprehensive audit trail.

```sql
CREATE TABLE security_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  action TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id TEXT,
  details JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

**Logged Actions:**
- PROFILE_VIEW_OWN
- PROFILE_UPDATE_OWN
- ADMIN_PROFILE_VIEW
- ADMIN_PROFILE_UPDATE
- CONTACT_INQUIRY_VIEW
- CONTACT_INQUIRY_STATUS_UPDATE
- COURSE_ACCESS
- ROLE_UPDATE

**RLS Policies:**
- Admins can view logs
- System can insert logs
- No UPDATE or DELETE allowed

---

### parent_child_relationships

Links parents to children.

```sql
CREATE TABLE parent_child_relationships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  child_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  relationship_type TEXT DEFAULT 'parent',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(parent_id, child_id)
);
```

**RLS Policies:**
- Parents can create relationships
- Parents can view their relationships
- Children can view their relationships

---

## Database Functions

### Security Functions

```sql
-- Role checking without RLS recursion
CREATE FUNCTION has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT exists (
    SELECT 1 FROM user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Get current user's role
CREATE FUNCTION get_current_user_role()
RETURNS text
LANGUAGE sql STABLE
AS $$
  SELECT role::text FROM user_roles
  WHERE user_id = auth.uid()
  LIMIT 1
$$;

-- Log profile access
CREATE FUNCTION log_profile_access(
  profile_id_param uuid,
  action_type_param text
)
RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
  log_id uuid;
BEGIN
  INSERT INTO security_audit_log (
    user_id, action, resource_type, resource_id
  ) VALUES (
    auth.uid(), action_type_param, 'profile', profile_id_param::text
  ) RETURNING id INTO log_id;
  
  RETURN log_id;
END;
$$;
```

### Admin Functions

```sql
-- Secure admin profile access
CREATE FUNCTION get_profiles_for_admin_secure()
RETURNS TABLE (
  id uuid,
  first_name text,
  last_name text,
  email text,
  school text,
  grade text,
  avatar_url text
)
LANGUAGE plpgsql SECURITY DEFINER
AS $$
BEGIN
  -- Check admin role
  IF NOT has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Admin access required';
  END IF;
  
  -- Set secure context
  PERFORM set_config('app.secure_admin_access', 'profiles_authorized', true);
  
  -- Return profiles
  RETURN QUERY SELECT * FROM profiles;
END;
$$;

-- Update user role
CREATE FUNCTION update_user_role(
  target_user_id_param uuid,
  new_role_param app_role
)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER
AS $$
BEGIN
  -- Check admin role
  IF NOT has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Admin access required';
  END IF;
  
  -- Update role
  UPDATE user_roles
  SET role = new_role_param
  WHERE user_id = target_user_id_param;
  
  -- Log action
  INSERT INTO security_audit_log (
    user_id, action, resource_type, resource_id, details
  ) VALUES (
    auth.uid(), 'ROLE_UPDATE', 'user_role', target_user_id_param::text,
    jsonb_build_object('new_role', new_role_param)
  );
END;
$$;
```

### Gamification Functions

```sql
-- Award achievement to user
CREATE FUNCTION award_achievement(
  user_id_param uuid,
  achievement_name_param text
)
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  achievement_record achievements%ROWTYPE;
BEGIN
  -- Get achievement
  SELECT * INTO achievement_record
  FROM achievements
  WHERE name = achievement_name_param;
  
  -- Check if already awarded
  IF EXISTS (
    SELECT 1 FROM user_achievements
    WHERE user_id = user_id_param
    AND achievement_id = achievement_record.id
  ) THEN
    RETURN;
  END IF;
  
  -- Award achievement
  INSERT INTO user_achievements (user_id, achievement_id)
  VALUES (user_id_param, achievement_record.id);
  
  -- Update points
  INSERT INTO user_points (user_id, total_points, level)
  VALUES (user_id_param, achievement_record.points, 1)
  ON CONFLICT (user_id) DO UPDATE
  SET total_points = user_points.total_points + achievement_record.points,
      level = CASE
        WHEN user_points.total_points + achievement_record.points >= 1000 THEN 5
        WHEN user_points.total_points + achievement_record.points >= 600 THEN 4
        WHEN user_points.total_points + achievement_record.points >= 300 THEN 3
        WHEN user_points.total_points + achievement_record.points >= 100 THEN 2
        ELSE 1
      END;
      
  -- Create notification
  INSERT INTO notifications (user_id, title, message, type)
  VALUES (
    user_id_param,
    'Achievement Unlocked!',
    'You earned: ' || achievement_record.name,
    'achievement'
  );
END;
$$;
```

## Database Triggers

```sql
-- Auto-update updated_at column
CREATE FUNCTION update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Apply to tables
CREATE TRIGGER update_courses_updated_at
BEFORE UPDATE ON courses
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_profiles_updated_at
BEFORE UPDATE ON profiles
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Handle new user signup
CREATE FUNCTION handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER
AS $$
BEGIN
  -- Create profile
  INSERT INTO profiles (id, first_name, last_name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
    NEW.email
  );
  
  -- Assign default role
  INSERT INTO user_roles (user_id, role)
  VALUES (NEW.id, 'student');
  
  -- Initialize points
  INSERT INTO user_points (user_id)
  VALUES (NEW.id);
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION handle_new_user();
```

## Migration Strategy

1. **Initial Schema:** Base tables and relationships
2. **Security Layer:** RLS policies and functions
3. **Audit System:** Logging tables and triggers
4. **Gamification:** Achievement system
5. **Community:** Forum and discussion features
6. **Optimizations:** Indexes and performance tuning

## Backup & Recovery

- **Automatic Backups:** Daily via Supabase
- **Point-in-Time Recovery:** Available for 7 days
- **Manual Backups:** Export via pg_dump
- **Data Retention:** Audit logs retained indefinitely
