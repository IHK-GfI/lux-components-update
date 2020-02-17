import { SchematicTestRunner, UnitTestTree } from '@angular-devkit/schematics/testing';
import * as path from 'path';
import { of as observableOf } from 'rxjs';
import { addDependencyToPackageJson, appOptions, workspaceOptions } from '../../utility/test-helper';
import { callRule, SchematicContext, SchematicsException, Tree } from '@angular-devkit/schematics';
import { addPackageJsonDependencies, addPackageJsonDevDependencies, checkVersions, updatePackageJson } from './index';
import { UtilConfig } from '../../utility/util';

const collectionPath = path.join(__dirname, '../../collection.json');

describe('lux-version-1.7.16', () => {
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
        const schematic = runner.engine.createSchematic('lux-version-1.7.16', collection);
        context = runner.engine.createContext(schematic);
    });

    describe('[Rule] setupProject', () => {
        it('Sollte Fehler werfen, wenn ein empty Tree genutzt wird', () => {
            expect(() => runner.runSchematic('lux-version-1.7.16', {}, Tree.empty()))
                .toThrowError(SchematicsException);
        });

        it('Sollte Fehler werfen, wenn keine Option "project" gesetzt ist', () => {
            try {
                runner.runSchematic('lux-version-1.7.16', {}, appTree);
            } catch (ex) {
                expect(ex.toString()).toContain('Option "project" wird benötigt.');
            }
        });
    });

    describe('[Rule] checkVersions', () => {

        it('Sollte einen Fehler werfen, wenn Version < n - 1', () => {
            addDependencyToPackageJson(appTree, 'lux-components', '1.7.8');

            callRule(checkVersions(), observableOf(appTree), context).subscribe(
                (success) => expect(success).toBeUndefined(),
                (reason) => expect(reason.toString()).toContain('Dieser Generator benötigt allerdings die (neuere) Version 1.7.15.'));
        });

        it('Sollte einen Fehler werfen, wenn Version > n - 1', () => {
            addDependencyToPackageJson(appTree, 'lux-components', '1.7.16');

            callRule(checkVersions(), observableOf(appTree), context).subscribe(
                (success) => expect(success).toBeUndefined(),
                (reason) => expect(reason.toString()).toContain('Dieser Generator benötigt allerdings die (ältere) Version 1.7.15.'));
        });

        it('Sollte keinen Fehler werfen, wenn Version === n - 1', () => {
            addDependencyToPackageJson(appTree, 'lux-components', '1.7.15');
            callRule(checkVersions(), observableOf(appTree), context).subscribe(
                (success) => expect(success).toBeDefined(),
                (reason) => expect(reason).toBeUndefined());
        });

        it('Sollte einen Fehler werfen, wenn Node-Version < 8.0.0', () => {
            addDependencyToPackageJson(appTree, 'lux-components', '1.7.15');
            Object.defineProperty(process.versions, 'node', {
                get: () => '7.9.9'
            });

            callRule(checkVersions(), observableOf(appTree), context).subscribe(
                (success) => expect(success).toBeUndefined(),
                (reason) => expect(reason.toString()).toContain('LUX benötigt allerdings die Version 8.0.0.'));
        });

        it('Sollte keinen Fehler werfen, wenn Node-Version >= 8.0.0', () => {
            addDependencyToPackageJson(appTree, 'lux-components', '1.7.15');
            Object.defineProperty(process.versions, 'node', {
                get: () => '8.0.0'
            });
            callRule(checkVersions(), observableOf(appTree), context).subscribe(
                (success) => expect(success).toBeDefined(),
                (reason) => expect(reason).toBeUndefined());
        });
    });

    describe('[Rule] updatePackageJson', () => {

        beforeEach(() => {
            addDependencyToPackageJson(appTree, 'lux-components', '1.7.15');
        });

        // Muss über async laufen, da sonst eine package.json geprüft wird, welche bereits wieder resettet wurde
        it('Sollte die Dependency "lux-components" auf Version 1.7.16 setzen', (async (done) => {
            callRule(updatePackageJson(), observableOf(appTree), context).subscribe(
                () => {
                    expect(appTree.readContent('/package.json'))
                        .toContain('"lux-components": "1.7.16"');
                    done();
                },
                (reason) => expect(reason).toBeUndefined());
        }));
    });

    describe(('[Rule] addPackageJsonDependencies'), () => {
        it('Sollte die Dependencies hinzufügen', (async (done) => {

            // Schreibe Fantasie-Versionen die älter sind in package.json
            appTree.overwrite('/package.json', '' +
                '{\n' +
                '"dependencies": {\n' +
                '    "@angular/animations": "7.0.1",\n' +
                '    "@angular/cdk": "7.0.2",\n' +
                '    "@angular/common": "7.0.1",\n' +
                '    "@angular/compiler": "7.0.1",\n' +
                '    "@angular/core": "7.0.1",\n' +
                '    "@angular/flex-layout": "7.0.0-beta.19",\n' +
                '    "@angular/forms": "7.0.1",\n' +
                '    "@angular/http": "7.0.1",\n' +
                '    "@angular/material": "7.0.2",\n' +
                '    "@angular/platform-browser": "7.0.1",\n' +
                '    "@angular/platform-browser-dynamic": "7.0.1",\n' +
                '    "@angular/router": "7.0.1",\n' +
                '    "node-sass": "4.11.0",\n' +
                '    "core-js": "2.5.7",\n' +
                '    "@fortawesome/fontawesome-free": "5.7.2",\n' +
                '    "hammerjs": "2.0.8",\n' +
                '    "lux-components": "1.7.15",\n' +
                '    "material-design-icons-iconfont": "4.0.2",\n' +
                '    "rxjs": "6.3.3",\n' +
                '    "zone.js": "0.8.26"\n' +
                '   }\n' +
                '}');

            // Exemplarisch nur einige abfragen
            expect(appTree.readContent('/package.json')).not.toContain('"@angular/animations": "7.2.15"');
            expect(appTree.readContent('/package.json')).not.toContain('"@angular/cdk": "7.3.7"');
            expect(appTree.readContent('/package.json')).not.toContain('"@angular/common": "7.2.15"');
            expect(appTree.readContent('/package.json')).not.toContain('"lux-components": "1.7.16"');

            callRule(addPackageJsonDependencies(), observableOf(appTree), context)
                .subscribe(() => {
                    // Nachbedingungen prüfen
                    expect(appTree.readContent('/package.json')).toContain('"@angular/animations": "7.2.15"');
                    expect(appTree.readContent('/package.json')).toContain('"@angular/cdk": "7.3.7"');
                    expect(appTree.readContent('/package.json')).toContain('"@angular/common": "7.2.15"');
                    expect(appTree.readContent('/package.json')).toContain('"lux-components": "1.7.16"');

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
                '    "@fortawesome/fontawesome-free": "8.7.0",\n' +
                '    "hammerjs": "8.0.8",\n' +
                '    "lux-components": "8.5.25",\n' +
                '    "material-design-icons-iconfont": "8.0.2",\n' +
                '    "rxjs": "8.3.3",\n' +
                '    "zone.js": "8.6.26"\n' +
                '   }\n' +
                '}');

            // Exemplarisch nur einige abfragen
            expect(appTree.readContent('/package.json')).not.toContain('"@angular/animations": "7.2.15"');
            expect(appTree.readContent('/package.json')).not.toContain('"@angular/cdk": "7.3.7"');
            expect(appTree.readContent('/package.json')).not.toContain('"@angular/common": "7.2.15"');
            expect(appTree.readContent('/package.json')).not.toContain('"lux-components": "1.7.15"');

            callRule(addPackageJsonDependencies(), observableOf(appTree), context)
                .subscribe(() => {
                    // Nachbedingungen prüfen
                    expect(appTree.readContent('/package.json')).not.toContain('"@angular/animations": "7.2.15"');
                    expect(appTree.readContent('/package.json')).not.toContain('"@angular/cdk": "7.3.7"');
                    expect(appTree.readContent('/package.json')).not.toContain('"@angular/common": "7.2.15"');
                    expect(appTree.readContent('/package.json')).not.toContain('"lux-components": "1.7.15"');
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
                '"devDependencies": {\n' +
                '    "@angular-devkit/build-angular": "0.10.5",\n' +
                '    "@angular/cli": "7.0.3",\n' +
                '    "@angular/compiler-cli": "7.0.1",\n' +
                '    "@angular/language-service": "7.0.1",\n' +
                '    "@compodoc/compodoc": "1.1.6",\n' +
                '    "@types/jasmine": "2.8.9",\n' +
                '    "@types/jasminewd2": "2.0.5",\n' +
                '    "@types/node": "10.12.1",\n' +
                '    "codelyzer": "4.5.0",\n' +
                '    "jasmine-core": "3.3.0",\n' +
                '    "jasmine-spec-reporter": "4.2.1",\n' +
                '    "karma": "3.1.1",\n' +
                '    "karma-chrome-launcher": "2.2.0",\n' +
                '    "karma-firefox-launcher": "1.1.0",\n' +
                '    "karma-ie-launcher": "1.0.0",\n' +
                '    "karma-edge-launcher": "0.4.2",\n' +
                '    "karma-safari-launcher": "1.0.0",\n' +
                '    "karma-cli": "1.0.1",\n' +
                '    "karma-coverage-istanbul-reporter": "2.0.4",\n' +
                '    "karma-jasmine": "1.1.2",\n' +
                '    "karma-jasmine-html-reporter": "1.4.0",\n' +
                '    "nsp": "3.2.1",\n' +
                '    "protractor": "5.4.1",\n' +
                '    "retire": "2.0.0",\n' +
                '    "ts-node": "7.0.1",\n' +
                '    "tslint": "5.11.0",\n' +
                '    "tslint-angular": "1.1.2",\n' +
                '    "typescript": "3.1.4"\n' +
                '   }\n' +
                '}');

            // Exemplarisch nur einige abfragen
            expect(appTree.readContent('/package.json')).not.toContain('"@angular/cli": "7.3.9"');
            expect(appTree.readContent('/package.json')).not.toContain('"@angular/compiler-cli": "7.2.15"');
            expect(appTree.readContent('/package.json')).not.toContain('"karma": "3.1.4"');
            expect(appTree.readContent('/package.json')).not.toContain('"@types/jasmine": "2.8.16"');

            callRule(addPackageJsonDevDependencies(), observableOf(appTree), context)
                .subscribe(() => {
                    // Nachbedingungen prüfen
                    expect(appTree.readContent('/package.json')).toContain('"@angular/cli": "7.3.9"');
                    expect(appTree.readContent('/package.json')).toContain('"@angular/compiler-cli": "7.2.15"');
                    expect(appTree.readContent('/package.json')).toContain('"karma": "3.1.4"');
                    expect(appTree.readContent('/package.json')).toContain('"@types/jasmine": "2.8.16"');

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
                '"devDependencies": {\n' +
                '    "@angular-devkit/build-angular": "100.10.5",\n' +
                '    "@angular/cli": "100.0.3",\n' +
                '    "@angular/compiler-cli": "100.0.1",\n' +
                '    "@angular/language-service": "100.0.1",\n' +
                '    "@compodoc/compodoc": "100.1.6",\n' +
                '    "@types/jasmine": "100.8.9",\n' +
                '    "@types/jasminewd2": "100.0.5",\n' +
                '    "@types/node": "100.12.1",\n' +
                '    "codelyzer": "100.5.0",\n' +
                '    "jasmine-core": "100.3.0",\n' +
                '    "jasmine-spec-reporter": "100.2.1",\n' +
                '    "karma": "100.1.1",\n' +
                '    "karma-chrome-launcher": "100.2.0",\n' +
                '    "karma-firefox-launcher": "100.1.0",\n' +
                '    "karma-ie-launcher": "100.0.0",\n' +
                '    "karma-edge-launcher": "100.4.2",\n' +
                '    "karma-safari-launcher": "100.0.0",\n' +
                '    "karma-cli": "100.0.1",\n' +
                '    "karma-coverage-istanbul-reporter": "100.0.4",\n' +
                '    "karma-jasmine": "100.1.2",\n' +
                '    "karma-jasmine-html-reporter": "100.4.0",\n' +
                '    "nsp": "100.2.1",\n' +
                '    "protractor": "100.4.1",\n' +
                '    "retire": "100.0.0",\n' +
                '    "ts-node": "100.0.1",\n' +
                '    "tslint": "100.11.0",\n' +
                '    "tslint-angular": "100.1.2",\n' +
                '    "typescript": "100.1.4"\n' +
                '   }\n' +
                '}');

            // Exemplarisch nur einige abfragen
            expect(appTree.readContent('/package.json')).not.toContain('"@angular/cli": "7.3.9"');
            expect(appTree.readContent('/package.json')).not.toContain('"@angular/compiler-cli": "7.3.9"');
            expect(appTree.readContent('/package.json')).not.toContain('"karma": "3.1.4"');
            expect(appTree.readContent('/package.json')).not.toContain('"@types/jasmine": "2.8.16"');

            callRule(addPackageJsonDevDependencies(), observableOf(appTree), context)
                .subscribe(() => {
                    // Nachbedingungen prüfen
                    expect(appTree.readContent('/package.json')).not.toContain('"@angular/cli": "7.3.9"');
                    expect(appTree.readContent('/package.json')).not.toContain('"@angular/compiler-cli": "7.3.9"');
                    expect(appTree.readContent('/package.json')).not.toContain('"karma": "3.1.4"');
                    expect(appTree.readContent('/package.json')).not.toContain('"@types/jasmine": "2.8.16"');

                    done();
                }, (reason) => {
                    expect(reason).toBeUndefined();
                    done();
                });
        }));
    });

});
