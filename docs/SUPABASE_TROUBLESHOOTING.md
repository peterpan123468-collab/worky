# Supabase Connection Troubleshooting Guide

This guide will help you diagnose and fix common Supabase connection issues in your React Native app.

## 1. Verify Environment Variables

First, check that your environment variables are properly set in the [.env](file:///C:/Users/Kevin/worky_v2/.env) file:

```
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

## 2. Check Connection Status

Run the connection test script:

```bash
npm run test:supabase
```

Or use the in-app test screen by navigating to the Handyman Dashboard and clicking "Test Supabase".

## 3. Common Issues and Solutions

### Environment Variables Not Loading
- After changing [.env](file:///C:/Users/Kevin/worky_v2/.env) file, you must restart the Expo development server
- Make sure variables are prefixed with `EXPO_PUBLIC_` for Expo to expose them to the client
- Check that there are no extra spaces or quotes around the values

### Network Issues
- Verify you can access your Supabase URL in a web browser
- Check if you're behind a corporate firewall that might block the connection
- Try connecting to Supabase from a different network

### Authentication Issues
- Ensure your Supabase project has the correct authentication settings
- Check that your user exists in the `auth.users` table
- Verify Row Level Security (RLS) policies are correctly configured

## 4. Debugging Steps

1. Check the console logs in your development environment
2. Look for any error messages related to Supabase
3. Verify the Supabase client is being initialized correctly
4. Test individual Supabase operations (auth, database queries)

## 5. Testing Supabase Connection Directly

You can test your Supabase connection outside of the React Native environment:

```bash
node test-supabase-connection.js
```

This will show you if the connection works at a basic level.

## 6. In-App Diagnostics

Use the Supabase Test screen in your app:
1. Navigate to the Handyman Dashboard
2. Scroll to the Quick Actions section
3. Tap "Test Supabase"
4. Review the test results

## 7. Need More Help?

If you're still experiencing issues:
1. Check the Expo and React Native logs for specific error messages
2. Verify your Supabase project settings
3. Ensure your database tables and RLS policies are correctly configured
4. Check the Supabase documentation for any recent changes