import { chain, Rule, SchematicContext, Tree } from '@angular-devkit/schematics';
import * as chalk from 'chalk';
import { updateDep, updateDevDep } from '../../update-dependencies/index';
import { finish, messageInfoRule, messageSuccessRule } from '../../utility/util';

export function update140600(_options: any): Rule {
  return (_tree: Tree, _context: SchematicContext) => {
    return chain([
      messageInfoRule(`Die LUX-Components werden auf die Version 14.6.0 aktualisiert...`),
      messageInfoRule(`Die Datei "package.json" wird angepasst...`),
      updateDep('@ihk-gfi/lux-components', '14.6.0', false),
      updateDep('@angular/animations', '14.3.0', true),
      updateDep('@angular/common', '14.3.0', true),
      updateDep('@angular/compiler', '14.3.0', true),
      updateDep('@angular/core', '14.3.0', true),
      updateDep('@angular/forms', '14.3.0', true),
      updateDep('@angular/localize', '14.3.0', true),
      updateDep('@angular/platform-browser', '14.3.0', true),
      updateDep('@angular/platform-browser-dynamic', '14.3.0', true),
      updateDep('@angular/router', '14.3.0', true),
      updateDevDep('@angular-devkit/build-angular', '14.2.11', true),
      updateDevDep('@angular-eslint/builder', '14.4.0', true),
      updateDevDep('@angular-eslint/eslint-plugin', '14.4.0', true),
      updateDevDep('@angular-eslint/eslint-plugin-template', '14.4.0', true),
      updateDevDep('@angular-eslint/schematics', '14.4.0', true),
      updateDevDep('@angular-eslint/template-parser', '14.4.0', true),
      updateDevDep('@angular/cli', '14.2.11', true),
      updateDevDep('@angular/compiler-cli', '14.3.0', true),
      updateDevDep('@angular/elements', '14.3.0', true),
      updateDevDep('@angular/language-service', '14.3.0', true),
      messageSuccessRule(`Die LUX-Components wurden auf die Version 14.6.0 aktualisiert.`),
      finish(true, `${chalk.yellowBright('Fertig!')}`)
    ]);
  };
}
