import { SchematicTestRunner, UnitTestTree } from '@angular-devkit/schematics/testing';
import * as path from 'path';
import { of as observableOf } from 'rxjs';
import { addDependencyToPackageJson, appOptions, workspaceOptions } from '../../utility/test-helper';
import { callRule, SchematicContext, SchematicsException, Tree } from '@angular-devkit/schematics';
import {
    checkVersions,
    updateLuxAppFooterButtonInfoConstructorParams,
    updateLuxStylesScss,
    updatePackageJson
} from './index';
import { UtilConfig } from '../../utility/util';

const collectionPath = path.join(__dirname, '../../collection.json');

describe('lux-version-1.7.10', () => {
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
        const schematic = runner.engine.createSchematic('lux-version-1.7.10', collection);
        context = runner.engine.createContext(schematic);
    });

    describe('[Rule] setupProject', () => {
        it('Sollte Fehler werfen, wenn ein empty Tree genutzt wird', () => {
            expect(() => runner.runSchematic('lux-version-1.7.10', {}, Tree.empty()))
                .toThrowError(SchematicsException);
        });

        it('Sollte Fehler werfen, wenn keine Option "project" gesetzt ist', () => {
            try {
                runner.runSchematic('lux-version-1.7.10', {}, appTree);
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
                (reason) => expect(reason.toString()).toContain('Dieser Generator benötigt allerdings die (neuere) Version 1.7.9.'));
        });

        it('Sollte einen Fehler werfen, wenn Version > n - 1', () => {
            addDependencyToPackageJson(appTree, 'lux-components', '1.7.10');

            callRule(checkVersions(), observableOf(appTree), context).subscribe(
                (success) => expect(success).toBeUndefined(),
                (reason) => expect(reason.toString()).toContain('Dieser Generator benötigt allerdings die (ältere) Version 1.7.9.'));
        });

        it('Sollte keinen Fehler werfen, wenn Version === n - 1', () => {
            addDependencyToPackageJson(appTree, 'lux-components', '1.7.9');
            callRule(checkVersions(), observableOf(appTree), context).subscribe(
                (success) => expect(success).toBeDefined(),
                (reason) => expect(reason).toBeUndefined());
        });

        it('Sollte einen Fehler werfen, wenn Node-Version < 8.0.0', () => {
            addDependencyToPackageJson(appTree, 'lux-components', '1.7.9');
            Object.defineProperty(process.versions, 'node', {
                get: () => '7.9.9'
            });

            callRule(checkVersions(), observableOf(appTree), context).subscribe(
                (success) => expect(success).toBeUndefined(),
                (reason) => expect(reason.toString()).toContain('LUX benötigt allerdings die Version 8.0.0.'));
        });

        it('Sollte keinen Fehler werfen, wenn Node-Version >= 8.0.0', () => {
            addDependencyToPackageJson(appTree, 'lux-components', '1.7.9');
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
            addDependencyToPackageJson(appTree, 'lux-components', '1.7.9');
        });

        // Muss über async laufen, da sonst eine package.json geprüft wird, welche bereits wieder resettet wurde
        it('Sollte die Dependency "lux-components" auf Version 1.7.10 setzen', (async (done) => {
            callRule(updatePackageJson(), observableOf(appTree), context).subscribe(
                () => {
                    expect(appTree.readContent('/package.json'))
                        .toContain('"lux-components": "1.7.10"');
                    done();
                },
                (reason) => expect(reason).toBeUndefined());
        }));
    });

    describe('[Rule] updateLUXStylesSCSS', () => {

        it('Sollte die Datei luxstyles.scss ersetzen', (async (done) => {
            appTree.create('/projects/bar/src/theming/luxstyles.scss', 'Leer');

            expect(appTree.readContent('/projects/bar/src/theming/luxstyles.scss')).toContain('Leer');
            // Änderungen durchführen
            callRule(updateLuxStylesScss({path: '/projects/bar'}), observableOf(appTree), context)
                .subscribe(() => {
                    // Nachbedingungen prüfen
                    expect(appTree.readContent('/projects/bar/src/theming/luxstyles.scss')).toContain('Version 1.8');
                    done();
                }, (reason) => expect(reason).toBeUndefined())
        }));
    });

    describe('[Rule] updateLuxAppFooterButtonInfoConstructorParams', () => {

        beforeEach(() => {
        });

        it('Sollte die Reihenfolge korrekt anpassen', (async (done) => {
            let appComponentContent = appTree.readContent('/projects/bar/src/app/app.component.ts');
            appComponentContent = appComponentContent.replace(`title = 'bar';`, `
           const test0 = new LuxAppFooterButtonInfo('label1', 'primary', true, 'cmd1', false, 'fa-check');
           const test1 = new LuxAppFooterButtonInfo('label2', 'primary', false, 'cmd2', false, 'fa-check');
           const test2 = new LuxAppFooterButtonInfo('label3', 'primary', true, 'cmd3', false, 'fa-check');
           const test3 = new LuxAppFooterButtonInfo(
               'label4',
               'primary',
               false,
               'cmd4',
               true,
               'fa-check',
               1, 
               true, 
               false
            );
            const test4 = new LuxAppFooterButtonInfo('label(5)', 'primary', true, 'cmd5', false, 'fa-check');`);

            appTree.overwrite('/projects/bar/src/app/app.component.ts', appComponentContent);
            callRule(updateLuxAppFooterButtonInfoConstructorParams({path: '/projects/bar/'}), observableOf(appTree), context).subscribe(() => {
                appComponentContent = appTree.readContent('/projects/bar/src/app/app.component.ts');
                expect(appComponentContent.indexOf(`new LuxAppFooterButtonInfo('label1', 'cmd1', 'primary', true, false, 'fa-check')`)).toBeGreaterThan(-1);
                expect(appComponentContent.indexOf(`new LuxAppFooterButtonInfo('label2', 'cmd2', 'primary', false, false, 'fa-check')`)).toBeGreaterThan(-1);
                expect(appComponentContent.indexOf(`new LuxAppFooterButtonInfo('label3', 'cmd3', 'primary', true, false, 'fa-check')`)).toBeGreaterThan(-1);
                expect(appComponentContent.indexOf(`new LuxAppFooterButtonInfo('label4', 'cmd4', 'primary', false, true, 'fa-check', 1, true, false)`)).toBeGreaterThan(-1);
                expect(appComponentContent.indexOf(`new LuxAppFooterButtonInfo('label(5)', 'cmd5', 'primary', true, false, 'fa-check');`)).toBeGreaterThan(-1);
                done();
            }, (reason) => expect(reason).toBeUndefined())
        }));

        it('Sollte die Reihenfolge nicht erneut anpassen', (async (done) => {
            let appComponentContent = appTree.readContent('/projects/bar/src/app/app.component.ts');
            appComponentContent = appComponentContent.replace(`title = 'bar';`, `
           const test0 = new LuxAppFooterButtonInfo('label1', 'cmd1', 'primary', true, false, 'fa-check');
           const test1 = new LuxAppFooterButtonInfo('label2', 'cmd2', 'primary', false, false, 'fa-check');
           const test2 = new LuxAppFooterButtonInfo('label3', 'cmd3', 'primary', true, false, 'fa-check');`);

            appTree.overwrite('/projects/bar/src/app/app.component.ts', appComponentContent);
            callRule(updateLuxAppFooterButtonInfoConstructorParams({path: '/projects/bar/'}), observableOf(appTree), context).subscribe(() => {
                appComponentContent = appTree.readContent('/projects/bar/src/app/app.component.ts');
                expect(appComponentContent.indexOf(`new LuxAppFooterButtonInfo('label1', 'cmd1', 'primary', true, false, 'fa-check')`)).toBeGreaterThan(-1);
                expect(appComponentContent.indexOf(`new LuxAppFooterButtonInfo('label2', 'cmd2', 'primary', false, false, 'fa-check')`)).toBeGreaterThan(-1);
                expect(appComponentContent.indexOf(`new LuxAppFooterButtonInfo('label3', 'cmd3', 'primary', true, false, 'fa-check')`)).toBeGreaterThan(-1);
                done();
            }, (reason) => expect(reason).toBeUndefined())
        }));
    });
});
