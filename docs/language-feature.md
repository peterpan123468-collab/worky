# Language Feature Implementation

## Overview

This document describes the implementation of the multi-language feature that allows users to select between English, German, French, and Italian languages for the Worky app interface.

## Implementation Details

### 1. Language Context

The language feature is implemented using a React Context (`LanguageContext`) that manages the current language selection and persists it using AsyncStorage for unauthenticated users and Supabase for authenticated users.

#### Key Components:
- `LanguageProvider`: Context provider that manages language state
- `useLanguage`: Hook to access language state and update function
- `LANGUAGE_OPTIONS`: Array of available languages with their codes and names

### 2. Supported Languages

The app currently supports 4 languages:
- English (en)
- German (de)
- French (fr)
- Italian (it)

### 3. Language Storage

Language preferences are stored in two places:
1. **Local Storage (AsyncStorage)**: For unauthenticated users or as a fallback
2. **Supabase Database**: For authenticated users in their profile (handyman_profiles or customer_profiles tables)

### 4. Database Schema Changes

The following columns were added to support language preferences:
- `handyman_profiles.language`: VARCHAR(5) with default 'en'
- `customer_profiles.language`: VARCHAR(5) with default 'en'

### 5. Translation System

A simple translation system was implemented:
- `i18n.ts`: Contains translation keys and dictionaries for all supported languages
- `t()` function: Used to retrieve translated strings based on the current language

### 6. UI Components

#### Settings Screen
- Located at `src/screens/SettingsScreen.tsx`
- Allows users to select their preferred language
- Shows all available languages in their native names

#### Language Selection in Other Screens
- Added settings button to CustomerDashboard and HandymanDashboard
- Added settings button to WelcomeScreen
- All text is translated using the i18n system

## How to Add New Languages

1. Add the new language code to the `AppLanguage` type in `LanguageContext.tsx`
2. Add the new language to `LANGUAGE_OPTIONS` array
3. Add translations for all keys in `i18n.ts`
4. Update the database schema to accept the new language code
5. Run the migration script to update existing profiles

## How to Add New Translations

1. Add the new translation key to the `TranslationKeys` interface in `i18n.ts`
2. Add translations for the key in all supported languages
3. Use the `t()` function in components to display translated text

## Testing

Unit tests are available in `src/__tests__/language-context.test.tsx` to verify:
- Default language loading
- Language persistence
- Language switching functionality
- Error handling for invalid language codes

## Usage in Components

To use the language feature in components:

```typescript
import { useLanguage } from '../contexts/LanguageContext'
import { t } from '../utils/i18n'

const MyComponent = () => {
  const { language } = useLanguage()
  
  return (
    <Text>{t('my.translation.key', language)}</Text>
  )
}
```

## Future Improvements

1. **Dynamic Language Loading**: Load translations dynamically instead of bundling all languages
2. **RTL Support**: Add support for right-to-left languages
3. **Language Detection**: Automatically detect user's preferred language based on device settings
4. **Translation Management**: Implement a system for managing translations without code changes