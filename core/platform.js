'use strict';

const PLATFORM_ALIASES = new Map([
  ['windows', 'win32'],
  ['win', 'win32'],
  ['win32', 'win32'],
  ['darwin', 'darwin'],
  ['mac', 'darwin'],
  ['macos', 'darwin'],
  ['osx', 'darwin'],
  ['linux', 'linux'],
]);

function normalizePlatform(value) {
  if (!value) {
    return process.platform;
  }

  const normalized = String(value).trim().toLowerCase();
  return PLATFORM_ALIASES.get(normalized) ?? normalized;
}

function detectPlatform(runtimePlatform = process.platform) {
  return normalizePlatform(runtimePlatform);
}

function isWindows(runtimePlatform = process.platform) {
  return normalizePlatform(runtimePlatform) === 'win32';
}

module.exports = {
  detectPlatform,
  isWindows,
  normalizePlatform,
};
