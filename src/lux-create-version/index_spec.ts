
import * as path from 'path';
import { UnitTestTree, SchematicTestRunner } from '@angular-devkit/schematics/testing';
import { SchematicContext, callRule } from '@angular-devkit/schematics';
import { workspaceOptions, appOptions } from '../utility/test-helper';
import { UtilConfig } from '../utility/util';
import { of as observableOf } from 'rxjs';
import { createFiles, addSchematicToCollectionJson, setup } from './index';

const collectionPath = path.join(__dirname, '../collection.json');

describe('lux-create-version', () => {
    let appTree: UnitTestTree;
    let runner: SchematicTestRunner;
    let context: SchematicContext;

    const testOptions: any = {
        name: '1.9.5',
        lastVersion: '1.8.0',
        nodeVersion: '8.0.0'
    };

    beforeEach(() => {
        runner = new SchematicTestRunner('schematics', collectionPath);

        appTree = runner.runExternalSchematic(
            '@schematics/angular', 'workspace', workspaceOptions);
        appTree = runner.runExternalSchematic(
            '@schematics/angular', 'application', appOptions, appTree);

        UtilConfig.defaultWaitMS = 0;

        const collection = runner.engine.createCollection(collectionPath);
        const schematic = runner.engine.createSchematic('lux-create-version', collection);
        context = runner.engine.createContext(schematic);

        appTree.overwrite('/package.json', `
            {
                "name": "lux-components-update",
                "version": "0.0.32",
                "description": "Schematics für die Aktualisierung von LUX-Applikationen",
                "scripts": {
                    "build": "tsc -p tsconfig.json",
                    "test": "npm run build && jasmine src/**/*_spec.js"
                },
                "keywords": [
                    "schematics",
                    "lux-components",
                    "blueprint"
                ],
                "license": "MIT",
                "schematics": "./collection.json"
            }
        `);

        appTree.create('/collection.json', `
            {
                "$schema": "../node_modules/@angular-devkit/schematics/collection-schema.json",
                "schematics": {
                    "lux-create-version": {
                        "description": "Generiert eine neue Version im LUX-Components-Updater.",
                        "factory": "./lux-create-version/index#luxCreateVersion",
                        "schema": "./lux-create-version/schema.json"
                    },
                    "lux-version-1.7.20": {
                        "description": "Aktualisiert die LUX-Applikation zur Version 1.7.20 der LUX-Components.",
                        "factory": "./lux-version-1.7/1.7.20/index#luxVersion",
                        "schema": "./lux-version-1.7/1.7.20/schema.json"
                    },
                    "lux-version-1.8.0": {
                        "description": "Aktualisiert die LUX-Applikation zur Version 1.8.0 der LUX-Components.",
                        "factory": "./lux-version-1.8/1.8.0/index#luxVersion",
                        "schema": "./lux-version-1.8/1.8.0/schema.json"
                    }
                }
            }
        `);
    });

    describe('[Rule] createFiles', () => {
        it('Sollte ein Ordner inklusive alle Dateien generieren', (async (done) => {
            callRule(createFiles(testOptions), observableOf(appTree), context).subscribe(() => {
                expect(appTree.files).toContain('/src/lux-version-1.9/1.9.5/index.ts');
                expect(appTree.files).toContain('/src/lux-version-1.9/1.9.5/index_spec.ts');
                expect(appTree.files).toContain('/src/lux-version-1.9/1.9.5/schema.json');
                
                done();
            }, (reason) => expect(reason).toBeUndefined());
        }));
    });

    describe('[Rule] addSchematicToCollectionJson', () => {
        it('Sollte einen Schematic-Eintrag in die collection.json ausführen', (async (done) => {
            callRule(addSchematicToCollectionJson(testOptions), observableOf(appTree), context).subscribe(() => {
                const collectionConntent = appTree.readContent('/collection.json');

                expect(collectionConntent).toContain('"lux-version-1.9.5": {');
                expect(collectionConntent).toContain('"description": "Aktualisiert die LUX-Applikation zur Version 1.9.5 der LUX-Components.",');
                expect(collectionConntent).toContain('"factory": "./lux-version-1.9/1.9.5/index#luxVersion",');
                expect(collectionConntent).toContain('"schema": "./lux-version-1.9/1.9.5/schema.json"');
               
                done();
            }, (reason) => expect(reason).toBeUndefined());
        }));
    });

    describe('[Rule] setup', () => {
        it('Erstelle Version 1.7.21 mit richtiger Konfiguration', (async (done) => {
            appTree.create('/src/lux-version-1.7/1.7.20/index.ts', '');
            appTree.create('/src/lux-version-1.8/1.8.0/index.ts', '');
            
            let testOptions = { name: '1.7.21', nodeVersion: '', lastVersion: '' };
            callRule(setup(testOptions), observableOf(appTree), context).subscribe(() => {
                expect(testOptions.name).toEqual('1.7.21');
                expect(testOptions.nodeVersion).toEqual('8.0.0');
                expect(testOptions.lastVersion).toEqual('1.7.20');
                done();
            }, (reason) => expect(reason).toBeUndefined());
        }));

        it('Erstelle Version 1.8.1 mit richtiger Konfiguration', (async (done) => {
            appTree.create('/src/lux-version-1.7/1.7.20/index.ts', '');
            appTree.create('/src/lux-version-1.8/1.8.0/index.ts', '');
            
            let testOptions = { name: '1.8.1', nodeVersion: '', lastVersion: '' };
            callRule(setup(testOptions), observableOf(appTree), context).subscribe(() => {
                expect(testOptions.name).toEqual('1.8.1');
                expect(testOptions.nodeVersion).toEqual('10.0.0');
                expect(testOptions.lastVersion).toEqual('1.8.0');
                done();
            }, (reason) => expect(reason).toBeUndefined());
        }));

        it('Erstelle Version 1.9.0 mit richtiger Konfiguration', (async (done) => {
            appTree.create('/src/lux-version-1.7/1.7.20/index.ts', '');
            appTree.create('/src/lux-version-1.8/1.8.0/index.ts', '');
            appTree.create('/src/lux-version-1.8/1.8.1/index.ts', '');
            appTree.create('/src/lux-version-1.8/1.8.2/index.ts', '');
            
            let testOptions = { name: '1.9.0', nodeVersion: '', lastVersion: '' };
            callRule(setup(testOptions), observableOf(appTree), context).subscribe(() => {
                expect(testOptions.name).toEqual('1.9.0');
                expect(testOptions.nodeVersion).toEqual('10.16.3');
                expect(testOptions.lastVersion).toEqual('1.8.2');
                done();
            }, (reason) => expect(reason).toBeUndefined());
        }));

        it('Erstelle Version 1.11.0 mit richtiger Konfiguration', (async (done) => {
            appTree.create('/src/lux-version-1.7/1.7.20/index.ts', '');
            appTree.create('/src/lux-version-1.8/1.8.0/index.ts', '');
            appTree.create('/src/lux-version-1.10/1.10.14/index.ts', '');
            appTree.create('/src/lux-version-1.10/1.10.15/index.ts', '');
            
            let testOptions = { name: '1.11.0', nodeVersion: '', lastVersion: '' };
            callRule(setup(testOptions), observableOf(appTree), context).subscribe(() => {
                expect(testOptions.name).toEqual('1.11.0');
                expect(testOptions.nodeVersion).toEqual('10.16.3');
                expect(testOptions.lastVersion).toEqual('1.10.15');
                done();
            }, (reason) => expect(reason).toBeUndefined());
        }));

        it('Erstelle Version 2.0.1 mit richtiger Konfiguration', (async (done) => {
            appTree.create('/src/lux-version-1.7/1.7.20/index.ts', '');
            appTree.create('/src/lux-version-1.8/1.8.0/index.ts', '');
            appTree.create('/src/lux-version-1.10/1.10.15/index.ts', '');
            
            let testOptions = { name: '2.0.1', nodeVersion: '', lastVersion: '' };
            callRule(setup(testOptions), observableOf(appTree), context).subscribe(() => {
                expect(testOptions.name).toEqual('2.0.1');
                expect(testOptions.nodeVersion).toEqual('10.16.3');
                expect(testOptions.lastVersion).toEqual('1.10.15');
                done();
            }, (reason) => expect(reason).toBeUndefined());
        }));
    })
});
