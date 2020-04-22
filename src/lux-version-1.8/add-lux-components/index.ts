import { chain, Rule, SchematicContext, Tree, } from '@angular-devkit/schematics';
import { getProject } from '@schematics/angular/utility/project';
import { NodeDependency, NodeDependencyType, updatePackageJsonDependency } from '../../utility/dependencies';
import { iterateFilesAndModifyContent, moveFilesToDirectory } from '../../utility/files';
import { formattedSchematicsException, logInfoWithDescriptor, logSuccess, } from '../../utility/logging';
import { replaceAll, runInstallAndLogToDos, waitForTreeCallback } from '../../utility/util';
import { validateAngularVersion, validateNodeVersion } from '../../utility/validation';

/**
 * Haupt-Rule für diesen Schematic-Generator.
 * @param options
 */
export const addluxComponents: (options: any) => Rule = (options: any) => {
    return chain([
        setupProject(options),
        checkVersions(),
        updateApp(options),
        updateStylesScss(options),
        updateTheming(options),
        updateIndexHtml(options),
        updatePackageJsonDependencies(),
        updatePackageJsonDevDependencies(),
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
            const angularVersion = '8.';
            validateAngularVersion(tree, context, angularVersion);

            const minimumNodeVersion = '10.0.0';
            validateNodeVersion(context, minimumNodeVersion);

            logSuccess(`Versionen erfolgreich geprüft.`);
            return tree;
        });
    };
}

export function updateIndexHtml(options: any): Rule {
    return (tree: Tree, context: SchematicContext) => {
        logInfoWithDescriptor('Aktualisiere die Datei "index.html".');

        iterateFilesAndModifyContent(tree, options.path, (filePath: string, content: string) => {
            let modifiedContent = replaceAll(content, '<body>', '<body style="margin: 0">');

            if (content !== modifiedContent) {
                tree.overwrite(filePath, modifiedContent);
            }
        }, 'index.html');

    }
}

export function updateApp(options: any): Rule {
    return moveFilesToDirectory(options, 'files/app', 'src/app');
}

export function updateTheming(options: any): Rule {
    return moveFilesToDirectory(options, 'files/theming', 'src/theming');
}

export function updateStylesScss(options: any): Rule {
    return moveFilesToDirectory(options, 'files/styles', 'src/');
}

/**
 * Aktualisiert die package.json des Projekts.
 */
export function updatePackageJson(): Rule {
    return (tree: Tree, context: SchematicContext) => {
        logInfoWithDescriptor('Aktualisiere LUX-Components Version auf 1.8.7.');
        return waitForTreeCallback(tree, () => {
            const newDependency: NodeDependency = {
                type   : NodeDependencyType.Default,
                version: '1.8.7',
                name   : '@ihk-gfi/lux-components'
            };
            updatePackageJsonDependency(tree, context, newDependency);
            logSuccess(`package.json erfolgreich aktualisiert.`);
            return tree;
        });
    };
}

export function updatePackageJsonDependencies(): Rule {
    return (tree: Tree, context: SchematicContext) => {
        logInfoWithDescriptor('Füge neue Dependencies zu package.json hinzu.');
        return waitForTreeCallback(tree, () => {
            const dependencies: NodeDependency[] = [
                { type: NodeDependencyType.Default, version: '8.2.7', name: '@angular/animations' },
                { type: NodeDependencyType.Default, version: '8.2.7', name: '@angular/common' },
                { type: NodeDependencyType.Default, version: '8.2.7', name: '@angular/core' },
                { type: NodeDependencyType.Default, version: '8.0.0-beta.27', name: '@angular/flex-layout' },
                { type: NodeDependencyType.Default, version: '8.2.7', name: '@angular/forms' },
                { type: NodeDependencyType.Default, version: '8.2.7', name: '@angular/platform-browser' },
                { type: NodeDependencyType.Default, version: '8.2.7', name: '@angular/platform-browser-dynamic' },
                { type: NodeDependencyType.Default, version: '8.2.7', name: '@angular/router' },
                { type: NodeDependencyType.Default, version: '8.2.0', name: '@angular/cdk' },
                { type: NodeDependencyType.Default, version: '8.2.0', name: '@angular/material' },
                { type: NodeDependencyType.Default, version: '3.2.1', name: 'core-js' },
                { type: NodeDependencyType.Default, version: '5.0.1', name: 'material-design-icons-iconfont' },
                { type: NodeDependencyType.Default, version: '6.5.3', name: 'rxjs' },
                { type: NodeDependencyType.Default, version: '0.10.2', name: 'zone.js' },
                { type: NodeDependencyType.Default, version: '2.0.8', name: 'hammerjs' },
                { type: NodeDependencyType.Default, version: '5.11.2', name: '@fortawesome/fontawesome-free' },
                { type: NodeDependencyType.Default, version: '1.8.7', name: '@ihk-gfi/lux-components' },
                { type: NodeDependencyType.Default, version: '6.0.2', name: 'ng2-pdf-viewer' }
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
export function updatePackageJsonDevDependencies(): Rule {
    return (tree: Tree, context: SchematicContext) => {
        logInfoWithDescriptor('Füge neue DevDependencies zu package.json hinzu.');
        return waitForTreeCallback(tree, () => {
            const devDependencies: NodeDependency[] = [
                { type: NodeDependencyType.Dev, version: '0.803.5', name: '@angular-devkit/build-angular' },
                { type: NodeDependencyType.Dev, version: '8.2.7', name: '@angular/compiler' },
                { type: NodeDependencyType.Dev, version: '8.2.7', name: '@angular/compiler-cli' },
                { type: NodeDependencyType.Dev, version: '8.3.5', name: '@angular/cli' },
                { type: NodeDependencyType.Dev, version: '8.2.7', name: '@angular/language-service' },
                { type: NodeDependencyType.Dev, version: '1.1.10', name: '@compodoc/compodoc' },
                { type: NodeDependencyType.Dev, version: '3.4.0', name: '@types/jasmine' },
                { type: NodeDependencyType.Dev, version: '2.0.6', name: '@types/jasminewd2' },
                { type: NodeDependencyType.Dev, version: '12.7.5', name: '@types/node' },
                { type: NodeDependencyType.Dev, version: '5.1.1', name: 'codelyzer' },
                { type: NodeDependencyType.Dev, version: '3.5.0', name: 'jasmine-core' },
                { type: NodeDependencyType.Dev, version: '4.2.1', name: 'jasmine-spec-reporter' },
                { type: NodeDependencyType.Dev, version: '4.3.0', name: 'karma' },
                { type: NodeDependencyType.Dev, version: '3.1.0', name: 'karma-chrome-launcher' },
                { type: NodeDependencyType.Dev, version: '2.0.0', name: 'karma-cli' },
                { type: NodeDependencyType.Dev, version: '2.1.0', name: 'karma-coverage-istanbul-reporter' },
                { type: NodeDependencyType.Dev, version: '0.4.2', name: 'karma-edge-launcher' },
                { type: NodeDependencyType.Dev, version: '1.2.0', name: 'karma-firefox-launcher' },
                { type: NodeDependencyType.Dev, version: '1.0.0', name: 'karma-ie-launcher' },
                { type: NodeDependencyType.Dev, version: '2.0.1', name: 'karma-jasmine' },
                { type: NodeDependencyType.Dev, version: '1.4.2', name: 'karma-jasmine-html-reporter' },
                { type: NodeDependencyType.Dev, version: '1.0.0', name: 'karma-safari-launcher' },
                { type: NodeDependencyType.Dev, version: '5.4.2', name: 'protractor' },
                { type: NodeDependencyType.Dev, version: '2.0.3', name: 'retire' },
                { type: NodeDependencyType.Dev, version: '4.12.0', name: 'node-sass' },
                { type: NodeDependencyType.Dev, version: '8.4.1', name: 'ts-node' },
                { type: NodeDependencyType.Dev, version: '5.20.0', name: 'tslint' },
                { type: NodeDependencyType.Dev, version: '3.0.2', name: 'tslint-angular' },
                { type: NodeDependencyType.Dev, version: '3.4.5', name: 'typescript' },
                { type: NodeDependencyType.Dev, version: '^0.0.64', name: '@ihk-gfi/lux-components-update' },
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
            `Keine`, `Fertig!`
        );
        return tree;
    };
}
