import { chain, Rule, SchematicContext, Tree } from '@angular-devkit/schematics';
import { updateMajorVersion } from '../update/index';
import { deletePackageJsonDependency, NodeDependency, NodeDependencyType, updatePackageJsonDependency } from '../utility/dependencies';
import { messageInfoRule, messageSuccessRule, waitForTreeCallback } from '../utility/util';

export function updateDependencies(): Rule {
  return chain([
    messageInfoRule(`Abhängigkeiten im 'dependencies'-Abschnitt (package.json) werden aktualisiert...`),
    updateDefaultDependencies(),
    messageSuccessRule(`Abhängigkeiten im 'dependencies'-Abschnitt (package.json) wurden aktualisiert.`),

    messageInfoRule(`Abhängigkeiten im 'devDependencies'-Abschnitt (package.json) werden aktualisiert...`),
    updateDevDependencies(),
    messageSuccessRule(`Abhängigkeiten im 'devDependencies'-Abschnitt (package.json) wurden aktualisiert.`),

    messageInfoRule(`Abhängigkeiten im 'devDependencies'-Abschnitt (package.json) werden gelöscht...`),
    deleteDevDependencies(),
    messageSuccessRule(`Abhängigkeiten im 'devDependencies'-Abschnitt (package.json) wurden gelöscht.`)
  ]);
}

export function updateDefaultDependencies(): Rule {
  return (tree: Tree, context: SchematicContext) => {
    return waitForTreeCallback(tree, () => {
      const dependencies: NodeDependency[] = [
        { type: NodeDependencyType.Default, version: '' + updateMajorVersion + '.0.0', name: '@ihk-gfi/lux-components' },
        { type: NodeDependencyType.Default, version: '^' + updateMajorVersion + '.0.0', name: '@ihk-gfi/lux-components-update' },
        { type: NodeDependencyType.Default, version: '^' + updateMajorVersion + '.1.0', name: '@ihk-gfi/lux-components-theme'},
        { type: NodeDependencyType.Default, version: '11.2.11', name: '@angular/animations' },
        { type: NodeDependencyType.Default, version: '11.2.11', name: '@angular/common' },
        { type: NodeDependencyType.Default, version: '11.2.11', name: '@angular/core' },
        { type: NodeDependencyType.Default, version: '11.2.11', name: '@angular/compiler' },
        { type: NodeDependencyType.Default, version: '11.2.11', name: '@angular/localize' },
        { type: NodeDependencyType.Default, version: '11.0.0-beta.33', name: '@angular/flex-layout' },
        { type: NodeDependencyType.Default, version: '11.2.11', name: '@angular/forms' },
        { type: NodeDependencyType.Default, version: '11.2.11', name: '@angular/platform-browser' },
        { type: NodeDependencyType.Default, version: '11.2.11', name: '@angular/platform-browser-dynamic' },
        { type: NodeDependencyType.Default, version: '11.2.11', name: '@angular/router' },
        { type: NodeDependencyType.Default, version: '11.2.10', name: '@angular/cdk' },
        { type: NodeDependencyType.Default, version: '11.2.10', name: '@angular/material' },
        { type: NodeDependencyType.Default, version: '3.11.0', name: 'core-js' },
        { type: NodeDependencyType.Default, version: '6.6.7', name: 'rxjs' },
        { type: NodeDependencyType.Default, version: '0.11.4', name: 'zone.js' },
        { type: NodeDependencyType.Default, version: '2.2.0', name: 'tslib' },
        { type: NodeDependencyType.Default, version: '2.0.8', name: 'hammerjs' },
        { type: NodeDependencyType.Default, version: '6.3.2', name: 'ng2-pdf-viewer' },
        { type: NodeDependencyType.Default, version: '2.5.207', name: 'pdfjs-dist' },
        { type: NodeDependencyType.Default, version: '2.1.5', name: '@types/pdfjs-dist' },
        { type: NodeDependencyType.Default, version: '2.5.207', name: 'pdfjs-dist' },
        { type: NodeDependencyType.Default, version: '12.0.0', name: 'ngx-cookie-service' }
      ];

      dependencies.forEach((dependency) => {
        updatePackageJsonDependency(tree, dependency);
      });
      return tree;
    });
  };
}

export function updateDevDependencies(): Rule {
  return (tree: Tree, context: SchematicContext) => {
    return waitForTreeCallback(tree, () => {
      const devDependencies: NodeDependency[] = [
        { type: NodeDependencyType.Dev, version: '0.1102.10', name: '@angular-devkit/build-angular' },
        { type: NodeDependencyType.Dev, version: '11.2.11', name: '@angular/compiler-cli' },
        { type: NodeDependencyType.Dev, version: '11.2.10', name: '@angular/cli' },
        { type: NodeDependencyType.Dev, version: '11.2.11', name: '@angular/language-service' },
        { type: NodeDependencyType.Dev, version: '1.1.11', name: '@compodoc/compodoc' },
        { type: NodeDependencyType.Dev, version: '3.6.9', name: '@types/jasmine' },
        { type: NodeDependencyType.Dev, version: '2.0.8', name: '@types/jasminewd2' },
        { type: NodeDependencyType.Dev, version: '14.14.20', name: '@types/node' },
        { type: NodeDependencyType.Dev, version: '6.0.1', name: 'codelyzer' },
        { type: NodeDependencyType.Dev, version: '3.6.0', name: 'jasmine-core' },
        { type: NodeDependencyType.Dev, version: '5.0.2', name: 'jasmine-spec-reporter' },
        { type: NodeDependencyType.Dev, version: '6.1.2', name: 'karma' },
        { type: NodeDependencyType.Dev, version: '3.1.0', name: 'karma-chrome-launcher' },
        { type: NodeDependencyType.Dev, version: '2.0.0', name: 'karma-cli' },
        { type: NodeDependencyType.Dev, version: '3.0.3', name: 'karma-coverage-istanbul-reporter' },
        { type: NodeDependencyType.Dev, version: '2.1.0', name: 'karma-firefox-launcher' },
        { type: NodeDependencyType.Dev, version: '4.0.1', name: 'karma-jasmine' },
        { type: NodeDependencyType.Dev, version: '1.5.4', name: 'karma-jasmine-html-reporter' },
        { type: NodeDependencyType.Dev, version: '1.0.0', name: 'karma-safari-launcher' },
        { type: NodeDependencyType.Dev, version: '7.0.0', name: 'protractor' },
        { type: NodeDependencyType.Dev, version: '8.3.0', name: 'ts-node' },
        { type: NodeDependencyType.Dev, version: '6.1.3', name: 'tslint' },
        { type: NodeDependencyType.Dev, version: '3.0.3', name: 'tslint-angular' },
        { type: NodeDependencyType.Dev, version: '4.1.5', name: 'typescript' },
        { type: NodeDependencyType.Dev, version: '10.0.0', name: 'fs-extra' },
        { type: NodeDependencyType.Dev, version: '6.0.0', name: 'del' }
      ];

      devDependencies.forEach((devDependency) => {
        updatePackageJsonDependency(tree, devDependency);
      });
      return tree;
    });
  };
}

export function deleteDevDependencies(): Rule {
  return (tree: Tree, context: SchematicContext) => {
    return waitForTreeCallback(tree, () => {
      const dependencies: NodeDependency[] = [
        { type: NodeDependencyType.Dev, name: 'node-sass', version: '' },
      ];

      dependencies.forEach((dependency) => {
        deletePackageJsonDependency(tree, context, dependency);
      });
      return tree;
    });
  };
}
