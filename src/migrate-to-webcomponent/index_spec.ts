import * as path from 'path';
import { SchematicTestRunner, UnitTestTree } from '@angular-devkit/schematics/testing';
import { callRule, SchematicContext } from '@angular-devkit/schematics';
import { of as observableOf } from 'rxjs';
import { UtilConfig } from '../utility/util';
import { appOptions, workspaceOptions } from '../utility/test';
import {
  createWebpackConfigJs,
  updateAngularJson, updateAppComponent,
  updateAppComponentHtml,
  updateAppModule,
  updateAppRoutingModule,
  updateIndexHtml, updatePackageJson
} from './index';

const collectionPath = path.join(__dirname, '../collection.json');

describe('migrate-to-eslint', () => {
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
    const schematic = runner.engine.createSchematic('migrate-to-webcomponent', collection);
    context = runner.engine.createContext(schematic);

    testOptions.project = appOptions.name;
    testOptions.path = workspaceOptions.newProjectRoot + '/' + appOptions.name;
    testOptions.verbose = true;
  });

  describe('[Rule] updateAppComponent', () => {
    it('Sollte die Datei "app.component.ts" angepasst haben', (done) => {
      appTree.overwrite(
        (testOptions.path ? testOptions.path : '') + `/src/app/app.component.ts`,
        `
import { Version } from './../../src-gen/bsclient/model/version';
import { AccountFacadeService } from './../../src-gen/bsclient/api/accountFacade.service';
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { LuxAppFooterLinkService, LuxAppFooterLinkInfo, LuxThemeService } from '@ihk-gfi/lux-components';
import { FeedbackService } from './components/feedback/feedback.service';
import { SharedService } from './services/shared.service';

@Component({
  selector   : 'app-root',
  templateUrl: './app.component.html',
  styleUrls  : [ './app.component.scss' ]
})
export class AppComponent implements OnInit {

  luxVersion = '';
  isMaintenanceOrUnauthorized = false;

  constructor(private readonly fachService: AccountFacadeService,
              public router: Router, public window: Window,
              public sharedService: SharedService,
              private linkService: LuxAppFooterLinkService,
              public feedbackService: FeedbackService, private themeService: LuxThemeService) {
    themeService.loadTheme();
    this.isMaintenanceOrUnauthorized = window.location.href.endsWith('/maintenance') || window.location.href.endsWith('/unauthorized');
  }

}

        `
      );

      callRule(updateAppComponent(testOptions), observableOf(appTree), context).subscribe(
        (success) => {
          const content = success.read((testOptions.path ? testOptions.path : '') + `/src/app/app.component.ts`)?.toString();

          expect(content).toContain('private themeService: LuxThemeService, private elementRef: ElementRef, private appService: LuxAppService)');
          expect(content).toContain('import { LuxAppFooterLinkService, LuxAppFooterLinkInfo, LuxThemeService, LuxAppService } from \'@ihk-gfi/lux-components\';');
          expect(content).toContain('import { Component, OnInit, ElementRef, Input } from \'@angular/core\';');
          expect(content).toContain('private elementRef: ElementRef, private appService: LuxAppService) {\n' +
                                    '    this.appService.appEl = elementRef.nativeElement;\n' +
                                    '    themeService.loadTheme();\n' +
                                    '    this.isMaintenanceOrUnauthorized = window.location.href.endsWith(\'/maintenance\') || window.location.href.endsWith(\'/unauthorized\');\n' +
                                    '    router.initialNavigation();\n' +
                                    '  }');

          expect(content).toContain('@Input() luxAppHeader: \'normal\' | \'minimal\' | \'none\' = \'normal\';');
          expect(content).toContain('@Input() luxAppFooter: \'normal\' | \'minimal\' | \'none\' = \'normal\';');
          expect(content).toContain('@Input() luxMode: \'stand-alone\' | \'portal\' = \'stand-alone\';');

          done();
        },
        (reason) => expect(reason).toBeUndefined()
      );
    });
  });

  describe('[Rule] updatePackageJson', () => {
    it('Sollte die Datei "package.json" (ohne skripte)  angepasst haben', (done) => {
      appTree.overwrite(
        `package.json`,
        `

        `
      );

      callRule(updatePackageJson(testOptions), observableOf(appTree), context).subscribe(
        (success) => {
          const content = success.read(`package.json`)?.toString();

          expect(content).toContain('"build-aot": "node --max_old_space_size=4024 ./node_modules/@angular/cli/bin/ng build --aot --single-bundle --output-hashing none && npm run move-de-files"');
          expect(content).toContain('"buildzentral": "node --max_old_space_size=4024 ./node_modules/@angular/cli/bin/ng build --prod --single-bundle --output-hashing none --plugin @ihk-gfi/lux-components/ie11-lazy-modules-plugin.js && npm run move-de-files"');

          expect(content).toContain('"@webcomponents/webcomponentsjs"');
          expect(content).toContain('"ngx-build-plus"');
          expect(content).toContain('"@angular/elements"');
          expect(content).toContain('"replace-in-file"');
          done();
        },
        (reason) => expect(reason).toBeUndefined()
      );
    });

    it('Sollte die Datei "package.json" (mit skripte)  angepasst haben', (done) => {
      appTree.overwrite(
        `package.json`,
        `
{
  "name": "bar",
  "version": "0.0.1",
  "license": "MIT",
  "scripts": {
    "ng": "ng",
    "start": "ng serve --public-host=http://localhost:4200",
    "build": "node --max_old_space_size=4024 ./node_modules/@angular/cli/bin/ng build --source-map",
    "build-aot": "node --max_old_space_size=4024 ./node_modules/@angular/cli/bin/ng build --aot && npm run move-de-files",
    "buildzentral": "node --max_old_space_size=4024 ./node_modules/@angular/cli/bin/ng build --prod && npm run move-de-files",
  },
  "private": true,
  "dependencies": {
  },
  "devDependencies": {
  }
}

        `
      );

      callRule(updatePackageJson(testOptions), observableOf(appTree), context).subscribe(
        (success) => {
          const content = success.read(`package.json`)?.toString();

          expect(content).toContain('"build-aot": "node --max_old_space_size=4024 ./node_modules/@angular/cli/bin/ng build --aot --single-bundle --output-hashing none && npm run move-de-files"');
          expect(content).toContain('"buildzentral": "node --max_old_space_size=4024 ./node_modules/@angular/cli/bin/ng build --prod --single-bundle --output-hashing none --plugin @ihk-gfi/lux-components/ie11-lazy-modules-plugin.js && npm run move-de-files"');

          expect(content).toContain('"@webcomponents/webcomponentsjs"');
          expect(content).toContain('"ngx-build-plus"');
          expect(content).toContain('"@angular/elements"');
          expect(content).toContain('"replace-in-file"');
          done();
        },
        (reason) => expect(reason).toBeUndefined()
      );
    });
  });

  describe('[Rule] updateAppRoutingModule', () => {
    it('Sollte die Datei "app-routing.module.ts"  angepasst haben', (done) => {
      appTree.create(
        (testOptions.path ? testOptions.path : '') + `/src/app/app-routing.module.ts`,
        `
const routes: Routes = [
  {path: '', component: HomeComponent},
  {path: 'impressum', component: ImpressumComponent},
  {path: 'anbindung', loadChildren: () => import('app/components/anbindung/anbindung.module').then(m => m.AnbindungModule)},
  {path: 'information', loadChildren: () => import('app/components/info/info.module').then(m => m.InfoModule)},
  {path: '**', component: ErrorComponent} // Immer als letzte Route !! -> 404!
];

        `
      );

      callRule(updateAppRoutingModule(testOptions), observableOf(appTree), context).subscribe(
        (success) => {
          const content = success.read((testOptions.path ? testOptions.path : '') + `/src/app/app-routing.module.ts`)?.toString();

          expect(content).not.toContain('import(\'app/');
          expect(content).toContain('import(\'./');

          done();
        },
        (reason) => expect(reason).toBeUndefined()
      );
    });

    it('Sollte die Datei "app-routing.module.ts" (Doppelte Anführungszeichen) angepasst haben', (done) => {
      appTree.create(
        (testOptions.path ? testOptions.path : '') + `/src/app/app-routing.module.ts`,
        `
const routes: Routes = [
  {path: '', component: HomeComponent},
  {path: 'impressum', component: ImpressumComponent},
  {path: 'anbindung', loadChildren: () => import("app/components/anbindung/anbindung.module").then(m => m.AnbindungModule)},
  {path: 'information', loadChildren: () => import("app/components/info/info.module").then(m => m.InfoModule)},
  {path: '**', component: ErrorComponent} // Immer als letzte Route !! -> 404!
];

        `
      );

      callRule(updateAppRoutingModule(testOptions), observableOf(appTree), context).subscribe(
        (success) => {
          const content = success.read((testOptions.path ? testOptions.path : '') + `/src/app/app-routing.module.ts`)?.toString();

          expect(content).not.toContain('import("app/');
          expect(content).toContain('import("./');

          done();
        },
        (reason) => expect(reason).toBeUndefined()
      );
    });
  });

  describe('[Rule] updateAngularJson', () => {
    it('Sollte die Datei "angular.json"  angepasst haben', (done) => {
      appTree.overwrite(
        `angular.json`,
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
              {
                "glob": "*.css",
                "input": "./node_modules/@ihk-gfi/lux-components-theme/prebuilt-themes",
                "output": "./assets/themes"
              },
              "src/assets",
              {
                "glob": "**/*",
                "input": "./node_modules/pdfjs-dist/cmaps/",
                "output": "./assets/cmaps"
              }
            ],
            "styles": [
              "src/styles.scss"
            ],
            "scripts": [],
            "allowedCommonJsDependencies": [
              "hammerjs",
              "ng2-pdf-viewer"
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
            },
            "en": {
              "browserTarget": "lux-bp:build:en"
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
              "src/styles.scss"
            ],
            "assets": [
              {
                "glob": "*.css",
                "input": "./node_modules/@ihk-gfi/lux-components-theme/prebuilt-themes",
                "output": "./assets/themes"
              },
              "src/assets",
              {
                "glob": "**/*",
                "input": "./node_modules/pdfjs-dist/cmaps/",
                "output": "./assets/cmaps"
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
      },
      "i18n": {
        "sourceLocale": {
          "code": "de",
          "baseHref": "/"
        },
        "locales": {
          "en": "src/locale/messages.en.xlf"
        }
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
  },
  "cli": {
    "defaultCollection": "@angular-eslint/schematics"
  }
}

        `
      );

      callRule(updateAngularJson(testOptions), observableOf(appTree), context).subscribe(
        (success) => {
          const content = success.read(`angular.json`)?.toString();

          expect(content).toContain('"scripts": [\n' +
                                    '              {\n' +
                                    '                "bundleName": "polyfill-webcomp",\n' +
                                    '                "input": "node_modules/@webcomponents/webcomponentsjs/bundles/webcomponents-sd-ce-pf.js"\n' +
                                    '              },\n' +
                                    '              {\n' +
                                    '                "bundleName": "polyfill-webcomp-es5",\n' +
                                    '                "input": "node_modules/@webcomponents/webcomponentsjs/custom-elements-es5-adapter.js"\n' +
                                    '              }\n' +
                                    '            ]');

          expect(content).not.toContain('@angular-devkit/build-angular:browser');
          expect(content).toContain('ngx-build-plus:browser');
          expect(content).not.toContain('@angular-devkit/build-angular:dev-server');
          expect(content).toContain('ngx-build-plus:dev-server');
          expect(content).not.toContain('@angular-devkit/build-angular:karma');
          expect(content).toContain('ngx-build-plus:karma');

          done();
        },
        (reason) => expect(reason).toBeUndefined()
      );
    });
  });

  describe('[Rule] updateAppModule', () => {
    it('Sollte die Datei "app.module.ts" (ohne Konstruktor) angepasst haben', (done) => {
      appTree.overwrite(
        (testOptions.path ? testOptions.path : '') + `/src/app/app.module.ts`,
        `
import { AppRoutingModule } from './app-routing.module';
import { NgModule, ErrorHandler } from '@angular/core';
import { AppComponent } from './app.component';       
        
export class AppModule {

}
        `
      );

      callRule(updateAppModule(testOptions), observableOf(appTree), context).subscribe(
        (success) => {
          const content = success.read((testOptions.path ? testOptions.path : '') + `/src/app/app.module.ts`)?.toString();

          expect(content).toContain('import { createCustomElement } from \'@angular/elements\';');
          expect(content).toContain('export class AppModule implements DoBootstrap');
          expect(content).toContain('constructor(private injector: Injector) {}');

          done();
        },
        (reason) => expect(reason).toBeUndefined()
      );
    });

    it('Sollte die Datei "app.module.ts" (mit Konstruktor - ohne Parameter) angepasst haben', (done) => {
      appTree.overwrite(
        (testOptions.path ? testOptions.path : '') + `/src/app/app.module.ts`,
        `
import { AppRoutingModule } from './app-routing.module';
import { NgModule, ErrorHandler } from '@angular/core';
import { AppComponent } from './app.component';       
        
export class AppModule {

  constructor() {}

}
        `
      );

      callRule(updateAppModule(testOptions), observableOf(appTree), context).subscribe(
        (success) => {
          const content = success.read((testOptions.path ? testOptions.path : '') + `/src/app/app.module.ts`)?.toString();

          expect(content).toContain('import { createCustomElement } from \'@angular/elements\';');
          expect(content).toContain('export class AppModule implements DoBootstrap');
          expect(content).toContain('constructor(private injector: Injector) {}');

          done();
        },
        (reason) => expect(reason).toBeUndefined()
      );
    });

    it('Sollte die Datei "app.module.ts" (mit Konstruktor - mit Parameter) angepasst haben', (done) => {
      appTree.overwrite(
        (testOptions.path ? testOptions.path : '') + `/src/app/app.module.ts`,
        `
import { AppRoutingModule } from './app-routing.module';
import { NgModule, ErrorHandler } from '@angular/core';
import { AppComponent } from './app.component';       
        
export class AppModule {

  constructor(private aaa: Aaa) {}
  
  ngOnInit() {
  }
}
        `
      );

      callRule(updateAppModule(testOptions), observableOf(appTree), context).subscribe(
        (success) => {
          const content = success.read((testOptions.path ? testOptions.path : '') + `/src/app/app.module.ts`)?.toString();

          expect(content).toContain('import { createCustomElement } from \'@angular/elements\';');
          expect(content).toContain('export class AppModule implements DoBootstrap');
          expect(content).toContain('constructor(private aaa: Aaa, private injector: Injector) {}');

          done();
        },
        (reason) => expect(reason).toBeUndefined()
      );
    });

    it('Sollte die Datei "app.module.ts" (bootstrap entfernen - schema hinzufügen) angepasst haben', (done) => {
      appTree.overwrite(
        (testOptions.path ? testOptions.path : '') + `/src/app/app.module.ts`,
        `
import { AppRoutingModule } from './app-routing.module';
import { NgModule, ErrorHandler } from '@angular/core';
import { AppComponent } from './app.component';       
        
@NgModule({
  declarations   : [
    AppComponent
  ],
  imports        : [
    HttpClientModule
  ],
    entryComponents: [
    LuxSnackbarComponent,
    LuxFilePreviewComponent
  ],
  providers      : [
    LuxDialogService,
    DatePipe,
    { provide: Window, useValue: window }
  ],
  bootstrap      : [
    AppComponent
  ]
})
export class AppModule {

  constructor(private aaa: Aaa) {}
  
  ngOnInit() {
  }
}
        `
      );

      callRule(updateAppModule(testOptions), observableOf(appTree), context).subscribe(
        (success) => {
          const content = success.read((testOptions.path ? testOptions.path : '') + `/src/app/app.module.ts`)?.toString();

          expect(content).toContain('schemas: [CUSTOM_ELEMENTS_SCHEMA]');
          expect(content).not.toContain('bootstrap      :');

          done();
        },
        (reason) => expect(reason).toBeUndefined()
      );
    });
  });

  describe('[Rule] updateIndexHtml', () => {
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

      const newTestOptions = JSON.parse(JSON.stringify(testOptions));
      newTestOptions.project = 'Ka-74öäü';

      callRule(updateIndexHtml(newTestOptions), observableOf(appTree), context).subscribe(
        (success) => {
          const content = success.read('src/index.html')?.toString();

          expect(content).not.toContain('<app-root></app-root>');
          expect(content).toContain('<lux-ka></lux-ka>');

          done();
        },
        (reason) => expect(reason).toBeUndefined()
      );
    });
  });

  describe('[Rule] updateAppComponentHtml', () => {
    it('Sollte die Datei "app.component.html" angepasst haben', (done) => {
      appTree.overwrite(
        testOptions.path + '/src/app/app.component.html',
        `
<lux-app-header luxAppTitle="LUX Blueprint" luxAppTitleShort="LUX" 
  luxUserName="{{sharedService.getBenutzernameAsObservable() | async}}">
</lux-app-header>

<lux-app-header-right-nav *ngIf="(sharedService.isLoggedInAsObservable() | async)">
    <lux-menu-item luxIconName="fa-power-off" luxLabel="Abmelden"
                   (luxClicked)="sharedService.logout(true)"></lux-menu-item>
</lux-app-header-right-nav>

<lux-app-content></lux-app-content>

<lux-app-footer *ngIf="this.luxAppFooter !== 'none'" luxVersion="{{luxVersion}}">
</lux-app-footer>
        `
      );

      callRule(updateAppComponentHtml(testOptions), observableOf(appTree), context).subscribe(
        (success) => {
          const content = success.read(testOptions.path + '/src/app/app.component.html')?.toString();

          expect(content).toContain('*ngIf="this.luxAppHeader !== \'none\'"');
          expect(content).toContain('*ngIf="(sharedService.isLoggedInAsObservable() | async) && luxMode === \'stand-alone\'"');
          expect(content).toContain('*ngIf="this.luxAppFooter !== \'none\'"');
          expect(content).toContain('<lux-app-content></lux-app-content>');
          expect(content).not.toContain('<lux-app-content/>');

          done();
        },
        (reason) => expect(reason).toBeUndefined()
      );
    });
  });

  describe('[Rule] createWebpackConfigJs', () => {
    it('Sollte die Datei "webpack.config.js" angelegt haben', (done) => {

      callRule(createWebpackConfigJs(testOptions), observableOf(appTree), context).subscribe(
        (success) => {
          const content = success.read('webpack.config.js')?.toString();

          expect(content).toContain(`
module.exports = {
  output: {
    jsonpFunction: 'jsonpFunctionBar'
  }
};`);

          done();
        },
        (reason) => expect(reason).toBeUndefined()
      );
    });
  });

});
