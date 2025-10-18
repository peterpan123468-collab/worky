import { AppLanguage } from '../contexts/LanguageContext'

// Translation keys interface
interface TranslationKeys {
  // Common
  'settings.title': string
  'settings.subtitle': string
  'settings.language.title': string
  'settings.language.description': string
  'settings.appearance.title': string
  'settings.appearance.description': string
  'settings.notifications.title': string
  'settings.notifications.description': string
  'settings.notifications.coming_soon': string
  'settings.appearance.hint': string
  
  // Dashboard
  'dashboard.welcome': string
  'dashboard.subtitle': string
  
  // Auth
  'auth.welcome_back': string
  'auth.join_as': string
  
  // Welcome Screen
  'welcome.title': string
  'welcome.subtitle': string
  'welcome.choose_role': string
  'welcome.i_am_a_handyman': string
  'welcome.offer_your_services': string
  'welcome.i_need_help': string
  'welcome.find_skilled_handymen': string
  'welcome.app_settings': string
  'welcome.theme': string
  'welcome.gradient': string
  'welcome.mascot': string
  'welcome.glass': string
  'welcome.test_auth': string
  'welcome.debug_connection': string
  'welcome.test_supabase': string
  'welcome.mobile_test': string
  'welcome.terms': string
  
  // Navigation
  'nav.settings': string
  'nav.logout': string
}

// Translations dictionary
const translations: Record<AppLanguage, TranslationKeys> = {
  en: {
    // Common
    'settings.title': 'Settings',
    'settings.subtitle': 'Manage your preferences',
    'settings.language.title': 'Language',
    'settings.language.description': 'Select your preferred language for the app interface',
    'settings.appearance.title': 'Appearance',
    'settings.appearance.description': 'Choose your preferred theme',
    'settings.notifications.title': 'Notifications',
    'settings.notifications.description': 'Manage your notification preferences',
    'settings.notifications.coming_soon': 'Notification settings coming soon',
    'settings.appearance.hint': 'Theme settings are available in the Welcome screen',
    
    // Dashboard
    'dashboard.welcome': 'Find Help',
    'dashboard.subtitle': 'Book services or join auctions',
    
    // Auth
    'auth.welcome_back': 'Welcome back!',
    'auth.join_as': 'Join as',
    
    // Welcome Screen
    'welcome.title': 'Worky',
    'welcome.subtitle': 'Connect with skilled handymen instantly',
    'welcome.choose_role': 'Choose your role',
    'welcome.i_am_a_handyman': 'I\'m a Handyman',
    'welcome.offer_your_services': 'Offer your services',
    'welcome.i_need_help': 'I need help',
    'welcome.find_skilled_handymen': 'Find skilled handymen',
    'welcome.app_settings': 'App Settings',
    'welcome.theme': 'Theme',
    'welcome.gradient': 'Gradient',
    'welcome.mascot': 'Mascot',
    'welcome.glass': 'Glass',
    'welcome.test_auth': 'Test Auth',
    'welcome.debug_connection': 'Debug Connection',
    'welcome.test_supabase': 'Test Supabase',
    'welcome.mobile_test': 'Mobile Test',
    'welcome.terms': 'By continuing, you agree to our Terms & Service',
    
    // Navigation
    'nav.settings': 'Settings',
    'nav.logout': 'Logout'
  },
  de: {
    // Common
    'settings.title': 'Einstellungen',
    'settings.subtitle': 'Verwalten Sie Ihre Präferenzen',
    'settings.language.title': 'Sprache',
    'settings.language.description': 'Wählen Sie Ihre bevorzugte Sprache für die App-Oberfläche',
    'settings.appearance.title': 'Erscheinungsbild',
    'settings.appearance.description': 'Wählen Sie Ihr bevorzugtes Design',
    'settings.notifications.title': 'Benachrichtigungen',
    'settings.notifications.description': 'Verwalten Sie Ihre Benachrichtigungseinstellungen',
    'settings.notifications.coming_soon': 'Benachrichtigungseinstellungen demnächst verfügbar',
    'settings.appearance.hint': 'Design-Einstellungen sind im Willkommensbildschirm verfügbar',
    
    // Dashboard
    'dashboard.welcome': 'Hilfe finden',
    'dashboard.subtitle': 'Buchen Sie Dienste oder nehmen Sie an Auktionen teil',
    
    // Auth
    'auth.welcome_back': 'Willkommen zurück!',
    'auth.join_as': 'Beitreten als',
    
    // Welcome Screen
    'welcome.title': 'Worky',
    'welcome.subtitle': 'Verbinden Sie sich sofort mit qualifizierten Handwerkern',
    'welcome.choose_role': 'Wählen Sie Ihre Rolle',
    'welcome.i_am_a_handyman': 'Ich bin Handwerker',
    'welcome.offer_your_services': 'Bieten Sie Ihre Dienste an',
    'welcome.i_need_help': 'Ich brauche Hilfe',
    'welcome.find_skilled_handymen': 'Finden Sie qualifizierte Handwerker',
    'welcome.app_settings': 'App-Einstellungen',
    'welcome.theme': 'Design',
    'welcome.gradient': 'Verlauf',
    'welcome.mascot': 'Maskottchen',
    'welcome.glass': 'Glas',
    'welcome.test_auth': 'Auth testen',
    'welcome.debug_connection': 'Verbindung debuggen',
    'welcome.test_supabase': 'Supabase testen',
    'welcome.mobile_test': 'Mobiltest',
    'welcome.terms': 'Durch Fortfahren stimmen Sie unseren Allgemeinen Geschäftsbedingungen zu',
    
    // Navigation
    'nav.settings': 'Einstellungen',
    'nav.logout': 'Abmelden'
  },
  fr: {
    // Common
    'settings.title': 'Paramètres',
    'settings.subtitle': 'Gérer vos préférences',
    'settings.language.title': 'Langue',
    'settings.language.description': 'Sélectionnez votre langue préférée pour l\'interface de l\'application',
    'settings.appearance.title': 'Apparence',
    'settings.appearance.description': 'Choisissez votre thème préféré',
    'settings.notifications.title': 'Notifications',
    'settings.notifications.description': 'Gérez vos préférences de notification',
    'settings.notifications.coming_soon': 'Paramètres de notification bientôt disponibles',
    'settings.appearance.hint': 'Les paramètres de thème sont disponibles dans l\'écran d\'accueil',
    
    // Dashboard
    'dashboard.welcome': 'Trouver de l\'aide',
    'dashboard.subtitle': 'Réserver des services ou participer aux enchères',
    
    // Auth
    'auth.welcome_back': 'Bienvenue !',
    'auth.join_as': 'Rejoindre en tant que',
    
    // Welcome Screen
    'welcome.title': 'Worky',
    'welcome.subtitle': 'Connectez-vous instantanément avec des artisans qualifiés',
    'welcome.choose_role': 'Choisissez votre rôle',
    'welcome.i_am_a_handyman': 'Je suis artisan',
    'welcome.offer_your_services': 'Proposez vos services',
    'welcome.i_need_help': 'J\'ai besoin d\'aide',
    'welcome.find_skilled_handymen': 'Trouvez des artisans qualifiés',
    'welcome.app_settings': 'Paramètres de l\'application',
    'welcome.theme': 'Thème',
    'welcome.gradient': 'Dégradé',
    'welcome.mascot': 'Mascotte',
    'welcome.glass': 'Verre',
    'welcome.test_auth': 'Tester l\'authentification',
    'welcome.debug_connection': 'Déboguer la connexion',
    'welcome.test_supabase': 'Tester Supabase',
    'welcome.mobile_test': 'Test mobile',
    'welcome.terms': 'En continuant, vous acceptez nos Conditions de service',
    
    // Navigation
    'nav.settings': 'Paramètres',
    'nav.logout': 'Se déconnecter'
  },
  it: {
    // Common
    'settings.title': 'Impostazioni',
    'settings.subtitle': 'Gestisci le tue preferenze',
    'settings.language.title': 'Lingua',
    'settings.language.description': 'Seleziona la tua lingua preferita per l\'interfaccia dell\'app',
    'settings.appearance.title': 'Aspetto',
    'settings.appearance.description': 'Scegli il tuo tema preferito',
    'settings.notifications.title': 'Notifiche',
    'settings.notifications.description': 'Gestisci le tue preferenze di notifica',
    'settings.notifications.coming_soon': 'Impostazioni di notifica in arrivo',
    'settings.appearance.hint': 'Le impostazioni del tema sono disponibili nella schermata di benvenuto',
    
    // Dashboard
    'dashboard.welcome': 'Trova Aiuto',
    'dashboard.subtitle': 'Prenota servizi o partecipa alle aste',
    
    // Auth
    'auth.welcome_back': 'Bentornato!',
    'auth.join_as': 'Unisciti come',
    
    // Welcome Screen
    'welcome.title': 'Worky',
    'welcome.subtitle': 'Connettiti istantaneamente con artigiani qualificati',
    'welcome.choose_role': 'Scegli il tuo ruolo',
    'welcome.i_am_a_handyman': 'Sono un artigiano',
    'welcome.offer_your_services': 'Offri i tuoi servizi',
    'welcome.i_need_help': 'Ho bisogno di aiuto',
    'welcome.find_skilled_handymen': 'Trova artigiani qualificati',
    'welcome.app_settings': 'Impostazioni app',
    'welcome.theme': 'Tema',
    'welcome.gradient': 'Gradiente',
    'welcome.mascot': 'Mascotte',
    'welcome.glass': 'Vetro',
    'welcome.test_auth': 'Test autenticazione',
    'welcome.debug_connection': 'Debug connessione',
    'welcome.test_supabase': 'Test Supabase',
    'welcome.mobile_test': 'Test mobile',
    'welcome.terms': 'Continuando, accetti i nostri Termini di servizio',
    
    // Navigation
    'nav.settings': 'Impostazioni',
    'nav.logout': 'Disconnetti'
  }
}

// Translation function
export function t(key: keyof TranslationKeys, language: AppLanguage = 'en'): string {
  return translations[language][key] || key
}

// Get all translations for a language
export function getTranslations(language: AppLanguage): TranslationKeys {
  return translations[language]
}
