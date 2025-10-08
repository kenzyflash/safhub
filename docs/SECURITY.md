# Security Guidelines

## Authentication
- Email/password with Supabase Auth
- JWT token-based sessions
- Secure password requirements

## Row-Level Security (RLS)
All tables have RLS policies enforcing:
- Users access only their own data
- Role-based permissions
- Audit logging for sensitive operations

## Data Protection
- Profile access requires logging
- Admin operations via secure functions
- Student data anonymized in public contexts
- Contact inquiries admin-only

## Best Practices
1. Never bypass RLS policies
2. Use secure functions for admin operations
3. Validate all user inputs
4. Implement audit logging
5. Use parameterized queries
6. Regular security audits

## Audit Logging
All sensitive operations logged with:
- User ID, action, timestamp
- IP address and user agent
- Resource type and ID
- Admin-only access

## Common Vulnerabilities
- SQL Injection: Use parameterized queries
- XSS: Sanitize user inputs
- CSRF: Use Supabase built-in protection
- Privilege Escalation: Enforce role checks
