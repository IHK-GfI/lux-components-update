import { SchematicContext, Tree, UpdateRecorder } from '@angular-devkit/schematics';
import { JsonAstNode, JsonAstObject, JsonParseMode, parseJsonAst } from '@angular-devkit/core';
import {
  appendPropertyInAstObject,
  findPropertyInAstObject,
  insertPropertyInAstObjectInOrder
} from '@schematics/angular/utility/json-utils';
import * as semver from 'semver';
import * as chalk from 'chalk';
import { formattedSchematicsException, logInfo, logWarn } from './logging';
import { deleteLineFromFile } from './files';

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
 * Aktualisiert eine Dependency in der package.json bzw. fügt diese hinzu, falls sie noch nicht vorhanden ist.
 * @param tree
 * @param context
 * @param dependency
 */
export function updatePackageJsonDependency(tree: Tree, context: SchematicContext, dependency: NodeDependency): void {
  updatePackageJsonDependencyForceUpdate(tree, context, dependency, false);
}

/**
 * Aktualisiert eine Dependency in der package.json bzw. fügt diese hinzu, falls sie noch nicht vorhanden ist.
 * @param tree
 * @param context
 * @param dependency
 * @param forceUpate Gibt an, ob die Dependencies auch überschrieben werden, wenn diese älter als die vorhandenden Dependencies sind.
 */
export function updatePackageJsonDependencyForceUpdate(
  tree: Tree,
  context: SchematicContext,
  dependency: NodeDependency,
  forceUpate: boolean
): void {
  const packageJson: JsonAstObject = readPackageJson(tree);
  const dependencyTypeNode: JsonAstNode | null = findPropertyInAstObject(packageJson, dependency.type);
  const recorder: UpdateRecorder = tree.beginUpdate(packageJsonPath);
  // Dependency-Typ existiert noch nicht (z.B. devDependencies oder peerDependencies)
  if (!dependencyTypeNode) {
    // Den Dependency-Typ und die Dependency hinzufügen
    appendPropertyInAstObject(
      recorder,
      packageJson,
      dependency.type,
      {
        [dependency.name]: dependency.version
      },
      2
    );
  }
  // Der Dependency-Typ existiert bereits
  else if (dependencyTypeNode.kind === 'object') {
    // Prüfen ob die Dependency bereits darin vorhanden ist
    const dependencyNode = findPropertyInAstObject(dependencyTypeNode, dependency.name);
    // Diese Dependency gibt es noch nicht
    if (!dependencyNode) {
      insertPropertyInAstObjectInOrder(recorder, dependencyTypeNode, dependency.name, dependency.version, 4);
      logInfo(
        `Dependency ` +
          chalk.greenBright(`${dependency.name}`) +
          ` nicht gefunden. Füge Sie zum Typ "${dependency.type}" hinzu.`
      );
    }
    // Diese Dependency existiert bereits
    else {
      const packageJsonDependency = getPackageJsonDependency(tree, dependency.name);
      // Die Dependency ist in einer älteren Version vorhanden
      if (semver.cmp(packageJsonDependency.version.replace(/([\^~])/g, ''), '<', dependency.version)) {
        const { end, start } = dependencyNode;
        // Die alte Version entfernen
        recorder.remove(start.offset, end.offset - start.offset);
        // Die neue hinzufügen
        recorder.insertRight(start.offset, JSON.stringify(dependency.version));
        logInfo(`Dependency ` + chalk.greenBright(`${dependency.name}`) + ` gefunden. Aktualisiere die Version.`);
      } else if (semver.cmp(packageJsonDependency.version.replace(/([\^~])/g, ''), '===', dependency.version)) {
        if (packageJsonDependency.version !== dependency.version) {
          const { end, start } = dependencyNode;
          // Die alte Version entfernen
          recorder.remove(start.offset, end.offset - start.offset);
          // Die neue hinzufügen
          recorder.insertRight(start.offset, JSON.stringify(dependency.version));
          logInfo(`Dependency ` + chalk.greenBright(`${dependency.name}`) + ` gefunden. ^ oder ~ entfernt.`);
        }
      } else if (semver.cmp(packageJsonDependency.version.replace(/([\^~])/g, ''), '>', dependency.version)) {
        if (forceUpate) {
          const { end, start } = dependencyNode;
          // Die neuere Version entfernen
          recorder.remove(start.offset, end.offset - start.offset);
          // Die gewollte Version hinzufügen
          recorder.insertRight(start.offset, JSON.stringify(dependency.version));
          logInfo(`Dependency ` + chalk.greenBright(`${dependency.name}`) + ` gefunden. ^ oder ~ entfernt.`);
        } else {
          logWarn(
            `Dependency ` +
              chalk.greenBright(`${dependency.name}`) +
              ` gefunden. Die aktuelle Version ` +
              packageJsonDependency.version +
              ` ist größer als ` +
              dependency.version +
              `. Die Version bestehende Version wurde nicht aktualisiert.`
          );
        }
      } else {
        logInfo(`Dependency ` + chalk.greenBright(`${dependency.name}`) + ` gefunden. Die Version ist i.O.`);
      }
    }
  }

  tree.commitUpdate(recorder);
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
 * Versucht eine Dependency aus der package.json auslesen und gibt diese zurück.
 * @param tree
 * @param name
 */
export function getPackageJsonDependency(tree: Tree, name: string): NodeDependency {
  const packageJson = readPackageJson(tree);
  let dependency: NodeDependency | null = null;

  [NodeDependencyType.Default, NodeDependencyType.Dev, NodeDependencyType.Optional, NodeDependencyType.Peer].forEach(
    (depType) => {
      const depsNode = findPropertyInAstObject(packageJson, depType);
      if (depsNode !== null && depsNode.kind === 'object') {
        const depNode = findPropertyInAstObject(depsNode, name);
        if (depNode !== null && depNode.kind === 'string') {
          dependency = {
            type: depType,
            name: name,
            version: depNode.value
          };
        }
      }
    }
  );

  if (dependency) {
    return dependency;
  } else {
    throw formattedSchematicsException(
      `Dependency ${name ? '"' + name + '"' : ''} nicht in der package.json gefunden.`
    );
  }
}

/**
 * Liest die package.json des Projekts aus und wirft Fehlermeldungen, sollte die package.json nicht gefunden oder
 * in einem falschen Format sein.
 * @param context
 * @param tree
 */
function readPackageJson(tree: Tree): JsonAstObject {
  const buffer = tree.read(packageJsonPath);
  if (buffer === null) {
    throw formattedSchematicsException('Konnte die package.json nicht lesen.');
  }
  const content = buffer.toString();

  const packageJson = parseJsonAst(content, JsonParseMode.Strict);
  if (packageJson.kind != 'object') {
    throw formattedSchematicsException('Ungültige package.json, ein Object wurde erwartet.');
  }

  return packageJson;
}
