import { callRule, SchematicContext } from '@angular-devkit/schematics';
import { SchematicTestRunner, UnitTestTree } from '@angular-devkit/schematics/testing';
import * as path from 'path';
import { of as observableOf } from 'rxjs';
import { getPackageJsonDependency, hasPackageJsonDependency, updateDependency } from '../utility/dependencies';
import { appOptions, workspaceOptions } from '../utility/test';
import { UtilConfig } from '../utility/util';
import { update110700 } from './index';

const collectionPath = path.join(__dirname, '../collection.json');

describe('update110700', () => {
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
    const schematic = runner.engine.createSchematic('update-11.7.0', collection);
    context = runner.engine.createContext(schematic);

    testOptions.project = appOptions.name;
    testOptions.path = workspaceOptions.newProjectRoot + '/' + appOptions.name;
    testOptions.verbose = true;
  });

  describe('[Rule] update110700', () => {
    it('Sollte die Abhängigkeiten mit ESLint aktualisieren', (done) => {
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
                    "@angular-devkit/build-angular": "0.1102.14",
                    "@angular-eslint/builder": "4.0.0",
                    "@angular-eslint/eslint-plugin": "4.0.0",
                    "@angular-eslint/eslint-plugin-template": "4.0.0",
                    "@angular-eslint/schematics": "4.0.0",
                    "@angular-eslint/template-parser": "4.0.0",
              }
            }
        `
      );

      callRule(update110700(testOptions), observableOf(appTree), context).subscribe(
        () => {
          expect(getPackageJsonDependency(appTree, '@ihk-gfi/lux-components').version).toEqual('11.7.0');
          expect(getPackageJsonDependency(appTree, '@ihk-gfi/lux-components-theme').version).toEqual('11.9.0');
          expect(getPackageJsonDependency(appTree, '@angular-devkit/build-angular').version).toEqual('0.1102.17');
          expect(getPackageJsonDependency(appTree, '@angular/cli').version).toEqual('11.2.17');
          expect(getPackageJsonDependency(appTree, '@angular-eslint/builder').version).toEqual('4.3.1');
          expect(getPackageJsonDependency(appTree, '@angular-eslint/eslint-plugin').version).toEqual('4.3.1');
          expect(getPackageJsonDependency(appTree, '@angular-eslint/eslint-plugin-template').version).toEqual('4.3.1');
          expect(getPackageJsonDependency(appTree, '@angular-eslint/schematics').version).toEqual('4.3.1');
          expect(getPackageJsonDependency(appTree, '@angular-eslint/template-parser').version).toEqual('4.3.1');

          done();
        },
        (reason) => expect(reason).toBeUndefined()
      );
    });

    it('Sollte die Abhängigkeiten ohne ESLint aktualisieren', (done) => {
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
                    "@angular-devkit/build-angular": "0.1102.14",
              }
            }
        `
      );

      callRule(update110700(testOptions), observableOf(appTree), context).subscribe(
        () => {
          expect(getPackageJsonDependency(appTree, '@ihk-gfi/lux-components').version).toEqual('11.7.0');
          expect(getPackageJsonDependency(appTree, '@ihk-gfi/lux-components-theme').version).toEqual('11.9.0');
          expect(getPackageJsonDependency(appTree, '@angular-devkit/build-angular').version).toEqual('0.1102.17');
          expect(getPackageJsonDependency(appTree, '@angular/cli').version).toEqual('11.2.17');
          expect(hasPackageJsonDependency(appTree, '@angular-eslint/builder')).toBeUndefined();
          expect(hasPackageJsonDependency(appTree, '@angular-eslint/eslint-plugin')).toBeUndefined();
          expect(hasPackageJsonDependency(appTree, '@angular-eslint/eslint-plugin-template')).toBeUndefined();
          expect(hasPackageJsonDependency(appTree, '@angular-eslint/schematics')).toBeUndefined();
          expect(hasPackageJsonDependency(appTree, '@angular-eslint/template-parser')).toBeUndefined();

          done();
        },
        (reason) => expect(reason).toBeUndefined()
      );
    });
  });
});
