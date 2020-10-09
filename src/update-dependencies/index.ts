import { chain, Rule, SchematicContext, Tree } from '@angular-devkit/schematics';
import { messageInfoRule, messageSuccessRule, waitForTreeCallback } from '../utility/util';
import { NodeDependency, NodeDependencyType, updatePackageJsonDependencyForceUpdate } from '../utility/dependencies';

export function updateDependencies(): Rule {
  return chain([
    messageInfoRule(`Abhängigkeiten im 'dependencies'-Abschnitt (package.json) werden aktualisiert...`),
    updateDefaultDependencies(),
    messageSuccessRule(`Abhängigkeiten im 'dependencies'-Abschnitt (package.json) wurden aktualisiert.`),

    messageInfoRule(`Abhängigkeiten im 'devDependencies'-Abschnitt (package.json) werden aktualisiert...`),
    updateDevDependencies(),
    messageSuccessRule(`Abhängigkeiten im 'devDependencies'-Abschnitt (package.json) wurden aktualisiert.`)
  ]);
}

export function updateDefaultDependencies(): Rule {
  return (tree: Tree, context: SchematicContext) => {
    return waitForTreeCallback(tree, () => {
      const dependencies: NodeDependency[] = [
        { type: NodeDependencyType.Default, version: '~10.0.0', name: '@ihk-gfi/lux-components' },
        { type: NodeDependencyType.Default, version: '10.1.5', name: '@angular/animations' },
        { type: NodeDependencyType.Default, version: '10.1.5', name: '@angular/common' },
        { type: NodeDependencyType.Default, version: '10.1.5', name: '@angular/core' },
        { type: NodeDependencyType.Default, version: '10.1.5', name: '@angular/compiler' },
        { type: NodeDependencyType.Default, version: '10.0.0-beta.32', name: '@angular/flex-layout' },
        { type: NodeDependencyType.Default, version: '10.1.5', name: '@angular/forms' },
        { type: NodeDependencyType.Default, version: '10.1.5', name: '@angular/platform-browser' },
        { type: NodeDependencyType.Default, version: '10.1.5', name: '@angular/platform-browser-dynamic' },
        { type: NodeDependencyType.Default, version: '10.1.5', name: '@angular/router' },
        { type: NodeDependencyType.Default, version: '10.2.4', name: '@angular/cdk' },
        { type: NodeDependencyType.Default, version: '10.2.4', name: '@angular/material' },
        { type: NodeDependencyType.Default, version: '3.6.5', name: 'core-js' },
        { type: NodeDependencyType.Default, version: '5.0.1', name: 'material-design-icons-iconfont' },
        { type: NodeDependencyType.Default, version: '6.6.3', name: 'rxjs' },
        { type: NodeDependencyType.Default, version: '0.10.3', name: 'zone.js' },
        { type: NodeDependencyType.Default, version: '2.0.1', name: 'tslib' },
        { type: NodeDependencyType.Default, version: '2.0.8', name: 'hammerjs' },
        { type: NodeDependencyType.Default, version: '5.14.0', name: '@fortawesome/fontawesome-free' },
        { type: NodeDependencyType.Default, version: '6.2.0', name: 'ng2-pdf-viewer' },
        { type: NodeDependencyType.Default, version: '2.2.228', name: 'pdfjs-dist' }
      ];

      dependencies.forEach((dependency) => {
        updatePackageJsonDependencyForceUpdate(tree, context, dependency, true);
      });
      return tree;
    });
  };
}

export function updateDevDependencies(): Rule {
  return (tree: Tree, context: SchematicContext) => {
    return waitForTreeCallback(tree, () => {
      const devDependencies: NodeDependency[] = [
        { type: NodeDependencyType.Dev, version: '0.1001.6', name: '@angular-devkit/build-angular' },
        { type: NodeDependencyType.Dev, version: '10.1.5', name: '@angular/compiler-cli' },
        { type: NodeDependencyType.Dev, version: '10.1.6', name: '@angular/cli' },
        { type: NodeDependencyType.Dev, version: '10.1.5', name: '@angular/language-service' },
        { type: NodeDependencyType.Dev, version: '1.1.11', name: '@compodoc/compodoc' },
        { type: NodeDependencyType.Dev, version: '3.5.14', name: '@types/jasmine' },
        { type: NodeDependencyType.Dev, version: '2.0.8', name: '@types/jasminewd2' },
        { type: NodeDependencyType.Dev, version: '14.6.4', name: '@types/node' },
        { type: NodeDependencyType.Dev, version: '6.0.0', name: 'codelyzer' },
        { type: NodeDependencyType.Dev, version: '3.6.0', name: 'jasmine-core' },
        { type: NodeDependencyType.Dev, version: '5.0.2', name: 'jasmine-spec-reporter' },
        { type: NodeDependencyType.Dev, version: '5.2.2', name: 'karma' },
        { type: NodeDependencyType.Dev, version: '3.1.0', name: 'karma-chrome-launcher' },
        { type: NodeDependencyType.Dev, version: '2.0.0', name: 'karma-cli' },
        { type: NodeDependencyType.Dev, version: '3.0.3', name: 'karma-coverage-istanbul-reporter' },
        { type: NodeDependencyType.Dev, version: '1.3.0', name: 'karma-firefox-launcher' },
        { type: NodeDependencyType.Dev, version: '1.0.0', name: 'karma-ie-launcher' },
        { type: NodeDependencyType.Dev, version: '3.3.1', name: 'karma-jasmine' },
        { type: NodeDependencyType.Dev, version: '1.5.4', name: 'karma-jasmine-html-reporter' },
        { type: NodeDependencyType.Dev, version: '1.0.0', name: 'karma-safari-launcher' },
        { type: NodeDependencyType.Dev, version: '4.14.1', name: 'node-sass' },
        { type: NodeDependencyType.Dev, version: '7.0.0', name: 'protractor' },
        { type: NodeDependencyType.Dev, version: '8.10.2', name: 'ts-node' },
        { type: NodeDependencyType.Dev, version: '6.1.3', name: 'tslint' },
        { type: NodeDependencyType.Dev, version: '3.0.3', name: 'tslint-angular' },
        { type: NodeDependencyType.Dev, version: '3.9.7', name: 'typescript' }
      ];

      devDependencies.forEach((devDependency) => {
        updatePackageJsonDependencyForceUpdate(tree, context, devDependency, true);
      });
      return tree;
    });
  };
}
