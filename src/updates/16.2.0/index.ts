import { chain, Rule, SchematicContext, Tree } from '@angular-devkit/schematics';
import * as chalk from 'chalk';
import { updateDep, updateDevDep } from '../../update-dependencies/index';
import { finish, messageInfoRule, messageSuccessRule } from '../../utility/util';

export function update160200(_options: any, runNpmInstall = true): Rule {
  return (_tree: Tree, _context: SchematicContext) => {
    return chain([
      messageInfoRule(`Die LUX-Components werden auf die Version 16.2.0 aktualisiert...`),
      messageInfoRule(`Die Datei "package.json" wird angepasst...`),
      updateDep('@ihk-gfi/lux-components', '16.2.0', false),
      updateDep('@ihk-gfi/lux-components-theme', '16.0.2', false),
      updateDevDep('@angular-devkit/build-angular', '16.2.14', false),
      updateDevDep('@angular/cli', '16.2.14', false),
      messageSuccessRule(`Die LUX-Components wurden auf die Version 16.2.0 aktualisiert.`),
      finish(runNpmInstall, `${chalk.yellowBright('Fertig!')}`)
    ]);
  };
}
