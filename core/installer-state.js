'use strict';

const fs = require('node:fs');
const path = require('node:path');

const MARKER_FILE_NAME = 'claude-mem-plugin-meta.json';

function getMarkerPath(adapterHome) {
  return path.join(adapterHome, MARKER_FILE_NAME);
}

function ensureParentDir(filePath) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
}

function readInstalledVersion(adapterHome) {
  const markerPath = getMarkerPath(adapterHome);

  try {
    const raw = fs.readFileSync(markerPath, 'utf8');
    const parsed = JSON.parse(raw);
    return typeof parsed.version === 'string' ? parsed.version : null;
  } catch (error) {
    if (error && error.code === 'ENOENT') {
      return null;
    }

    throw error;
  }
}

function writeInstalledVersion(adapterHome, version) {
  const markerPath = getMarkerPath(adapterHome);
  ensureParentDir(markerPath);
  fs.writeFileSync(markerPath, `${JSON.stringify({ version }, null, 2)}\n`, 'utf8');
}

function removeInstalledVersion(adapterHome) {
  try {
    fs.rmSync(getMarkerPath(adapterHome), { force: false });
  } catch (error) {
    if (error && error.code === 'ENOENT') {
      return;
    }

    throw error;
  }
}

function resolveInstallAction(adapterHome, currentVersion) {
  const installedVersion = readInstalledVersion(adapterHome);

  if (!installedVersion) {
    return {
      action: 'install',
      installedVersion: null,
    };
  }

  if (installedVersion === currentVersion) {
    return {
      action: 'skip',
      installedVersion,
    };
  }

  return {
    action: 'update',
    installedVersion,
  };
}

function snapshotDirectory(dirPath) {
  const snapshot = new Map();

  for (const entry of fs.readdirSync(dirPath, { withFileTypes: true })) {
    const entryPath = path.join(dirPath, entry.name);

    if (entry.isDirectory()) {
      for (const [relativePath, buffer] of snapshotDirectory(entryPath).entries()) {
        snapshot.set(path.join(entry.name, relativePath), buffer);
      }
      continue;
    }

    snapshot.set(entry.name, fs.readFileSync(entryPath));
  }

  return snapshot;
}

function captureSnapshot(paths) {
  const snapshot = new Map();

  for (const targetPath of paths) {
    try {
      const stats = fs.statSync(targetPath);

      if (stats.isDirectory()) {
        snapshot.set(targetPath, snapshotDirectory(targetPath));
        continue;
      }

      snapshot.set(targetPath, fs.readFileSync(targetPath));
    } catch (error) {
      if (error && error.code === 'ENOENT') {
        snapshot.set(targetPath, null);
        continue;
      }

      throw error;
    }
  }

  return snapshot;
}

function restoreDirectory(dirPath, directorySnapshot) {
  fs.rmSync(dirPath, { recursive: true, force: true });
  fs.mkdirSync(dirPath, { recursive: true });

  for (const [relativePath, buffer] of directorySnapshot.entries()) {
    const targetPath = path.join(dirPath, relativePath);
    ensureParentDir(targetPath);
    fs.writeFileSync(targetPath, buffer);
  }
}

function logRestoreError(targetPath, error) {
  process.stderr.write(
    `[claude-mem-plugin] restore snapshot error for ${targetPath}: ${error.message}\n`
  );
}

function restoreSnapshot(snapshot) {
  for (const [targetPath, value] of snapshot.entries()) {
    try {
      if (value === null) {
        fs.rmSync(targetPath, { recursive: true, force: true });
        continue;
      }

      if (value instanceof Map) {
        restoreDirectory(targetPath, value);
        continue;
      }

      ensureParentDir(targetPath);
      fs.writeFileSync(targetPath, value);
    } catch (error) {
      logRestoreError(targetPath, error);
    }
  }
}

module.exports = {
  captureSnapshot,
  MARKER_FILE_NAME,
  readInstalledVersion,
  removeInstalledVersion,
  resolveInstallAction,
  restoreSnapshot,
  writeInstalledVersion,
};
