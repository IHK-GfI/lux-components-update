import * as path from 'path';
import { SchematicTestRunner, UnitTestTree } from '@angular-devkit/schematics/testing';
import { callRule, SchematicContext } from '@angular-devkit/schematics';
import { of as observableOf } from 'rxjs';
import { UtilConfig } from '../utility/util';
import { appOptions, workspaceOptions } from '../utility/test-helper';
import { addLuxComponents } from './index';
import {
  getPackageJsonDependency,
  NodeDependencyType,
  updatePackageJsonDependencyForceUpdate
} from '../utility/dependencies';
import { updateMajorVersion } from '../update';

const collectionPath = path.join(__dirname, '../collection.json');

describe('add-lux-components', () => {
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
    const schematic = runner.engine.createSchematic('add-lux-components', collection);
    context = runner.engine.createContext(schematic);

    testOptions.project = appOptions.name;
    testOptions.path = workspaceOptions.newProjectRoot + '/' + appOptions.name;
    testOptions.verbose = true;
  });

  describe('[Rule] addLuxComponents', () => {
    it('Sollte die LUX-Components im Projekt eingerichtet haben', (done) => {
      updatePackageJsonDependencyForceUpdate(
        appTree,
        context,
        { type: NodeDependencyType.Default, version: '10.0.0', name: '@angular/common' }
      );

      callRule(addLuxComponents(testOptions), observableOf(appTree), context).subscribe(
        () => {
          expect(getPackageJsonDependency(appTree, '@ihk-gfi/lux-components').version).toContain(updateMajorVersion);
          expect(appTree.files).toContain('/projects/bar/src/theming/_luxfocusable.scss');
          expect(appTree.files).toContain('/projects/bar/src/theming/_luxpalette.scss');
          expect(appTree.files).toContain('/projects/bar/src/theming/_luxstyles.scss');
          expect(appTree.files).toContain('/projects/bar/src/theming/luxtheme.scss');
          done();
        },
        (reason) => expect(reason).toBeUndefined()
      );
    });
  });
});
