import { chain, Rule, SchematicContext, Tree } from '@angular-devkit/schematics';
import { updateMajorVersion } from '../updates/update130000/index';
import { deletePackageJsonDependency, NodeDependency, NodeDependencyType, updatePackageJsonDependency } from '../utility/dependencies';
import { updateJsonValue } from '../utility/json';
import { messageInfoRule, messageSuccessRule, waitForTreeCallback } from '../utility/util';

export function updateDependencies(): Rule {
    return chain([
        messageInfoRule(`Abhängigkeiten im 'dependencies'-Abschnitt (package.json) werden aktualisiert...`),
        updateDefaultDependencies(),
        updateJsonValue(null, '/package.json', ['dependencies', '@ihk-gfi/lux-stammdaten'], '13.0.0', true),
        messageSuccessRule(`Abhängigkeiten im 'dependencies'-Abschnitt (package.json) wurden aktualisiert.`),

        messageInfoRule(`Abhängigkeiten im 'devDependencies'-Abschnitt (package.json) werden aktualisiert...`),
        updateDevDependencies(),
        messageSuccessRule(`Abhängigkeiten im 'devDependencies'-Abschnitt (package.json) wurden aktualisiert.`),

        messageInfoRule(`Abhängigkeiten im '(dev)Dependencies'-Abschnitt (package.json) werden gelöscht...`),
        deleteDependencies(),
        messageSuccessRule(`Abhängigkeiten im '(dev)Dependencies'-Abschnitt (package.json) wurden gelöscht.`)
    ]);
}

export function updateDefaultDependencies(): Rule {
    return (tree: Tree, context: SchematicContext) => {
        return waitForTreeCallback(tree, () => {
            const dependencies: NodeDependency[] = [
                { type: NodeDependencyType.Default, version: '' + updateMajorVersion + '.0.0', name: '@ihk-gfi/lux-components' },
                { type: NodeDependencyType.Default, version: '' + updateMajorVersion + '.0.0', name: '@ihk-gfi/lux-components-theme'},
                { type: NodeDependencyType.Default, version: '^' + updateMajorVersion + '.0.0', name: '@ihk-gfi/lux-components-update' },
                { type: NodeDependencyType.Default, version: '13.3.7', name: '@angular/animations' },
                { type: NodeDependencyType.Default, version: '13.3.7', name: '@angular/common' },
                { type: NodeDependencyType.Default, version: '13.3.7', name: '@angular/core' },
                { type: NodeDependencyType.Default, version: '13.3.7', name: '@angular/compiler' },
                { type: NodeDependencyType.Default, version: '13.3.7', name: '@angular/localize' },
                { type: NodeDependencyType.Default, version: '13.3.7', name: '@angular/forms' },
                { type: NodeDependencyType.Default, version: '13.3.7', name: '@angular/platform-browser' },
                { type: NodeDependencyType.Default, version: '13.3.7', name: '@angular/platform-browser-dynamic' },
                { type: NodeDependencyType.Default, version: '13.3.7', name: '@angular/router' },
                { type: NodeDependencyType.Default, version: '13.3.7', name: '@angular/cdk' },
                { type: NodeDependencyType.Default, version: '13.3.7', name: '@angular/material' },
                { type: NodeDependencyType.Default, version: '13.0.0-beta.37', name: '@angular/flex-layout' },
                { type: NodeDependencyType.Default, version: '5.15.4', name: '@fortawesome/fontawesome-free' },
                { type: NodeDependencyType.Default, version: '6.5.0', name: 'material-design-icons-iconfont' },
                { type: NodeDependencyType.Default, version: '7.5.5', name: 'rxjs' },
                { type: NodeDependencyType.Default, version: '2.3.7', name: 'dompurify' },
                { type: NodeDependencyType.Default, version: '4.0.15', name: 'marked' },
                { type: NodeDependencyType.Default, version: '0.11.5', name: 'zone.js' },
                { type: NodeDependencyType.Default, version: '2.3.1', name: 'tslib' },
                { type: NodeDependencyType.Default, version: '2.0.8', name: 'hammerjs' },
                { type: NodeDependencyType.Default, version: '8.0.1', name: 'ng2-pdf-viewer' },
                { type: NodeDependencyType.Default, version: '2.13.216', name: 'pdfjs-dist' },
                { type: NodeDependencyType.Default, version: '13.2.0', name: 'ngx-cookie-service' }
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
                { type: NodeDependencyType.Dev, version: '13.2.1', name: '@angular-eslint/builder' },
                { type: NodeDependencyType.Dev, version: '13.2.1', name: '@angular-eslint/eslint-plugin' },
                { type: NodeDependencyType.Dev, version: '13.2.1', name: '@angular-eslint/eslint-plugin-template' },
                { type: NodeDependencyType.Dev, version: '13.2.1', name: '@angular-eslint/schematics' },
                { type: NodeDependencyType.Dev, version: '13.2.1', name: '@angular-eslint/template-parser' },
                { type: NodeDependencyType.Dev, version: '5.23.0', name: '@typescript-eslint/eslint-plugin' },
                { type: NodeDependencyType.Dev, version: '5.23.0', name: '@typescript-eslint/parser' },
                { type: NodeDependencyType.Dev, version: '8.15.0', name: 'eslint' },
                { type: NodeDependencyType.Dev, version: '2.26.0', name: 'eslint-plugin-import' },
                { type: NodeDependencyType.Dev, version: '39.2.9', name: 'eslint-plugin-jsdoc' },
                { type: NodeDependencyType.Dev, version: '1.2.3', name: 'eslint-plugin-prefer-arrow' },
                { type: NodeDependencyType.Dev, version: '13.3.5', name: '@angular-devkit/build-angular' },
                { type: NodeDependencyType.Dev, version: '13.3.7', name: '@angular/compiler-cli' },
                { type: NodeDependencyType.Dev, version: '13.3.5', name: '@angular/cli' },
                { type: NodeDependencyType.Dev, version: '13.3.7', name: '@angular/language-service' },
                { type: NodeDependencyType.Dev, version: '13.3.7', name: '@angular/elements' },
                { type: NodeDependencyType.Dev, version: '1.1.19', name: '@compodoc/compodoc' },
                { type: NodeDependencyType.Dev, version: '4.0.3', name: '@types/jasmine' },
                { type: NodeDependencyType.Dev, version: '16.11.34', name: '@types/node' },
                { type: NodeDependencyType.Dev, version: '4.1.1', name: 'jasmine-core' },
                { type: NodeDependencyType.Dev, version: '6.3.19', name: 'karma' },
                { type: NodeDependencyType.Dev, version: '2.2.0', name: 'karma-coverage' },
                { type: NodeDependencyType.Dev, version: '3.1.1', name: 'karma-chrome-launcher' },
                { type: NodeDependencyType.Dev, version: '2.1.2', name: 'karma-firefox-launcher' },
                { type: NodeDependencyType.Dev, version: '4.0.2', name: 'karma-jasmine' },
                { type: NodeDependencyType.Dev, version: '1.7.0', name: 'karma-jasmine-html-reporter' },
                { type: NodeDependencyType.Dev, version: '1.0.0', name: 'karma-safari-launcher' },
                { type: NodeDependencyType.Dev, version: '4.5.5', name: 'typescript' },
                { type: NodeDependencyType.Dev, version: '10.1.0', name: 'fs-extra' },
                { type: NodeDependencyType.Dev, version: '6.0.0', name: 'del' }
            ];

            devDependencies.forEach((devDependency) => {
                updatePackageJsonDependency(tree, devDependency);
            });
            return tree;
        });
    };
}

export function deleteDependencies(): Rule {
    return (tree: Tree, context: SchematicContext) => {
        return waitForTreeCallback(tree, () => {
            const dependencies: NodeDependency[] = [
                { type: NodeDependencyType.Dev, name: 'core-js', version: '' },
                { type: NodeDependencyType.Dev, name: '@types/pdfjs-dist', version: '' },
                { type: NodeDependencyType.Dev, name: '@types/jasminewd2', version: '' },
                { type: NodeDependencyType.Dev, name: 'codelyzer', version: '' },
                { type: NodeDependencyType.Dev, name: 'jasmine-spec-reporter', version: '' },
                { type: NodeDependencyType.Dev, name: 'karma-cli', version: '' },
                { type: NodeDependencyType.Dev, name: 'karma-coverage-istanbul-reporter', version: '' },
                { type: NodeDependencyType.Dev, name: 'karma-ie-launcher', version: '' },
                { type: NodeDependencyType.Dev, name: 'karma-edge-launcher', version: '' },
                { type: NodeDependencyType.Dev, name: 'protractor', version: '' },
                { type: NodeDependencyType.Dev, name: 'ts-node', version: '' }
            ];

            dependencies.forEach((dependency) => {
                deletePackageJsonDependency(tree, context, dependency);
            });
            return tree;
        });
    };
}
