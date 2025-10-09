# Contributing to SafHub

Thank you for your interest in contributing to SafHub! This guide will help you get started.

## Code of Conduct

- Be respectful and inclusive
- Provide constructive feedback
- Focus on what is best for the community
- Show empathy towards other community members

## Getting Started

### 1. Fork the Repository

```bash
# Fork on GitHub, then clone your fork
git clone https://github.com/YOUR_USERNAME/yet-ephrat-academy
cd yet-ephrat-academy
```

### 2. Set Up Development Environment

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

### 3. Create a Branch

```bash
# Create a feature branch
git checkout -b feature/your-feature-name

# Or a bug fix branch
git checkout -b fix/bug-description
```

## Development Workflow

### Branch Naming Conventions

- `feature/` - New features
- `fix/` - Bug fixes
- `docs/` - Documentation updates
- `refactor/` - Code refactoring
- `test/` - Test additions or updates
- `chore/` - Maintenance tasks

Examples:
- `feature/add-video-streaming`
- `fix/login-error-handling`
- `docs/update-api-reference`

### Commit Message Guidelines

Follow conventional commits format:

```
<type>(<scope>): <subject>

<body>

<footer>
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

**Examples:**
```bash
git commit -m "feat(courses): add video progress tracking"
git commit -m "fix(auth): resolve session timeout issue"
git commit -m "docs(readme): update installation instructions"
```

### Code Style

**TypeScript:**
```typescript
// ✅ Good
interface CourseProps {
  id: string;
  title: string;
  description?: string;
}

const fetchCourse = async (id: string): Promise<Course> => {
  // Implementation
};

// ❌ Bad
const fetchCourse = async (id) => {
  // Missing types
};
```

**React Components:**
```typescript
// ✅ Good - Functional component with TypeScript
interface ButtonProps {
  label: string;
  onClick: () => void;
  variant?: 'primary' | 'secondary';
}

export const Button: React.FC<ButtonProps> = ({ 
  label, 
  onClick, 
  variant = 'primary' 
}) => {
  return (
    <button onClick={onClick} className={`btn-${variant}`}>
      {label}
    </button>
  );
};

// ❌ Bad - Missing types and prop destructuring
export const Button = (props) => {
  return <button onClick={props.onClick}>{props.label}</button>;
};
```

**File Naming:**
- Components: `PascalCase.tsx` (e.g., `CourseCard.tsx`)
- Utilities: `camelCase.ts` (e.g., `formatDate.ts`)
- Hooks: `useCamelCase.ts` (e.g., `useCourseData.ts`)
- Pages: `PascalCase.tsx` (e.g., `StudentDashboard.tsx`)

### Component Structure

```typescript
// 1. Imports
import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';

// 2. Types/Interfaces
interface MyComponentProps {
  // Props
}

// 3. Component
export const MyComponent: React.FC<MyComponentProps> = ({ prop1, prop2 }) => {
  // 4. Hooks
  const [state, setState] = useState();
  const { data } = useQuery({ ... });
  
  // 5. Effects
  useEffect(() => {
    // Side effects
  }, []);
  
  // 6. Handlers
  const handleClick = () => {
    // Handler logic
  };
  
  // 7. Render
  return (
    <div>
      {/* JSX */}
    </div>
  );
};
```

## Testing

### Writing Tests

```typescript
// Example test structure
import { render, screen } from '@testing-library/react';
import { MyComponent } from './MyComponent';

describe('MyComponent', () => {
  it('renders correctly', () => {
    render(<MyComponent />);
    expect(screen.getByText('Expected Text')).toBeInTheDocument();
  });
  
  it('handles user interaction', () => {
    // Test user interactions
  });
});
```

### Run Tests

```bash
# Run all tests
npm run test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

## Database Changes

### Creating Migrations

1. Write SQL migration file in `supabase/migrations/`
2. Follow naming convention: `YYYYMMDDHHMMSS_description.sql`
3. Include both up and down migrations
4. Test locally before committing

```sql
-- Example migration
-- Add column to courses table
ALTER TABLE courses ADD COLUMN IF NOT EXISTS featured BOOLEAN DEFAULT false;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_courses_featured ON courses(featured);

-- Update RLS policy if needed
-- ...
```

### Database Best Practices

- Always use RLS policies
- Index foreign keys
- Use appropriate data types
- Add NOT NULL constraints where appropriate
- Document complex queries
- Test migrations locally

## Pull Request Process

### 1. Update Your Branch

```bash
# Fetch latest changes
git fetch upstream

# Merge main into your branch
git merge upstream/main

# Or rebase if preferred
git rebase upstream/main
```

### 2. Push Your Changes

```bash
git push origin feature/your-feature-name
```

### 3. Create Pull Request

1. Go to GitHub repository
2. Click "New Pull Request"
3. Select your branch
4. Fill out PR template:

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] Tests pass locally
- [ ] Added new tests
- [ ] Manual testing completed

## Screenshots (if applicable)
Add screenshots here

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-reviewed code
- [ ] Commented complex code
- [ ] Updated documentation
- [ ] No new warnings
- [ ] Added tests
- [ ] All tests pass
```

### 4. Code Review

- Address reviewer comments
- Make requested changes
- Push updates to same branch
- Request re-review

### 5. Merge

- Squash and merge preferred
- Delete branch after merge

## Security Considerations

### Never Commit:

- API keys or secrets
- Database credentials
- User data or PII
- `.env` files with sensitive data

### Security Checklist:

- [ ] All user inputs validated
- [ ] SQL injection prevented (use parameterized queries)
- [ ] XSS vulnerabilities addressed
- [ ] Authentication checks in place
- [ ] Authorization/permission checks implemented
- [ ] RLS policies properly configured
- [ ] Audit logging for sensitive operations

## Documentation

### Update Documentation When:

- Adding new features
- Changing existing functionality
- Modifying API endpoints
- Updating database schema
- Changing configuration

### Documentation Files to Update:

- `README.md` - For user-facing changes
- `docs/developer/` - For technical changes
- `docs/admin/` - For admin feature changes
- `docs/user/` - For user feature changes
- Code comments - For complex logic

## Common Issues

### Build Errors

```bash
# Clear cache and reinstall
rm -rf node_modules
npm install

# Clear Vite cache
rm -rf .vite
```

### Type Errors

- Regenerate Supabase types: Check `src/integrations/supabase/types.ts`
- Ensure TypeScript is up to date
- Check for missing type definitions

### Database Issues

- Verify RLS policies
- Check migration order
- Ensure Supabase connection is active

## Getting Help

- **Issues:** Check existing issues or create a new one
- **Discussions:** Use GitHub Discussions for questions
- **Email:** info@safhub.com
- **Documentation:** Read the docs thoroughly

## Recognition

Contributors will be recognized in:
- `README.md` contributors section
- Release notes
- Project documentation

Thank you for contributing to SafHub! 🎓
