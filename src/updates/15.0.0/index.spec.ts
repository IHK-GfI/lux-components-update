import { callRule, SchematicContext } from '@angular-devkit/schematics';
import { SchematicTestRunner, UnitTestTree } from '@angular-devkit/schematics/testing';
import * as path from 'path';
import { of as observableOf } from 'rxjs';
import { updateDependencies } from '../../update-dependencies';
import { getPackageJsonDependency } from '../../utility/dependencies';
import { appOptions, workspaceOptions } from '../../utility/test';
import { UtilConfig } from '../../utility/util';
import { removeMaAndFaIcons } from './index';

describe('update150000', () => {
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

    context = runner.engine.createContext(runner.engine.createSchematic('update', runner.engine.createCollection(collectionPath)));

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
                "@ihk-gfi/lux-components": "14.7.0",
                "@ihk-gfi/lux-components-theme": "14.7.0",
                "@angular/compiler": "14.3.7"
              },
              "devDependencies": {
                "@angular-devkit/build-angular": "14.3.5",
                "@angular-eslint/builder": "14.2.1"
              }
            }
        `
      );

      callRule(updateDependencies(), observableOf(appTree), context).subscribe({
        next: () => {
          expect(getPackageJsonDependency(appTree, '@ihk-gfi/lux-components').version).not.toEqual('14.7.0');
          expect(getPackageJsonDependency(appTree, '@ihk-gfi/lux-components').version).toEqual('15.0.0');

          expect(getPackageJsonDependency(appTree, '@ihk-gfi/lux-components-theme').version).not.toEqual('14.7.0');
          expect(getPackageJsonDependency(appTree, '@ihk-gfi/lux-components-theme').version).toEqual('15.0.0');
          done();
        },
        error: (reason) => expect(reason).toBeUndefined()
      });
    });
  });

  describe('[Rule] removeMaAndFaIcons', () => {
    it('Sollte die Abhängigkeiten der Ma- und Fa-Icons entfernen', (done) => {
      let packageJsonPath = '/package.json';
      appTree.overwrite(packageJsonPath, PACKAGE_JSON_001);

      const indexHtmlPath = (testOptions.path ?? '.') + '/src/index.html';
      appTree.overwrite(indexHtmlPath, INDEX_HTML_001);

      callRule(removeMaAndFaIcons(testOptions), observableOf(appTree), context).subscribe({
        next: () => {
          const packageJsonContent = appTree.readContent(packageJsonPath);
          expect(packageJsonContent).not.toContain('@fortawesome/fontawesome-free');
          expect(packageJsonContent).not.toContain('material-design-icons-iconfont');

          const indexHtmlContent = appTree.readContent(indexHtmlPath);
          expect(indexHtmlContent).not.toContain('material');
          expect(indexHtmlContent).not.toContain('fontawesome');
          done();
        },
        error: (reason) => expect(reason).toBeUndefined()
      });
    });
  });
});

const PACKAGE_JSON_001 = `
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
                "@ihk-gfi/lux-components-theme": "14.4.0",
                "@fortawesome/fontawesome-free": "5.15.4",
                "material-design-icons-iconfont": "6.5.0",
                "@angular/compiler": "14.3.7"
              },
              "devDependencies": {
                "@angular-devkit/build-angular": "14.3.5",
                "@angular-eslint/builder": "14.2.1"
              }
            }
`;

const INDEX_HTML_001 = `<!doctype html>
<html lang="de">
<head>
  <meta charset="utf-8">
  <title>LUX Blueprint</title>
  <base href="/">

  <meta name="viewport" content="width=device-width, initial-scale=1">
  <link rel="icon" type="image/svg+xml" href="assets/favicons/favicon.svg" />
  <link rel="icon" type="image/png" href="assets/favicons/favicon.png" />
  <link rel="stylesheet preload" as="style" type="text/css" href="assets/icons/fontawesome/css/all.css">
  <link rel="stylesheet preload" as="style" type="text/css" href="assets/icons/material-icons/material-design-icons.css">
  <style>
    .lux-no-js {
      color: red;
      font-size: 20px;
      border: 1px solid red;
      padding: 10px;
    }
  </style>
</head>
<body style="margin: 0">
<noscript>
  <div id="no-js" class="lux-no-js">
    <p><b>Achtung, Javascript ist deaktiviert.</b></p>
    <p>Bitte aktivieren Sie Javascript in Ihrem Browser, damit die Applikation funktionsf&auml;hig ist.</p>
  </div>
</noscript>
  <lux-bp></lux-bp>
</body>
</html>

`;
