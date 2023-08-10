import { chain, Rule, SchematicContext, Tree } from '@angular-devkit/schematics';
import * as chalk from 'chalk';
import { deleteDep, updateDependencies } from '../../update-dependencies/index';
import { deleteFile, moveFilesToDirectory } from '../../utility/files';
import { deleteJsonArray, deleteJsonValue, findObjectPropertyInArray, findStringInArray, updateJsonValue } from '../../utility/json';
import { logInfo, logInfoWithDescriptor, logSuccess } from '../../utility/logging';
import { removeImport, removeProvider } from '../../utility/typescript';
import { applyRuleIf, applyRuleIfFileExists, finish, messageInfoRule, messageSuccessRule } from '../../utility/util';
import { validateLuxComponentsVersion, validateNodeVersion } from '../../utility/validation';

export const updateMajorVersion = '15';
export const updateMinVersion = '14.8.0';
export const updateNodeMinVersion = '16.0.0';

export function update(options: any): Rule {
  return (_tree: Tree, _context: SchematicContext) => {
    return chain([
      check(options),
      applyRuleIf(updateMinVersion, updateProject(options)),
      finish(
        false,
        `${chalk.yellowBright(
          'Wichtig!!!'
        )} Hinweise im Update Guide beachten -> https://github.com/IHK-GfI/lux-components/wiki/update-guide-${updateMajorVersion}`
      )
    ]);
  };
}

export function updateProject(options: any): Rule {
  return (_tree: Tree, _context: SchematicContext) => {
    return chain([
      messageInfoRule(`LUX-Components ${updateMajorVersion} werden aktualisiert...`),
      updateDependencies(),
      removeMaAndFaIcons(options),
      updateProjectStructure(options),
      removeLuxMasterDetailMobileHelperService(options),
      messageSuccessRule(`LUX-Components ${updateMajorVersion} wurden aktualisiert.`)
    ]);
  };
}

export function removeMaAndFaIcons(options: any): Rule {
  return (_tree: Tree, _context: SchematicContext) => {
    return chain([
      messageInfoRule(`Abhängigkeiten der Material- und FA-Icons werden entfernt...`),
      deleteDep('@fortawesome/fontawesome-free'),
      deleteDep('material-design-icons-iconfont'),
      (tree: Tree, _context: SchematicContext) => {
        const filePath = (options.path ?? '.') + '/src/index.html';
        const content = tree.readText(filePath);
        const modifiedContent = content
          .split('\n')
          .filter((line) => !line.includes('material-icons/material-design-icons.css') && !line.includes('fontawesome/css/all.css'))
          .join('\n');

        if (content !== modifiedContent) {
          tree.overwrite(filePath, modifiedContent);
          logInfo(`${filePath}: Die Links auf die Css-Dateien entfernt.`);
        }
      },
      deleteJsonArray('/angular.json', ['projects', options.project, 'architect', 'build', 'options', 'assets'], (node) =>
        findObjectPropertyInArray(node, 'input', './node_modules/@fortawesome/fontawesome-free/css')
      ),
      deleteJsonArray('/angular.json', ['projects', options.project, 'architect', 'build', 'options', 'assets'], (node) =>
        findObjectPropertyInArray(node, 'input', './node_modules/@fortawesome/fontawesome-free/webfonts')
      ),
      deleteJsonArray('/angular.json', ['projects', options.project, 'architect', 'build', 'options', 'assets'], (node) =>
        findObjectPropertyInArray(node, 'input', './node_modules/material-design-icons-iconfont/dist')
      ),
      deleteJsonArray('/angular.json', ['projects', options.project, 'architect', 'build', 'options', 'assets'], (node) =>
        findObjectPropertyInArray(node, 'input', './node_modules/material-design-icons-iconfont/dist/fonts')
      ),
      deleteJsonArray('/angular.json', ['projects', options.project, 'architect', 'test', 'options', 'assets'], (node) =>
        findObjectPropertyInArray(node, 'input', './node_modules/@fortawesome/fontawesome-free/css')
      ),
      deleteJsonArray('/angular.json', ['projects', options.project, 'architect', 'test', 'options', 'assets'], (node) =>
        findObjectPropertyInArray(node, 'input', './node_modules/@fortawesome/fontawesome-free/webfonts')
      ),
      deleteJsonArray('/angular.json', ['projects', options.project, 'architect', 'test', 'options', 'assets'], (node) =>
        findObjectPropertyInArray(node, 'input', './node_modules/material-design-icons-iconfont/dist')
      ),
      deleteJsonArray('/angular.json', ['projects', options.project, 'architect', 'test', 'options', 'assets'], (node) =>
        findObjectPropertyInArray(node, 'input', './node_modules/material-design-icons-iconfont/dist/fonts')
      ),
      messageSuccessRule(`Abhängigkeiten der Material- und FA-Icons wurden entfernt.`)
    ]);
  };
}

export function updateProjectStructure(options: any): Rule {
  return chain([
    messageInfoRule(`Projektstruktur wird angepasst...`),
    copyAppFiles(options),
    deleteFile(options, '/src/polyfills.ts'),
    deleteFile(options, '/src/tsconfig.app.ie.json'),
    updateJsonValue('/angular.json', ['projects', options.project, 'architect', 'build', 'options', 'polyfills'], ['zone.js'], false),
    updateJsonValue(
      '/angular.json',
      ['projects', options.project, 'architect', 'test', 'options', 'polyfills'],
      ['zone.js', 'zone.js/testing', 'src/test.ts'],
      false
    ),
    deleteJsonValue('/angular.json', ['projects', options.project, 'architect', 'test', 'options', 'main']),
    applyRuleIfFileExists(
      deleteJsonArray((options.path ?? '.') + '/src/tsconfig.app.json', ['files'], (node) => findStringInArray(node, 'polyfills.ts')),
      (options.path ?? '.') + '/src/tsconfig.app.json'
    ),
    applyRuleIfFileExists(
      deleteJsonArray((options.path ?? '.') + '/src/tsconfig.spec.json', ['files'], (node) => findStringInArray(node, 'polyfills.ts')),
      (options.path ?? '.') + '/src/tsconfig.spec.json'
    ),
    applyRuleIfFileExists(
      deleteJsonArray((options.path ?? '.') + '/src/tsconfig.spec.json', ['compilerOptions', 'types'], (node) =>
        findStringInArray(node, 'node')
      ),
      (options.path ?? '.') + '/src/tsconfig.spec.json'
    ),
    messageSuccessRule(`Projektstruktur wurde angepasst.`)
  ]);
}

function check(_options: any): Rule {
  return (tree: Tree, _context: SchematicContext) => {
    logInfoWithDescriptor(`Vorbedingungen werden geprüft...`);

    validateNodeVersion(_context, updateNodeMinVersion);
    validateLuxComponentsVersion(tree, `${updateMinVersion} || ^${updateMajorVersion}.0.0`);

    logSuccess(`Vorbedingungen wurden geprüft.`);

    return tree;
  };
}

function removeLuxMasterDetailMobileHelperService(options: any): Rule {
  return chain([
    messageInfoRule(`LuxMasterDetailMobileHelperService wird entfernt...`),
    (tree: Tree, _context: SchematicContext) => {
      removeImport(
        tree,
        (options.path ? options.path : '') + '/src/app/app.component.spec.ts',
        '@ihk-gfi/lux-components',
        'LuxMasterDetailMobileHelperService',
        true
      );
      removeProvider(
        tree,
        (options.path ? options.path : '') + '/src/app/app.component.spec.ts',
        'LuxMasterDetailMobileHelperService',
        true
      );
    },
    messageSuccessRule(`LuxMasterDetailMobileHelperService wurde entfernt.`)
  ]);
}

function copyAppFiles(options: any): Rule {
  return chain([
    messageInfoRule(`Dateien werden kopiert...`),
    moveFilesToDirectory(options, 'files/src', '/src'),
    messageSuccessRule(`Dateien wurden kopiert.`)
  ]);
}
