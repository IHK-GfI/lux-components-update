import { SchematicTestRunner, UnitTestTree } from '@angular-devkit/schematics/testing';
import * as path from 'path';
import { of as observableOf } from 'rxjs';
import { addDependencyToPackageJson, appOptions, workspaceOptions } from '../../utility/test-helper';
import { callRule, SchematicContext, SchematicsException, Tree } from '@angular-devkit/schematics';
import { checkVersions, updatePackageJson } from './index';
import { UtilConfig } from '../../utility/util';

const collectionPath = path.join(__dirname, '../../collection.json');

describe('lux-version-1.8.5', () => {
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
        const schematic = runner.engine.createSchematic('lux-version-1.8.5', collection);
        context = runner.engine.createContext(schematic);
    });

    describe('[Rule] setupProject', () => {
        it('Sollte Fehler werfen, wenn ein empty Tree genutzt wird', () => {
            expect(() => runner.runSchematic('lux-version-1.8.5', {}, Tree.empty()))
                .toThrowError(SchematicsException);
        });

        it('Sollte Fehler werfen, wenn keine Option "project" gesetzt ist', () => {
            try {
                runner.runSchematic('lux-version-1.8.5', {}, appTree);
            } catch (ex) {
                expect(ex.toString()).toContain('Option "project" wird benötigt.');
            }
        });
    });

    describe('[Rule] checkVersions', () => {

        it('Sollte einen Fehler werfen, wenn Version < n - 1', () => {
            addDependencyToPackageJson(appTree, '@ihk-gfi/lux-components', '1.7.8');

            callRule(checkVersions(), observableOf(appTree), context).subscribe(
                (success) => expect(success).toBeUndefined(),
                (reason) => expect(reason.toString()).toContain('Dieser Generator benötigt allerdings die (neuere) Version 1.8.4.'));
        });

        it('Sollte einen Fehler werfen, wenn Version > n - 1', () => {
            addDependencyToPackageJson(appTree, '@ihk-gfi/lux-components', '1.8.5');

            callRule(checkVersions(), observableOf(appTree), context).subscribe(
                (success) => expect(success).toBeUndefined(),
                (reason) => expect(reason.toString()).toContain('Dieser Generator benötigt allerdings die (ältere) Version 1.8.4.'));
        });

        it('Sollte keinen Fehler werfen, wenn Version === n - 1', () => {
            addDependencyToPackageJson(appTree, '@ihk-gfi/lux-components', '1.8.4');
            Object.defineProperty(process.versions, 'node', {
                get: () => '10.0.0'
            });

            callRule(checkVersions(), observableOf(appTree), context).subscribe(
                (success) => expect(success).toBeDefined(),
                (reason) => expect(reason).toBeUndefined());
        });

        it('Sollte einen Fehler werfen, wenn Node-Version < 10.0.0', () => {
            addDependencyToPackageJson(appTree, '@ihk-gfi/lux-components', '1.8.4');
            Object.defineProperty(process.versions, 'node', {
                get: () => '7.9.9'
            });

            callRule(checkVersions(), observableOf(appTree), context).subscribe(
                (success) => expect(success).toBeUndefined(),
                (reason) => expect(reason.toString()).toContain('LUX benötigt allerdings die Version 10.0.0.'));
        });

        it('Sollte keinen Fehler werfen, wenn Node-Version >= 10.0.0', () => {
            addDependencyToPackageJson(appTree, '@ihk-gfi/lux-components', '1.8.4');
            Object.defineProperty(process.versions, 'node', {
                get: () => '10.0.0'
            });
            callRule(checkVersions(), observableOf(appTree), context).subscribe(
                (success) => expect(success).toBeDefined(),
                (reason) => expect(reason).toBeUndefined());
        });
    });

    describe('[Rule] updatePackageJson', () => {

        beforeEach(() => {
            addDependencyToPackageJson(appTree, '@ihk-gfi/lux-components', '1.8.5');
        });

        // Muss über async laufen, da sonst eine package.json geprüft wird, welche bereits wieder resettet wurde
        it('Sollte die Dependency "lux-components" auf Version 1.8.5 setzen', (async (done) => {
            callRule(updatePackageJson(), observableOf(appTree), context).subscribe(
                () => {
                    expect(appTree.readContent('/package.json'))
                        .toContain('"@ihk-gfi/lux-components": "1.8.5"');
                    done();
                },
                (reason) => expect(reason).toBeUndefined());
        }));
    });

});
