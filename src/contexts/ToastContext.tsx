import React, { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react'
import { View, Text, StyleSheet } from 'react-native'

type ToastType = 'info' | 'success' | 'error'

interface ToastOptions {
  type?: ToastType
  duration?: number
}

interface ToastContextType {
  show: (message: string, options?: ToastOptions) => void
}

const ToastContext = createContext<ToastContextType | undefined>(undefined)

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [visible, setVisible] = useState(false)
  const [message, setMessage] = useState('')
  const [type, setType] = useState<ToastType>('info')
  const hideTimer = useRef<NodeJS.Timeout | null>(null)

  const show = useCallback((msg: string, opts?: ToastOptions) => {
    if (hideTimer.current) {
      clearTimeout(hideTimer.current)
    }
    setMessage(msg)
    setType(opts?.type || 'info')
    setVisible(true)
    const duration = opts?.duration ?? 2500
    hideTimer.current = setTimeout(() => setVisible(false), duration)
  }, [])

  const value = useMemo(() => ({ show }), [show])

  const bg = type === 'success' ? 'rgba(16, 185, 129, 0.95)'
    : type === 'error' ? 'rgba(239, 68, 68, 0.95)'
    : 'rgba(55, 65, 81, 0.95)'

  return (
    <ToastContext.Provider value={value}>
      {children}
      {visible && (
        <View style={[styles.container]}> 
          <View style={[styles.toast, { backgroundColor: bg }]}> 
            <Text style={styles.text}>{message}</Text>
          </View>
        </View>
      )}
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within a ToastProvider')
  return ctx
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 48,
    alignItems: 'center',
    zIndex: 9999,
  },
  toast: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
  },
  text: {
    color: '#fff',
    fontWeight: '500',
  },
})

