import { Alert } from 'react-native'

type AlertLike = {
  alert: typeof Alert.alert
}

const fallbackAlert: AlertLike = {
  alert: (...args) => {
    console.warn('[nativeAlert] Alert fallback invoked', ...args)
  }
}

export const nativeAlert: AlertLike = Alert && typeof Alert.alert === 'function'
  ? Alert
  : fallbackAlert
