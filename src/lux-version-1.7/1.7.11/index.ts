import { chain, Rule, SchematicContext, Tree, } from '@angular-devkit/schematics';
import { getProject } from '@schematics/angular/utility/project';
import { validateLuxComponentsVersion, validateNodeVersion } from '../../utility/validation';
import { NodeDependency, NodeDependencyType, updatePackageJsonDependency } from '../../utility/dependencies';
import {
    formattedSchematicsException,
    logInfo,
    logInfoWithDescriptor,
    logNewUpdate,
    logSuccess,
    TAB
} from '../../utility/logging';
import chalk from 'chalk';
import { checkSmoketestScriptExists, runInstallAndLogToDos, waitForTreeCallback } from '../../utility/util';
import { iterateFilesAndModifyContent } from '../../utility/files';

/**
 * Haupt-Rule für diesen Schematic-Generator.
 * @param options
 */
export const luxVersion: (options: any) => Rule = (options: any) => {
    return chain([
       setupProject(options),
       checkVersions(),
       updatePackageJson(),
       renameLuxButtonProperty(options),
       renameLuxCardContentExpanded(options),
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
        logNewUpdate('1.7.11');
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

            logSuccess(`Schematic-Konfiguration für Projekt "${options.project}" erfolgreich.`);
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
            const minimumLuxComponentsVersion = '1.7.10';
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
        logInfoWithDescriptor('Aktualisiere LUX-Components Version auf 1.7.11.');
        return waitForTreeCallback(tree, () => {
            const newDependency: NodeDependency = {
                type: NodeDependencyType.Default,
                version: '1.7.11',
                name: 'lux-components'
            };
            updatePackageJsonDependency(tree, context, newDependency);
            logSuccess(`package.json erfolgreich aktualisiert.`);
            return tree;
        });
    };
}

export function renameLuxButtonProperty(options: any) {
    return (tree: Tree, context: SchematicContext) => {
        logInfoWithDescriptor(`Benenne die Property ${chalk.redBright('luxRoundButton')} zu ${chalk.redBright('luxRounded')} um.`);
        return waitForTreeCallback(tree, () => {
            let fileCount = 0;
            iterateFilesAndModifyContent(tree, options.path + '/src/app', (filePath: string, content: string) => {
                // Alle Vorkommnisse des Konstruktor-Aufrufs finden
                const modifiedContent = content.replace(/luxRoundButton/gm, 'luxRounded');
                // Den angepassten Content einsetzen
                if (modifiedContent !== content) {
                    tree.overwrite(filePath, modifiedContent);
                    fileCount++;
                }
            }, '.html');
            logInfo(`${fileCount} Template-Dateien angepasst.`);
            logSuccess(`Properties umbenannt.`);
            return tree;
        });
    };
}

export function renameLuxCardContentExpanded(options: any) {
    return (tree: Tree, context: SchematicContext) => {
        logInfoWithDescriptor(`Benenne das Tag ${chalk.redBright('lux-card-content-expanded')} zu ${chalk.redBright('lux-card-content-switched')} um.`);
        return waitForTreeCallback(tree, () => {
            let fileCount = 0;
            iterateFilesAndModifyContent(tree, options.path + '/src/app', (filePath: string, content: string) => {
                // Alle Vorkommnisse des Konstruktor-Aufrufs finden
                const modifiedContent = content.replace(/lux-card-content-expanded/g, 'lux-card-content-switched');
                // Den angepassten Content einsetzen
                if (modifiedContent !== content) {
                    tree.overwrite(filePath, modifiedContent);
                    fileCount++;
                }
            }, '.html');
            logInfo(`${fileCount} Template-Dateien angepasst.`);
            logSuccess(`Properties umbenannt.`);
            return tree;
        });
    };
}

/**
 * Gibt die offen stehenden ToDos (Aufgaben, die der Generator nicht übernehmen konnte) für den User aus.
 */
export function todosForUser(): Rule {
    return (tree: Tree, context: SchematicContext) => {
        runInstallAndLogToDos(context,
            `Alle Components unter ${chalk.blueBright('LuxFormModule')} wurden auf eine Baseline gebracht.\r\n${TAB}Bitte prüfen Sie in Ihren Views, ob die Ansichten noch korrekt sind.`,
            `Die Components ${chalk.blueBright('LuxTile')}, ${chalk.blueBright('LuxCard')}, ${chalk.blueBright('LuxPanel')} und ${chalk.blueBright('LuxStepper')} haben in der mobilen Ansicht ca. 50% ihrer Margins und Paddings verloren.\r\n` +
            `${TAB}Bitte prüfen Sie sicherheitshalber Ihre Applikation in den xs- und sm-Queries.`,
            `Die Breite der Component ${chalk.blueBright('LuxTile')} hat in der mobilen Ansicht nun eine Breite von 140px (vorher 150px), bitte den entsprechenden Queries überprüfen.`,
            `Die Properties ${ chalk.redBright('luxDashboardLink') }, ${ chalk.redBright('luxDashboardLinkTitle') } und ${ chalk.redBright('luxOpenLinkBlank') } wurden von ${chalk.blueBright('LuxAppHeader')} entfernt.`,
            `Bitte starten Sie ${ chalk.redBright('npm run smoketest') } um möglichen Fehlern vorzugreifen.`,
            `Weitere Informationen: https://confluence.gfi.ihk.de/display/EVA/Update+Guide#UpdateGuide-UmstellungaufVersion1.7.11`
        );
        return tree;
    };
}
