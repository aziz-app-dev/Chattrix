const { getDefaultConfig } = require("expo/metro-config");

const config = getDefaultConfig(__dirname);

// Fix socket.io-client ESM module resolution for React Native
config.resolver.sourceExts = [...config.resolver.sourceExts, "mjs", "cjs"];
config.resolver.unstable_enablePackageExports = true;

module.exports = config;
