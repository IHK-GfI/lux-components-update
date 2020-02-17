import { chain, Rule, SchematicContext, Tree } from '@angular-devkit/schematics';
import { getProject } from '@schematics/angular/utility/project';
import { NodeDependency, NodeDependencyType, updatePackageJsonDependency } from '../../utility/dependencies';
import chalk from 'chalk';
import { validateLuxComponentsVersion, validateNodeVersion } from '../../utility/validation';
import { controlPackageJsonScript, NodeScript } from '../../utility/scripts';
import { formattedSchematicsException, logInfoWithDescriptor, logNewUpdate, logSuccess, TAB } from '../../utility/logging';
import { checkSmoketestScriptExists, runInstallAndLogToDos, waitForTreeCallback } from '../../utility/util';
import { moveFilesToDirectory } from '../../utility/files';

// You don't have to export the function as default. You can also have more than one rule factory per file.
export function luxVersion(options: any): Rule {
    return chain([
        setupProject(options),
        checkVersions(),
        addPackageJsonDependencies(),
        addPackageJsonDevDependencies(),
        addPackageJsonScripts(options),
        updateAngularJson(),
        addThemingFolderThemes(options),
        fixCompileError(options),
        todosForUser()
    ]);
}

/**
 * Prüft, ob die Property "project" gesetzt ist und
 * erstellt wenn nötig einen Standard-Pfad zum Projekt, wenn keiner bekannt ist.
 * @param options
 */
export function setupProject(options: any): Rule {
    return (tree: Tree, context: SchematicContext) => {
        logNewUpdate('1.7.0');
        logInfoWithDescriptor('Starte Konfiguration der Schematic.');
        return waitForTreeCallback(tree, () => {
            if (!options.project) {
                throw formattedSchematicsException('Option "project" wird benötigt.');
            }
            const project = getProject(tree, options.project);

            if (options.path === undefined) {
                options.path = project.root;
            }

            checkSmoketestScriptExists(tree, context);

            logSuccess(`Schematic-Konfiguration für Projekt "${options.project}" erfolgreich.`);
            return tree;
        });
    }
}

/**
 * Prüft ob die Versionen des Projekts mit den erforderlichen Versionen dieses Updates übereinstimmen.
 */
export function checkVersions(): Rule {
    return (tree: Tree, context: SchematicContext) => {
        logInfoWithDescriptor('Starte die Versionsprüfung.');
        return waitForTreeCallback(tree, () => {
            const minimumLuxComponentsVersion = '1.5.25';
            validateLuxComponentsVersion(tree, context, minimumLuxComponentsVersion);

            const minimumNodeVersion = '8.0.0';
            validateNodeVersion(context, minimumNodeVersion);

            logSuccess(`Versionen erfolgreich geprüft.`);
            return tree;
        });
    };
}

/**
 * Fügt den aktuellen Theming Ordner zu dem Projekt hinzu.
 * @param options
 */
export function addThemingFolderThemes(options: any): Rule {
    return moveFilesToDirectory(options, 'files/theming', 'src/theming');
}

/**
 * Entfernt das Standard Lint-Script und ersetzt es durch 2 eigene.
 */
export function updateAngularJson(): Rule {
    return (tree: Tree, context: SchematicContext) => {

        logInfoWithDescriptor('Aktualisiere die Datei "angular.json".');
        return waitForTreeCallback(tree, () => {
            const angularJsonFile = tree.read('angular.json');

            if (angularJsonFile) {
                const angularJsonFileObject = JSON.parse(angularJsonFile.toString('utf-8'));

                const project = Object.keys(angularJsonFileObject['projects'])[0];
                const projectObject = angularJsonFileObject.projects[project];

                delete projectObject.architect.lint;

                projectObject.architect = {
                    ...projectObject.architect,
                    "app-lint": {
                        "builder": "@angular-devkit/build-angular:tslint",
                        "options": {
                            "tsConfig": [
                                "src/tsconfig.app.json"
                            ],
                            "tslintConfig": "./tslint.json"
                        }
                    },
                    "spec-lint": {
                        "builder": "@angular-devkit/build-angular:tslint",
                        "options": {
                            "tsConfig": [
                                "src/tsconfig.spec.json"
                            ],
                            "tslintConfig": "./tslint.spec.json"
                        }
                    }
                };

                tree.overwrite('angular.json', JSON.stringify(angularJsonFileObject, null, 2));
            }
            else {
                throw formattedSchematicsException('angular.json konnte nicht gelesen werden.');
            }

            logSuccess(`Die Sektion "lint" in angular.json wurde aktualisiert.`);
            return tree;
        });

    }
}

/**
 * Behebt einen Fehler in der App.Module.ts mit den MAT_PLACEHOLDER_OPTIONS.
 * @param options
 */
export function fixCompileError(options: any): Rule {
    return (tree: Tree, context: SchematicContext) => {
        logInfoWithDescriptor('Entferne Placeholder-Options aus app.module.ts.');
        return waitForTreeCallback(tree, () => {
            const appModulePath = options.path + '/src/app/app.module.ts';
            const appModuleFile = tree.read(appModulePath);

            if (appModuleFile != null) {
                let content: any = tree.read(appModulePath);
                if (content) {
                    content = content.toString();
                    // RegExp, die die möglichen Varianten des gesuchten Providers abdeckt
                    const regExp = /{(\s*)provide(\s*):(\s*)MAT_PLACEHOLDER_GLOBAL_OPTIONS([\s\S]*?)}(\s*)}(,?)/g;
                    if (content.search(regExp) > 0) {
                        // Alle möglichen Varianten des Providers aus dem Inhalt entfernen
                        content = content.replace(regExp, '');
                        // 8 Whitespaces hintereinander entfernen.
                        // Hintergrund: Scheint genau die Anzahl an Spaces zu sein, die nach der Ersetzung leer übrig bleiben
                        content = content.replace(/(\s{8,})/g, '');
                        tree.overwrite(appModulePath, content);
                        logSuccess(`app.module.ts aktualisiert.`);
                    } else {
                        logSuccess(`app.module.ts besitzt den gesuchten String nicht.`);
                    }
                } else {
                    logSuccess(`app.module.ts hatte keinen Inhalt.`);
                }
            } else {
                logSuccess(`app.module.ts nicht im Projekt vorhanden.`);
            }
            return tree;
        });
    }
}

/**
 * Fügt die neuen dependencies der package.json hinzu.
 */
export function addPackageJsonDependencies(): Rule {
    return (tree: Tree, context: SchematicContext) => {
        logInfoWithDescriptor('Füge neue Dependencies zu package.json hinzu.');
        return waitForTreeCallback(tree, () => {
            const dependencies: NodeDependency[] = [
                {type: NodeDependencyType.Default, version: '7.0.1', name: '@angular/animations'},
                {type: NodeDependencyType.Default, version: '7.0.2', name: '@angular/cdk'},
                {type: NodeDependencyType.Default, version: '7.0.1', name: '@angular/common'},
                {type: NodeDependencyType.Default, version: '7.0.1', name: '@angular/compiler'},
                {type: NodeDependencyType.Default, version: '7.0.1', name: '@angular/core'},
                {type: NodeDependencyType.Default, version: '7.0.0-beta.19', name: '@angular/flex-layout'},
                {type: NodeDependencyType.Default, version: '7.0.1', name: '@angular/forms'},
                {type: NodeDependencyType.Default, version: '7.0.1', name: '@angular/http'},
                {type: NodeDependencyType.Default, version: '7.0.2', name: '@angular/material'},
                {type: NodeDependencyType.Default, version: '7.0.1', name: '@angular/platform-browser'},
                {type: NodeDependencyType.Default, version: '7.0.1', name: '@angular/platform-browser-dynamic'},
                {type: NodeDependencyType.Default, version: '7.0.1', name: '@angular/router'},
                {type: NodeDependencyType.Default, version: '2.5.7', name: 'core-js'},
                {type: NodeDependencyType.Default, version: '4.7.0', name: 'font-awesome'},
                {type: NodeDependencyType.Default, version: '2.0.8', name: 'hammerjs'},
                {type: NodeDependencyType.Default, version: '1.7.0', name: 'lux-components'},
                {type: NodeDependencyType.Default, version: '4.0.2', name: 'material-design-icons-iconfont'},
                {type: NodeDependencyType.Default, version: '6.3.3', name: 'rxjs'},
                {type: NodeDependencyType.Default, version: '0.8.26', name: 'zone.js'}
            ];

            dependencies.forEach(dependency => {
                updatePackageJsonDependency(tree, context, dependency);
            });
            logSuccess('Dependencies aktualisiert.');
            return tree;
        });
    };
}

/**
 * Fügt die neuen dev-dependencies der package.json hinzu.
 */
export function addPackageJsonDevDependencies(): Rule {
    return (tree: Tree, context: SchematicContext) => {
        logInfoWithDescriptor('Füge neue DevDependencies zu package.json hinzu.');
        return waitForTreeCallback(tree, () => {
            const devDependencies: NodeDependency[] = [
                {type: NodeDependencyType.Dev, version: '0.10.5', name: '@angular-devkit/build-angular'},
                {type: NodeDependencyType.Dev, version: '7.0.3', name: '@angular/cli'},
                {type: NodeDependencyType.Dev, version: '7.0.1', name: '@angular/compiler-cli'},
                {type: NodeDependencyType.Dev, version: '7.0.1', name: '@angular/language-service'},
                {type: NodeDependencyType.Dev, version: '1.1.6', name: '@compodoc/compodoc'},
                {type: NodeDependencyType.Dev, version: '2.8.9', name: '@types/jasmine'},
                {type: NodeDependencyType.Dev, version: '2.0.5', name: '@types/jasminewd2'},
                {type: NodeDependencyType.Dev, version: '10.12.1', name: '@types/node'},
                {type: NodeDependencyType.Dev, version: '4.5.0', name: 'codelyzer'},
                {type: NodeDependencyType.Dev, version: '3.3.0', name: 'jasmine-core'},
                {type: NodeDependencyType.Dev, version: '4.2.1', name: 'jasmine-spec-reporter'},
                {type: NodeDependencyType.Dev, version: '3.1.1', name: 'karma'},
                {type: NodeDependencyType.Dev, version: '2.2.0', name: 'karma-chrome-launcher'},
                {type: NodeDependencyType.Dev, version: '1.1.0', name: 'karma-firefox-launcher'},
                {type: NodeDependencyType.Dev, version: '1.0.0', name: 'karma-ie-launcher'},
                {type: NodeDependencyType.Dev, version: '0.4.2', name: 'karma-edge-launcher'},
                {type: NodeDependencyType.Dev, version: '1.0.0', name: 'karma-safari-launcher'},
                {type: NodeDependencyType.Dev, version: '1.0.1', name: 'karma-cli'},
                {type: NodeDependencyType.Dev, version: '2.0.4', name: 'karma-coverage-istanbul-reporter'},
                {type: NodeDependencyType.Dev, version: '1.1.2', name: 'karma-jasmine'},
                {type: NodeDependencyType.Dev, version: '1.4.0', name: 'karma-jasmine-html-reporter'},
                {type: NodeDependencyType.Dev, version: '3.2.1', name: 'nsp'},
                {type: NodeDependencyType.Dev, version: '5.4.1', name: 'protractor'},
                {type: NodeDependencyType.Dev, version: '2.0.0', name: 'retire'},
                {type: NodeDependencyType.Dev, version: '7.0.1', name: 'ts-node'},
                {type: NodeDependencyType.Dev, version: '5.11.0', name: 'tslint'},
                {type: NodeDependencyType.Dev, version: '1.1.2', name: 'tslint-angular'},
                {type: NodeDependencyType.Dev, version: '3.1.4', name: 'typescript'},
            ];

            devDependencies.forEach(devDependency => {
                updatePackageJsonDependency(tree, context, devDependency);
            });
            logSuccess('DevDependencies aktualisiert.');
            return tree;
        });
    };
}

/**
 * Aktualisiert die lint-scripte der package.json.
 * @param options
 */
export function addPackageJsonScripts(options: any): Rule {
    return (tree: Tree, context: SchematicContext) => {
        logInfoWithDescriptor('Füge Skripte zu package.json hinzu.');
        return waitForTreeCallback(tree, () => {
            const scripts: NodeScript[] = [
                {name: 'start', command: 'ng serve --public-host=http://localhost:4200', overwrite: true},
                {
                    name: 'lint',
                    command: 'run ' + options.project + ':app-lint --format=stylish && ng run ' + options.project + ':spec-lint --format=stylish',
                    overwrite: true
                },
            ];

            scripts.forEach(script => {
                controlPackageJsonScript(tree, context, script);
            });
            logSuccess('Skripte aktualisiert.');
            return tree;
        });
    };
}

export function todosForUser(): Rule {
    return (tree: Tree, context: SchematicContext) => {
        runInstallAndLogToDos(context,
            `In der Applikation muss geprüft werden, inwiefern sich die Änderungen im flex-layout und RXJS auf die Komponenten auswirken.\r\n${TAB}Um die alte RXJS-Version vorerst weiter zu benutzen kann über ${chalk.redBright('npm install rxjs-compat')} ein Kompatibilitätspaket eingebunden werden.`,
            `Bitte starten Sie ${ chalk.redBright('npm run smoketest') } um möglichen Fehlern vorzugreifen.`,
            `Weitere Informationen: https://confluence.gfi.ihk.de/display/EVA/Update+Guide#UpdateGuide-UmstellungaufVersion1.7.0`
        );

        return tree;
    }
}
