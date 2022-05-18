import { callRule, SchematicContext } from '@angular-devkit/schematics';
import { SchematicTestRunner, UnitTestTree } from '@angular-devkit/schematics/testing';
import * as path from 'path';
import { of as observableOf } from 'rxjs';
import { getPackageJsonDependency, NodeDependencyType, updatePackageJsonDependency } from '../../utility/dependencies';
import { appOptions, workspaceOptions } from '../../utility/test';
import { UtilConfig } from '../../utility/util';
import {
    copyFiles,
    fixEmptyStyles,
    fixKarmaConf,
    removeDatepickerDefaultLocale,
    removeLuxSelectedFilesAlwaysUseArray,
    update,
    updateAngularJson, updateIndexHtml,
    updateMajorVersion,
    updatePackageJson, updateTsConfigJson
} from './index';

const collectionPath = path.join(__dirname, '../../collection.json');

describe('update130000', () => {
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
        const schematic  = runner.engine.createSchematic('update', collection);
        context          = runner.engine.createContext(schematic);

        testOptions.project = appOptions.name;
        testOptions.path    = workspaceOptions.newProjectRoot + '/' + appOptions.name;
        testOptions.verbose = true;
    });

    describe('[Rule] update130000', () => {
        it('Sollte einen Fehler werfen, wenn Version < n - 1', () => {
            updatePackageJsonDependency(appTree, {
                type   : NodeDependencyType.Default,
                version: '11.14.0',
                name   : '@ihk-gfi/lux-components'
            });
            Object.defineProperty(process.versions, 'node', {
                get: () => '16.14.1'
            });

            callRule(update(testOptions), observableOf(appTree), context).subscribe(
                (success) => {
                },
                (reason) => expect(reason.toString()).toContain('wird nicht unterstützt.')
            );
        });

        it('Sollte LUX-Components 13 einrichten', (done) => {
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
                "@ihk-gfi/lux-components": "11.14.0"
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

    describe('[Rule] copyFiles', () => {
        it('Sollte die Dateien kopieren', (done) => {
            callRule(copyFiles(testOptions), observableOf(appTree), context).subscribe(
                (success) => {
                    expect(success.exists(testOptions.path + '/.browserslistrc')).toBeTrue();
                    done();
                },
                (reason) => expect(reason).toBeUndefined()
            );
        });
    });

    describe('[Rule] fixKarmaConf', () => {
        it('Sollte die Datei karma.conf.js anpassen', (done) => {
            appTree.overwrite(
                testOptions.path + '/karma.conf.js',
                `
            // Karma configuration file, see link for more information
// https://karma-runner.github.io/1.0/config/configuration-file.html

module.exports = function (config) {
  config.set({
    basePath: '',
    frameworks: ['jasmine', '@angular-devkit/build-angular'],
    plugins: [
      require('karma-jasmine'),
      require('karma-chrome-launcher'),
      require('karma-jasmine-html-reporter'),
      require('karma-coverage-istanbul-reporter'),
      require('@angular-devkit/build-angular/plugins/karma')
    ],
    client:{
      clearContext: false // leave Jasmine Spec Runner output visible in browser
    },
    coverageIstanbulReporter: {
      dir: require('path').join(__dirname, 'coverage'), reports: [ 'html', 'lcovonly' ],
      fixWebpackSourcePaths: true
    },
    
    reporters: ['progress', 'kjhtml'],
    port: 9876,
    colors: true,
    logLevel: config.LOG_INFO,
    autoWatch: true,
    browsers: ['Chrome'],
    singleRun: false
  });
};

        `
            );

            callRule(fixKarmaConf(testOptions), observableOf(appTree), context).subscribe(
                (success) => {
                    const content = success?.toString();

                    expect(content).not.toContain('require(\'karma-coverage-istanbul-reporter\'),');
                    expect(content).not.toContain('require(\'karma-coverage\'),');
                    done();
                },
                (reason) => expect(reason).toBeUndefined()
            );
        });
    });

    describe('[Rule] updateAngularJson', () => {
        it('Sollte die Datei "angular.json" anpassen', (done) => {
            appTree.overwrite('/angular.json', testAngularJson);

            callRule(updateAngularJson(testOptions), observableOf(appTree), context).subscribe(
                (success) => {
                    const angularJson = success.read('/angular.json');
                    expect(angularJson).toBeDefined();

                    const content = angularJson?.toString();

                    expect(content).toContain('"glob": "material-design-icons(.css|.css.map)"');
                    expect(content).toContain('"glob": "*(*min.css|*min.css.map)"');
                    expect(content).not.toContain('"glob": "*.css",');
                    expect(content).not.toContain('"tsConfig": "src/tsconfig.app.ie.json"');
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

    describe('[Rule] updateTsConfigJson', () => {
        it('Sollte die Datei "tsconfig.json" anpassen', (done) => {
            appTree.overwrite(
                '/tsconfig.json',
                `
 
{  
  "compilerOptions": {
    "baseUrl": "tslint.json",
    "lib": [
      "es2018",
      "dom"
    ],
    "declaration": true,
    "module": "commonjs",
    "moduleResolution": "node",
    }
  }
        `
            );

            callRule(updateTsConfigJson(testOptions), observableOf(appTree), context).subscribe(
                (success) => {
                    const packageJson = success.read('/tsconfig.json');
                    expect(packageJson).toBeDefined();
                    expect(packageJson?.toString()).toContain('"allowSyntheticDefaultImports": true,');
                    done();
                },
                (reason) => expect(reason).toBeUndefined()
            );
        });
    });

    describe('[Rule] updateIndexHtml', () => {
        it('Sollte die Datei "index.html" anpassen', (done) => {
            appTree.create(
                '/src/index.html',
                `
<!doctype html>
<html lang="de">
<head>
  <meta charset="utf-8">
  <title>LUX Blueprint</title>
  <base href="/">

  <meta name="viewport" content="width=device-width, initial-scale=1">
  <link rel="icon" type="image/x-icon" href="favicon.ico">
  <link rel="stylesheet" href="assets/icons/fontawesome/css/all.css">
  <link rel="stylesheet" href="assets/icons/material-icons/material-design-icons.css">
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
        `
            );

            callRule(updateIndexHtml(testOptions), observableOf(appTree), context).subscribe(
                (success) => {
                    const indexHtml = success.read('/src/index.html');

                    expect(indexHtml).toBeDefined();
                    expect(indexHtml?.toString()).toContain('<link rel="stylesheet preload" as="style" type="text/css" href="assets/icons/fontawesome/css/all.css">');
                    expect(indexHtml?.toString()).toContain('<link rel="stylesheet preload" as="style" type="text/css" href="assets/icons/material-icons/material-design-icons.css">');
                    done();
                },
                (reason) => expect(reason).toBeUndefined()
            );
        });
    });

    describe('[Rule] removeLuxSelectedFilesAlwaysUseArray', () => {
        it('Sollte die Datei "package.json" anpassen', (done) => {
            appTree.create(testOptions.path + '/src/app/abc.component.html', templateRemoveLuxSelectedFilesAlwaysUseArray);

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

    describe('[Rule] fixEmptyStyles', () => {
        it('Sollte die leeren Styles korrigieren', (done) => {
            const filePath1 = testOptions.path + '/src/app/fix-empty-styles1.component.ts';
            appTree.create(filePath1, templateFixEmptyStyles1);

            const filePath2 = testOptions.path + '/src/app/fix-empty-styles2.component.ts';
            appTree.create(filePath2, templateFixEmptyStyles2);

            const filePath3 = testOptions.path + '/src/app/fix-empty-styles3.component.ts';
            appTree.create(filePath3, templateFixEmptyStyles3);

            const filePath4 = testOptions.path + '/src/app/fix-empty-styles4.component.ts';
            appTree.create(filePath4, templateFixEmptyStyles4);

            callRule(fixEmptyStyles(testOptions), observableOf(appTree), context).subscribe(
                (success) => {
                    expect(success.read(filePath1)?.toString()).toContain('styles: []');
                    expect(success.read(filePath2)?.toString()).toContain('styles: []');
                    expect(success.read(filePath3)?.toString()).toContain('styles: []');
                    expect(success.read(filePath4)?.toString()).toContain('styles: []');

                    done();
                },
                (reason) => expect(reason).toBeUndefined()
            );
        });
    });

    describe('[Rule] removeDatepickerDefaultLocale', () => {
        it('Sollte die Defaultlocale "de-DE" entfernen', (done) => {
            const filePath = testOptions.path + '/src/app/datepicker-default-locale.component.html';
            appTree.create(filePath, templateRemoveDatepickerDefaultLocale);

            callRule(removeDatepickerDefaultLocale(testOptions), observableOf(appTree), context).subscribe(
                (success) => {
                    expect(success.read(filePath)?.toString()).not.toContain('luxLocale="de-DE"');

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
            },
            {
              "glob": "material-design-icons.css",
              "input": "./node_modules/material-design-icons-iconfont/dist",
              "output": "./assets/icons/material-icons"
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

const templateRemoveLuxSelectedFilesAlwaysUseArray = `
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
        `;

const templateFixEmptyStyles1 = `
  import { Component, ContentChild, TemplateRef } from '@angular/core';

  @Component({
    selector: 'lux-detail-view',
    template: '',
    styles: ['']
  })
  export class LuxDetailViewComponent {
    @ContentChild(TemplateRef) tempRef: TemplateRef<any>;

    constructor() {}
}
        `;

const templateFixEmptyStyles2 = `
  import { Component, ContentChild, TemplateRef } from '@angular/core';

  @Component({
    selector:'lux-detail-view',
    template:'',
    styles:['']
  })
  export class LuxDetailViewComponent {
    @ContentChild(TemplateRef) tempRef: TemplateRef<any>;

    constructor() {}
}
        `;

const templateFixEmptyStyles3 = `
  import { Component, ContentChild, TemplateRef } from '@angular/core';

  @Component({
    selector:'lux-detail-view',
    template:'',
    styles:  ['']
  })
  export class LuxDetailViewComponent {
    @ContentChild(TemplateRef) tempRef: TemplateRef<any>;

    constructor() {}
}
        `;

const templateFixEmptyStyles4 = `
  import { Component, ContentChild, TemplateRef } from "@angular/core";

  @Component({
    selector: "lux-detail-view",
    template: "",
    styles: [""]
  })
  export class LuxDetailViewComponent {
    @ContentChild(TemplateRef) tempRef: TemplateRef<any>;

    constructor() {}
}
        `;

const templateRemoveDatepickerDefaultLocale = `
  <lux-datepicker luxLabel="Datepicker" [luxCustomFilter]="myFilter" luxLocale="de-DE"></lux-datepicker>
  <lux-datepicker luxLabel="Datepicker" luxMaxDate="02/02/2002" luxMinDate="02.02.2000" luxLocale="de-DE" [(luxValue)]="value"></lux-datepicker>  
  <lux-datepicker luxLocale="de-DE" luxLabel="Datepicker" luxControlBinding="datepicker"></lux-datepicker>
            `;
