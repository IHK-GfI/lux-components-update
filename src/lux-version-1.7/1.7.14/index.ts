import { chain, Rule, SchematicContext, Tree, } from '@angular-devkit/schematics';
import { getProject } from '@schematics/angular/utility/project';
import { validateLuxComponentsVersion, validateNodeVersion } from '../../utility/validation';
import { NodeDependency, NodeDependencyType, updatePackageJsonDependency } from '../../utility/dependencies';
import { formattedSchematicsException, logInfoWithDescriptor, logNewUpdate, logSuccess, } from '../../utility/logging';
import chalk from 'chalk';
import { checkSmoketestScriptExists, runInstallAndLogToDos, waitForTreeCallback } from '../../utility/util';
import { searchInComponentAndModifyModule } from '../../utility/files';

/**
 * Haupt-Rule für diesen Schematic-Generator.
 * @param options
 */
export const luxVersion: (options: any) => Rule = (options: any) => {
    return chain([
        setupProject(options),
        checkVersions(),
        updatePackageJson(),
        updateModulesForCommonModule(options),
        updateModulesForErrorModule(options),
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
        logNewUpdate('1.7.14');
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
            const minimumLuxComponentsVersion = '1.7.13';
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
        logInfoWithDescriptor('Aktualisiere LUX-Components Version auf 1.7.14.');
        return waitForTreeCallback(tree, () => {
            const newDependency: NodeDependency = {
                type: NodeDependencyType.Default,
                version: '1.7.14',
                name: 'lux-components'
            };
            updatePackageJsonDependency(tree, context, newDependency);
            logSuccess(`package.json erfolgreich aktualisiert.`);
            return tree;
        });
    };
}

/**
 * Sucht nach Components die zuvor im LuxLayoutModule waren, nun aber in LuxCommonModule verschoben worden sind.
 * Aktualisiert das passende Modul entsprechend.
 * @param options
 */
export function updateModulesForCommonModule(options): Rule {
    return (tree: Tree, context: SchematicContext) => {
        logInfoWithDescriptor('Aktualisiere die Components aus LuxCommonModule.');
        return waitForTreeCallback(tree, () => {
            const luxCommonComponentTags = [
                'lux-badge',
                'lux-label',
                'lux-message-box',
                'lux-message',
                'lux-progress',
                'lux-spinner',
                'lux-table',
                'lux-table-column',
                'lux-table-column-content',
                'lux-table-column-footer',
                'lux-table-column-header',
            ];
            const luxCommonComponentNames = [
                'LuxBadgeComponent',
                'LuxLabelComponent',
                'LuxMessageBoxComponent',
                'LuxMessageComponent',
                'LuxProgressComponent',
                'LuxSpinnerComponent',
                'LuxTableComponent',
                'LuxTableColumnComponent',
                'LuxTableColumnContentComponent',
                'LuxTableColumnFooterComponent',
                'LuxTableColumnHeaderComponent',
            ];
            searchInComponentAndModifyModule(tree, options.path + '/src/app',
                [...luxCommonComponentTags, ...luxCommonComponentNames],
                (filePath: string, content: string) => {
                    if (content.indexOf('LuxCommonModule') === -1) {
                        // Den Import anpassen import { LuxLookupModule } from 'lux-components';
                        content = 'import { LuxCommonModule } from \'lux-components\';\n' + content;

                        // Das imports-Array anpassen
                        const matches = content.match(/imports:(.*)\[((.|\n)*?)\]/gm);
                        if (matches && matches.length > 0) {
                            let importString = matches[0];

                            importString = importString.trim().replace(/\s\s+/g, '');

                            let importEntries = importString.substring(importString.indexOf('[') + 1, importString.length - 1);
                            if (!importEntries.trim().endsWith(',')) {
                                importEntries = importEntries.trim() + ',';
                            }
                            importEntries += 'LuxCommonModule';
                            importString = 'imports: [\n\t\t' + importEntries + '\n\t]';
                            importString = importString.replace(/,/gm, ',\n\t\t');
                            content = content.replace(matches[0], importString);

                            tree.overwrite(filePath, content);
                        }
                    }

                }, '.ts', '.html');
            logSuccess(`Module erfolgreich angepasst.`);
            return tree;
        });
    };
}

/**
 * Sucht nach Components die zuvor im LuxLayoutModule waren, nun aber in LuxErrorModule verschoben worden sind.
 * Aktualisiert das passende Modul entsprechend.
 * @param options
 */
export function updateModulesForErrorModule(options): Rule {
    return (tree: Tree, context: SchematicContext) => {
        logInfoWithDescriptor('Aktualisiere die Components aus LuxErrorModule.');
        return waitForTreeCallback(tree, () => {
            const luxErrorPageNames = [
                'LuxErrorPageComponent',
                'LuxErrorService',
                'LuxErrorStoreService',
                'ILuxError',
                'ILuxErrorPageConfig'
            ];
            searchInComponentAndModifyModule(tree, options.path + '/src/app', luxErrorPageNames,
                (filePath: string, content: string) => {
                    if (content.indexOf('LuxErrorModule') === -1) {
                        // Den Import anpassen import { LuxLookupModule } from 'lux-components';
                        content = 'import { LuxErrorModule } from \'lux-components\';\n' + content;

                        // Das imports-Array anpassen
                        const matches = content.match(/imports:(.*)\[((.|\n)*?)\]/gm);
                        if (matches && matches.length > 0) {
                            let importString = matches[0];

                            importString = importString.trim().replace(/\s\s+/g, '');

                            let importEntries = importString.substring(importString.indexOf('[') + 1, importString.length - 1);
                            if (!importEntries.trim().endsWith(',')) {
                                importEntries = importEntries.trim() + ',';
                            }
                            importEntries += 'LuxErrorModule';
                            importString = 'imports: [\n\t\t' + importEntries + '\n\t]';
                            importString = importString.replace(/,/gm, ',\n\t\t');
                            content = content.replace(matches[0], importString);

                            tree.overwrite(filePath, content);
                        }
                    }

                }, '.ts');
            logSuccess(`Module erfolgreich angepasst.`);
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
            `Bitte starten Sie ${ chalk.redBright('npm run smoketest') } um möglichen Fehlern vorzugreifen.`,
            `Weitere Informationen: https://confluence.gfi.ihk.de/display/AF/Update+Guide#UpdateGuide-UmstellungaufVersion1.7.14`
        );
        return tree;
    };
}
