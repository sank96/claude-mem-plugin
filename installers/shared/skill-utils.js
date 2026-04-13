'use strict';

const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const {
  copyDirectory,
  ensureDir,
  removeDirectory,
} = require('./file-utils.js');

function resolveSkillPaths(options = {}) {
  const packageRoot = options.packageRoot ?? path.resolve(__dirname, '..', '..');
  const sourceSkillName = options.sourceSkillName ?? options.skillName ?? 'claude-mem';
  const targetSkillName = options.targetSkillName ?? options.skillName ?? sourceSkillName;
  const skillRoot = options.skillRoot ?? path.join(os.homedir(), '.agents', 'skills');

  return {
    skillName: targetSkillName,
    sourceSkillName,
    targetSkillName,
    skillRoot,
    sourceDir: path.join(packageRoot, 'skills', sourceSkillName),
    targetDir: path.join(skillRoot, targetSkillName),
  };
}

function hasExistingLinkedSkill(targetDir) {
  if (!fs.existsSync(targetDir)) {
    return false;
  }

  try {
    const stats = fs.lstatSync(targetDir);
    return stats.isSymbolicLink();
  } catch {
    return false;
  }
}

function installSharedSkill(options = {}) {
  const paths = resolveSkillPaths(options);
  ensureDir(paths.skillRoot);
  if (hasExistingLinkedSkill(paths.targetDir)) {
    return {
      ...paths,
      preservedExistingLink: true,
    };
  }

  removeDirectory(paths.targetDir);
  copyDirectory(paths.sourceDir, paths.targetDir);
  return {
    ...paths,
    preservedExistingLink: false,
  };
}

function uninstallSharedSkill(options = {}) {
  const paths = resolveSkillPaths(options);
  removeDirectory(paths.targetDir);
  return paths;
}

module.exports = {
  hasExistingLinkedSkill,
  installSharedSkill,
  resolveSkillPaths,
  uninstallSharedSkill,
};
