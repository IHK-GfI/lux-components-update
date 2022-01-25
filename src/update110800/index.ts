import { chain, Rule, SchematicContext, Tree } from '@angular-devkit/schematics';
import * as chalk from 'chalk';
import { hasPackageJsonDependency, updateDependency, updateDependencyDev } from '../utility/dependencies';
import { finish, messageInfoRule, messageSuccessRule } from '../utility/util';

export function update110800(options: any): Rule {
  return (tree: Tree, context: SchematicContext) => {
    return chain([
      messageInfoRule(`Die LUX-Components werden auf die Version 11.8.0 aktualisiert...`),

      messageInfoRule(`Die Datei "package.json" wird angepasst...`),
      updateDependencies(),
      messageSuccessRule(`Die Datei "package.json" wurde angepasst.`),

      messageSuccessRule(`Die LUX-Components wurden auf die Version 11.8.0 aktualisiert.`),
      finish(`${chalk.yellowBright('Fertig!')}`)
    ]);
  };

  function updateDependencies() {
    return (tree: Tree, _context: SchematicContext) => {
      updateDependency(tree, '@ihk-gfi/lux-components', '11.8.0');
      updateDependency(tree, '@ihk-gfi/lux-components-theme', '11.10.0');
      updateDependency(tree, 'marked', '4.0.10');
      updateDependency(tree, '@types/marked', '4.0.1');

      updateDependencyDev(tree, '@angular-devkit/build-angular', '0.1102.18');
      updateDependencyDev(tree, '@compodoc/compodoc', '1.1.18');

      return tree;
    };
  }
}
