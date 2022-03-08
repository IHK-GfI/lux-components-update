import { chain, Rule, SchematicContext, Tree } from '@angular-devkit/schematics';
import * as chalk from 'chalk';
import { updateDependency, updateDependencyDev } from '../utility/dependencies';
import { finish, messageInfoRule, messageSuccessRule, updateI18nFile } from '../utility/util';

export function update111200(options: any): Rule {
  return (tree: Tree, context: SchematicContext) => {
    return chain([
      messageInfoRule(`Die LUX-Components werden auf die Version 11.12.0 aktualisiert...`),

      messageInfoRule(`Die Datei "package.json" wird angepasst...`),
      updateDependencies(),
      messageSuccessRule(`Die Datei "package.json" wurde angepasst.`),

      messageInfoRule(`Die Sprachdateien werden um Einträge für die Chips-Komponente ergänzt...`),
      updateI18N(),
      messageSuccessRule(`Die Sprachdateien wurden um Einträge für die Chips-Komponente ergänzt.`),

      messageSuccessRule(`Die LUX-Components wurden auf die Version 11.12.0 aktualisiert.`),
      finish(`${chalk.yellowBright('Fertig!')}`)
    ]);
  };

  function updateDependencies() {
    return (tree: Tree, _context: SchematicContext) => {
      updateDependency(tree, '@ihk-gfi/lux-components', '11.12.0');
      updateDependency(tree, '@ihk-gfi/lux-components-theme', '11.13.0');
      updateDependencyDev(tree, 'karma', '6.3.17');

      return tree;
    };
  }
}

function updateI18N() {
  return (tree: Tree, _context: SchematicContext) => {
    addI18nForChipsComponent(tree);

    return tree;
  };
}

function addI18nForChipsComponent(tree: Tree) {
  updateI18nFile(
    tree,
    'de',
    'luxc.datepicker.error_message.min',
    `     
      <trans-unit id="luxc.chips.input.placeholder.lbl" datatype="html">
        <source>eingeben oder auswählen</source>
        <context-group purpose="location">
          <context context-type="sourcefile">src/app/modules/lux-form/lux-chips/lux-chips.component.ts</context>
          <context context-type="linenumber">48</context>
        </context-group>
      </trans-unit>
        `
  );

  updateI18nFile(
    tree,
    'en',
    'luxc.datepicker.error_message.min',
    `     
      <trans-unit id="luxc.chips.input.placeholder.lbl" datatype="html">
        <source>eingeben oder auswählen</source>
        <target>enter or select</target>
        <context-group purpose="location">
          <context context-type="sourcefile">src/app/modules/lux-form/lux-chips/lux-chips.component.ts</context>
          <context context-type="linenumber">48</context>
        </context-group>
      </trans-unit>
        `
  );
}

