import { chain, Rule, SchematicContext, Tree } from '@angular-devkit/schematics';
import * as chalk from 'chalk';
import { updateDependency, updateDependencyDev } from '../utility/dependencies';
import { finish, messageInfoRule, messageSuccessRule } from '../utility/util';

export function update110001(options: any): Rule {
  return (tree: Tree, context: SchematicContext) => {
    return chain([
      messageInfoRule(`Die LUX-Components werden auf die Version 11.0.1 aktualisiert...`),
      messageInfoRule(`Die Datei "package.json" wird angepasst...`),
      (tree: Tree, _context: SchematicContext) => {
        updateDependencyDev(tree, '@angular-devkit/build-angular', '0.1102.14');
        updateDependencyDev(tree, '@angular/cli', '11.2.14');
        updateDependencyDev(tree, '@angular/compiler-cli', '11.2.14');
        updateDependencyDev(tree, '@angular/elements', '11.2.14');
        updateDependencyDev(tree, '@angular/language-service', '11.2.14');

        updateDependency(tree, '@angular/animations', '11.2.14');
        updateDependency(tree, '@angular/cdk', '11.2.13');
        updateDependency(tree, '@angular/common', '11.2.14');
        updateDependency(tree, '@angular/compiler', '11.2.14');
        updateDependency(tree, '@angular/core', '11.2.14');
        updateDependency(tree, '@angular/forms', '11.2.14');
        updateDependency(tree, '@angular/localize', '11.2.14');
        updateDependency(tree, '@angular/material', '11.2.13');
        updateDependency(tree, '@angular/platform-browser', '11.2.14');
        updateDependency(tree, '@angular/platform-browser-dynamic', '11.2.14');
        updateDependency(tree, '@angular/router', '11.2.14');
        updateDependency(tree, '@ihk-gfi/lux-components', '11.0.1');
        updateDependency(tree, '@ihk-gfi/lux-components-update', '^11.0.0');
        updateDependency(tree, '@ihk-gfi/lux-components-theme', '^11.1.0');

        return tree;
      },
      messageSuccessRule(`Die Datei "package.json" wurde angepasst.`),
      messageSuccessRule(`Die LUX-Components wurden auf die Version 11.0.1 aktualisiert.`),
      finish(`${chalk.yellowBright('Fertig!')}`)
    ]);
  };
}
