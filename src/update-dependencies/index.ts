import { chain, Rule } from '@angular-devkit/schematics';
import { NodeDependencyType } from '../utility/dependencies';
import { updateJsonValue } from '../utility/json';
import { messageInfoRule, messageSuccessRule } from '../utility/util';

const addOrUpdate = false;
const updateIfExists = true;

export function updateDependencies(): Rule {
  return chain([
    messageInfoRule(`Abhängigkeiten in der Datei "package.json" werden aktualisiert...`),
    updateDep('@ihk-gfi/lux-stammdaten', '15.0.0', updateIfExists),
    updateDep('@ihk-gfi/lux-components', '15.0.0', addOrUpdate),
    updateDep('@ihk-gfi/lux-components-theme', '15.0.0', addOrUpdate),
    updateDep('@ihk-gfi/lux-components-icons-and-fonts', '1.6.0', addOrUpdate),
    deleteDep('@ihk-gfi/lux-components-update'),
    updateDep('@angular/animations', '15.2.9', addOrUpdate),
    updateDep('@angular/common', '15.2.9', addOrUpdate),
    updateDep('@angular/core', '15.2.9', addOrUpdate),
    updateDep('@angular/compiler', '15.2.9', addOrUpdate),
    updateDep('@angular/localize', '15.2.9', addOrUpdate),
    updateDep('@angular/forms', '15.2.9', addOrUpdate),
    updateDep('@angular/platform-browser', '15.2.9', addOrUpdate),
    updateDep('@angular/platform-browser-dynamic', '15.2.9', addOrUpdate),
    updateDep('@angular/router', '15.2.9', addOrUpdate),
    updateDep('@angular/cdk', '15.2.9', addOrUpdate),
    updateDep('@angular/material', '15.2.9', addOrUpdate),
    updateDep('@angular/flex-layout', '15.0.0-beta.42', addOrUpdate),
    updateDep('rxjs', '7.8.0', addOrUpdate),
    updateDep('dompurify', '2.3.7', addOrUpdate),
    updateDep('marked', '4.0.15', addOrUpdate),
    deleteDep('@types/marked'),
    updateDep('zone.js', '0.12.0', addOrUpdate),
    updateDep('tslib', '2.5.0', updateIfExists),
    updateDep('hammerjs', '2.0.8', addOrUpdate),
    updateDep('ng2-pdf-viewer', '8.0.1', addOrUpdate),
    updateDep('pdfjs-dist', '2.13.216', addOrUpdate),
    updateDep('ngx-cookie-service', '15.0.0', addOrUpdate),

    updateDevDep('@ihk-gfi/lux-components-update', '15.0.0', addOrUpdate),
    updateDevDep('@angular-eslint/builder', '15.2.1', updateIfExists),
    updateDevDep('@angular-eslint/eslint-plugin', '15.2.1', updateIfExists),
    updateDevDep('@angular-eslint/eslint-plugin-template', '15.2.1', updateIfExists),
    updateDevDep('@angular-eslint/schematics', '15.2.1', updateIfExists),
    updateDevDep('@angular-eslint/template-parser', '15.2.1', updateIfExists),
    updateDevDep('@typescript-eslint/eslint-plugin', '5.62.0', updateIfExists),
    updateDevDep('@typescript-eslint/parser', '5.62.0', updateIfExists),
    updateDevDep('eslint', '8.28.0', updateIfExists),
    updateDevDep('eslint-plugin-import', '2.26.0', updateIfExists),
    updateDevDep('eslint-plugin-jsdoc', '39.2.9', updateIfExists),
    updateDevDep('eslint-plugin-prefer-arrow', '1.2.3', updateIfExists),
    updateDevDep('@angular-devkit/build-angular', '15.2.9', addOrUpdate),
    updateDevDep('@angular/compiler-cli', '15.2.9', addOrUpdate),
    updateDevDep('@angular/cli', '15.2.9', addOrUpdate),
    updateDevDep('@angular/language-service', '15.2.9', addOrUpdate),
    updateDevDep('@angular/elements', '15.2.9', addOrUpdate),
    updateDevDep('@compodoc/compodoc', '1.1.19', updateIfExists),
    updateDevDep('@types/jasmine', '4.3.1', addOrUpdate),
    updateDevDep('@types/marked', '4.0.3', addOrUpdate),
    deleteDevDep('@types/node'),
    deleteDevDep('tslint-angular'),
    updateDevDep('jasmine-core', '4.6.0', addOrUpdate),
    updateDevDep('karma', '6.4.1', addOrUpdate),
    updateDevDep('karma-coverage', '2.2.0', addOrUpdate),
    updateDevDep('karma-chrome-launcher', '3.1.1', addOrUpdate),
    updateDevDep('karma-firefox-launcher', '2.1.2', updateIfExists),
    updateDevDep('karma-jasmine', '5.1.0', addOrUpdate),
    updateDevDep('karma-jasmine-html-reporter', '2.0.0', addOrUpdate),
    updateDevDep('karma-safari-launcher', '1.0.0', updateIfExists),
    updateDevDep('typescript', '4.9.5', addOrUpdate),
    updateDevDep('fs-extra', '10.1.0', updateIfExists),
    updateDevDep('del', '6.0.0', updateIfExists),
    messageSuccessRule(`Abhängigkeiten in der Datei "package.json" wurden aktualisiert.`)
  ]);
}

export function updateDep(name: string, version: string, onlyUpdate: boolean): Rule {
  return updateJsonValue('/package.json', [NodeDependencyType.Default, name], version, onlyUpdate);
}

export function deleteDep(name: string): Rule {
  return updateJsonValue('/package.json', [NodeDependencyType.Default, name], void 0, true);
}

export function updateDevDep(name: string, version: string | null, onlyUpdate: boolean): Rule {
  return updateJsonValue('/package.json', [NodeDependencyType.Dev, name], version, onlyUpdate);
}

export function deleteDevDep(name: string): Rule {
  return updateJsonValue('/package.json', [NodeDependencyType.Dev, name], void 0, true);
}
