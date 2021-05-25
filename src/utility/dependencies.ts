import { SchematicContext, Tree } from '@angular-devkit/schematics';
import * as chalk from 'chalk';
import { applyEdits, findNodeAtLocation, modify, Node, parseTree } from 'jsonc-parser';
import { deleteLineFromFile } from './files';
import { formattedSchematicsException, logInfo } from './logging';

const packageJsonPath = '/package.json';

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
  const packageJsonNode = readPackageJson(tree);
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
  updatePackageJsonDependencyForceUpdate(tree, context, dependency);
}

/**
 * Aktualisiert eine Dependency in der package.json bzw. fügt diese hinzu, falls sie noch nicht vorhanden ist.
 * @param tree
 * @param context
 * @param dependency
 */
export function updatePackageJsonDependencyForceUpdate(
  tree: Tree,
  context: SchematicContext,
  dependency: NodeDependency
): void {
  const packageJsonAsNode = readPackageJson(tree);
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
    const packageJonsAsString = readPackageJsonAsString(tree);
    const edits = modify(packageJonsAsString, [dependency.type.toString(), dependency.name], dependency.version, {});

    if (edits) {
      tree.overwrite(
        packageJsonPath,
        applyEdits(packageJonsAsString, edits)
      );
    }
  }
}

/**
 *
 * @param tree
 * @param context
 * @param dependency
 */
export function deletePackageJsonDependency(tree: Tree, context: SchematicContext, dependency: NodeDependency) {
  deleteLineFromFile(tree, context, packageJsonPath, dependency.name);
}

/**
 * Liest die package.json des Projekts aus und wirft Fehlermeldungen, sollte die package.json nicht gefunden oder
 * in einem falschen Format sein.
 * @param context
 * @param tree
 */
function readPackageJson(tree: Tree): Node {
  const buffer = tree.read(packageJsonPath);
  if (buffer === null) {
    throw formattedSchematicsException('Konnte die package.json nicht lesen.');
  }
  const content = buffer.toString();

  let result = parseTree(content) as Node;
  return result;
}

/**
 * Liest die package.json des Projekts aus und wirft Fehlermeldungen, sollte die package.json nicht gefunden oder
 * in einem falschen Format sein.
 * @param context
 * @param tree
 */
function readPackageJsonAsString(tree: Tree): string {
  const buffer = tree.read(packageJsonPath);
  if (buffer === null) {
    throw formattedSchematicsException('Konnte die package.json nicht lesen.');
  }
  return buffer.toString();
}
