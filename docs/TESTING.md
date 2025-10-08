# Testing Procedures

This document outlines testing procedures, strategies, and best practices for the SafHub platform.

## Table of Contents
- [Testing Strategy](#testing-strategy)
- [Unit Testing](#unit-testing)
- [Integration Testing](#integration-testing)
- [End-to-End Testing](#end-to-end-testing)
- [Security Testing](#security-testing)
- [Performance Testing](#performance-testing)
- [Testing Checklist](#testing-checklist)

---

## Testing Strategy

### Testing Pyramid

```
        /\
       /  \
      / E2E \
     /--------\
    /Integration\
   /--------------\
  /   Unit Tests   \
 /------------------\
```

**Unit Tests (70%):** Test individual components and functions
**Integration Tests (20%):** Test component interactions and API calls
**E2E Tests (10%):** Test complete user workflows

---

## Unit Testing

### Setup

```bash
# Install testing dependencies
npm install --save-dev @testing-library/react @testing-library/jest-dom @testing-library/user-event vitest jsdom
```

### Configuration

Create `vitest.config.ts`:
```typescript
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
```

Create `src/test/setup.ts`:
```typescript
import '@testing-library/jest-dom';
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

afterEach(() => {
  cleanup();
});
```

### Component Testing

#### Example: Button Component Test
```typescript
// src/components/ui/button.test.tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { Button } from './button';

describe('Button Component', () => {
  it('renders with correct text', () => {
    render(<Button>Click Me</Button>);
    expect(screen.getByText('Click Me')).toBeInTheDocument();
  });

  it('calls onClick handler when clicked', async () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Click Me</Button>);
    
    await userEvent.click(screen.getByText('Click Me'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('applies variant styles correctly', () => {
    const { container } = render(
      <Button variant="destructive">Delete</Button>
    );
    
    expect(container.firstChild).toHaveClass('bg-destructive');
  });

  it('is disabled when disabled prop is true', () => {
    render(<Button disabled>Disabled</Button>);
    expect(screen.getByText('Disabled')).toBeDisabled();
  });
});
```

### Custom Hook Testing

#### Example: useAuth Hook Test
```typescript
// src/hooks/useAuth.test.ts
import { renderHook, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { useAuth } from './useAuth';

describe('useAuth Hook', () => {
  it('returns null user initially', () => {
    const { result } = renderHook(() => useAuth());
    expect(result.current.user).toBeNull();
  });

  it('loads user on mount', async () => {
    const { result } = renderHook(() => useAuth());
    
    await waitFor(() => {
      expect(result.current.user).not.toBeNull();
    });
  });
});
```

### Utility Function Testing

#### Example: Validation Function Test
```typescript
// src/utils/validation.test.ts
import { describe, it, expect } from 'vitest';
import { validateEmail, validatePassword } from './validation';

describe('Validation Utilities', () => {
  describe('validateEmail', () => {
    it('accepts valid email addresses', () => {
      expect(validateEmail('test@example.com')).toBe(true);
      expect(validateEmail('user+tag@domain.co.uk')).toBe(true);
    });

    it('rejects invalid email addresses', () => {
      expect(validateEmail('invalid')).toBe(false);
      expect(validateEmail('test@')).toBe(false);
      expect(validateEmail('@example.com')).toBe(false);
    });
  });

  describe('validatePassword', () => {
    it('accepts strong passwords', () => {
      expect(validatePassword('StrongPass123!')).toBe(true);
    });

    it('rejects weak passwords', () => {
      expect(validatePassword('weak')).toBe(false);
      expect(validatePassword('12345678')).toBe(false);
    });
  });
});
```

### Running Unit Tests

```bash
# Run all tests
npm run test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

---

## Integration Testing

### API Integration Tests

#### Example: Course Service Test
```typescript
// src/services/courseService.test.ts
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createClient } from '@supabase/supabase-js';

describe('Course Service Integration', () => {
  let supabase: any;
  let testCourseId: string;

  beforeAll(async () => {
    supabase = createClient(
      process.env.VITE_SUPABASE_URL!,
      process.env.VITE_SUPABASE_ANON_KEY!
    );
  });

  it('creates a course successfully', async () => {
    const courseData = {
      title: 'Test Course',
      description: 'Test Description',
      category: 'Math',
      level: 'Beginner',
      instructor_id: 'test-user-id'
    };

    const { data, error } = await supabase
      .from('courses')
      .insert(courseData)
      .select()
      .single();

    expect(error).toBeNull();
    expect(data).toBeDefined();
    expect(data.title).toBe('Test Course');
    
    testCourseId = data.id;
  });

  it('retrieves course by id', async () => {
    const { data, error } = await supabase
      .from('courses')
      .select('*')
      .eq('id', testCourseId)
      .single();

    expect(error).toBeNull();
    expect(data.id).toBe(testCourseId);
  });

  afterAll(async () => {
    // Cleanup test data
    await supabase
      .from('courses')
      .delete()
      .eq('id', testCourseId);
  });
});
```

### Component Integration Tests

#### Example: Course Card Integration Test
```typescript
// src/components/CourseCard.integration.test.tsx
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { describe, it, expect } from 'vitest';
import { CourseCard } from './CourseCard';

describe('CourseCard Integration', () => {
  const queryClient = new QueryClient();

  it('enrolls user in course when button clicked', async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <CourseCard
          course={{
            id: 'test-id',
            title: 'Test Course',
            description: 'Description',
            instructor_id: 'instructor-id'
          }}
        />
      </QueryClientProvider>
    );

    const enrollButton = screen.getByText('Enroll Now');
    await userEvent.click(enrollButton);

    await waitFor(() => {
      expect(screen.getByText('Enrolled')).toBeInTheDocument();
    });
  });
});
```

---

## End-to-End Testing

### Setup Playwright

```bash
npm install --save-dev @playwright/test
npx playwright install
```

### Configuration

Create `playwright.config.ts`:
```typescript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
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
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
  },
});
```

### E2E Test Examples

#### Student Course Enrollment Flow
```typescript
// e2e/student-enrollment.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Student Course Enrollment', () => {
  test('complete enrollment workflow', async ({ page }) => {
    // Navigate to home page
    await page.goto('/');

    // Sign in as student
    await page.click('text=Sign In');
    await page.fill('input[type="email"]', 'student@test.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button:has-text("Sign In")');

    // Wait for dashboard
    await expect(page).toHaveURL('/student');

    // Browse courses
    await page.click('text=Browse Courses');
    await expect(page).toHaveURL('/courses');

    // Select a course
    await page.click('.course-card').first();

    // Enroll in course
    await page.click('button:has-text("Enroll Now")');
    await expect(page.locator('text=Enrolled Successfully')).toBeVisible();

    // Verify enrollment in dashboard
    await page.goto('/student');
    await expect(page.locator('.enrolled-course')).toBeVisible();
  });
});
```

#### Teacher Course Creation Flow
```typescript
// e2e/teacher-course-creation.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Teacher Course Creation', () => {
  test('create course with lessons', async ({ page }) => {
    // Sign in as teacher
    await page.goto('/');
    await page.click('text=Sign In');
    await page.fill('input[type="email"]', 'teacher@test.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button:has-text("Sign In")');

    // Navigate to teacher dashboard
    await expect(page).toHaveURL('/teacher');

    // Create new course
    await page.click('button:has-text("Create Course")');
    await page.fill('input[name="title"]', 'E2E Test Course');
    await page.fill('textarea[name="description"]', 'Test Description');
    await page.selectOption('select[name="category"]', 'Math');
    await page.click('button:has-text("Create")');

    // Verify success
    await expect(page.locator('text=Course created successfully')).toBeVisible();

    // Add a lesson
    await page.click('button:has-text("Add Lesson")');
    await page.fill('input[name="lessonTitle"]', 'Lesson 1');
    await page.fill('textarea[name="lessonDescription"]', 'Lesson Description');
    await page.click('button:has-text("Save Lesson")');

    // Verify lesson added
    await expect(page.locator('text=Lesson 1')).toBeVisible();
  });
});
```

### Running E2E Tests

```bash
# Run all E2E tests
npx playwright test

# Run in headed mode
npx playwright test --headed

# Run specific test file
npx playwright test e2e/student-enrollment.spec.ts

# Show report
npx playwright show-report
```

---

## Security Testing

### RLS Policy Testing

#### Test Student Data Access
```sql
-- Test as student (can only see own data)
SET LOCAL ROLE authenticated;
SET LOCAL request.jwt.claim.sub = 'student-uuid';

-- Should return only student's enrollments
SELECT * FROM course_enrollments;

-- Should fail (trying to access other student's data)
SELECT * FROM profiles WHERE id != 'student-uuid';
```

#### Test Admin Access
```sql
-- Test as admin
SET LOCAL ROLE authenticated;
SET LOCAL request.jwt.claim.sub = 'admin-uuid';

-- Should succeed with audit logging
SELECT * FROM get_profiles_for_admin_secure();

-- Verify audit log entry created
SELECT * FROM security_audit_log 
WHERE user_id = 'admin-uuid' 
ORDER BY timestamp DESC 
LIMIT 1;
```

### Authentication Testing

#### Test Invalid Credentials
```typescript
test('rejects invalid credentials', async () => {
  const { error } = await supabase.auth.signInWithPassword({
    email: 'invalid@test.com',
    password: 'wrongpassword'
  });

  expect(error).toBeDefined();
  expect(error?.message).toContain('Invalid');
});
```

#### Test Session Expiry
```typescript
test('handles expired session', async ({ page }) => {
  // Sign in
  await page.goto('/');
  await signIn(page);

  // Clear session storage
  await page.evaluate(() => localStorage.clear());

  // Attempt protected action
  await page.goto('/student');

  // Should redirect to login
  await expect(page).toHaveURL('/');
});
```

### Input Validation Testing

```typescript
test('prevents XSS attacks', async () => {
  const maliciousInput = '<script>alert("XSS")</script>';
  
  const { error } = await supabase
    .from('courses')
    .insert({
      title: maliciousInput,
      description: 'Test'
    });

  // Should be escaped or rejected
  const { data } = await supabase
    .from('courses')
    .select('title')
    .eq('title', maliciousInput)
    .single();

  expect(data?.title).not.toContain('<script>');
});
```

---

## Performance Testing

### Load Testing with k6

```bash
npm install --save-dev k6
```

Create `load-tests/course-list.js`:
```javascript
import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  vus: 100,
  duration: '30s',
};

export default function () {
  const res = http.get('http://localhost:5173/courses');
  
  check(res, {
    'status is 200': (r) => r.status === 200,
    'page loads in < 2s': (r) => r.timings.duration < 2000,
  });

  sleep(1);
}
```

Run load test:
```bash
k6 run load-tests/course-list.js
```

### Component Performance Testing

```typescript
// src/components/CourseList.perf.test.tsx
import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { CourseList } from './CourseList';

describe('CourseList Performance', () => {
  it('renders 100 courses in < 1 second', () => {
    const courses = Array.from({ length: 100 }, (_, i) => ({
      id: `course-${i}`,
      title: `Course ${i}`,
      description: 'Description'
    }));

    const startTime = performance.now();
    render(<CourseList courses={courses} />);
    const endTime = performance.now();

    expect(endTime - startTime).toBeLessThan(1000);
  });
});
```

---

## Testing Checklist

### Pre-Deployment Testing

- [ ] All unit tests passing
- [ ] All integration tests passing
- [ ] All E2E tests passing
- [ ] Security tests passed
- [ ] Performance benchmarks met
- [ ] RLS policies verified
- [ ] Audit logging working
- [ ] Error handling tested
- [ ] Mobile responsive tested
- [ ] Cross-browser tested (Chrome, Firefox, Safari)
- [ ] Accessibility tested (keyboard navigation, screen readers)
- [ ] API rate limiting tested
- [ ] File upload/download tested
- [ ] Email notifications tested (if applicable)

### Role-Based Testing

#### Student Role
- [ ] Can create account
- [ ] Can sign in/out
- [ ] Can browse courses
- [ ] Can enroll in courses
- [ ] Can view lessons
- [ ] Can submit assignments
- [ ] Can participate in discussions
- [ ] Can earn achievements
- [ ] Cannot access teacher features
- [ ] Cannot access admin features

#### Teacher Role
- [ ] Can create courses
- [ ] Can add/edit lessons
- [ ] Can create assignments
- [ ] Can grade submissions
- [ ] Can view student progress
- [ ] Can create forums
- [ ] Cannot access admin features
- [ ] Cannot modify other teachers' courses

#### Parent Role
- [ ] Can view children's progress
- [ ] Can monitor study time
- [ ] Can view achievements
- [ ] Cannot access courses
- [ ] Cannot modify data

#### Admin Role
- [ ] Can manage users
- [ ] Can assign roles
- [ ] Can access all courses
- [ ] Can view audit logs
- [ ] Can manage contact inquiries
- [ ] Can access all features

### Security Testing Checklist

- [ ] SQL injection prevention tested
- [ ] XSS attack prevention tested
- [ ] CSRF protection verified
- [ ] Authentication working correctly
- [ ] Authorization working correctly
- [ ] RLS policies enforced
- [ ] Audit logging functional
- [ ] Sensitive data protected
- [ ] File upload security verified
- [ ] Rate limiting working

---

## Best Practices

1. **Write tests first (TDD)** when possible
2. **Keep tests isolated** - no dependencies between tests
3. **Use meaningful test names** - describe what is being tested
4. **Test edge cases** - not just happy paths
5. **Mock external dependencies** - for unit tests
6. **Clean up test data** - in afterEach/afterAll hooks
7. **Run tests before committing** - as part of pre-commit hook
8. **Maintain test coverage** - aim for >80%
9. **Test accessibility** - use screen readers, keyboard navigation
10. **Review test failures** - don't ignore flaky tests

---

## Continuous Integration

### GitHub Actions Example

Create `.github/workflows/test.yml`:
```yaml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run unit tests
        run: npm run test:coverage
      
      - name: Run E2E tests
        run: npx playwright test
      
      - name: Upload coverage
        uses: codecov/codecov-action@v3
```

---

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [Testing Library](https://testing-library.com/)
- [Playwright Documentation](https://playwright.dev/)
- [k6 Documentation](https://k6.io/docs/)
