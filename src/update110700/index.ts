import { chain, Rule, SchematicContext, Tree } from '@angular-devkit/schematics';
import * as chalk from 'chalk';
import { hasPackageJsonDependency, updateDependency, updateDependencyDev } from '../utility/dependencies';
import { finish, messageInfoRule, messageSuccessRule } from '../utility/util';

export function update110700(options: any): Rule {
  return (tree: Tree, context: SchematicContext) => {
    return chain([
      messageInfoRule(`Die LUX-Components werden auf die Version 11.7.0 aktualisiert...`),

      messageInfoRule(`Die Datei "package.json" wird angepasst...`),
      updateDependencies(),
      messageSuccessRule(`Die Datei "package.json" wurde angepasst.`),

      messageSuccessRule(`Die LUX-Components wurden auf die Version 11.7.0 aktualisiert.`),
      finish(`${chalk.yellowBright('Fertig!')}`)
    ]);
  };

  function updateDependencies() {
    return (tree: Tree, _context: SchematicContext) => {
      updateDependency(tree, '@ihk-gfi/lux-components', '11.7.0');
      updateDependency(tree, '@ihk-gfi/lux-components-theme', '11.9.0');

      updateDependencyDev(tree, '@angular-devkit/build-angular', '0.1102.17');
      updateDependencyDev(tree, '@angular/cli', '11.2.17');

      if (hasPackageJsonDependency(tree, '@angular-eslint/builder')) {
        updateDependencyDev(tree, '@angular-eslint/builder', '4.3.1');
      }
      if (hasPackageJsonDependency(tree, '@angular-eslint/eslint-plugin')) {
        updateDependencyDev(tree, '@angular-eslint/eslint-plugin', '4.3.1');
      }
      if (hasPackageJsonDependency(tree, '@angular-eslint/eslint-plugin-template')) {
        updateDependencyDev(tree, '@angular-eslint/eslint-plugin-template', '4.3.1');
      }
      if (hasPackageJsonDependency(tree, '@angular-eslint/schematics')) {
        updateDependencyDev(tree, '@angular-eslint/schematics', '4.3.1');
      }
      if (hasPackageJsonDependency(tree, '@angular-eslint/template-parser')) {
        updateDependencyDev(tree, '@angular-eslint/template-parser', '4.3.1');
      }

      return tree;
    };
  }
}
