import { SchematicTestRunner, UnitTestTree } from '@angular-devkit/schematics/testing';
import * as path from 'path';
import { of as observableOf } from 'rxjs';
import { addDependencyToPackageJson, appOptions, workspaceOptions } from '../../utility/test-helper';
import { callRule, SchematicContext, SchematicsException, Tree } from '@angular-devkit/schematics';
import { checkVersions, deleteOldStylesFile, updatePackageJson, updateThemingFiles } from './index';

const collectionPath = path.join(__dirname, '../../collection.json');

describe('lux-version-1.7.15', () => {
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
    const schematic = runner.engine.createSchematic('lux-version-1.7.15', collection);
    context = runner.engine.createContext(schematic);
  });

  describe('[Rule] setupProject', () => {
    it('Sollte Fehler werfen, wenn ein empty Tree genutzt wird', async () => {
      try {
        await runner
          .runExternalSchematicAsync(collectionPath, 'lux-version-1.7.15', appOptions, Tree.empty())
          .toPromise();
        fail();
      } catch (ex) {
        // Hier sollte eine Exception geworfen werden.
      }
    });

    it('Sollte Fehler werfen, wenn keine Option "project" gesetzt ist', async () => {
      try {
        await runner.runExternalSchematicAsync(collectionPath, 'lux-version-1.7.15', {}, appTree).toPromise();
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
          expect(reason.toString()).toContain('Dieser Generator benötigt allerdings die (neuere) Version 1.7.14.')
      );
    });

    it('Sollte einen Fehler werfen, wenn Version > n - 1', () => {
      addDependencyToPackageJson(appTree, 'lux-components', '1.7.15');
      Object.defineProperty(process.versions, 'node', {
        get: () => '8.0.0'
      });

      callRule(checkVersions(), observableOf(appTree), context).subscribe(
        (success) => expect(success).toBeUndefined(),
        (reason) =>
          expect(reason.toString()).toContain('Dieser Generator benötigt allerdings die (ältere) Version 1.7.14.')
      );
    });

    it('Sollte keinen Fehler werfen, wenn Version === n - 1', () => {
      addDependencyToPackageJson(appTree, 'lux-components', '1.7.14');
      Object.defineProperty(process.versions, 'node', {
        get: () => '8.0.0'
      });

      callRule(checkVersions(), observableOf(appTree), context).subscribe(
        (success) => expect(success).toBeDefined(),
        (reason) => expect(reason).toBeUndefined()
      );
    });

    it('Sollte einen Fehler werfen, wenn Node-Version < 8.0.0', () => {
      addDependencyToPackageJson(appTree, 'lux-components', '1.7.14');
      Object.defineProperty(process.versions, 'node', {
        get: () => '7.9.9'
      });

      callRule(checkVersions(), observableOf(appTree), context).subscribe(
        (success) => expect(success).toBeUndefined(),
        (reason) => expect(reason.toString()).toContain('LUX benötigt allerdings die Version 8.0.0.')
      );
    });

    it('Sollte keinen Fehler werfen, wenn Node-Version >= 8.0.0', () => {
      addDependencyToPackageJson(appTree, 'lux-components', '1.7.14');
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
      addDependencyToPackageJson(appTree, 'lux-components', '1.7.14');
    });

    // Muss über async laufen, da sonst eine package.json geprüft wird, welche bereits wieder resettet wurde
    it('Sollte die Dependency "lux-components" auf Version 1.7.15 setzen', async (done) => {
      callRule(updatePackageJson(), observableOf(appTree), context).subscribe(
        () => {
          expect(appTree.readContent('/package.json')).toContain('"lux-components": "1.7.15"');
          done();
        },
        (reason) => expect(reason).toBeUndefined()
      );
    });
  });

  describe('[Rule] deleteOldStylesFile', () => {
    it('Sollte die luxstyles.scss löschen', async (done) => {
      appTree.create('projects/bar/src/theming/luxstyles.scss', 'p { color: #efefef; }');

      expect(appTree.exists('projects/bar/src/theming/luxstyles.scss')).toBe(true);
      expect(appTree.readContent('projects/bar/src/theming/luxstyles.scss')).toEqual('p { color: #efefef; }');

      callRule(deleteOldStylesFile({ path: '/projects/bar/' }), observableOf(appTree), context).subscribe(
        () => {
          expect(appTree.exists('projects/bar/src/theming/luxstyles.scss')).toBe(false);
          done();
        },
        (reason) => {
          expect(reason).toBeUndefined();
          done();
        }
      );
    });
  });

  describe('[Rule] updateThemingFiles', () => {
    it('Sollte die neuen Partial-Files ergänzen', async (done) => {
      expect(appTree.exists('projects/bar/src/theming/_luxstyles.scss')).toBe(false);
      expect(appTree.exists('projects/bar/src/theming/_luxfocusable.scss')).toBe(false);
      expect(appTree.exists('projects/bar/src/theming/_luxpalette.scss')).toBe(false);

      callRule(updateThemingFiles({ path: '/projects/bar/' }), observableOf(appTree), context).subscribe(
        () => {
          expect(appTree.exists('projects/bar/src/theming/_luxstyles.scss')).toBe(true);
          expect(appTree.exists('projects/bar/src/theming/_luxfocusable.scss')).toBe(true);
          expect(appTree.exists('projects/bar/src/theming/_luxpalette.scss')).toBe(true);

          done();
        },
        (reason) => {
          expect(reason).toBeUndefined();
          done();
        }
      );
    });
  });
});
