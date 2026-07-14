const { getDefaultConfig } = require("expo/metro-config");

const config = getDefaultConfig(__dirname);

// Fix socket.io-client ESM module resolution for React Native
config.resolver.sourceExts = [...config.resolver.sourceExts, "mjs", "cjs"];
config.resolver.unstable_enablePackageExports = true;

// Prevent Metro's file watcher from crashing on native build artifacts
// (android/.cxx and android/**/build churn during gradle builds -> ENOENT crashes)
config.resolver.blockList = [
  /android[\\/]\.cxx[\\/].*/,
  /android[\\/]app[\\/]build[\\/].*/,
  /android[\\/]build[\\/].*/,
  /node_modules[\\/].*[\\/]android[\\/]\.cxx[\\/].*/,
  /node_modules[\\/].*[\\/]android[\\/]build[\\/].*/,
];

module.exports = config;
