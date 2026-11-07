/**
 * Absolute-minimum Expo config to isolate Android process crashes.
 * New Architecture disabled for this boot probe only.
 */
module.exports = ({ config }) => {
  return {
    ...config,
    name: 'Exercise Counter',
    slug: 'exercise_counter',
    version: '1.0.6',
    scheme: 'exercisecounter',
    newArchEnabled: false,
    android: {
      ...config.android,
      package: 'com.exercisecounter.app',
      versionCode: 7,
      scheme: ['exercisecounter', 'com.exercisecounter.app'],
    },
    ios: {
      ...config.ios,
      bundleIdentifier: 'com.exercisecounter.app',
    },
    updates: {
      enabled: false,
      checkAutomatically: 'NEVER',
      fallbackToCacheTimeout: 0,
    },
    plugins: [
      [
        'expo-build-properties',
        {
          android: {
            newArchEnabled: false,
          },
        },
      ],
    ],
  };
};
