/**
 * Minimal Expo config for a boot-verification APK.
 * Camera/MediaPipe plugins are omitted until native startup is stable.
 */
module.exports = ({ config }) => {
  const profile = process.env.EAS_BUILD_PROFILE;
  const enableUpdates = profile === 'preview' || profile === 'production';

  return {
    ...config,
    name: 'Exercise Counter',
    slug: 'exercise_counter',
    version: '1.0.5',
    scheme: 'exercisecounter',
    android: {
      ...config.android,
      package: 'com.exercisecounter.app',
      versionCode: 6,
      scheme: ['exercisecounter', 'com.exercisecounter.app'],
    },
    ios: {
      ...config.ios,
      bundleIdentifier: 'com.exercisecounter.app',
    },
    updates: {
      url: 'https://u.expo.dev/eb961e2a-eb85-42c6-a8bc-695a9887becc',
      enabled: enableUpdates,
      checkAutomatically: enableUpdates ? 'ON_LOAD' : 'NEVER',
      fallbackToCacheTimeout: 0,
    },
    plugins: ['expo-updates'],
  };
};
