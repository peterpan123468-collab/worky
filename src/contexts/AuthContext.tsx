import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { authService, AuthUser, SignUpData } from '../services/auth.service'
import { UserType } from '../types/database.types'
import { useToast } from './ToastContext'

// Loading states
type AuthState = 'loading' | 'authenticated' | 'unauthenticated'

interface AuthContextType {
  user: AuthUser | null
  userType: UserType | null
  authState: AuthState
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null

  // Auth actions
  signUp: (data: SignUpData) => Promise<{ success: boolean; error?: string }>
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string }>
  signOut: () => Promise<void>
  clearError: () => void

  // Legacy support for existing components
  setUserType: (userType: UserType) => void
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

interface AuthProviderProps {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [authState, setAuthState] = useState<AuthState>('loading')
  const [error, setError] = useState<string | null>(null)
  const { show: showToast } = useToast()

  // Initialize auth state on app start
  useEffect(() => {
    initializeAuth()
  }, [])

  // Set up auth state listener
  useEffect(() => {
    const { data: { subscription } } = authService.onAuthStateChange((user) => {
      console.log('Auth state changed in context:', user?.id)
      setUser(user)
      setAuthState(user ? 'authenticated' : 'unauthenticated')
    })

    return () => subscription.unsubscribe()
  }, [])

  const initializeAuth = async () => {
    try {
      setAuthState('loading')
      const currentUser = await authService.getCurrentUser()
      setUser(currentUser)
      setAuthState(currentUser ? 'authenticated' : 'unauthenticated')
    } catch (error) {
      console.error('Auth initialization error:', error)
      setAuthState('unauthenticated')
    }
  }

  const signUp = async (data: SignUpData): Promise<{ success: boolean; error?: string }> => {
    try {
      setError(null)
      const result = await authService.signUp(data)

      if (result.error) {
        setError(result.error)
        return { success: false, error: result.error }
      }

      // User state will be updated via auth state listener
      return { success: true }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Signup failed'
      setError(errorMessage)
      return { success: false, error: errorMessage }
    }
  }

  const signIn = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      setError(null)
      const result = await authService.signIn(email, password)

      if (result.error) {
        setError(result.error)
        return { success: false, error: result.error }
      }

      // User state will be updated via auth state listener
      return { success: true }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Login failed'
      setError(errorMessage)
      return { success: false, error: errorMessage }
    }
  }

  const signOut = async (): Promise<void> => {
    try {
      setError(null)
      const result = await authService.signOut()
      
      if (result.error) {
        throw new Error(result.error)
      }
      
      showToast('Successfully logged out', { type: 'success' })
      // User state will be updated via auth state listener
    } catch (error) {
      console.error('Logout error:', error)
      setError('Failed to logout')
      showToast('Failed to logout. Please try again.', { type: 'error' })
    }
  }

  const clearError = () => setError(null)

  // Legacy support methods for existing components
  const setUserType = (newUserType: UserType) => {
    // This method is kept for backward compatibility
    // In practice, user type should be set through proper authentication
    console.warn('setUserType is deprecated. Use proper authentication flow.')
  }

  const logout = () => {
    showToast('Logging out...', { type: 'info', duration: 1500 })
    signOut()
  }

  // Computed values
  const userType = user?.user_type || null
  const isAuthenticated = authState === 'authenticated'
  const isLoading = authState === 'loading'

  return (
    <AuthContext.Provider
      value={{
        user,
        userType,
        authState,
        isAuthenticated,
        isLoading,
        error,
        signUp,
        signIn,
        signOut,
        clearError,
        // Legacy support
        setUserType,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
