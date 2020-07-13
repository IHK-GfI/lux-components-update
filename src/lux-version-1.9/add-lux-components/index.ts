import { chain, Rule, SchematicContext, Tree } from '@angular-devkit/schematics';
import { getProject } from '@schematics/angular/utility/project';
import { NodeDependency, NodeDependencyType, updatePackageJsonDependencyForceUpdate } from '../../utility/dependencies';
import { iterateFilesAndModifyContent, moveFilesToDirectory } from '../../utility/files';
import { formattedSchematicsException, logInfoWithDescriptor, logSuccess } from '../../utility/logging';
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
      const angularVersion = '9.';
      validateAngularVersion(tree, context, angularVersion);

      const minimumNodeVersion = '10.16.3';
      validateNodeVersion(context, minimumNodeVersion);

      logSuccess(`Versionen erfolgreich geprüft.`);
      return tree;
    });
  };
}

export function updateIndexHtml(options: any): Rule {
  return (tree: Tree, context: SchematicContext) => {
    logInfoWithDescriptor('Aktualisiere die Datei "index.html".');

    iterateFilesAndModifyContent(
      tree,
      options.path,
      (filePath: string, content: string) => {
        let modifiedContent = replaceAll(content, '<body>', '<body style="margin: 0">');

        if (content !== modifiedContent) {
          tree.overwrite(filePath, modifiedContent);
        }
      },
      'index.html'
    );
  };
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
    logInfoWithDescriptor('Aktualisiere LUX-Components Version auf 1.9.0');
    return waitForTreeCallback(tree, () => {
      const newDependency: NodeDependency = {
        type: NodeDependencyType.Default,
        version: '1.9.3',
        name: '@ihk-gfi/lux-components'
      };
      updatePackageJsonDependencyForceUpdate(tree, context, newDependency, true);
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
        { type: NodeDependencyType.Default, version: '9.1.0', name: '@angular/animations' },
        { type: NodeDependencyType.Default, version: '9.1.0', name: '@angular/common' },
        { type: NodeDependencyType.Default, version: '9.1.0', name: '@angular/core' },
        { type: NodeDependencyType.Default, version: '9.1.0', name: '@angular/compiler' },
        { type: NodeDependencyType.Default, version: '9.0.0-beta.29', name: '@angular/flex-layout' },
        { type: NodeDependencyType.Default, version: '9.1.0', name: '@angular/forms' },
        { type: NodeDependencyType.Default, version: '9.1.0', name: '@angular/platform-browser' },
        { type: NodeDependencyType.Default, version: '9.1.0', name: '@angular/platform-browser-dynamic' },
        { type: NodeDependencyType.Default, version: '9.1.0', name: '@angular/router' },
        { type: NodeDependencyType.Default, version: '9.1.0', name: '@angular/cdk' },
        { type: NodeDependencyType.Default, version: '9.1.0', name: '@angular/material' },
        { type: NodeDependencyType.Default, version: '3.6.4', name: 'core-js' },
        { type: NodeDependencyType.Default, version: '5.0.1', name: 'material-design-icons-iconfont' },
        { type: NodeDependencyType.Default, version: '6.5.4', name: 'rxjs' },
        { type: NodeDependencyType.Default, version: '0.10.3', name: 'zone.js' },
        { type: NodeDependencyType.Default, version: '1.10.0', name: 'tslib' },
        { type: NodeDependencyType.Default, version: '2.0.8', name: 'hammerjs' },
        { type: NodeDependencyType.Default, version: '5.13.0', name: '@fortawesome/fontawesome-free' },
        { type: NodeDependencyType.Default, version: '6.1.1', name: 'ng2-pdf-viewer' },
        { type: NodeDependencyType.Default, version: '2.2.228', name: 'pdfjs-dist' }
      ];

      dependencies.forEach((dependency) => {
        updatePackageJsonDependencyForceUpdate(tree, context, dependency, true);
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
        { type: NodeDependencyType.Dev, version: '0.901.0', name: '@angular-devkit/build-angular' },
        { type: NodeDependencyType.Dev, version: '9.1.0', name: '@angular/compiler-cli' },
        { type: NodeDependencyType.Dev, version: '9.1.0', name: '@angular/cli' },
        { type: NodeDependencyType.Dev, version: '9.1.0', name: '@angular/language-service' },
        { type: NodeDependencyType.Dev, version: '1.1.11', name: '@compodoc/compodoc' },
        { type: NodeDependencyType.Dev, version: '3.5.7', name: '@types/jasmine' },
        { type: NodeDependencyType.Dev, version: '2.0.8', name: '@types/jasminewd2' },
        { type: NodeDependencyType.Dev, version: '13.7.7', name: '@types/node' },
        { type: NodeDependencyType.Dev, version: '5.2.1', name: 'codelyzer' },
        { type: NodeDependencyType.Dev, version: '3.5.0', name: 'jasmine-core' },
        { type: NodeDependencyType.Dev, version: '4.2.1', name: 'jasmine-spec-reporter' },
        { type: NodeDependencyType.Dev, version: '4.4.1', name: 'karma' },
        { type: NodeDependencyType.Dev, version: '3.1.0', name: 'karma-chrome-launcher' },
        { type: NodeDependencyType.Dev, version: '2.0.0', name: 'karma-cli' },
        { type: NodeDependencyType.Dev, version: '2.1.1', name: 'karma-coverage-istanbul-reporter' },
        { type: NodeDependencyType.Dev, version: '0.4.2', name: 'karma-edge-launcher' },
        { type: NodeDependencyType.Dev, version: '1.3.0', name: 'karma-firefox-launcher' },
        { type: NodeDependencyType.Dev, version: '1.0.0', name: 'karma-ie-launcher' },
        { type: NodeDependencyType.Dev, version: '3.1.1', name: 'karma-jasmine' },
        { type: NodeDependencyType.Dev, version: '1.5.2', name: 'karma-jasmine-html-reporter' },
        { type: NodeDependencyType.Dev, version: '1.0.0', name: 'karma-safari-launcher' },
        { type: NodeDependencyType.Dev, version: '4.13.1', name: 'node-sass' },
        { type: NodeDependencyType.Dev, version: '5.4.3', name: 'protractor' },
        { type: NodeDependencyType.Dev, version: '8.6.2', name: 'ts-node' },
        { type: NodeDependencyType.Dev, version: '5.20.1', name: 'tslint' },
        { type: NodeDependencyType.Dev, version: '3.0.2', name: 'tslint-angular' },
        { type: NodeDependencyType.Dev, version: '3.7.5', name: 'typescript' }
      ];

      devDependencies.forEach((devDependency) => {
        updatePackageJsonDependencyForceUpdate(tree, context, devDependency, true);
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
    runInstallAndLogToDos(context, `Keine`, `Fertig!`);
    return tree;
  };
}
