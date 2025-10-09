# User Management Guide

## Overview

The user management system allows administrators to view, manage, and modify user accounts, roles, and permissions across the SafHub platform.

## Accessing User Management

1. Sign in with admin credentials
2. Navigate to Admin Dashboard
3. Click on "User Management" section

## Viewing Users

### User List View

The user list displays:
- User ID (UUID)
- Full name (first name + last name)
- Email address
- Current role (student/teacher/parent/admin)
- Account creation date
- Last login timestamp
- Account status (active/inactive)

### Search and Filter

**Search Options:**
- By name (first name or last name)
- By email
- By user ID

**Filter Options:**
- By role (all, student, teacher, parent, admin)
- By status (active, inactive)
- By registration date (date range)

**Sort Options:**
- Alphabetically by name
- By registration date (newest/oldest)
- By last login (most/least recent)

## User Details

### Viewing User Profile

1. Click on user name in the list
2. View detailed profile information:
   - Personal information
   - Contact details
   - School and grade (if student)
   - Account statistics
   - Activity history

### Profile Information Displayed

**Personal:**
- First name
- Last name
- Email
- Avatar

**Academic (Students):**
- School
- Grade level
- Enrolled courses
- Progress statistics

**Activity:**
- Last login date/time
- Total sessions
- Average session duration
- Recent activities

## Managing User Roles

### Understanding Roles

**Student:**
- Can enroll in courses
- Can submit assignments
- Can participate in discussions
- Cannot create courses

**Teacher:**
- All student permissions
- Can create and manage courses
- Can grade assignments
- Can moderate course discussions

**Parent:**
- Can view linked children's progress
- Cannot enroll in courses
- Cannot create content
- Read-only access to child data

**Admin:**
- Full system access
- Can manage all users
- Can moderate all content
- Can access security logs
- Can configure system settings

### Changing User Roles

1. Navigate to user profile
2. Click "Change Role" button
3. Select new role from dropdown:
   - Student
   - Teacher
   - Parent
   - Admin
4. Confirm role change
5. User is notified via email and in-app notification

**Important Notes:**
- Role changes are logged in security audit log
- Role changes take effect immediately
- User may need to refresh their session
- Previous role permissions are revoked immediately

### Role Change Considerations

**Promoting to Teacher:**
- User gains course creation abilities
- Existing enrollments are preserved
- Can still access student features

**Promoting to Admin:**
- User gains full system access
- Use with extreme caution
- Recommend limiting admin accounts
- All admin actions are logged

**Demoting from Admin:**
- Admin access revoked immediately
- Previous admin actions remain logged
- Cannot access admin dashboard
- Cannot view other users' data

**Demoting from Teacher:**
- Existing courses remain (ownership transferred or retained)
- Can no longer create new courses
- Can no longer grade assignments
- Student enrollments in their courses unaffected

## User Profile Management

### Editing User Profiles

1. Click "Edit Profile" button
2. Modify allowed fields:
   - First name
   - Last name
   - School (for students)
   - Grade (for students)
3. Click "Save Changes"
4. Profile update is logged

**Cannot Edit:**
- User ID (immutable)
- Email (user must change via settings)
- Password (user must reset via email)
- Creation date

### Updating Contact Information

- Email changes must be initiated by user
- Users receive verification email
- Admin cannot directly change emails
- Phone numbers (if added) can be edited

### Profile Picture Management

- Users upload their own avatars
- Admins can remove inappropriate avatars
- Default avatar assigned if none uploaded
- Image requirements:
  - Max size: 2MB
  - Formats: JPG, PNG, GIF
  - Recommended: 400x400px

## Account Actions

### Suspending Accounts

**To Suspend:**
1. Navigate to user profile
2. Click "Suspend Account" button
3. Enter suspension reason
4. Set suspension duration or indefinite
5. Confirm suspension

**Effects of Suspension:**
- User cannot log in
- Active sessions terminated
- All permissions revoked
- Data preserved but inaccessible
- User notified via email

**To Reactivate:**
1. Navigate to suspended user
2. Click "Reactivate Account"
3. Confirm reactivation
4. User notified via email

### Deleting Accounts

**⚠️ DANGER: This action is irreversible**

**To Delete:**
1. Navigate to user profile
2. Click "Delete Account" button
3. Review warning message
4. Type user email to confirm
5. Click "Confirm Deletion"

**Effects of Deletion:**
- User account permanently deleted
- All personal data removed (GDPR compliant)
- Course enrollments deleted
- Forum posts anonymized (not deleted)
- Assignments preserved for record-keeping
- Cannot be undone

**Data Retention:**
- Security audit logs retained
- Anonymous activity data retained
- Payment records retained (if applicable)

### Resetting Passwords

**Admin-Initiated Reset:**
1. Navigate to user profile
2. Click "Reset Password"
3. User receives password reset email
4. Admin cannot see new password

**Security Notes:**
- Admin never sees user passwords
- Password reset links expire in 1 hour
- User must create new secure password
- Password history enforced (no reuse)

## Bulk Operations

### Bulk Role Changes

1. Select multiple users (checkbox)
2. Click "Bulk Actions" dropdown
3. Select "Change Role"
4. Choose new role
5. Confirm bulk change

**Limitations:**
- Maximum 100 users per bulk operation
- Admin role changes require individual confirmation
- All changes logged separately

### Bulk Notifications

1. Select users to notify
2. Click "Send Notification"
3. Write notification message
4. Choose notification type
5. Send to selected users

### Bulk Export

1. Filter users as needed
2. Click "Export" button
3. Choose format (CSV, Excel, JSON)
4. Download file

**Exported Data Includes:**
- User ID
- Name
- Email
- Role
- Registration date
- Last login
- Account status

**Privacy Note:** Handle exported data securely

## Parent-Child Relationships

### Linking Parents to Students

1. Navigate to parent's profile
2. Click "Manage Children" button
3. Click "Add Child"
4. Search for student by email or name
5. Send link request
6. Student/guardian must approve

**Approval Process:**
- Student receives link request
- Student (or existing guardian) must approve
- Both parties notified upon approval
- Link appears in both profiles

### Viewing Parent-Child Links

- View all relationships in user profile
- See approval status
- Check link creation date
- View relationship type

### Removing Links

1. Navigate to parent or student profile
2. Click "Manage Relationships"
3. Select relationship to remove
4. Confirm removal
5. Both parties notified

## User Statistics

### Individual User Stats

**Activity Metrics:**
- Total login count
- Average session duration
- Last login date/time
- Most active times

**Learning Metrics (Students):**
- Courses enrolled
- Courses completed
- Lessons watched
- Assignments submitted
- Average quiz scores
- Study time (hours)

**Teaching Metrics (Teachers):**
- Courses created
- Total students taught
- Assignments graded
- Average course rating
- Forum posts moderated

**Engagement Metrics:**
- Forum posts created
- Comments/replies made
- Upvotes received
- Achievements earned
- Points accumulated

### System-Wide Statistics

Access from Admin Dashboard:
- Total registered users
- Active users (last 30 days)
- Users by role distribution
- New registrations (daily/weekly/monthly)
- Peak usage times
- Geographic distribution

## Security & Audit

### Viewing User Activity Logs

1. Navigate to user profile
2. Click "Activity Log" tab
3. View chronological activity:
   - Login attempts
   - Profile changes
   - Role changes
   - Course enrollments
   - Content creation
   - Suspicious activities

### Security Alerts

**Monitor for:**
- Multiple failed login attempts
- Unusual login locations
- Rapid role escalation requests
- Suspicious data access patterns
- Multiple account violations

**Taking Action:**
- Investigate flagged activities
- Contact user for verification
- Suspend account if necessary
- Report to security team

### Audit Trail

All admin actions are logged:
- User profile views
- Profile modifications
- Role changes
- Account suspensions
- Password resets
- Bulk operations

**Audit Log Includes:**
- Admin user ID
- Action performed
- Target user ID
- Timestamp
- IP address
- User agent

## Best Practices

### User Management Guidelines

1. **Regular Audits:** Review user accounts monthly
2. **Role Verification:** Verify teacher/admin roles quarterly
3. **Inactive Accounts:** Review accounts with no activity for 6+ months
4. **Security Reviews:** Check audit logs weekly
5. **Parent Verification:** Verify parent-child relationships
6. **Contact Information:** Ensure contact info is current

### Security Best Practices

1. **Least Privilege:** Assign minimum necessary role
2. **Admin Limits:** Limit number of admin accounts
3. **Regular Reviews:** Review admin access quarterly
4. **Secure Communication:** Use secure channels for sensitive info
5. **Document Changes:** Document all significant role changes
6. **Backup:** Regular backups before bulk operations

### Privacy Compliance

1. **GDPR Compliance:** Honor data deletion requests
2. **Data Minimization:** Collect only necessary data
3. **Access Logs:** Log all profile access
4. **Consent:** Verify parental consent for minors
5. **Data Export:** Provide data exports on request

## Troubleshooting

### Common Issues

**User Cannot Log In:**
- Check account status (active/suspended)
- Verify email confirmation
- Check for password reset requests
- Review security audit log

**Role Not Applied:**
- Verify role change in audit log
- Ask user to refresh/re-login
- Check for RLS policy issues
- Verify database synchronization

**Parent Cannot See Child:**
- Verify relationship exists
- Check approval status
- Verify both accounts active
- Check privacy settings

**Bulk Operation Failed:**
- Check operation size (max 100 users)
- Verify permissions
- Check error logs
- Try smaller batches

## Support

For user management issues:
- Check security audit logs
- Review user activity history
- Contact technical support: info@safhub.com
- Escalate to system administrator if needed
