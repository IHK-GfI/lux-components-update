import { callRule, SchematicContext } from '@angular-devkit/schematics';
import { SchematicTestRunner, UnitTestTree } from '@angular-devkit/schematics/testing';
import * as path from 'path';
import { appOptions, workspaceOptions } from '../../utility/test-helper';
import { UtilConfig } from '../../utility/util';
import { updateLuxStylesScss } from '../../lux-version-1.7/1.7.10/index';
import { of as observableOf } from 'rxjs';
import {
    addPackageJsonDependencies,
    addPackageJsonDevDependencies,
    addPackageJsonScripts,
    fixCompileError,
    updateAngularJson
} from './index';

const collectionPath = path.join(__dirname, '../../collection.json');

describe('lux-version-1.7.0', () => {
    let appTree: UnitTestTree;
    let runner: SchematicTestRunner;
    let context: SchematicContext;

    beforeEach(() => {
        runner = new SchematicTestRunner('schematics', collectionPath);

        appTree = runner.runExternalSchematic(
            '@schematics/angular', 'workspace', workspaceOptions);
        appTree = runner.runExternalSchematic(
            '@schematics/angular', 'application', appOptions, appTree);

        UtilConfig.defaultWaitMS = 0;

        const collection = runner.engine.createCollection(collectionPath);
        const schematic = runner.engine.createSchematic('lux-version-1.7.0', collection);
        context = runner.engine.createContext(schematic);
    });

    describe(('[Rule] addThemingFolderThemes'), () => {
        it('Sollte den Theming-Ordner herüber kopieren', (async (done) => {
            appTree.create('/projects/bar/src/theming/luxstyles.scss', 'Leer');
            appTree.create('/projects/bar/src/theming/luxtheme.scss', 'Leer');

            expect(appTree.readContent('/projects/bar/src/theming/luxstyles.scss')).toContain('Leer');
            expect(appTree.readContent('/projects/bar/src/theming/luxtheme.scss')).toContain('Leer');

            // Änderungen durchführen
            callRule(updateLuxStylesScss({path: '/projects/bar'}), observableOf(appTree), context)
                .subscribe(() => {
                    // Nachbedingungen prüfen
                    expect(appTree.readContent('/projects/bar/src/theming/luxstyles.scss')).toContain('Version 1.2');
                    expect(appTree.readContent('/projects/bar/src/theming/luxstyles.scss')).toContain('Version 0.2');
                    done();
                }, (reason) => {
                    expect(reason).toBeUndefined();
                    done();
                });
        }));
    });

    describe(('[Rule] updateAngularJson'), () => {
        it('Sollte die Datei angular.json aktualisieren', (async (done) => {
            expect(JSON.parse(appTree.readContent('angular.json')).projects.bar.architect.lint).toBeDefined();
            callRule(updateAngularJson(), observableOf(appTree), context)
                .subscribe(() => {
                    // Nachbedingungen prüfen
                    expect(JSON.parse(appTree.readContent('angular.json')).projects.bar.architect.lint).not.toBeDefined();
                    expect(JSON.parse(appTree.readContent('angular.json')).projects.bar.architect['app-lint']).toBeDefined();
                    expect(JSON.parse(appTree.readContent('angular.json')).projects.bar.architect['spec-lint']).toBeDefined();
                    done();
                }, (reason) => {
                    expect(reason).toBeUndefined();
                    done();
                });
        }));
    });

    describe(('[Rule] fixCompileError'), () => {
        it('Sollte MAT_PLACEHOLDER_GLOBAL_OPTIONS entfernen', (async (done) => {
            appTree.overwrite('/projects/bar/src/app/app.module.ts', appTree.readContent('/projects/bar/src/app/app.module.ts').replace(
                'providers: []', `providers      : [
                {
                  provide: MAT_PLACEHOLDER_GLOBAL_OPTIONS,
                  useValue: { float: 'always' }
                },
                {provide: MAT_PLACEHOLDER_GLOBAL_OPTIONS, useValue: {float: 'always'}},
                {
                  provide: MAT_PLACEHOLDER_GLOBAL_OPTIONS,
                  useValue: {
                    float: 'always'
                  }
                }
              ]`
            ));
            expect(appTree.readContent('/projects/bar/src/app/app.module.ts')).toContain('MAT_PLACEHOLDER_GLOBAL_OPTIONS');

            callRule(fixCompileError({path: '/projects/bar'}), observableOf(appTree), context)
                .subscribe(() => {
                    // Nachbedingungen prüfen
                    expect(appTree.readContent('/projects/bar/src/app/app.module.ts')).not.toContain('MAT_PLACEHOLDER_GLOBAL_OPTIONS');
                    expect(appTree.readContent('/projects/bar/src/app/app.module.ts').replace(/(\s{2,})/g, ' ')).toContain('providers : []');
                    done();
                }, (reason) => {
                    expect(reason).toBeUndefined();
                    done();
                });
        }));

        it('Sollte die Provider nicht ändern', (async (done) => {
            appTree.overwrite('/projects/bar/src/app/app.module.ts', appTree.readContent('/projects/bar/src/app/app.module.ts').replace(
                'providers: []', `providers      : [
                { provide: GANZ_SICHER_KEINE_GLOBAL_OPTIONS, useValue: { float: 'always' } }
              ]`
            ));
            const readContent = appTree.readContent('/projects/bar/src/app/app.module.ts');
            expect(readContent).toContain('GANZ_SICHER_KEINE_GLOBAL_OPTIONS');

            callRule(fixCompileError({path: '/projects/bar'}), observableOf(appTree), context)
                .subscribe(() => {
                    // Nachbedingungen prüfen
                    expect(appTree.readContent('/projects/bar/src/app/app.module.ts')).toEqual(readContent);
                    done();
                }, (reason) => {
                    expect(reason).toBeUndefined();
                    done();
                });
        }));
    });

    describe(('[Rule] addPackageJsonDependencies'), () => {
        it('Sollte die Dependencies hinzufügen', (async (done) => {

            // Schreibe Fantasie-Versionen die älter sind in package.json
            appTree.overwrite('/package.json', '' +
                '{\n' +
                '  "dependencies": {\n' +
                '    "@angular/animations": "5.0.1",\n' +
                '    "@angular/cdk": "5.0.2",\n' +
                '    "@angular/common": "5.0.1",\n' +
                '    "@angular/compiler": "5.0.1",\n' +
                '    "@angular/core": "5.0.1",\n' +
                '    "@angular/flex-layout": "5.0.0-beta.19",\n' +
                '    "@angular/forms": "5.0.1",\n' +
                '    "@angular/http": "5.0.1",\n' +
                '    "@angular/material": "5.0.2",\n' +
                '    "@angular/platform-browser": "5.0.1",\n' +
                '    "@angular/platform-browser-dynamic": "5.0.1",\n' +
                '    "@angular/router": "5.0.1",\n' +
                '    "@fortawesome/fontawesome-free": "4.7.2",\n' +
                '    "core-js": "1.5.7",\n' +
                '    "font-awesome": "3.7.0",\n' +
                '    "hammerjs": "1.0.8",\n' +
                '    "lux-components": "1.5.25",\n' +
                '    "material-design-icons-iconfont": "3.0.2",\n' +
                '    "rxjs": "5.3.3",\n' +
                '    "zone.js": "0.6.26"\n' +
                '  }\n' +
                '}');

            // Exemplarisch nur einige abfragen
            expect(appTree.readContent('/package.json')).not.toContain('"@angular/animations": "7.0.1"');
            expect(appTree.readContent('/package.json')).not.toContain('"@angular/cdk": "7.0.2"');
            expect(appTree.readContent('/package.json')).not.toContain('"@angular/common": "7.0.1"');
            expect(appTree.readContent('/package.json')).not.toContain('"lux-components": "1.7.0"');

            callRule(addPackageJsonDependencies(), observableOf(appTree), context)
                .subscribe(() => {
                    // Nachbedingungen prüfen
                    expect(appTree.readContent('/package.json')).toContain('"@angular/animations": "7.0.1"');
                    expect(appTree.readContent('/package.json')).toContain('"@angular/cdk": "7.0.2"');
                    expect(appTree.readContent('/package.json')).toContain('"@angular/common": "7.0.1"');
                    expect(appTree.readContent('/package.json')).toContain('"lux-components": "1.7.0"');

                    done();
                }, (reason) => {
                    expect(reason).toBeUndefined();
                    done();
                })
        }));

        it('Sollte die Dependencies nicht hinzufügen, wenn neuere vorhanden sind', (async (done) => {

            // Schreibe Fantasie-Versionen die aktueller sind in package.json
            appTree.overwrite('/package.json', '' +
                '{\n' +
                '  "dependencies": {\n' +
                '    "@angular/animations": "8.0.1",\n' +
                '    "@angular/cdk": "8.0.2",\n' +
                '    "@angular/common": "8.0.1",\n' +
                '    "@angular/compiler": "8.0.1",\n' +
                '    "@angular/core": "8.0.1",\n' +
                '    "@angular/flex-layout": "8.0.0-beta.19",\n' +
                '    "@angular/forms": "8.0.1",\n' +
                '    "@angular/http": "8.0.1",\n' +
                '    "@angular/material": "8.0.2",\n' +
                '    "@angular/platform-browser": "8.0.1",\n' +
                '    "@angular/platform-browser-dynamic": "8.0.1",\n' +
                '    "@angular/router": "8.0.1",\n' +
                '    "@fortawesome/fontawesome-free": "8.7.2",\n' +
                '    "core-js": "8.5.7",\n' +
                '    "font-awesome": "8.7.0",\n' +
                '    "hammerjs": "8.0.8",\n' +
                '    "lux-components": "8.5.25",\n' +
                '    "material-design-icons-iconfont": "8.0.2",\n' +
                '    "rxjs": "8.3.3",\n' +
                '    "zone.js": "8.6.26"\n' +
                '  }\n' +
                '}');

            // Exemplarisch nur einige abfragen
            expect(appTree.readContent('/package.json')).not.toContain('"@angular/animations": "7.0.1"');
            expect(appTree.readContent('/package.json')).not.toContain('"@angular/cdk": "7.0.2"');
            expect(appTree.readContent('/package.json')).not.toContain('"@angular/common": "7.0.1"');
            expect(appTree.readContent('/package.json')).not.toContain('"lux-components": "1.7.0"');

            callRule(addPackageJsonDependencies(), observableOf(appTree), context)
                .subscribe(() => {
                    // Nachbedingungen prüfen
                    expect(appTree.readContent('/package.json')).not.toContain('"@angular/animations": "7.0.1"');
                    expect(appTree.readContent('/package.json')).not.toContain('"@angular/cdk": "7.0.2"');
                    expect(appTree.readContent('/package.json')).not.toContain('"@angular/common": "7.0.1"');
                    expect(appTree.readContent('/package.json')).not.toContain('"lux-components": "1.7.0"');

                    done();
                }, (reason) => {
                    expect(reason).toBeUndefined();
                    done();
                })
        }));
    });

    describe(('[Rule] addPackageJsonDevDependencies'), () => {
        it('Sollte die DevDependencies hinzufügen', (async (done) => {

            // Schreibe Fantasie-Versionen die älter sind in package.json
            appTree.overwrite('/package.json', '' +
                '{\n' +
                ' "devDependencies": {\n' +
                '    "@angular/cli": "5.0.3",\n' +
                '    "@angular/compiler-cli": "5.0.1",\n' +
                '    "@angular/language-service": "5.0.1",\n' +
                '    "@compodoc/compodoc": "0.1.6",\n' +
                '    "@types/jasmine": "1.8.9",\n' +
                '    "@types/jasminewd2": "1.0.5",\n' +
                '    "@types/node": "5.12.1",\n' +
                '    "codelyzer": "3.5.0",\n' +
                '    "jasmine-core": "2.3.0",\n' +
                '    "jasmine-spec-reporter": "2.2.1",\n' +
                '    "karma": "2.1.1",\n' +
                '    "karma-chrome-launcher": "1.2.0",\n' +
                '    "karma-firefox-launcher": "0.1.0",\n' +
                '    "karma-ie-launcher": "0.0.0",\n' +
                '    "karma-edge-launcher": "0.3.2",\n' +
                '    "karma-safari-launcher": "0.0.0",\n' +
                '    "karma-cli": "0.0.1",\n' +
                '    "karma-coverage-istanbul-reporter": "1.0.4",\n' +
                '    "karma-jasmine": "0.1.2",\n' +
                '    "karma-jasmine-html-reporter": "0.4.0",\n' +
                '    "nsp": "2.2.1",\n' +
                '    "protractor": "4.4.1",\n' +
                '    "retire": "1.0.0",\n' +
                '    "ts-node": "6.0.1",\n' +
                '    "tslint": "4.11.0",\n' +
                '    "tslint-angular": "0.1.2",\n' +
                '    "typescript": "2.1.4"\n' +
                '  }' +
                '}');

            // Exemplarisch nur einige abfragen
            expect(appTree.readContent('/package.json')).not.toContain('"@angular/cli": "7.0.3"');
            expect(appTree.readContent('/package.json')).not.toContain('"@angular/compiler-cli": "7.0.1"');
            expect(appTree.readContent('/package.json')).not.toContain('"karma": "3.1.1"');
            expect(appTree.readContent('/package.json')).not.toContain('"ts-node": "7.0.1"');

            callRule(addPackageJsonDevDependencies(), observableOf(appTree), context)
                .subscribe(() => {
                    // Nachbedingungen prüfen
                    expect(appTree.readContent('/package.json')).toContain('"@angular/cli": "7.0.3"');
                    expect(appTree.readContent('/package.json')).toContain('"@angular/compiler-cli": "7.0.1"');
                    expect(appTree.readContent('/package.json')).toContain('"karma": "3.1.1"');
                    expect(appTree.readContent('/package.json')).toContain('"ts-node": "7.0.1"');

                    done();
                }, (reason) => {
                    expect(reason).toBeUndefined();
                    done();
                });
        }));

        it('Sollte die DevDependencies nicht hinzufügen, wenn neuere vorhanden sind', (async (done) => {

            // Schreibe Fantasie-Versionen die aktueller sind in package.json
            appTree.overwrite('/package.json', '' +
                '{\n' +
                ' "devDependencies": {\n' +
                '    "@angular/cli": "8.0.3",\n' +
                '    "@angular/compiler-cli": "8.0.1",\n' +
                '    "@angular/language-service": "8.0.1",\n' +
                '    "@compodoc/compodoc": "8.1.6",\n' +
                '    "@types/jasmine": "8.8.9",\n' +
                '    "@types/jasminewd2": "8.0.5",\n' +
                '    "@types/node": "8.12.1",\n' +
                '    "codelyzer": "8.5.0",\n' +
                '    "jasmine-core": "8.3.0",\n' +
                '    "jasmine-spec-reporter": "8.2.1",\n' +
                '    "karma": "8.1.1",\n' +
                '    "karma-chrome-launcher": "8.2.0",\n' +
                '    "karma-firefox-launcher": "8.1.0",\n' +
                '    "karma-ie-launcher": "8.0.0",\n' +
                '    "karma-edge-launcher": "8.3.2",\n' +
                '    "karma-safari-launcher": "8.0.0",\n' +
                '    "karma-cli": "8.0.1",\n' +
                '    "karma-coverage-istanbul-reporter": "8.0.4",\n' +
                '    "karma-jasmine": "8.1.2",\n' +
                '    "karma-jasmine-html-reporter": "8.4.0",\n' +
                '    "nsp": "8.2.1",\n' +
                '    "protractor": "8.4.1",\n' +
                '    "retire": "8.0.0",\n' +
                '    "ts-node": "8.0.1",\n' +
                '    "tslint": "8.11.0",\n' +
                '    "tslint-angular": "8.1.2",\n' +
                '    "typescript": "8.1.4"\n' +
                '  }' +
                '}');

            // Exemplarisch nur einige abfragen
            expect(appTree.readContent('/package.json')).not.toContain('"@angular/cli": "7.0.3"');
            expect(appTree.readContent('/package.json')).not.toContain('"@angular/compiler-cli": "7.0.1"');
            expect(appTree.readContent('/package.json')).not.toContain('"karma": "3.1.1"');
            expect(appTree.readContent('/package.json')).not.toContain('"ts-node": "7.0.1"');

            callRule(addPackageJsonDevDependencies(), observableOf(appTree), context)
                .subscribe(() => {
                    // Nachbedingungen prüfen
                    expect(appTree.readContent('/package.json')).not.toContain('"@angular/cli": "7.0.3"');
                    expect(appTree.readContent('/package.json')).not.toContain('"@angular/compiler-cli": "7.0.1"');
                    expect(appTree.readContent('/package.json')).not.toContain('"karma": "3.1.1"');
                    expect(appTree.readContent('/package.json')).not.toContain('"ts-node": "7.0.1"');

                    done();
                }, (reason) => {
                    expect(reason).toBeUndefined();
                    done();
                });
        }));
    });

    describe(('[Rule] addPackageJsonScripts'), () => {
        it('Sollte die Skripte hinzufügen', (async (done) => {

            expect(appTree.readContent('/package.json')).not.toContain('ng serve --public-host=http://localhost:4200');
            expect(appTree.readContent('/package.json')).not.toContain('bar:app-lint --format=stylish && ng run bar:spec-lint --format=stylish');

            callRule(addPackageJsonScripts({project: 'bar'}), observableOf(appTree), context)
                .subscribe(() => {
                    // Nachbedingungen prüfen
                    expect(appTree.readContent('/package.json')).toContain('ng serve --public-host=http://localhost:4200');
                    expect(appTree.readContent('/package.json')).toContain('bar:app-lint --format=stylish && ng run bar:spec-lint --format=stylish');
                    done();
                }, (reason) => {
                    expect(reason).toBeUndefined();
                    done();
                });
        }));

    });
});
