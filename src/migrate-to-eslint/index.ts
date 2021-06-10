import { chain, Rule, SchematicContext, SchematicsException, Tree } from '@angular-devkit/schematics';
import * as chalk from 'chalk';
import { applyEdits, Edit, modify } from 'jsonc-parser';
import * as ts from 'typescript';
import { iterateFilesAndModifyContent, moveFilesToDirectory } from '../utility/files';
import { jsonFormattingOptions, readJsonAsString } from '../utility/json';
import { logInfo } from '../utility/logging';
import { getSourceNodes, removeImport, removeInterface } from '../utility/typescript';
import { finish, messageInfoRule, messageSuccessRule } from '../utility/util';

export function migrateToEsLint(options: any): Rule {
  return chain([
    messageInfoRule(`Bereitet das LUX-Componentsprojekt für die Migration auf ES-Lint vor...`),
    copyFiles(options),
    updatePackageJson(options),
    updateAngularJson(options),
    deleteEmptyLifecyleHooksInTsFiles(options),
    messageSuccessRule(`Die Vorbereitungen wurden abgeschlossen.`),
    finish(
      `
     
${chalk.yellowBright('Wichtig! Die folgenden Schritte müssen noch manuell ausgeführt werden:')} 
- In der Console ${chalk.greenBright('ng add @angular-eslint/schematics')} ausführen.
- In der Console ${chalk.greenBright('ng g @angular-eslint/schematics:convert-tslint-to-eslint ' + options.project)} ausführen.
  ? Would you like to remove TSLint and its related config if there are no TSLint projects remaining after this conversion? (Y/n) ${chalk.greenBright(`yes`)}
  ? Would you like to ignore the existing TSLint config? Recommended if the TSLint config has not been altered much as it makes the new ESLint config cleaner. (y/N) ${chalk.greenBright(`yes`)}
- In der Console ${chalk.greenBright(`npm run lint`)} ausführen.
- Lint-Fehler beheben
- Fertig!  
`
    )
  ]);
}

function removeLifeCycleHookMethod(tree: Tree, filePath: string, lifeCycleHookMethodeName: string) {
  const content    = (tree.read(filePath) as Buffer).toString();
  const fileName   = filePath.substring(filePath.lastIndexOf('/') + 1, filePath.length);
  const sourceFile = ts.createSourceFile(`${ fileName }`, content, ts.ScriptTarget.Latest, true);

  const nodes       = getSourceNodes(sourceFile);
  const methodNodes = nodes.filter((n) => n.kind === ts.SyntaxKind.MethodDeclaration);
  if (methodNodes) {
    methodNodes.forEach(methodNode => {

      const methodNameNode = methodNode.getChildren().find((n) => n.kind === ts.SyntaxKind.Identifier);
      if (!methodNameNode) {
        throw new SchematicsException(`Die Methode in der Datei ${ fileName } hat keinen Namen.`);

      }
      if (methodNameNode.getText() === lifeCycleHookMethodeName) {
        const blockNode = methodNode.getChildren().find((n) => n.kind === ts.SyntaxKind.Block);

        if (!blockNode) {
          throw new SchematicsException(`Die Methode in der Datei ${ fileName } hat keinen Block.`);
        }

        const syntaxListNode = blockNode.getChildren().find((n) => n.kind === ts.SyntaxKind.SyntaxList);

        if (!syntaxListNode) {
          throw new SchematicsException(`Die Methode in der Datei ${ fileName } hat keinen Inhalt.`);
        }

        if (syntaxListNode.getChildren().length === 0) {
          // Leere Lifecycle-Hook-Methode löschen
          const updateRecorder = tree.beginUpdate(filePath);
          updateRecorder.remove(methodNode.pos, methodNode.end - methodNode.pos);
          tree.commitUpdate(updateRecorder);

          const interfaceName = methodNameNode.getText().substring(2);
          removeInterface(tree, filePath, interfaceName, false);
          removeImport(tree, filePath, '@angular/core', interfaceName, false);

          logInfo(`Aus der Datei "${filePath}" wurde der leere Lifecycle-Hook "${lifeCycleHookMethodeName}" entfernt.`);
        }
      }
    });
  }
}

export function deleteEmptyLifecyleHooksInTsFiles(options: any): Rule {
  return chain([
    messageInfoRule(`Leere Lifecycle-Hooks werden entfernt...`),
    (tree: Tree, context: SchematicContext) => {
      iterateFilesAndModifyContent(
        tree,
        options.path,
        (filePath: string, content: string) => {
          removeLifeCycleHookMethod(tree, filePath, 'ngOnChanges');
          removeLifeCycleHookMethod(tree, filePath, 'ngOnInit');
          removeLifeCycleHookMethod(tree, filePath, 'ngDoCheck');
          removeLifeCycleHookMethod(tree, filePath, 'ngAfterContentInit');
          removeLifeCycleHookMethod(tree, filePath, 'ngAfterContentChecked');
          removeLifeCycleHookMethod(tree, filePath, 'ngAfterViewInit');
          removeLifeCycleHookMethod(tree, filePath, 'ngAfterViewChecked');
          removeLifeCycleHookMethod(tree, filePath, 'ngOnDestroy');
        },
        '.component.ts'
      );
    },
    messageSuccessRule(`Leere Lifecycle-Hooks wurden entfernt.`)
  ]);
}

export function updateAngularJson(options: any): Rule {
  return chain([
    messageInfoRule(`Die Datei "angular.json" wird angepasst...`),
    (tree: Tree, _context: SchematicContext) => {
      const filePath = `/angular.json`;

      const newValuesArr = [
        { path: ['projects', options.project, 'architect', 'app-lint'], value: undefined, message: `Der alte Abschnitt "app-lint" wurde entfernt.`},
        { path: ['projects', options.project, 'architect', 'spec-lint'], value: undefined, message: `Der alte Abschnitt "spec-lint" wurde entfernt.`},
        { path: ['projects', options.project + '-e2e', 'architect', 'lint'], value: undefined, message: `Der alte Abschnitt "lint" wurde entfernt.`}
      ];

      newValuesArr.forEach(change => {
        const tsConfigJson = readJsonAsString(tree, filePath);
        const edits: Edit[] = modify(tsConfigJson, change.path, change.value, { formattingOptions: jsonFormattingOptions })

        tree.overwrite(
          filePath,
          applyEdits(tsConfigJson, edits)
        );

        logInfo(change.message);
      });

      return tree;
    },
    messageSuccessRule(`Die Datei "angular.json" wurde angepasst.`)
  ]);
}

export function updatePackageJson(options: any): Rule {
  return chain([
    messageInfoRule(`Die Datei "package.json" wird angepasst...`),
    (tree: Tree, _context: SchematicContext) => {
      const filePath = `/package.json`;

      const newValuesArr = [
        { path: ['scripts', 'lint'], value: "ng lint --fix", message: `Skript "lint" aktualisiert.`},
        { path: ['devDependencies', 'eslint-plugin-jsdoc'], value: "32.3.1", message: `devDependencies "eslint-plugin-jsdoc" hinzugefügt.`}
      ];

      newValuesArr.forEach(change => {
        const tsConfigJson = readJsonAsString(tree, filePath);
        const edits: Edit[] = modify(tsConfigJson, change.path, change.value, { formattingOptions: jsonFormattingOptions })

        tree.overwrite(
          filePath,
          applyEdits(tsConfigJson, edits)
        );

        logInfo(change.message);
      });

      return tree;
    },
    messageSuccessRule(`Die Datei "package.json" wurde angepasst.`)
  ]);
}

export function copyFiles(options: any): Rule {
  return chain([
    messageInfoRule(`Die benötigten Dateien werden kopiert...`),
    moveFilesToDirectory(options, 'files', '/'),
    messageSuccessRule(`Die benötigten Dateien wurden kopiert.`)
  ]);
}
