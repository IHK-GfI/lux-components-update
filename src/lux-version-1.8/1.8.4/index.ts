import { chain, Rule, SchematicContext, Tree } from '@angular-devkit/schematics';
import { getProject } from '@schematics/angular/utility/project';
import { validateLuxComponentsVersion, validateNodeVersion } from '../../utility/validation';
import {
  deletePackageJsonDependency,
  NodeDependency,
  NodeDependencyType,
  updatePackageJsonDependency
} from '../../utility/dependencies';
import { formattedSchematicsException, logInfoWithDescriptor, logNewUpdate, logSuccess } from '../../utility/logging';
import { replaceAll, runInstallAndLogToDos, waitForTreeCallback } from '../../utility/util';
import { iterateFilesAndModifyContent } from '../../utility/files';

/**
 * Haupt-Rule für diesen Schematic-Generator.
 * @param options
 */
export const luxVersion: (options: any) => Rule = (options: any) => {
  return chain([
    setupProject(options),
    checkVersions(),
    updateLuxComponentsImports(options),
    updatePackageJson(),
    todosForUser()
  ]);
};

export function updateLuxComponentsImports(options: any): Rule {
  return (tree: Tree, context: SchematicContext) => {
    logInfoWithDescriptor('Ersetze "lux-components" durch "@ihk-gfi/lux-components" in TS-Dateien.');

    iterateFilesAndModifyContent(
      tree,
      options.path,
      (filePath: string, content: string) => {
        let modifiedContent = replaceAll(content, "from 'lux-components'", "from '@ihk-gfi/lux-components'");

        if (content !== modifiedContent) {
          tree.overwrite(filePath, modifiedContent);
        }
      },
      '.ts'
    );

    return tree;
  };
}

/**
 * Prüft, ob die Property "project" gesetzt ist und
 * erstellt wenn nötig einen Standard-Pfad zum Projekt, wenn keiner bekannt ist.
 * @param options
 */
export function setupProject(options: any): Rule {
  return (tree: Tree, context: SchematicContext) => {
    logNewUpdate('1.8.4');
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
      const minimumLuxComponentsVersion = '1.8.3';
      validateLuxComponentsVersion(tree, context, minimumLuxComponentsVersion);

      const minimumNodeVersion = '10.0.0';
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
    logInfoWithDescriptor('Aktualisiere LUX-Components Version auf 1.8.4.');
    return waitForTreeCallback(tree, () => {
      const devDependencies: NodeDependency[] = [
        { type: NodeDependencyType.Default, version: '', name: 'lux-components' },
        { type: NodeDependencyType.Dev, version: '', name: 'lux-components-update' }
      ];
      devDependencies.forEach((dependency) => {
        deletePackageJsonDependency(tree, context, dependency);
      });

      const newDependency: NodeDependency[] = [
        { type: NodeDependencyType.Default, version: '1.8.4', name: '@ihk-gfi/lux-components' },
        { type: NodeDependencyType.Dev, version: '^0.0.65', name: '@ihk-gfi/lux-components-update' }
      ];
      newDependency.forEach((dependency) => {
        updatePackageJsonDependency(tree, context, dependency);
      });

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
    runInstallAndLogToDos(
      context,
      `Manuelle Schritte aus dem Update Guide (https://github.com/IHK-GfI/lux-components/wiki/update-guide#version-184) ausführen!`
    );
    return tree;
  };
}
