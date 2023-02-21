import { callRule, SchematicContext } from '@angular-devkit/schematics';
import { SchematicTestRunner, UnitTestTree } from '@angular-devkit/schematics/testing';
import * as path from 'path';
import { of as observableOf } from 'rxjs';
import { getPackageJsonDependency } from '../../utility/dependencies';
import { appOptions, workspaceOptions } from '../../utility/test';
import { UtilConfig } from '../../utility/util';
import { update140300, updateStylesScss } from './index';

const collectionPath = path.join(__dirname, '../../collection.json');

describe('update140300', () => {
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
    const schematic = runner.engine.createSchematic('update-14.3.0', collection);
    context = runner.engine.createContext(schematic);

    testOptions.project = appOptions.name;
    testOptions.path = workspaceOptions.newProjectRoot + '/' + appOptions.name;
    testOptions.verbose = true;
  });

  describe('[Rule] update140300', () => {
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
                "@ihk-gfi/lux-components": "14.2.0",
                "@ihk-gfi/lux-components-theme": "14.2.0",
                "@angular/compiler": "14.3.7",
                "@ihk-gfi/lux-components-icons-and-fonts": "1.3.0"
              },
              "devDependencies": {
                "@angular-devkit/build-angular": "14.3.5",
                "@angular-eslint/builder": "14.2.1"
              }
            }
        `
      );

      callRule(update140300(testOptions), observableOf(appTree), context).subscribe(
        () => {
          expect(getPackageJsonDependency(appTree, '@ihk-gfi/lux-components').version).not.toEqual('14.2.0');
          expect(getPackageJsonDependency(appTree, '@ihk-gfi/lux-components').version).toEqual('14.3.0');

          expect(getPackageJsonDependency(appTree, '@ihk-gfi/lux-components-theme').version).not.toEqual('14.2.0');
          expect(getPackageJsonDependency(appTree, '@ihk-gfi/lux-components-theme').version).toEqual('14.4.0');

          expect(getPackageJsonDependency(appTree, '@ihk-gfi/lux-components-icons-and-fonts').version).not.toEqual('1.3.0');
          expect(getPackageJsonDependency(appTree, '@ihk-gfi/lux-components-icons-and-fonts').version).toEqual('1.4.0');
          done();
        },
        (reason) => expect(reason).toBeUndefined()
      );
    });
  });

  describe('[Rule] updateStylesScss', () => {
    it('Sollte die Datei "styles.scss" aktualisieren 01', (done) => {
      const filePath = testOptions.path + '/src/styles.scss';
      appTree.overwrite(filePath, updateStylesScssInit01);

      callRule(updateStylesScss(testOptions), observableOf(appTree), context).subscribe(
        (success) => {
          const content = success.read(filePath)?.toString();

          expect(content).toEqual(updateStylesScssResult01);
          done();
        },
        (reason) => expect(reason).toBeUndefined()
      );
    });

    it('Sollte die Datei "styles.scss" aktualisieren 02', (done) => {
      const filePath = testOptions.path + '/src/styles.scss';
      appTree.overwrite(filePath, updateStylesScssInit02);

      callRule(updateStylesScss(testOptions), observableOf(appTree), context).subscribe(
        (success) => {
          const content = success.read(filePath)?.toString();

          expect(content).toEqual(updateStylesScssResult02);
          done();
        },
        (reason) => expect(reason).toBeUndefined()
      );
    });

    it('Sollte die Datei "styles.scss" aktualisieren 03', (done) => {
      const filePath = testOptions.path + '/src/styles.scss';
      appTree.overwrite(filePath, updateStylesScssInit03);

      callRule(updateStylesScss(testOptions), observableOf(appTree), context).subscribe(
        (success) => {
          const content = success.read(filePath)?.toString();

          expect(content).toEqual(updateStylesScssResult03);
          done();
        },
        (reason) => expect(reason).toBeUndefined()
      );
    });

    it('Sollte einen Fehler werfen, wenn die Datei "styles.scss" fehlt', (done) => {
      const filePath = testOptions.path + '/src/styles.scss';
      appTree.delete(filePath);

      callRule(updateStylesScss(testOptions), observableOf(appTree), context).subscribe(
        () => {},
        (reason) => {
          expect(reason).toEqual(new Error(`Die Datei ${filePath} konnte nicht gefunden werden.`));
          done();
        }
      );
    });
  });
});

const updateStylesScssInit01 = `/* You can add global styles to this file, and also import other style files */
`;

const updateStylesScssResult01 = `/* You can add global styles to this file, and also import other style files */
@import '@ihk-gfi/lux-components-theme/src/base/luxfonts';

$basepath: '/';
@include web-fonts($basepath);
`;

const updateStylesScssInit02 = ``;

const updateStylesScssResult02 = `@import '@ihk-gfi/lux-components-theme/src/base/luxfonts';

$basepath: '/';
@include web-fonts($basepath);
`;

const updateStylesScssInit03 = `/* You can add global styles to this file, and also import other style files */

.test {
  width: 12px;
}
`;

const updateStylesScssResult03 = `/* You can add global styles to this file, and also import other style files */
@import '@ihk-gfi/lux-components-theme/src/base/luxfonts';

.test {
  width: 12px;
}

$basepath: '/';
@include web-fonts($basepath);
`;
