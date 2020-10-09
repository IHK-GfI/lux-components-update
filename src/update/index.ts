import { chain, Rule, SchematicContext, Tree } from '@angular-devkit/schematics';
import {
  applyRuleIf,
  finish,
  messageDebugRule,
  messageInfoInternRule,
  messageInfoRule,
  messageSuccessRule,
  replaceAll,
  setupPath
} from '../utility/util';
import { validateLuxComponentsVersion, validateNodeVersion } from '../utility/validation';
import { logInfo, logInfoWithDescriptor, logSuccess } from '../utility/logging';
import { updateDependencies } from '../update-dependencies';
import { findThemeDir, updateTheme } from '../update-theme/index';
import * as chalk from 'chalk';
import { getPackageJsonDependency } from '../utility/dependencies';
import { deleteFilesInDirectory, iterateFilesAndModifyContent, moveFilesToDirectory } from '../utility/files';

export const updateMajorVersion = '10';
export const updateMinVersion = '1.9.5';
export const updateNodeMinVersion = '12.0.0';

export function update(options: any): Rule {
  return (tree: Tree, _context: SchematicContext) => {
    setupPath(options, tree);

    return chain([
      check(options),
      applyRuleIf(updateMinVersion, updateProject(options)),
      finish(
        `${chalk.yellowBright(
          'Wichtig!!!'
        )} Hinweise im Update Guide beachten -> https://github.com/IHK-GfI/lux-components/wiki/update-guide#version-${updateMajorVersion}`
      )
    ]);
  };
}

function check(options: any): Rule {
  return (tree: Tree, _context: SchematicContext) => {
    logInfoWithDescriptor(`Vorbedingungen werden geprüft...`);

    validateNodeVersion(_context, updateNodeMinVersion);
    validateLuxComponentsVersion(tree, `${updateMinVersion} || ^${updateMajorVersion}.0.0`);

    logSuccess(`Vorbedingungen wurden geprüft.`);

    return tree;
  };
}

function updateProject(options: any): Rule {
  return (tree: Tree, _context: SchematicContext) => {
    return chain([
      messageInfoRule(`LUX-Components ${updateMajorVersion} werden eingerichtet...`),
      updatePolyfills(options),
      updateDependencies(),
      updateTheme(options),
      messageSuccessRule(`LUX-Components ${updateMajorVersion} wurden eingerichtet.`)
    ]);
  };
}

export function updatePolyfills(options: any): Rule {
  return chain([
    (tree: Tree, context: SchematicContext) => {
      iterateFilesAndModifyContent(
        tree,
        options.path,
        (filePath: string, content: string) => {
          let modifiedContent = content.replace(
            /import 'core-js\/es\/weak-map';/g,
            "import 'core-js/es/weak-map';\nimport 'core-js/es/weak-set';"
          );
          modifiedContent = modifiedContent.replace(
            /import "core-js\/es\/weak-map";/g,
            'import "core-js/es/weak-map";\nimport "core-js/es/weak-set";'
          );

          if (content !== modifiedContent) {
            logInfoWithDescriptor(`polyfills.ts wird aktualisiert...`);
            tree.overwrite(filePath, modifiedContent);
            logSuccess(`polyfills.ts wurde aktualisiert.`);
          }
        },
        'polyfills.ts'
      );
    }
  ]);
}
