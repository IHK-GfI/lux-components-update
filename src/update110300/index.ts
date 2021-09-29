import { chain, Rule, SchematicContext, Tree } from '@angular-devkit/schematics';
import * as chalk from 'chalk';
import { updateDependency } from '../utility/dependencies';
import { finish, messageInfoRule, messageSuccessRule, updateI18nFile } from '../utility/util';

export function update110300(options: any): Rule {
  return (tree: Tree, context: SchematicContext) => {
    return chain([
      messageInfoRule(`Die LUX-Components werden auf die Version 11.3.0 aktualisiert...`),

      messageInfoRule(`Die Datei "package.json" wird angepasst...`),
      updateDependencies(),
      messageSuccessRule(`Die Datei "package.json" wurde angepasst.`),

      messageInfoRule(`Die Sprachdateien werden angepasst...`),
      updateI18n(),
      messageSuccessRule(`Die Sprachdateien wurden angepasst.`),

      messageSuccessRule(`Die LUX-Components wurden auf die Version 11.3.0 aktualisiert.`),
      finish(`${chalk.yellowBright('Fertig!')}`)
    ]);
  };

  function updateDependencies() {
    return (tree: Tree, _context: SchematicContext) => {
      updateDependency(tree, '@ihk-gfi/lux-components', '11.3.0');
      updateDependency(tree, '@ihk-gfi/lux-components-theme', '11.5.0');

      return tree;
    };
  }

  function updateI18n() {
    return (tree: Tree, _context: SchematicContext) => {
      addI18nForDateTimePicker(tree);

      return tree;
    };
  }

  function addI18nForDateTimePicker(tree: Tree) {
    updateI18nFile(
      tree,
      'de',
      'luxc.datepicker.error_message.empty',
      `     
     <trans-unit id="luxc.datetimepicker.invalid.date" datatype="html">
        <source>Bitte wählen Sie ein Datum aus</source>
        <context-group purpose="location">
          <context context-type="sourcefile">src/app/modules/lux-form/lux-datetimepicker/lux-datetime-overlay/lux-datetime-overlay-content.component.html</context>
          <context context-type="linenumber">46</context>
        </context-group>
      </trans-unit>
      <trans-unit id="luxc.datetimepicker.invalid.time" datatype="html">
        <source>Bitte geben Sie eine Zeit ein</source>
        <context-group purpose="location">
          <context context-type="sourcefile">src/app/modules/lux-form/lux-datetimepicker/lux-datetime-overlay/lux-datetime-overlay-content.component.html</context>
          <context context-type="linenumber">48</context>
        </context-group>
      </trans-unit>
      <trans-unit id="luxc.datetimepicker.error_message.min" datatype="html">
        <source>Das Datum unterschreitet den Minimalwert</source>
        <context-group purpose="location">
          <context context-type="sourcefile">src/app/modules/lux-form/lux-datetimepicker/lux-datetimepicker.component.ts</context>
          <context context-type="linenumber">165</context>
        </context-group>
      </trans-unit>
      <trans-unit id="luxc.datetimepicker.error_message.max" datatype="html">
        <source>Das Datum überschreitet den Maximalwert</source>
        <context-group purpose="location">
          <context context-type="sourcefile">src/app/modules/lux-form/lux-datetimepicker/lux-datetimepicker.component.ts</context>
          <context context-type="linenumber">167</context>
        </context-group>
      </trans-unit>
      <trans-unit id="luxc.datetimepicker.error_message.invalid" datatype="html">
        <source>Das Datum ist ungültig</source>
        <context-group purpose="location">
          <context context-type="sourcefile">src/app/modules/lux-form/lux-datetimepicker/lux-datetimepicker.component.ts</context>
          <context context-type="linenumber">170</context>
        </context-group>
      </trans-unit>
      <trans-unit id="luxc.datetimepicker.error_message.empty" datatype="html">
        <source>Das Datum darf nicht leer sein</source>
        <context-group purpose="location">
          <context context-type="sourcefile">src/app/modules/lux-form/lux-datetimepicker/lux-datetimepicker.component.ts</context>
          <context context-type="linenumber">172</context>
        </context-group>
      </trans-unit>
        `
    );

    updateI18nFile(
      tree,
      'en',
      'luxc.datepicker.error_message.empty',
      `     
      <trans-unit id="luxc.datetimepicker.error_message.min" datatype="html">
        <source>Das Datum unterschreitet den Minimalwert</source>
        <target>Below the minimum value</target>
        <context-group purpose="location">
          <context context-type="sourcefile">src/app/modules/lux-form/lux-datetimepicker/lux-datetimepicker.component.ts</context>
          <context context-type="linenumber">136</context>
        </context-group>
      </trans-unit>
      <trans-unit id="luxc.datetimepicker.error_message.max" datatype="html">
        <source>Das Datum überschreitet den Maximalwert</source>
        <target>Above the maximum value</target>
        <context-group purpose="location">
          <context context-type="sourcefile">src/app/modules/lux-form/lux-datetimepicker/lux-datetimepicker.component.ts</context>
          <context context-type="linenumber">138</context>
        </context-group>
      </trans-unit>
      <trans-unit id="luxc.datetimepicker.error_message.invalid" datatype="html">
        <source>Das Datum ist ungültig</source>
        <target>Invalid date</target>
        <context-group purpose="location">
          <context context-type="sourcefile">src/app/modules/lux-form/lux-datetimepicker/lux-datetimepicker.component.ts</context>
          <context context-type="linenumber">141</context>
        </context-group>
      </trans-unit>
      <trans-unit id="luxc.datetimepicker.error_message.empty" datatype="html">
        <source>Das Datum darf nicht leer sein</source>
        <target>The date should not be empty</target>
        <context-group purpose="location">
          <context context-type="sourcefile">src/app/modules/lux-form/lux-datetimepicker/lux-datetimepicker.component.ts</context>
          <context context-type="linenumber">143</context>
        </context-group>
      </trans-unit>
       <trans-unit id="luxc.datetimepicker.invalid.date" datatype="html">
        <source>Bitte wählen Sie ein Datum aus</source>
        <target>Please enter a date</target>
        <context-group purpose="location">
          <context context-type="sourcefile">src/app/modules/lux-form/lux-datetimepicker/lux-datetime-overlay/lux-datetime-overlay-content.component.html</context>
          <context context-type="linenumber">46</context>
        </context-group>
      </trans-unit>
      <trans-unit id="luxc.datetimepicker.invalid.time" datatype="html">
        <source>Bitte geben Sie eine Zeit ein</source>
        <target>Please enter a time</target>
        <context-group purpose="location">
          <context context-type="sourcefile">src/app/modules/lux-form/lux-datetimepicker/lux-datetime-overlay/lux-datetime-overlay-content.component.html</context>
          <context context-type="linenumber">48</context>
        </context-group>
      </trans-unit>
        `
    );
  }
}
