import { chain, Rule, SchematicContext, Tree, } from '@angular-devkit/schematics';
import { getProject } from '@schematics/angular/utility/project';
import { validateIhkGfiLuxComponentsVersion, validateNodeVersion } from '../../utility/validation';
import { NodeDependency, NodeDependencyType, updatePackageJsonDependency } from '../../utility/dependencies';
import { formattedSchematicsException, logInfoWithDescriptor, logNewUpdate, logSuccess, } from '../../utility/logging';
import { replaceAll, runInstallAndLogToDos, waitForTreeCallback } from '../../utility/util';

/**
 * Haupt-Rule für diesen Schematic-Generator.
 * @param options
 */
export const luxVersion: (options: any) => Rule = (options: any) => {
    return chain([
        setupProject(options),
        checkVersions(),
        updatePackageJson(),
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
        logNewUpdate('<%= dasherize(name) %>');
        logInfoWithDescriptor('Starte Konfiguration der Schematic.');
        return waitForTreeCallback(tree, () => {
            if (!options.project) {
                throw formattedSchematicsException('Option "project" wird benötigt.');
            }
            const project = getProject(tree, options.project);

            if (options.path === undefined) {
                options.path = project.root;
            }

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
            const minimumLuxComponentsVersion = '<%= dasherize(lastVersion) %>';
            validateIhkGfiLuxComponentsVersion(tree, context, minimumLuxComponentsVersion);

            const minimumNodeVersion = '<%= dasherize(nodeVersion) %>';
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
        logInfoWithDescriptor('Aktualisiere LUX-Components Version auf <%= dasherize(name) %>.');
        return waitForTreeCallback(tree, () => {
            const newDependency: NodeDependency = {
                type: NodeDependencyType.Default,
                version: '<%= dasherize(name) %>',
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
        let version = '<%= dasherize(name) %>';
        version = replaceAll(version, "\.", "");

        runInstallAndLogToDos(context,
            `Manuelle Schritte aus dem Update Guide (https://github.com/IHK-GfI/lux-components/wiki/Upate-Guide#version-${version}) durchführen!`
        );
        return tree;
    };
}
