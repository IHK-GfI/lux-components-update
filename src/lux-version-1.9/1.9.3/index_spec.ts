import {SchematicTestRunner, UnitTestTree} from '@angular-devkit/schematics/testing';
import * as path from 'path';
import {of as observableOf} from 'rxjs';
import {addDependencyToPackageJson, appOptions, workspaceOptions} from '../../utility/test-helper';
import {callRule, SchematicContext, SchematicsException, Tree} from '@angular-devkit/schematics';
import {checkVersions, updateAppModuleTs, updatePackageJson} from './index';
import {UtilConfig} from '../../utility/util';

const collectionPath = path.join(__dirname, '../../collection.json');

describe('lux-version-1.9.3', () => {
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
        const schematic = runner.engine.createSchematic('lux-version-1.9.3', collection);
        context = runner.engine.createContext(schematic);
    });

    describe('[Rule] setupProject', () => {
        it('Sollte Fehler werfen, wenn ein empty Tree genutzt wird', () => {
            expect(() => runner.runSchematic('lux-version-1.9.3', {}, Tree.empty()))
                .toThrowError(SchematicsException);
        });

        it('Sollte Fehler werfen, wenn keine Option "project" gesetzt ist', () => {
            try {
                runner.runSchematic('lux-version-1.9.3', {}, appTree);
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
                (reason) => expect(reason.toString()).toContain('Dieser Generator benötigt allerdings die (neuere) Version 1.9.2.'));
        });

        it('Sollte einen Fehler werfen, wenn Version > n - 1', () => {
            addDependencyToPackageJson(appTree, '@ihk-gfi/lux-components', '1.9.3');

            callRule(checkVersions(), observableOf(appTree), context).subscribe(
                (success) => expect(success).toBeUndefined(),
                (reason) => expect(reason.toString()).toContain('Dieser Generator benötigt allerdings die (ältere) Version 1.9.2.'));
        });

        it('Sollte keinen Fehler werfen, wenn Version === n - 1', () => {
            addDependencyToPackageJson(appTree, '@ihk-gfi/lux-components', '1.9.2');
            Object.defineProperty(process.versions, 'node', {
                get: () => '10.16.3'
            });

            callRule(checkVersions(), observableOf(appTree), context).subscribe(
                (success) => expect(success).toBeDefined(),
                (reason) => expect(reason).toBeUndefined());
        });

        it('Sollte einen Fehler werfen, wenn Node-Version < 10.16.3', () => {
            addDependencyToPackageJson(appTree, '@ihk-gfi/lux-components', '1.9.2');
            Object.defineProperty(process.versions, 'node', {
                get: () => '7.9.9'
            });

            callRule(checkVersions(), observableOf(appTree), context).subscribe(
                (success) => expect(success).toBeUndefined(),
                (reason) => expect(reason.toString()).toContain('LUX benötigt allerdings die Version 10.16.3.'));
        });

        it('Sollte keinen Fehler werfen, wenn Node-Version >= 10.16.3', () => {
            addDependencyToPackageJson(appTree, '@ihk-gfi/lux-components', '1.9.2');
            Object.defineProperty(process.versions, 'node', {
                get: () => '10.16.3'
            });
            callRule(checkVersions(), observableOf(appTree), context).subscribe(
                (success) => expect(success).toBeDefined(),
                (reason) => expect(reason).toBeUndefined());
        });
    });

    describe('[Rule] updatePackageJson', () => {

        beforeEach(() => {
            addDependencyToPackageJson(appTree, '@ihk-gfi/lux-components', '1.9.3');
        });

        // Muss über async laufen, da sonst eine package.json geprüft wird, welche bereits wieder resettet wurde
        it('Sollte die Dependency "lux-components" auf Version 1.9.3 setzen', (async (done) => {
            callRule(updatePackageJson(), observableOf(appTree), context).subscribe(
                () => {
                    expect(appTree.readContent('/package.json'))
                        .toContain('"@ihk-gfi/lux-components": "1.9.3"');
                    done();
                },
                (reason) => expect(reason).toBeUndefined());
        }));
    });

    describe('[Rule] updateAppModuleTs', () => {

        it('Sollte mehrzeiligen providers-Abschnitt korrekt behandeln', (async (done) => {
            const path = '/projects/updateAppModuleTs/src/app/';
            const fileName = 'app.module.ts';
            const fileContent = `
import { NgModule } from '@angular/core';
import { FlexLayoutModule } from '@angular/flex-layout';

@NgModule({
  declarations: [AppComponent],
  imports: [
    BrowserModule,
  ],
  entryComponents: [],
  providers: [
    LuxAppFooterButtonService,
    LuxAppFooterLinkService
  ],
  bootstrap: [AppComponent]
})
export class AppModule {}
            `;

            appTree.create(path + fileName, fileContent);

            callRule(updateAppModuleTs({path: path}), observableOf(appTree), context).subscribe(
                () => {
                    const appModuleTsUpdated = appTree.readContent(path + fileName);
                    expect(appModuleTsUpdated).toContain('registerLocaleData(localeDE, localeDeExtra);');
                    expect(appModuleTsUpdated).toContain('{ provide: LOCALE_ID, useValue: \'de-DE\' }');
                    done();
                },
                (reason) => expect(reason).toBeUndefined());
        }));

        it('Sollte einzeiligen providers-Abschnitt korrekt behandeln', (async (done) => {
            const path = '/projects/updateAppModuleTs/src/app/';
            const fileName = 'app.module.ts';
            const fileContent = `
import { NgModule } from '@angular/core';
import { FlexLayoutModule } from '@angular/flex-layout';

@NgModule({
  declarations: [AppComponent],
  imports: [
    BrowserModule,
  ],
  entryComponents: [],
  providers: [LuxAppFooterButtonService, LuxAppFooterLinkService],
  bootstrap: [AppComponent]
})
export class AppModule {}
            `;

            appTree.create(path + fileName, fileContent);

            callRule(updateAppModuleTs({path: path}), observableOf(appTree), context).subscribe(
                () => {
                    const appModuleTsUpdated = appTree.readContent(path + fileName);
                    expect(appModuleTsUpdated).toContain('registerLocaleData(localeDE, localeDeExtra);');
                    expect(appModuleTsUpdated).toContain('providers: [{ provide: LOCALE_ID, useValue: \'de-DE\' }, LuxAppFooterButtonService, LuxAppFooterLinkService],');
                    done();
                },
                (reason) => expect(reason).toBeUndefined());
        }));


        it('Sollte leeren providers-Abschnitt korrekt behandeln', (async (done) => {
            const path = '/projects/updateAppModuleTs/src/app/';
            const fileName = 'app.module.ts';
            const fileContent = `
import { NgModule } from '@angular/core';
import { FlexLayoutModule } from '@angular/flex-layout';

@NgModule({
  declarations: [AppComponent],
  imports: [
    BrowserModule,
  ],
  entryComponents: [],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule {}
            `;

            appTree.create(path + fileName, fileContent);

            callRule(updateAppModuleTs({path: path}), observableOf(appTree), context).subscribe(
                () => {
                    const appModuleTsUpdated = appTree.readContent(path + fileName);
                    expect(appModuleTsUpdated).toContain('registerLocaleData(localeDE, localeDeExtra);');
                    expect(appModuleTsUpdated).toContain('providers: [{ provide: LOCALE_ID, useValue: \'de-DE\' }]');
                    done();
                },
                (reason) => expect(reason).toBeUndefined());
        }));

    });

});
