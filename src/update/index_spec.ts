import * as path from 'path';
import { SchematicTestRunner, UnitTestTree } from '@angular-devkit/schematics/testing';
import { callRule, SchematicContext } from '@angular-devkit/schematics';
import { of as observableOf } from 'rxjs';
import { UtilConfig } from '../utility/util';
import { appOptions, workspaceOptions } from '../utility/test-helper';
import {
  getPackageJsonDependency,
  NodeDependencyType,
  updatePackageJsonDependencyForceUpdate
} from '../utility/dependencies';
import { update, updateLocale, updatePolyfills } from './index';

const collectionPath = path.join(__dirname, '../collection.json');

describe('update', () => {
  let appTree: UnitTestTree;
  let runner: SchematicTestRunner;
  let context: SchematicContext;

  const testOptions: any = {};

  beforeEach(async () => {
    runner = new SchematicTestRunner('schematics', collectionPath);

    appTree = await runner.runExternalSchematicAsync('@schematics/angular', 'workspace', workspaceOptions).toPromise();
    appTree = await runner
      .runExternalSchematicAsync('@schematics/angular', 'application', appOptions, appTree)
      .toPromise();

    UtilConfig.defaultWaitMS = 0;

    const collection = runner.engine.createCollection(collectionPath);
    const schematic = runner.engine.createSchematic('update', collection);
    context = runner.engine.createContext(schematic);

    testOptions.project = appOptions.name;
    testOptions.path = workspaceOptions.newProjectRoot + '/' + appOptions.name;
    testOptions.verbose = true;
  });

  describe('[Rule] update', () => {
    it('Sollte einen Fehler werfen, wenn Version < n - 1', () => {
      updatePackageJsonDependencyForceUpdate(
        appTree,
        context,
        { type: NodeDependencyType.Default, version: '1.9.3', name: '@ihk-gfi/lux-components' },
        true
      );
      Object.defineProperty(process.versions, 'node', {
        get: () => '12.16.3'
      });

      callRule(update(testOptions), observableOf(appTree), context).subscribe(
        (success) => {},
        (reason) => expect(reason.toString()).toContain('wird nicht unterstützt.')
      );
    });

    it('Sollte LUX-Components 10 einrichten', async (done) => {
      appTree.overwrite(
        '/package.json',
        `
            {
              "name": "Lorem ipsum",
              "version": "0.0.32",
              "scripts": {
                "build": "tsc -p tsconfig.json",
                "test": "npm run build && jasmine src/**/*_spec.js"
              },
              "keywords": [
                "schematics",
                "lux-components"
              ],
              "dependencies": {
                "@ihk-gfi/lux-components": "1.9.5"
              }
            }
        `
      );

      callRule(update(testOptions), observableOf(appTree), context).subscribe(
        () => {
          expect(getPackageJsonDependency(appTree, '@ihk-gfi/lux-components').version).toEqual('~10.0.0');
          done();
        },
        (reason) => expect(reason).toBeUndefined()
      );
    });
  });

  describe('[Rule] updatePolyfill', () => {
    it('Sollte die polyfill.ts aktualisieren (Single Quote)', async (done) => {
      appTree.overwrite(
        testOptions.path + '/src/polyfills.ts',
        `
import 'core-js/es/symbol';
import 'core-js/es/weak-map';
import 'core-js/es/reflect';
        `
      );

      callRule(updatePolyfills(testOptions), observableOf(appTree), context).subscribe(
        (success) => {
          const content = success.read(testOptions.path + '/src/polyfills.ts')?.toString();
          expect(content).toContain("import 'core-js/es/weak-set';");
          done();
        },
        (reason) => expect(reason).toBeNull()
      );
    });

    it('Sollte die polyfill.ts aktualisieren (Double Quote)', async (done) => {
      appTree.overwrite(
        testOptions.path + '/src/polyfills.ts',
        `
import "core-js/es/symbol";
import "core-js/es/weak-map";
import "core-js/es/reflect";
        `
      );

      callRule(updatePolyfills(testOptions), observableOf(appTree), context).subscribe(
        (success) => {
          const content = success.read(testOptions.path + '/src/polyfills.ts')?.toString();
          expect(content).toContain('import "core-js/es/weak-set";');
          done();
        },
        (reason) => expect(reason).toBeNull()
      );
    });
  });

  describe('[Rule] updateLocale', () => {
    it('Sollte die Locale aktualisieren', async (done) => {
      appTree.overwrite(
        testOptions.path + '/src/app/app.module.ts',
        `
import { registerLocaleData } from '@angular/common';
import localeDE from '@angular/common/locales/de';
import localeDeExtra from '@angular/common/locales/extra/de';
import { LOCALE_ID } from '@angular/core';
import { PlaceholderComponent } from './demo/abstract/placeholder/placeholder.component';
import { RedirectComponent } from './demo/abstract/redirect/redirect.component';

registerLocaleData(localeDE, localeDeExtra);
import '@angular/common/locales/global/de';

@NgModule({
  declarations: [AppComponent, PlaceholderComponent, RedirectComponent],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    AppRoutingModule,
    HammerModule
  ],
  entryComponents: [LuxSnackbarComponent, LuxFilePreviewComponent],
  providers: [
    { provide: LOCALE_ID, useValue: 'de-DE' },
    LuxAppFooterButtonService,
    LuxStorageService
  ],
  bootstrap: [AppComponent]
})
export class AppModule {}
        `
      );

      callRule(updateLocale(testOptions), observableOf(appTree), context).subscribe(
        (success) => {
          const content = success.read(testOptions.path + '/src/app/app.module.ts')?.toString();
          expect(content).toContain("import '@angular/common/locales/global/de';");
          expect(content).not.toContain('registerLocaleData');
          expect(content).not.toContain('@angular/common/locales/de');
          expect(content).not.toContain('@angular/common/locales/extra/de');
          done();
        },
        (reason) => expect(reason).toBeNull()
      );
    });

    it('Sollte die Locale hinzufügen', async (done) => {
      appTree.overwrite(
        testOptions.path + '/src/app/app.module.ts',
        `
import { registerLocaleData } from '@angular/common';
import localeDE from '@angular/common/locales/de';
import localeDeExtra from '@angular/common/locales/extra/de';
import { LOCALE_ID } from '@angular/core';
import { PlaceholderComponent } from './demo/abstract/placeholder/placeholder.component';
import { RedirectComponent } from './demo/abstract/redirect/redirect.component';

registerLocaleData(localeDE, localeDeExtra);
import '@angular/common/locales/global/de';

@NgModule({
  declarations: [AppComponent, PlaceholderComponent, RedirectComponent],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    AppRoutingModule,
    HammerModule
  ],
  entryComponents: [LuxSnackbarComponent, LuxFilePreviewComponent],
  providers: [
    LuxAppFooterButtonService,
    LuxStorageService
  ],
  bootstrap: [AppComponent]
})
export class AppModule {}
        `
      );

      callRule(updateLocale(testOptions), observableOf(appTree), context).subscribe(
        (success) => {
          const content = success.read(testOptions.path + '/src/app/app.module.ts')?.toString();
          expect(content).toContain("{ provide: LOCALE_ID, useValue: 'de-DE' },");
          done();
        },
        (reason) => expect(reason).toBeNull()
      );
    });
  });
});
