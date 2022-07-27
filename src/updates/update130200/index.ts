import { chain, Rule, SchematicContext, Tree } from '@angular-devkit/schematics';
import * as chalk from 'chalk';
import { updateJsonValue } from '../../utility/json';
import { finish, messageInfoRule, messageSuccessRule } from '../../utility/util';

export function update130200(options: any): Rule {
  return (tree: Tree, context: SchematicContext) => {
    const filePath = '/package.json';
    return chain([
      messageInfoRule(`Die LUX-Components werden auf die Version 13.2.0 aktualisiert...`),

      messageInfoRule(`Die Datei "package.json" wird angepasst...`),
      updateJsonValue(null, filePath, ['dependencies', '@ihk-gfi/lux-components'], '13.2.0', true),
      updateJsonValue(null, filePath, ['dependencies', '@angular/animations'], '13.3.11', true),
      updateJsonValue(null, filePath, ['dependencies', '@angular/cdk'], '13.3.9', true),
      updateJsonValue(null, filePath, ['dependencies', '@angular/common'], '13.3.11', true),
      updateJsonValue(null, filePath, ['dependencies', '@angular/compiler'], '13.3.11', true),
      updateJsonValue(null, filePath, ['dependencies', '@angular/core'], '13.3.11', true),
      updateJsonValue(null, filePath, ['dependencies', '@angular/forms'], '13.3.11', true),
      updateJsonValue(null, filePath, ['dependencies', '@angular/localize'], '13.3.11', true),
      updateJsonValue(null, filePath, ['dependencies', '@angular/material'], '13.3.9', true),
      updateJsonValue(null, filePath, ['dependencies', '@angular/platform-browser'], '13.3.11', true),
      updateJsonValue(null, filePath, ['dependencies', '@angular/platform-browser-dynamic'], '13.3.11', true),
      updateJsonValue(null, filePath, ['dependencies', '@angular/router'], '13.3.11', true),
      updateJsonValue(null, filePath, ['devDependencies', '@angular-devkit/build-angular'], '13.3.9', true),
      updateJsonValue(null, filePath, ['devDependencies', '@angular-eslint/builder'], '13.5.0', true),
      updateJsonValue(null, filePath, ['devDependencies', '@angular-eslint/eslint-plugin'], '13.5.0', true),
      updateJsonValue(null, filePath, ['devDependencies', '@angular-eslint/eslint-plugin-template'], '13.5.0', true),
      updateJsonValue(null, filePath, ['devDependencies', '@angular-eslint/schematics'], '13.5.0', true),
      updateJsonValue(null, filePath, ['devDependencies', '@angular-eslint/template-parser'], '13.5.0', true),
      updateJsonValue(null, filePath, ['devDependencies', '@angular/cli'], '13.3.9', true),
      updateJsonValue(null, filePath, ['devDependencies', '@angular/compiler-cli'], '13.3.11', true),
      updateJsonValue(null, filePath, ['devDependencies', '@angular/elements'], '13.3.11', true),
      updateJsonValue(null, filePath, ['devDependencies', '@angular/language-service'], '13.3.11', true),
      messageSuccessRule(`Die Datei "package.json" wurde angepasst.`),

      messageSuccessRule(`Die LUX-Components wurden auf die Version 13.2.0 aktualisiert.`),
      finish(true,`${chalk.yellowBright('Fertig!')}`)
    ]);
  };
}
