# Worky Deployment Guide

This document provides comprehensive instructions for deploying the Worky mobile app to production environments, including environment configuration, build processes, and deployment procedures.

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Environment Configuration](#environment-configuration)
3. [Build Process](#build-process)
4. [Deployment Procedures](#deployment-procedures)
5. [Monitoring and Analytics](#monitoring-and-analytics)
6. [Backup and Recovery](#backup-and-recovery)

## Prerequisites

### Required Tools
- Node.js (LTS version)
- npm or yarn
- Git
- Expo CLI
- Supabase account
- iOS Developer Account (for iOS deployment)
- Google Play Developer Account (for Android deployment)

### System Requirements
- Minimum 8GB RAM
- 20GB free disk space
- Stable internet connection

## Environment Configuration

### Environment Variables
Create a `.env.production` file with the following variables:

```env
# Supabase Configuration
EXPO_PUBLIC_SUPABASE_URL=your_supabase_project_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Expo Configuration
EXPO_PROJECT_ID=your_expo_project_id
EXPO_APPLE_TEAM_ID=your_apple_team_id

# API Keys (if applicable)
STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
```

### Supabase Setup
1. Create a new Supabase project
2. Run the database schema from `database/schema.sql`
3. Configure Row Level Security (RLS) policies
4. Set up authentication providers
5. Configure storage buckets for user avatars

### Database Migration
```bash
# Connect to Supabase database
psql -h db.supabase.co -p 5432 -d postgres -U postgres

# Run schema migration
\i database/schema.sql
```

## Build Process

### iOS Build
```bash
# Install dependencies
npm install

# Build for iOS
npm run build:ios

# Generate IPA file
expo build:ios --release-channel production
```

### Android Build
```bash
# Install dependencies
npm install

# Build for Android
npm run build:android

# Generate APK file
expo build:android --release-channel production
```

### Web Build
```bash
# Install dependencies
npm install

# Build for web
npm run build:web

# Output directory: web-build/
```

### Environment-Specific Builds
```bash
# Development build
npm run build:dev

# Staging build
npm run build:staging

# Production build
npm run build:prod
```

## Deployment Procedures

### iOS App Store Deployment
1. Archive the app in Xcode
2. Upload to App Store Connect
3. Complete app store listing information
4. Submit for review

### Google Play Deployment
1. Generate signed APK/AAB
2. Upload to Google Play Console
3. Complete store listing information
4. Roll out to production

### Web Deployment
```bash
# Deploy to hosting service (e.g., Vercel, Netlify)
npm run deploy:web
```

### Continuous Deployment
```yaml
# GitHub Actions workflow example
name: Deploy to Production
on:
  push:
    branches: [ main ]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Setup Node.js
        uses: actions/setup-node@v2
        with:
          node-version: '18'
      - name: Install dependencies
        run: npm install
      - name: Build app
        run: npm run build:prod
      - name: Deploy to hosting
        run: npm run deploy
```

## Monitoring and Analytics

### Error Tracking
- Sentry integration for crash reporting
- LogRocket for session replay
- Custom error boundaries in React components

### Performance Monitoring
- Expo Performance API for render performance
- Network request monitoring
- Database query performance tracking

### User Analytics
- Google Analytics for Firebase
- Custom event tracking for key user actions
- Funnel analysis for conversion rates

### Health Checks
```bash
# Check Supabase connectivity
npm run health:supabase

# Check API endpoints
npm run health:api

# Run smoke tests
npm run test:smoke
```

## Backup and Recovery

### Database Backup
```sql
-- Create backup of all tables
pg_dump -h db.supabase.co -p 5432 -U postgres -F c -b -v -f backup.sql

-- Restore from backup
pg_restore -h db.supabase.co -p 5432 -U postgres -d postgres -v backup.sql
```

### Automated Backups
```bash
# Daily backup script
0 2 * * * /path/to/backup-script.sh

# Backup script content
#!/bin/bash
DATE=$(date +%Y%m%d)
pg_dump -h db.supabase.co -p 5432 -U postgres -F c -b -v -f /backups/worky-$DATE.sql
```

### Disaster Recovery Plan
1. Identify critical data and systems
2. Establish RTO (Recovery Time Objective) and RPO (Recovery Point Objective)
3. Regular backup testing
4. Incident response procedures
5. Communication plan for stakeholders

### Rollback Procedures
```bash
# Rollback to previous version
git checkout v1.2.3
npm run deploy

# Database rollback
psql -h db.supabase.co -p 5432 -d postgres -U postgres -f rollback-script.sql
```

## Security Considerations

### Environment Variables
- Never commit secrets to version control
- Use encrypted secrets in CI/CD
- Rotate API keys regularly

### Data Protection
- Encrypt sensitive data at rest
- Use HTTPS for all communications
- Implement proper authentication and authorization

### Compliance
- GDPR compliance for European users
- Data retention policies
- Privacy policy implementation