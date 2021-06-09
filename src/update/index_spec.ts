import { callRule, SchematicContext } from '@angular-devkit/schematics';
import { SchematicTestRunner, UnitTestTree } from '@angular-devkit/schematics/testing';
import * as path from 'path';
import { of as observableOf } from 'rxjs';
import { getPackageJsonDependency, NodeDependencyType, updatePackageJsonDependency } from '../utility/dependencies';
import { appOptions, workspaceOptions } from '../utility/test';
import { UtilConfig } from '../utility/util';
import {
  addThemeAssets, clearStylesScss,
  deleteOldThemeDir, i18nUpdateAngularJson, i18nUpdateAppModule, i18nUpdatePackageJson, removeThemeAssets,
  update,
  updateAppComponent,
  updateAppModule, updateBrowserList,
  updateMajorVersion, updateTsConfigJson
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
      updatePackageJsonDependency(
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

  describe('[Rule] updateBrowserList', () => {
    it('Sollte die alten IE-Versionen (9 und 10) entfernt haben',  (done) => {
      appTree.create(
        '/.browserslistrc',
        `
# This file is used by the build system to adjust CSS and JS output to support the specified browsers below.
# For additional information regarding the format and rule options, please see:
# https://github.com/browserslist/browserslist#queries

# You can see what browsers were selected by your queries by running:
#   npx browserslist

> 0.5%
last 2 versions
Firefox ESR
not dead
IE 9-11 # For IE 9-11 support, remove 'not'.

        `
      );

      callRule(updateBrowserList(testOptions), observableOf(appTree), context).subscribe(
        (success) => {
          const browserListContent = success.read('/.browserslistrc');
          expect(browserListContent).toBeDefined();
          const content = browserListContent?.toString();
          expect(content).toContain('not IE 9-10');
          expect(content).toContain('IE 11');
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

  describe('[Rule] clearStylesScss', () => {
    it('Sollte die alten Styles aus der styles.scss entfernen.',  (done) => {
      appTree.overwrite(
        testOptions.path + '/src/styles.scss',
        `
/* You can add global styles to this file, and also import other style files */
/* Themenamen: deeppurple-amber.css, indigo-pink.css, pink-bluegrey.css und purple-green.css */
$fa-font-path: '~@fortawesome/fontawesome-free/webfonts';
@import '~@fortawesome/fontawesome-free/scss/fontawesome';
@import '~@fortawesome/fontawesome-free/scss/regular';
@import '~@fortawesome/fontawesome-free/scss/solid';
@import '~@fortawesome/fontawesome-free/scss/brands';
@import '~material-design-icons-iconfont/dist/material-design-icons.css';
@import '../node_modules/@angular/material/theming';
@import './theming/luxtheme';

@include mat-core();

@include angular-material-theme($lux-theme);

        `
      );

      callRule(clearStylesScss(testOptions), observableOf(appTree), context).subscribe(
        (success) => {
          const content = success.read(testOptions.path + '/src/styles.scss')?.toString();
          expect(content).not.toContain('$fa-font-path: \'~@fortawesome/fontawesome-free/webfonts\';');
          expect(content).not.toContain('@import \'~@fortawesome/fontawesome-free/scss/fontawesome\';');
          expect(content).not.toContain('@import \'~@fortawesome/fontawesome-free/scss/regular\';');
          expect(content).not.toContain('@import \'~@fortawesome/fontawesome-free/scss/solid\';');
          expect(content).not.toContain('@import \'~@fortawesome/fontawesome-free/scss/brands\';');
          expect(content).not.toContain('@import \'~material-design-icons-iconfont/dist/material-design-icons.css\';');
          expect(content).not.toContain('@import \'../node_modules/@angular/material/theming\';');
          expect(content).not.toContain('@import \'./theming/luxtheme\';');
          expect(content).not.toContain('@include mat-core();');
          expect(content).not.toContain('@include angular-material-theme($lux-theme);');
          done();
        },
        (reason) => expect(reason).toBeNull()
      );
    });
  });

  describe('[Rule] addThemeAssets', () => {
    it('Sollte das Theme in das Assets-Array eintragen',  (done) => {
      appTree.overwrite(
        '/angular.json',
        `
{
  "$schema": "./node_modules/@angular/cli/lib/config/schema.json",
  "version": 1,
  "newProjectRoot": "projects",
  "projects": {
    "bar": {
      "projectType": "application",
      "schematics": {
        "@schematics/angular:component": {
          "style": "scss"
        }
      },
      "root": "projects/bar",
      "sourceRoot": "projects/bar/src",
      "prefix": "app",
      "architect": {
        "build": {
          "builder": "@angular-devkit/build-angular:browser",
          "options": {
            "assets": [
              "projects/bar/src/favicon.ico",
              "projects/bar/src/assets"
            ],
            "styles": [
              "projects/bar/src/styles.scss"
            ],
            "scripts": []
          }
        },
        "test": {
          "builder": "@angular-devkit/build-angular:karma",
          "options": {
            "main": "projects/bar/src/test.ts",
            "polyfills": "projects/bar/src/polyfills.ts",
            "tsConfig": "projects/bar/tsconfig.spec.json",
            "karmaConfig": "projects/bar/karma.conf.js",
            "assets": [
              "projects/bar/src/favicon.ico",
              "projects/bar/src/assets"
            ],
            "styles": [
              "projects/bar/src/styles.scss"
            ],
            "scripts": []
          }
        }
      }
    }
  },
  "defaultProject": "bar"
}           
        `
      );

      callRule(addThemeAssets(testOptions), observableOf(appTree), context).subscribe(
        (success) => {
          const content = success.read('/angular.json')?.toString();
          expect(content).toContain(`
          "options": {
            "assets": [
              {
                "glob": "*.css",
                "input": "./node_modules/@ihk-gfi/lux-components-theme/prebuilt-themes",
                "output": "./assets/themes"
              },
              "projects/bar/src/favicon.ico",
              "projects/bar/src/assets"
            ],
          `);

          expect(content).toContain(`
            "karmaConfig": "projects/bar/karma.conf.js",
            "assets": [
              {
                "glob": "*.css",
                "input": "./node_modules/@ihk-gfi/lux-components-theme/prebuilt-themes",
                "output": "./assets/themes"
              },
              "projects/bar/src/favicon.ico",
              "projects/bar/src/assets"
            ],
          `);
          done();
        },
        (reason) => expect(reason).toBeUndefined()
      );
    });
  });

  describe('[Rule] removeThemeAssets', () => {
    it('Sollte das Theme aus dem Assets-Array austragen',  (done) => {
      appTree.overwrite(
        '/angular.json',
        `
{
  "$schema": "./node_modules/@angular/cli/lib/config/schema.json",
  "version": 1,
  "newProjectRoot": "projects",
  "projects": {
    "bar": {
      "projectType": "application",
      "schematics": {
        "@schematics/angular:component": {
          "style": "scss"
        }
      },
      "root": "projects/bar",
      "sourceRoot": "projects/bar/src",
      "prefix": "app",
      "architect": {
        "build": {
          "builder": "@angular-devkit/build-angular:browser",
          "options": {
            "styles": [
              "projects/bar/src/styles.scss",
              "src/theming/luxtheme.scss"
            ],
            "scripts": []
          }
        },
        "test": {
          "builder": "@angular-devkit/build-angular:karma",
          "options": {
            "main": "projects/bar/src/test.ts",
            "polyfills": "projects/bar/src/polyfills.ts",
            "tsConfig": "projects/bar/tsconfig.spec.json",
            "karmaConfig": "projects/bar/karma.conf.js",
            "styles": [
              "src/theming/luxtheme.scss",
              "projects/bar/src/styles.scss"
            ],
            "scripts": []
          }
        }
      }
    }
  },
  "defaultProject": "bar"
}           
        `
      );

      callRule(removeThemeAssets(testOptions), observableOf(appTree), context).subscribe(
        (success) => {
          const content = success.read('/angular.json')?.toString();
          expect(content).toContain(`
          "options": {
            "styles": [
              "projects/bar/src/styles.scss"
            ],
          `);

          expect(content).toContain(`
            "karmaConfig": "projects/bar/karma.conf.js",
            "styles": [
              "projects/bar/src/styles.scss"
            ],
          `);
          done();
        },
        (reason) => expect(reason).toBeUndefined()
      );
    });
  });

  describe('[Rule] updateAppComponent', () => {
    it('Sollte die app.component.ts (mit Constructor) anpassen',  (done) => {
      appTree.overwrite(
        testOptions.path + '/src/app/app.component.ts',
        `
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  constructor(public router: Router) {}

  ngOnInit(): void {}
}
        `
      );

      callRule(updateAppComponent(testOptions), observableOf(appTree), context).subscribe(
        (success) => {
          const content = success.read(testOptions.path + '/src/app/app.component.ts')?.toString();
          expect(content).toContain('import { LuxThemeService } from \'@ihk-gfi/lux-components\';');
          expect(content).toContain('constructor(public router: Router, private themeService: LuxThemeService)');
          expect(content).toContain('themeService.loadTheme();');
          done();
        },
        (reason) => expect(reason).toBeUndefined()
      );
    });

    it('Sollte die app.component.ts (leerer Constructor) anpassen',  (done) => {
      appTree.overwrite(
        testOptions.path + '/src/app/app.component.ts',
        `
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  constructor() {
    console.log('Test');
  }

  ngOnInit(): void {}
}
        `
      );

      callRule(updateAppComponent(testOptions), observableOf(appTree), context).subscribe(
        (success) => {
          const content = success.read(testOptions.path + '/src/app/app.component.ts')?.toString();
          expect(content).toContain('import { LuxThemeService } from \'@ihk-gfi/lux-components\';');
          expect(content).toContain('constructor(private themeService: LuxThemeService)');
          expect(content).toContain('themeService.loadTheme();');
          done();
        },
        (reason) => expect(reason).toBeUndefined()
      );
    });

    it('Sollte die app.component.ts (ohne Constructor) anpassen',  (done) => {
      appTree.overwrite(
        testOptions.path + '/src/app/app.component.ts',
        `
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {

  ngOnInit(): void {}
}
        `
      );

      callRule(updateAppComponent(testOptions), observableOf(appTree), context).subscribe(
        (success) => {
          const content = success.read(testOptions.path + '/src/app/app.component.ts')?.toString();
          expect(content).toContain('import { LuxThemeService } from \'@ihk-gfi/lux-components\';');
          expect(content).toContain('constructor(private themeService: LuxThemeService)');
          expect(content).toContain('themeService.loadTheme();');
          done();
        },
        (reason) => expect(reason).toBeUndefined()
      );
    });
  });

  describe('[Rule] updateAppModule', () => {
    it('Sollte die Root-Services aus den Providern entfernen', (done) => {
      appTree.overwrite(
        testOptions.path + '/src/app/app.module.ts',
        `
import { BrowserModule } from '@angular/platform-browser';
import { FlexLayoutModule } from '@angular/flex-layout';
import {
  LuxActionModule,
  LuxAppFooterButtonService,
  LuxAppFooterLinkService,
  LuxCommonModule,
  LuxComponentsConfigModule,
  LuxComponentsConfigParameters,
  LuxConsoleService,
  LuxDirectivesModule,
  LuxErrorModule,
  LuxErrorService,
  LuxFormModule,
  LuxIconModule,
  LuxLayoutModule,
  LuxMasterDetailMobileHelperService,
  LuxPipesModule,
  LuxPopupsModule,
  LuxSnackbarService,
  LuxStepperHelperService
} from '@ihk-gfi/lux-components';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

const luxComponentsConfig: LuxComponentsConfigParameters = {
  generateLuxTagIds: true,
  labelConfiguration: {
    allUppercase: true,
    notAppliedTo: ['lux-side-nav-item', 'lux-menu-item', 'lux-link']
  },
  lookupServiceUrl: '/lookup/'
};
        
@NgModule({
  declarations: [AppComponent, HomeComponent, ErrorComponent, ProfilComponent],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    AppRoutingModule,
    LuxDirectivesModule,
    LuxIconModule,
    LuxLayoutModule,
    LuxActionModule,
    LuxFormModule,
    LuxCommonModule,
    LuxPipesModule,
    LuxPopupsModule,
    LuxErrorModule,
    FlexLayoutModule,
    LuxComponentsConfigModule.forRoot(luxComponentsConfig)
  ],
  providers: [
    LuxAppFooterButtonService,
    LuxAppFooterLinkService,
    LuxSnackbarService,
    LuxErrorService,
    LuxMasterDetailMobileHelperService,
    LuxStepperHelperService,
    LuxConsoleService
  ],
  bootstrap: [AppComponent]
})
export class AppModule {}
        `
      );

      callRule(updateAppModule(testOptions), observableOf(appTree), context).subscribe(
        (success) => {
          const content = success.read(testOptions.path + '/src/app/app.module.ts')?.toString();

          expect(content).not.toContain('LuxAppFooterButtonService,');
          expect(content).not.toContain('LuxAppFooterLinkService,');
          expect(content).not.toContain('LuxSnackbarService,');
          expect(content).not.toContain('LuxErrorService,');
          expect(content).not.toContain('LuxMasterDetailMobileHelperService,');
          expect(content).not.toContain('LuxStepperHelperService,');
          expect(content).not.toContain('LuxConsoleService,');
          expect(content).toContain('LuxIconModule,');

          expect(content).toContain('LuxCommonModule,');

          expect(content).not.toContain('displayBindingDebugHint');
          expect(content).toContain(`
const luxComponentsConfig: LuxComponentsConfigParameters = {
  generateLuxTagIds: environment.generateLuxTagIds
};`);
          done();
        },
        (reason) => expect(reason).toBeUndefined()
      );
    });
  });

  describe('[Rule] i18nUpdateAppModule', () => {
    it('Sollte die Datei "app.module.ts" (i18n) angepasst haben', (done) => {
      appTree.overwrite(
        testOptions.path + '/src/app/app.module.ts',
        `
import '@angular/common/locales/global/de';
import { Configuration, ConfigurationParameters } from './../../src-gen/bsclient/configuration';
import { SDApiModule } from '@ihk-gfi/lux-stammdaten';
import { BSApiModule } from './../../src-gen/bsclient/api.module';
import {registerLocaleData, DatePipe} from '@angular/common';
import {HTTP_INTERCEPTORS, HttpClientModule} from '@angular/common/http';
import {LOCALE_ID, NgModule, ErrorHandler} from '@angular/core';
import {FlexLayoutModule} from '@angular/flex-layout';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {BrowserModule} from '@angular/platform-browser';

import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {
  LuxFilePreviewModule,
  LuxFilePreviewComponent
} from '@ihk-gfi/lux-components';

import { TimeoutComponent } from './components/basic/timeout/timeout.component';
import {UnauthorizedComponent} from './components/basic/unauthorized/unauthorized.component';
import {SharedService} from './services/shared.service';

@NgModule({
  declarations   : [
    AppComponent,
    DatenschutzComponent,
    ImpressumComponent,
    MaintenanceComponent,
    ErrorComponent,
    WelcomeComponent,
    UnauthorizedComponent,
    TimeoutComponent,
    ByeComponent
  ],
  imports        : [
    HttpClientModule,
    BrowserModule,
    FormsModule,
    ReactiveFormsModule,
    AppRoutingModule,
    BrowserAnimationsModule,
    LuxDirectivesModule,
    LuxIconModule,
    LuxLayoutModule,
    LuxActionModule,
    LuxFormModule,
    LuxCommonModule,
    LuxPipesModule,
    LuxPopupsModule,
    LuxErrorModule,
    FlexLayoutModule,
    LuxFilePreviewModule,
    FeedbackModule,
    HomeModule,
    ConfigurationModule,
    SDApiModule.forRoot(apiSDConfigFactory),
    BSApiModule.forRoot(apiConfigFactory),
    LuxComponentsConfigModule.forRoot(luxComponentsConfig)
  ],
    entryComponents: [
    LuxSnackbarComponent,
    LuxFilePreviewComponent
  ],
  providers      : [
    LuxConsoleService,
    {
      provide : HTTP_INTERCEPTORS,
      useClass: CSRFInterceptor,
      multi   : true
    },
    {
      provide : HTTP_INTERCEPTORS,
      useClass: CorrelationInterceptor,
      multi   : true
    },
    {
      provide : HTTP_INTERCEPTORS,
      useClass: UnauthorizedInterceptor,
      multi   : true
    },
    {provide: LOCALE_ID, useValue: (document[ 'locale' ] ? document[ 'locale' ] : 'de-DE')},
    { provide: Window, useValue: window },
  ],
  bootstrap      : [
    AppComponent
  ]
})
export class AppModule {
}
        `
      );

      callRule(i18nUpdateAppModule(testOptions), observableOf(appTree), context).subscribe(
        (success) => {
          const content = success.read(testOptions.path + '/src/app/app.module.ts')?.toString();

          expect(content).not.toContain('import \'@angular/common/locales/global/de\';');
          expect(content).not.toContain('{provide: LOCALE_ID, useValue: (document[ \'locale\' ] ? document[ \'locale\' ] : \'de-DE\')},');
          expect(content).not.toContain('import {LOCALE_ID');
          expect(content).toContain('import { NgModule, ErrorHandler} from \'@angular/core\';');
          expect(content).not.toContain('import {registerLocaleData');
          expect(content).toContain('import { DatePipe} from \'@angular/common\';');

          done();
        },
        (reason) => expect(reason).toBeUndefined()
      );
    });
  });

  describe('[Rule] i18nUpdateAngularJson', () => {
    it('Sollte die Datei "angular.json" (i18n) angepasst haben', (done) => {
      appTree.overwrite('/angular.json',
        `
{
  "$schema": "./node_modules/@angular/cli/lib/config/schema.json",
  "version": 1,
  "newProjectRoot": "projects",
  "projects": {
    "bar": {
      "root": "",
      "sourceRoot": "src",
      "projectType": "application",
      "architect": {
        "build": {
          "builder": "@angular-devkit/build-angular:browser",
          "options": {
            "outputPath": "dist",
            "index": "src/index.html",
            "main": "src/main.ts",
            "tsConfig": "src/tsconfig.app.json",
            "polyfills": "src/polyfills.ts",
            "assets": [
              "src/assets",
\t\t\t  { "glob": "**/*", "input": "./node_modules/pdfjs-dist/cmaps/", "output": "./assets/cmaps" }
            ],
            "styles": [
              "src/styles.scss",
              "src/theming/luxtheme.scss"
            ],
            "scripts": [],
            "allowedCommonJsDependencies": ["hammerjs", "ng2-pdf-viewer"]
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
            }
          }
        },
        "serve": {
          "builder": "@angular-devkit/build-angular:dev-server",
          "options": {
            "browserTarget": "lux-bp:build"
          },
          "configurations": {
            "production": {
              "browserTarget": "lux-bp:build:production"
            },
            "es5": {
              "browserTarget": "lux-bp:build:es5"
            }
          }
        },
        "extract-i18n": {
          "builder": "@angular-devkit/build-angular:extract-i18n",
          "options": {
            "browserTarget": "lux-bp:build"
          }
        },
        "test": {
          "builder": "@angular-devkit/build-angular:karma",
          "options": {
            "main": "src/test.ts",
            "karmaConfig": "./karma.conf.js",
            "polyfills": "src/polyfills.ts",
            "tsConfig": "src/tsconfig.spec.json",
            "scripts": [],
            "styles": [
              "src/styles.scss",
              "src/theming/luxtheme.scss"
            ],
            "assets": [
              "src/assets",
\t\t\t  { "glob": "**/*", "input": "./node_modules/pdfjs-dist/cmaps/", "output": "./assets/cmaps" }
            ]
          }
        },
        "app-lint": {
          "builder": "@angular-devkit/build-angular:tslint",
          "options": {
            "tsConfig": [
              "src/tsconfig.app.json"
            ],
            "tslintConfig": "./tslint.json"
          }
\t\t},
        "spec-lint": {
          "builder": "@angular-devkit/build-angular:tslint",
          "options": {
            "tsConfig": [
              "src/tsconfig.spec.json"
             ],
            "tslintConfig": "./tslint.spec.json"
          }
\t\t}
      }
    },
    "lux-bp-e2e": {
      "root": "e2e",
      "sourceRoot": "e2e",
      "projectType": "application",
      "architect": {
        "e2e": {
          "builder": "@angular-devkit/build-angular:protractor",
          "options": {
            "protractorConfig": "./protractor.conf.js",
            "devServerTarget": "lux-bp:serve"
          }
        },
        "lint": {
          "builder": "@angular-devkit/build-angular:tslint",
          "options": {
            "tsConfig": [
              "e2e/tsconfig.e2e.json"
            ],
            "exclude": [
              "**/node_modules/**"
            ]
          }
        }
      }
    }
  },
  "defaultProject": "lux-bp",
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

      callRule(i18nUpdateAngularJson(testOptions), observableOf(appTree), context).subscribe(
        (success) => {
          const content = success.read('angular.json')?.toString();

          expect(content).toContain('"i18n": {\n' +
                                    '        "sourceLocale": "de",\n' +
                                    '        "locales": {\n' +
                                    '          "en": "src/locale/messages.en.xlf"\n' +
                                    '        }\n' +
                                    '      }');
          expect(content).toContain(`"localize": [
              "de"
            ]`);
          expect(content).toContain('"i18nMissingTranslation": "error"');
          expect(content).toContain(`"en": {
              "localize": [
                "en"
              ],
              "aot": true,
              "outputPath": "dist/en",
              "i18nMissingTranslation": "error"
            }
          `);
          expect(content).toContain(`"en": {
              "browserTarget": "bar:build:en"
            }
          `);

          done();
        },
        (reason) => expect(reason).toBeUndefined()
      );
    });
  });

  describe('[Rule] i18nUpdatePackageJson', () => {
    it('Sollte die Datei "package.json" (i18n) angepasst haben', (done) => {
      appTree.overwrite('/package.json',
        `
{
  "name": "BP",
  "version": "0.0.1",
  "license": "MIT",
  "scripts": {
    "ng": "ng",
    "start": "ng serve --public-host=http://localhost:4200",
    "start_en": "ng serve --public-host=http://localhost:4200 --configuration en",
    "build": "node --max_old_space_size=4024 ./node_modules/@angular/cli/bin/ng build --source-map",
    "build-aot": "node --max_old_space_size=4024 ./node_modules/@angular/cli/bin/ng build --aot",
    "buildzentral": "node --max_old_space_size=4024 ./node_modules/@angular/cli/bin/ng build --prod",
    "start-ie": "ng serve --configuration es5 --public-host=http://localhost:4200",
    "test": "ng test",
    "test_no_sm": "ng test --no-sourceMap",
    "test_single_run": "ng test --watch=false --code-coverage=true --browsers=ChromeHeadless",
    "test_coverage": "ng test --watch=false --code-coverage=true",
    "lint": "ng run lux-bp:app-lint --format=stylish && ng run lux-bp:spec-lint --format=stylish",
    "e2e": "ng e2e",
    "compodoc": "./node_modules/.bin/compodoc -p tsconfig.json",
    "docStart": "compodoc src -s --port 8888",
    "security": "npm audit --registry=https://registry.npmjs.org --audit-level high",
    "smoketest": "npm run test_single_run && npm run build-aot && npm run lint --bailOnLintError true",
    "generate_bsclient": "openapi-generator generate -i http://localhost:8081/business-service/openapi/v3/api-docs -g typescript-angular -o src-gen/bsclient --additional-properties apiModulePrefix=BS",
    "generate_bsclient_zentral": "openapi-generator generate -i ../business-service/target/swagger.json -g typescript-angular -o src-gen/bsclient --additional-properties apiModulePrefix=BS"
  }
}

        `
      );

      callRule(i18nUpdatePackageJson(testOptions), observableOf(appTree), context).subscribe(
        (success) => {
          const content = success.read('package.json')?.toString();

          expect(content).toContain('"xi18n": "ng xi18n --output-path src/locale --ivy"');
          expect(content).toContain('"build-aot": "node --max_old_space_size=4024 ./node_modules/@angular/cli/bin/ng build --aot --localize"');
          expect(content).toContain('"buildzentral": "node --max_old_space_size=4024 ./node_modules/@angular/cli/bin/ng build --prod --localize"');
          expect(content).toContain('"start_en": "ng serve --public-host=http://localhost:4200 --configuration en"');

          done();
        },
        (reason) => expect(reason).toBeUndefined()
      );
    });
  });

  describe('[Rule] updateTsConfigJson', () => {
    it('Sollte die tsconfig.json anpassen', (done) => {
      appTree.overwrite( '/tsconfig.json',
        `
{
  "compileOnSave": false,
  "compilerOptions": {
    "downlevelIteration": true,
    "outDir": "./dist/out-tsc",
    "sourceMap": true,
    "declaration": false,
    "moduleResolution": "node",
    "emitDecoratorMetadata": true,
    "experimentalDecorators": true,
    "target": "es2015",
    "typeRoots": [
      "node_modules/@types"
    ],
    "lib": [
      "es2017",
      "dom"
    ],
    "module": "esnext",
    "baseUrl": "./"
  },
  "angularCompilerOptions": {
    "fullTemplateTypeCheck": true,
    "preserveWhiteSpace": false,
    "strictInjectionParameters": true,
    "enableIvy": true
  }
}
        `
      );

      callRule(updateTsConfigJson(testOptions), observableOf(appTree), context).subscribe(
        (success) => {
          const content = success.read('/tsconfig.json')?.toString();

          expect(content).toContain('"strict": false');
          expect(content).toContain('"noImplicitReturns": true');
          expect(content).toContain('"noFallthroughCasesInSwitch": true');
          expect(content).toContain('"forceConsistentCasingInFileNames": true');
          expect(content).toContain('"lib": [\n      "es2018",\n      "dom"\n    ]');
          expect(content).toContain('"module": "es2020"');
          expect(content).toContain('"strictInputAccessModifiers": true');
          expect(content).toContain('"strictTemplates": false');

          done();
        },
        (reason) => expect(reason).toBeUndefined()
      );
    });
  });
});
