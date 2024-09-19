import { callRule, SchematicContext } from '@angular-devkit/schematics';
import { SchematicTestRunner, UnitTestTree } from '@angular-devkit/schematics/testing';
import * as path from 'path';
import { of as observableOf } from 'rxjs';
import { getPackageJsonDependency } from '../../utility/dependencies';
import { appOptions, workspaceOptions } from '../../utility/test';
import { UtilConfig } from '../../utility/util';
import { update160600 } from './index';

describe('update160600', () => {
  let appTree: UnitTestTree;
  let runner: SchematicTestRunner;
  let context: SchematicContext;

  const testOptions: any = {};

  beforeEach(async () => {
    const collectionPath = path.join(__dirname, '../../collection.json');
    runner = new SchematicTestRunner('schematics', collectionPath);

    const collection = '@schematics/angular';
    appTree = await runner.runExternalSchematic(collection, 'workspace', workspaceOptions);
    appTree = await runner.runExternalSchematic(collection, 'application', appOptions, appTree);

    context = runner.engine.createContext(runner.engine.createSchematic('update-16.6.0', runner.engine.createCollection(collectionPath)));

    UtilConfig.defaultWaitMS = 0;

    testOptions.project = appOptions.name;
    testOptions.path = workspaceOptions.newProjectRoot + '/' + appOptions.name;
    testOptions.verbose = true;
  });

  describe('[Rule] update160600', () => {
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
                "@angular/animations": "16.2.12",
                "@angular/cdk": "16.2.12",
                "@angular/common": "16.2.12",
                "@ihk-gfi/lux-components": "16.1.0",
                "@ihk-gfi/lux-components-theme": "16.0.1",
                "@angular/compiler": "16.2.12",
                "@ihk-gfi/lux-components-icons-and-fonts": "1.8.0",
                "dompurify": "2.3.7"
              },
              "devDependencies": {
                "@angular-devkit/build-angular": "16.2.12",
                "@angular-eslint/builder": "16.3.1",
                "@angular/cli": "16.2.12",
              }
            }
        `
      );

      callRule(update160600(testOptions), observableOf(appTree), context).subscribe(
        () => {
          expect(getPackageJsonDependency(appTree, '@ihk-gfi/lux-components').version).not.toEqual('16.1.0');
          expect(getPackageJsonDependency(appTree, '@ihk-gfi/lux-components').version).toEqual('16.6.0');

          expect(getPackageJsonDependency(appTree, 'dompurify').version).not.toEqual('2.3.7');
          expect(getPackageJsonDependency(appTree, 'dompurify').version).toEqual('~3.1.6');

          expect(getPackageJsonDependency(appTree, '@angular-devkit/build-angular').version).not.toEqual('16.2.12');
          expect(getPackageJsonDependency(appTree, '@angular-devkit/build-angular').version).toEqual('16.2.16');

          expect(getPackageJsonDependency(appTree, '@angular/cli').version).not.toEqual('16.2.12');
          expect(getPackageJsonDependency(appTree, '@angular/cli').version).toEqual('16.2.16');

          done();
        },
        (reason) => expect(reason).toBeUndefined()
      );
    });
  });
});
