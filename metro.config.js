const { getDefaultConfig } = require('expo/metro-config')
const { withNativeWind } = require('nativewind/metro')

// Enable CSS interop and ensure TS extensions are resolved inside node_modules
const config = getDefaultConfig(__dirname, { isCSSEnabled: true })

config.resolver = config.resolver || {}
config.resolver.sourceExts = Array.from(
  new Set([...(config.resolver.sourceExts || []), 'ts', 'tsx', 'cjs'])
)

module.exports = withNativeWind(config, { input: './global.css' })
