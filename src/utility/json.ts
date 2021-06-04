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
