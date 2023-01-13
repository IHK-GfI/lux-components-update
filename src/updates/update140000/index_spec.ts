import { callRule, SchematicContext } from '@angular-devkit/schematics';
import { SchematicTestRunner, UnitTestTree } from '@angular-devkit/schematics/testing';
import { findNodeAtLocation, getNodeValue } from 'jsonc-parser';
import * as path from 'path';
import { of as observableOf } from 'rxjs';
import { readJson } from '../../utility/json';
import { appOptions, workspaceOptions } from '../../utility/test';
import { UtilConfig } from '../../utility/util';
import { addIconAssets, iconAssetBlock, renameLuxSelectedFiles } from './index';

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
      runner.engine.createSchematic('update', runner.engine.createCollection(collectionPath))
    );

    UtilConfig.defaultWaitMS = 0;

    testOptions.project = appOptions.name;
    testOptions.path = workspaceOptions.newProjectRoot + '/' + appOptions.name;
    testOptions.verbose = true;
  });

  describe('[Rule] addIconAssets', () => {
    it('Sollte den LUX-Iconpfad in den Assets-Abschnitten ergänzen', (done) => {
      const filePath = './angular.json';
      appTree.overwrite(filePath, angularJsonIconAssets);

      callRule(addIconAssets(testOptions), observableOf(appTree), context).subscribe({
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

  describe('[Rule] renameLuxSelectedFiles', () => {
    it('Sollte das Attribut "luxSelectedFiles" in "luxSelected" umbenennen', (done) => {
      const filePath = testOptions.path + '/renameLuxSelectedFiles/Test.component.html';
      appTree.create(filePath, renameLuxSelectedFilesContent);

      callRule(renameLuxSelectedFiles(testOptions), observableOf(appTree), context).subscribe({
        next: (success) => {
          const content = success.read(filePath)?.toString();

          expect(content).toContain('<lux-file-input luxSelected="selected" (luxSelectedChange)="onSelected()"></lux-file-input>');
          expect(content).toContain('<lux-file-input [luxSelected]="selected" (luxSelectedChange)="onSelected()"></lux-file-input>');
          expect(content).toContain('<lux-file-input [(luxSelected)]="selected"></lux-file-input>');

          expect(content).toContain('<lux-file-list luxSelected="selected" (luxSelectedChange)="onSelected()"></lux-file-list>');
          expect(content).toContain('<lux-file-list [luxSelected]="selected" (luxSelectedChange)="onSelected()"></lux-file-list>');
          expect(content).toContain('<lux-file-list [(luxSelected)]="selected"></lux-file-list>');

          expect(content).toContain('<lux-file-upload luxSelected="selected" (luxSelectedChange)="onSelected()"></lux-file-upload>');
          expect(content).toContain('<lux-file-upload [luxSelected]="selected" (luxSelectedChange)="onSelected()"></lux-file-upload>');
          expect(content).toContain('<lux-file-upload [(luxSelected)]="selected"></lux-file-upload>');
          done();
        },
        error: (reason) => expect(reason).toBeUndefined()
      });
    });
  });
});

const renameLuxSelectedFilesContent = `
<lux-file-input luxSelectedFiles="selected" (luxSelectedFilesChange)="onSelected()"></lux-file-input>
<lux-file-input [luxSelectedFiles]="selected" (luxSelectedFilesChange)="onSelected()"></lux-file-input>
<lux-file-input [(luxSelectedFiles)]="selected"></lux-file-input>

<lux-file-list luxSelectedFiles="selected" (luxSelectedFilesChange)="onSelected()"></lux-file-list>
<lux-file-list [luxSelectedFiles]="selected" (luxSelectedFilesChange)="onSelected()"></lux-file-list>
<lux-file-list [(luxSelectedFiles)]="selected"></lux-file-list>

<lux-file-upload luxSelectedFiles="selected" (luxSelectedFilesChange)="onSelected()"></lux-file-upload>
<lux-file-upload [luxSelectedFiles]="selected" (luxSelectedFilesChange)="onSelected()"></lux-file-upload>
<lux-file-upload [(luxSelectedFiles)]="selected"></lux-file-upload>
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
