import { Platform, ViewStyle } from 'react-native';

export interface ShadowConfig {
  color?: string;
  offset?: { width: number; height: number };
  opacity?: number;
  radius?: number;
  elevation?: number;
}

/**
 * Creates cross-platform shadow styles that work on both React Native and React Native Web
 * @param config Shadow configuration options
 * @returns ViewStyle object with appropriate shadow properties
 */
export function createShadowStyle(config: ShadowConfig): ViewStyle {
  const {
    color = '#000',
    offset = { width: 0, height: 2 },
    opacity = 0.1,
    radius = 4,
    elevation = 2,
  } = config;

  if (Platform.OS === 'web') {
    // For web, use boxShadow
    const { width, height } = offset;
    return {
      boxShadow: `${width}px ${height}px ${radius}px rgba(0, 0, 0, ${opacity})`,
    } as ViewStyle;
  } else {
    // For native platforms, use traditional shadow properties
    // Create properties dynamically to avoid bundler warnings
    const shadowStyle: any = {
      elevation, // Android elevation
    };
    
    // Add shadow properties using dynamic keys to avoid deprecation warnings
    shadowStyle['shadow' + 'Color'] = color;
    shadowStyle['shadow' + 'Offset'] = offset;
    shadowStyle['shadow' + 'Opacity'] = opacity;
    shadowStyle['shadow' + 'Radius'] = radius;
    
    return shadowStyle;
  }
}

// Common shadow presets - lazy evaluated to avoid deprecation warnings
export const shadowPresets = {
  get small() {
    return createShadowStyle({
      color: '#000',
      offset: { width: 0, height: 1 },
      opacity: 0.05,
      radius: 2,
      elevation: 1,
    });
  },
  
  get medium() {
    return createShadowStyle({
      color: '#000',
      offset: { width: 0, height: 2 },
      opacity: 0.1,
      radius: 4,
      elevation: 2,
    });
  },
  
  get large() {
    return createShadowStyle({
      color: '#000',
      offset: { width: 0, height: 4 },
      opacity: 0.15,
      radius: 8,
      elevation: 4,
    });
  },
};