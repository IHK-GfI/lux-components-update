import { chain, Rule, SchematicContext, Tree } from '@angular-devkit/schematics';
import * as chalk from 'chalk';
import { updateDependency } from '../utility/dependencies';
import { finish, messageInfoRule, messageSuccessRule } from '../utility/util';

export function update110100(options: any): Rule {
  return (tree: Tree, context: SchematicContext) => {
    return chain([
      messageInfoRule(`Die LUX-Components werden auf die Version 11.1.0 aktualisiert...`),
      messageInfoRule(`Die Datei "package.json" wird angepasst...`),
      (tree: Tree, _context: SchematicContext) => {
        updateDependency(tree, '@ihk-gfi/lux-components', '11.1.0');
        updateDependency(tree, '@ihk-gfi/lux-components-theme', '^11.3.0');

        return tree;
      },
      messageSuccessRule(`Die Datei "package.json" wurde angepasst.`),
      messageSuccessRule(`Die LUX-Components wurden auf die Version 11.1.0 aktualisiert.`),
      finish(`${chalk.yellowBright('Fertig!')}`)
    ]);
  };
}
