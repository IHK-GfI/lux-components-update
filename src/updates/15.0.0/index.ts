import { chain, Rule, SchematicContext, Tree } from '@angular-devkit/schematics';
import * as chalk from 'chalk';
import { deleteDep, updateDependencies } from '../../update-dependencies/index';
import { logInfo, logInfoWithDescriptor, logSuccess } from '../../utility/logging';
import { applyRuleIf, finish, messageInfoRule, messageSuccessRule } from '../../utility/util';
import { validateLuxComponentsVersion, validateNodeVersion } from '../../utility/validation';

export const updateMajorVersion = '15';
export const updateMinVersion = '14.7.0';
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
      messageSuccessRule(`Abhängigkeiten der Material- und FA-Icons wurden entfernt.`)
    ]);
  };
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
