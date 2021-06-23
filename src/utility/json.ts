import { Tree } from '@angular-devkit/schematics';
import { FormattingOptions, Node, parseTree } from 'jsonc-parser';
import { formattedSchematicsException } from './logging';

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
