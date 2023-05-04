import { callRule, SchematicContext } from '@angular-devkit/schematics';
import { SchematicTestRunner, UnitTestTree } from '@angular-devkit/schematics/testing';
import * as path from 'path';
import { of as observableOf } from 'rxjs';
import { getPackageJsonDependency } from '../../utility/dependencies';
import { appOptions, workspaceOptions } from '../../utility/test';
import { UtilConfig } from '../../utility/util';
import { update140500 } from './index';

const collectionPath = path.join(__dirname, '../../collection.json');

describe('update140500', () => {
  let appTree: UnitTestTree;
  let runner: SchematicTestRunner;
  let context: SchematicContext;

  const testOptions: any = {};

  beforeEach(async () => {
    runner = new SchematicTestRunner('schematics', collectionPath);

    appTree = await runner.runExternalSchematicAsync('@schematics/angular', 'workspace', workspaceOptions).toPromise();
    appTree = await runner.runExternalSchematicAsync('@schematics/angular', 'application', appOptions, appTree).toPromise();

    UtilConfig.defaultWaitMS = 0;

    const collection = runner.engine.createCollection(collectionPath);
    const schematic = runner.engine.createSchematic('update-14.5.0', collection);
    context = runner.engine.createContext(schematic);

    testOptions.project = appOptions.name;
    testOptions.path = workspaceOptions.newProjectRoot + '/' + appOptions.name;
    testOptions.verbose = true;
  });

  describe('[Rule] update140500', () => {
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
                "@ihk-gfi/lux-components": "14.4.0",
                "@ihk-gfi/lux-components-theme": "14.5.0",
                "@angular/compiler": "14.3.7",
                "@ihk-gfi/lux-components-icons-and-fonts": "1.4.0"
              },
              "devDependencies": {
                "@angular-devkit/build-angular": "14.3.5",
                "@angular-eslint/builder": "14.2.1"
              }
            }
        `
      );

      callRule(update140500(testOptions), observableOf(appTree), context).subscribe(
        () => {
          expect(getPackageJsonDependency(appTree, '@ihk-gfi/lux-components').version).not.toEqual('14.4.0');
          expect(getPackageJsonDependency(appTree, '@ihk-gfi/lux-components').version).toEqual('14.5.0');

          expect(getPackageJsonDependency(appTree, '@ihk-gfi/lux-components-theme').version).not.toEqual('14.5.0');
          expect(getPackageJsonDependency(appTree, '@ihk-gfi/lux-components-theme').version).toEqual('14.6.0');
          done();
        },
        (reason) => expect(reason).toBeUndefined()
      );
    });
  });
});
