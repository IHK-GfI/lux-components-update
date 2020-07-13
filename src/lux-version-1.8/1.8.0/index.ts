import { chain, Rule, SchematicContext, Tree } from '@angular-devkit/schematics';
import { getProject } from '@schematics/angular/utility/project';
import { iterateFilesAndModifyContent, moveFilesToDirectory } from '../../utility/files';
import { controlPackageJsonScript, NodeScript } from '../../utility/scripts';
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
  logSuccess
} from '../../utility/logging';
import * as chalk from 'chalk';
import { checkSmoketestScriptExists, replaceAll, runInstallAndLogToDos, waitForTreeCallback } from '../../utility/util';

/**
 * Haupt-Rule für diesen Schematic-Generator.
 * @param options
 */
export const luxVersion: (options: any) => Rule = (options: any) => {
  return chain([
    setupProject(options),
    checkVersions(),
    updateScripts(),
    deletePackageJsonDevDependencies(),
    updatePackageJsonDependencies(),
    updatePackageJsonDevDependencies(),
    updateTheming(options),
    addIeTsConfig(options),
    updateTsConfigJson(),
    updateAngularJson(),
    updateDeepInCss(options),
    updateDeepInScss(options),
    updateViewAndContentChildDefinitions(options),
    updateBrowserlist(options),
    updatePolyfills(options),
    todosForUser()
  ]);
};

export function updatePolyfills(options: any): Rule {
  return (tree: Tree, context: SchematicContext) => {
    logInfoWithDescriptor('Polyfills für den IE wieder eintragen.');

    iterateFilesAndModifyContent(
      tree,
      options.path,
      (filePath: string, content: string) => {
        let modifiedContent = content.replace(
          "import 'core-js/es6/reflect';",
          "import 'core-js/es/array';\n" +
            "import 'core-js/es/date';\n" +
            "import 'core-js/es/function';\n" +
            "import 'core-js/es/map';\n" +
            "import 'core-js/es/math';\n" +
            "import 'core-js/es/number';\n" +
            "import 'core-js/es/object';\n" +
            "import 'core-js/es/parse-float';\n" +
            "import 'core-js/es/parse-int';\n" +
            '/** Evergreen browsers require these. **/\n' +
            "import 'core-js/es/regexp';\n" +
            "import 'core-js/es/set';\n" +
            "import 'core-js/es/string';\n" +
            '/** IE9, IE10 and IE11 requires all of the following polyfills. **/\n' +
            "import 'core-js/es/symbol';\n" +
            "import 'core-js/es/weak-map';\n" +
            "import 'core-js/es/reflect';"
        );

        if (content !== modifiedContent) {
          tree.overwrite(filePath, modifiedContent);
        }
      },
      'polyfills.ts'
    );

    return tree;
  };
}

export function updateTsConfigJson(): Rule {
  return (tree: Tree, context: SchematicContext) => {
    logInfoWithDescriptor('Aktualisiere die Datei "tsconfig.json".');
    return waitForTreeCallback(tree, () => {
      const tsConfigJsonFile = tree.read('tsconfig.json');

      if (tsConfigJsonFile) {
        const tsConfigJsonFileObject = JSON.parse(tsConfigJsonFile.toString('utf-8'));

        tsConfigJsonFileObject.angularCompilerOptions = {
          ...tsConfigJsonFileObject.angularCompilerOptions,
          enableIvy: false
        };

        tree.overwrite('tsconfig.json', JSON.stringify(tsConfigJsonFileObject, null, 2));
      } else {
        throw formattedSchematicsException('tsconfig.json konnte nicht gelesen werden.');
      }

      logSuccess(`In der tsconfig.json Ivy eintragen.`);
      return tree;
    });
  };
}

export function updateViewAndContentChildDefinitions(options: any): Rule {
  return (tree: Tree, context: SchematicContext) => {
    logInfoWithDescriptor('Setze "{static: false}" für die View- und ContentChild-Properties mit einem ToDo.');

    iterateFilesAndModifyContent(
      tree,
      options.path,
      (filePath: string, content: string) => {
        let modifiedContent = replaceAll(content, '/* TODO: add static flag */ {}', '{ static: false }');

        if (content !== modifiedContent) {
          tree.overwrite(filePath, modifiedContent);
        }
      },
      '.ts'
    );

    return tree;
  };
}

export function updateDeepInScss(options: any): Rule {
  return (tree: Tree, context: SchematicContext) => {
    logInfoWithDescriptor('Ersetze "/deep/" durch "::ng-deep" in SCSS-Dateien.');

    iterateFilesAndModifyContent(
      tree,
      options.path,
      (filePath: string, content: string) => {
        let modifiedContent = replaceAll(content, '/deep/', '::ng-deep');

        if (content !== modifiedContent) {
          tree.overwrite(filePath, modifiedContent);
        }
      },
      '.scss'
    );

    return tree;
  };
}

export function updateDeepInCss(options: any): Rule {
  return (tree: Tree, context: SchematicContext) => {
    logInfoWithDescriptor('Ersetze "/deep/" durch "::ng-deep" in CSS-Dateien.');

    iterateFilesAndModifyContent(
      tree,
      options.path,
      (filePath: string, content: string) => {
        let modifiedContent = replaceAll(content, '/deep/', '::ng-deep');

        if (content !== modifiedContent) {
          tree.overwrite(filePath, modifiedContent);
        }
      },
      '.css'
    );

    return tree;
  };
}

export function updateBrowserlist(options: any): Rule {
  return (tree: Tree, context: SchematicContext) => {
    logInfoWithDescriptor(`` + 'Aktiviere in der Browserslist die Unterstützung für den IE.');

    iterateFilesAndModifyContent(
      tree,
      options.path,
      (filePath: string, content: string) => {
        let modifiedContent = content.replace("not IE 9-11 # For IE 9-11 support, remove 'not'.", 'IE 9-11');

        if (content !== modifiedContent) {
          tree.overwrite(filePath, modifiedContent);
        }
      },
      'browserslist'
    );

    return tree;
  };
}

export function updateAngularJson(): Rule {
  return (tree: Tree, context: SchematicContext) => {
    logInfoWithDescriptor('Aktualisiere die Datei "angular.json".');
    return waitForTreeCallback(tree, () => {
      const angularJsonFile = tree.read('angular.json');

      if (angularJsonFile) {
        const angularJsonFileObject = JSON.parse(angularJsonFile.toString('utf-8'));

        const project = Object.keys(angularJsonFileObject['projects'])[0];

        angularJsonFileObject.projects[project].architect.build.configurations = {
          ...angularJsonFileObject.projects[project].architect.build.configurations,
          es5: {
            tsConfig: 'src/tsconfig.app.ie.json'
          }
        };

        angularJsonFileObject.projects[project].architect.serve.configurations = {
          ...angularJsonFileObject.projects[project].architect.serve.configurations,
          es5: {
            browserTarget: project + ':build:es5'
          }
        };

        tree.overwrite('angular.json', JSON.stringify(angularJsonFileObject, null, 2));
      } else {
        throw formattedSchematicsException('angular.json konnte nicht gelesen werden.');
      }

      logSuccess(`Die angular.json für den alten IE11 aktualisiert.`);
      return tree;
    });
  };
}

export function updateScripts(): Rule {
  return (tree: Tree, context: SchematicContext) => {
    logInfo(`Aktualisiere das ${chalk.redBright('security')}-Skript.`);
    const securityScript: NodeScript = {
      name: 'security',
      command: 'npm audit --registry=https://registry.npmjs.org --audit-level high',
      overwrite: true
    };
    controlPackageJsonScript(tree, context, securityScript);
    logSuccess('Skript aktualisiert.');

    logInfo(`Füge das ${chalk.redBright('start-ie')}-Skript hinzu.`);
    const startIeScript: NodeScript = {
      name: 'start-ie',
      command: 'ng serve --configuration es5 --public-host=http://localhost:4200',
      overwrite: true
    };
    controlPackageJsonScript(tree, context, startIeScript);
    logSuccess('Skript aktualisiert.');

    logInfo(`Aktualisiere das ${chalk.redBright('build')}-Skript.`);
    const buildScript: NodeScript = {
      name: 'build',
      command: 'node --max_old_space_size=4024 ./node_modules/@angular/cli/bin/ng build --source-map',
      overwrite: true
    };
    controlPackageJsonScript(tree, context, buildScript);
    logSuccess('Skript aktualisiert.');

    logInfo(`Aktualisiere das ${chalk.redBright('build-aot')}-Skript.`);
    const buildAotScript: NodeScript = {
      name: 'build-aot',
      command: 'node --max_old_space_size=4024 ./node_modules/@angular/cli/bin/ng build --aot',
      overwrite: true
    };
    controlPackageJsonScript(tree, context, buildAotScript);
    logSuccess('Skript aktualisiert.');

    logInfo(`Aktualisiere das ${chalk.redBright('buildzentral')}-Skript.`);
    const buildProdScript: NodeScript = {
      name: 'buildzentral',
      command: 'node --max_old_space_size=4024 ./node_modules/@angular/cli/bin/ng build --prod',
      overwrite: true
    };
    controlPackageJsonScript(tree, context, buildProdScript);
    logSuccess('Skript aktualisiert.');
  };
}

/**
 * Prüft, ob die Property "project" gesetzt ist und
 * erstellt wenn nötig einen Standard-Pfad zum Projekt, wenn keiner bekannt ist.
 * @param options
 */
export function setupProject(options: any): Rule {
  return (tree: Tree, context: SchematicContext) => {
    logNewUpdate('1.8.0');
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
  };
}

/**
 * Prüft ob die Versionen des Projekts mit den erforderlichen Versionen dieses Updates übereinstimmen.
 */
export function checkVersions(): Rule {
  return (tree: Tree, context: SchematicContext) => {
    logInfoWithDescriptor('Starte die Versionsprüfung.');
    return waitForTreeCallback(tree, () => {
      const minimumLuxComponentsVersion = '1.7.21';
      validateLuxComponentsVersion(tree, context, minimumLuxComponentsVersion);

      const minimumNodeVersion = '8.0.0';
      validateNodeVersion(context, minimumNodeVersion);

      logSuccess(`Versionen erfolgreich geprüft.`);
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
        { type: NodeDependencyType.Default, version: '1.8.0', name: 'lux-components' }
      ];

      dependencies.forEach((dependency) => {
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
        { type: NodeDependencyType.Dev, version: '0.0.33', name: 'lux-components-update' }
      ];

      devDependencies.forEach((devDependency) => {
        updatePackageJsonDependency(tree, context, devDependency);
      });
      logSuccess('DevDependencies aktualisiert.');
      return tree;
    });
  };
}

export function deletePackageJsonDevDependencies(): Rule {
  return (tree: Tree, context: SchematicContext) => {
    logInfoWithDescriptor('Füge neue DevDependencies zu package.json hinzu.');
    return waitForTreeCallback(tree, () => {
      const devDependencies: NodeDependency[] = [
        { type: NodeDependencyType.Default, version: '', name: 'nsp' },
        { type: NodeDependencyType.Default, version: '', name: '@angular/compiler' },
        { type: NodeDependencyType.Default, version: '', name: 'node-sass' }
      ];

      devDependencies.forEach((devDependency) => {
        deletePackageJsonDependency(tree, context, devDependency);
      });
      logSuccess('DevDependencies aktualisiert.');
      return tree;
    });
  };
}

export function updateTheming(options: any): Rule {
  return moveFilesToDirectory(options, 'files/theming', 'src/theming');
}

export function addIeTsConfig(options: any): Rule {
  return moveFilesToDirectory(options, 'files/config', 'src/');
}

/**
 * Gibt die offen stehenden ToDos (Aufgaben, die der Generator nicht übernehmen konnte) für den User aus.
 */
export function todosForUser(): Rule {
  return (tree: Tree, context: SchematicContext) => {
    runInstallAndLogToDos(
      context,
      `Bitte starten Sie ${chalk.redBright('npm run smoketest')} um möglichen Fehlern vorzugreifen.`,
      `Weitere Informationen: https://confluence.gfi.ihk.de/display/AF/Update+Guide#UpdateGuide-UmstellungaufVersion1.8.0`
    );
    return tree;
  };
}
