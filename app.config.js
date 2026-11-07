/**
 * Expo app config.
 * Development builds disable OTA. Preview/production keep OTA enabled.
 */
module.exports = ({ config }) => {
  const profile = process.env.EAS_BUILD_PROFILE;
  const enableUpdates = profile === 'preview' || profile === 'production';

  return {
    ...config,
    name: 'Exercise Counter',
    slug: 'exercise_counter',
    version: '1.0.4',
    scheme: 'exercisecounter',
    android: {
      ...config.android,
      package: 'com.exercisecounter.app',
      versionCode: 5,
      // Required by Expo SDK 53+ deep linking / dev-client on Android.
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
    plugins: [
      'expo-dev-client',
      [
        'react-native-vision-camera',
        {
          cameraPermissionText:
            'Camera access is required to track your body pose and count exercise repetitions.',
          enableMicrophonePermission: false,
        },
      ],
      [
        'react-native-mediapipe-posedetection',
        {
          assetsPaths: ['./assets/models/'],
        },
      ],
      'expo-updates',
    ],
  };
};
