import { chain, Rule, SchematicContext, Tree } from '@angular-devkit/schematics';
import { getProject } from '@schematics/angular/utility/project';
import chalk from 'chalk';
import { NodeDependency, NodeDependencyType, updatePackageJsonDependency } from '../../utility/dependencies';
import { iterateFilesAndModifyContent, moveFilesToDirectory } from '../../utility/files';
import { removeAttribute, renameAttribute } from '../../utility/html';
import { validateLuxComponentsVersion, validateNodeVersion } from '../../utility/validation';

import { formattedSchematicsException, logInfoWithDescriptor, logNewUpdate, logSuccess, } from '../../utility/logging';
import { checkSmoketestScriptExists, runInstallAndLogToDos } from '../../utility/util';

const htmlparser2 = require('htmlparser2');
const cheerio = require('cheerio');

/**
 * Haupt-Rule für diesen Schematic-Generator.
 * @param options
 */
export const luxVersion: (options: any) => Rule = (options: any) => {
    return chain([
        setupProject(options),
        checkVersions(),
        updateLuxList(options),
        updateLuxTab(options),
        updateLuxMenu(options),
        updateInterfaceNames(options),
        updateHammerConfig(options),
        updateLuxStylesScss(options),
        updateLuxAppMenuLeft(options),
        updatePackageJson(),
        todosForUser()
    ]);
};

/**
 * Diese Methode entfernt das alte Appheadermenü und erstetzt dieses durch das neue Appheadermenü.
 */
export function updateLuxAppMenuLeft(options: any): Rule {
    return (tree: Tree, context: SchematicContext) => {
        logInfoWithDescriptor(`` + 'Ersetze das alte AppHeadermenü durch das neue Appheadermenü.');

        iterateFilesAndModifyContent(tree, options.path, (filePath: string, content: string) => {

            const dom = htmlparser2.parseDOM(content, {
                withDomLvl1: true,
                normalizeWhitespace: false,
                xmlMode: true,
                decodeEntities: false
            });
            // Dekodierung deaktivieren, ansonsten werden Umlaute, &&-Operatoren, etc. von Cheerio verstümmelt
            const $ = cheerio.load(dom, {decodeEntities: false});

            const menuItemsOld = $('lux-app-header-left-nav').children('lux-menu-item');

            let newMenu = '';
            if (menuItemsOld.length > 0) {
                newMenu = '\n<lux-side-nav>\n';

                menuItemsOld.each(function (i, elem) {
                    newMenu += '<lux-side-nav-item ';

                    const luxLabel = $(elem).attr('luxLabel');
                    if (luxLabel) {
                        newMenu += 'luxLabel="' + luxLabel + '" ';
                    }

                    const luxIconName = $(elem).attr('luxIconName');
                    if (luxIconName) {
                        newMenu += 'luxIconName="' + luxIconName + '" ';
                    }

                    const luxClicked = $(elem).attr('(luxClicked)');
                    if (luxClicked) {
                        newMenu += '(luxClicked)="' + luxClicked + '" ';
                    }

                    const luxTagId = $(elem).attr('luxTagId');
                    if (luxTagId) {
                        newMenu += 'luxTagId="' + luxTagId + '" ';
                    }

                    newMenu += '></lux-side-nav-item>\n';

                });

                newMenu += '</lux-side-nav>\n';

                // Leider kann man das Menü nicht mit Cheerio hinzufügen da Cheerio alle
                // Attribute in Lowercase (z.B. luxLabel => luxlabel) umwandelt.
                // Deshalb wird hier nur ein Platzhalter an der richtigen Stelle hinterlassen.
                // Der Platzhalter wird weiter unten über einen Regulären Ausdruck ersetzt.
                $('lux-app-header').prepend('\nmenuPlaceholder45853489459');
            }

            $('lux-app-header-left-nav').remove();

            let modifiedContent: string = $.xml();

            if (menuItemsOld.length > 0) {
                // Hier wird der Platzhalter von oben durch das konkrete Menü ersetzt.
                modifiedContent = modifiedContent.replace('menuPlaceholder45853489459', newMenu);
                tree.overwrite(filePath, modifiedContent);
            }

        }, 'app.component.html');

        return tree;
    };
}

/**
 * Diese Methode entfernt das obsolete Attribut "luxListItems".
 */
export function updateLuxList(options: any): Rule {
    return (tree: Tree, context: SchematicContext) => {
        logInfoWithDescriptor(`` + 'Entferne das obsolete Attribut "luxListItems"');

        iterateFilesAndModifyContent(tree, options.path, (filePath: string, content: string) => {
            const info = removeAttribute(content, 'lux-list', 'luxItems');

            if (info.updated) {
                tree.overwrite(filePath, info.content);
            }
        }, '.html');

        return tree;
    };
}

/**
 * Diese Methode setzt die I-Präfixe für die Klassen LuxMessage, LuxMessageCloseEvent und LuxMessageChangeEvent.
 */
export function updateInterfaceNames(options: any): Rule {
    return (tree: Tree, context: SchematicContext) => {
        logInfoWithDescriptor(`` + 'Setze die I-Präfixe für die Klassen "LuxMessage", "LuxMessageCloseEvent" und "LuxMessageChangeEvent".');

        iterateFilesAndModifyContent(tree, options.path, (filePath: string, content: string) => {
            let modifiedContent = content.replace(/(\W)(LuxMessage)(\W)/g, '$1I$2$3');
            modifiedContent = modifiedContent.replace(/(\W)(LuxMessageCloseEvent)(\W)/g, '$1I$2$3');
            modifiedContent = modifiedContent.replace(/(\W)(LuxMessageChangeEvent)(\W)/g, '$1I$2$3');

            if (content !== modifiedContent) {
                tree.overwrite(filePath, modifiedContent);
            }
        }, '.ts');

        return tree;
    };
}

/**
 * Diese Methode benennt die Klasse LuxHammerConfig in LuxComponentsHammerConfig um.
 */
export function updateHammerConfig(options: any): Rule {
    return (tree: Tree, context: SchematicContext) => {
        logInfoWithDescriptor(`` + 'Benenne die Klasse "LuxHammerConfig" in "LuxComponentsHammerConfig" um.');

        iterateFilesAndModifyContent(tree, options.path, (filePath: string, content: string) => {
            const modifiedContent = content.replace(/(\W)(LuxHammerConfig)(\W)/g, '$1LuxComponentsHammerConfig$3');

            if (content !== modifiedContent) {
                tree.overwrite(filePath, modifiedContent);
            }
        }, '.ts');

        return tree;
    };
}

/**
 * Diese Methode benennt das Attribut "luxText" in allen Tabs zu "luxTitle" um.
 */
export function updateLuxTab(options: any): Rule {
    return (tree: Tree, context: SchematicContext) => {
        logInfoWithDescriptor(`` + 'LUX-TAB: Die Property "luxText" wird zu "luxTitle" umbenannt."');

        iterateFilesAndModifyContent(tree, options.path, (filePath: string, content: string) => {
            const info = renameAttribute(content, 'lux-tab', 'luxText', 'luxTitle');

            if (info.updated) {
                tree.overwrite(filePath, info.content);
            }
        }, '.html');

        return tree;
    };
}

/**
 * Diese Methode benennt das Attribut "luxIconName" in allen Menüs zu "luxMenuIconName" um.
 */
export function updateLuxMenu(options: any): Rule {
    return (tree: Tree, context: SchematicContext) => {
        logInfoWithDescriptor(`` + 'LUX-MENU: Die Property "luxIconName" wird zu "luxMenuIconName" umbenannt."');

        iterateFilesAndModifyContent(tree, options.path, (filePath: string, content: string) => {
            const info = renameAttribute(content, 'lux-menu', 'luxIconName', 'luxMenuIconName');

            if (info.updated) {
                tree.overwrite(filePath, info.content);
            }
        }, '.html');

        return tree;
    };
}

export function updateLuxStylesScss(options: any): Rule {
    return moveFilesToDirectory(options, 'files/theming/', 'src/theming/');
}

/**
 * Aktualisiert die package.json des Projekts.
 * Fügt die neue Dependency hinzu und entfernt die alte.
 */
export function updatePackageJson(): Rule {
    return (tree: Tree, context: SchematicContext) => {
        logInfoWithDescriptor('Updating lux-components to v.1.7.8');
        const luxComponentsDependency: NodeDependency = {
            type: NodeDependencyType.Default,
            version: '1.7.8',
            name: 'lux-components'
        };
        updatePackageJsonDependency(tree, context, luxComponentsDependency);

        logSuccess(`package.json successfully updated.`);

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
        logNewUpdate('1.7.8');
        logInfoWithDescriptor('Starting setup');

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
    }
}

/**
 * Prüft ob die Versionen des Projekts mit den erforderlichen Versionen dieses Updates übereinstimmen.
 */
export function checkVersions(): Rule {
    return (tree: Tree, context: SchematicContext) => {
        logInfoWithDescriptor('Starting version check');

        const minimumLuxComponentsVersion = '1.7.7';
        validateLuxComponentsVersion(tree, context, minimumLuxComponentsVersion);

        const minimumNodeVersion = '8.0.0';
        validateNodeVersion(context, minimumNodeVersion);

        logSuccess(`Checked the versions successfully.`);

        return tree;
    };
}

/**
 * Gibt die offen stehenden ToDos (Aufgaben, die der Generator nicht übernehmen konnte) für den User aus.
 */
export function todosForUser(): Rule {
    return (tree: Tree, context: SchematicContext) => {
        runInstallAndLogToDos(context,
            `Die Properties ${ chalk.redBright('luxNoServerFilter') }, ${ chalk.redBright('luxNoServerPagination') } und ${ chalk.redBright('luxNoServerSort') } aus dem Interface ${ chalk.blueBright('ILuxTableHttpDao') } wurden ersatzlos gestrichen.`,
            `Prüfen Sie, ob die LuxTabs noch einen Abstand haben.`,
            `Bitte starten Sie ${ chalk.redBright('npm run smoketest') } um möglichen Fehlern vorzugreifen.`,
            `Weitere Informationen: https://confluence.gfi.ihk.de/display/EVA/Update+Guide#UpdateGuide-UmstellungaufVersion1.7.8`
        );
        return tree;
    };
}
