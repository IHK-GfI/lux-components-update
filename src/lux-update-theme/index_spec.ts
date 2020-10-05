import * as path from 'path';
import { UnitTestTree, SchematicTestRunner } from '@angular-devkit/schematics/testing';
import { SchematicContext, callRule } from '@angular-devkit/schematics';
import { of as observableOf } from 'rxjs';
import { UtilConfig } from '../utility/util';
import { luxUpdateTheme, findThemeDir, normalizeVersion } from './index';
import { appOptions, workspaceOptions } from '../utility/test-helper';

const collectionPath = path.join(__dirname, '../collection.json');

describe('lux-update-theme', () => {
  let appTree: UnitTestTree;
  let runner: SchematicTestRunner;
  let context: SchematicContext;

  const testOptions: any = {};

  beforeAll(async () => {
    runner = new SchematicTestRunner('schematics', collectionPath);

    appTree = await runner.runExternalSchematicAsync('@schematics/angular', 'workspace', workspaceOptions).toPromise();
    appTree = await runner
      .runExternalSchematicAsync('@schematics/angular', 'application', appOptions, appTree)
      .toPromise();
    appTree.create('projects/bar/src/theming/shouldBeDeleted.txt', '---');
    appTree.create('projects/bar/src/theming/_luxfocusable.scss', '---');

    UtilConfig.defaultWaitMS = 0;

    const collection = runner.engine.createCollection(collectionPath);
    const schematic = runner.engine.createSchematic('lux-update-theme', collection);
    context = runner.engine.createContext(schematic);

    testOptions.project = appOptions.name;
    testOptions.path = workspaceOptions.newProjectRoot + '/' + appOptions.name;
  });

  describe('[Rule] copyThemeFiles', () => {
    it('Sollte die richtigen Themedateien kopieren', async (done) => {
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
              "devDependencies": {
                "@ihk-gfi/lux-components": "10.0.0"
              }
            }
        `
      );

      callRule(luxUpdateTheme(testOptions), observableOf(appTree), context).subscribe(
        () => {
          expect(appTree.files).toContain('/projects/bar/src/theming/_luxfocusable.scss');
          expect(appTree.files).toContain('/projects/bar/src/theming/_luxpalette.scss');
          expect(appTree.files).toContain('/projects/bar/src/theming/_luxstyles.scss');
          expect(appTree.files).toContain('/projects/bar/src/theming/luxtheme.scss');
          expect(appTree.files).not.toContain('/projects/bar/src/theming/README.txt');

          done();
        },
        (reason) => expect(reason).toBeUndefined()
      );
    });
  });

  describe('[Utility] findThemeDir', () => {
    it('Sollte den korrekten Themeordner ermitteln', () => {
      expect(findThemeDir(['1.9.4'], '10.0.0')).toEqual('1.9.4');
      expect(findThemeDir(['1.9.4', '10.0.0', '10.0.1'], '10.0.0')).toEqual('10.0.0');
      expect(findThemeDir(['10.0.0', '10.0.1', '10.2.1'], '^10.0.0')).toEqual('10.2.1');
      expect(findThemeDir(['10.0.0', '10.0.1', '10.2.1'], '~10.0.0')).toEqual('10.0.1');
      expect(findThemeDir(['10.0.0', '10.3.1', '10.12.5'], '^10.0.0')).toEqual('10.12.5');
      expect(findThemeDir(['10.0.0', '10.1.3', '10.1.12'], '^10.0.0')).toEqual('10.1.12');
    });
  });

  describe('[Utility] normalizeVersion', () => {
    it('Sollte die Version normalisiert zurückliefern', () => {
      expect(normalizeVersion('1.12.3')).toEqual('01.12.03');
      expect(normalizeVersion('1.2.77')).toEqual('01.02.77');
      expect(normalizeVersion('10.0.0')).toEqual('10.00.00');
      expect(normalizeVersion('10.0.0')).toEqual('10.00.00');
      expect(normalizeVersion('1.2.3')).toEqual('01.02.03');
      expect(normalizeVersion('^1.2.3')).toEqual('01.99.99');
      expect(normalizeVersion('~1.2.3')).toEqual('01.02.99');
    });
  });
});
