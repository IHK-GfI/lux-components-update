import { callRule, SchematicContext } from '@angular-devkit/schematics';
import { SchematicTestRunner, UnitTestTree } from '@angular-devkit/schematics/testing';
import * as path from 'path';
import { of as observableOf } from 'rxjs';
import { getPackageJsonDependency } from '../../utility/dependencies';
import { appOptions, workspaceOptions } from '../../utility/test';
import { UtilConfig } from '../../utility/util';
import { update130200 } from './index';

const collectionPath = path.join(__dirname, '../../collection.json');

describe('update130200', () => {
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
    const schematic = runner.engine.createSchematic('update-13.2.0', collection);
    context = runner.engine.createContext(schematic);

    testOptions.project = appOptions.name;
    testOptions.path = workspaceOptions.newProjectRoot + '/' + appOptions.name;
    testOptions.verbose = true;
  });

  describe('[Rule] update130200', () => {
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
                "@ihk-gfi/lux-components": "13.1.0",
                "@angular/animations": "13.3.7",
                "@angular/cdk": "13.3.7",
                "@angular/common": "13.3.7",
                "@angular/compiler": "13.3.7",
                "@angular/core": "13.3.7",
                "@angular/forms": "13.3.7",
                "@angular/localize": "13.3.7",
                "@angular/material": "13.3.7",
                "@angular/platform-browser": "13.3.7",
                "@angular/platform-browser-dynamic": "13.3.7",
                "@angular/router": "13.3.7"
              },
              "devDependencies": {
                "@angular-devkit/build-angular": "13.3.5",
                "@angular-eslint/builder": "13.2.1",
                "@angular-eslint/eslint-plugin": "13.2.1",
                "@angular-eslint/eslint-plugin-template": "13.2.1",
                "@angular-eslint/schematics": "13.2.1",
                "@angular-eslint/template-parser": "13.2.1",
                "@angular/cli": "13.3.5",
                "@angular/compiler-cli": "13.3.7",
                "@angular/elements": "13.3.7",
                "@angular/language-service": "13.3.7"
              }
            }
        `
      );

      callRule(update130200(testOptions), observableOf(appTree), context).subscribe(
        () => {
          expect(getPackageJsonDependency(appTree, '@ihk-gfi/lux-components').version).toEqual('13.2.0');
          expect(getPackageJsonDependency(appTree, '@angular-devkit/build-angular').version).toEqual('13.3.9');
          expect(getPackageJsonDependency(appTree, '@angular-eslint/builder').version).toEqual('13.5.0');
          expect(getPackageJsonDependency(appTree, '@angular-eslint/eslint-plugin').version).toEqual('13.5.0');
          expect(getPackageJsonDependency(appTree, '@angular-eslint/eslint-plugin-template').version).toEqual('13.5.0');
          expect(getPackageJsonDependency(appTree, '@angular-eslint/schematics').version).toEqual('13.5.0');
          expect(getPackageJsonDependency(appTree, '@angular-eslint/template-parser').version).toEqual('13.5.0');
          expect(getPackageJsonDependency(appTree, '@angular/animations').version).toEqual('13.3.11');
          expect(getPackageJsonDependency(appTree, '@angular/cdk').version).toEqual('13.3.9');
          expect(getPackageJsonDependency(appTree, '@angular/cli').version).toEqual('13.3.9');
          expect(getPackageJsonDependency(appTree, '@angular/common').version).toEqual('13.3.11');
          expect(getPackageJsonDependency(appTree, '@angular/compiler').version).toEqual('13.3.11');
          expect(getPackageJsonDependency(appTree, '@angular/compiler-cli').version).toEqual('13.3.11');
          expect(getPackageJsonDependency(appTree, '@angular/core').version).toEqual('13.3.11');
          expect(getPackageJsonDependency(appTree, '@angular/elements').version).toEqual('13.3.11');
          expect(getPackageJsonDependency(appTree, '@angular/forms').version).toEqual('13.3.11');
          expect(getPackageJsonDependency(appTree, '@angular/language-service').version).toEqual('13.3.11');
          expect(getPackageJsonDependency(appTree, '@angular/localize').version).toEqual('13.3.11');
          expect(getPackageJsonDependency(appTree, '@angular/material').version).toEqual('13.3.9');
          expect(getPackageJsonDependency(appTree, '@angular/platform-browser').version).toEqual('13.3.11');
          expect(getPackageJsonDependency(appTree, '@angular/platform-browser-dynamic').version).toEqual('13.3.11');
          expect(getPackageJsonDependency(appTree, '@angular/router').version).toEqual('13.3.11');
          done();
        },
        (reason) => expect(reason).toBeUndefined()
      );
    });
  });
});
