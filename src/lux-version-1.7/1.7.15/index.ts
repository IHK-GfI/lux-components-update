import { chain, Rule, SchematicContext, Tree, } from '@angular-devkit/schematics';
import { getProject } from '@schematics/angular/utility/project';
import { validateLuxComponentsVersion, validateNodeVersion } from '../../utility/validation';
import { NodeDependency, NodeDependencyType, updatePackageJsonDependency } from '../../utility/dependencies';
import { formattedSchematicsException, logInfoWithDescriptor, logNewUpdate, logSuccess, } from '../../utility/logging';
import chalk from 'chalk';
import { checkSmoketestScriptExists, runInstallAndLogToDos, waitForTreeCallback } from '../../utility/util';
import { deleteFile, moveFilesToDirectory } from '../../utility/files';

/**
 * Haupt-Rule für diesen Schematic-Generator.
 * @param options
 */
export const luxVersion: (options: any) => Rule = (options: any) => {
    return chain([
        setupProject(options),
        checkVersions(),
        updatePackageJson(),
        deleteOldStylesFile(options),
        updateThemingFiles(options),
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
        logNewUpdate('1.7.15');
        logInfoWithDescriptor('Starte Konfiguration der Schematic.');
        return waitForTreeCallback(tree, () => {
            if (!options.project) {
                throw formattedSchematicsException('Option "project" wird benötigt.');
            }
            const project = getProject(tree, options.project);

            if (options.path === undefined) {
                options.path = project.root;
            }

            checkSmoketestScriptExists(tree, context);

            logSuccess(`Schematic-Konfiguration für Projekt "${ options.project }" erfolgreich.`);
            return tree;
        });
    }
}

/**
 * Prüft ob die Versionen des Projekts mit den erforderlichen Versionen dieses Updates übereinstimmen.
 */
export function checkVersions(): Rule {
    return (tree: Tree, context: SchematicContext) => {
        logInfoWithDescriptor('Starte die Versionsprüfung.');
        return waitForTreeCallback(tree, () => {
            const minimumLuxComponentsVersion = '1.7.14';
            validateLuxComponentsVersion(tree, context, minimumLuxComponentsVersion);

            const minimumNodeVersion = '8.0.0';
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
        logInfoWithDescriptor('Aktualisiere LUX-Components Version auf 1.7.15.');
        return waitForTreeCallback(tree, () => {
            const newDependency: NodeDependency = {
                type: NodeDependencyType.Default,
                version: '1.7.15',
                name: 'lux-components'
            };
            updatePackageJsonDependency(tree, context, newDependency);
            logSuccess(`package.json erfolgreich aktualisiert.`);
            return tree;
        });
    };
}

/**
 * Löscht die alte luxstyles.scss.
 * @param options
 */
export function deleteOldStylesFile(options: any): Rule {
    logInfoWithDescriptor('Lösche luxstyles.scss.');
    return deleteFile(options, 'src/theming/luxstyles.scss');
}

/**
 * Aktualisiert die Dateien im "theming"-Ordner.
 * @param options
 */
export function updateThemingFiles(options: any): Rule {
    logInfoWithDescriptor('Aktualisiere die Stylesheets für das Theming.');
    return moveFilesToDirectory(options, 'files/theming', 'src/theming');
}

/**
 * Gibt die offen stehenden ToDos (Aufgaben, die der Generator nicht übernehmen konnte) für den User aus.
 */
export function todosForUser(): Rule {
    return (tree: Tree, context: SchematicContext) => {
        runInstallAndLogToDos(context,
            `Bitte starten Sie ${ chalk.redBright('npm run smoketest') } um möglichen Fehlern vorzugreifen.`,
            `Weitere Informationen: https://confluence.gfi.ihk.de/display/AF/Update+Guide#UpdateGuide-UmstellungaufVersion1.7.15`
        );
        return tree;
    };
}
