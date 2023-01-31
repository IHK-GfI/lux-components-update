import { chain, Rule, SchematicContext, Tree } from '@angular-devkit/schematics';
import * as chalk from 'chalk';
import { updateDep } from '../../update-dependencies/index';
import { finish, messageInfoRule, messageSuccessRule, updateI18nFile } from '../../utility/util';

export function update140100(_options: any): Rule {
  return (_tree: Tree, _context: SchematicContext) => {
    return chain([
      messageInfoRule(`Die LUX-Components werden auf die Version 14.1.0 aktualisiert...`),
      messageInfoRule(`Die Datei "package.json" wird angepasst...`),
      updateDep('@ihk-gfi/lux-components', '14.1.0', false),
      updateDep('@ihk-gfi/lux-components-theme', '14.1.0', false),
      updateI18NFiles(),
      messageSuccessRule(`Die LUX-Components wurden auf die Version 14.1.0 aktualisiert.`),
      finish(true,`${chalk.yellowBright('Fertig!')}`)
    ]);
  };
}

export function updateI18NFiles(): Rule {
  return (tree: Tree, _context: SchematicContext) => {
    messageInfoRule(`I18n-Dateien werden angepasst...`),
    updateI18nFile(tree, 'de', 'luxc.file-list.upload.lbl', i18nDeButton);
    updateI18nFile(tree, 'en', 'luxc.file-list.upload.lbl', i18nEnButton);
    messageInfoRule(`I18n-Dateien wurden angepasst.`)
  };
}

export const i18nDeButton = `<trans-unit id="luxc.form.delete.error.button" datatype="html">
        <source>Fehlermeldung löschen</source>
        <context-group purpose="location">
          <context context-type="sourcefile">src/app/modules/lux-form/lux-file/lux-file-list/lux-file-list.component.html</context>
          <context context-type="linenumber">80</context>
        </context-group>
        <context-group purpose="location">
          <context context-type="sourcefile">src/app/modules/lux-form/lux-form-control-wrapper/lux-form-control-wrapper.component.html</context>
          <context context-type="linenumber">50</context>
        </context-group>
        <context-group purpose="location">
          <context context-type="sourcefile">src/app/modules/lux-form/lux-form-control/lux-form-control.component.html</context>
          <context context-type="linenumber">47</context>
        </context-group>
      </trans-unit>`;

export const i18nEnButton = `<trans-unit id="luxc.form.delete.error.button" datatype="html">
        <source>Fehlermeldung löschen</source>
        <target>Delete error message</target>
        <context-group purpose="location">
          <context context-type="sourcefile">src/app/modules/lux-form/lux-file/lux-file-list/lux-file-list.component.html</context>
          <context context-type="linenumber">80</context>
        </context-group>
        <context-group purpose="location">
          <context context-type="sourcefile">src/app/modules/lux-form/lux-form-control-wrapper/lux-form-control-wrapper.component.html</context>
          <context context-type="linenumber">50</context>
        </context-group>
        <context-group purpose="location">
          <context context-type="sourcefile">src/app/modules/lux-form/lux-form-control/lux-form-control.component.html</context>
          <context context-type="linenumber">47</context>
        </context-group>
      </trans-unit>`;
