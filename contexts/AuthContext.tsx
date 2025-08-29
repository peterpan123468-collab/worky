import { supabase } from '@/lib/supabase';
import { Session, User } from '@supabase/supabase-js';
import React, { createContext, useContext, useEffect, useState } from 'react';

interface AuthContextType {
  session: Session | null;
  user: User | null;
  userType: 'handyman' | 'customer' | null;
  hasSelectedRegion: boolean;
  hasCompletedWorkSetup: boolean;
  isLoading: boolean;
  error: string | null;
  clearError: () => void;
  refreshUserData: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string, userType: 'handyman' | 'customer') => Promise<{ error: any }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  userType: null,
  hasSelectedRegion: false,
  hasCompletedWorkSetup: false,
  isLoading: true,
  error: null,
  clearError: () => {},
  refreshUserData: async () => {},
  signIn: async () => ({ error: null }),
  signUp: async () => ({ error: null }),
  signOut: async () => {},
});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [userType, setUserType] = useState<'handyman' | 'customer' | null>(null);
  const [hasSelectedRegion, setHasSelectedRegion] = useState(false);
  const [hasCompletedWorkSetup, setHasCompletedWorkSetup] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const clearError = () => {
    setError(null);
  };

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchUserType(session.user.id);
      } else {
        setIsLoading(false);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('🔄 Auth state changed:', event, session ? 'session exists' : 'no session');
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          console.log('👤 User authenticated, fetching user type for:', session.user.id);
          await fetchUserType(session.user.id);
        } else {
          console.log('🙅 No user session, clearing user type and setup states');
          setUserType(null);
          setHasSelectedRegion(false);
          setHasCompletedWorkSetup(false);
          setIsLoading(false);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const fetchUserType = async (userId: string) => {
    console.log('💾 Fetching user type for ID:', userId);
    
    // Set a timeout to prevent infinite loading
    const timeoutId = setTimeout(() => {
      console.log('⏰ fetchUserType timeout - setting loading to false');
      setIsLoading(false);
      setError('Loading timeout. Please refresh the page.');
    }, 10000); // 10 second timeout
    
    try {
      const { data, error } = await supabase
        .from('users')
        .select('user_type, profile_data')
        .eq('id', userId)
        .single();

      console.log('💾 Database query result:', { data, error: error?.code || 'no error' });
      console.log('🔍 DEBUG: Full database response:', JSON.stringify(data, null, 2));

      if (error) {
        console.error('Error fetching user type:', error);
        // If user record doesn't exist, it might be a new signup or missing record
        if (error.code === 'PGRST116') {
          console.log('🔍 User record not found, attempting to create one...');
          
          // Try to get current user email for record creation
          const { data: { user } } = await supabase.auth.getUser();
          if (user?.email) {
            console.log('📧 Creating user record with email:', user.email);
            // Create a default user record (customer type)
            const { data: createdUser, error: createError } = await supabase
              .from('users')
              .insert({
                id: userId,
                email: user.email,
                user_type: 'customer' // Default to customer
              })
              .select()
              .single();
            
            if (!createError && createdUser) {
              console.log('✅ Successfully created user record:', createdUser);
              setUserType(createdUser.user_type);
              setHasSelectedRegion(false); // New user needs to select region
              clearTimeout(timeoutId);
              setIsLoading(false);
              return;
            } else {
              console.error('❌ Failed to create user record:', createError);
            }
          }
          
          // If creation failed, set error and stop loading immediately
          console.error('❌ Could not create user record, stopping loading');
          setUserType(null);
          setHasSelectedRegion(false);
          setError('Account setup incomplete. Please try signing up again.');
          clearTimeout(timeoutId);
          setIsLoading(false);
          return;
        }
        
        // For other errors, set defaults and stop loading
        setUserType(null);
        setHasSelectedRegion(false);
        setError('Failed to load user data. Please try again.');
      } else {
        console.log('✅ User type retrieved:', data?.user_type);
        console.log('📊 Profile data:', data?.profile_data);
        console.log('🌍 Selected region check:', {
          profile_data: data?.profile_data,
          selected_region: data?.profile_data?.selected_region,
          hasRegion: !!data?.profile_data?.selected_region,
          work_setup_completed: data?.profile_data?.work_setup_completed,
          hasWorkSetup: !!data?.profile_data?.work_setup_completed,
          type_of_profile_data: typeof data?.profile_data,
          is_null: data?.profile_data === null,
          is_undefined: data?.profile_data === undefined
        });
        
        const userTypeValue = data?.user_type || null;
        const hasRegionValue = !!data?.profile_data?.selected_region;
        const hasWorkSetupValue = !!data?.profile_data?.work_setup_completed;
        
        console.log('📈 Setting state values:', {
          userType: userTypeValue,
          hasSelectedRegion: hasRegionValue,
          hasCompletedWorkSetup: hasWorkSetupValue
        });
        
        setUserType(userTypeValue);
        setHasSelectedRegion(hasRegionValue);
        setHasCompletedWorkSetup(hasWorkSetupValue);
        clearError(); // Clear any previous errors
      }
    } catch (error) {
      console.error('💥 Unexpected error fetching user type:', error);
      setUserType(null);
      setHasSelectedRegion(false);
      setError('Unexpected error loading user data.');
    } finally {
      console.log('🏁 Setting loading to false');
      clearTimeout(timeoutId);
      setIsLoading(false);
    }
  };

  const refreshUserData = async () => {
    console.log('🔄 refreshUserData called with user ID:', user?.id);
    if (user?.id) {
      console.log('🔄 Fetching fresh user data from database...');
      await fetchUserType(user.id);
      console.log('🔄 refreshUserData completed');
    } else {
      console.log('⚠️ refreshUserData called but no user ID available');
    }
  };

  const signIn = async (email: string, password: string) => {
    console.log('🔐 AuthContext: Starting signIn process');
    setIsLoading(true);
    setError(null);
    
    console.log('🔗 AuthContext: Calling supabase.auth.signInWithPassword');
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    console.log('🔗 AuthContext: Supabase response:', { error: error?.message || 'no error' });
    
    if (error) {
      console.log('❌ AuthContext: Setting error state:', error.message);
      setError(error.message);
      setIsLoading(false);
    } else {
      console.log('✅ AuthContext: Authentication successful, auth state change should trigger');
    }
    
    return { error };
  };

  const signUp = async (email: string, password: string, userType: 'handyman' | 'customer') => {
    setIsLoading(true);
    setError(null);
    
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          user_type: userType
        }
      }
    });

    if (error) {
      setError(error.message);
      setIsLoading(false);
      return { error };
    }

    // Update user type in database after trigger creates the profile
    if (data.user) {
      // Wait for the trigger to complete, then update the user type
      setTimeout(async () => {
        try {
          // First, check if the user record exists
          const { data: existingUser, error: fetchError } = await supabase
            .from('users')
            .select('id')
            .eq('id', data.user!.id)
            .single();

          if (fetchError || !existingUser) {
            // If user record doesn't exist, create it
            const { error: insertError } = await supabase
              .from('users')
              .insert({
                id: data.user!.id,
                email: data.user!.email!,
                user_type: userType
              });
            
            if (insertError) {
              console.error('Error creating user record:', insertError);
            }
          } else {
            // Update existing record
            const { error: updateError } = await supabase
              .from('users')
              .update({ user_type: userType })
              .eq('id', data.user!.id);

            if (updateError) {
              console.error('Error updating user type:', updateError);
            }
          }
        } catch (error) {
          console.error('Error handling user record:', error);
          setError('Account created but there was an issue setting up your profile. Please try logging in.');
        }
      }, 1500); // Wait a bit longer for trigger to complete
    }

    return { error };
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('Error signing out:', error);
    }
  };

  const value = {
    session,
    user,
    userType,
    hasSelectedRegion,
    hasCompletedWorkSetup,
    isLoading,
    error,
    clearError,
    refreshUserData,
    signIn,
    signUp,
    signOut,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}