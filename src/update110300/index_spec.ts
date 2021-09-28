import { callRule, SchematicContext } from '@angular-devkit/schematics';
import { SchematicTestRunner, UnitTestTree } from '@angular-devkit/schematics/testing';
import * as path from 'path';
import { of as observableOf } from 'rxjs';
import { getPackageJsonDependency } from '../utility/dependencies';
import { appOptions, workspaceOptions } from '../utility/test';
import { UtilConfig } from '../utility/util';
import { update110300 } from './index';

const collectionPath = path.join(__dirname, '../collection.json');

describe('update110300', () => {
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
    const schematic = runner.engine.createSchematic('update-11.3.0', collection);
    context = runner.engine.createContext(schematic);

    testOptions.project = appOptions.name;
    testOptions.path = workspaceOptions.newProjectRoot + '/' + appOptions.name;
    testOptions.verbose = true;
  });

  describe('[Rule] update110300', () => {
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
                "@ihk-gfi/lux-components": "11.0.0",
              },
              "devDependencies": {
                "@angular-devkit/build-angular": "0.1102.10",
              }
            }
        `
      );

      callRule(update110300(testOptions), observableOf(appTree), context).subscribe(
        () => {
          expect(getPackageJsonDependency(appTree, '@ihk-gfi/lux-components').version).toEqual('11.3.0');
          expect(getPackageJsonDependency(appTree, '@ihk-gfi/lux-components-theme').version).toEqual('11.4.0');
          done();
        },
        (reason) => expect(reason).toBeUndefined()
      );
    });

    it('Sollte die Sprachdateien aktualisieren', (done) => {
      appTree.create(
        '/src/locale/messages.xlf',
        `
<?xml version="1.0" encoding="UTF-8" ?>
<xliff version="1.2" xmlns="urn:oasis:names:tc:xliff:document:1.2">
  <file source-language="de" datatype="plaintext" original="ng2.template">
    <body>
      <trans-unit id="luxc.datepicker.error_message.empty" datatype="html">
        <source>Das Datum darf nicht leer sein</source>
        <context-group purpose="location">
          <context context-type="sourcefile">src/app/modules/lux-form/lux-datepicker/lux-datepicker.component.ts</context>
          <context context-type="linenumber">141</context>
        </context-group>
      </trans-unit>
    </body>
  </file>
</xliff>
        `
      );

      appTree.create(
        '/src/locale/messages.en.xlf',
        `
<?xml version="1.0" encoding="UTF-8" ?>
<xliff version="1.2" xmlns="urn:oasis:names:tc:xliff:document:1.2">
  <file source-language="de" datatype="plaintext" original="ng2.template">
    <body>
      <trans-unit id="luxc.datepicker.error_message.empty" datatype="html">
        <source>Das Datum darf nicht leer sein</source>
        <target>The date should not be empty</target>
        <context-group purpose="location">
          <context context-type="sourcefile">src/app/modules/lux-form/lux-datepicker/lux-datetimepicker.component.ts</context>
          <context context-type="linenumber">141</context>
        </context-group>
      </trans-unit>
    </body>
  </file>
</xliff>
        `
      );

      callRule(update110300(testOptions), observableOf(appTree), context).subscribe(
        (success) => {
          const contentDe = success.read('/src/locale/messages.xlf')?.toString();
          const contentEn = success.read('/src/locale/messages.en.xlf')?.toString();

          expect(contentDe).toContain('<trans-unit id="luxc.datetimepicker.invalid.date" datatype="html">');
          expect(contentDe).toContain('<trans-unit id="luxc.datetimepicker.invalid.time" datatype="html">');
          expect(contentDe).toContain('<trans-unit id="luxc.datetimepicker.error_message.min" datatype="html">');
          expect(contentDe).toContain('<trans-unit id="luxc.datetimepicker.error_message.max" datatype="html">');
          expect(contentDe).toContain('<trans-unit id="luxc.datetimepicker.error_message.invalid" datatype="html">');
          expect(contentDe).toContain('<trans-unit id="luxc.datetimepicker.error_message.empty" datatype="html">');
          expect(contentDe).toContain('<trans-unit id="luxc.datepicker.error_message.empty" datatype="html">');

          expect(contentEn).toContain('<trans-unit id="luxc.datetimepicker.invalid.date" datatype="html">');
          expect(contentEn).toContain('<trans-unit id="luxc.datetimepicker.invalid.time" datatype="html">');
          expect(contentEn).toContain('<trans-unit id="luxc.datetimepicker.error_message.min" datatype="html">');
          expect(contentEn).toContain('<trans-unit id="luxc.datetimepicker.error_message.max" datatype="html">');
          expect(contentEn).toContain('<trans-unit id="luxc.datetimepicker.error_message.invalid" datatype="html">');
          expect(contentEn).toContain('<trans-unit id="luxc.datetimepicker.error_message.empty" datatype="html">');
          expect(contentEn).toContain('<trans-unit id="luxc.datepicker.error_message.empty" datatype="html">');

          done();
        },
        (reason) => expect(reason).toBeUndefined()
      );
    });
  });
});
