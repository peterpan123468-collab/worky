/** @type {Detox.DetoxConfig} */
module.exports = {
  testRunner: {
    args: {
      '$0': 'jest',
      config: 'e2e/jest.config.js'
    },
    jest: {
      setupTimeout: 120000
    }
  },
  apps: {
    'expo.ios.debug': {
      type: 'ios.app',
      binaryPath: 'ios/build/Build/Products/Debug-iphonesimulator/worky.app',
      build: 'npx expo run:ios --configuration Debug'
    },
    'expo.ios.release': {
      type: 'ios.app',
      binaryPath: 'ios/build/Build/Products/Release-iphonesimulator/worky.app',
      build: 'npx expo run:ios --configuration Release'
    },
    'expo.android.debug': {
      type: 'android.apk',
      binaryPath: 'android/app/build/outputs/apk/debug/app-debug.apk',
      build: 'npx expo run:android --variant debug',
      reversePorts: [
        8081, 19000, 19001
      ]
    },
    'expo.android.release': {
      type: 'android.apk',
      binaryPath: 'android/app/build/outputs/apk/release/app-release.apk',
      build: 'npx expo run:android --variant release'
    }
  },
  devices: {
    simulator: {
      type: 'ios.simulator',
      device: {
        type: 'iPhone 15'
      }
    },
    attached: {
      type: 'android.attached',
      device: {
        adbName: '.*'
      }
    },
    emulator: {
      type: 'android.emulator',
      device: {
        avdName: 'Pixel_3a_API_30_x86'
      }
    }
  },
  configurations: {
    'expo.ios.sim.debug': {
      device: 'simulator',
      app: 'expo.ios.debug'
    },
    'expo.ios.sim.release': {
      device: 'simulator',
      app: 'expo.ios.release'
    },
    'expo.android.att.debug': {
      device: 'attached',
      app: 'expo.android.debug'
    },
    'expo.android.att.release': {
      device: 'attached',
      app: 'expo.android.release'
    },
    'expo.android.emu.debug': {
      device: 'emulator',
      app: 'expo.android.debug'
    },
    'expo.android.emu.release': {
      device: 'emulator',
      app: 'expo.android.release'
    }
  }
};
