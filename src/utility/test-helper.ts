import { UnitTestTree } from '@angular-devkit/schematics/testing';
import { MergeStrategy, SchematicContext } from '@angular-devkit/schematics';

import { Schema as WorkspaceOptions } from '@schematics/angular/workspace/schema';
import { Schema as ApplicationOptions } from '@schematics/angular/application/schema';
import { Style } from '@schematics/angular/application/schema';

/**
 * Standard-Optionen für das Test-Workspace.
 */
export const workspaceOptions: WorkspaceOptions = {
  name: 'workspace',
  newProjectRoot: 'projects',
  version: '6.0.0'
};

/**
 * Standard-Optionen für die Test-Applikation.
 */
export const appOptions: ApplicationOptions = {
  name: 'bar',
  inlineStyle: false,
  inlineTemplate: false,
  routing: false,
  style: <Style>'scss',
  skipTests: false,
  skipPackageJson: false
};

/**
 * Fügt eine Dependency in die erste Zeile der Property "dependencies" aus der package.json.
 * @param appTree
 * @param dependency
 * @param version
 */
export const addDependencyToPackageJson = (appTree: UnitTestTree, dependency: string, version: string) => {
  let packageJsonString: string = appTree.readContent('/package.json');
  const newPackageJsonString = packageJsonString.replace(
    '"dependencies": {\n',
    `"dependencies": {\n\t"${dependency}": "${version}",\n`
  );
  appTree.overwrite('/package.json', newPackageJsonString);
};

/**
 * Erzeugt einen Mock-Context für den Aufruf über callRule.
 */
export const createMockContext = () => {
  return {
    strategy: MergeStrategy.Default,
    logger: {
      info: (...args) => {},
      warn: (...args) => {},
      error: (...args) => {}
    }
  } as SchematicContext;
};
