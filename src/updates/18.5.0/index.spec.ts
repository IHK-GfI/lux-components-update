import { callRule, SchematicContext } from '@angular-devkit/schematics';
import { SchematicTestRunner, UnitTestTree } from '@angular-devkit/schematics/testing';
import * as path from 'path';
import { of as observableOf } from 'rxjs';
import { getPackageJsonDependency } from '../../utility/dependencies';
import { appOptions, workspaceOptions } from '../../utility/test';
import { UtilConfig } from '../../utility/util';
import { i18nDeChip, i18nEnChip, update180500 } from './index';

describe('update180500', () => {
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

    context = runner.engine.createContext(runner.engine.createSchematic('update-18.5.0', runner.engine.createCollection(collectionPath)));

    UtilConfig.defaultWaitMS = 0;

    testOptions.project = appOptions.name;
    testOptions.path = workspaceOptions.newProjectRoot + '/' + appOptions.name;
    testOptions.verbose = true;
  });

  describe('[Rule] update180500', () => {
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
                "@angular/animations": "18.2.12",
                "@angular/cdk": "18.2.12",
                "@angular/common": "18.2.12",
                "@ihk-gfi/lux-components": "18.4.0",
                "@ihk-gfi/lux-components-theme": "18.4.0",
                "@angular/compiler": "18.2.12",
                "@ihk-gfi/lux-components-icons-and-fonts": "1.8.0"
              },
              "devDependencies": {
                "@angular-devkit/build-angular": "18.2.12",
                "@angular-eslint/builder": "18.3.1",
                "@angular/cli": "18.2.12",
              }
            }
        `
      );

      const filePathDe = 'src/locale/messages.xlf';
      const filePathEn = 'src/locale/messages.en.xlf';
      appTree.create(filePathDe, i18nDe);
      appTree.create(filePathEn, i18nEn);

      callRule(update180500(testOptions), observableOf(appTree), context).subscribe(
        (successTree) => {
          expect(getPackageJsonDependency(appTree, '@ihk-gfi/lux-components').version).not.toEqual('18.4.0');
          expect(getPackageJsonDependency(appTree, '@ihk-gfi/lux-components').version).toEqual('18.5.0');

          expect(getPackageJsonDependency(appTree, '@ihk-gfi/lux-components-theme').version).not.toEqual('18.4.0');
          expect(getPackageJsonDependency(appTree, '@ihk-gfi/lux-components-theme').version).toEqual('18.5.0');

          const contentDe = successTree.read(filePathDe)?.toString();
          expect(contentDe).toContain(i18nDeChip);

          const contentEn = successTree.read(filePathEn)?.toString();
          expect(contentEn).toContain(i18nEnChip);

          done();
        },
        (reason) => expect(reason).toBeUndefined()
      );
    });
  });
});

const i18nDe = `<?xml version="1.0" encoding="UTF-8" ?>
<xliff version="1.2" xmlns="urn:oasis:names:tc:xliff:document:1.2">
  <file source-language="de" datatype="plaintext" original="ng2.template">
    <body>
      <trans-unit id="luxc.chips.input.placeholder.lbl" datatype="html">
        <source>eingeben oder auswählen</source>
        <context-group purpose="location">
          <context context-type="sourcefile">src/app/modules/lux-form/lux-chips-ac/lux-chips-ac.component.ts</context>
          <context context-type="linenumber">82</context>
        </context-group>
      </trans-unit>
    </body>
  </file>
</xliff>`;
const i18nEn = `<?xml version="1.0" encoding="UTF-8" ?>
<xliff version="1.2" xmlns="urn:oasis:names:tc:xliff:document:1.2">
  <file source-language="en" datatype="plaintext" original="ng2.template">
    <body>
      <trans-unit id="luxc.chips.input.placeholder.lbl" datatype="html">
        <source>eingeben oder auswählen</source>
        <target>enter or select</target>
        <context-group purpose="location">
          <context context-type="sourcefile">src/app/modules/lux-form/lux-chips-ac/lux-chips-ac.component.ts</context>
          <context context-type="linenumber">82</context>
        </context-group>
      </trans-unit>
    </body>
  </file>
</xliff>`;
