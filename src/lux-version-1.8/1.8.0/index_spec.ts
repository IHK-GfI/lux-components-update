import { SchematicTestRunner, UnitTestTree } from '@angular-devkit/schematics/testing';
import * as path from 'path';
import { of as observableOf } from 'rxjs';
import { addDependencyToPackageJson, appOptions, workspaceOptions } from '../../utility/test-helper';
import { callRule, SchematicContext, SchematicsException, Tree } from '@angular-devkit/schematics';
import { checkVersions } from './index';

const collectionPath = path.join(__dirname, '../../collection.json');

describe('lux-version-1.8.0', () => {
  let appTree: UnitTestTree;
  let runner: SchematicTestRunner;
  let context: SchematicContext;

  beforeEach(async () => {
    runner = new SchematicTestRunner('schematics', collectionPath);

    appTree = await runner.runExternalSchematicAsync('@schematics/angular', 'workspace', workspaceOptions).toPromise();
    appTree = await runner
      .runExternalSchematicAsync('@schematics/angular', 'application', appOptions, appTree)
      .toPromise();

    const collection = runner.engine.createCollection(collectionPath);
    const schematic = runner.engine.createSchematic('lux-version-1.8.0', collection);
    context = runner.engine.createContext(schematic);
  });

  describe('[Rule] setupProject', () => {
    it('Sollte Fehler werfen, wenn ein empty Tree genutzt wird', async () => {
      try {
        await runner
          .runExternalSchematicAsync(collectionPath, 'lux-version-1.8.0', appOptions, Tree.empty())
          .toPromise();
        fail();
      } catch (ex) {
        // Hier sollte eine Exception geworfen werden.
      }
    });

    it('Sollte Fehler werfen, wenn keine Option "project" gesetzt ist', async () => {
      try {
        await runner.runExternalSchematicAsync(collectionPath, 'lux-version-1.8.0', {}, appTree).toPromise();
        fail();
      } catch (ex) {
        // Hier sollte eine Exception geworfen werden.
      }
    });
  });

  describe('[Rule] checkVersions', () => {
    it('Sollte einen Fehler werfen, wenn Version < n - 1', () => {
      addDependencyToPackageJson(appTree, 'lux-components', '1.7.8');
      Object.defineProperty(process.versions, 'node', {
        get: () => '8.0.0'
      });
      console.log('Nodeversion (Sollte einen Fehler werfen, wenn Version < n - 1) ->', process.versions.node);

      callRule(checkVersions(), observableOf(appTree), context).subscribe(
        (success) => expect(success).toBeUndefined(),
        (reason) =>
          expect(reason.toString()).toContain('Dieser Generator benötigt allerdings die (neuere) Version 1.7.21.')
      );
    });

    it('Sollte einen Fehler werfen, wenn Version > n - 1', () => {
      addDependencyToPackageJson(appTree, 'lux-components', '1.7.100');
      Object.defineProperty(process.versions, 'node', {
        get: () => '8.0.0'
      });
      console.log('Nodeversion (Sollte einen Fehler werfen, wenn Version > n - 1) ->', process.versions.node);

      callRule(checkVersions(), observableOf(appTree), context).subscribe(
        (success) => expect(success).toBeUndefined(),
        (reason) =>
          expect(reason.toString()).toContain('Dieser Generator benötigt allerdings die (ältere) Version 1.7.21.')
      );
    });

    it('Sollte keinen Fehler werfen, wenn Version === n - 1', () => {
      addDependencyToPackageJson(appTree, 'lux-components', '1.7.21');
      Object.defineProperty(process.versions, 'node', {
        get: () => '8.0.0'
      });
      console.log('Nodeversion (Sollte keinen Fehler werfen, wenn Version === n - 1) ->', process.versions.node);

      callRule(checkVersions(), observableOf(appTree), context).subscribe(
        (success) => expect(success).toBeDefined(),
        (reason) => expect(reason).toBeUndefined()
      );
    });

    it('Sollte einen Fehler werfen, wenn Node-Version < 8.0.0', () => {
      addDependencyToPackageJson(appTree, 'lux-components', '1.7.21');
      Object.defineProperty(process.versions, 'node', {
        get: () => '7.9.9'
      });
      console.log('Nodeversion (Sollte einen Fehler werfen, wenn Node-Version < 8.0.0) ->', process.versions.node);

      callRule(checkVersions(), observableOf(appTree), context).subscribe(
        (success) => expect(success).toBeUndefined(),
        (reason) => expect(reason.toString()).toContain('LUX benötigt allerdings die Version 8.0.0.')
      );
    });

    it('Sollte keinen Fehler werfen, wenn Node-Version >= 8.0.0', () => {
      addDependencyToPackageJson(appTree, 'lux-components', '1.7.21');
      Object.defineProperty(process.versions, 'node', {
        get: () => '8.0.0'
      });
      console.log('Nodeversion (Sollte keinen Fehler werfen, wenn Node-Version >= 8.0.0) ->', process.versions.node);

      callRule(checkVersions(), observableOf(appTree), context).subscribe(
        (success) => expect(success).toBeDefined(),
        (reason) => expect(reason).toBeUndefined()
      );
    });
  });
});
