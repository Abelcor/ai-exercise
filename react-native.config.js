/**
 * Disable autolinking for heavy native modules while we verify a clean Android boot.
 * Re-enable these once the standalone Boot OK APK opens successfully.
 */
module.exports = {
  dependencies: {
    'react-native-mediapipe-posedetection': {
      platforms: { android: null, ios: null },
    },
    'react-native-vision-camera': {
      platforms: { android: null, ios: null },
    },
    'react-native-worklets-core': {
      platforms: { android: null, ios: null },
    },
    'react-native-reanimated': {
      platforms: { android: null, ios: null },
    },
    'react-native-gesture-handler': {
      platforms: { android: null, ios: null },
    },
  },
};
