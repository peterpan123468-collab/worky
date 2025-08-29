import { act, render, waitFor } from '@testing-library/react-native';
import React from 'react';
import { AuthProvider, useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

// Mock Supabase
jest.mock('../lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: jest.fn(),
      onAuthStateChange: jest.fn(),
      signInWithPassword: jest.fn(),
      signUp: jest.fn(),
      signOut: jest.fn(),
      getUser: jest.fn(),
    },
    from: jest.fn(),
  },
}));

// Test component to access AuthContext
const TestComponent = () => {
  const auth = useAuth();
  return null;
};

const mockSupabaseChain = {
  select: jest.fn(),
  insert: jest.fn(),
  update: jest.fn(),
  eq: jest.fn(),
  single: jest.fn(),
};

describe('AuthContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup default Supabase mocks
    (supabase.from as jest.Mock).mockReturnValue(mockSupabaseChain);
    mockSupabaseChain.select.mockReturnValue(mockSupabaseChain);
    mockSupabaseChain.insert.mockReturnValue(mockSupabaseChain);
    mockSupabaseChain.update.mockReturnValue(mockSupabaseChain);
    mockSupabaseChain.eq.mockReturnValue(mockSupabaseChain);
    mockSupabaseChain.single.mockReturnValue(mockSupabaseChain);

    // Mock auth state change subscription
    (supabase.auth.onAuthStateChange as jest.Mock).mockReturnValue({
      data: { subscription: { unsubscribe: jest.fn() } },
    });
  });

  describe('AuthProvider Initialization', () => {
    it('should initialize with loading state', async () => {
      (supabase.auth.getSession as jest.Mock).mockResolvedValue({
        data: { session: null },
      });

      let authValue: any;
      const TestComponent = () => {
        authValue = useAuth();
        return null;
      };

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      // Initially should be loading
      expect(authValue.isLoading).toBe(true);
      expect(authValue.session).toBe(null);
      expect(authValue.user).toBe(null);
      expect(authValue.userType).toBe(null);
    });

    it('should handle existing session on initialization', async () => {
      const mockSession = {
        user: { id: 'user-123', email: 'test@example.com' },
      };

      (supabase.auth.getSession as jest.Mock).mockResolvedValue({
        data: { session: mockSession },
      });

      mockSupabaseChain.single.mockResolvedValue({
        data: { user_type: 'customer' },
        error: null,
      });

      let authValue: any;
      const TestComponent = () => {
        authValue = useAuth();
        return null;
      };

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(authValue.isLoading).toBe(false);
      });

      expect(authValue.session).toEqual(mockSession);
      expect(authValue.user).toEqual(mockSession.user);
      expect(authValue.userType).toBe('customer');
    });
  });

  describe('fetchUserType', () => {
    it('should fetch user type successfully', async () => {
      (supabase.auth.getSession as jest.Mock).mockResolvedValue({
        data: { session: { user: { id: 'user-123' } } },
      });

      mockSupabaseChain.single.mockResolvedValue({
        data: { user_type: 'handyman' },
        error: null,
      });

      let authValue: any;
      const TestComponent = () => {
        authValue = useAuth();
        return null;
      };

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(authValue.userType).toBe('handyman');
      });

      expect(supabase.from).toHaveBeenCalledWith('users');
      expect(mockSupabaseChain.select).toHaveBeenCalledWith('user_type');
      expect(mockSupabaseChain.eq).toHaveBeenCalledWith('id', 'user-123');
    });

    it('should handle missing user record and create one', async () => {
      const mockUser = { id: 'user-123', email: 'test@example.com' };
      
      (supabase.auth.getSession as jest.Mock).mockResolvedValue({
        data: { session: { user: mockUser } },
      });

      (supabase.auth.getUser as jest.Mock).mockResolvedValue({
        data: { user: mockUser },
      });

      // First call fails (user record doesn't exist)
      mockSupabaseChain.single
        .mockResolvedValueOnce({
          data: null,
          error: { code: 'PGRST116', message: 'No rows returned' },
        })
        // Second call succeeds (after creating record)
        .mockResolvedValueOnce({
          data: { user_type: 'customer' },
          error: null,
        });

      let authValue: any;
      const TestComponent = () => {
        authValue = useAuth();
        return null;
      };

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(authValue.userType).toBe('customer');
      });

      // Should have attempted to create user record
      expect(mockSupabaseChain.insert).toHaveBeenCalledWith({
        id: 'user-123',
        email: 'test@example.com',
        user_type: 'customer',
      });
    });

    it('should handle retry logic for missing user record', async () => {
      (supabase.auth.getSession as jest.Mock).mockResolvedValue({
        data: { session: { user: { id: 'user-123', email: 'test@example.com' } } },
      });

      (supabase.auth.getUser as jest.Mock).mockResolvedValue({
        data: { user: { id: 'user-123', email: 'test@example.com' } },
      });

      // First call fails, creation fails, retry succeeds
      mockSupabaseChain.single
        .mockResolvedValueOnce({
          data: null,
          error: { code: 'PGRST116' },
        })
        .mockResolvedValueOnce({
          data: null,
          error: { message: 'Insert failed' },
        })
        .mockResolvedValueOnce({
          data: { user_type: 'customer' },
          error: null,
        });

      let authValue: any;
      const TestComponent = () => {
        authValue = useAuth();
        return null;
      };

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      // Wait for retry timeout
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 2100));
      });

      await waitFor(() => {
        expect(authValue.userType).toBe('customer');
      });
    });
  });

  describe('signIn', () => {
    it('should sign in successfully', async () => {
      (supabase.auth.getSession as jest.Mock).mockResolvedValue({
        data: { session: null },
      });

      (supabase.auth.signInWithPassword as jest.Mock).mockResolvedValue({
        error: null,
      });

      let authValue: any;
      const TestComponent = () => {
        authValue = useAuth();
        return null;
      };

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(authValue.isLoading).toBe(false);
      });

      const result = await authValue.signIn('test@example.com', 'password123');

      expect(result.error).toBe(null);
      expect(supabase.auth.signInWithPassword).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
      });
    });

    it('should handle sign in error', async () => {
      (supabase.auth.getSession as jest.Mock).mockResolvedValue({
        data: { session: null },
      });

      const mockError = { message: 'Invalid credentials' };
      (supabase.auth.signInWithPassword as jest.Mock).mockResolvedValue({
        error: mockError,
      });

      let authValue: any;
      const TestComponent = () => {
        authValue = useAuth();
        return null;
      };

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(authValue.isLoading).toBe(false);
      });

      const result = await authValue.signIn('test@example.com', 'wrongpassword');

      expect(result.error).toBe(mockError);
      expect(authValue.error).toBe('Invalid credentials');
    });
  });

  describe('signUp', () => {
    it('should sign up successfully', async () => {
      (supabase.auth.getSession as jest.Mock).mockResolvedValue({
        data: { session: null },
      });

      const mockUser = { id: 'user-123', email: 'test@example.com' };
      (supabase.auth.signUp as jest.Mock).mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      mockSupabaseChain.single.mockResolvedValue({
        data: { id: 'user-123' },
        error: null,
      });

      let authValue: any;
      const TestComponent = () => {
        authValue = useAuth();
        return null;
      };

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(authValue.isLoading).toBe(false);
      });

      const result = await authValue.signUp('test@example.com', 'password123', 'handyman');

      expect(result.error).toBe(null);
      expect(supabase.auth.signUp).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
        options: {
          data: {
            user_type: 'handyman',
          },
        },
      });
    });

    it('should handle sign up error', async () => {
      (supabase.auth.getSession as jest.Mock).mockResolvedValue({
        data: { session: null },
      });

      const mockError = { message: 'Email already exists' };
      (supabase.auth.signUp as jest.Mock).mockResolvedValue({
        data: { user: null },
        error: mockError,
      });

      let authValue: any;
      const TestComponent = () => {
        authValue = useAuth();
        return null;
      };

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(authValue.isLoading).toBe(false);
      });

      const result = await authValue.signUp('existing@example.com', 'password123', 'customer');

      expect(result.error).toBe(mockError);
      expect(authValue.error).toBe('Email already exists');
    });
  });

  describe('signOut', () => {
    it('should sign out successfully', async () => {
      (supabase.auth.getSession as jest.Mock).mockResolvedValue({
        data: { session: null },
      });

      (supabase.auth.signOut as jest.Mock).mockResolvedValue({
        error: null,
      });

      let authValue: any;
      const TestComponent = () => {
        authValue = useAuth();
        return null;
      };

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(authValue.isLoading).toBe(false);
      });

      await authValue.signOut();

      expect(supabase.auth.signOut).toHaveBeenCalled();
    });
  });

  describe('clearError', () => {
    it('should clear error state', async () => {
      (supabase.auth.getSession as jest.Mock).mockResolvedValue({
        data: { session: null },
      });

      let authValue: any;
      const TestComponent = () => {
        authValue = useAuth();
        return null;
      };

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(authValue.isLoading).toBe(false);
      });

      // Set error first
      const mockError = { message: 'Test error' };
      (supabase.auth.signInWithPassword as jest.Mock).mockResolvedValue({
        error: mockError,
      });

      await authValue.signIn('test@example.com', 'wrongpassword');
      expect(authValue.error).toBe('Test error');

      // Clear error
      authValue.clearError();
      expect(authValue.error).toBe(null);
    });
  });
});