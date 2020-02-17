import { SchematicTestRunner, UnitTestTree } from '@angular-devkit/schematics/testing';
import * as path from 'path';
import { of as observableOf } from 'rxjs';
import { addDependencyToPackageJson, appOptions, workspaceOptions } from '../../utility/test-helper';
import { callRule, SchematicContext, SchematicsException, Tree } from '@angular-devkit/schematics';
import { checkVersions, renameLuxButtonProperty, renameLuxCardContentExpanded, updatePackageJson } from './index';
import { UtilConfig } from '../../utility/util';

const collectionPath = path.join(__dirname, '../../collection.json');

describe('lux-version-1.7.11', () => {
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
            expect(() => runner.runSchematic('lux-version-1.7.11', {}, Tree.empty()))
                .toThrowError(SchematicsException);
        });

        it('Sollte Fehler werfen, wenn keine Option "project" gesetzt ist', () => {
            try {
                runner.runSchematic('lux-version-1.7.11', {}, appTree);
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
                (reason) => expect(reason.toString()).toContain('Dieser Generator benötigt allerdings die (neuere) Version 1.7.10.'));
        });

        it('Sollte einen Fehler werfen, wenn Version > n - 1', () => {
            addDependencyToPackageJson(appTree, 'lux-components', '1.7.11');

            callRule(checkVersions(), observableOf(appTree), context).subscribe(
                (success) => expect(success).toBeUndefined(),
                (reason) => expect(reason.toString()).toContain('Dieser Generator benötigt allerdings die (ältere) Version 1.7.10.'));
        });

        it('Sollte keinen Fehler werfen, wenn Version === n - 1', () => {
            addDependencyToPackageJson(appTree, 'lux-components', '1.7.10');
            callRule(checkVersions(), observableOf(appTree), context).subscribe(
                (success) => expect(success).toBeDefined(),
                (reason) => expect(reason).toBeUndefined());
        });

        it('Sollte einen Fehler werfen, wenn Node-Version < 8.0.0', () => {
            addDependencyToPackageJson(appTree, 'lux-components', '1.7.10');
            Object.defineProperty(process.versions, 'node', {
                get: () => '7.9.9'
            });

            callRule(checkVersions(), observableOf(appTree), context).subscribe(
                (success) => expect(success).toBeUndefined(),
                (reason) => expect(reason.toString()).toContain('LUX benötigt allerdings die Version 8.0.0.'));
        });

        it('Sollte keinen Fehler werfen, wenn Node-Version >= 8.0.0', () => {
            addDependencyToPackageJson(appTree, 'lux-components', '1.7.10');
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
            addDependencyToPackageJson(appTree, 'lux-components', '1.7.10');
        });

        // Muss über async laufen, da sonst eine package.json geprüft wird, welche bereits wieder resettet wurde
        it('Sollte die Dependency "lux-components" auf Version 1.7.11 setzen', (async (done) => {
            callRule(updatePackageJson(), observableOf(appTree), context).subscribe(
                () => {
                    expect(appTree.readContent('/package.json'))
                        .toContain('"lux-components": "1.7.11"');
                    done();
                },
                (reason) => expect(reason).toBeUndefined());
        }));
    });

    describe('[Rule] renameLuxButtonProperty', () => {

        beforeEach(() => {
            addDependencyToPackageJson(appTree, 'lux-components', '1.7.10');
        });

        it('Sollte die Properties umbenennen', (async (done) => {
            let appComponentContent = '<lux-button [luxRoundButton]="false"></lux-button>' +
                '<lux-button [luxRoundButton]="true"></lux-button>';

            appTree.overwrite('/projects/bar/src/app/app.component.html', appComponentContent);
            callRule(renameLuxButtonProperty({path: '/projects/bar/'}), observableOf(appTree), context).subscribe(() => {
                appComponentContent = appTree.readContent('/projects/bar/src/app/app.component.html');
                expect(appComponentContent.indexOf(`luxRoundButton`)).toBe(-1);
                expect(appComponentContent.indexOf(`luxRounded`)).toBeGreaterThan(-1);
                done();
            }, (reason) => expect(reason).toBeUndefined())
        }));
    });

    describe('[Rule] renameLuxCardContentExpanded', () => {

        beforeEach(() => {
            addDependencyToPackageJson(appTree, 'lux-components', '1.7.10');
        });

        it('Sollte die Tags umbenennen', (async (done) => {
            let appComponentContent = '<lux-card>' +
                '<lux-card-content>Hallo!</lux-card-content>' +
                '<lux-card-content-expanded>Holla!</lux-card-content-expanded>' +
                '</lux-card>' +
                '' +
                '<lux-card>' +
                '<lux-card-content>Hallo 2!</lux-card-content><lux-card-content-expanded>Holla 2!</lux-card-content-expanded>' +
                '</lux-card>';

            appTree.overwrite('/projects/bar/src/app/app.component.html', appComponentContent);
            expect(appTree.readContent('/projects/bar/src/app/app.component.html')).toContain('lux-card-content-expanded');

            callRule(renameLuxCardContentExpanded({path: '/projects/bar/'}), observableOf(appTree), context).subscribe(() => {
                appComponentContent = appTree.readContent('/projects/bar/src/app/app.component.html');
                expect(appTree.readContent('/projects/bar/src/app/app.component.html')).toContain('lux-card-content-switched');
                expect(appTree.readContent('/projects/bar/src/app/app.component.html')).not.toContain('lux-card-content-expanded');

                done();
            }, (reason) => expect(reason).toBeUndefined())
        }));
    });
});
