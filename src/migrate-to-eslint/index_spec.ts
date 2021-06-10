import * as path from 'path';
import { SchematicTestRunner, UnitTestTree } from '@angular-devkit/schematics/testing';
import { callRule, SchematicContext } from '@angular-devkit/schematics';
import { of as observableOf } from 'rxjs';
import { UtilConfig } from '../utility/util';
import { appOptions, workspaceOptions } from '../utility/test';
import {
  getPackageJsonDependency,
  NodeDependencyType,
  updatePackageJsonDependency
} from '../utility/dependencies';
import { updateMajorVersion } from '../update';
import { deleteEmptyLifecyleHooksInTsFiles } from './index';
import exp = require('constants');

const collectionPath = path.join(__dirname, '../collection.json');

describe('migrate-to-eslint', () => {
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
    const schematic = runner.engine.createSchematic('migrate-to-eslint', collection);
    context = runner.engine.createContext(schematic);

    testOptions.project = appOptions.name;
    testOptions.path = workspaceOptions.newProjectRoot + '/' + appOptions.name;
    testOptions.verbose = true;
  });

  describe('[Rule] deleteEmptyLifecyleHooksInTsFiles', () => {
    it('Sollte die leeren Lifecycle-Hooks (vollständiger Import) entfernen', (done) => {
      appTree.create(
        testOptions.path + '/src/app/test.component.ts',
        `
import { Component, OnInit } from '@angular/core';

@Component({
  selector   : 'bp-anbindung-lazy',
  templateUrl: './anbindung-lazy.component.html'
})
export class AnbindungLazyComponent implements OnInit {

  constructor() {
  }

  ngOnInit() {     
  }

}

        `
      );

      callRule(deleteEmptyLifecyleHooksInTsFiles(testOptions), observableOf(appTree), context).subscribe(
        (success) => {
          const content = success.read(testOptions.path + '/src/app/test.component.ts')?.toString();

          expect(content).toContain('import { Component } from \'@angular/core\';');
          expect(content).toContain('export class AnbindungLazyComponent {');
          expect(content).not.toContain('ngOnInit');

          done();
        },
        (reason) => expect(reason).toBeUndefined()
      );
    });

    it('Sollte die leeren Lifecycle-Hooks (fehlender Import) entfernen', (done) => {
      appTree.create(
        testOptions.path + '/src/app/test.component.ts',
        `
import { Component, OnChanges } from '@angular/core';

@Component({
  selector   : 'bp-anbindung-lazy',
  templateUrl: './anbindung-lazy.component.html'
})
export class AnbindungLazyComponent implements OnInit, OnChanges {

  constructor() {
  }

  ngOnInit() {     
  }

  ngOnChanges() {}

}

        `
      );

      callRule(deleteEmptyLifecyleHooksInTsFiles(testOptions), observableOf(appTree), context).subscribe(
        (success) => {
          const content = success.read(testOptions.path + '/src/app/test.component.ts')?.toString();

          expect(content).toContain('import { Component } from \'@angular/core\';');
          expect(content).toContain('export class AnbindungLazyComponent {');
          expect(content).not.toContain('ngOnInit');
          expect(content).not.toContain('ngOnChanges');

          done();
        },
        (reason) => expect(reason).toBeUndefined()
      );
    });

    it('Sollte die leeren Lifecycle-Hooks (einziger Import) entfernen', (done) => {
      appTree.create(
        testOptions.path + '/src/app/test.component.ts',
        `
import { Aaa, OnInit, Bbb } from '@angular/core';

@Component({
  selector   : 'bp-anbindung-lazy',
  templateUrl: './anbindung-lazy.component.html'
})
export class AnbindungLazyComponent implements Aaa,OnInit, Bbb {

  constructor() {
  }

  ngOnInit() {     
  }

}

        `
      );

      callRule(deleteEmptyLifecyleHooksInTsFiles(testOptions), observableOf(appTree), context).subscribe(
        (success) => {
          const content = success.read(testOptions.path + '/src/app/test.component.ts')?.toString();

          expect(content).toContain('import { Aaa, Bbb } from \'@angular/core\';');
          expect(content).toContain('export class AnbindungLazyComponent implements Aaa, Bbb {');
          expect(content).not.toContain('ngOnInit');

          done();
        },
        (reason) => expect(reason).toBeUndefined()
      );
    });
  });
});
