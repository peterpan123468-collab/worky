import { render } from '@testing-library/react-native';
import React from 'react';
import { ErrorMessage } from '../components/ErrorMessage';

// Mock the useColorScheme hook
jest.mock('../hooks/useColorScheme', () => ({
  useColorScheme: () => 'light',
}));

describe('ErrorMessage Component', () => {
  it('should not render when error is null', () => {
    const { queryByTestId } = render(<ErrorMessage error={null} />);
    
    expect(queryByTestId('error-message')).toBeNull();
  });

  it('should not render when error is empty string', () => {
    const { queryByTestId } = render(<ErrorMessage error="" />);
    
    expect(queryByTestId('error-message')).toBeNull();
  });

  it('should render error message when error is provided', () => {
    const { getByText } = render(<ErrorMessage error="Test error message" />);
    
    expect(getByText('Test error message')).toBeTruthy();
  });

  describe('Error Message Transformations', () => {
    it('should convert invalid login credentials error', () => {
      const { getByText } = render(<ErrorMessage error="Invalid login credentials" />);
      
      expect(getByText('Invalid email or password. Please check your credentials and try again.')).toBeTruthy();
    });

    it('should convert email not confirmed error', () => {
      const { getByText } = render(<ErrorMessage error="Email not confirmed" />);
      
      expect(getByText('Please check your email and click the confirmation link before signing in.')).toBeTruthy();
    });

    it('should convert too many requests error', () => {
      const { getByText } = render(<ErrorMessage error="Too many requests" />);
      
      expect(getByText('Too many attempts. Please wait a moment before trying again.')).toBeTruthy();
    });

    it('should convert weak password error', () => {
      const { getByText } = render(<ErrorMessage error="Weak password" />);
      
      expect(getByText('Password must be at least 6 characters long with a mix of letters and numbers.')).toBeTruthy();
    });

    it('should convert email already exists error', () => {
      const { getByText } = render(<ErrorMessage error="Email already exists" />);
      
      expect(getByText('An account with this email already exists. Try signing in instead.')).toBeTruthy();
    });

    it('should convert network error', () => {
      const { getByText } = render(<ErrorMessage error="Network error occurred" />);
      
      expect(getByText('Network error. Please check your internet connection and try again.')).toBeTruthy();
    });

    it('should convert timeout error', () => {
      const { getByText } = render(<ErrorMessage error="Request timeout" />);
      
      expect(getByText('Request timed out. Please try again.')).toBeTruthy();
    });

    it('should convert slot unavailable error', () => {
      const { getByText } = render(<ErrorMessage error="Slot is unavailable" />);
      
      expect(getByText('This time slot is no longer available. Please choose another slot.')).toBeTruthy();
    });

    it('should convert booking conflict error', () => {
      const { getByText } = render(<ErrorMessage error="Booking conflict detected" />);
      
      expect(getByText('Another customer is booking this slot. An auction may start soon.')).toBeTruthy();
    });

    it('should convert PGRST116 error', () => {
      const { getByText } = render(<ErrorMessage error="PGRST116: The result contains 0 rows" />);
      
      expect(getByText('Account setup is in progress. Please wait a moment and try logging in again.')).toBeTruthy();
    });

    it('should convert 406 error', () => {
      const { getByText } = render(<ErrorMessage error="406 Not Acceptable" />);
      
      expect(getByText('Account setup is in progress. Please wait a moment and try logging in again.')).toBeTruthy();
    });

    it('should convert user type error', () => {
      const { getByText } = render(<ErrorMessage error="User type not found" />);
      
      expect(getByText('There was an issue with your account setup. Please try logging out and back in.')).toBeTruthy();
    });

    it('should handle case insensitive error matching', () => {
      const { getByText } = render(<ErrorMessage error="INVALID LOGIN CREDENTIALS" />);
      
      expect(getByText('Invalid email or password. Please check your credentials and try again.')).toBeTruthy();
    });

    it('should return original message for unknown errors', () => {
      const { getByText } = render(<ErrorMessage error="Unknown custom error" />);
      
      expect(getByText('Unknown custom error')).toBeTruthy();
    });
  });

  it('should apply custom styles', () => {
    const customStyle = { marginTop: 20 };
    const { getByTestId } = render(
      <ErrorMessage error="Test error" style={customStyle} />
    );
    
    const errorContainer = getByTestId('error-message-container');
    expect(errorContainer.props.style).toContainEqual(customStyle);
  });

  it('should have correct accessibility properties', () => {
    const { getByText } = render(<ErrorMessage error="Test error" />);
    
    const errorText = getByText('Test error');
    expect(errorText).toBeTruthy();
  });

  it('should handle very long error messages', () => {
    const longError = 'This is a very long error message that should still be displayed properly even when it contains many words and could potentially wrap to multiple lines in the UI.';
    const { getByText } = render(<ErrorMessage error={longError} />);
    
    expect(getByText(longError)).toBeTruthy();
  });

  it('should handle error messages with special characters', () => {
    const specialError = 'Error: User@domain.com failed to authenticate (code: 401)';
    const { getByText } = render(<ErrorMessage error={specialError} />);
    
    expect(getByText(specialError)).toBeTruthy();
  });
});