# API Endpoints Documentation

This document covers all API endpoints, database operations, and function calls used in the SafHub platform.

## Table of Contents
- [Database Operations](#database-operations)
- [Database Functions](#database-functions)
- [Storage Operations](#storage-operations)
- [Real-time Subscriptions](#real-time-subscriptions)
- [Error Handling](#error-handling)

---

## Database Operations

### Authentication

#### Sign Up
```typescript
const { data, error } = await supabase.auth.signUp({
  email: 'user@example.com',
  password: 'securePassword123',
  options: {
    data: {
      full_name: 'John Doe',
      role: 'student'
    }
  }
});
```

#### Sign In
```typescript
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'user@example.com',
  password: 'securePassword123'
});
```

#### Sign Out
```typescript
const { error } = await supabase.auth.signOut();
```

#### Get Current User
```typescript
const { data: { user } } = await supabase.auth.getUser();
```

---

### Profiles

#### Get Own Profile
```typescript
const { data, error } = await supabase
  .from('profiles')
  .select('*')
  .eq('id', userId)
  .single();
```

#### Update Own Profile
```typescript
const { error } = await supabase
  .from('profiles')
  .update({
    full_name: 'Updated Name',
    school: 'New School',
    grade: 10
  })
  .eq('id', userId);
```

#### Get Profile (Admin - Secure Function)
```typescript
const { data, error } = await supabase
  .rpc('get_profiles_for_admin_secure');
```

#### Update Profile (Admin - Secure Function)
```typescript
const { data, error } = await supabase
  .rpc('admin_update_profile_secure', {
    profile_id: userId,
    update_data: {
      full_name: 'Updated Name',
      email: 'newemail@example.com'
    }
  });
```

---

### User Roles

#### Get User Role
```typescript
const { data, error } = await supabase
  .from('user_roles')
  .select('role')
  .eq('user_id', userId)
  .single();
```

#### Update User Role (Admin)
```typescript
const { data, error } = await supabase
  .rpc('update_user_role', {
    target_user_id: userId,
    new_role: 'teacher'
  });
```

#### Get All Users with Roles (Admin)
```typescript
const { data, error } = await supabase
  .rpc('get_all_users_with_roles');
```

---

### Courses

#### Get All Courses
```typescript
const { data, error } = await supabase
  .from('courses')
  .select(`
    *,
    profiles:instructor_id (
      full_name,
      avatar_url
    )
  `)
  .order('created_at', { ascending: false });
```

#### Get Single Course
```typescript
const { data, error } = await supabase
  .from('courses')
  .select(`
    *,
    lessons (
      id,
      title,
      duration,
      order_number
    ),
    profiles:instructor_id (
      full_name,
      avatar_url
    )
  `)
  .eq('id', courseId)
  .single();
```

#### Create Course (Teacher/Admin)
```typescript
const { data, error } = await supabase
  .from('courses')
  .insert({
    title: 'Course Title',
    description: 'Course Description',
    category: 'Math',
    level: 'Beginner',
    instructor_id: userId,
    thumbnail_url: 'https://...',
    duration: '8 weeks',
    price: 0
  })
  .select()
  .single();
```

#### Update Course
```typescript
const { error } = await supabase
  .from('courses')
  .update({
    title: 'Updated Title',
    description: 'Updated Description'
  })
  .eq('id', courseId)
  .eq('instructor_id', userId);
```

#### Delete Course
```typescript
const { error } = await supabase
  .from('courses')
  .delete()
  .eq('id', courseId)
  .eq('instructor_id', userId);
```

---

### Lessons

#### Get Course Lessons
```typescript
const { data, error } = await supabase
  .from('lessons')
  .select('*')
  .eq('course_id', courseId)
  .order('order_number', { ascending: true });
```

#### Create Lesson (Teacher)
```typescript
const { data, error } = await supabase
  .from('lessons')
  .insert({
    course_id: courseId,
    title: 'Lesson Title',
    description: 'Lesson Description',
    video_url: 'https://...',
    duration: 30,
    order_number: 1
  })
  .select()
  .single();
```

#### Update Lesson
```typescript
const { error } = await supabase
  .from('lessons')
  .update({
    title: 'Updated Title',
    video_url: 'https://...'
  })
  .eq('id', lessonId);
```

#### Delete Lesson
```typescript
const { error } = await supabase
  .from('lessons')
  .delete()
  .eq('id', lessonId);
```

---

### Course Enrollments

#### Enroll in Course
```typescript
const { data, error } = await supabase
  .from('course_enrollments')
  .insert({
    user_id: userId,
    course_id: courseId,
    progress_percentage: 0
  })
  .select()
  .single();
```

#### Get User Enrollments
```typescript
const { data, error } = await supabase
  .from('course_enrollments')
  .select(`
    *,
    courses (
      id,
      title,
      description,
      thumbnail_url,
      category
    )
  `)
  .eq('user_id', userId)
  .order('enrolled_at', { ascending: false });
```

#### Update Enrollment Progress
```typescript
const { error } = await supabase
  .from('course_enrollments')
  .update({ progress_percentage: 75 })
  .eq('user_id', userId)
  .eq('course_id', courseId);
```

---

### Lesson Progress

#### Mark Lesson as Completed
```typescript
const { data, error } = await supabase
  .from('lesson_progress')
  .upsert({
    user_id: userId,
    lesson_id: lessonId,
    completed: true,
    watch_time_seconds: 600,
    completed_at: new Date().toISOString()
  })
  .select()
  .single();
```

#### Get Lesson Progress
```typescript
const { data, error } = await supabase
  .from('lesson_progress')
  .select('*')
  .eq('user_id', userId)
  .eq('lesson_id', lessonId)
  .maybeSingle();
```

#### Get Course Progress
```typescript
const { data, error } = await supabase
  .from('lesson_progress')
  .select(`
    *,
    lessons!inner (
      course_id
    )
  `)
  .eq('user_id', userId)
  .eq('lessons.course_id', courseId);
```

---

### Assignments

#### Create Assignment (Teacher)
```typescript
const { data, error } = await supabase
  .from('assignments')
  .insert({
    course_id: courseId,
    title: 'Assignment Title',
    description: 'Assignment Description',
    due_date: '2025-12-31',
    created_by: userId
  })
  .select()
  .single();
```

#### Get Course Assignments
```typescript
const { data, error } = await supabase
  .from('assignments')
  .select('*')
  .eq('course_id', courseId)
  .order('due_date', { ascending: true });
```

#### Submit Assignment (Student)
```typescript
const { data, error } = await supabase
  .from('assignment_submissions')
  .insert({
    assignment_id: assignmentId,
    user_id: userId,
    submission_file_url: 'https://...',
    submission_text: 'My submission text'
  })
  .select()
  .single();
```

#### Get Assignment Submissions (Teacher)
```typescript
const { data, error } = await supabase
  .from('assignment_submissions')
  .select(`
    *,
    profiles:user_id (
      full_name,
      email
    ),
    assignments!inner (
      course_id
    )
  `)
  .eq('assignment_id', assignmentId);
```

---

### Gamification

#### Award Achievement
```typescript
const { data, error } = await supabase
  .rpc('award_achievement', {
    user_id_param: userId,
    achievement_name_param: 'First Login'
  });
```

#### Get User Achievements
```typescript
const { data, error } = await supabase
  .from('user_achievements')
  .select(`
    *,
    achievements (
      name,
      description,
      icon,
      points,
      category
    )
  `)
  .eq('user_id', userId)
  .order('earned_at', { ascending: false });
```

#### Get User Points
```typescript
const { data, error } = await supabase
  .from('user_points')
  .select('*')
  .eq('user_id', userId)
  .single();
```

#### Increment Study Minutes
```typescript
const { data, error } = await supabase
  .rpc('increment_study_minutes', {
    p_user_id: userId,
    p_minutes: 30
  });
```

#### Create/Update Weekly Goal
```typescript
const { data, error } = await supabase
  .from('weekly_goals')
  .upsert({
    user_id: userId,
    study_hours_goal: 10,
    lessons_goal: 5,
    assignments_goal: 3,
    week_start_date: '2025-10-06'
  })
  .select()
  .single();
```

---

### Forums

#### Create Forum (Teacher/Admin)
```typescript
const { data, error } = await supabase
  .from('forums')
  .insert({
    name: 'Forum Name',
    description: 'Forum Description',
    category: 'General',
    created_by: userId,
    is_active: true
  })
  .select()
  .single();
```

#### Get Forums
```typescript
const { data, error } = await supabase
  .from('forums')
  .select('*')
  .eq('is_active', true)
  .order('created_at', { ascending: false });
```

#### Create Forum Post
```typescript
const { data, error } = await supabase
  .from('forum_posts')
  .insert({
    forum_id: forumId,
    user_id: userId,
    title: 'Post Title',
    content: 'Post Content'
  })
  .select()
  .single();
```

#### Get Forum Posts (Anonymized)
```typescript
const { data, error } = await supabase
  .rpc('get_forum_posts_anonymized', {
    p_forum_id: forumId
  });
```

#### Vote on Post
```typescript
const { data, error } = await supabase
  .rpc('vote_forum_post', {
    p_post_id: postId,
    p_vote_type: 'upvote' // or 'downvote'
  });
```

---

### Course Discussions

#### Create Discussion
```typescript
const { data, error } = await supabase
  .from('course_discussions')
  .insert({
    course_id: courseId,
    user_id: userId,
    content: 'Discussion content',
    parent_id: null // or parentId for reply
  })
  .select()
  .single();
```

#### Get Course Discussions (Secure)
```typescript
const { data, error } = await supabase
  .rpc('get_course_discussions_secure', {
    p_course_id: courseId
  });
```

#### Upvote/Downvote Discussion
```typescript
// Upvote
const { data, error } = await supabase
  .from('discussion_upvotes')
  .insert({
    discussion_id: discussionId,
    user_id: userId
  });

// Downvote
const { data, error } = await supabase
  .from('discussion_downvotes')
  .insert({
    discussion_id: discussionId,
    user_id: userId
  });
```

---

### Notifications

#### Get User Notifications
```typescript
const { data, error } = await supabase
  .from('notifications')
  .select('*')
  .eq('user_id', userId)
  .order('created_at', { ascending: false });
```

#### Mark Notification as Read
```typescript
const { error } = await supabase
  .from('notifications')
  .update({ is_read: true })
  .eq('id', notificationId)
  .eq('user_id', userId);
```

#### Create Notification
```typescript
const { data, error } = await supabase
  .from('notifications')
  .insert({
    user_id: targetUserId,
    title: 'Notification Title',
    message: 'Notification Message',
    type: 'course_enrollment',
    is_read: false
  })
  .select()
  .single();
```

---

### Contact Inquiries

#### Submit Contact Inquiry
```typescript
const { data, error } = await supabase
  .from('contact_inquiries')
  .insert({
    name: 'John Doe',
    email: 'john@example.com',
    subject: 'Question',
    message: 'My question here',
    status: 'new'
  })
  .select()
  .single();
```

#### Get Contact Inquiries (Admin - Secure)
```typescript
const { data, error } = await supabase
  .rpc('get_contact_inquiries_with_audit');
```

#### Update Inquiry Status (Admin - Secure)
```typescript
const { data, error } = await supabase
  .rpc('update_contact_inquiry_status', {
    inquiry_id: inquiryId,
    new_status: 'in_progress'
  });
```

---

### Security Audit Log

#### Get Audit Logs (Admin Only)
```typescript
const { data, error } = await supabase
  .from('security_audit_log')
  .select('*')
  .order('timestamp', { ascending: false })
  .limit(100);
```

---

## Database Functions

### Security Functions

#### get_current_user_role()
Returns the current user's role.
```sql
SELECT get_current_user_role();
```

#### has_role(user_id, role)
Checks if a user has a specific role.
```sql
SELECT has_role('user-uuid', 'admin');
```

---

### Admin Functions

#### get_profiles_for_admin_secure()
Securely gets all profiles for admin with audit logging.
```typescript
const { data, error } = await supabase
  .rpc('get_profiles_for_admin_secure');
```

#### admin_update_profile_secure(profile_id, update_data)
Securely updates a profile with audit logging.
```typescript
const { data, error } = await supabase
  .rpc('admin_update_profile_secure', {
    profile_id: 'user-uuid',
    update_data: { full_name: 'New Name' }
  });
```

#### update_user_role(target_user_id, new_role)
Updates a user's role with audit logging.
```typescript
const { data, error } = await supabase
  .rpc('update_user_role', {
    target_user_id: 'user-uuid',
    new_role: 'teacher'
  });
```

---

### Data Functions

#### get_anonymized_profile(user_id)
Gets anonymized profile data for public display.
```typescript
const { data, error } = await supabase
  .rpc('get_anonymized_profile', {
    p_user_id: userId
  });
```

---

## Storage Operations

### Avatar Upload
```typescript
const { data, error } = await supabase.storage
  .from('avatars')
  .upload(`${userId}/avatar.png`, file, {
    cacheControl: '3600',
    upsert: true
  });
```

### Get Avatar URL
```typescript
const { data } = supabase.storage
  .from('avatars')
  .getPublicUrl(`${userId}/avatar.png`);
```

### Course Thumbnail Upload
```typescript
const { data, error } = await supabase.storage
  .from('course-thumbnails')
  .upload(`${courseId}/thumbnail.jpg`, file);
```

### Video Upload
```typescript
const { data, error } = await supabase.storage
  .from('lesson-videos')
  .upload(`${lessonId}/video.mp4`, file, {
    cacheControl: '3600'
  });
```

### Delete File
```typescript
const { error } = await supabase.storage
  .from('avatars')
  .remove([`${userId}/avatar.png`]);
```

---

## Real-time Subscriptions

### Subscribe to Role Changes
```typescript
const subscription = supabase
  .channel('role_changes')
  .on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: 'user_roles',
    filter: `user_id=eq.${userId}`
  }, (payload) => {
    console.log('Role changed:', payload);
  })
  .subscribe();
```

### Subscribe to Course Updates
```typescript
const subscription = supabase
  .channel('course_updates')
  .on('postgres_changes', {
    event: 'UPDATE',
    schema: 'public',
    table: 'courses',
    filter: `id=eq.${courseId}`
  }, (payload) => {
    console.log('Course updated:', payload);
  })
  .subscribe();
```

### Subscribe to New Notifications
```typescript
const subscription = supabase
  .channel('notifications')
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'notifications',
    filter: `user_id=eq.${userId}`
  }, (payload) => {
    console.log('New notification:', payload);
  })
  .subscribe();
```

### Unsubscribe
```typescript
await supabase.removeChannel(subscription);
```

---

## Error Handling

### Standard Error Handling Pattern
```typescript
const { data, error } = await supabase
  .from('courses')
  .select('*');

if (error) {
  console.error('Error:', error.message);
  // Handle error appropriately
  return;
}

// Use data
console.log('Data:', data);
```

### Common Error Codes
- `PGRST116` - No rows found
- `23505` - Unique violation
- `23503` - Foreign key violation
- `42501` - Insufficient privileges
- `42P01` - Undefined table

### Error Handling with Toast
```typescript
import { toast } from "sonner";

const { data, error } = await supabase
  .from('courses')
  .insert(courseData);

if (error) {
  toast.error('Failed to create course', {
    description: error.message
  });
  return;
}

toast.success('Course created successfully');
```

---

## Rate Limiting

Supabase has built-in rate limiting. For high-frequency operations, implement client-side debouncing:

```typescript
import { debounce } from 'lodash';

const debouncedSearch = debounce(async (query: string) => {
  const { data } = await supabase
    .from('courses')
    .select('*')
    .ilike('title', `%${query}%`);
}, 300);
```

---

## Best Practices

1. **Always check for errors** before using data
2. **Use select() sparingly** - only fetch what you need
3. **Implement pagination** for large datasets
4. **Use RPC functions** for complex operations
5. **Cache frequently accessed data** with TanStack Query
6. **Handle loading and error states** in UI
7. **Use transactions** for related operations
8. **Validate input** before sending to database
9. **Use TypeScript** for type safety
10. **Monitor audit logs** for security
