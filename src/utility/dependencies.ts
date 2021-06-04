import { SchematicContext, Tree } from '@angular-devkit/schematics';
import * as chalk from 'chalk';
import { applyEdits, findNodeAtLocation, modify, Node, parseTree } from 'jsonc-parser';
import { deleteLineFromFile } from './files';
import { jsonFormattingOptions, readJson, readJsonAsString } from './json';
import { formattedSchematicsException, logInfo } from './logging';

export enum NodeDependencyType {
  Default = 'dependencies',
  Dev = 'devDependencies',
  Peer = 'peerDependencies',
  Optional = 'optionalDependencies'
}

export interface NodeDependency {
  type: NodeDependencyType;
  name: string;
  version: string;
}

/**
 * Versucht eine Dependency aus der package.json auslesen und gibt diese zurück.
 * @param tree
 * @param name
 */
export function getPackageJsonDependency(tree: Tree, name: string): NodeDependency {
  const packageJsonNode = readJson(tree, '/package.json');
  let dependency: NodeDependency | null = null;

  [NodeDependencyType.Default, NodeDependencyType.Dev, NodeDependencyType.Optional, NodeDependencyType.Peer].forEach(
    (depType) => {

      let node = findNodeAtLocation(packageJsonNode, [depType.toString(), name]);
      if (node) {
        dependency = {
          type   : depType,
          name   : name,
          version: node.value
        };
      }
    }
  );

  if (dependency) {
    return dependency;
  } else {
    throw formattedSchematicsException(
      `Dependency ${name} nicht in der package.json gefunden.`
    );
  }
}

/**
 * Aktualisiert eine Dependency in der package.json bzw. fügt diese hinzu, falls sie noch nicht vorhanden ist.
 * @param tree
 * @param context
 * @param dependency
 */
export function updatePackageJsonDependency(tree: Tree, context: SchematicContext, dependency: NodeDependency): void {
  const packageJsonAsNode = readJson(tree, '/package.json');
  let node = findNodeAtLocation(packageJsonAsNode, [dependency.type.toString(), dependency.name]);
  if (node) {
    if (node && node.value !== dependency.version) {
      logInfo(
        `Dependency ` +
        chalk.yellowBright(`${ dependency.name }`) +
        ` ${ node.value } wird ersetzt durch ${ dependency.version }.`
      );
    }
  } else {
    logInfo(
      `Dependency ` +
      chalk.yellowBright(`${ dependency.name }`) +
      ` ${ dependency.version } wird im Abschnitt ${ dependency.type } hinzugefügt.`
    );
  }

  if (!node || node.value !== dependency.version) {
    const packageJonsAsString = readJsonAsString(tree, '/package.json');
    const edits = modify(packageJonsAsString, [dependency.type.toString(), dependency.name], dependency.version, { formattingOptions: jsonFormattingOptions});

    if (edits) {
      tree.overwrite(
        '/package.json',
        applyEdits(packageJonsAsString, edits)
      );
    }
  }
}

export function deletePackageJsonDependency(tree: Tree, context: SchematicContext, dependency: NodeDependency) {
  deleteLineFromFile(tree, context, '/package.json', dependency.name);
  logInfo(
    `Dependency ` + chalk.yellowBright(`${dependency.name}`) + ` wurde aus dem Abschnitt ${dependency.type} gelöscht.`
  );
}

