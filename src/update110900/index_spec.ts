import { callRule, SchematicContext } from '@angular-devkit/schematics';
import { SchematicTestRunner, UnitTestTree } from '@angular-devkit/schematics/testing';
import * as path from 'path';
import { of as observableOf } from 'rxjs';
import { getPackageJsonDependency } from '../utility/dependencies';
import { appOptions, workspaceOptions } from '../utility/test';
import { UtilConfig } from '../utility/util';
import { addIconsToIndexHtml, update110900 } from './index';

const collectionPath = path.join(__dirname, '../collection.json');

describe('update110900', () => {
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
    const schematic = runner.engine.createSchematic('update-11.9.0', collection);
    context = runner.engine.createContext(schematic);

    testOptions.project = appOptions.name;
    testOptions.path = workspaceOptions.newProjectRoot + '/' + appOptions.name;
    testOptions.verbose = true;
  });

  describe('[Rule] update110900', () => {
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
                "@ihk-gfi/lux-components": "11.0.0",
              },
              "devDependencies": {
                    "@angular-devkit/build-angular": "0.1102.14"
              }
            }
        `
      );

      appTree.overwrite(
        '/angular.json',
        `{
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
                "glob": "*(*min.css|*min.css.map)",
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
        `
      );

      callRule(update110900(testOptions), observableOf(appTree), context).subscribe(
        (success) => {
          expect(getPackageJsonDependency(appTree, '@ihk-gfi/lux-components').version).toEqual('11.9.0');
          expect(getPackageJsonDependency(appTree, '@ihk-gfi/lux-components-theme').version).toEqual('11.11.0');

          const angularJson = success.read('/angular.json')?.toString();
          expect(angularJson).toContain(
            `{
                "glob": "all.css",
                "input": "./node_modules/@fortawesome/fontawesome-free/css",
                "output": "./assets/icons/fontawesome/css"
              },`
          );

          expect(angularJson).toContain(
            `{
                "glob": "*(*.eot|*.ttf|*.woff|*.woff2)",
                "input": "./node_modules/@fortawesome/fontawesome-free/webfonts",
                "output": "./assets/icons/fontawesome/webfonts"
              },`
          );

          expect(angularJson).toContain(
            `{
                "glob": "material-design-icons.css",
                "input": "./node_modules/material-design-icons-iconfont/dist",
                "output": "./assets/icons/material-icons"
              },`
          );

          expect(angularJson).toContain(
            `{
                "glob": "*(*.eot|*.ttf|*.woff|*.woff2)",
                "input": "./node_modules/material-design-icons-iconfont/dist/fonts",
                "output": "./assets/icons/material-icons/fonts"
              },`
          );

          done();
        },
        (reason) => expect(reason).toBeUndefined()
      );
    });
  });

  describe('[Rule] addIconsToIndexHtml', () => {
    it('Sollte die Datei "index.html" angepasst haben', (done) => {
      appTree.create(
        'src/index.html',
        `
<!doctype html>
<html lang="de">
<head>
  <meta charset="utf-8">
  <title>LUX Blueprint</title>
  <base href="/">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <link rel="icon" type="image/x-icon" href="favicon.ico">
</head>
<body style="margin: 0">
<noscript>
  <div id="no-js" class="lux-no-js">
    <p><b>Achtung, Javascript ist deaktiviert.</b></p>
    <p>Bitte aktivieren Sie Javascript in Ihrem Browser, damit die Applikation funktionsf&auml;hig ist.</p>
  </div>
</noscript>
  <app-root></app-root>
</body>
</html>
        `
      );


      callRule(addIconsToIndexHtml(testOptions), observableOf(appTree), context).subscribe(
        (success) => {
          const content = success.read('src/index.html')?.toString();

          expect(content).toContain('<link rel="icon" type="image/x-icon" href="favicon.ico">');
          expect(content).toContain('<link rel="stylesheet" href="assets/icons/material-icons/material-design-icons.css">');
          expect(content).toContain('<link rel="stylesheet" href="assets/icons/fontawesome/css/all.css">');

          done();
        },
        (reason) => expect(reason).toBeUndefined()
      );
    });
  });
});
