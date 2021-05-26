import { callRule, SchematicContext } from '@angular-devkit/schematics';
import { SchematicTestRunner, UnitTestTree } from '@angular-devkit/schematics/testing';
import * as path from 'path';
import { of as observableOf } from 'rxjs';
import { getPackageJsonDependency, NodeDependencyType, updatePackageJsonDependencyForceUpdate } from '../utility/dependencies';
import { appOptions, workspaceOptions } from '../utility/test-helper';
import { UtilConfig } from '../utility/util';
import { deleteOldThemeDir, update, updateLocale, updateMajorVersion, updatePolyfills, updateTsConfig } from './index';

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
        { type: NodeDependencyType.Default, version: '1.9.3', name: '@ihk-gfi/lux-components' }
      );
      Object.defineProperty(process.versions, 'node', {
        get: () => '12.16.3'
      });

      callRule(update(testOptions), observableOf(appTree), context).subscribe(
        (success) => {},
        (reason) => expect(reason.toString()).toContain('wird nicht unterstützt.')
      );
    });

    it('Sollte LUX-Components 10 einrichten',  (done) => {
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
                "@ihk-gfi/lux-components": "10.8.1"
              }
            }
        `
      );

      callRule(update(testOptions), observableOf(appTree), context).subscribe(
        () => {
          expect(getPackageJsonDependency(appTree, '@ihk-gfi/lux-components').version).toEqual('~' + updateMajorVersion + '.0.0');
          done();
        },
        (reason) => expect(reason).toBeUndefined()
      );
    });
  });

  describe('[Rule] updatePolyfill', () => {
    it('Sollte die polyfill.ts aktualisieren (Single Quote)',  (done) => {
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

    it('Sollte die polyfill.ts aktualisieren (Double Quote)',  (done) => {
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
    it('Sollte die Locale aktualisieren',  (done) => {
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

    it('Sollte die Locale hinzufügen',  (done) => {
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

  describe('[Rule] updateTsConfig', () => {
    it('Sollte die tsconfig.json aktualisieren (es2020)',  (done) => {
      appTree.overwrite(
        '/tsconfig.json',
        `
{
    "experimentalDecorators": true,
    "target": "es2020",
    "typeRoots": [
      "node_modules/@types"
    ]
}
        `
      );

      callRule(updateTsConfig(testOptions), observableOf(appTree), context).subscribe(
        (success) => {
          const content = success.read('/tsconfig.json')?.toString();
          expect(content).toContain('"target": "es2015",');
          done();
        },
        (reason) => expect(reason).toBeNull()
      );
    });

    it('Sollte die tsconfig.json aktualisieren (es5)',  (done) => {
      appTree.overwrite(
          '/tsconfig.json',
          `
{
    "experimentalDecorators": true,
    "target": "es5",
    "typeRoots": [
      "node_modules/@types"
    ]
}
        `
      );

      callRule(updateTsConfig(testOptions), observableOf(appTree), context).subscribe(
          (success) => {
            const content = success.read('/tsconfig.json')?.toString();
            expect(content).toContain('"target": "es2015",');
            done();
          },
          (reason) => expect(reason).toBeNull()
      );
    });
  });

  describe('[Rule] deleteOldThemeDir', () => {
    it('Sollte das alte Theming-Verzeichnis löschen.',  (done) => {
      const oldThemePath = testOptions.path + '/src/theming/';
      appTree.create(oldThemePath + '_luxcommon.scss', `---`);
      appTree.create(oldThemePath + '_luxfocus.scss', `---`);
      appTree.create(oldThemePath + '_luxpalette.scss', `---`);
      appTree.create(oldThemePath + '_luxstyles.scss', `---`);
      appTree.create(oldThemePath + 'luxtheme.scss', `---`);
      expect(appTree.exists(oldThemePath + '_luxcommon.scss')).toBeTrue();
      expect(appTree.exists(oldThemePath + '_luxfocus.scss')).toBeTrue();
      expect(appTree.exists(oldThemePath + '_luxpalette.scss')).toBeTrue();
      expect(appTree.exists(oldThemePath + '_luxstyles.scss')).toBeTrue();
      expect(appTree.exists(oldThemePath + 'luxtheme.scss')).toBeTrue();

      callRule(deleteOldThemeDir(testOptions), observableOf(appTree), context).subscribe(
        (success) => {
          expect(appTree.exists(oldThemePath + '_luxcommon.scss')).toBeFalse();
          expect(appTree.exists(oldThemePath + '_luxfocus.scss')).toBeFalse();
          expect(appTree.exists(oldThemePath + '_luxpalette.scss')).toBeFalse();
          expect(appTree.exists(oldThemePath + '_luxstyles.scss')).toBeFalse();
          expect(appTree.exists(oldThemePath + 'luxtheme.scss')).toBeFalse();
          done();
        },
        (reason) => expect(reason).toBeNull()
      );
    });
  });
});
