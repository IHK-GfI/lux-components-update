import { Tree } from '@angular-devkit/schematics';
import { applyEdits, findNodeAtLocation, FormattingOptions, modify, Node, parseTree } from 'jsonc-parser';
import { formattedSchematicsException, logInfo } from './logging';

export const jsonFormattingOptions: FormattingOptions = {
  insertSpaces: true,
  tabSize: 2,
  eol: '\n'
};

/**
 * Liest die Json-Datei aus und wirft Fehlermeldungen, sollte die Json-Datei nicht gefunden oder
 * in einem falschen Format sein.
 * @param context
 * @param tree
 */
export function readJson(tree: Tree, filePath: string): Node {
  const buffer = tree.read(filePath);
  if (buffer === null) {
    throw formattedSchematicsException(`Konnte die Datei ${filePath} nicht lesen.`);
  }
  const content = buffer.toString();

  let result = parseTree(content) as Node;
  return result;
}

/**
 * Liest die Json-Datei aus und wirft Fehlermeldungen, sollte die Json-Datei nicht gefunden oder
 * in einem falschen Format sein.
 * @param context
 * @param tree
 */
export function readJsonAsString(tree: Tree, filePath: string): string {
  const buffer = tree.read(filePath);
  if (buffer === null) {
    throw formattedSchematicsException(`Konnte die Datei ${filePath} nicht lesen.`);
  }
  return buffer.toString();
}

/**
 * Diese Methode fügt dem Skript den Teil am Index hinzu.
 * Beispiel 1:
 * script: 'ng build --aot && npm run move-de-files'
 * part: ' --localize'
 * Ergebnis: 'ng build --aot --localize && npm run move-de-files'
 *
 * Beispiel 2:
 * script: 'ng build --aot && npm run move-de-files'
 * part: ' --localize'
 * index: 1
 * Ergebnis: 'ng build --aot && npm run move-de-files --localize'
 * @param script Ein NPM-Skript aus der Datei "package.json" (z.B 'ng build --aot && npm run move-de-files').
 * @param part Ein Teil (z.B. --localize).
 * @param index Ein Index (z.B. 0).
 */
export function appendScript(script: string, part: string, index?: number) {
  let newSkript = '';

  const splitArr = script.split(' && ');
  if (splitArr.length === 1) {
    newSkript = script + part;
  } else {
    splitArr[index ? index : 0] = splitArr[index ? index : 0] + part;
    newSkript = splitArr.join(' && ');
  }

  return newSkript;
}

/**
 * Diese Methode liefert den Index im Array des Objekts mit der übergebenen Property zurück.
 *
 * Beispiel: findObjectIndexInArray(node, 'glob', '*.css') = 1
 * ```json
 * 'assets': [
 *   'src/assets',
 *   {
 *     'glob': '*.css',
 *     'input': './node_modules/@ihk-gfi/lux-components-theme/prebuilt-themes',
 *     'output': './assets/themes'
 *   },
 *   'src/favicon.ico',
 * ]
 * ```
 *
 * @param arrayNode Ein Konten, der ein Array als Wert hat.
 * @param propertyName Ein Propertyname (z.B. glob).
 * @param propertyValue Ein Propertywert (z.B. *.css).
 */
export function findObjectIndexInArray(arrayNode: Node, propertyName: string, propertyValue: string): number {
  let arrayIndex = -1;
  if (arrayNode.children) {
    for (let i = 0; i < arrayNode.children.length; i++) {
      const assetChild = arrayNode.children[i];
      if (assetChild.type === 'object' && assetChild.children && assetChild.children.length > 0) {
        const assetObjectChildren = assetChild.children;
        if (assetObjectChildren) {
          for (let j = 0; j < assetObjectChildren.length; j++) {
            if (assetObjectChildren[j].type === 'property') {
              const propertyChildren = assetObjectChildren[j].children ?? [];
              if (
                propertyChildren.length > 1 &&
                propertyChildren[0].value === propertyName &&
                propertyChildren[1].value === propertyValue
              ) {
                arrayIndex = i;
                break;
              }
            }
          }
        }
      } else if (assetChild.type === 'string' && assetChild.value === propertyValue) {
        arrayIndex = i;
        break;
      }
    }
  }

  return arrayIndex;
}

/**
 * Diese Methode liefert den Index im Array des Werts zurück.
 *
 * Beispiel: findStringIndexInArray(node, 'src/favicon.ico') = 2
 * ```json
 * 'assets': [
 *   'src/assets',
 *   {
 *     'glob': '*.css',
 *     'input': './node_modules/@ihk-gfi/lux-components-theme/prebuilt-themes',
 *     'output': './assets/themes'
 *   },
 *   'src/favicon.ico',
 * ]
 * ```
 *
 * @param arrayNode Ein Konten, der ein Array als Wert hat.
 * @param value Ein Wert (z.B. 'src/favicon.ico').
 */
export function findStringIndexInArray(arrayNode: Node, value: string): number {
  let arrayIndex = -1;
  if (arrayNode.children) {
    for (let i = 0; i < arrayNode.children.length; i++) {
      const assetChild = arrayNode.children[i];
      if (assetChild.type === 'string' && assetChild.value === value) {
        arrayIndex = i;
        break;
      }
    }
  }

  return arrayIndex;
}

export function removeJsonNode(tree: Tree, filePath: string, jsonPath: (string | any)[], message = `Den Abschnitt "${JSON.stringify(jsonPath)}" gelöscht.`) {
  const contentAsNode  = readJson(tree, filePath);
  const testAssetsNode = findNodeAtLocation(contentAsNode, jsonPath);
  if (testAssetsNode) {
    const angularJson = readJsonAsString(tree, filePath);
    const edits       = modify(angularJson, jsonPath, void 0, { formattingOptions: jsonFormattingOptions });
    if (edits) {
      tree.overwrite(filePath, applyEdits(angularJson, edits));
      logInfo(message);
    }
  }
}
