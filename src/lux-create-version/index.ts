import {
  apply,
  chain,
  MergeStrategy,
  mergeWith,
  move,
  Rule,
  SchematicContext,
  Source,
  template,
  Tree,
  UpdateRecorder,
  url
} from "@angular-devkit/schematics";
import {JsonAstObject, JsonValue, normalize, parseJsonAst, Path, strings} from "@angular-devkit/core";
import {formattedSchematicsException} from "../utility/logging";
import * as semver from 'semver';

/**
 * Haupt-Rule für diesen Schematic-Generator.
 * @param options
 */
export const luxCreateVersion: (options: any) => Rule = (options: any) => {
  return chain([
    setup(options),
    createFiles(options),
    addSchematicToCollectionJson(options)
  ]);
};

/**
 * Vorbereitungen zur Generierung
 * @param options 
 */
export function setup(options: any): Rule {
  return (tree: Tree, _context: SchematicContext) => {
    // Prüft, ob die Property "name" gesetzt ist
    if (!options.name) {
      throw formattedSchematicsException('Versionsnummer nicht angegeben!');
    }
    // Node-Version entsprechend der Versionsnummer setzen
    if(semver.cmp(options.name, '<', '1.8.0')) {
      options.nodeVersion = '8.0.0';
    } else {
      options.nodeVersion = '10.0.0';
    }
    // Vorgänger-Version bestimmen
    const latestLuxVersionFolder = tree.getDir('src/lux-version-' + semver.major(options.name) + "." + semver.minor(options.name)).subdirs.filter(element => element.indexOf('add-lux-components') < 0);
    if(latestLuxVersionFolder.length !== 0){
      options.lastVersion = semver.sort(latestLuxVersionFolder)[latestLuxVersionFolder.length-1];
    } else {     
      let luxVersionFolders = tree.getDir('./src').subdirs.filter(dirName => dirName.toString().includes('lux-version'));
      let VersionFolder : any[] = [];
      luxVersionFolders.forEach(element => {
        if (element.indexOf('add-lux-components') < 0) {
          VersionFolder.push(element.substring(12) + '.0');
        }
      });
      const lastestLuxVersionFolder = semver.sort(VersionFolder)[VersionFolder.length-1];
      const latestLuxVersions = tree.getDir('src/lux-version-' + semver.major(lastestLuxVersionFolder) + '.' + semver.minor(lastestLuxVersionFolder)).subdirs;
      options.lastVersion = semver.sort(latestLuxVersions)[latestLuxVersions.length-1];;
    }
    return tree;
  }
}

/**
 * Erzeugt ein Ordner inklusive aller Dateien aus den Templates in ./files.
 * @param options 
 */
export function createFiles(options: any): Rule {
  return (tree: Tree, _context: SchematicContext) => {
    const templateSource: Source = apply(url('./files'), [
        template({
          ...strings,
          ...options,
        }),
        move("src/lux-version-" + semver.major(options.name) + "." + semver.minor(options.name))
    ]);

    return mergeWith(templateSource, MergeStrategy.Default);
  };
}

/**
 * Sucht nach der collection.json und fügt den Schematic-Eintrag hinzu.
 * @param options 
 */
export function addSchematicToCollectionJson(options: any): Rule {
  return (tree: Tree, _context: SchematicContext) => {
    let collectionPath = findCollectionPath(tree);
    if(collectionPath) {
      const collectionJsonContent = tree.read(collectionPath);
      if (!collectionJsonContent) {
        throw formattedSchematicsException('Invalid collection path: ' + collectionPath);
      }
      
      const collectionJsonAst = parseJsonAst(collectionJsonContent.toString('utf-8'));
      if (collectionJsonAst.kind !== 'object') {
        throw formattedSchematicsException('Invalid collection content.');
      }

      for (const property of collectionJsonAst.properties) {
        if (property.key.value == 'schematics') {
          if (property.value.kind !== 'object') {
            throw formattedSchematicsException('Invalid collection.json; schematics needs to be an object.');
          }

          const recorder = tree.beginUpdate(collectionPath);
          appendPropertyInAstObject(recorder, property.value, 
            "lux-version-" + options.name, 
            {
              description: "Aktualisiert die LUX-Applikation zur Version " + options.name + " der LUX-Components.", 
              factory: "./lux-version-" + semver.major(options.name) + "." + semver.minor(options.name) + "/" + options.name + "/index#luxVersion",
              schema: "./lux-version-" + semver.major(options.name) + "." + semver.minor(options.name) + "/" + options.name + "/schema.json"
            }
          );
          tree.commitUpdate(recorder);

          return tree;
        }
      }
    }

  };
}

/**
 * Source: https://github.com/angular/angular-cli/blob/master/packages/schematics/schematics/blank/factory.ts
 */
function appendPropertyInAstObject(recorder: UpdateRecorder, node: JsonAstObject, propertyName: string, value: JsonValue, indent = 4) {
  const indentStr = '\n' + new Array(indent + 1).join(' ');

  if (node.properties.length > 0) {
    // Insert comma.
    const last = node.properties[node.properties.length - 1];
    recorder.insertRight(last.start.offset + last.text.replace(/\s+$/, '').length, ',');
  }

  recorder.insertLeft(
    node.end.offset - 1,
    '  '
    + `"${propertyName}": ${JSON.stringify(value, null, 2).replace(/\n/g, indentStr)}`
    + indentStr.slice(0, -2),
  );
}

/**
 * Sucht nach dem Path der collection.json
 * @param tree 
 */
function findCollectionPath(tree: Tree): Path | undefined {
  try {
    const packageJsonContent = tree.read('/package.json');
    if (packageJsonContent) {
      const packageJson = JSON.parse(packageJsonContent.toString('utf-8'));
      if ('schematics' in packageJson) {
        const path = normalize(packageJson['schematics']);
        if (tree.exists(path)) {
          return path;
        }
      }
    }
  } catch (ex) {
    throw formattedSchematicsException('Could not find collection path.');
  }  
}
