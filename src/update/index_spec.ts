import { callRule, SchematicContext } from '@angular-devkit/schematics';
import { SchematicTestRunner, UnitTestTree } from '@angular-devkit/schematics/testing';
import * as path from 'path';
import { of as observableOf } from 'rxjs';
import { getPackageJsonDependency, NodeDependencyType, updatePackageJsonDependency } from '../utility/dependencies';
import { appOptions, workspaceOptions } from '../utility/test';
import { UtilConfig } from '../utility/util';
import {
  copyFiles,
  removeLuxSelectedFilesAlwaysUseArray,
  update,
  updateAngularJson,
  updateMajorVersion,
  updatePackageJson
} from './index';

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
      updatePackageJsonDependency(appTree, {
        type: NodeDependencyType.Default,
        version: '1.9.3',
        name: '@ihk-gfi/lux-components'
      });
      Object.defineProperty(process.versions, 'node', {
        get: () => '12.16.3'
      });

      callRule(update(testOptions), observableOf(appTree), context).subscribe(
        (success) => {},
        (reason) => expect(reason.toString()).toContain('wird nicht unterstützt.')
      );
    });

    it('Sollte LUX-Components 12 einrichten', (done) => {
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
                "@ihk-gfi/lux-components": "11.7.0"
              }
            }
        `
      );

      callRule(update(testOptions), observableOf(appTree), context).subscribe(
        () => {
          expect(getPackageJsonDependency(appTree, '@ihk-gfi/lux-components').version).toEqual(
            '' + updateMajorVersion + '.0.0'
          );
          done();
        },
        (reason) => expect(reason).toBeUndefined()
      );
    });
  });

  it('Sollte LUX-Components 12 einrichten', (done) => {
    appTree.overwrite('/angular.json', testAngularJson);

    callRule(updateAngularJson(testOptions), observableOf(appTree), context).subscribe(
      (success) => {
        const angularJson = success.read('/angular.json');
        expect(angularJson).toBeDefined();

        const content = angularJson?.toString();

        expect(content).toContain('"glob": "*(*min.css|*min.css.map)"');
        expect(content).not.toContain('"glob": "*.css",');
        expect(content).not.toContain('"tsConfig": "src/tsconfig.app.ie.json"');
        done();
      },
      (reason) => expect(reason).toBeUndefined()
    );
  });

  describe('[Rule] copyFiles', () => {
    it('Sollte die Dateien kopieren', (done) => {
      callRule(copyFiles(testOptions), observableOf(appTree), context).subscribe(
        (success) => {
          expect(success.exists(testOptions.path + '/src/locale/messages.xlf')).toBeTrue();
          expect(success.exists(testOptions.path + '/src/locale/messages.en.xlf')).toBeTrue();
          expect(success.exists(testOptions.path + '/.browserslistrc')).toBeTrue();
          done();
        },
        (reason) => expect(reason).toBeUndefined()
      );
    });
  });

  describe('[Rule] updatePackageJson', () => {
    it('Sollte die Datei "package.json" anpassen', (done) => {
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
              "scripts": {
                "xi18n": "ng extract-i18n --output-path src/locale --ivy"
              },
              "dependencies": {
                "@ihk-gfi/lux-components": "11.7.0"
              }
            }
        `
      );

      callRule(updatePackageJson(testOptions), observableOf(appTree), context).subscribe(
        (success) => {
          const packageJson = success.read('/package.json');
          expect(packageJson).toBeDefined();
          expect(packageJson?.toString()).toContain('"xi18n": "ng extract-i18n --output-path src/locale"');
          done();
        },
        (reason) => expect(reason).toBeUndefined()
      );
    });
  });

  describe('[Rule] removeLuxSelectedFilesAlwaysUseArray', () => {
    it('Sollte die Datei "package.json" anpassen', (done) => {
      appTree.create(
        testOptions.path + '/src/app/abc.component.html',
        `
    <div fxFlex="auto" fxLayout="column">
      <h3>Ohne ReactiveForm</h3>
      <lux-file-list
        testDirective
        [luxLabel]="label"
        [luxDownloadActionConfig]="downloadActionConfig"
        [luxMaximumExtended]="maximumExtended"
        [luxCapture]="capture"
        [luxAccept]="accept"
        [luxHint]=""
        [luxHintShowOnlyOnFocus]="hintShowOnlyOnFocus"
        [luxDnDActive]="dndActive"
        [luxSelectedFiles]="selected"
        [luxContentsAsBlob]="contentAsBlob"
        [luxUploadReportProgress]="reportProgress"
        (luxSelectedFilesChange)="onSelectedChange($event)"
        [luxSelectedFilesAlwaysUseArray]="alwaysUseArray"
        (luxFocusIn)="log(showOutputEvents, 'luxFocusIn', $event)"
        (luxFocusOut)="log(showOutputEvents, 'luxFocusOut', $event)"
        #filelistexamplewithoutform
      >
      </lux-file-list>
    </div>
        `
      );

      callRule(removeLuxSelectedFilesAlwaysUseArray(testOptions), observableOf(appTree), context).subscribe(
        (success) => {
          const componentHtml = success.read(testOptions.path + '/src/app/abc.component.html')?.toString();
          expect(componentHtml).toBeDefined();
          expect(componentHtml?.toString()).not.toContain('alwaysUseArray');

          done();
        },
        (reason) => expect(reason).toBeUndefined()
      );
    });
  });
});

const testAngularJson = `
{
"$schema": "./node_modules/@angular/cli/lib/config/schema.json",
"version": 1,
"newProjectRoot": "projects",
"projects": {
  "bar": {
    "root": "",
    "sourceRoot": "src",
    "projectType": "application",
    "i18n": {
      "sourceLocale": {
        "code": "de",
        "baseHref": "/"
      },
      "locales": {
        "en": "src/locale/messages.en.xlf"
      }
    },
    "architect": {
      "build": {
        "builder": "ngx-build-plus:browser",
        "options": {
          "outputPath": "dist",
          "index": "src/index.html",
          "main": "src/main.ts",
          "tsConfig": "src/tsconfig.app.json",
          "polyfills": "src/polyfills.ts",
          "assets": [
            "src/assets",
            {
              "glob": "**/*",
              "input": "./node_modules/pdfjs-dist/cmaps/",
              "output": "./assets/cmaps"
            },
            {
              "glob": "*.css",
              "input": "./node_modules/@ihk-gfi/lux-components-theme/prebuilt-themes",
              "output": "./assets/themes"
            }
          ],
          "styles": [
            "src/styles.scss"
          ],
          "scripts": [
            {
              "bundleName": "polyfill-webcomp",
              "input": "node_modules/@webcomponents/webcomponentsjs/bundles/webcomponents-sd-ce-pf.js"
            },
            {
              "bundleName": "polyfill-webcomp-es5",
              "input": "node_modules/@webcomponents/webcomponentsjs/custom-elements-es5-adapter.js"
            }
          ],
          "allowedCommonJsDependencies": [
            "hammerjs",
            "ng2-pdf-viewer"
          ],
          "localize": [
            "de"
          ],
          "i18nMissingTranslation": "error",
          "extraWebpackConfig": "webpack.config.js"
        },
        "configurations": {
          "production": {
            "budgets": [
              {
                "type": "anyComponentStyle",
                "maximumWarning": "6kb"
              }
            ],
            "optimization": true,
            "outputHashing": "all",
            "sourceMap": false,
            "namedChunks": false,
            "aot": true,
            "extractLicenses": true,
            "vendorChunk": false,
            "buildOptimizer": true,
            "fileReplacements": [
              {
                "replace": "src/environments/environment.ts",
                "with": "src/environments/environment.prod.ts"
              }
            ]
          },
          "es5": {
            "budgets": [
              {
                "type": "anyComponentStyle",
                "maximumWarning": "6kb"
              }
            ],
            "tsConfig": "src/tsconfig.app.ie.json"
          },
          "en": {
            "localize": [
              "en"
            ],
            "aot": true,
            "outputPath": "dist/en",
            "i18nMissingTranslation": "error"
          }
        }
      },
      "serve": {
        "builder": "ngx-build-plus:dev-server",
        "options": {
          "browserTarget": "bar:build"
        },
        "configurations": {
          "production": {
            "browserTarget": "bar:build:production"
          },
          "es5": {
            "browserTarget": "bar:build:es5"
          },
          "en": {
            "browserTarget": "bar:build:en"
          }
        }
      },
      "extract-i18n": {
        "builder": "@angular-devkit/build-angular:extract-i18n",
        "options": {
          "browserTarget": "bar:build"
        }
      },
      "test": {
        "builder": "ngx-build-plus:karma",
        "options": {
          "main": "src/test.ts",
          "karmaConfig": "./karma.conf.js",
          "polyfills": "src/polyfills.ts",
          "tsConfig": "src/tsconfig.spec.json",
          "scripts": [],
          "styles": [
            "src/styles.scss"
          ],
          "assets": [
            "src/assets",
            {
              "glob": "**/*",
              "input": "./node_modules/pdfjs-dist/cmaps/",
              "output": "./assets/cmaps"
            },
            {
              "glob": "*.css",
              "input": "./node_modules/@ihk-gfi/lux-components-theme/prebuilt-themes",
              "output": "./assets/themes"
            }
          ]
        }
      },
      "lint": {
        "builder": "@angular-eslint/builder:lint",
        "options": {
          "lintFilePatterns": [
            "src/**/*.ts",
            "src/**/*.html"
          ]
        }
      }
    }
  },
  "bar-e2e": {
    "root": "e2e",
    "sourceRoot": "e2e",
    "projectType": "application",
    "architect": {
      "e2e": {
        "builder": "@angular-devkit/build-angular:protractor",
        "options": {
          "protractorConfig": "./protractor.conf.js",
          "devServerTarget": "bar:serve"
        }
      }
    }
  }
},
"defaultProject": "bar",
"cli": {
  "defaultCollection": "@angular-eslint/schematics"
},
"schematics": {
  "@schematics/angular:component": {
    "prefix": "bp",
    "style": "scss"
  },
  "@schematics/angular:directive": {
    "prefix": "bp"
  }
}
}

`;
