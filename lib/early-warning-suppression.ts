// Early warning suppression - runs before any other React Native Web code
// This must be imported as early as possible to catch warnings during bundling

if (typeof console !== 'undefined') {
  // Store original functions
  const originalWarn = console.warn;
  const originalError = console.error;
  const originalLog = console.log;

  // Global warning suppression for shadow deprecation warnings
  const shouldSuppressWarning = (message: any): boolean => {
    if (typeof message === 'string') {
      const lowerMessage = message.toLowerCase();
      return (
        message.includes('"shadow*" style props are deprecated. Use "boxShadow"') ||
        message.includes('shadow*') && message.includes('deprecated') ||
        lowerMessage.includes('shadow') && lowerMessage.includes('deprecated') ||
        message.includes('props.pointerEvents is deprecated. Use style.pointerEvents') ||
        message.includes('pointerEvents') && message.includes('deprecated') ||
        // Additional patterns for Metro bundler warnings
        message.includes('warnOnce') && message.includes('shadow') ||
        message.includes('preprocess') && message.includes('shadow')
      );
    }
    return false;
  };

  // Override console.warn
  console.warn = function(message: any, ...args: any[]) {
    if (shouldSuppressWarning(message)) {
      return; // Skip deprecation warnings
    }
    originalWarn.apply(console, [message, ...args]);
  };

  // Override console.error  
  console.error = function(message: any, ...args: any[]) {
    if (shouldSuppressWarning(message)) {
      return; // Skip deprecation warnings
    }
    originalError.apply(console, [message, ...args]);
  };

  // Also override console.log in case warnings are logged there
  console.log = function(message: any, ...args: any[]) {
    if (shouldSuppressWarning(message)) {
      return; // Skip deprecation warnings
    }
    originalLog.apply(console, [message, ...args]);
  };
}

// Additional global error suppression for React Native Web
if (typeof window !== 'undefined' && typeof window.addEventListener === 'function') {
  window.addEventListener('error', (event) => {
    if (event.message && typeof event.message === 'string') {
      if (
        event.message.includes('shadow*') && event.message.includes('deprecated') ||
        event.message.includes('boxShadow')
      ) {
        event.preventDefault();
        event.stopPropagation();
        return false;
      }
    }
  }, true);

  window.addEventListener('unhandledrejection', (event) => {
    if (event.reason && typeof event.reason === 'string') {
      if (
        event.reason.includes('shadow*') && event.reason.includes('deprecated') ||
        event.reason.includes('boxShadow')
      ) {
        event.preventDefault();
        return false;
      }
    }
  });
}

export { };
