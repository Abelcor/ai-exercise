/**
 * Expo config wrapper so development builds can disable OTA checks.
 * OTA surface restarts have been linked to
 * "AppRegistryBinding::stopSurface failed. Global was not installed".
 */
module.exports = ({ config }) => {
  const profile = process.env.EAS_BUILD_PROFILE;
  const enableUpdates = profile === 'preview' || profile === 'production';

  return {
    ...config,
    version: '1.0.3',
    android: {
      ...config.android,
      versionCode: 4,
    },
    updates: {
      url: 'https://u.expo.dev/eb961e2a-eb85-42c6-a8bc-695a9887becc',
      enabled: enableUpdates,
      checkAutomatically: enableUpdates ? 'ON_LOAD' : 'NEVER',
      fallbackToCacheTimeout: 0,
    },
    plugins: [
      'expo-dev-client',
      'expo-splash-screen',
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
