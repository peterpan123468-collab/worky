import React, { Component, ReactNode } from 'react'
import { View, Text, ScrollView, TouchableOpacity } from 'react-native'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
  error?: Error
  errorInfo?: React.ErrorInfo
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // You can also log the error to an error reporting service
    console.error('[ErrorBoundary] Uncaught error:', error, errorInfo)
    this.setState({
      hasError: true,
      error,
      errorInfo
    })
  }

  render() {
    if (this.state.hasError) {
      // You can render any custom fallback UI
      return (
        <View style={{ flex: 1, backgroundColor: '#000', padding: 20 }}>
          <Text style={{ color: '#fff', fontSize: 24, fontWeight: 'bold', marginBottom: 10 }}>
            😢 Something went wrong
          </Text>
          <ScrollView style={{ backgroundColor: '#333', padding: 10, borderRadius: 5 }}>
            <Text style={{ color: '#ff6b6b', fontWeight: 'bold' }}>
              Error: {this.state.error?.toString()}
            </Text>
            {this.state.errorInfo?.componentStack && (
              <Text style={{ color: '#fff', marginTop: 10 }}>
                {this.state.errorInfo.componentStack}
              </Text>
            )}
          </ScrollView>
          <TouchableOpacity
            onPress={() => {
              this.setState({ hasError: false, error: undefined, errorInfo: undefined })
            }}
            style={{ 
              backgroundColor: '#4a90e2', 
              padding: 15, 
              borderRadius: 5, 
              marginTop: 20,
              alignItems: 'center'
            }}
          >
            <Text style={{ color: '#fff', fontWeight: 'bold' }}>
              Try Again
            </Text>
          </TouchableOpacity>
        </View>
      )
    }

    return this.props.children
  }
}