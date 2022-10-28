import { chain, Rule, SchematicContext, Tree } from '@angular-devkit/schematics';
import * as chalk from 'chalk';
import { updateDependencies } from '../../update-dependencies/index';
import { iterateFilesAndModifyContent, moveFilesToDirectory } from '../../utility/files';
import { renameAttribute } from '../../utility/html';
import { logInfo, logInfoWithDescriptor, logSuccess } from '../../utility/logging';
import { applyRuleIf, finish, messageInfoRule, messageSuccessRule } from '../../utility/util';
import { validateLuxComponentsVersion, validateNodeVersion } from '../../utility/validation';

export const updateMajorVersion = '14';
export const updateMinVersion = '13.2.0';
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
      copyFiles(options),
      renameLuxSelectedFiles(options),
      updateDependencies(),
      messageSuccessRule(`LUX-Components ${updateMajorVersion} wurden aktualisiert.`)
    ]);
  };
}

export function renameLuxSelectedFiles(options: any): Rule {
  return chain([
    messageInfoRule(`Das Attribut "luxSelectedFiles" wird umbenannt in "luxSelected"...`),
    (tree: Tree, _context: SchematicContext) => {
      iterateFilesAndModifyContent(
        tree,
        options.path,
        (filePath: string, content: string) => {
          let result = content;
          result = renameAttribute(result, 'lux-file-input', 'luxSelectedFiles', 'luxSelected').content;
          result = renameAttribute(result, 'lux-file-list', 'luxSelectedFiles', 'luxSelected').content;
          result = renameAttribute(result, 'lux-file-upload', 'luxSelectedFiles', 'luxSelected').content;

          result = renameAttribute(result, 'lux-file-input', 'luxSelectedFilesChange', 'luxSelectedChange').content;
          result = renameAttribute(result, 'lux-file-list', 'luxSelectedFilesChange', 'luxSelectedChange').content;
          result = renameAttribute(result, 'lux-file-upload', 'luxSelectedFilesChange', 'luxSelectedChange').content;

          if (content !== result) {
            logInfo(filePath + ' wurde angepasst.');
            tree.overwrite(filePath, result);
          }
        },
        '.component.html'
      );
    },
    messageSuccessRule(`Das Attribut "luxSelectedFiles" wurde umbenannt in "luxSelected".`)
  ]);
}

export function copyFiles(options: any): Rule {
  return chain([
    messageInfoRule(`Dateien werden kopiert...`),
    moveFilesToDirectory(options, 'files/src', '/src'),
    messageSuccessRule(`Dateien wurden kopiert.`)
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
