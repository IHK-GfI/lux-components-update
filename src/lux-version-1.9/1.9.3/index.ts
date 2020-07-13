import { chain, Rule, SchematicContext, Tree } from '@angular-devkit/schematics';
import { getProject } from '@schematics/angular/utility/project';
import { validateIhkGfiLuxComponentsVersion, validateNodeVersion } from '../../utility/validation';
import { NodeDependency, NodeDependencyType, updatePackageJsonDependency } from '../../utility/dependencies';
import { formattedSchematicsException, logInfoWithDescriptor, logNewUpdate, logSuccess } from '../../utility/logging';
import { replaceAll, runInstallAndLogToDos, waitForTreeCallback } from '../../utility/util';
import { iterateFilesAndModifyContent, moveFilesToDirectory } from '../../utility/files';

/**
 * Haupt-Rule für diesen Schematic-Generator.
 * @param options
 */
export const luxVersion: (options: any) => Rule = (options: any) => {
  return chain([
    setupProject(options),
    checkVersions(),
    updateAppModuleTs(options),
    updateTheming(options),
    updatePackageJson(),
    todosForUser()
  ]);
};

export function updateTheming(options: any): Rule {
  return moveFilesToDirectory(options, 'files/theming', 'src/theming');
}

export function updateAppModuleTs(options: any): Rule {
  return (tree: Tree, context: SchematicContext) => {
    logInfoWithDescriptor('Locale de-De in die app.module.ts eintragen.');

    iterateFilesAndModifyContent(
      tree,
      options.path,
      (filePath: string, content: string) => {
        const emptyProviderSection = content.search(/providers:\s??\[\s??\]\s??/gi) >= 0;

        let modifiedContent = `
import { registerLocaleData } from '@angular/common';
import localeDE from '@angular/common/locales/de';
import localeDeExtra from '@angular/common/locales/extra/de';
import { LOCALE_ID } from '@angular/core';

registerLocaleData(localeDE, localeDeExtra);
            `;
        modifiedContent += content;
        modifiedContent = modifiedContent.replace(
          /providers:\s??\[/gi,
          "providers: [{ provide: LOCALE_ID, useValue: 'de-DE' }" + (emptyProviderSection ? '' : ', ')
        );

        tree.overwrite(filePath, modifiedContent);
      },
      'app.module.ts'
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
    logNewUpdate('1.9.3');
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
      const minimumLuxComponentsVersion = '1.9.2';
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
    logInfoWithDescriptor('Aktualisiere LUX-Components Version auf 1.9.3.');
    return waitForTreeCallback(tree, () => {
      const newDependency: NodeDependency = {
        type: NodeDependencyType.Default,
        version: '1.9.3',
        name: '@ihk-gfi/lux-components'
      };
      updatePackageJsonDependency(tree, context, newDependency);
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
    let version = '1.9.3';
    version = replaceAll(version, '.', '');

    runInstallAndLogToDos(
      context,
      `Manuelle Schritte aus dem Update Guide (https://github.com/IHK-GfI/lux-components/wiki/update-guide#version-${version}) durchführen!`
    );
    return tree;
  };
}
