# EdHub - Ethiopian Online Learning Platform

<div align="center">
  <h3>🎓 Empowering Ethiopian Students Through Technology 🇪🇹</h3>
  <p>A comprehensive online learning platform with role-based access, gamification, and community features</p>
</div>

---

## 🚀 Quick Start

Get EdHub running locally in 5 steps:

```bash
# 1. Clone the repository
git clone https://github.com/kenzyflash/yet-ephrat-academy
cd yet-ephrat-academy

# 2. Install dependencies
npm install

# 3. Start development server
npm run dev

# 4. Open your browser
# Navigate to http://localhost:5173

# 5. Create an account and start learning!
```

---

## 📚 Documentation

- **[Complete Platform Documentation](docs/SafHub-Platform-Documentation.md)** - Comprehensive guide covering all aspects (note: filename retained for compatibility)
- **[Developer Guide](docs/developer/DEVELOPER-GUIDE.md)** - Technical implementation details
- **[Admin Manual](docs/admin/ADMIN-GUIDE.md)** - Platform administration guide
- **[User Guides](docs/user/)** - Student, Teacher, and Parent guides

### Quick Links
- [API Reference](docs/API-ENDPOINTS.md)
- [Testing Guide](docs/TESTING.md)
- [Deployment Guide](docs/DEPLOYMENT.md)
- [Security Guidelines](docs/SECURITY.md)
- [Troubleshooting](docs/TROUBLESHOOTING.md)

---

## 🛠️ Technology Stack

### Frontend
- **React 18.3.1** - Modern UI library
- **TypeScript** - Type-safe development
- **Vite** - Lightning-fast build tool
- **Tailwind CSS** - Utility-first styling
- **shadcn/ui** - Beautiful component library
- **React Router v6** - Client-side routing
- **TanStack Query** - Data fetching & caching

### Backend
- **Supabase** - Backend-as-a-Service
  - PostgreSQL database
  - Authentication & user management
  - Row Level Security (RLS)
  - Real-time subscriptions
  - File storage (4 buckets)
  - Edge functions

### Additional Libraries
- React Hook Form + Zod - Form validation
- Recharts - Data visualization
- Lucide React - Icon library
- date-fns - Date manipulation
- Sonner - Toast notifications

---

## ✨ Key Features

### 🎯 Multi-Role System
- **Students** - Course enrollment, progress tracking, achievements
- **Teachers** - Course creation, assignment management, grading
- **Parents** - Child progress monitoring, performance tracking
- **Admins** - User management, content moderation, system administration

### 📖 Learning Management
- Video-based lessons with progress tracking
- Assignment creation and submission system
- Course discussions and forums
- Real-time progress monitoring
- Completion certificates

### 🏆 Gamification
- Achievement system with 20+ achievements
- Point accumulation and leveling (1-5)
- Study goals and tracking
- Weekly progress reports
- Leaderboards (coming soon)

### 💬 Community Features
- Multi-category forums
- Course-specific discussions
- Upvote/downvote voting system
- Threaded replies
- Anonymous user IDs for privacy

### 🔒 Security
- Row Level Security (RLS) policies
- Comprehensive audit logging
- Role-based access control (RBAC)
- Data anonymization in public contexts
- Secure admin functions

### 🌍 Multi-Language Support
- English (Default)
- Amharic (አማርኛ)
- Easy language switching
- Localized content

---

## 📁 Project Structure

```
EdHub/
├── src/
│   ├── components/          # Reusable UI components
│   │   ├── auth/           # Authentication components
│   │   ├── dashboard/      # Dashboard components
│   │   ├── forum/          # Forum components
│   │   ├── student/        # Student-specific components
│   │   ├── gamification/   # Gamification components
│   │   ├── security/       # Security components
│   │   └── ui/             # shadcn/ui components
│   ├── contexts/           # React contexts (Auth, Language)
│   ├── hooks/              # Custom React hooks
│   ├── pages/              # Page components
│   ├── translations/       # Language files (en.json, am.json)
│   └── integrations/       # External integrations (Supabase)
├── supabase/
│   ├── migrations/         # Database migrations
│   └── config.toml         # Supabase configuration
├── docs/                   # Documentation
└── public/                 # Static assets
```

---

## 🔧 Development

### Prerequisites
- Node.js v18+ or Bun
- npm or bun package manager
- Supabase account (for backend)

### Environment Setup
The project uses Supabase with embedded credentials. No `.env` file needed for development.

### Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Run ESLint
```

### Code Quality
- TypeScript strict mode enabled
- ESLint for code linting
- Prettier for code formatting (recommended)
- Component-based architecture
- Custom hooks for reusability

---

## 🚢 Deployment

### Build for Production
```bash
npm run build
```

### Hosting Options
- **Vercel** (Recommended) - Automatic deployments from Git
- **Netlify** - Simple drag-and-drop deployment
- **GitHub Pages** - Free hosting for static sites
- **Custom Server** - Node.js or any static file server

### Database Migrations
Ensure all migrations are applied before deploying:
```bash
supabase db push
```

See [Deployment Guide](docs/DEPLOYMENT.md) for detailed instructions.

---

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. **Fork the repository**
2. **Create a feature branch** (`git checkout -b feature/amazing-feature`)
3. **Commit your changes** (`git commit -m 'Add amazing feature'`)
4. **Push to the branch** (`git push origin feature/amazing-feature`)
5. **Open a Pull Request**

### Contribution Guidelines
- Follow the existing code style
- Write meaningful commit messages
- Add tests for new features
- Update documentation as needed
- Ensure all tests pass before submitting

See [Contributing Guide](docs/developer/CONTRIBUTING.md) for detailed guidelines.

---

## 🧪 Testing

```bash
# Run unit tests
npm run test

# Run integration tests
npm run test:integration

# Run E2E tests
npm run test:e2e
```

See [Testing Guide](docs/TESTING.md) for more information.

---

## 📊 Database Schema

EdHub uses Supabase (PostgreSQL) with the following core tables:
- `profiles` - User profile information
- `user_roles` - Role-based access control
- `courses` - Course metadata
- `lessons` - Lesson content
- `course_enrollments` - User course relationships
- `lesson_progress` - Progress tracking
- `achievements` - Gamification achievements
- `forums` & `forum_posts` - Community features
- `security_audit_log` - Audit trail

See [Database Schema Documentation](docs/developer/DATABASE-SCHEMA.md) for complete schema details.

---

## 🔐 Security

EdHub implements multiple layers of security:
- **Row Level Security (RLS)** on all tables
- **Audit logging** for sensitive operations
- **Role-based access control (RBAC)**
- **Data anonymization** in public contexts
- **Secure admin functions**
- **Input validation** with Zod schemas

See [Security Guidelines](docs/SECURITY.md) for best practices.

---

## 📝 License

This project is part of an educational initiative. All rights reserved by the EdHub team.

---

## 👥 Team

### Project Leader
**Kaleab Fikru**

### Team Members
1. Fiker Ayalneh
2. Fikir Nigusse
3. Fison Nasir
4. Hanan Feisel
5. Hasset Yonas
6. Helina Abush
7. Hiba Jemal
8. Husniya Kedir

---

## 📞 Support

Need help? Reach out to us:

- **Email:** info@edhub.com
- **Phone:** +251 (911) 123-456
- **Address:** Education Center, Addis Ababa, Ethiopia
- **Documentation:** [docs.edhub.com](https://docs.edhub.com) (coming soon)

---

## 🙏 Acknowledgments

- Built with [Lovable](https://lovable.dev)
- Powered by [Supabase](https://supabase.com)
- UI components from [shadcn/ui](https://ui.shadcn.com)
- Icons by [Lucide](https://lucide.dev)

---

<div align="center">
  <p>Made with ❤️ for Ethiopian Students</p>
  <p>🇪🇹 Empowering Education Through Technology 🇪🇹</p>
</div>
