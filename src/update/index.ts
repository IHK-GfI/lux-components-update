import { chain, Rule, SchematicContext, Tree } from '@angular-devkit/schematics';
import * as chalk from 'chalk';
import { applyEdits, Edit, findNodeAtLocation, modify } from 'jsonc-parser';
import * as ts from 'typescript';
import { updateDependencies } from '../update-dependencies/index';
import { moveFilesToDirectory } from '../utility/files';
import { jsonFormattingOptions, readJson, readJsonAsString } from '../utility/json';
import { logInfo, logInfoWithDescriptor, logSuccess } from '../utility/logging';
import {
  getNextSibling,
  getPrevSibling,
  getSourceNodes,
} from '../utility/typescript';
import { applyRuleIf, finish, messageInfoRule, messageSuccessRule } from '../utility/util';
import { validateLuxComponentsVersion, validateNodeVersion } from '../utility/validation';

export const updateMajorVersion = '12';
export const updateMinVersion = '11.5.0';
export const updateNodeMinVersion = '12.0.0';

export function update(options: any): Rule {
  return (tree: Tree, _context: SchematicContext) => {
    return chain([
      check(options),
      applyRuleIf(updateMinVersion, updateProject(options)),
      finish(
        `${chalk.yellowBright(
          'Wichtig!!!'
        )} Hinweise im Update Guide beachten -> https://github.com/IHK-GfI/lux-components/wiki/update-guide-${updateMajorVersion}`
      )
    ]);
  };
}

export function updateProject(options: any): Rule {
  return (tree: Tree, _context: SchematicContext) => {
    return chain([
      messageInfoRule(`LUX-Components ${updateMajorVersion} werden aktualisiert...`),
      updateBrowserList(options),
      updateAngularJson(options),
      i18nCopyMessages(options),
      updateDependencies(),
      messageSuccessRule(`LUX-Components ${updateMajorVersion} wurden aktualisiert.`)
    ]);
  };
}

export function check(options: any): Rule {
  return (tree: Tree, _context: SchematicContext) => {
    logInfoWithDescriptor(`Vorbedingungen werden geprüft...`);

    validateNodeVersion(_context, updateNodeMinVersion);
    validateLuxComponentsVersion(tree, `${updateMinVersion} || ^${updateMajorVersion}.0.0`);

    logSuccess(`Vorbedingungen wurden geprüft.`);

    return tree;
  };
}

export function i18nCopyMessages(options: any): Rule {
  return chain([
    messageInfoRule(`Sprachdateien werden kopiert...`),
    moveFilesToDirectory(options, 'files/locale', 'src/locale'),
    messageSuccessRule(`Sprachdateien wurden kopiert.`)
  ]);
}

export function updateBrowserList(options: any): Rule {
  return chain([
    messageInfoRule(`Datei ".browserslistrc" wird aktualisiert...`),
    (tree: Tree, context: SchematicContext) => {
      const filePath = '/.browserslistrc';
      const browserListContent = tree.read(filePath);
      if (browserListContent) {
        const content = (browserListContent as Buffer).toString();
        if (content) {
          let modifiedContent = '';

          const lines = content.split('\n');
          if (lines) {
            lines.forEach((line) => {
              if (line.trim().startsWith('IE 9-11')) {
                modifiedContent += 'not IE 9-10' + '\n';
                modifiedContent += 'IE 11' + '\n';
              } else {
                modifiedContent += line + '\n';
              }
            });

            if (content !== modifiedContent) {
              tree.overwrite(filePath, modifiedContent);
              logInfo(`Einträge für den IE 9-10 entfernt.`);
            }
          }
        }
      } else {
        logInfo(`Die Datei ".browserslistrc" konnte nicht gefunden werden.`);
      }
    },
    messageSuccessRule(`Datei ".browserslistrc" wurde aktualisiert.`)
  ]);
}

export function updateAngularJson(options: any): Rule {
  return (tree: Tree, _context: SchematicContext) => {
    return chain([
      messageInfoRule(`Datei "angular.json" wird aktualisiert...`),
      addThemeAssets(options),
      removeThemeAssets(options),
      addNg2PdfViewer(options),
      messageSuccessRule(`Datei "angular.json" wurde aktualisiert.`)
    ]);
  };
}

export function addNg2PdfViewer(options: any): Rule {
  return (tree: Tree, context: SchematicContext) => {
    const filePath = '/angular.json';
    const value = 'ng2-pdf-viewer';

    let contentAsNode = readJson(tree, filePath);
    const ngPdfViewerNode = findNodeAtLocation(contentAsNode, [
      'projects',
      options.project,
      'architect',
      'build',
      'options',
      'allowedCommonJsDependencies'
    ]);

    let found = false;
    if (ngPdfViewerNode) {
      ngPdfViewerNode.children?.forEach((child) => {
        if (child.value === value) {
          found = true;
        }
      });
    }

    if (!found) {
      const angularJson = readJsonAsString(tree, filePath);
      const edits = modify(
        angularJson,
        ['projects', options.project, 'architect', 'build', 'options', 'allowedCommonJsDependencies', 0],
        value,
        { formattingOptions: jsonFormattingOptions, isArrayInsertion: true }
      );
      if (edits) {
        tree.overwrite(filePath, applyEdits(angularJson, edits));
        logInfo(`"ng2-pdf-viewer" im Abschnitt "allowedCommonJsDependencies" hinzugefügt.`);
      }
    }
  };
}

export function addThemeAssets(options: any): Rule {
  return (tree: Tree, context: SchematicContext) => {
    const filePath = '/angular.json';
    const value = {
      glob: '*.css',
      input: './node_modules/@ihk-gfi/lux-components-theme/prebuilt-themes',
      output: './assets/themes'
    };

    let contentAsNode = readJson(tree, filePath);
    const testAssetsNode = findNodeAtLocation(contentAsNode, [
      'projects',
      options.project,
      'architect',
      'test',
      'options',
      'assets'
    ]);
    if (testAssetsNode) {
      const angularJson = readJsonAsString(tree, filePath);
      const edits = modify(
        angularJson,
        ['projects', options.project, 'architect', 'test', 'options', 'assets', 0],
        value,
        { formattingOptions: jsonFormattingOptions, isArrayInsertion: true }
      );
      if (edits) {
        tree.overwrite(filePath, applyEdits(angularJson, edits));
        logInfo(`Neues LUX-Theme im Assets-Abschnitt (test) hinzugefügt.`);
      }
    }

    contentAsNode = readJson(tree, filePath);
    const buildAssetsNode = findNodeAtLocation(contentAsNode, [
      'projects',
      options.project,
      'architect',
      'build',
      'options',
      'assets'
    ]);
    if (buildAssetsNode) {
      const angularJson = readJsonAsString(tree, filePath);
      const edits = modify(
        angularJson,
        ['projects', options.project, 'architect', 'build', 'options', 'assets', 0],
        value,
        { formattingOptions: jsonFormattingOptions, isArrayInsertion: true }
      );
      if (edits) {
        tree.overwrite(filePath, applyEdits(angularJson, edits));
        logInfo(`Neues LUX-Theme im Assets-Abschnitt (build) hinzugefügt.`);
      }
    }
  };
}

export function removeThemeAssets(options: any): Rule {
  return (tree: Tree, context: SchematicContext) => {
    const filePath = '/angular.json';
    const value = 'src/theming/luxtheme.scss';

    let contentAsNode = readJson(tree, filePath);
    const testAssetsNode = findNodeAtLocation(contentAsNode, [
      'projects',
      options.project,
      'architect',
      'test',
      'options',
      'styles'
    ]);
    if (testAssetsNode && testAssetsNode.children) {
      const assetArray = testAssetsNode.children as Array<any>;
      const index = assetArray.findIndex((item) => item.value === value);

      if (index >= 0) {
        const angularJson = readJsonAsString(tree, filePath);
        const edits = modify(
          angularJson,
          ['projects', options.project, 'architect', 'test', 'options', 'styles', index],
          void 0,
          { formattingOptions: jsonFormattingOptions }
        );
        if (edits) {
          tree.overwrite(filePath, applyEdits(angularJson, edits));
          logInfo(`Altes LUX-Theme aus dem Assets-Abschnitt (test) entfernt.`);
        }
      }
    }

    contentAsNode = readJson(tree, filePath);
    const buildAssetsNode = findNodeAtLocation(contentAsNode, [
      'projects',
      options.project,
      'architect',
      'build',
      'options',
      'styles'
    ]);
    if (buildAssetsNode && buildAssetsNode.children) {
      const assetArray = buildAssetsNode.children as Array<any>;
      const index = assetArray.findIndex((item) => item.value === value);

      if (index >= 0) {
        const angularJson = readJsonAsString(tree, filePath);
        const edits = modify(
          angularJson,
          ['projects', options.project, 'architect', 'build', 'options', 'styles', index],
          void 0,
          { formattingOptions: jsonFormattingOptions }
        );
        if (edits) {
          tree.overwrite(filePath, applyEdits(angularJson, edits));
          logInfo(`Altes LUX-Theme aus dem Assets-Abschnitt (build) entfernt.`);
        }
      }
    }
  };
}

function updateConfigGenerateLuxTagIds(tree: Tree, filePath: string) {
  const content = (tree.read(filePath) as Buffer).toString();
  const fileName = filePath.substring(filePath.lastIndexOf('/') + 1, filePath.length);
  const sourceFile = ts.createSourceFile(`${fileName}`, content, ts.ScriptTarget.Latest, true);
  const nodes = getSourceNodes(sourceFile);

  const identifierNode = nodes.find(
    (n) => n.kind === ts.SyntaxKind.Identifier && n.getText() === 'luxComponentsConfig'
  );
  if (identifierNode) {
    const objectNode = identifierNode.parent
      .getChildren()
      .find((n) => n.kind === ts.SyntaxKind.ObjectLiteralExpression);
    if (objectNode) {
      const syntaxListNode = objectNode.getChildren().find((n) => n.kind === ts.SyntaxKind.SyntaxList);
      if (syntaxListNode) {
        const propertyAssignmentNodes = syntaxListNode
          .getChildren()
          .filter((n) => n.kind === ts.SyntaxKind.PropertyAssignment);
        if (propertyAssignmentNodes) {
          propertyAssignmentNodes.forEach((assignment) => {
            const propertyIdentifierNode = assignment.getChildren().find((n) => n.kind === ts.SyntaxKind.Identifier);
            if (propertyIdentifierNode && propertyIdentifierNode.getText() === 'generateLuxTagIds') {
              const updateRecorder = tree.beginUpdate(filePath);
              updateRecorder.remove(assignment.pos, assignment.end - assignment.pos);
              updateRecorder.insertLeft(assignment.pos, '\n  generateLuxTagIds: environment.generateLuxTagIds');
              if (!content.match(/import.*\{.*environment.*\}.*from.*/g)) {
                updateRecorder.insertLeft(0, "import { environment } from '../environments/environment';\n");
              }
              tree.commitUpdate(updateRecorder);
              logInfo(
                `In der Konfiguration wurde der Wert "generateLuxTagIds: environment.generateLuxTagIds" eingetragen.`
              );
            }
          });
        }
      }
    }
  }
}

function updateConfigLabelConfiguration(tree: Tree, filePath: string) {
  const content = (tree.read(filePath) as Buffer).toString();
  const fileName = filePath.substring(filePath.lastIndexOf('/') + 1, filePath.length);
  const sourceFile = ts.createSourceFile(`${fileName}`, content, ts.ScriptTarget.Latest, true);
  const nodes = getSourceNodes(sourceFile);

  const identifierNode = nodes.find(
    (n) => n.kind === ts.SyntaxKind.Identifier && n.getText() === 'luxComponentsConfig'
  );
  if (identifierNode) {
    const objectNode = identifierNode.parent
      .getChildren()
      .find((n) => n.kind === ts.SyntaxKind.ObjectLiteralExpression);
    if (objectNode) {
      const syntaxListNode = objectNode.getChildren().find((n) => n.kind === ts.SyntaxKind.SyntaxList);
      if (syntaxListNode) {
        const propertyAssignmentNodes = syntaxListNode
          .getChildren()
          .filter((n) => n.kind === ts.SyntaxKind.PropertyAssignment);
        if (propertyAssignmentNodes) {
          propertyAssignmentNodes.forEach((assignment) => {
            const propertyIdentifierNode = assignment.getChildren().find((n) => n.kind === ts.SyntaxKind.Identifier);
            if (propertyIdentifierNode && propertyIdentifierNode.getText() === 'labelConfiguration') {
              const prevSibling = getPrevSibling(assignment, ts.SyntaxKind.SyntaxList);
              const nextSibling = getNextSibling(assignment, ts.SyntaxKind.SyntaxList);
              const updateRecorder = tree.beginUpdate(filePath);
              if (nextSibling) {
                updateRecorder.remove(assignment.pos, nextSibling.end - assignment.pos);
              } else {
                if (prevSibling) {
                  updateRecorder.remove(prevSibling.pos, assignment.end - assignment.pos);
                } else {
                  updateRecorder.remove(assignment.pos, assignment.end - assignment.pos);
                }
              }
              logInfo(
                `Aus der Konfiguration wurde die Property "labelConfiguration" entfernt, damit der Default verwendet wird.`
              );
              tree.commitUpdate(updateRecorder);
            }
          });
        }
      }
    }
  }
}

function deleteDisplayBindingDebugHint(tree: Tree, filePath: string) {
  const content = (tree.read(filePath) as Buffer).toString();
  const fileName = filePath.substring(filePath.lastIndexOf('/') + 1, filePath.length);
  const sourceFile = ts.createSourceFile(`${fileName}`, content, ts.ScriptTarget.Latest, true);
  const nodes = getSourceNodes(sourceFile);

  const identifierNode = nodes.find(
    (n) => n.kind === ts.SyntaxKind.Identifier && n.getText() === 'luxComponentsConfig'
  );
  if (identifierNode) {
    const objectNode = identifierNode.parent
      .getChildren()
      .find((n) => n.kind === ts.SyntaxKind.ObjectLiteralExpression);
    if (objectNode) {
      const syntaxListNode = objectNode.getChildren().find((n) => n.kind === ts.SyntaxKind.SyntaxList);
      if (syntaxListNode) {
        const propertyAssignmentNodes = syntaxListNode
          .getChildren()
          .filter((n) => n.kind === ts.SyntaxKind.PropertyAssignment);
        if (propertyAssignmentNodes) {
          propertyAssignmentNodes.forEach((assignment) => {
            const propertyIdentifierNode = assignment.getChildren().find((n) => n.kind === ts.SyntaxKind.Identifier);
            if (propertyIdentifierNode && propertyIdentifierNode.getText() === 'displayBindingDebugHint') {
              const prevSibling = getPrevSibling(assignment, ts.SyntaxKind.SyntaxList);
              const nextSibling = getNextSibling(assignment, ts.SyntaxKind.SyntaxList);
              const updateRecorder = tree.beginUpdate(filePath);
              if (nextSibling) {
                updateRecorder.remove(assignment.pos, nextSibling.end - assignment.pos);
              } else {
                if (prevSibling) {
                  updateRecorder.remove(prevSibling.pos, assignment.end - prevSibling.pos);
                } else {
                  updateRecorder.remove(assignment.pos, assignment.end - assignment.pos);
                }
              }
              logInfo(`Aus der Konfiguration wurde die Property "displayBindingDebugHint" entfernt.`);
              tree.commitUpdate(updateRecorder);
            }
          });
        }
      }
    }
  }
}

function updateConfiglookupServiceUrl(tree: Tree, filePath: string) {
  const content = (tree.read(filePath) as Buffer).toString();
  const fileName = filePath.substring(filePath.lastIndexOf('/') + 1, filePath.length);
  const sourceFile = ts.createSourceFile(`${fileName}`, content, ts.ScriptTarget.Latest, true);
  const nodes = getSourceNodes(sourceFile);

  const identifierNode = nodes.find(
    (n) => n.kind === ts.SyntaxKind.Identifier && n.getText() === 'luxComponentsConfig'
  );
  if (identifierNode) {
    const objectNode = identifierNode.parent
      .getChildren()
      .find((n) => n.kind === ts.SyntaxKind.ObjectLiteralExpression);
    if (objectNode) {
      const syntaxListNode = objectNode.getChildren().find((n) => n.kind === ts.SyntaxKind.SyntaxList);
      if (syntaxListNode) {
        const propertyAssignmentNodes = syntaxListNode
          .getChildren()
          .filter((n) => n.kind === ts.SyntaxKind.PropertyAssignment);
        if (propertyAssignmentNodes) {
          propertyAssignmentNodes.forEach((assignment) => {
            const propertyIdentifierNode = assignment.getChildren().find((n) => n.kind === ts.SyntaxKind.Identifier);
            const propertyStringNode = assignment.getChildren().find((n) => n.kind === ts.SyntaxKind.StringLiteral);
            if (
              propertyIdentifierNode &&
              propertyIdentifierNode.getText() === 'lookupServiceUrl' &&
              propertyStringNode &&
              (propertyStringNode.getText() === "'/lookup/'" || propertyStringNode.getText() === '"/lookup/"')
            ) {
              const prevSibling = getPrevSibling(assignment, ts.SyntaxKind.SyntaxList);
              const nextSibling = getNextSibling(assignment, ts.SyntaxKind.SyntaxList);
              const updateRecorder = tree.beginUpdate(filePath);
              if (nextSibling) {
                updateRecorder.remove(assignment.pos, nextSibling.end - assignment.pos);
              } else {
                if (prevSibling) {
                  updateRecorder.remove(prevSibling.pos, assignment.end - prevSibling.pos);
                } else {
                  updateRecorder.remove(assignment.pos, assignment.end - assignment.pos);
                }
              }
              logInfo(
                `Aus der Konfiguration wurde die Property "lookupServiceUrl" entfernt. Der Wert entspricht dem Defaultwert.`
              );
              tree.commitUpdate(updateRecorder);
            }
          });
        }
      }
    }
  }
}
