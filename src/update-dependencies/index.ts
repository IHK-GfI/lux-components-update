import { chain, Rule } from '@angular-devkit/schematics';
import { NodeDependencyType } from '../utility/dependencies';
import { updateJsonValue } from '../utility/json';
import { messageInfoRule, messageSuccessRule } from '../utility/util';

const addOrUpdate = false;
const updateIfExists = true;

export function updateDependencies(): Rule {
  return chain([
    messageInfoRule(`Abhängigkeiten in der Datei "package.json" werden aktualisiert...`),
    deleteDep('@ihk-gfi/lux-stammdaten'),
    deleteDep('@angular/flex-layout'),
    deleteDevDep('node-sass'),
    
    updateDep('@ihk-gfi/lux-components', '16.0.0', addOrUpdate),
    updateDep('@ihk-gfi/lux-components-theme', '16.0.0', addOrUpdate),
    updateDep('@ihk-gfi/lux-components-icons-and-fonts', '1.8.0', addOrUpdate),
    updateDep('@angular/animations', '16.2.12', addOrUpdate),
    updateDep('@angular/common', '16.2.12', addOrUpdate),
    updateDep('@angular/core', '16.2.12', addOrUpdate),
    updateDep('@angular/compiler', '16.2.12', addOrUpdate),
    updateDep('@angular/localize', '16.2.12', addOrUpdate),
    updateDep('@angular/forms', '16.2.12', addOrUpdate),
    updateDep('@angular/platform-browser', '16.2.12', addOrUpdate),
    updateDep('@angular/platform-browser-dynamic', '16.2.12', addOrUpdate),
    updateDep('@angular/router', '16.2.12', addOrUpdate),
    updateDep('@angular/cdk', '16.2.14', addOrUpdate),
    updateDep('@angular/material', '16.2.14', addOrUpdate),
    updateDep('rxjs', '7.8.1', addOrUpdate),
    updateDep('dompurify', '2.3.7', addOrUpdate),
    updateDep('marked', '4.0.15', addOrUpdate),
    updateDep('zone.js', '0.13.3', addOrUpdate),
    updateDep('tslib', '2.6.2', updateIfExists),
    updateDep('hammerjs', '2.0.8', addOrUpdate),
    updateDep('ng2-pdf-viewer', '8.0.1', addOrUpdate),
    updateDep('pdfjs-dist', '2.13.216', addOrUpdate),
    updateDep('ngx-cookie-service', '16.0.0', addOrUpdate),
    updateDep('ngx-build-plus', '16.0.0', addOrUpdate),

    updateDevDep('@ihk-gfi/lux-components-update', '^16.0.0', addOrUpdate),
    updateDevDep('@angular-eslint/builder', '16.3.1', updateIfExists),
    updateDevDep('@angular-eslint/eslint-plugin', '16.3.1', updateIfExists),
    updateDevDep('@angular-eslint/eslint-plugin-template', '16.3.1', updateIfExists),
    updateDevDep('@angular-eslint/schematics', '16.3.1', updateIfExists),
    updateDevDep('@angular-eslint/template-parser', '16.3.1', updateIfExists),
    updateDevDep('@typescript-eslint/eslint-plugin', '7.5.0', updateIfExists),
    updateDevDep('@typescript-eslint/parser', '7.5.0', updateIfExists),
    updateDevDep('eslint', '8.57.0', updateIfExists),
    updateDevDep('eslint-plugin-import', '2.29.1', updateIfExists),
    updateDevDep('eslint-plugin-jsdoc', '48.2.2', updateIfExists),
    updateDevDep('eslint-plugin-prefer-arrow', '1.2.3', updateIfExists),
    updateDevDep('@angular-devkit/build-angular', '16.2.13', addOrUpdate),
    updateDevDep('@angular/compiler-cli', '16.2.12', addOrUpdate),
    updateDevDep('@angular/cli', '16.2.13', addOrUpdate),
    updateDevDep('@angular/language-service', '16.2.12', addOrUpdate),
    updateDevDep('@angular/elements', '16.2.12', addOrUpdate),
    updateDevDep('@compodoc/compodoc', '1.1.19', updateIfExists),
    updateDevDep('@types/jasmine', '4.3.1', addOrUpdate),
    updateDevDep('@types/marked', '4.0.3', addOrUpdate),
    updateDevDep('jasmine-core', '4.6.0', addOrUpdate),
    updateDevDep('karma', '6.4.1', addOrUpdate),
    updateDevDep('karma-coverage', '2.2.1', addOrUpdate),
    updateDevDep('karma-chrome-launcher', '3.2.0', addOrUpdate),
    updateDevDep('karma-firefox-launcher', '2.1.2', updateIfExists),
    updateDevDep('karma-jasmine', '5.1.0', addOrUpdate),
    updateDevDep('karma-jasmine-html-reporter', '2.1.0', addOrUpdate),
    updateDevDep('karma-safari-launcher', '1.0.0', updateIfExists),
    updateDevDep('typescript', '5.1.3', addOrUpdate),
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
