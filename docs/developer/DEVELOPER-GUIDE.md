# Developer Guide

## Getting Started

### Prerequisites
- Node.js 18+
- npm or bun
- Git
- Code editor (VS Code recommended)

### Setup
```bash
git clone https://github.com/kenzyflash/yet-ephrat-academy
cd yet-ephrat-academy
npm install
npm run dev
```

## Project Structure
- `src/components/` - React components
- `src/pages/` - Page components
- `src/hooks/` - Custom hooks
- `src/contexts/` - Context providers
- `src/integrations/` - Supabase integration
- `supabase/migrations/` - Database migrations

## Technology Stack
- React 18.3.1 + TypeScript
- Vite build tool
- Tailwind CSS styling
- Supabase backend
- TanStack Query for data fetching
- React Router for routing

## Development Workflow
1. Create feature branch
2. Make changes
3. Test locally
4. Commit with meaningful message
5. Push and create PR
6. Code review
7. Merge to main

## Code Standards
- Use TypeScript strict mode
- Follow React best practices
- Use semantic HTML
- Implement proper error handling
- Write meaningful comments
- Test your code

## Useful Commands
```bash
npm run dev      # Start dev server
npm run build    # Build for production
npm run lint     # Run linting
npm run test     # Run tests
```

See [Contributing Guide](CONTRIBUTING.md) for detailed guidelines.
