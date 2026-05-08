const { getDefaultConfig } = require('expo/metro-config')
const path = require('path')

const projectRoot = __dirname
const workspaceRoot = path.resolve(projectRoot, '../..')

const config = getDefaultConfig(projectRoot)

config.watchFolders = [workspaceRoot]

config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
]

// Follow pnpm symlinks into the virtual store
config.resolver.unstable_enableSymlinks = true

// Resolve package.json `exports` fields (required for ESM-only packages like copy-anything)
config.resolver.unstable_enablePackageExports = true

module.exports = config
