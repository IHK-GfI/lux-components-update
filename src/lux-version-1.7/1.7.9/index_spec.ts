import { callRule, SchematicContext, SchematicsException, Tree } from '@angular-devkit/schematics';
import { SchematicTestRunner, UnitTestTree } from '@angular-devkit/schematics/testing';
import * as path from 'path';
import { checkVersions, updatePackageJson, updatePropertyNames, updateStylesSCSS } from './index';
import { of as observableOf } from 'rxjs';
import { addDependencyToPackageJson, appOptions, createMockContext, workspaceOptions } from '../../utility/test-helper';

const collectionPath = path.join(__dirname, '../../collection.json');

describe('lux-version-1.7.9', () => {
    let appTree: UnitTestTree;
    let runner: SchematicTestRunner;

    beforeEach(() => {
        runner = new SchematicTestRunner('schematics', collectionPath);

        appTree = runner.runExternalSchematic(
            '@schematics/angular', 'workspace', workspaceOptions);
        appTree = runner.runExternalSchematic(
            '@schematics/angular', 'application', appOptions, appTree);
    });

    describe('[Rule] setupProject', () => {
        it('Sollte Fehler werfen, wenn ein empty Tree genutzt wird', () => {
            expect(() => runner.runSchematic('lux-version-1.7.9', {}, Tree.empty()))
                .toThrowError(SchematicsException);
        });

        it('Sollte Fehler werfen, wenn keine Option "project" gesetzt ist', () => {
            try {
                runner.runSchematic('lux-version-1.7.9', {}, appTree);
            } catch (ex) {
                expect(ex.toString()).toContain('Option "project" wird benötigt.');
            }
        });
    });

    describe('[Rule] checkVersions', () => {

        let context: SchematicContext;

        beforeEach(() => {
            context = createMockContext();
        });

        it('Sollte einen Fehler werfen, wenn Version !== n - 1', () => {
            addDependencyToPackageJson(appTree, 'lux-components', '1.7.7');

            callRule(checkVersions(), observableOf(appTree), context).toPromise()
                .then((success) => {
                    expect(success).toBeUndefined();
                }, (reason) => {
                    expect(reason.toString()).toContain('Dieser Generator benötigt allerdings die (neuere) Version 1.7.8.');
                });
        });

        it('Sollte keinen Fehler werfen, wenn Version === n - 1', () => {
            addDependencyToPackageJson(appTree, 'lux-components', '1.7.8');
            callRule(checkVersions(), observableOf(appTree), context).toPromise()
                .then((success) => {
                    expect(success).toBeDefined();
                }, (reason) => {
                    expect(reason).toBeUndefined();
                });
        });

        it('Sollte einen Fehler werfen, wenn Node-Version < 8.0.0', () => {
            addDependencyToPackageJson(appTree, 'lux-components', '1.7.8');
            Object.defineProperty(process.versions, 'node', {
                get: () => '7.9.9'
            });
            callRule(checkVersions(), observableOf(appTree), context).toPromise()
                .then((success) => {
                    expect(success).toBeUndefined();
                }, (reason) => {
                    expect(reason.toString()).toContain('LUX benötigt allerdings die Version 8.0.0.');
                });
        });

        it('Sollte keinen Fehler werfen, wenn Node-Version >= 8.0.0', () => {
            addDependencyToPackageJson(appTree, 'lux-components', '1.7.8');
            Object.defineProperty(process.versions, 'node', {
                get: () => '8.0.0'
            });
            callRule(checkVersions(), observableOf(appTree), context).toPromise()
                .then((success) => {
                    expect(success).toBeDefined();
                }, (reason) => {
                    expect(reason).toBeUndefined();
                });
        });
    });

    describe('[Rule] updatePackageJson', () => {
        let context: SchematicContext;

        beforeEach(() => {
            context = createMockContext();
            addDependencyToPackageJson(appTree, 'lux-components', '1.7.8');
            addDependencyToPackageJson(appTree, 'font-awesome', '4.7.0');
        });

        it('Sollte fontawesome-free v.5.7.2 als Dependency hinzufügen', () => {
            // Vorbedingungen prüfen
            expect(appTree.readContent('/package.json')).not.toContain('@fortawesome/fontawesome-free');

            // Änderungen durchführen
            callRule(updatePackageJson(), observableOf(appTree), context).toPromise()
                .then(() => {
                    // Nachbedingungen prüfen
                    expect(appTree.readContent('/package.json')).toContain('@fortawesome/fontawesome-free');
                }, (reason) => {
                    expect(reason).toBeUndefined();
                });
        });

        it('Sollte font-awesome entfernen', () => {
            // Vorbedingungen prüfen
            expect(appTree.readContent('/package.json')).toContain('font-awesome');

            // Änderungen durchführen
            callRule(updatePackageJson(), observableOf(appTree), context).toPromise()
                .then(() => {
                    // Nachbedingungen prüfen
                    expect(appTree.readContent('/package.json')).not.toContain('font-awesome');
                }, (reason) => {
                    expect(reason).toBeUndefined();
                });
        });
    });

    describe('[Rule] updateStylesSCSS', () => {
        let context: SchematicContext;

        beforeEach(() => {
            context = createMockContext();
            addDependencyToPackageJson(appTree, 'lux-components', '1.7.8');
            addDependencyToPackageJson(appTree, 'font-awesome', '4.7.0');

            appTree.overwrite('/projects/bar/src/styles.scss', '@import "~font-awesome/css/font-awesome.css";');
        });

        it('Sollte den alten font-awesome import entfernen und die neuen imports hinzufügen', () => {
            // Vorbedingungen prüfen
            expect(appTree.readContent('/projects/bar/src/styles.scss')).toContain('font-awesome');
            // Änderungen durchführen
            callRule(updateStylesSCSS(), observableOf(appTree), context).toPromise()
                .then(() => {
                    // Nachbedingungen prüfen
                    const content = appTree.readContent('/projects/bar/src/styles.scss');
                    expect(content).not.toContain('font-awesome');
                    expect(content).toContain('~@fortawesome/fontawesome-free/webfonts');
                    expect(content).toContain('~@fortawesome/fontawesome-free/scss/fontawesome');
                    expect(content).toContain('~@fortawesome/fontawesome-free/scss/regular');
                    expect(content).toContain('~@fortawesome/fontawesome-free/scss/solid');
                    expect(content).toContain('~@fortawesome/fontawesome-free/scss/brands');
                }, (reason) => {
                    expect(reason).toBeUndefined();
                });
        });
    });

    describe('[Rule] updatePropertyNames', () => {
        let context: SchematicContext;

        beforeEach(() => {
            context = createMockContext();
            addDependencyToPackageJson(appTree, 'lux-components', '1.7.8');
            addDependencyToPackageJson(appTree, 'font-awesome', '4.7.0');

            appTree.overwrite('/projects/bar/src/app/app.component.html',
                '<lux-icon luxMargins="0px"></lux-icon> ' +
                '<lux-icon [luxMargins]="0px"></lux-icon>' + '<lux-icon luxMargins="0px"></lux-icon> ' +
                '<lux-icon [luxMargins]="0px"></lux-icon>');
        });

        it('Sollte Properties "luxMargins" zu "luxMargin" umbenennen', () => {
            // Vorbedingungen prüfen
            expect(appTree.readContent('/projects/bar/src/app/app.component.html')).toContain('luxMargins');
            // Änderungen durchführen
            callRule(updatePropertyNames({path: '/projects/bar/src'}), observableOf(appTree), context).toPromise()
                .then(() => {
                    // Nachbedingungen prüfen
                    expect(appTree.readContent('/projects/bar/src/app/app.component.html')).not.toContain('luxMargins');
                    expect(appTree.readContent('/projects/bar/src/app/app.component.html')).toContain('luxMargin');
                }, (reason) => {
                    expect(reason).toBeUndefined();
                });
        });
    });
});
