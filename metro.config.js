const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Comprehensive warning suppression for React Native Web deprecation warnings
if (typeof console !== 'undefined') {
  const originalConsoleWarn = console.warn;
  const originalConsoleError = console.error;
  
  // Override console.warn
  console.warn = function(message, ...args) {
    // Skip specific deprecation warnings from expo-router and React Native Web
    if (typeof message === 'string') {
      const lowerMessage = message.toLowerCase();
      if (
        message.includes('"shadow*" style props are deprecated. Use "boxShadow"') ||
        message.includes('shadow*') && message.includes('deprecated') ||
        lowerMessage.includes('shadow') && lowerMessage.includes('deprecated') ||
        message.includes('props.pointerEvents is deprecated. Use style.pointerEvents') ||
        message.includes('pointerEvents') && message.includes('deprecated')
      ) {
        return; // Don't log these warnings
      }
    }
    // Log other warnings normally
    originalConsoleWarn.apply(console, [message, ...args]);
  };
  
  // Also override console.error for the same warnings
  console.error = function(message, ...args) {
    if (typeof message === 'string') {
      const lowerMessage = message.toLowerCase();
      if (
        message.includes('"shadow*" style props are deprecated. Use "boxShadow"') ||
        message.includes('shadow*') && message.includes('deprecated') ||
        lowerMessage.includes('shadow') && lowerMessage.includes('deprecated') ||
        message.includes('props.pointerEvents is deprecated. Use style.pointerEvents') ||
        message.includes('pointerEvents') && message.includes('deprecated')
      ) {
        return; // Don't log these warnings
      }
    }
    originalConsoleError.apply(console, [message, ...args]);
  };
}

module.exports = config;