import { callRule, SchematicContext } from '@angular-devkit/schematics';
import { SchematicTestRunner, UnitTestTree } from '@angular-devkit/schematics/testing';
import * as path from 'path';
import { of as observableOf } from 'rxjs';
import { appOptions, workspaceOptions } from '../../utility/test';
import { UtilConfig } from '../../utility/util';
import { renameLuxSelectedFiles } from './index';

describe('update140000', () => {
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
    appTree = await runner.runExternalSchematicAsync(collection, 'workspace', workspaceOptions).toPromise();
    appTree = await runner.runExternalSchematicAsync(collection, 'application', appOptions, appTree).toPromise();

    context = runner.engine.createContext(
      runner.engine.createSchematic('update', runner.engine.createCollection(collectionPath))
    );

    UtilConfig.defaultWaitMS = 0;

    testOptions.project = appOptions.name;
    testOptions.path = workspaceOptions.newProjectRoot + '/' + appOptions.name;
    testOptions.verbose = true;
  });

  describe('[Rule] renameLuxSelectedFiles', () => {
    it('Sollte das Attribut "luxSelectedFiles" in "luxSelected" umbenennen', (done) => {
      const filePath = testOptions.path + '/renameLuxSelectedFiles/Test.component.html';
      appTree.create(filePath, renameLuxSelectedFilesContent);

      callRule(renameLuxSelectedFiles(testOptions), observableOf(appTree), context).subscribe({
        next: (success) => {
          const content = success.read(filePath)?.toString();

          expect(content).toContain('<lux-file-input luxSelected="selected" (luxSelectedChange)="onSelected()"></lux-file-input>');
          expect(content).toContain('<lux-file-input [luxSelected]="selected" (luxSelectedChange)="onSelected()"></lux-file-input>');
          expect(content).toContain('<lux-file-input [(luxSelected)]="selected"></lux-file-input>');

          expect(content).toContain('<lux-file-list luxSelected="selected" (luxSelectedChange)="onSelected()"></lux-file-list>');
          expect(content).toContain('<lux-file-list [luxSelected]="selected" (luxSelectedChange)="onSelected()"></lux-file-list>');
          expect(content).toContain('<lux-file-list [(luxSelected)]="selected"></lux-file-list>');

          expect(content).toContain('<lux-file-upload luxSelected="selected" (luxSelectedChange)="onSelected()"></lux-file-upload>');
          expect(content).toContain('<lux-file-upload [luxSelected]="selected" (luxSelectedChange)="onSelected()"></lux-file-upload>');
          expect(content).toContain('<lux-file-upload [(luxSelected)]="selected"></lux-file-upload>');
          done();
        },
        error: (reason) => expect(reason).toBeUndefined()
      });
    });
  });
});

const renameLuxSelectedFilesContent = `
<lux-file-input luxSelectedFiles="selected" (luxSelectedFilesChange)="onSelected()"></lux-file-input>
<lux-file-input [luxSelectedFiles]="selected" (luxSelectedFilesChange)="onSelected()"></lux-file-input>
<lux-file-input [(luxSelectedFiles)]="selected"></lux-file-input>

<lux-file-list luxSelectedFiles="selected" (luxSelectedFilesChange)="onSelected()"></lux-file-list>
<lux-file-list [luxSelectedFiles]="selected" (luxSelectedFilesChange)="onSelected()"></lux-file-list>
<lux-file-list [(luxSelectedFiles)]="selected"></lux-file-list>

<lux-file-upload luxSelectedFiles="selected" (luxSelectedFilesChange)="onSelected()"></lux-file-upload>
<lux-file-upload [luxSelectedFiles]="selected" (luxSelectedFilesChange)="onSelected()"></lux-file-upload>
<lux-file-upload [(luxSelectedFiles)]="selected"></lux-file-upload>
`;
