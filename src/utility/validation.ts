import { SchematicContext, Tree } from '@angular-devkit/schematics';
import { getPackageJsonDependency } from './dependencies';
import * as semver from 'semver';
import { formattedSchematicsException, logInfo } from './logging';
import * as chalk from 'chalk';

export function validateNodeVersion(context: SchematicContext, minimumVersion: string) {
  if (semver.lt(process.versions.node, minimumVersion)) {
    logInfo(`Nodeversion ${process.versions.node} -> ${chalk.redBright('fail')}`);
    throw formattedSchematicsException(
      `Ihre Node.js Version ist ${process.versions.node}.\n` +
        `LUX benötigt allerdings die Version ${minimumVersion}.\n` +
        `Bitte aktualisieren Sie Node.js.`
    );
  }
  logInfo(`Nodeversion ${process.versions.node} -> ok`);
}

/**
 * Prüft die Angular Version der aufrufenden Applikation und wirft eine SchematicsException, wenn
 * die Version nicht der erforderlichen entspricht.
 * @param tree
 * @param context
 * @param angularVersion
 */
export function validateAngularVersion(tree: Tree, context: SchematicContext, angularVersion: string) {
  const currentVersion = getPackageJsonDependency(tree, '@angular/common').version.replace(/([\^~])/g, '');
  if (!semver.satisfies(currentVersion, angularVersion)) {
    logInfo(`Angularversion ${currentVersion} -> ${chalk.redBright('fail')}`);
    throw formattedSchematicsException(
      `Sie nutzen die Angular Version ${currentVersion}.`,
      `Dieser Generator benötigt allerdings eine ${angularVersion}.`,
      `Bitte nutzen Sie eine neuere Schematic für Ihr Update.`
    );
  }
  logInfo(`Angularversion ${currentVersion} -> ok`);
}

export function validateLuxComponentsVersion(tree: Tree, versionRange: string) {
  const version = getPackageJsonDependency(tree, '@ihk-gfi/lux-components').version.replace(/([\^~])/g, '');
  if (!semver.satisfies(version, versionRange)) {
    logInfo(`LUX-Componentsversion ${version} -> ${chalk.redBright('fail')}`);
    throw formattedSchematicsException(
      `Die LUX-Componentsversion ${version} wird nicht unterstützt. ` +
        `Dieser Updater unterstützt die Versionen ${versionRange}.`
    );
  }
  logInfo(`LUX-Componentsversion ${version} -> ok`);
}
