/**
 * Unlink every non-essential native module for a clean Android boot test.
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
    'react-native-svg': {
      platforms: { android: null, ios: null },
    },
    'expo-dev-client': {
      platforms: { android: null, ios: null },
    },
    'expo-dev-launcher': {
      platforms: { android: null, ios: null },
    },
    'expo-dev-menu': {
      platforms: { android: null, ios: null },
    },
    'expo-dev-menu-interface': {
      platforms: { android: null, ios: null },
    },
    'expo-splash-screen': {
      platforms: { android: null, ios: null },
    },
    'expo-updates': {
      platforms: { android: null, ios: null },
    },
  },
};
