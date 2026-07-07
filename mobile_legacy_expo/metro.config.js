const { getDefaultConfig } = require('@expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

// 1. Resolve monorepo paths
const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '..');

config.watchFolders = [workspaceRoot];

// 2. Instruct Metro to search local and root workspaces for dependencies
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
];

// 3. EXCLUDE massive directories from FSEvent file watcher to prevent EMFILE errors
config.resolver.blockList = [
  // Exclude nested packages node_modules
  /node_modules\/.*\/node_modules/,
  // Exclude admin panel codebase (NextJS has no business inside React Native Metro)
  /admin\/.*/,
  // Exclude NextJS build cache
  /\.next\/.*/,
  // Exclude local git cache
  /\.git\/.*/
];

module.exports = config;
