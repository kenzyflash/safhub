

# Plan: Full Amharic Translation for All Pages

## Problem

Currently, only the Header, Footer, and navigation links use the `t()` translation function. All page content (Index, About, Contact, Courses, dashboards, etc.) has hardcoded English strings -- features array, stats, testimonials, FAQs, course listings, form labels, and more are all static English text.

When a user switches to Amharic, only the nav/header/footer change. The body content stays in English.

## Approach

Expand the translation system so that every user-facing string on every page goes through `t()`. This requires two parallel workstreams:

### 1. Expand translation files

Add comprehensive Amharic and English keys to both `src/translations/en.json` and `src/translations/am.json` covering:

- **Index page**: Hero title, subtitle, CTA buttons, stats labels, feature cards (titles + descriptions), featured courses, testimonials, FAQ questions/answers, CTA section
- **About page**: All value cards, team section, mission/vision text, stats
- **Courses page**: Filter labels, category names, level names, course card content, search placeholder
- **Contact page**: Form labels, validation messages, section headings, contact info labels
- **Dashboards** (Student, Teacher, Admin, Parent): Tab labels, section headings, stat labels, button text
- **Forum pages**: Post labels, comment text, create buttons
- **Gamification page**: Achievement labels, progress text
- **Auth modals**: Already partially translated; fill any gaps
- **Certificate generator**: Certificate text strings

Estimated: ~200-300 new translation keys per language file.

### 2. Update all page components to use `t()`

Each page component will:
1. Import `useLanguage` and call `const { t } = useLanguage()`
2. Replace every hardcoded English string with `t('section.key')`

**Pages to update:**
- `src/pages/Index.tsx` -- features, stats, testimonials, FAQs, hero, CTA (~40 strings)
- `src/pages/About.tsx` -- values, team, mission (~30 strings)
- `src/pages/Contact.tsx` -- form labels, headings (~15 strings)
- `src/pages/Courses.tsx` -- categories, levels, course cards (~25 strings)
- `src/pages/CoursePage.tsx` -- lesson content, buttons (~15 strings)
- `src/pages/StudentDashboard.tsx` -- stats, tabs, labels (~20 strings)
- `src/pages/TeacherDashboard.tsx` -- similar scope
- `src/pages/AdminDashboard.tsx` -- similar scope
- `src/pages/ParentDashboard.tsx` -- similar scope
- `src/pages/ForumPage.tsx`, `ForumDetailPage.tsx`, `ForumPostDetailPage.tsx`
- `src/pages/GamificationPage.tsx`
- `src/components/auth/LoginModal.tsx`, `RegisterModal.tsx`
- `src/components/Footer.tsx` (partially done, verify completeness)
- `src/utils/generateCertificate.ts` -- certificate text

### 3. RTL/font considerations

Amharic is left-to-right (like English), so no RTL changes are needed. However, we should ensure the `lang="am"` attribute is set on `<html>` (already handled in LanguageContext) for proper rendering.

## File Changes Summary

| File | Change |
|------|--------|
| `src/translations/en.json` | Add ~200 new keys for all pages |
| `src/translations/am.json` | Add ~200 matching Amharic translations |
| `src/pages/Index.tsx` | Replace all hardcoded strings with `t()` |
| `src/pages/About.tsx` | Replace all hardcoded strings with `t()` |
| `src/pages/Contact.tsx` | Replace all hardcoded strings with `t()` |
| `src/pages/Courses.tsx` | Replace all hardcoded strings with `t()` |
| `src/pages/CoursePage.tsx` | Replace all hardcoded strings with `t()` |
| `src/pages/StudentDashboard.tsx` | Replace all hardcoded strings with `t()` |
| `src/pages/TeacherDashboard.tsx` | Replace all hardcoded strings with `t()` |
| `src/pages/AdminDashboard.tsx` | Replace all hardcoded strings with `t()` |
| `src/pages/ParentDashboard.tsx` | Replace all hardcoded strings with `t()` |
| `src/pages/ForumPage.tsx` | Replace all hardcoded strings with `t()` |
| `src/pages/ForumDetailPage.tsx` | Replace all hardcoded strings with `t()` |
| `src/pages/ForumPostDetailPage.tsx` | Replace all hardcoded strings with `t()` |
| `src/pages/GamificationPage.tsx` | Replace all hardcoded strings with `t()` |
| `src/components/auth/LoginModal.tsx` | Verify/complete `t()` usage |
| `src/components/auth/RegisterModal.tsx` | Verify/complete `t()` usage |
| `src/utils/generateCertificate.ts` | Accept translated strings |

No new dependencies, routes, or database changes required.

