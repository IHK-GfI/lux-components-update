import { chain, Rule, SchematicContext, Tree, } from '@angular-devkit/schematics';
import { getProject } from '@schematics/angular/utility/project';
import { validateLuxComponentsVersion, validateNodeVersion } from '../../utility/validation';
import { NodeDependency, NodeDependencyType, updatePackageJsonDependency } from '../../utility/dependencies';
import { formattedSchematicsException, logInfoWithDescriptor, logNewUpdate, logSuccess, } from '../../utility/logging';
import chalk from 'chalk';
import { checkSmoketestScriptExists, runInstallAndLogToDos, waitForTreeCallback } from '../../utility/util';

/**
 * Haupt-Rule für diesen Schematic-Generator.
 * @param options
 */
export const luxVersion: (options: any) => Rule = (options: any) => {
    return chain([
        setupProject(options),
        checkVersions(),
        updatePackageJson(),
        addPackageJsonDependencies(),
        addPackageJsonDevDependencies(),
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
        logNewUpdate('1.7.16');
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
            const minimumLuxComponentsVersion = '1.7.15';
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
        logInfoWithDescriptor('Aktualisiere LUX-Components Version auf 1.7.16.');
        return waitForTreeCallback(tree, () => {
            const newDependency: NodeDependency = {
                type: NodeDependencyType.Default,
                version: '1.7.16',
                name: 'lux-components'
            };
            updatePackageJsonDependency(tree, context, newDependency);
            logSuccess(`package.json erfolgreich aktualisiert.`);
            return tree;
        });
    };
}

/**
 * Fügt die neuen dependencies der package.json hinzu.
 */
export function addPackageJsonDependencies(): Rule {
    return (tree: Tree, context: SchematicContext) => {
        logInfoWithDescriptor('Füge neue Dependencies zu package.json hinzu.');
        return waitForTreeCallback(tree, () => {
            const dependencies: NodeDependency[] = [
                {type: NodeDependencyType.Default, version: '7.2.15', name: '@angular/animations'},
                {type: NodeDependencyType.Default, version: '7.3.7', name: '@angular/cdk'},
                {type: NodeDependencyType.Default, version: '7.2.15', name: '@angular/common'},
                {type: NodeDependencyType.Default, version: '7.2.15', name: '@angular/compiler'},
                {type: NodeDependencyType.Default, version: '7.2.15', name: '@angular/core'},
                {type: NodeDependencyType.Default, version: '7.0.0-beta.24', name: '@angular/flex-layout'},
                {type: NodeDependencyType.Default, version: '7.2.15', name: '@angular/forms'},
                {type: NodeDependencyType.Default, version: '7.2.15', name: '@angular/http'},
                {type: NodeDependencyType.Default, version: '7.3.7', name: '@angular/material'},
                {type: NodeDependencyType.Default, version: '7.2.15', name: '@angular/platform-browser'},
                {type: NodeDependencyType.Default, version: '7.2.15', name: '@angular/platform-browser-dynamic'},
                {type: NodeDependencyType.Default, version: '7.2.15', name: '@angular/router'},
                {type: NodeDependencyType.Default, version: '2.6.9', name: 'core-js'},
                {type: NodeDependencyType.Default, version: '5.7.2', name: '@fortawesome/fontawesome-free'},
                {type: NodeDependencyType.Default, version: '2.0.8', name: 'hammerjs'},
                {type: NodeDependencyType.Default, version: '1.7.16', name: 'lux-components'},
                {type: NodeDependencyType.Default, version: '4.0.5', name: 'material-design-icons-iconfont'},
                {type: NodeDependencyType.Default, version: '6.5.2', name: 'rxjs'},
                {type: NodeDependencyType.Default, version: '0.8.29', name: 'zone.js'},
                {type: NodeDependencyType.Default, version: '4.11.0', name: 'node-sass'}
            ];

            dependencies.forEach(dependency => {
                updatePackageJsonDependency(tree, context, dependency);
            });
            logSuccess('Dependencies aktualisiert.');
            return tree;
        });
    };
}

/**
 * Fügt die neuen dev-dependencies der package.json hinzu.
 */
export function addPackageJsonDevDependencies(): Rule {
    return (tree: Tree, context: SchematicContext) => {
        logInfoWithDescriptor('Füge neue DevDependencies zu package.json hinzu.');
        return waitForTreeCallback(tree, () => {
            const devDependencies: NodeDependency[] = [
                {type: NodeDependencyType.Dev, version: '0.10.7', name: '@angular-devkit/build-angular'},
                {type: NodeDependencyType.Dev, version: '7.3.9', name: '@angular/cli'},
                {type: NodeDependencyType.Dev, version: '7.2.15', name: '@angular/compiler-cli'},
                {type: NodeDependencyType.Dev, version: '7.2.15', name: '@angular/language-service'},
                {type: NodeDependencyType.Dev, version: '1.1.10', name: '@compodoc/compodoc'},
                {type: NodeDependencyType.Dev, version: '2.8.16', name: '@types/jasmine'},
                {type: NodeDependencyType.Dev, version: '2.0.6', name: '@types/jasminewd2'},
                {type: NodeDependencyType.Dev, version: '10.14.12', name: '@types/node'},
                {type: NodeDependencyType.Dev, version: '4.5.0', name: 'codelyzer'},
                {type: NodeDependencyType.Dev, version: '3.4.0', name: 'jasmine-core'},
                {type: NodeDependencyType.Dev, version: '4.2.1', name: 'jasmine-spec-reporter'},
                {type: NodeDependencyType.Dev, version: '3.1.4', name: 'karma'},
                {type: NodeDependencyType.Dev, version: '2.2.0', name: 'karma-chrome-launcher'},
                {type: NodeDependencyType.Dev, version: '1.1.0', name: 'karma-firefox-launcher'},
                {type: NodeDependencyType.Dev, version: '1.0.0', name: 'karma-ie-launcher'},
                {type: NodeDependencyType.Dev, version: '0.4.2', name: 'karma-edge-launcher'},
                {type: NodeDependencyType.Dev, version: '1.0.0', name: 'karma-safari-launcher'},
                {type: NodeDependencyType.Dev, version: '1.0.1', name: 'karma-cli'},
                {type: NodeDependencyType.Dev, version: '2.0.5', name: 'karma-coverage-istanbul-reporter'},
                {type: NodeDependencyType.Dev, version: '1.1.2', name: 'karma-jasmine'},
                {type: NodeDependencyType.Dev, version: '1.4.0', name: 'karma-jasmine-html-reporter'},
                {type: NodeDependencyType.Dev, version: '3.2.1', name: 'nsp'},
                {type: NodeDependencyType.Dev, version: '5.4.2', name: 'protractor'},
                {type: NodeDependencyType.Dev, version: '2.0.3', name: 'retire'},
                {type: NodeDependencyType.Dev, version: '7.0.1', name: 'ts-node'},
                {type: NodeDependencyType.Dev, version: '5.18.0', name: 'tslint'},
                {type: NodeDependencyType.Dev, version: '1.1.2', name: 'tslint-angular'},
                {type: NodeDependencyType.Dev, version: '3.2.4', name: 'typescript'}
            ];

            devDependencies.forEach(devDependency => {
                updatePackageJsonDependency(tree, context, devDependency);
            });
            logSuccess('DevDependencies aktualisiert.');
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
            `Weitere Informationen: https://confluence.gfi.ihk.de/display/AF/Update+Guide#UpdateGuide-UmstellungaufVersion1.7.16`
        );
        return tree;
    };
}
