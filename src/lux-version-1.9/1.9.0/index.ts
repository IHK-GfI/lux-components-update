import { chain, Rule, SchematicContext, Tree, } from '@angular-devkit/schematics';
import { getProject } from '@schematics/angular/utility/project';
import { validateIhkGfiLuxComponentsVersion, validateNodeVersion } from '../../utility/validation';
import {
    deletePackageJsonDependency,
    NodeDependency,
    NodeDependencyType,
    updatePackageJsonDependency
} from '../../utility/dependencies';
import { formattedSchematicsException, logInfoWithDescriptor, logNewUpdate, logSuccess, } from '../../utility/logging';
import { replaceAll, runInstallAndLogToDos, waitForTreeCallback } from '../../utility/util';
import {iterateFilesAndModifyContent} from "../../utility/files";

/**
 * Haupt-Rule für diesen Schematic-Generator.
 * @param options
 */
export const luxVersion: (options: any) => Rule = (options: any) => {
    return chain([
        setupProject(options),
        checkVersions(),
        deletePackageJsonDependencies(),
        updatePackageJsonDependencies(),
        updateAnglarHttpImports(options),
        activateIvy(),
        deactivateDirectiveClassSuffix(),
        todosForUser()
    ]);
};

export function updateAnglarHttpImports(options: any): Rule {
    return (tree: Tree, context: SchematicContext) => {
        logInfoWithDescriptor('Ersetze "@angular/http" durch "@angular/common/http" in TS-Dateien.');

        iterateFilesAndModifyContent(tree, options.path, (filePath: string, content: string) => {
            let modifiedContent = replaceAll(content, "from '@angular/http'", "from '@angular/common/http'");
            modifiedContent = replaceAll(modifiedContent, 'from "@angular/http"', "from '@angular/common/http'");

            if (content !== modifiedContent) {
                tree.overwrite(filePath, modifiedContent);
            }
        }, '.ts');

        return tree;
    };
}

export function updatePackageJsonDependencies(): Rule {
    return (tree: Tree, context: SchematicContext) => {
        logInfoWithDescriptor('Füge neue Dependencies zu package.json hinzu.');
        return waitForTreeCallback(tree, () => {
            const dependencies: NodeDependency[] = [
                { type: NodeDependencyType.Default, version: '9.1.0', name: '@angular/animations' },
                { type: NodeDependencyType.Default, version: '9.1.0', name: '@angular/common' },
                { type: NodeDependencyType.Default, version: '9.1.0', name: '@angular/core' },
                { type: NodeDependencyType.Default, version: '9.0.0-beta.29', name: '@angular/flex-layout' },
                { type: NodeDependencyType.Default, version: '9.1.0', name: '@angular/forms' },
                { type: NodeDependencyType.Default, version: '9.1.0', name: '@angular/platform-browser' },
                { type: NodeDependencyType.Default, version: '9.1.0', name: '@angular/platform-browser-dynamic' },
                { type: NodeDependencyType.Default, version: '9.1.0', name: '@angular/router' },
                { type: NodeDependencyType.Default, version: '9.1.0', name: '@angular/cdk' },
                { type: NodeDependencyType.Default, version: '9.1.0', name: '@angular/material' },
                { type: NodeDependencyType.Default, version: '3.6.4', name: 'core-js' },
                { type: NodeDependencyType.Default, version: '5.0.1', name: 'material-design-icons-iconfont' },
                { type: NodeDependencyType.Default, version: '1.10.0', name: 'tslib' },
                { type: NodeDependencyType.Default, version: '6.5.4', name: 'rxjs' },
                { type: NodeDependencyType.Default, version: '0.10.3', name: 'zone.js' },
                { type: NodeDependencyType.Default, version: '2.0.8', name: 'hammerjs' },
                { type: NodeDependencyType.Default, version: '5.13.0', name: '@fortawesome/fontawesome-free' },
                { type: NodeDependencyType.Default, version: '6.1.1', name: 'ng2-pdf-viewer' },
                { type: NodeDependencyType.Default, version: '1.9.0', name: '@ihk-gfi/lux-components' },
                { type: NodeDependencyType.Dev, version: '0.901.0', name: '@angular-devkit/build-angular' },
                { type: NodeDependencyType.Dev, version: '9.1.0', name: '@angular/cli' },
                { type: NodeDependencyType.Dev, version: '9.1.0', name: '@angular/compiler' },
                { type: NodeDependencyType.Dev, version: '9.1.0', name: '@angular/compiler-cli' },
                { type: NodeDependencyType.Dev, version: '9.1.0', name: '@angular/language-service' },
                { type: NodeDependencyType.Dev, version: '1.1.11', name: '@compodoc/compodoc' },
                { type: NodeDependencyType.Dev, version: '3.5.7', name: '@types/jasmine' },
                { type: NodeDependencyType.Dev, version: '2.0.8', name: '@types/jasminewd2' },
                { type: NodeDependencyType.Dev, version: '13.7.7', name: '@types/node' },
                { type: NodeDependencyType.Dev, version: '5.2.1', name: 'codelyzer' },
                { type: NodeDependencyType.Dev, version: '3.5.0', name: 'jasmine-core' },
                { type: NodeDependencyType.Dev, version: '4.2.1', name: 'jasmine-spec-reporter' },
                { type: NodeDependencyType.Dev, version: '4.4.1', name: 'karma' },
                { type: NodeDependencyType.Dev, version: '3.1.0', name: 'karma-chrome-launcher' },
                { type: NodeDependencyType.Dev, version: '2.0.0', name: 'karma-cli' },
                { type: NodeDependencyType.Dev, version: '2.1.1', name: 'karma-coverage-istanbul-reporter' },
                { type: NodeDependencyType.Dev, version: '0.4.2', name: 'karma-edge-launcher' },
                { type: NodeDependencyType.Dev, version: '1.3.0', name: 'karma-firefox-launcher' },
                { type: NodeDependencyType.Dev, version: '1.0.0', name: 'karma-ie-launcher' },
                { type: NodeDependencyType.Dev, version: '3.1.1', name: 'karma-jasmine' },
                { type: NodeDependencyType.Dev, version: '1.5.2', name: 'karma-jasmine-html-reporter' },
                { type: NodeDependencyType.Dev, version: '1.0.0', name: 'karma-safari-launcher' },
                { type: NodeDependencyType.Dev, version: '4.13.1', name: 'node-sass' },
                { type: NodeDependencyType.Dev, version: '5.4.3', name: 'protractor' },
                { type: NodeDependencyType.Dev, version: '8.6.2', name: 'ts-node' },
                { type: NodeDependencyType.Dev, version: '5.20.1', name: 'tslint' },
                { type: NodeDependencyType.Dev, version: '3.0.2', name: 'tslint-angular' },
                { type: NodeDependencyType.Dev, version: '3.7.5', name: 'typescript' },
                { type: NodeDependencyType.Dev, version: '0.0.61', name: '@ihk-gfi/lux-components-update' },
            ];

            dependencies.forEach(dependency => {
                updatePackageJsonDependency(tree, context, dependency);
            });
            logSuccess('Dependencies aktualisiert.');
            return tree;
        });
    };
}

export function deletePackageJsonDependencies(): Rule {
    return (tree: Tree, context: SchematicContext) => {
        logInfoWithDescriptor('Lösche die Abhängigkeit "@angular/http" und "retire"...');
        return waitForTreeCallback(tree, () => {
            const dependencies: NodeDependency[] = [
                { type: NodeDependencyType.Default, version: '', name: '@angular/http' },
                { type: NodeDependencyType.Dev, version: '', name: 'retire' },
            ];

            dependencies.forEach(devDependency => {
                deletePackageJsonDependency(tree, context, devDependency);
            });
            logSuccess('Abhängigkeit "@angular/http" und "retire" erfolgreich gelöscht.');
            return tree;
        });
    };
}

/**
 * Prüft, ob die Property "project" gesetzt ist und
 * erstellt wenn nötig einen Standard-Pfad zum Projekt, wenn keiner bekannt ist.
 * @param options
 */
export function setupProject(options: any): Rule {
    return (tree: Tree, context: SchematicContext) => {
        logNewUpdate('1.9.0');
        logInfoWithDescriptor('Starte Konfiguration der Schematic.');
        return waitForTreeCallback(tree, () => {
            if (!options.project) {
                throw formattedSchematicsException('Option "project" wird benötigt.');
            }
            const project = getProject(tree, options.project);

            if (options.path === undefined) {
                options.path = project.root;
            }

            logSuccess(`Schematic-Konfiguration für Projekt "${ options.project }" erfolgreich.`);
            return tree;
        });
    }
}

export function checkVersions(): Rule {
    return (tree: Tree, context: SchematicContext) => {
        logInfoWithDescriptor('Starte die Versionsprüfung.');
        return waitForTreeCallback(tree, () => {
            const minimumLuxComponentsVersion = '1.8.7';
            validateIhkGfiLuxComponentsVersion(tree, context, minimumLuxComponentsVersion);

            const minimumNodeVersion = '10.16.3';
            validateNodeVersion(context, minimumNodeVersion);

            logSuccess(`Versionen erfolgreich geprüft.`);
            return tree;
        });
    };
}

/**
 * @Input(), @Output etc innerhalb von Basisklassen werden nur noch erkannt, wenn die Basisklasse mit @Directive()
 * oder @Component() annotiert ist. Und damit das Linting nicht abbricht, weil die Namen der Basisklassen nicht
 * mit Directive enden, wird diese Prüfung deaktiviert.
 */
export function deactivateDirectiveClassSuffix(): Rule {
    return (tree: Tree, context: SchematicContext) => {

        logInfoWithDescriptor('Deaktiviere "directive-class-suffix" in der "tslint.json".');
        return waitForTreeCallback(tree, () => {
            const tsLintJsonFile = tree.read('tslint.json');

            if (tsLintJsonFile) {
                const tsLintJsonFileObject = JSON.parse(tsLintJsonFile.toString('utf-8'));

                tsLintJsonFileObject.rules = {
                    ...tsLintJsonFileObject.rules,
                    "directive-class-suffix": false
                };

                tree.overwrite('tslint.json', JSON.stringify(tsLintJsonFileObject, null, 2));
            } else {
                throw formattedSchematicsException('tslint.json konnte nicht gelesen werden.');
            }

            logSuccess(`"directive-class-suffix" wurde deaktiviert.`);
            return tree;
        });

    }
}

/**
 * Diese Rule aktiviert Ivy.
 */
export function activateIvy(): Rule {
    return (tree: Tree, context: SchematicContext) => {

        logInfoWithDescriptor('Aktiviere Ivy in der "tsconfig.json".');
        return waitForTreeCallback(tree, () => {
            const tsConfigJsonFile = tree.read('tsconfig.json');

            if (tsConfigJsonFile) {
                const tsConfigJsonFileObject = JSON.parse(tsConfigJsonFile.toString('utf-8'));

                tsConfigJsonFileObject.angularCompilerOptions = {
                    ...tsConfigJsonFileObject.angularCompilerOptions,
                    "enableIvy": true
                };

                tree.overwrite('tsconfig.json', JSON.stringify(tsConfigJsonFileObject, null, 2));
            } else {
                throw formattedSchematicsException('tsconfig.json konnte nicht gelesen werden.');
            }

            logSuccess(`Ivy wurde aktiviert.`);
            return tree;
        });

    }
}

/**
 * Gibt die offen stehenden ToDos (Aufgaben, die der Generator nicht übernehmen konnte) für den User aus.
 */
export function todosForUser(): Rule {
    return (tree: Tree, context: SchematicContext) => {
        let version = '1.9.0';
        version = replaceAll(version, "\.", "");

        runInstallAndLogToDos(context,
            `Manuelle Schritte aus dem Update Guide (https://github.com/IHK-GfI/lux-components/wiki/Upate-Guide#version-${version}) durchführen!`
        );
        return tree;
    };
}
