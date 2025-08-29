# Worky Database Status Check Guide

## 📊 Expected Database Schema

Based on your `database/schema.sql` file, your Worky database should contain the following tables:

### 🗃️ **Core Tables**

| Table Name | Purpose | Status | Priority |
|------------|---------|---------|----------|
| `users` | User accounts (handyman/customer) | ✅ MVP Required | High |
| `handyman_profiles` | Business profiles, rates, skills | ✅ MVP Required | High |
| `time_slots` | Available appointment slots | ✅ MVP Required | High |
| `bookings` | Customer booking records | ✅ MVP Required | High |
| `auctions` | Auction system (Phase 2) | 🔄 Future | Medium |
| `auction_bids` | Bidding records (Phase 2) | 🔄 Future | Medium |
| `notifications` | Push notifications | 🔄 Phase 2 | Medium |
| `payment_intents` | Stripe payments (Phase 3) | 🔄 Future | Low |
| `payouts` | Handyman payouts (Phase 3) | 🔄 Future | Low |

### 🔧 **Database Functions**

| Function | Purpose | Required For |
|----------|---------|--------------|
| `handle_new_user()` | Creates user profile on signup | Authentication |
| `handle_booking_conflict()` | Manages auction triggers | Booking System |
| `complete_auction()` | Finalizes auction results | Auction System |

### ⚡ **Database Triggers**

| Trigger | Table | Purpose |
|---------|-------|---------|
| `on_auth_user_created` | auth.users | Auto-create user profile |
| `on_booking_created` | bookings | Handle booking conflicts |

## 🔍 How to Check Your Database

### **Method 1: Using Supabase Dashboard**

1. **Go to your Supabase project dashboard**
2. **Navigate to:** Table Editor
3. **Check if you see all tables listed in the left sidebar**

### **Method 2: Using SQL Editor**

1. **Open Supabase SQL Editor**
2. **Copy and paste the SQL from:** `database/check-database-status.sql`
3. **Run the queries** to get detailed reports

### **Method 3: Using Supabase CLI (if installed)**

```bash
supabase db dump --schema public
```

## 📋 Database Setup Checklist

### ✅ **MVP Requirements (Must Have)**

- [ ] `users` table exists
- [ ] `handyman_profiles` table exists  
- [ ] `time_slots` table exists
- [ ] `bookings` table exists
- [ ] Row Level Security (RLS) enabled on all tables
- [ ] `handle_new_user()` function exists
- [ ] `on_auth_user_created` trigger exists
- [ ] All indexes are created

### 🔄 **Phase 2 Requirements (Nice to Have)**

- [ ] `auctions` table exists
- [ ] `auction_bids` table exists
- [ ] `notifications` table exists
- [ ] `handle_booking_conflict()` function exists
- [ ] `complete_auction()` function exists
- [ ] `on_booking_created` trigger exists

### 💳 **Phase 3 Requirements (Future)**

- [ ] `payment_intents` table exists
- [ ] `payouts` table exists
- [ ] Payment-related policies configured

## 🚨 Common Issues & Solutions

### **Issue 1: Tables Don't Exist**
**Solution:** Run the complete `database/schema.sql` in Supabase SQL Editor

### **Issue 2: RLS Not Enabled**
**Symptoms:** Users can see all data or get permission errors
**Solution:** Run RLS policies from schema.sql

### **Issue 3: Authentication Issues**
**Symptoms:** Users can't log in or profiles aren't created
**Solution:** Check if `handle_new_user()` function and trigger exist

### **Issue 4: Booking Conflicts**
**Symptoms:** Multiple bookings for same slot
**Solution:** Ensure `handle_booking_conflict()` function is installed

## 🛠️ Quick Database Setup

If your database is incomplete, run these commands in order:

```sql
-- 1. Create all tables
-- Copy from database/schema.sql (lines 1-100)

-- 2. Enable RLS and create policies  
-- Copy from database/schema.sql (lines 101-250)

-- 3. Create functions and triggers
-- Copy from database/schema.sql (lines 251-400)

-- 4. Create indexes
-- Copy from database/schema.sql (lines 401-430)
```

## 📊 Expected Results

### **Complete Database Should Show:**

```
Tables Found: 9/9 ✅
- users ✅
- handyman_profiles ✅  
- time_slots ✅
- bookings ✅
- auctions ✅
- auction_bids ✅
- notifications ✅
- payment_intents ✅
- payouts ✅

RLS Enabled: 9/9 ✅
Functions: 3/3 ✅  
Triggers: 2/2 ✅
Indexes: 15/15 ✅
```

### **MVP-Ready Database Should Show:**

```
Core Tables: 4/4 ✅
- users ✅
- handyman_profiles ✅
- time_slots ✅  
- bookings ✅

RLS Enabled: 4/4 ✅
Critical Functions: 1/1 ✅
Critical Triggers: 1/1 ✅
```

## 🔗 Next Steps

1. **Run the database check** using `check-database-status.sql`
2. **Compare results** with expected schema
3. **Run missing parts** of `schema.sql` if needed
4. **Test authentication** flow to verify setup
5. **Test booking flow** to verify business logic

## 🆘 Getting Help

If your database check shows missing components:

1. **Check Supabase logs** for any error messages
2. **Verify permissions** in your Supabase project
3. **Run schema.sql step by step** instead of all at once
4. **Check for SQL syntax errors** in the editor

The most critical components for MVP are `users`, `handyman_profiles`, `time_slots`, and `bookings` tables with their RLS policies and the `handle_new_user()` function.