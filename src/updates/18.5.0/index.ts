import { chain, Rule, SchematicContext, Tree } from '@angular-devkit/schematics';
import * as chalk from 'chalk';
import { updateDep } from '../../update-dependencies/index';
import { finish, messageInfoRule, messageSuccessRule, updateI18nFile } from '../../utility/util';

export function update180500(_options: any, runNpmInstall = true): Rule {
  return (_tree: Tree, _context: SchematicContext) => {
    return chain([
      messageInfoRule(`Die LUX-Components werden auf die Version 18.5.0 aktualisiert...`),
      messageInfoRule(`Die Datei "package.json" wird angepasst...`),
      updateDep('@ihk-gfi/lux-components', '18.5.0', false),
      updateDep('@ihk-gfi/lux-components-theme', '18.5.0', false),
      updateDep('dompurify', '~3.2.4', true),
      updateI18NFiles(),
      messageSuccessRule(`Die LUX-Components wurden auf die Version 18.5.0 aktualisiert.`),
      finish(runNpmInstall, `${chalk.yellowBright('Fertig!')}`)
    ]);
  };
}

export function updateI18NFiles(): Rule {
  return (tree: Tree, _context: SchematicContext) => {
    messageInfoRule(`I18n-Dateien werden angepasst...`), updateI18nFile(tree, 'de', 'luxc.chips.input.placeholder.lbl', i18nDeChip);
    updateI18nFile(tree, 'en', 'luxc.chips.input.placeholder.lbl', i18nEnChip);
    messageInfoRule(`I18n-Dateien wurden angepasst.`);
  };
}

export const i18nDeChip = `<trans-unit id="luxc.chips.remove" datatype="html">
        <source>entfernen</source>
        <context-group purpose="location">
          <context context-type="sourcefile">src/app/modules/lux-form/lux-chips-ac/lux-chips-ac.component.html</context>
          <context context-type="linenumber">37</context>
        </context-group>
        <context-group purpose="location">
          <context context-type="sourcefile">src/app/modules/lux-form/lux-chips-ac/lux-chips-ac.component.html</context>
          <context context-type="linenumber">73</context>
        </context-group>
      </trans-unit>`;

export const i18nEnChip = `<trans-unit id="luxc.chips.remove" datatype="html">
        <source>entfernen</source>
        <target>remove</target>
        <context-group purpose="location">
          <context context-type="sourcefile">src/app/modules/lux-form/lux-chips-ac/lux-chips-ac.component.html</context>
          <context context-type="linenumber">37</context>
        </context-group>
        <context-group purpose="location">
          <context context-type="sourcefile">src/app/modules/lux-form/lux-chips-ac/lux-chips-ac.component.html</context>
          <context context-type="linenumber">73</context>
        </context-group>
      </trans-unit>`;
