import { SchematicTestRunner, UnitTestTree } from '@angular-devkit/schematics/testing';
import * as path from 'path';
import { of as observableOf } from 'rxjs';
import { addDependencyToPackageJson, appOptions, workspaceOptions } from '../../utility/test-helper';
import { callRule, SchematicContext, SchematicsException, Tree } from '@angular-devkit/schematics';
import { checkVersions, updateModulesForCommonModule, updateModulesForErrorModule, updatePackageJson } from './index';
import { UtilConfig } from '../../utility/util';

const collectionPath = path.join(__dirname, '../../collection.json');

describe('lux-version-1.7.14', () => {
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
        const schematic = runner.engine.createSchematic('lux-version-1.7.13', collection);
        context = runner.engine.createContext(schematic);
    });

    describe('[Rule] setupProject', () => {
        it('Sollte Fehler werfen, wenn ein empty Tree genutzt wird', () => {
            expect(() => runner.runSchematic('lux-version-1.7.14', {}, Tree.empty()))
                .toThrowError(SchematicsException);
        });

        it('Sollte Fehler werfen, wenn keine Option "project" gesetzt ist', () => {
            try {
                runner.runSchematic('lux-version-1.7.14', {}, appTree);
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
                (reason) => expect(reason.toString()).toContain('Dieser Generator benötigt allerdings die (neuere) Version 1.7.13.'));
        });

        it('Sollte einen Fehler werfen, wenn Version > n - 1', () => {
            addDependencyToPackageJson(appTree, 'lux-components', '1.7.14');

            callRule(checkVersions(), observableOf(appTree), context).subscribe(
                (success) => expect(success).toBeUndefined(),
                (reason) => expect(reason.toString()).toContain('Dieser Generator benötigt allerdings die (ältere) Version 1.7.13.'));
        });

        it('Sollte keinen Fehler werfen, wenn Version === n - 1', () => {
            addDependencyToPackageJson(appTree, 'lux-components', '1.7.13');
            callRule(checkVersions(), observableOf(appTree), context).subscribe(
                (success) => expect(success).toBeDefined(),
                (reason) => expect(reason).toBeUndefined());
        });

        it('Sollte einen Fehler werfen, wenn Node-Version < 8.0.0', () => {
            addDependencyToPackageJson(appTree, 'lux-components', '1.7.13');
            Object.defineProperty(process.versions, 'node', {
                get: () => '7.9.9'
            });

            callRule(checkVersions(), observableOf(appTree), context).subscribe(
                (success) => expect(success).toBeUndefined(),
                (reason) => expect(reason.toString()).toContain('LUX benötigt allerdings die Version 8.0.0.'));
        });

        it('Sollte keinen Fehler werfen, wenn Node-Version >= 8.0.0', () => {
            addDependencyToPackageJson(appTree, 'lux-components', '1.7.13');
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
            addDependencyToPackageJson(appTree, 'lux-components', '1.7.13');
        });

        // Muss über async laufen, da sonst eine package.json geprüft wird, welche bereits wieder resettet wurde
        it('Sollte die Dependency "lux-components" auf Version 1.7.14 setzen', (async (done) => {
            callRule(updatePackageJson(), observableOf(appTree), context).subscribe(
                () => {
                    expect(appTree.readContent('/package.json'))
                        .toContain('"lux-components": "1.7.14"');
                    done();
                },
                (reason) => expect(reason).toBeUndefined());
        }));
    });


    describe('[Rule] updateModulesForCommonModule', () => {

        // Muss über async laufen, da sonst eine package.json geprüft wird, welche bereits wieder resettet wurde
        it('Sollte das "LuxCommonModule" in den Imports des Moduls ergänzen, wenn die component.html die richtigen Tags nutzt', (async (done) => {

            let moduleContent = appTree.readContent('/projects/bar/src/app/app.module.ts');

            expect(moduleContent.indexOf('LuxCommonModule')).toBe(-1);

            appTree.overwrite('/projects/bar/src/app/app.component.html', '<lux-badge></lux-badge>');

            callRule(updateModulesForCommonModule({path: '/projects/bar/'}), observableOf(appTree), context).subscribe(
                () => {
                    moduleContent = appTree.readContent('/projects/bar/src/app/app.module.ts');

                    expect(moduleContent.indexOf('LuxCommonModule')).not.toBe(-1);
                    expect(moduleContent).toContain('import { LuxCommonModule } from \'lux-components\';');

                    done();
                },
                (reason) => expect(reason).toBeUndefined());
        }));

        it('Sollte das "LuxCommonModule" in den Imports des Moduls ergänzen, wenn die component.ts die richtigen Tags nutzt', (async (done) => {

            let moduleContent = appTree.readContent('/projects/bar/src/app/app.module.ts');

            expect(moduleContent.indexOf('LuxCommonModule')).toBe(-1);

            appTree.overwrite('/projects/bar/src/app/app.component.ts', 'LuxTableComponent');

            callRule(updateModulesForCommonModule({path: '/projects/bar/'}), observableOf(appTree), context).subscribe(
                () => {
                    moduleContent = appTree.readContent('/projects/bar/src/app/app.module.ts');

                    expect(moduleContent.indexOf('LuxCommonModule')).not.toBe(-1);
                    expect(moduleContent).toContain('import { LuxCommonModule } from \'lux-components\';');

                    done();
                },
                (reason) => expect(reason).toBeUndefined());
        }));

        it('Sollte das "LuxCommonModule" NICHT in den Imports des Moduls ergänzen, wenn es bereits vorhanden ist', (async (done) => {
            appTree.overwrite('/projects/bar/src/app/app.module.ts', `
                import { LuxCommonModule } from 'lux-components';
                    import { NgModule } from '@angular/core';
                    
                    @NgModule({
                      imports: [
                        LuxCommonModule
                      ],
                      entryComponents: [],
                      declarations: [],
                      exports: [],
                      providers: []
                    })
                    export class AppModule {
                }
            `);

            let moduleContent = appTree.readContent('/projects/bar/src/app/app.module.ts');
            // es müssten 2 matches sein, einmal für den Import und einmal im imports-Array
            let matches = moduleContent.match(/LuxCommonModule/gm);
            matches = matches ? matches : [];

            expect(matches.length).toBe(2);

            callRule(updateModulesForCommonModule({path: '/projects/bar/'}), observableOf(appTree), context).subscribe(
                () => {
                    moduleContent = appTree.readContent('/projects/bar/src/app/app.module.ts');

                    matches = moduleContent.match(/LuxCommonModule/gm);
                    matches = matches ? matches : [];

                    expect(matches.length).toBe(2);

                    done();
                },
                (reason) => expect(reason).toBeUndefined());
        }));

        it('Sollte das "LuxCommonModule" NICHT in den Imports des Moduls ergänzen, wenn weder component.ts noch component.html die richtigen Tags nutzt', (async (done) => {

            let moduleContent = appTree.readContent('/projects/bar/src/app/app.module.ts');

            expect(moduleContent.indexOf('LuxCommonModule')).toBe(-1);


            callRule(updateModulesForCommonModule({path: '/projects/bar/'}), observableOf(appTree), context).subscribe(
                () => {
                    moduleContent = appTree.readContent('/projects/bar/src/app/app.module.ts');

                    expect(moduleContent.indexOf('LuxCommonModule')).toBe(-1);

                    done();
                },
                (reason) => expect(reason).toBeUndefined());
        }));
    });

    describe('[Rule] updateModulesForErrorModule', () => {

        // Muss über async laufen, da sonst eine package.json geprüft wird, welche bereits wieder resettet wurde
        it('Sollte das "LuxErrorModule" in den Imports des Moduls ergänzen, wenn die component.ts die richtigen Tags nutzt', (async (done) => {

            let moduleContent = appTree.readContent('/projects/bar/src/app/app.module.ts');

            expect(moduleContent.indexOf('LuxErrorModule')).toBe(-1);

            appTree.overwrite('/projects/bar/src/app/app.component.ts', 'LuxErrorService');

            callRule(updateModulesForErrorModule({path: '/projects/bar/'}), observableOf(appTree), context).subscribe(
                () => {
                    moduleContent = appTree.readContent('/projects/bar/src/app/app.module.ts');

                    expect(moduleContent.indexOf('LuxErrorModule')).not.toBe(-1);
                    expect(moduleContent).toContain('import { LuxErrorModule } from \'lux-components\';');

                    done();
                },
                (reason) => expect(reason).toBeUndefined());
        }));

        it('Sollte das "LuxErrorModule" NICHT in den Imports des Moduls ergänzen, wenn es bereits vorhanden ist', (async (done) => {
            appTree.overwrite('/projects/bar/src/app/app.module.ts', `
                import { LuxErrorModule } from 'lux-components';
                    import { NgModule } from '@angular/core';
                    
                    @NgModule({
                      imports: [
                        LuxErrorModule
                      ],
                      entryComponents: [],
                      declarations: [],
                      exports: [],
                      providers: []
                    })
                    export class AppModule {
                }
            `);

            let moduleContent = appTree.readContent('/projects/bar/src/app/app.module.ts');
            // es müssten 2 matches sein, einmal für den Import und einmal im imports-Array
            let matches = moduleContent.match(/LuxErrorModule/gm);
            matches = matches ? matches : [];

            expect(matches.length).toBe(2);

            callRule(updateModulesForErrorModule({path: '/projects/bar/'}), observableOf(appTree), context).subscribe(
                () => {
                    moduleContent = appTree.readContent('/projects/bar/src/app/app.module.ts');

                    matches = moduleContent.match(/LuxErrorModule/gm);
                    matches = matches ? matches : [];

                    expect(matches.length).toBe(2);

                    done();
                },
                (reason) => expect(reason).toBeUndefined());
        }));

        it('Sollte das "LuxErrorModule" NICHT in den Imports des Moduls ergänzen, wenn component.ts nicht die richtigen Tags nutzt', (async (done) => {

            let moduleContent = appTree.readContent('/projects/bar/src/app/app.module.ts');

            expect(moduleContent.indexOf('LuxErrorModule')).toBe(-1);


            callRule(updateModulesForErrorModule({path: '/projects/bar/'}), observableOf(appTree), context).subscribe(
                () => {
                    moduleContent = appTree.readContent('/projects/bar/src/app/app.module.ts');

                    expect(moduleContent.indexOf('LuxErrorModule')).toBe(-1);

                    done();
                },
                (reason) => expect(reason).toBeUndefined());
        }));
    });
});
