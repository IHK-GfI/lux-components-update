import { chain, Rule, SchematicContext, Tree } from '@angular-devkit/schematics';
import { iterateFilesAndModifyContent, moveFilesToDirectory } from '../utility/files';
import {
  finish,
  messageInfoRule,
  messageSuccessRule,
  replaceAll,
  waitForTreeCallback
} from '../utility/util';
import { validateAngularVersion, validateNodeVersion } from '../utility/validation';
import { updateDependencies } from '../update-dependencies/index';
import * as chalk from 'chalk';
import { updateMajorVersion, updateNodeMinVersion } from '../update/index';

export function addLuxComponents(options: any): Rule {
  return (tree: Tree, _context: SchematicContext) => {
    return chain([
      check(),
      updateDependencies(),
      updateApp(options),
      updateStylesScss(options),
      updateIndexHtml(options),
      finish(
        `Die LUX-Components ${updateMajorVersion} wurden erfolgreich eingerichtet.`,
        `${chalk.yellowBright('Fertig!')}`
      )
    ]);
  };
}

/**
 * Prüft ob die Versionen des Projekts mit den erforderlichen Versionen dieses Updates übereinstimmen.
 */
export function check(): Rule {
  return (tree: Tree, context: SchematicContext) => {
    return waitForTreeCallback(tree, () => {
      validateAngularVersion(tree, context, `^${+updateMajorVersion}.0.0`);
      validateNodeVersion(context, updateNodeMinVersion);

      return tree;
    });
  };
}

export function updateIndexHtml(options: any): Rule {
  return chain([
    messageInfoRule(`index.html wird aktualisiert...`),
    (tree: Tree, context: SchematicContext) => {
      iterateFilesAndModifyContent(
        tree,
        options.path,
        (filePath: string, content: string) => {
          let modifiedContent = replaceAll(content, '<body>', '<body style="margin: 0">');

          if (content !== modifiedContent) {
            tree.overwrite(filePath, modifiedContent);
          }
        },
        'index.html'
      );
    },
    messageSuccessRule(`index.html wurde aktualisiert.`)
  ]);
}

export function updateApp(options: any): Rule {
  return chain([
    messageInfoRule(`App-Dateien werden angelegt...`),
    moveFilesToDirectory(options, 'files/app', 'src/app'),
    moveFilesToDirectory(options, 'files/environments', 'src/environments'),
    messageSuccessRule(`App-Dateien wurden angelegt.`)
  ]);
}

export function updateStylesScss(options: any): Rule {
  return chain([
    messageInfoRule(`style.scss wird aktualisiert...`),
    moveFilesToDirectory(options, 'files/styles', 'src/'),
    messageSuccessRule(`style.scss wurde aktualisiert.`)
  ]);
}
