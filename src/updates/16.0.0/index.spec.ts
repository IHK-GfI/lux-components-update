import { callRule, SchematicContext } from '@angular-devkit/schematics';
import { SchematicTestRunner, UnitTestTree } from '@angular-devkit/schematics/testing';
import * as path from 'path';
import { of as observableOf } from 'rxjs';
import { updateDependencies } from '../../update-dependencies';
import { getPackageJsonDependency } from '../../utility/dependencies';
import { appOptions, workspaceOptions } from '../../utility/test';
import { UtilConfig } from '../../utility/util';

describe('update160000', () => {
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

    context = runner.engine.createContext(runner.engine.createSchematic('update-16.0.0', runner.engine.createCollection(collectionPath)));

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
                "@ihk-gfi/lux-components": "15.5.1",
                "@ihk-gfi/lux-components-theme": "15.4.0",
                "@ihk-gfi/lux-components-icons-and-fonts": "1.6.0",
                "@angular/compiler": "14.3.7"
              },
              "devDependencies": {
                "@angular-devkit/build-angular": "15.3.5",
                "@angular-eslint/builder": "15.2.1"
              }
            }
        `
      );

      callRule(updateDependencies(), observableOf(appTree), context).subscribe({
        next: () => {
          expect(getPackageJsonDependency(appTree, '@ihk-gfi/lux-components').version).not.toEqual('15.5.1');
          expect(getPackageJsonDependency(appTree, '@ihk-gfi/lux-components').version).toEqual('16.0.0');

          expect(getPackageJsonDependency(appTree, '@ihk-gfi/lux-components-icons-and-fonts').version).not.toEqual('1.6.0');
          expect(getPackageJsonDependency(appTree, '@ihk-gfi/lux-components-icons-and-fonts').version).toEqual('1.8.0');

          expect(getPackageJsonDependency(appTree, '@ihk-gfi/lux-components-theme').version).not.toEqual('15.4.0');
          expect(getPackageJsonDependency(appTree, '@ihk-gfi/lux-components-theme').version).toEqual('16.0.0');
          done();
        },
        error: (reason) => expect(reason).toBeUndefined()
      });
    });
  });
});
