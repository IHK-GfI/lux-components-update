import { SchematicContext, Tree } from '@angular-devkit/schematics';
import { JsonAstObject, JsonParseMode, parseJsonAst } from '@angular-devkit/core';
import {
    appendPropertyInAstObject,
    findPropertyInAstObject,
    insertPropertyInAstObjectInOrder
} from '@schematics/angular/utility/json-utils';
import chalk from 'chalk';
import { formattedSchematicsException, logInfo } from './logging';

const packageJsonPath = '/package.json';

export interface NodeScript {
    name: string;
    command: string;
    overwrite?: boolean;
}

export function controlPackageJsonScript(tree: Tree, context: SchematicContext, script: NodeScript): void {
    const packageJson = readPackageJson(tree);
    const scriptsNode = findPropertyInAstObject(packageJson, 'scripts');
    const recorder = tree.beginUpdate(packageJsonPath);
    if (!scriptsNode) {
        // Haven't found the script key, add it to the root of the package.json.
        appendPropertyInAstObject(recorder, packageJson, 'scripts', {
            [script.name]: script.command,
        }, 2);
    }
    else if (scriptsNode.kind === 'object') {
        // check if script already added
        const scriptNode = findPropertyInAstObject(scriptsNode, script.name);

        if (!scriptNode) {
            // script not found, add it.
            insertPropertyInAstObjectInOrder(recorder, scriptsNode, script.name, script.command, 4);
            logInfo(`Script ` + chalk.redBright(`${script.name}`) + chalk.redBright(':') + chalk.redBright(`${script.command}`) + ` nicht gefunden, füge es neu hinzu.`);
        }
        else if (script.overwrite) {
            // script found, update command if overwrite.
            const {end, start} = scriptNode;
            recorder.remove(start.offset, end.offset - start.offset);
            recorder.insertRight(start.offset, JSON.stringify(script.command));
            logInfo(`Script ` + chalk.redBright(`${script.name}`) + ` gefunden, aktualisiere das Command.`);
        }
    }

    tree.commitUpdate(recorder);
}

function readPackageJson(tree: Tree): JsonAstObject {
    const buffer = tree.read(packageJsonPath);
    if (buffer === null) {
        throw formattedSchematicsException('Konnte die package.json nicht lesen.');
    }
    const content = buffer.toString();

    const packageJson = parseJsonAst(content, JsonParseMode.Strict);
    if (packageJson.kind != 'object') {
        throw formattedSchematicsException('Ungültige package.json, ein Object wurde erwartet.');
    }

    return packageJson;
}