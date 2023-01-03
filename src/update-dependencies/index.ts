import { chain, Rule } from '@angular-devkit/schematics';
import { NodeDependencyType } from '../utility/dependencies';
import { updateJsonValue } from '../utility/json';
import { messageInfoRule, messageSuccessRule } from '../utility/util';

const addOrUpdate = false;
const updateIfExists = true;

export function updateDependencies(): Rule {
  return chain([
    messageInfoRule(`Abhängigkeiten in der Datei "package.json" werden aktualisiert...`),
    updateDep('@ihk-gfi/lux-stammdaten', '14.0.0', updateIfExists),
    updateDep('@ihk-gfi/lux-components', '14.0.0', addOrUpdate),
    updateDep('@ihk-gfi/lux-components-theme', '14.0.0', addOrUpdate),
    updateDep('@ihk-gfi/lux-components-icons-and-fonts', '1.0.0', addOrUpdate),
    updateDep('@ihk-gfi/lux-components-update', '14.0.0', addOrUpdate),
    updateDep('@ihk-gfi/lux-components-icons-and-fonts', '1.0.0', addOrUpdate),
    updateDep('@angular/animations', '14.2.11', addOrUpdate),
    updateDep('@angular/common', '14.2.11', addOrUpdate),
    updateDep('@angular/core', '14.2.11', addOrUpdate),
    updateDep('@angular/compiler', '14.2.11', addOrUpdate),
    updateDep('@angular/localize', '14.2.11', addOrUpdate),
    updateDep('@angular/forms', '14.2.11', addOrUpdate),
    updateDep('@angular/platform-browser', '14.2.11', addOrUpdate),
    updateDep('@angular/platform-browser-dynamic', '14.2.11', addOrUpdate),
    updateDep('@angular/router', '14.2.11', addOrUpdate),
    updateDep('@angular/cdk', '14.2.7', addOrUpdate),
    updateDep('@angular/material', '14.2.7', addOrUpdate),
    updateDep('@angular/flex-layout', '14.0.0-beta.40', addOrUpdate),
    updateDep('@fortawesome/fontawesome-free', '5.15.4', addOrUpdate),
    updateDep('material-design-icons-iconfont', '6.5.0', addOrUpdate),
    updateDep('rxjs', '7.5.5', addOrUpdate),
    updateDep('dompurify', '2.3.7', addOrUpdate),
    updateDep('marked', '4.0.15', addOrUpdate),
    updateDep('zone.js', '0.11.5', addOrUpdate),
    updateDep('tslib', '2.3.1', updateIfExists),
    updateDep('hammerjs', '2.0.8', addOrUpdate),
    updateDep('ng2-pdf-viewer', '8.0.1', addOrUpdate),
    updateDep('pdfjs-dist', '2.13.216', addOrUpdate),
    updateDep('ngx-cookie-service', '14.0.1', addOrUpdate),

    updateDevDep('@angular-eslint/builder', '14.3.0', updateIfExists),
    updateDevDep('@angular-eslint/eslint-plugin', '14.3.0', updateIfExists),
    updateDevDep('@angular-eslint/eslint-plugin-template', '14.3.0', updateIfExists),
    updateDevDep('@angular-eslint/schematics', '14.3.0', updateIfExists),
    updateDevDep('@angular-eslint/template-parser', '14.3.0', updateIfExists),
    updateDevDep('@typescript-eslint/eslint-plugin', '5.29.0', updateIfExists),
    updateDevDep('@typescript-eslint/parser', '5.29.0', updateIfExists),
    updateDevDep('eslint', '8.18.0', updateIfExists),
    updateDevDep('eslint-plugin-import', '2.26.0', updateIfExists),
    updateDevDep('eslint-plugin-jsdoc', '39.2.9', updateIfExists),
    updateDevDep('eslint-plugin-prefer-arrow', '1.2.3', updateIfExists),
    updateDevDep('@angular-devkit/build-angular', '14.2.10', addOrUpdate),
    updateDevDep('@angular/compiler-cli', '14.2.11', addOrUpdate),
    updateDevDep('@angular/cli', '14.2.10', addOrUpdate),
    updateDevDep('@angular/language-service', '14.2.11', addOrUpdate),
    updateDevDep('@angular/elements', '14.2.11', addOrUpdate),
    updateDevDep('@compodoc/compodoc', '1.1.19', updateIfExists),
    updateDevDep('@types/jasmine', '4.0.3', addOrUpdate),
    updateDevDep('@types/node', '16.11.34', addOrUpdate),
    updateDevDep('jasmine-core', '4.1.1', addOrUpdate),
    updateDevDep('karma', '6.3.19', addOrUpdate),
    updateDevDep('karma-coverage', '2.2.0', addOrUpdate),
    updateDevDep('karma-chrome-launcher', '3.1.1', addOrUpdate),
    updateDevDep('karma-firefox-launcher', '2.1.2', updateIfExists),
    updateDevDep('karma-jasmine', '4.0.2', addOrUpdate),
    updateDevDep('karma-jasmine-html-reporter', '1.7.0', addOrUpdate),
    updateDevDep('karma-safari-launcher', '1.0.0', updateIfExists),
    updateDevDep('typescript', '4.7.3', addOrUpdate),
    updateDevDep('fs-extra', '10.1.0', updateIfExists),
    updateDevDep('del', '6.0.0', updateIfExists),
    messageSuccessRule(`Abhängigkeiten in der Datei "package.json" wurden aktualisiert.`)
  ]);
}

function updateDep(name: string, version: string, onlyUpdate: boolean): Rule {
  return updateJsonValue('/package.json', [NodeDependencyType.Default, name], version, onlyUpdate);
}

function updateDevDep(name: string, version: string, onlyUpdate: boolean): Rule {
  return updateJsonValue('/package.json', [NodeDependencyType.Dev, name], version, onlyUpdate);
}
