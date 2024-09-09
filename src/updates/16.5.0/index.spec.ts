import { callRule, SchematicContext, Tree } from '@angular-devkit/schematics';
import { SchematicTestRunner, UnitTestTree } from '@angular-devkit/schematics/testing';
import * as path from 'path';
import { of as observableOf } from 'rxjs';
import { getPackageJsonDependency } from '../../utility/dependencies';
import { appOptions, workspaceOptions } from '../../utility/test';
import { UtilConfig } from '../../utility/util';
import { update160500, updateAngularJson, updateAppModuleTs } from './index';

describe('update160500', () => {
  let appTree: UnitTestTree;
  let runner: SchematicTestRunner;
  let context: SchematicContext;

  const testOptions: any = {};

  beforeEach(async () => {
    const collectionPath = path.join(__dirname, '../../collection.json');
    runner = new SchematicTestRunner('schematics', collectionPath);

    const collection = '@schematics/angular';
    appTree = await runner.runExternalSchematic(collection, 'workspace', workspaceOptions);
    appTree = await runner.runExternalSchematic(collection, 'application', appOptions, appTree);

    context = runner.engine.createContext(runner.engine.createSchematic('update-16.5.0', runner.engine.createCollection(collectionPath)));

    UtilConfig.defaultWaitMS = 0;

    testOptions.project = appOptions.name;
    testOptions.path = workspaceOptions.newProjectRoot + '/' + appOptions.name;
    testOptions.verbose = true;
  });

  describe('[Rule] update160500', () => {
    it('Sollte die Abhängigkeiten aktualisieren', (done) => {
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
              "dependencies": {
                "@angular/animations": "16.2.12",
                "@angular/cdk": "16.2.12",
                "@angular/common": "16.2.12",
                "@ihk-gfi/lux-components": "16.4.2",
                "@ihk-gfi/lux-components-theme": "16.2.0",
                "@angular/compiler": "16.2.12",
                "@ihk-gfi/lux-components-icons-and-fonts": "1.8.0"
              },
              "devDependencies": {
                "@angular-devkit/build-angular": "16.2.12",
                "@angular-eslint/builder": "16.3.1",
                "@angular/cli": "16.2.12",
              }
            }
        `
      );

      callRule(update160500(testOptions), observableOf(appTree), context).subscribe(
        () => {
          expect(getPackageJsonDependency(appTree, '@ihk-gfi/lux-components').version).not.toEqual('16.4.2');
          expect(getPackageJsonDependency(appTree, '@ihk-gfi/lux-components').version).toEqual('16.5.0');

          expect(getPackageJsonDependency(appTree, '@ihk-gfi/lux-components-theme').version).not.toEqual('16.2.0');
          expect(getPackageJsonDependency(appTree, '@ihk-gfi/lux-components-theme').version).toEqual('16.3.0');

          done();
        },
        (reason) => expect(reason).toBeUndefined()
      );
    });
  });

  describe('[Rule] updateAngularJson', () => {
    it('Sollte die angular.json aktualisieren', (done) => {
      const filePath = testOptions.path + '/angular.json';
      appTree.create(filePath, angularJsonTestFile01);

      callRule(updateAngularJson(testOptions), observableOf(appTree), context).subscribe({
        next: (success: Tree) => {
          const content = success.read(filePath)?.toString();

          expect(content).not.toContain('pdf.worker.min.js');
          expect(content).toContain('pdf.worker.min.mjs');

          expect(content).not.toContain('node_modules/ng2-pdf-viewer/node_modules/pdfjs-dist/build');
          expect(content).toContain('node_modules/pdfjs-dist/build');

          done();
        },
        error: (reason: any) => expect(reason).toBeUndefined()
      });
    });
  });

  describe('[Rule] updateAppModuleTs', () => {
    it('Sollte die app.module.ts aktualisieren', (done) => {
      const filePath = testOptions.path + '/app.module.ts';
      appTree.create(filePath, appModuleTsTestFile01);

      callRule(updateAppModuleTs(testOptions), observableOf(appTree), context).subscribe({
        next: (success: Tree) => {
          const content = success.read(filePath)?.toString();

          expect(content).not.toContain('pdf.worker.min.js');
          expect(content).toContain('pdf.worker.min.mjs');

          done();
        },
        error: (reason: any) => expect(reason).toBeUndefined()
      });
    });
  });
});

const angularJsonTestFile01 = `           {
  "$schema": "./node_modules/@angular/cli/lib/config/schema.json",
  "projects": {
    "lux-components": {
      "architect": {
        
        "test": {
          "builder": "ngx-build-plus:karma",
          "options": {
            "assets": [
              "src/assets",
              "src/favicon.ico",
              {
                "glob": "pdf.worker.min.js",
                "input": "./node_modules/ng2-pdf-viewer/node_modules/pdfjs-dist/build",
                "output": "./assets/pdf"
              },
              {
                "glob": "**/*",
                "input": "./node_modules/pdfjs-dist/cmaps/",
                "output": "./assets/cmaps"
              },
              {
                "glob": "lux-icons.json",
                "input": "./node_modules/@ihk-gfi/lux-components-icons-and-fonts/assets/icons/",
                "output": "./assets/icons"
              },
              {
                "glob": "*(*min.css|*min.css.map)",
                "input": "./node_modules/@ihk-gfi/lux-components-theme/prebuilt-themes",
                "output": "./assets/themes"
              }
            ],
            "styles": ["src/styles.scss"],
            "scripts": [
              {
                "bundleName": "polyfill-webcomp",
                "input": "node_modules/@webcomponents/webcomponentsjs/bundles/webcomponents-sd-ce-pf.js"
              }
            ]
          }
        }
      }
    }
  },
}`;

const appModuleTsTestFile01 = `
export class AppModule implements DoBootstrap {
  constructor(private injector: Injector) {}

  ngDoBootstrap() {
    (window as any).pdfWorkerSrc = '/assets/pdf/pdf.worker.min.js';

    const ce = createCustomElement(AppComponent, { injector: this.injector });
    customElements.define('lux-components-demo', ce);
  }
}
`;
