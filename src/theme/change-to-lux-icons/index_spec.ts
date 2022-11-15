import { callRule, SchematicContext } from '@angular-devkit/schematics';
import { SchematicTestRunner, UnitTestTree } from '@angular-devkit/schematics/testing';
import { findNodeAtLocation, getNodeValue } from 'jsonc-parser';
import * as path from 'path';
import { of as observableOf } from 'rxjs';
import { readJson } from '../../utility/json';
import { appOptions, workspaceOptions } from '../../utility/test';
import { UtilConfig } from '../../utility/util';
import { changeToLuxIcons, iconAssetBlock } from './index';

describe('update140000', () => {
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
    appTree = await runner.runExternalSchematicAsync(collection, 'workspace', workspaceOptions).toPromise();
    appTree = await runner.runExternalSchematicAsync(collection, 'application', appOptions, appTree).toPromise();

    context = runner.engine.createContext(
      runner.engine.createSchematic('change-to-lux-icons', runner.engine.createCollection(collectionPath))
    );

    UtilConfig.defaultWaitMS = 0;

    testOptions.project = appOptions.name;
    testOptions.path = workspaceOptions.newProjectRoot + '/' + appOptions.name;
    testOptions.verbose = true;
  });

  describe('[Rule] changeToLuxIcons', () => {
    it('Sollte auf die neuen Icons wechseln', (done) => {
      const filePath = testOptions.path + '/changeToLuxIcons/Test.component.html';
      appTree.create(filePath, appComponentHtmlContent);

      callRule(changeToLuxIcons(testOptions), observableOf(appTree), context).subscribe({
        next: (success) => {
          const content = success.read(filePath)?.toString();

          expect(content).toContain('luxIconName="lux-control-button-power-1"');
          expect(content).toContain('luxIconName="lux-factory"');
          expect(content).toContain('luxIconName="lux-interface-alert-alarm-bell-2"');
          expect(content).toContain('luxIconName="lux-interface-home-3"');
          expect(content).toContain('luxIconName="lux-interface-lighting-light-bulb"');

          expect(content).not.toContain('luxIconName="fa-power-off"');
          expect(content).not.toContain('luxIconName="far fa-building"');
          expect(content).not.toContain('luxIconName="fas fa-bell"');
          expect(content).not.toContain('luxIconName="fas fa-home"');
          expect(content).not.toContain('luxIconName="far fa-lightbulb"');

          done();
        },
        error: (reason) => expect(reason).toBeUndefined()
      });
    });

    it('Sollte den LUX-Iconpfad in den Assets-Abschnitten ergänzen', (done) => {
      const filePath = './angular.json';
      appTree.overwrite(filePath, angularJsonIconAssets);

      callRule(changeToLuxIcons(testOptions), observableOf(appTree), context).subscribe({
        next: (success) => {
          const assetPath = ['projects', testOptions.project, 'architect', 'build', 'options', 'assets'];
          const node = findNodeAtLocation(readJson(success, filePath), assetPath);
          expect(node).toBeDefined();
          expect(node?.children?.length).toBe(3);
          expect(JSON.stringify(getNodeValue(node!.children![2]))).toBe(JSON.stringify(iconAssetBlock));

          const testAssetPath = ['projects', testOptions.project, 'architect', 'test', 'options', 'assets'];
          const testNode = findNodeAtLocation(readJson(success, filePath), testAssetPath);
          expect(testNode).toBeDefined();
          expect(testNode?.children?.length).toBe(3);
          expect(JSON.stringify(getNodeValue(testNode!.children![2]))).toBe(JSON.stringify(iconAssetBlock));

          done();
        },
        error: (reason) => expect(reason).toBeUndefined()
      });
    });
  });
});

const appComponentHtmlContent = `
<div class="lux-app-container">
  <lux-app-header
    luxAppTitle="LUX Components"
    luxAppTitleShort="Components"
    luxUserName="Max Mustermann"
    luxIconName="far fa-lightbulb"
    luxImageSrc="assets/png/example.png"
    luxAriaTitleIconLabel="Titelicon  / Zur Hauptseie"
    luxAriaTitleImageLabel="Titelbild  / Zur Hauptseie"
    luxAriaTitleLinkLabel="LUX Components / Zur Hauptseie"
    [luxLocaleSupported]="['de', 'en']"
    *ngIf="this.luxAppHeader !== 'none' && themeName !== 'authentic'"
    (luxClicked)="router.navigate(['/'])"
  >
    <lux-side-nav
      luxDashboardLink="https://github.com/IHK-GfI/lux-components/wiki"
      [luxOpenLinkBlank]="true"
      luxSideNavExpandedChange="onSideNavExpandedChange($event)"
      [luxSideNavExpandedChange]="onSideNavExpandedChange($event)"
      (luxSideNavExpandedChange)="onSideNavExpandedChange($event)"
      [(luxSideNavExpandedChange)]="onSideNavExpandedChange($event)"
    >
      <lux-side-nav-header>
        <h3 class="lux-side-nav-header-greeting">Navigation</h3>
      </lux-side-nav-header>
      <lux-side-nav-item
        luxLabel="Home"
        luxIconName="fas fa-home"
        (luxClicked)="goToHome()"
        luxTagId="home-side-nav-item"
        [luxSelected]="url.endsWith('home')"
      >
      </lux-side-nav-item>
      <lux-side-nav-footer>
        <div fxLayout="row" fxLayoutAlign="center center" fxLayoutGap="8px">
          <lux-button luxLabel="Aufklappen" [luxRaised]="true" (luxClicked)="navigationService.onExpandAll()"></lux-button>
        </div>
      </lux-side-nav-footer>
    </lux-side-nav>
    <lux-app-header-action-nav>
      <lux-app-header-action-nav-item
        fxShow="true" fxShow.xs="false"
        luxIconName="fas fa-bell"
        luxColor="accent"
        luxAriaLabel="Nachrichten anzeigen"
        luxTagId="action0"
        (luxClicked)="actionClicked('#0 Action clicked!')"
      >
      </lux-app-header-action-nav-item>
      <lux-app-header-action-nav-item>
        <lux-app-header-action-nav-item-custom>
          <lux-menu luxMenuLabel="IHK" luxMenuIconName="fas fa-caret-down" [luxMenuTriggerIconShowRight]="true" [luxDisplayExtended]="false">
            <lux-menu-item luxLabel="IHK 101" luxIconName="far fa-building" (luxClicked)="actionClicked('IHK 101-Action clicked!')"></lux-menu-item>
          </lux-menu>
        </lux-app-header-action-nav-item-custom>
      </lux-app-header-action-nav-item>
    </lux-app-header-action-nav>
    <lux-app-header-right-nav>
      <lux-menu-item luxLabel="Abmelden" luxIconName="fa-power-off" luxTagId="abmelden-menu-item"></lux-menu-item>
    </lux-app-header-right-nav>
  </lux-app-header>
`;

const angularJsonIconAssets = `
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
            "localize": [
              "de"
            ],
            "i18nMissingTranslation": "error",
            "assets": [
              "src/assets",
              "src/favicon.ico"
            ],
            "styles": [
              "src/styles.scss"
            ]
          },
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
              "src/favicon.ico"
            ]
          }
        }
      }
    }
  }
}
`;
