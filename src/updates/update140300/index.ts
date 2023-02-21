import { chain, Rule, SchematicContext, Tree } from '@angular-devkit/schematics';
import * as chalk from 'chalk';
import { updateDep } from '../../update-dependencies/index';
import { updateJsonArray } from '../../utility/json';
import { logInfo } from '../../utility/logging';
import { finish, messageInfoRule, messageSuccessRule } from '../../utility/util';

const comment = `/* You can add global styles to this file, and also import other style files */`;
const fontImport = `@import '@ihk-gfi/lux-components-theme/src/base/luxfonts';`;
const body = `
$basepath: '/';
@include web-fonts($basepath);
`;

export const stylesScss = `${comment}
${fontImport}

${body}`;

export const fontAssetBlock = {
  glob: '**/*',
  input: './node_modules/@ihk-gfi/lux-components-icons-and-fonts/assets/fonts/',
  output: './assets/fonts'
};

export function update140300(options: any): Rule {
  return (_tree: Tree, _context: SchematicContext) => {
    return chain([
      messageInfoRule(`Die LUX-Components werden auf die Version 14.3.0 aktualisiert...`),
      messageInfoRule(`Die Datei "package.json" wird angepasst...`),
      updateDep('@ihk-gfi/lux-components', '14.3.0', false),
      updateDep('@ihk-gfi/lux-components-theme', '14.4.0', false),
      updateDep('@ihk-gfi/lux-components-icons-and-fonts', '1.4.0', false),
      updateAngularJson(options),
      updateStylesScss(options),
      messageSuccessRule(`Die LUX-Components wurden auf die Version 14.3.0 aktualisiert.`),
      finish(true, `${chalk.yellowBright('Fertig!')}`)
    ]);
  };
}

export function updateStylesScss(options: any): Rule {
  return chain([
    messageInfoRule(`Die Fonts werden in der Datei "styles.scss" ergänzt...`),
    (tree: Tree, _context: SchematicContext) => {
      const filePath = options.path + '/src/styles.scss';

      if (!tree.exists(filePath)) {
        throw Error(`Die Datei ${filePath} konnte nicht gefunden werden.`);
      }

      const lines = tree.read(filePath)!.toString().split('\n');

      let resultLines = [];
      if (lines.length > 0) {
        if (lines[0].trim().startsWith('/*') && lines[0].endsWith('*/')) {
          resultLines = [lines[0], fontImport, ...lines.slice(1, lines.length - 1), body];
        } else if (lines[0].trim() === '') {
          resultLines = [fontImport, ...lines.slice(1, lines.length - 1), body];
        } else {
          resultLines = [fontImport, ...lines, body];
        }

        tree.overwrite(filePath, resultLines.join('\n'));
      } else {
        tree.overwrite(filePath, stylesScss);
      }

      logInfo(fontImport);
      logInfo(body.replace(/\r?\n/gm, '\n           '));
    },
    messageSuccessRule(`Die Fonts wurden in der Datei "styles.scss" ergänzt.`)
  ]);
}

export function updateAngularJson(options: any): Rule {
  const assetPath = ['projects', options.project, 'architect', 'build', 'options', 'assets'];
  const testAssetPath = ['projects', options.project, 'architect', 'test', 'options', 'assets'];

  return chain([
    messageInfoRule(`Die Fonts werden in den Asset-Abschnitten ergänzt...`),
    updateJsonArray('/angular.json', assetPath, fontAssetBlock),
    updateJsonArray('/angular.json', testAssetPath, fontAssetBlock),
    messageSuccessRule(`Die Fonts wurden in den Asset-Abschnitten ergänzt.`)
  ]);
}
