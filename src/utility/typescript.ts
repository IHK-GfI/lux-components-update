import { SchematicsException, Tree } from '@angular-devkit/schematics';
import { SyntaxKind } from 'typescript';
import * as ts from 'typescript';
import { logInfo } from './logging';

export function getSourceNodes(sourceFile: ts.SourceFile): ts.Node[] {
  const nodes: ts.Node[] = [sourceFile];
  const result: ts.Node[] = [];

  while (nodes.length > 0) {
    const node = nodes.shift();

    if (node) {
      result.push(node);
      if (node.getChildCount(sourceFile) >= 0) {
        nodes.unshift(...node.getChildren());
      }
    }
  }

  return result;
}

export function removeImport(tree: Tree, filePath: string, packageName: string, importName: string) {
  const content    = (tree.read(filePath) as Buffer).toString();
  const fileName = filePath.substring(filePath.lastIndexOf('/') + 1, filePath.length);
  const sourceFile = ts.createSourceFile(`${ fileName }`, content, ts.ScriptTarget.Latest, true);
  const nodes      = getSourceNodes(sourceFile);

  const importNodes = nodes.filter(n => n.kind === ts.SyntaxKind.ImportDeclaration);

  if (importNodes) {
    importNodes.forEach(importNode => {
      const importDeclarationChildren = importNode.getChildren();

      if (!importDeclarationChildren) {
        throw new SchematicsException(`In der Datei ${filePath} gibt es keine ImportDeclaration.`);
      }

      const importNameNode = importDeclarationChildren.find(n => n.kind === ts.SyntaxKind.StringLiteral && n.getText() === `'${packageName}'`);

      if (importNameNode) {
        const importClauseNode = importNode.getChildren().find(n => n.kind === ts.SyntaxKind.ImportClause);

        if (!importClauseNode) {
          throw new SchematicsException(`In der Datei ${filePath} gibt es keine ImportClause.`);
        }

        const namedImportsNode = importClauseNode.getChildren().find(n => n.kind === ts.SyntaxKind.NamedImports);

        if (!namedImportsNode) {
          throw new SchematicsException(`In der Datei ${filePath} gibt es keine NamedImports.`);
        }

        const syntaxListNode = namedImportsNode.getChildren().find(n => n.kind === ts.SyntaxKind.SyntaxList);

        if (!syntaxListNode) {
          throw new SchematicsException(`In der Datei ${filePath} gibt es keine SyntaxList.`);
        }

        const importChildren = syntaxListNode.getChildren();
        if (importChildren) {
          if (importChildren.length === 1) {
            const updateRecorder = tree.beginUpdate(filePath);
            updateRecorder.remove(importNode.pos, importNode.getChildren()[importNode.getChildren().length - 1].end - importNode.pos);
            tree.commitUpdate(updateRecorder);
            logInfo(`Import ${ importName } entfernt.`)
          } else {
            for (let i = 0; i < importChildren.length; i++) {
              if (importChildren[ i ].getText() === importName) {
                const updateRecorder = tree.beginUpdate(filePath);
                if ((i + 1) < importChildren.length && importChildren[ i + 1 ].kind === ts.SyntaxKind.CommaToken) {
                  updateRecorder.remove(importChildren[ i ].pos, importChildren[ i + 1 ].end - importChildren[ i ].pos);
                } else {
                  updateRecorder.remove(importChildren[ i ].pos, importChildren[ i ].end - importChildren[ i ].pos);
                }
                tree.commitUpdate(updateRecorder);
                logInfo(`Import ${ importName } entfernt.`)
              }
            }
          }
        }
      }
    });
  }
}

export function removeProvider(tree: Tree, filePath: string, providerName: string) {
  const content    = (tree.read(filePath) as Buffer).toString();
  const fileName = filePath.substring(filePath.lastIndexOf('/') + 1, filePath.length);
  const sourceFile = ts.createSourceFile(`${ fileName }`, content, ts.ScriptTarget.Latest, true);
  const nodes      = getSourceNodes(sourceFile);

  const providerIdentifierNode = nodes.find(n => n.kind === ts.SyntaxKind.Identifier && n.getText() === 'providers');

  if (providerIdentifierNode) {
    const siblings = providerIdentifierNode.parent.getChildren();

    if (siblings) {
      const providerArrayNode = siblings.find(n => n.kind === ts.SyntaxKind.ArrayLiteralExpression);

      if (providerArrayNode) {
        const providerNode = providerArrayNode.getChildren().find(n => n.kind === ts.SyntaxKind.SyntaxList);
        if (providerNode) {
          const providerChildren = providerNode.getChildren();
          if (providerChildren) {
            for (let i = 0; i < providerChildren.length; i++) {
              if (providerChildren[ i ].getText() === providerName) {
                const updateRecorder = tree.beginUpdate(filePath);
                if ((i + 1) < providerChildren.length && providerChildren[ i + 1 ].kind === ts.SyntaxKind.CommaToken) {
                  updateRecorder.remove(providerChildren[ i ].pos, providerChildren[ i + 1 ].end - providerChildren[ i ].pos);
                } else {
                  updateRecorder.remove(providerChildren[ i ].pos, providerChildren[ i ].end - providerChildren[ i ].pos);
                }
                tree.commitUpdate(updateRecorder);
                logInfo(`Provider ${providerName} entfernt.`)
              }
            }
          }
        }
      }
    }
  }
}

export function getSiblings(node: ts.Node, childKind?: ts.SyntaxKind): ts.Node[] {
  let result: ts.Node[] = [];

  if (node && node.parent.getChildren()) {
    if (childKind) {
      const childNode = node.parent.getChildren().find(child => child.kind === childKind);

      if (!childNode) {
        throw new SchematicsException(`Es konnte kein Knoten vom Typ ${childKind} gefunden werden.`);
      }

      result = childNode.getChildren();
    } else {
      result = node.parent.getChildren();
    }
  }

  return result;
}

export function getPrevSibling(node: ts.Node, childKind?: ts.SyntaxKind): ts.Node | null {
  let result: ts.Node | null = null;

  if (node) {
    let siblings: ts.Node[] = getSiblings(node, childKind);

    if (siblings) {
      const index = siblings.indexOf(node);
      if (index > 0) {
        result = siblings[ index - 1 ];
      }
    }
  }

  return result;
}

export function getNextSibling(node: ts.Node, childKind?: ts.SyntaxKind): ts.Node | null {
  let result: ts.Node | null = null;

  if (node) {
    let siblings: ts.Node[] = getSiblings(node, childKind);

    if (siblings) {
      const index = siblings.indexOf(node);
      if (index >= 0 && index < siblings.length - 1) {
        result = siblings[ index + 1 ];
      }
    }
  }

  return result;
}

export function showTree(node: ts.Node, indent: string = '    '): void {
  console.log(indent + ts.SyntaxKind[node.kind]);

  if (node.getChildCount() === 0) {
    console.log(indent + '    Text: ' + node.getText());
  }

  for(let child of node.getChildren()) {
    showTree(child, indent + '    ');
  }
}
