import { chain, Rule, SchematicContext, Tree } from '@angular-devkit/schematics';
import { getProject } from '@schematics/angular/utility/project';
import { validateIhkGfiLuxComponentsVersion, validateNodeVersion } from '../../utility/validation';
import { NodeDependency, NodeDependencyType, updatePackageJsonDependency } from '../../utility/dependencies';
import { formattedSchematicsException, logInfoWithDescriptor, logNewUpdate, logSuccess } from '../../utility/logging';
import { replaceAll, runInstallAndLogToDos, waitForTreeCallback } from '../../utility/util';

/**
 * Haupt-Rule für diesen Schematic-Generator.
 * @param options
 */
export const luxVersion: (options: any) => Rule = (options: any) => {
  return chain([setupProject(options), checkVersions(), updatePackageJson(), todosForUser()]);
};

/**
 * Prüft, ob die Property "project" gesetzt ist und
 * erstellt wenn nötig einen Standard-Pfad zum Projekt, wenn keiner bekannt ist.
 * @param options
 */
export function setupProject(options: any): Rule {
  return (tree: Tree, context: SchematicContext) => {
    logNewUpdate('1.9.1');
    logInfoWithDescriptor('Starte Konfiguration der Schematic.');
    return waitForTreeCallback(tree, () => {
      if (!options.project) {
        throw formattedSchematicsException('Option "project" wird benötigt.');
      }
      const project = getProject(tree, options.project);

      if (options.path === undefined) {
        options.path = project.root;
      }

      logSuccess(`Schematic-Konfiguration für Projekt "${options.project}" erfolgreich.`);
      return tree;
    });
  };
}

/**
 * Prüft ob die Versionen des Projekts mit den erforderlichen Versionen dieses Updates übereinstimmen.
 */
export function checkVersions(): Rule {
  return (tree: Tree, context: SchematicContext) => {
    logInfoWithDescriptor('Starte die Versionsprüfung.');
    return waitForTreeCallback(tree, () => {
      const minimumLuxComponentsVersion = '1.9.0';
      validateIhkGfiLuxComponentsVersion(tree, context, minimumLuxComponentsVersion);

      const minimumNodeVersion = '10.16.3';
      validateNodeVersion(context, minimumNodeVersion);

      logSuccess(`Versionen erfolgreich geprüft.`);
      return tree;
    });
  };
}

/**
 * Aktualisiert die package.json des Projekts.
 */
export function updatePackageJson(): Rule {
  return (tree: Tree, context: SchematicContext) => {
    return waitForTreeCallback(tree, () => {
      logInfoWithDescriptor('Aktualisiere LUX-Components Version auf 1.9.1.');
      const newLuxComponents: NodeDependency = {
        type: NodeDependencyType.Default,
        version: '1.9.1',
        name: '@ihk-gfi/lux-components'
      };
      updatePackageJsonDependency(tree, context, newLuxComponents);

      logInfoWithDescriptor('Aktualisiere node-sass Version auf 4.14.1.');
      const newNodeSass: NodeDependency = {
        type: NodeDependencyType.Dev,
        version: '4.14.1',
        name: 'node-sass'
      };
      updatePackageJsonDependency(tree, context, newNodeSass);

      logInfoWithDescriptor('Aktualisiere dompurify Version auf 2.0.10.');
      const newDomPurify: NodeDependency = {
        type: NodeDependencyType.Default,
        version: '2.0.11',
        name: 'dompurify'
      };
      updatePackageJsonDependency(tree, context, newDomPurify);

      logInfoWithDescriptor('Aktualisiere marked Version auf 1.0.0.');
      const newMarked: NodeDependency = {
        type: NodeDependencyType.Default,
        version: '1.0.0',
        name: 'marked'
      };
      updatePackageJsonDependency(tree, context, newMarked);

      logSuccess(`package.json erfolgreich aktualisiert.`);

      return tree;
    });
  };
}

/**
 * Gibt die offen stehenden ToDos (Aufgaben, die der Generator nicht übernehmen konnte) für den User aus.
 */
export function todosForUser(): Rule {
  return (tree: Tree, context: SchematicContext) => {
    let version = '1.9.1';
    version = replaceAll(version, '.', '');

    runInstallAndLogToDos(
      context,
      `Manuelle Schritte aus dem Update Guide (https://github.com/IHK-GfI/lux-components/wiki/update-guide-1.9#version-${version}) durchführen!`
    );
    return tree;
  };
}
