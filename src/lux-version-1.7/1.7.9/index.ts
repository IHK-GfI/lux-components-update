import { chain, Rule, SchematicContext, Tree } from '@angular-devkit/schematics';
import { getProject } from '@schematics/angular/utility/project';
import { checkSmoketestScriptExists, replaceAll, runInstallAndLogToDos } from '../../utility/util';
import { validateLuxComponentsVersion, validateNodeVersion } from '../../utility/validation';
import {
  deletePackageJsonDependency,
  NodeDependency,
  NodeDependencyType,
  updatePackageJsonDependency
} from '../../utility/dependencies';
import {
  formattedSchematicsException,
  logInfo,
  logInfoWithDescriptor,
  logNewUpdate,
  logSuccess,
  TAB
} from '../../utility/logging';
import { deleteLineFromFile, iterateFilesAndModifyContent, writeLinesToFile } from '../../utility/files';
import * as chalk from 'chalk';

/**
 * Haupt-Rule für diesen Schematic-Generator.
 * @param options
 */
export const luxVersion: (options: any) => Rule = (options: any) => {
  return chain([
    setupProject(options),
    checkVersions(),
    updatePackageJson(),
    updateStylesSCSS(),
    updatePropertyNames(options),
    todosForUser()
  ]);
};

/**
 * Prüft, ob die Property "project" gesetzt ist und
 * erstellt wenn nötig einen Standard-Pfad zum Projekt, wenn keiner bekannt ist.
 * @param options
 */
export function setupProject(options: any): Rule {
  return (tree: Tree, context: SchematicContext) => {
    logNewUpdate('1.7.9');
    logInfoWithDescriptor('Starte Konfiguration der Schematic.');

    if (!options.project) {
      throw formattedSchematicsException('Option "project" wird benötigt.');
    }
    const project = getProject(tree, options.project);

    if (options.path === undefined) {
      options.path = project.root;
    }

    checkSmoketestScriptExists(tree, context);

    logSuccess(`Schematic-Konfiguration für Projekt "${options.project}" erfolgreich.`);
    return tree;
  };
}

/**
 * Prüft ob die Versionen des Projekts mit den erforderlichen Versionen dieses Updates übereinstimmen.
 */
export function checkVersions(): Rule {
  return (tree: Tree, context: SchematicContext) => {
    logInfoWithDescriptor('Starte die Versionsprüfung.');

    const minimumLuxComponentsVersion = '1.7.8';
    validateLuxComponentsVersion(tree, context, minimumLuxComponentsVersion);

    const minimumNodeVersion = '8.0.0';
    validateNodeVersion(context, minimumNodeVersion);

    logSuccess(`Versionen erfolgreich geprüft.`);
    return tree;
  };
}

/**
 * Aktualisiert die package.json des Projekts.
 * Fügt die neue Dependency hinzu und entfernt die alte.
 */
export function updatePackageJson(): Rule {
  return (tree: Tree, context: SchematicContext) => {
    logInfoWithDescriptor('Füge Dependency fortawesome/fontawesome-free v.5.7.2 zu package.json hinzu.');
    const newDependency: NodeDependency = {
      type: NodeDependencyType.Default,
      version: '5.7.2',
      name: '@fortawesome/fontawesome-free'
    };
    updatePackageJsonDependency(tree, context, newDependency);

    logInfoWithDescriptor('Aktualisiere lux-components auf v.1.7.9.');
    const luxComponentsDependency: NodeDependency = {
      type: NodeDependencyType.Default,
      version: '1.7.9',
      name: 'lux-components'
    };
    updatePackageJsonDependency(tree, context, luxComponentsDependency);

    logInfoWithDescriptor('Entferne font-awesome v.4.7.0 aus package.json.');
    const oldDependency: NodeDependency = {
      type: NodeDependencyType.Default,
      version: '4.7.0',
      name: 'font-awesome'
    };
    deletePackageJsonDependency(tree, context, oldDependency);

    logSuccess(`package.json erfolgreich aktualisiert.`);

    return tree;
  };
}

/**
 * Aktualisiert die styles.scss, um die neuen Imports für fontawesome-free zu nutzen.
 */
export function updateStylesSCSS(): Rule {
  return (tree: Tree, context: SchematicContext) => {
    logInfoWithDescriptor('Aktualsiere styles.scss um die neuen Imports zu nutzen.');

    // Wichtig den Präfix "src/" voranzustellen, sonst würde bei "styles.scss" auch die Datei "luxstyles.scss" matchen.
    const filePathEndings = 'src/styles.scss';
    iterateFilesAndModifyContent(
      tree,
      '/',
      (filePath: string, content: string) => {
        deleteLineFromFile(tree, context, filePath, '~font-awesome/css/font-awesome.css');
        writeLinesToFile(
          tree,
          context,
          filePath,
          '$fa-font-path: "~@fortawesome/fontawesome-free/webfonts";',
          '@import "~@fortawesome/fontawesome-free/scss/fontawesome";',
          '@import "~@fortawesome/fontawesome-free/scss/regular";',
          '@import "~@fortawesome/fontawesome-free/scss/solid";',
          '@import "~@fortawesome/fontawesome-free/scss/brands";'
        );
      },
      filePathEndings
    );

    logSuccess(`styles.scss erfolgreich aktualisiert.`);
    return tree;
  };
}

/**
 * Aktualisiert die Property "luxMargins" zu "luxMargin" in dem Projekt.
 */
export function updatePropertyNames(options: any): Rule {
  return (tree: Tree, context: SchematicContext) => {
    logInfoWithDescriptor(
      'Aktualisiere Templates, um "luxMargin" anstelle von "luxMargins" für LuxIconComponents zu nutzen.'
    );

    let fileCount: number = 0;
    iterateFilesAndModifyContent(
      tree,
      options.path,
      (filePath: string, content: string) => {
        if (content.indexOf('luxMargins="') !== -1 || content.indexOf('[luxMargins]="') !== -1) {
          let modifiedContent = replaceAll(content.toString(), 'luxMargins="', 'luxMargin="');
          modifiedContent = replaceAll(modifiedContent, '[luxMargins]="', '[luxMargin]="');

          tree.overwrite(filePath, modifiedContent);
          logInfo(`${filePath} modified.`);
          fileCount++;
        }
      },
      '.html'
    );

    logInfo(`${fileCount} Dateien bearbeitet.`);
    return tree;
  };
}

/**
 * Gibt die offen stehenden ToDos (Aufgaben, die der Generator nicht übernehmen konnte) für den User aus.
 */
export function todosForUser(): Rule {
  return (tree: Tree, context: SchematicContext) => {
    runInstallAndLogToDos(
      context,
      `Bitte aktualisieren Sie die folgende Zeile in der Klasse ${chalk.blueBright(
        'ApplicationConfiguration'
      )} vom UI-Service (Proxy):\r\n` +
        `${TAB}Alt: ${chalk.redBright('"/fontawesome-webfont(\\\\\\\\.[a-f0-9]{20})?\\\\\\\\..*"')}\r\n` +
        `${TAB}Neu: ${chalk.redBright(
          '"/(fa-solid|fa-brand|fa-regular|fa-light)-([0-9]{2,4})?(\\.[a-f0-9]{20})?\\.(woff|woff2|ttf)?"'
        )}`,
      `Bitte prüfen Sie die ${chalk.redBright('luxIconName')}s innerhalb Ihrer Applikation.\r\n` +
        `${TAB}Einige Icon-Bezeichnungen können sich geändert haben und/oder besitzen nun eine andere Kategorie (fas, fab, far, fal).\r\n` +
        `${TAB}Wichtig: Alle Icons mit dem suffix "-o" werden nicht mehr erkannt.`,
      `Bitte prüfen Sie die Margins und Paddings der ${chalk.blueBright(
        'LuxIconComponents'
      )} innerhalb Ihrer Applikation.\r\n` +
        `${TAB}Sie können die Margins und Paddings einer ${chalk.blueBright(
          'LuxIconComponent'
        )} nun über die Properties ${chalk.redBright('luxMargin')} und ${chalk.redBright('luxPaddingMargin')} steuern.`,
      `Bitte starten Sie ${chalk.redBright('npm run smoketest')} um möglichen Fehlern vorzugreifen.`,
      `Weitere Informationen: https://confluence.gfi.ihk.de/display/EVA/Update+Guide#UpdateGuide-UmstellungaufVersion1.7.9`
    );
    return tree;
  };
}
