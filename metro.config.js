const { getDefaultConfig } = require('expo/metro-config');

/**
 * Use Expo's default Metro config. Custom resolvers have caused
 * "Global was not installed" crashes with Expo SDK 53 dev clients.
 */
const config = getDefaultConfig(__dirname);

module.exports = config;
