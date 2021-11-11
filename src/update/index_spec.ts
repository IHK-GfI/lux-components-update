import { callRule, SchematicContext } from '@angular-devkit/schematics';
import { SchematicTestRunner, UnitTestTree } from '@angular-devkit/schematics/testing';
import * as path from 'path';
import { of as observableOf } from 'rxjs';
import { getPackageJsonDependency, NodeDependencyType, updatePackageJsonDependency } from '../utility/dependencies';
import { appOptions, workspaceOptions } from '../utility/test';
import { UtilConfig } from '../utility/util';
import { i18nCopyMessages, update, updateBrowserList, updateMajorVersion } from './index';

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
      updatePackageJsonDependency(appTree, {
        type: NodeDependencyType.Default,
        version: '1.9.3',
        name: '@ihk-gfi/lux-components'
      });
      Object.defineProperty(process.versions, 'node', {
        get: () => '12.16.3'
      });

      callRule(update(testOptions), observableOf(appTree), context).subscribe(
        (success) => {},
        (reason) => expect(reason.toString()).toContain('wird nicht unterstützt.')
      );
    });

    it('Sollte LUX-Components 10 einrichten', (done) => {
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
                "@ihk-gfi/lux-components": "11.5.0"
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

  describe('[Rule] updateBrowserList', () => {
    it('Sollte die alten IE-Versionen (9 und 10) entfernt haben', (done) => {
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

  describe('[Rule] i18nCopyMessages', () => {
    it('Sollte die I18N-Dateien kopieren', (done) => {
      callRule(i18nCopyMessages(testOptions), observableOf(appTree), context).subscribe(
        (success) => {
          expect(success.exists(testOptions.path + '/src/locale/messages.xlf')).toBeTrue();
          expect(success.exists(testOptions.path + '/src/locale/messages.en.xlf')).toBeTrue();
          done();
        },
        (reason) => expect(reason).toBeUndefined()
      );
    });
  });
});
