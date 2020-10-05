import { chain, Rule, SchematicContext, Tree } from '@angular-devkit/schematics';
import * as semver from 'semver';
import { getProject } from '@schematics/angular/utility/project';
import { logInfoWithDescriptor } from '../utility/logging';
import { getPackageJsonDependency } from '../utility/dependencies';
import { deleteFilesInDirectory, moveFilesToDirectory } from '../utility/files';
import { existsSync, readdirSync } from 'fs';
import { messageInfoInternRule, messageInfoRule, messageSuccessRule } from '../utility/util';

export function luxUpdateTheme(options: any): Rule {
  return (tree: Tree, _context: SchematicContext) => {
    logInfoWithDescriptor(`Theme wird aktualisiert...`);

    setup(options, tree);

    const version = getPackageJsonDependency(tree, '@ihk-gfi/lux-components').version;
    const themeDir = findThemeDir(getThemeDirs(), version);
    const themeFiles = getThemeFiles(themeDir);

    return chain([
      messageInfoRule(`Alte Dateien werden gelöscht...`),
      messageInfoInternRule(`Alte Dateien werden gelöscht...`),
      deleteFilesInDirectory(options, 'src/theming', themeFiles),
      messageInfoInternRule(`Neue Dateien werden kopiert...`),
      moveFilesToDirectory(options, `files/${themeDir}`, 'src/theming'),
      messageSuccessRule(`Theme wurde aktualisiert.`)
    ]);
  };
}

function setup(options: any, tree: Tree) {
  if (options.path === undefined) {
    options.path = getProject(tree, options.project).root;
  }
}

function getThemeDirs(): string[] {
  let themeDirs;
  if (existsSync('./src/lux-update-theme/files')) {
    themeDirs = readdirSync('./src/lux-update-theme/files');
  } else {
    themeDirs = readdirSync('./node_modules/@ihk-gfi/lux-components-update/src/lux-update-theme/files');
  }
  return themeDirs;
}

function getThemeFiles(themeDir: string) {
  let themeFiles;
  if (existsSync(`./src/lux-update-theme/files/${themeDir}`)) {
    themeFiles = readdirSync(`./src/lux-update-theme/files/${themeDir}`);
  } else {
    themeFiles = readdirSync(`./node_modules/@ihk-gfi/lux-components-update/src/lux-update-theme/files/${themeDir}`);
  }
  return themeFiles;
}

export function findThemeDir(dirs: string[], version: string): string {
  let versionNormalized = normalizeVersion(version);

  const dirsSorted = dirs.sort((a, b) => normalizeVersion(a).localeCompare(normalizeVersion(b)));
  const dirsFiltered = dirsSorted.filter((dir) => normalizeVersion(dir) <= versionNormalized);

  return dirsFiltered[dirsFiltered.length - 1];
}

export function normalizeVersion(version: string): string {
  let newVersion = version.trim();
  newVersion = newVersion.replace('^', '');
  newVersion = newVersion.replace('~', '');

  if (version.startsWith('^')) {
    newVersion = semver.major(newVersion) + '.99.99';
  }

  if (version.startsWith('~')) {
    newVersion = semver.major(newVersion) + '.' + semver.minor(newVersion) + '.99';
  }

  const versionParts = newVersion.split('.');
  for (let i = 0; i < versionParts.length; i++) {
    versionParts[i] = versionParts[i].toString().padStart(2, '0');
  }

  return versionParts.join('.');
}
