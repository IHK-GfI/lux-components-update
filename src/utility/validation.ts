import { SchematicContext, Tree } from "@angular-devkit/schematics";
import { getPackageJsonDependency } from "./dependencies";
import * as semver from "semver";
import { formattedSchematicsException, logInfo } from './logging';

export function validateNodeVersion(context: SchematicContext, minimumVersion: string) {
    logInfo('Prüfe die Node.js Version.');
    const currentNodeVersion = process.versions.node;
    const minimumNodeVersion = minimumVersion;
    if (semver.cmp(currentNodeVersion, "<", minimumNodeVersion)) {
        throw formattedSchematicsException(
            `Ihre Node.js Version ist ${currentNodeVersion}.\n` +
            `LUX benötigt allerdings die Version ${minimumNodeVersion}.\n` +
            `Bitte aktualisieren Sie Node.js.`
        );
    }
}

/**
 * Prüft die Angular Version der aufrufenden Applikation und wirft eine SchematicsException, wenn
 * die Version nicht der erforderlichen entspricht.
 * @param tree
 * @param context
 * @param angularVersion
 */
export function validateAngularVersion(tree: Tree, context: SchematicContext, angularVersion: string) {
    logInfo('Prüfe die Angular Version.');
    const currentVersion = getPackageJsonDependency(tree, "@angular/common").version.replace(/([\^~])/g, '');
    if (!currentVersion.startsWith(angularVersion)) {
        throw formattedSchematicsException(
            `Sie nutzen die Angular Version ${currentVersion}.`,
            `Dieser Generator benötigt allerdings eine ${angularVersion}.`,
            `Bitte nutzen Sie eine neuere Schematic für Ihr Update.`
        );
    }
}

/**
 * Prüft die LUX-Components Version der aufrufenden Applikation und wirft eine SchematicsException, wenn
 * die Version nicht der erforderlichen entspricht.
 * @param tree
 * @param context
 * @param minimumVersion
 */
export function validateIhkGfiLuxComponentsVersion(tree: Tree, context: SchematicContext, minimumVersion: string) {
    logInfo('Prüfe die LUX-Components version.');
    const currentLuxComponentsVersion = getPackageJsonDependency(tree, "@ihk-gfi/lux-components").version;
    const requiredLuxComponentsVersion = minimumVersion;
    // aktuelle Version > benötigte Version
    if (semver.gt(currentLuxComponentsVersion, requiredLuxComponentsVersion)) {
        throw formattedSchematicsException(
            `Sie nutzen die LUX-Components Version ${currentLuxComponentsVersion}.`,
            `Dieser Generator benötigt allerdings die (ältere) Version ${requiredLuxComponentsVersion}.`,
            `Bitte nutzen Sie eine neuere Schematic für Ihr Update.`
        );
    }
    // aktuelle Version < benötigte Version
    else if (semver.lt(currentLuxComponentsVersion, requiredLuxComponentsVersion)) {
        throw formattedSchematicsException(
            `Sie nutzen die LUX-Components Version ${currentLuxComponentsVersion}.`,
            `Dieser Generator benötigt allerdings die (neuere) Version ${requiredLuxComponentsVersion}.`,
            `Bitte aktualisieren Sie Ihre Version der LUX-Components.`
        );
    }
}

/**
 * Prüft die LUX-Components Version der aufrufenden Applikation und wirft eine SchematicsException, wenn
 * die Version nicht der erforderlichen entspricht.
 * @param tree
 * @param context
 * @param minimumVersion
 */
export function validateLuxComponentsVersion(tree: Tree, context: SchematicContext, minimumVersion: string) {
    logInfo('Prüfe die LUX-Components version.');
    const currentLuxComponentsVersion = getPackageJsonDependency(tree, "lux-components").version;
    const requiredLuxComponentsVersion = minimumVersion;
    // aktuelle Version > benötigte Version
    if (semver.gt(currentLuxComponentsVersion, requiredLuxComponentsVersion)) {
        throw formattedSchematicsException(
            `Sie nutzen die LUX-Components Version ${currentLuxComponentsVersion}.`,
            `Dieser Generator benötigt allerdings die (ältere) Version ${requiredLuxComponentsVersion}.`,
            `Bitte nutzen Sie eine neuere Schematic für Ihr Update.`
        );
    }
    // aktuelle Version < benötigte Version
    else if (semver.lt(currentLuxComponentsVersion, requiredLuxComponentsVersion)) {
        throw formattedSchematicsException(
            `Sie nutzen die LUX-Components Version ${currentLuxComponentsVersion}.`,
            `Dieser Generator benötigt allerdings die (neuere) Version ${requiredLuxComponentsVersion}.`,
            `Bitte aktualisieren Sie Ihre Version der LUX-Components.`
        );
    }
}
