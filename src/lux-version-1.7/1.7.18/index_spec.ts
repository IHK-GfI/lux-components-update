import { SchematicTestRunner, UnitTestTree } from '@angular-devkit/schematics/testing';
import * as path from 'path';
import { of as observableOf } from 'rxjs';
import { addDependencyToPackageJson, appOptions, workspaceOptions } from '../../utility/test-helper';
import { callRule, SchematicContext, SchematicsException, Tree } from '@angular-devkit/schematics';
import { checkVersions, updatePackageJson } from './index';

const collectionPath = path.join(__dirname, '../../collection.json');

describe('lux-version-1.7.18', () => {
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
    const schematic = runner.engine.createSchematic('lux-version-1.7.18', collection);
    context = runner.engine.createContext(schematic);
  });

  describe('[Rule] setupProject', () => {
    it('Sollte Fehler werfen, wenn ein empty Tree genutzt wird', async () => {
      try {
        await runner
          .runExternalSchematicAsync(collectionPath, 'lux-version-1.7.18', appOptions, Tree.empty())
          .toPromise();
        fail();
      } catch (ex) {
        // Hier sollte eine Exception geworfen werden.
      }
    });

    it('Sollte Fehler werfen, wenn keine Option "project" gesetzt ist', async () => {
      try {
        await runner.runExternalSchematicAsync(collectionPath, 'lux-version-1.7.18', {}, appTree).toPromise();
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

      callRule(checkVersions(), observableOf(appTree), context).subscribe(
        (success) => expect(success).toBeUndefined(),
        (reason) =>
          expect(reason.toString()).toContain('Dieser Generator benötigt allerdings die (neuere) Version 1.7.17.')
      );
    });

    it('Sollte einen Fehler werfen, wenn Version > n - 1', () => {
      addDependencyToPackageJson(appTree, 'lux-components', '1.7.100');
      Object.defineProperty(process.versions, 'node', {
        get: () => '8.0.0'
      });

      callRule(checkVersions(), observableOf(appTree), context).subscribe(
        (success) => expect(success).toBeUndefined(),
        (reason) =>
          expect(reason.toString()).toContain('Dieser Generator benötigt allerdings die (ältere) Version 1.7.17.')
      );
    });

    it('Sollte keinen Fehler werfen, wenn Version === n - 1', () => {
      addDependencyToPackageJson(appTree, 'lux-components', '1.7.17');
      Object.defineProperty(process.versions, 'node', {
        get: () => '8.0.0'
      });

      callRule(checkVersions(), observableOf(appTree), context).subscribe(
        (success) => expect(success).toBeDefined(),
        (reason) => expect(reason).toBeUndefined()
      );
    });

    it('Sollte einen Fehler werfen, wenn Node-Version < 8.0.0', () => {
      addDependencyToPackageJson(appTree, 'lux-components', '1.7.17');
      Object.defineProperty(process.versions, 'node', {
        get: () => '7.9.9'
      });

      callRule(checkVersions(), observableOf(appTree), context).subscribe(
        (success) => expect(success).toBeUndefined(),
        (reason) => expect(reason.toString()).toContain('LUX benötigt allerdings die Version 8.0.0.')
      );
    });

    it('Sollte keinen Fehler werfen, wenn Node-Version >= 8.0.0', () => {
      addDependencyToPackageJson(appTree, 'lux-components', '1.7.17');
      Object.defineProperty(process.versions, 'node', {
        get: () => '8.0.0'
      });
      callRule(checkVersions(), observableOf(appTree), context).subscribe(
        (success) => expect(success).toBeDefined(),
        (reason) => expect(reason).toBeUndefined()
      );
    });
  });

  describe('[Rule] updatePackageJson', () => {
    beforeEach(() => {
      addDependencyToPackageJson(appTree, 'lux-components', '1.7.18');
    });

    // Muss über async laufen, da sonst eine package.json geprüft wird, welche bereits wieder resettet wurde
    it('Sollte die Dependency "lux-components" auf Version 1.7.18 setzen', async (done) => {
      callRule(updatePackageJson(), observableOf(appTree), context).subscribe(
        () => {
          expect(appTree.readContent('/package.json')).toContain('"lux-components": "1.7.18"');
          done();
        },
        (reason) => expect(reason).toBeUndefined()
      );
    });
  });
});
