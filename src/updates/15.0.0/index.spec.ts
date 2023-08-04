import { callRule, SchematicContext } from '@angular-devkit/schematics';
import { SchematicTestRunner, UnitTestTree } from '@angular-devkit/schematics/testing';
import * as path from 'path';
import { of as observableOf } from 'rxjs';
import { updateDependencies } from '../../update-dependencies';
import { getPackageJsonDependency } from '../../utility/dependencies';
import { appOptions, workspaceOptions } from '../../utility/test';
import { UtilConfig } from '../../utility/util';
import { removeMaAndFaIcons, updateProjectStructure } from './index';

describe('update150000', () => {
  let appTree: UnitTestTree;
  let runner: SchematicTestRunner;
  let context: SchematicContext;

  const testOptions: { project: string; path: string; verbose: boolean } = {
    project: '',
    path: '/',
    verbose: false
  };

  beforeEach(async () => {
    const collectionPath = path.join(__dirname, '../../collection.json');
    runner = new SchematicTestRunner('schematics', collectionPath);

    const collection = '@schematics/angular';
    appTree = await runner.runExternalSchematic(collection, 'workspace', workspaceOptions);
    appTree = await runner.runExternalSchematic(collection, 'application', appOptions, appTree);

    context = runner.engine.createContext(runner.engine.createSchematic('update', runner.engine.createCollection(collectionPath)));

    UtilConfig.defaultWaitMS = 0;

    testOptions.project = appOptions.name;
    testOptions.path = workspaceOptions.newProjectRoot + '/' + appOptions.name;
    testOptions.verbose = true;
  });

  describe('[Rule] updateDependencies', () => {
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
                "@angular/animations": "14.3.7",
                "@angular/cdk": "14.3.7",
                "@angular/common": "14.3.7",
                "@ihk-gfi/lux-components": "14.8.0",
                "@ihk-gfi/lux-components-theme": "14.7.0",
                "@angular/compiler": "14.3.7"
              },
              "devDependencies": {
                "@angular-devkit/build-angular": "14.3.5",
                "@angular-eslint/builder": "14.2.1"
              }
            }
        `
      );

      callRule(updateDependencies(), observableOf(appTree), context).subscribe({
        next: () => {
          expect(getPackageJsonDependency(appTree, '@ihk-gfi/lux-components').version).not.toEqual('14.8.0');
          expect(getPackageJsonDependency(appTree, '@ihk-gfi/lux-components').version).toEqual('15.0.0');

          expect(getPackageJsonDependency(appTree, '@ihk-gfi/lux-components-theme').version).not.toEqual('14.7.0');
          expect(getPackageJsonDependency(appTree, '@ihk-gfi/lux-components-theme').version).toEqual('15.0.0');
          done();
        },
        error: (reason) => expect(reason).toBeUndefined()
      });
    });
  });

  describe('[Rule] removeMaAndFaIcons', () => {
    it('Sollte die Abhängigkeiten der Ma- und Fa-Icons entfernen', (done) => {
      let packageJsonPath = '/package.json';
      appTree.overwrite(packageJsonPath, PACKAGE_JSON_001);

      const indexHtmlPath = (testOptions.path ?? '.') + '/src/index.html';
      appTree.overwrite(indexHtmlPath, INDEX_HTML_001);

      callRule(removeMaAndFaIcons(testOptions), observableOf(appTree), context).subscribe({
        next: () => {
          const packageJsonContent = appTree.readContent(packageJsonPath);
          expect(packageJsonContent).not.toContain('@fortawesome/fontawesome-free');
          expect(packageJsonContent).not.toContain('material-design-icons-iconfont');

          const indexHtmlContent = appTree.readContent(indexHtmlPath);
          expect(indexHtmlContent).not.toContain('material');
          expect(indexHtmlContent).not.toContain('fontawesome');
          done();
        },
        error: (reason) => expect(reason).toBeUndefined()
      });
    });
  });

  describe('[Rule] updateProjectStructure', () => {
    it('Sollte die Projektstruktur anpassen', (done) => {
      appTree.overwrite('/angular.json', ANGULAR_JSON_FULL);
      appTree.create((testOptions.path ? testOptions.path : '') + '/src/polyfills.ts', '{}');
      appTree.create((testOptions.path ? testOptions.path : '') + '/src/tsconfig.app.ie.json', '{}');

      callRule(updateProjectStructure(testOptions), observableOf(appTree), context).subscribe({
        next: () => {
          const angularJsonContent = appTree.readContent('/angular.json');
          expect(angularJsonContent).not.toContain('"polyfills": "src/polyfills.ts"');
          expect(angularJsonContent).toContain('"polyfills": [\n' + '              "zone.js"\n' + '            ],');
          expect(angularJsonContent).not.toContain('"main": "src/test.ts"');
          expect(angularJsonContent).toContain(
            '"polyfills": [\n' +
              '              "zone.js",\n' +
              '              "zone.js/testing",\n' +
              '              "src/test.ts"\n' +
              '            ]'
          );

          expect(appTree.exists('/src/polyfills.ts')).toBeFalse();
          expect(appTree.exists('/src/tsconfig.app.ie.json')).toBeFalse();
          done();
        },
        error: (reason) => expect(reason).toBeUndefined()
      });
    });
  });
});

const PACKAGE_JSON_001 = `
            {
              "name": "Lorem ipsum",
              "version": "0.0.32",
              "scripts": {
                "build": "tsc -p tsconfig.json",
                "test": "npm run build && jasmine src/**/*_spec.js"
              },
              "dependencies": {
                "@angular/animations": "14.3.7",
                "@angular/cdk": "14.3.7",
                "@angular/common": "14.3.7",
                "@ihk-gfi/lux-components": "14.4.0",
                "@ihk-gfi/lux-components-theme": "14.4.0",
                "@fortawesome/fontawesome-free": "5.15.4",
                "material-design-icons-iconfont": "6.5.0",
                "@angular/compiler": "14.3.7"
              },
              "devDependencies": {
                "@angular-devkit/build-angular": "14.3.5",
                "@angular-eslint/builder": "14.2.1"
              }
            }
`;

const INDEX_HTML_001 = `<!doctype html>
<html lang="de">
<head>
  <meta charset="utf-8">
  <title>LUX Blueprint</title>
  <base href="/">

  <meta name="viewport" content="width=device-width, initial-scale=1">
  <link rel="icon" type="image/svg+xml" href="assets/favicons/favicon.svg" />
  <link rel="icon" type="image/png" href="assets/favicons/favicon.png" />
  <link rel="stylesheet preload" as="style" type="text/css" href="assets/icons/fontawesome/css/all.css">
  <link rel="stylesheet preload" as="style" type="text/css" href="assets/icons/material-icons/material-design-icons.css">
  <style>
    .lux-no-js {
      color: red;
      font-size: 20px;
      border: 1px solid red;
      padding: 10px;
    }
  </style>
</head>
<body style="margin: 0">
<noscript>
  <div id="no-js" class="lux-no-js">
    <p><b>Achtung, Javascript ist deaktiviert.</b></p>
    <p>Bitte aktivieren Sie Javascript in Ihrem Browser, damit die Applikation funktionsf&auml;hig ist.</p>
  </div>
</noscript>
  <lux-bp></lux-bp>
</body>
</html>

`;

const ANGULAR_JSON_FULL = `{
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
                "glob": "all.css",
                "input": "./node_modules/@fortawesome/fontawesome-free/css",
                "output": "./assets/icons/fontawesome/css"
              },
              {
                "glob": "*(*.eot|*.ttf|*.woff|*.woff2)",
                "input": "./node_modules/@fortawesome/fontawesome-free/webfonts",
                "output": "./assets/icons/fontawesome/webfonts"
              },
              {
                "glob": "material-design-icons.css*",
                "input": "./node_modules/material-design-icons-iconfont/dist",
                "output": "./assets/icons/material-icons"
              },
              {
                "glob": "*(*.eot|*.ttf|*.woff|*.woff2)",
                "input": "./node_modules/material-design-icons-iconfont/dist/fonts",
                "output": "./assets/icons/material-icons/fonts"
              },
              {
                "glob": "*(*min.css|*min.css.map)",
                "input": "./node_modules/@ihk-gfi/lux-components-theme/prebuilt-themes",
                "output": "./assets/themes"
              },
              {
                "glob": "**/*",
                "input": "./node_modules/@ihk-gfi/lux-components-icons-and-fonts/assets/icons/",
                "output": "./assets/icons"
              },
              {
                "glob": "**/*",
                "input": "./node_modules/@ihk-gfi/lux-components-icons-and-fonts/assets/logos/",
                "output": "./assets/logos"
              },
              {
                "glob": "**/*",
                "input": "./node_modules/@ihk-gfi/lux-components-icons-and-fonts/assets/fonts/",
                "output": "./assets/fonts"
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
              "ng2-pdf-viewer",
              "pdfjs-dist",
              "dompurify"
            ],
            "localize": [
              "de"
            ],
            "i18nMissingTranslation": "error"
          },
          "configurations": {
            "production": {
              "budgets": [
                {
                  "type": "anyComponentStyle",
                  "maximumWarning": "6kb"
                }
              ],
              "optimization": {
                "scripts": true,
                "styles": {
                  "minify": true,
                  "inlineCritical": false
                },
                "fonts": true
              },
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
            "development": {
              "buildOptimizer": false,
              "optimization": false,
              "vendorChunk": true,
              "extractLicenses": false,
              "sourceMap": true,
              "namedChunks": true
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
            "development": {
              "browserTarget": "bar:build:development"
            },
            "en": {
              "browserTarget": "bar:build:en"
            }
          },
          "defaultConfiguration": "development"
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
                "glob": "*(*min.css|*min.css.map)",
                "input": "./node_modules/@ihk-gfi/lux-components-theme/prebuilt-themes",
                "output": "./assets/themes"
              },
              {
                "glob": "**/*",
                "input": "./node_modules/@ihk-gfi/lux-components-icons-and-fonts/assets/icons/",
                "output": "./assets/icons"
              },
              {
                "glob": "**/*",
                "input": "./node_modules/@ihk-gfi/lux-components-icons-and-fonts/assets/logos/",
                "output": "./assets/logos"
              },
              {
                "glob": "**/*",
                "input": "./node_modules/@ihk-gfi/lux-components-icons-and-fonts/assets/fonts/",
                "output": "./assets/fonts"
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
  "cli": {
    "schematicCollections": [
      "@angular-eslint/schematics"
    ]
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
