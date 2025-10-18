// Simple test to verify the language context can be imported without errors
import { LanguageProvider } from '../../contexts/LanguageContext';

describe('Language Context', () => {
  it('should be importable', () => {
    expect(LanguageProvider).toBeDefined();
  });
});