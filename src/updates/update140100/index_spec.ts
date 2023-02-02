import { callRule, SchematicContext } from '@angular-devkit/schematics';
import { SchematicTestRunner, UnitTestTree } from '@angular-devkit/schematics/testing';
import * as path from 'path';
import { of as observableOf } from 'rxjs';
import { getPackageJsonDependency } from '../../utility/dependencies';
import { appOptions, workspaceOptions } from '../../utility/test';
import { UtilConfig } from '../../utility/util';
import { i18nDeButton, i18nEnButton, update140100 } from './index';

const collectionPath = path.join(__dirname, '../../collection.json');

describe('update140100', () => {
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
    const schematic = runner.engine.createSchematic('update-14.1.0', collection);
    context = runner.engine.createContext(schematic);

    testOptions.project = appOptions.name;
    testOptions.path = workspaceOptions.newProjectRoot + '/' + appOptions.name;
    testOptions.verbose = true;
  });

  describe('[Rule] update140100', () => {
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
                "@ihk-gfi/lux-components": "14.0.0",
                "@angular/compiler": "14.3.7"
              },
              "devDependencies": {
                "@angular-devkit/build-angular": "14.3.5",
                "@angular-eslint/builder": "14.2.1"
              }
            }
        `
      );

      callRule(update140100(testOptions), observableOf(appTree), context).subscribe(
        () => {
          expect(getPackageJsonDependency(appTree, '@ihk-gfi/lux-components').version).not.toEqual('14.0.0');
          expect(getPackageJsonDependency(appTree, '@ihk-gfi/lux-components').version).toEqual('14.1.0');

          expect(getPackageJsonDependency(appTree, '@ihk-gfi/lux-components-theme').version).not.toEqual('14.0.0');
          expect(getPackageJsonDependency(appTree, '@ihk-gfi/lux-components-theme').version).toEqual('14.1.0');
          done();
        },
        (reason) => expect(reason).toBeUndefined()
      );
    });

    it('Sollte die I18N-Dateien aktualisieren', (done) => {
      appTree.create('/src/locale/messages.xlf', i18nDe);
      appTree.create('/src/locale/messages.en.xlf', i18nEn);

      callRule(update140100(testOptions), observableOf(appTree), context).subscribe(
        () => {
          const deContent = appTree.read('/src/locale/messages.xlf')?.toString();
          expect(deContent).toContain(i18nDeButton);

          const enContent = appTree.read('/src/locale/messages.en.xlf')?.toString();
          expect(enContent).toContain(i18nEnButton);
          done();
        },
        (reason) => expect(reason).toBeUndefined()
      );
    });

  });
});

const i18nDe = `<?xml version="1.0" encoding="UTF-8" ?>
<xliff version="1.2" xmlns="urn:oasis:names:tc:xliff:document:1.2">
  <file source-language="en" datatype="plaintext" original="ng2.template">
    <body>
      <trans-unit id="luxc.file-list.upload.lbl" datatype="html">
        <source>Hochladen</source>
        <context-group purpose="location">
          <context context-type="sourcefile">src/app/modules/lux-form/lux-file/lux-file-list/lux-file-list.component.ts</context>
          <context context-type="linenumber">56</context>
        </context-group>
        <context-group purpose="location">
          <context context-type="sourcefile">src/app/modules/lux-form/lux-file/lux-file-upload/lux-file-upload.component.ts</context>
          <context context-type="linenumber">91</context>
        </context-group>
      </trans-unit>
    </body>
  </file>
</xliff>
`;

const i18nEn = `<?xml version="1.0" encoding="UTF-8" ?>
<xliff version="1.2" xmlns="urn:oasis:names:tc:xliff:document:1.2">
  <file source-language="en" datatype="plaintext" original="ng2.template">
    <body>
      <trans-unit id="luxc.file-list.upload.lbl" datatype="html">
        <source>Hochladen</source>
        <target>Upload</target>
        <context-group purpose="location">
          <context context-type="sourcefile">src/app/modules/lux-form/lux-file/lux-file-list/lux-file-list.component.ts</context>
          <context context-type="linenumber">56</context>
        </context-group>
        <context-group purpose="location">
          <context context-type="sourcefile">src/app/modules/lux-form/lux-file/lux-file-upload/lux-file-upload.component.ts</context>
          <context context-type="linenumber">91</context>
        </context-group>
      </trans-unit>
    </body>
  </file>
</xliff>
`;
