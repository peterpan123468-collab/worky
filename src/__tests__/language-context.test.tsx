import React from 'react'
import { render, act } from '@testing-library/react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { LanguageProvider, useLanguage } from '../contexts/LanguageContext'

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
}))

// Mock useAuth hook
jest.mock('../contexts/AuthContext', () => ({
  useAuth: () => ({
    user: null,
    userType: null,
  }),
}))

// Test component to access language context
const TestComponent = () => {
  const { language, setLanguage } = useLanguage()
  return (
    <TestComponentChild 
      language={language} 
      setLanguage={setLanguage} 
    />
  )
}

const TestComponentChild = ({ language, setLanguage }: any) => {
  return (
    <div>
      <span data-testid="language-value">{language}</span>
      <button data-testid="set-language-en" onClick={() => setLanguage('en')} />
      <button data-testid="set-language-de" onClick={() => setLanguage('de')} />
    </div>
  )
}

describe('LanguageContext', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should load default language when no saved language exists', async () => {
    ;(AsyncStorage.getItem as jest.Mock).mockResolvedValue(null)

    let rendered: any
    await act(async () => {
      rendered = render(
        <LanguageProvider>
          <TestComponent />
        </LanguageProvider>
      )
    })

    expect(rendered.getByTestId('language-value').props.children).toBe('en')
  })

  it('should load saved language from AsyncStorage', async () => {
    ;(AsyncStorage.getItem as jest.Mock).mockResolvedValue('de')

    let rendered: any
    await act(async () => {
      rendered = render(
        <LanguageProvider>
          <TestComponent />
        </LanguageProvider>
      )
    })

    expect(rendered.getByTestId('language-value').props.children).toBe('de')
  })

  it('should save language to AsyncStorage when changed', async () => {
    ;(AsyncStorage.getItem as jest.Mock).mockResolvedValue(null)

    let rendered: any
    await act(async () => {
      rendered = render(
        <LanguageProvider>
          <TestComponent />
        </LanguageProvider>
      )
    })

    await act(async () => {
      rendered.getByTestId('set-language-de').props.onPress()
    })

    expect(AsyncStorage.setItem).toHaveBeenCalledWith('@worky_language', 'de')
    expect(rendered.getByTestId('language-value').props.children).toBe('de')
  })

  it('should handle invalid saved language gracefully', async () => {
    ;(AsyncStorage.getItem as jest.Mock).mockResolvedValue('invalid-lang')

    let rendered: any
    await act(async () => {
      rendered = render(
        <LanguageProvider>
          <TestComponent />
        </LanguageProvider>
      )
    })

    expect(rendered.getByTestId('language-value').props.children).toBe('en')
  })
})