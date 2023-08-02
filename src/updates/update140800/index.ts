import { chain, Rule, SchematicContext, Tree } from '@angular-devkit/schematics';
import * as chalk from 'chalk';
import { updateDep, updateDevDep } from '../../update-dependencies/index';
import { finish, messageInfoRule, messageSuccessRule } from '../../utility/util';

export function update140800(_options: any): Rule {
  return (_tree: Tree, _context: SchematicContext) => {
    return chain([
      messageInfoRule(`Die LUX-Components werden auf die Version 14.8.0 aktualisiert...`),
      messageInfoRule(`Die Datei "package.json" wird angepasst...`),
      updateDep('@ihk-gfi/lux-components', '14.8.0', false),
      updateDevDep('@angular-devkit/build-angular', '14.2.12', true),
      updateDevDep('@angular/cli', '14.2.12', true),
      messageSuccessRule(`Die LUX-Components wurden auf die Version 14.8.0 aktualisiert.`),
      finish(true, `${chalk.yellowBright('Fertig!')}`)
    ]);
  };
}
