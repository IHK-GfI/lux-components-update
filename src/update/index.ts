import { chain, Rule, SchematicContext, Tree } from '@angular-devkit/schematics';
import { applyRuleIf, finish, messageInfoRule, messageSuccessRule, setupPath } from '../utility/util';
import { validateLuxComponentsVersion, validateNodeVersion } from '../utility/validation';
import { logInfoWithDescriptor, logSuccess } from '../utility/logging';
import { updateDependencies } from '../update-dependencies';
import { updateTheme } from '../update-theme/index';
import * as chalk from 'chalk';

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
      updateDependencies(),
      updateTheme(options),
      messageSuccessRule(`LUX-Components ${updateMajorVersion} wurden eingerichtet.`)
    ]);
  };
}
