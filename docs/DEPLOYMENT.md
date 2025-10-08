# Deployment Guide

This guide covers deploying the SafHub platform to production environments.

## Table of Contents
- [Pre-Deployment Checklist](#pre-deployment-checklist)
- [Environment Configuration](#environment-configuration)
- [Database Migration](#database-migration)
- [Vercel Deployment](#vercel-deployment)
- [Netlify Deployment](#netlify-deployment)
- [Custom Server Deployment](#custom-server-deployment)
- [Domain Configuration](#domain-configuration)
- [SSL Certificate](#ssl-certificate)
- [Post-Deployment Verification](#post-deployment-verification)
- [Monitoring & Maintenance](#monitoring--maintenance)

---

## Pre-Deployment Checklist

### Code Quality
- [ ] All tests passing (`npm run test`)
- [ ] No TypeScript errors (`npm run build`)
- [ ] No linting errors (`npm run lint`)
- [ ] Code reviewed and approved
- [ ] Latest changes merged to main branch

### Security
- [ ] All RLS policies reviewed and tested
- [ ] Audit logging verified
- [ ] Security scan completed
- [ ] Sensitive data removed from code
- [ ] API keys secured in environment variables

### Database
- [ ] All migrations applied successfully
- [ ] Database backup created
- [ ] Test data removed
- [ ] Production data seeded (if applicable)
- [ ] Database indexes optimized

### Performance
- [ ] Build size optimized
- [ ] Images compressed
- [ ] Lazy loading implemented
- [ ] Bundle analyzed
- [ ] Performance benchmarks met

### Documentation
- [ ] README updated
- [ ] API documentation current
- [ ] Deployment docs reviewed
- [ ] Environment variables documented

---

## Environment Configuration

### Supabase Configuration

The SafHub platform uses embedded Supabase credentials. For production:

1. **Create Production Supabase Project**
   - Go to [Supabase Dashboard](https://app.supabase.com)
   - Create new project for production
   - Note project URL and anon key

2. **Update Credentials**
   
   Edit `src/integrations/supabase/client.ts`:
   ```typescript
   const supabaseUrl = "YOUR_PRODUCTION_URL";
   const supabaseAnonKey = "YOUR_PRODUCTION_ANON_KEY";
   ```

### Build Configuration

Create production build:
```bash
npm run build
```

This creates optimized files in `dist/` directory.

---

## Database Migration

### Apply Migrations

1. **Install Supabase CLI**
   ```bash
   npm install -g supabase
   ```

2. **Link to Production Project**
   ```bash
   supabase link --project-ref YOUR_PROJECT_ID
   ```

3. **Apply Migrations**
   ```bash
   supabase db push
   ```

4. **Verify Migrations**
   ```bash
   supabase db diff
   ```

### Manual Migration (if needed)

If CLI fails, apply migrations manually:

1. Go to Supabase Dashboard → SQL Editor
2. Copy migration files from `supabase/migrations/`
3. Execute in order (by timestamp)
4. Verify tables created:
   ```sql
   SELECT table_name 
   FROM information_schema.tables 
   WHERE table_schema = 'public';
   ```

### Seed Production Data

Create initial data:
```sql
-- Create initial achievements
INSERT INTO achievements (name, description, icon, points, category) VALUES
  ('First Login', 'Log in for the first time', '🎉', 10, 'milestone'),
  ('Profile Setup', 'Complete your profile', '✅', 15, 'milestone'),
  ('First Course', 'Enroll in your first course', '📚', 20, 'learning');

-- Add more seed data as needed
```

---

## Vercel Deployment

### Method 1: Git Integration (Recommended)

1. **Push to GitHub**
   ```bash
   git push origin main
   ```

2. **Import to Vercel**
   - Go to [Vercel Dashboard](https://vercel.com)
   - Click "New Project"
   - Import your GitHub repository
   - Vercel auto-detects Vite configuration

3. **Configure Build Settings**
   - Framework Preset: Vite
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Install Command: `npm install`

4. **Deploy**
   - Click "Deploy"
   - Wait for deployment to complete
   - Access your site at: `your-project.vercel.app`

### Method 2: Vercel CLI

1. **Install Vercel CLI**
   ```bash
   npm install -g vercel
   ```

2. **Login**
   ```bash
   vercel login
   ```

3. **Deploy**
   ```bash
   vercel --prod
   ```

4. **Follow Prompts**
   - Confirm project settings
   - Set up domain (optional)

### Vercel Environment Variables

If using environment variables (future enhancement):

1. Go to Project Settings → Environment Variables
2. Add variables:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
3. Redeploy to apply

---

## Netlify Deployment

### Method 1: Drag & Drop

1. **Build Project**
   ```bash
   npm run build
   ```

2. **Deploy to Netlify**
   - Go to [Netlify](https://app.netlify.com)
   - Drag `dist` folder to deploy zone
   - Site goes live immediately

### Method 2: Git Integration

1. **Connect Repository**
   - New site from Git
   - Choose GitHub repository
   - Authorize Netlify

2. **Configure Build**
   - Build command: `npm run build`
   - Publish directory: `dist`
   - Branch: `main`

3. **Deploy**
   - Click "Deploy site"
   - Access at: `random-name.netlify.app`

### Method 3: Netlify CLI

1. **Install CLI**
   ```bash
   npm install -g netlify-cli
   ```

2. **Login**
   ```bash
   netlify login
   ```

3. **Initialize**
   ```bash
   netlify init
   ```

4. **Deploy**
   ```bash
   netlify deploy --prod
   ```

### Netlify Configuration

Create `netlify.toml`:
```toml
[build]
  command = "npm run build"
  publish = "dist"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200

[build.environment]
  NODE_VERSION = "18"
```

---

## Custom Server Deployment

### Node.js Server

1. **Install Serve**
   ```bash
   npm install -g serve
   ```

2. **Serve Build**
   ```bash
   serve -s dist -p 80
   ```

### Nginx Configuration

Create `/etc/nginx/sites-available/safhub`:
```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;
    root /var/www/safhub/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # Gzip compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;

    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

Enable site:
```bash
sudo ln -s /etc/nginx/sites-available/safhub /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### PM2 Process Manager

For Node.js server:
```bash
# Install PM2
npm install -g pm2

# Start server
pm2 start "serve -s dist -p 3000" --name safhub

# Save process list
pm2 save

# Auto-start on reboot
pm2 startup
```

### Docker Deployment

Create `Dockerfile`:
```dockerfile
FROM node:18-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

Create `nginx.conf`:
```nginx
server {
    listen 80;
    location / {
        root /usr/share/nginx/html;
        index index.html;
        try_files $uri $uri/ /index.html;
    }
}
```

Build and run:
```bash
docker build -t safhub .
docker run -p 80:80 safhub
```

---

## Domain Configuration

### Custom Domain Setup

#### Vercel
1. Go to Project Settings → Domains
2. Add your domain: `yourdomain.com`
3. Add DNS records at your registrar:
   ```
   Type: A
   Name: @
   Value: 76.76.21.21

   Type: CNAME
   Name: www
   Value: cname.vercel-dns.com
   ```

#### Netlify
1. Go to Domain Settings → Add custom domain
2. Add DNS records:
   ```
   Type: A
   Name: @
   Value: 75.2.60.5

   Type: CNAME
   Name: www
   Value: [your-site].netlify.app
   ```

#### Custom Server
Point A record to your server IP:
```
Type: A
Name: @
Value: YOUR_SERVER_IP

Type: A
Name: www
Value: YOUR_SERVER_IP
```

---

## SSL Certificate

### Automatic SSL (Vercel/Netlify)

SSL is automatically provisioned and renewed. No action needed.

### Manual SSL with Certbot (Custom Server)

1. **Install Certbot**
   ```bash
   sudo apt install certbot python3-certbot-nginx
   ```

2. **Obtain Certificate**
   ```bash
   sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
   ```

3. **Auto-Renewal**
   ```bash
   sudo certbot renew --dry-run
   ```

Certbot adds cron job for automatic renewal.

---

## Post-Deployment Verification

### Functionality Testing

Test all critical workflows:

1. **Authentication**
   - [ ] Sign up works
   - [ ] Sign in works
   - [ ] Sign out works
   - [ ] Password reset works (if implemented)

2. **Course Management**
   - [ ] Browse courses
   - [ ] Enroll in course
   - [ ] View lessons
   - [ ] Complete lessons
   - [ ] Submit assignments

3. **User Roles**
   - [ ] Student dashboard loads
   - [ ] Teacher dashboard loads
   - [ ] Admin dashboard loads
   - [ ] Parent dashboard loads
   - [ ] Role-specific features work

4. **Community Features**
   - [ ] Forum posts work
   - [ ] Course discussions work
   - [ ] Voting works
   - [ ] Replies work

5. **Gamification**
   - [ ] Achievements awarded
   - [ ] Points tracked
   - [ ] Goals can be set
   - [ ] Progress displayed

### Performance Testing

```bash
# Test page load times
curl -o /dev/null -s -w "Time: %{time_total}s\n" https://yourdomain.com

# Check response codes
curl -I https://yourdomain.com
```

Use tools:
- [Google PageSpeed Insights](https://pagespeed.web.dev/)
- [WebPageTest](https://www.webpagetest.org/)
- [GTmetrix](https://gtmetrix.com/)

### Security Testing

- [ ] HTTPS working (no mixed content)
- [ ] Security headers present
- [ ] No sensitive data in client code
- [ ] RLS policies enforced
- [ ] Audit logging working

Check headers:
```bash
curl -I https://yourdomain.com
```

Should include:
- `Strict-Transport-Security`
- `X-Content-Type-Options`
- `X-Frame-Options`

### Database Verification

```sql
-- Check table counts
SELECT 
  schemaname,
  tablename,
  (SELECT COUNT(*) FROM tablename) as row_count
FROM pg_tables
WHERE schemaname = 'public';

-- Verify RLS enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public';

-- Check recent audit logs
SELECT * FROM security_audit_log 
ORDER BY timestamp DESC 
LIMIT 10;
```

---

## Monitoring & Maintenance

### Application Monitoring

**Vercel Analytics:**
- Enable in Project Settings → Analytics
- Monitor page views, performance

**Sentry Error Tracking:**
```bash
npm install @sentry/react
```

Configure:
```typescript
import * as Sentry from "@sentry/react";

Sentry.init({
  dsn: "YOUR_SENTRY_DSN",
  environment: "production",
});
```

### Database Monitoring

**Supabase Dashboard:**
- Monitor API usage
- Check database size
- Review slow queries
- Monitor storage usage

**Alerts:**
Set up alerts for:
- High CPU usage
- Slow queries
- Storage limits
- API rate limits

### Uptime Monitoring

Use services:
- [UptimeRobot](https://uptimerobot.com/)
- [Pingdom](https://www.pingdom.com/)
- [StatusCake](https://www.statuscake.com/)

Monitor:
- Homepage availability
- API endpoints
- Response times

### Backup Strategy

**Database Backups:**
- Supabase automatic daily backups
- Manual backups before major changes:
  ```bash
  supabase db dump -f backup.sql
  ```

**Code Backups:**
- Git repository on GitHub
- Tagged releases for versions
- Deployment snapshots

### Update Strategy

**Regular Updates:**
```bash
# Update dependencies
npm update

# Check for security vulnerabilities
npm audit

# Fix vulnerabilities
npm audit fix
```

**Deployment Workflow:**
1. Test changes locally
2. Deploy to staging (if available)
3. Run automated tests
4. Deploy to production
5. Verify deployment
6. Monitor for errors

---

## Rollback Procedure

### Vercel/Netlify

1. Go to Deployments
2. Find previous working deployment
3. Click "Promote to Production"

### Custom Server

1. **Using Git:**
   ```bash
   git revert HEAD
   git push origin main
   ```

2. **Using Backup:**
   ```bash
   cd /var/www/safhub
   rm -rf dist
   tar -xzf backup-dist.tar.gz
   sudo systemctl reload nginx
   ```

### Database Rollback

```bash
# Restore from backup
supabase db reset
psql -h db.xxx.supabase.co -U postgres -d postgres -f backup.sql
```

---

## Troubleshooting

### Common Issues

**404 on Refresh:**
- **Cause:** SPA routing not configured
- **Fix:** Add redirect rules (see Netlify/Nginx configs above)

**Slow Load Times:**
- Check bundle size: `npm run build -- --analyze`
- Optimize images
- Enable CDN
- Add caching headers

**Database Connection Errors:**
- Verify Supabase project is active
- Check credentials
- Review RLS policies
- Check API rate limits

**Build Failures:**
- Clear `node_modules`: `rm -rf node_modules && npm install`
- Check Node version: `node -v` (should be 18+)
- Review build logs for errors

---

## Support

For deployment issues:
- Check [Vercel Documentation](https://vercel.com/docs)
- Check [Netlify Documentation](https://docs.netlify.com)
- Check [Supabase Documentation](https://supabase.com/docs)
- Contact team at info@safhub.com
