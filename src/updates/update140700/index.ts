import { chain, Rule, SchematicContext, Tree } from '@angular-devkit/schematics';
import * as chalk from 'chalk';
import { updateDep } from '../../update-dependencies/index';
import { finish, messageInfoRule, messageSuccessRule } from '../../utility/util';

export function update140700(_options: any): Rule {
  return (_tree: Tree, _context: SchematicContext) => {
    return chain([
      messageInfoRule(`Die LUX-Components werden auf die Version 14.7.0 aktualisiert...`),
      messageInfoRule(`Die Datei "package.json" wird angepasst...`),
      updateDep('@ihk-gfi/lux-components', '14.7.0', false),
      updateDep('@ihk-gfi/lux-components-theme', '14.7.0', false),
      updateDep('@ihk-gfi/lux-components-icons-and-fonts', '1.6.0', false),
      messageSuccessRule(`Die LUX-Components wurden auf die Version 14.7.0 aktualisiert.`),
      finish(true, `${chalk.yellowBright('Fertig!')}`)
    ]);
  };
}
