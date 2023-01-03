import { chain, Rule, SchematicContext, Tree } from '@angular-devkit/schematics';
import * as chalk from 'chalk';
import { updateDependencies } from '../../update-dependencies/index';
import { iterateFilesAndModifyContent, moveFilesToDirectory } from '../../utility/files';
import { HtmlManipulator as Html } from '../../utility/html/html-manipulator';
import { renameAttrFn } from '../../utility/html/manipulator-functions';
import { logInfo, logInfoWithDescriptor, logSuccess } from '../../utility/logging';
import { applyRuleIf, finish, messageInfoRule, messageSuccessRule } from '../../utility/util';
import { validateLuxComponentsVersion, validateNodeVersion } from '../../utility/validation';

export const updateMajorVersion = '14';
export const updateMinVersion = '13.3.0';
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
          result = Html.transform(result, 'lux-file-input', renameAttrFn('luxSelectedFiles', 'luxSelected'));
          result = Html.transform(result, 'lux-file-list', renameAttrFn('luxSelectedFiles', 'luxSelected'));
          result = Html.transform(result, 'lux-file-upload', renameAttrFn('luxSelectedFiles', 'luxSelected'));

          result = Html.transform(result, 'lux-file-input', renameAttrFn('luxSelectedFilesChange', 'luxSelectedChange'));
          result = Html.transform(result, 'lux-file-list', renameAttrFn('luxSelectedFilesChange', 'luxSelectedChange'));
          result = Html.transform(result, 'lux-file-upload', renameAttrFn('luxSelectedFilesChange', 'luxSelectedChange'));

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
