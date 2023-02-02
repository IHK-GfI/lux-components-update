import { chain, Rule, SchematicContext, Tree } from '@angular-devkit/schematics';
import * as chalk from 'chalk';
import { updateDep } from '../../update-dependencies/index';
import { updateJsonArray } from '../../utility/json';
import { finish, messageInfoRule, messageSuccessRule } from '../../utility/util';

export const logosAssetBlock = {
  glob: '**/*',
  input: './node_modules/@ihk-gfi/lux-components-icons-and-fonts/assets/logos/',
  output: './assets/logos'
};

export function update140200(options: any): Rule {
  return (_tree: Tree, _context: SchematicContext) => {
    return chain([
      messageInfoRule(`Die LUX-Components werden auf die Version 14.2.0 aktualisiert...`),
      messageInfoRule(`Die Datei "package.json" wird angepasst...`),
      updateDep('@ihk-gfi/lux-components', '14.2.0', false),
      updateDep('@ihk-gfi/lux-components-theme', '14.2.0', false),
      updateDep('@ihk-gfi/lux-components-icons-and-fonts', '1.3.0', false),
      addLogosAssets(options),
      messageSuccessRule(`Die LUX-Components wurden auf die Version 14.2.0 aktualisiert.`),
      finish(true, `${chalk.yellowBright('Fertig!')}`)
    ]);
  };
}

export function addLogosAssets(options: any): Rule {
  const assetPath = ['projects', options.project, 'architect', 'build', 'options', 'assets'];
  const testAssetPath = ['projects', options.project, 'architect', 'test', 'options', 'assets'];

  return chain([
    messageInfoRule(`Die Logos werden in den Asset-Abschnitten ergänzt...`),
    updateJsonArray('/angular.json', assetPath, logosAssetBlock),
    updateJsonArray('/angular.json', testAssetPath, logosAssetBlock),
    messageSuccessRule(`Die Logos wurden in den Asset-Abschnitten ergänzt.`)
  ]);
}
