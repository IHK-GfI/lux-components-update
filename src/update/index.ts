import { chain, Rule, SchematicContext, SchematicsException, Tree } from '@angular-devkit/schematics';
import * as chalk from 'chalk';
import { applyEdits, findNodeAtLocation, modify } from 'jsonc-parser';
import * as ts from 'typescript';
import { updateDependencies } from '../update-dependencies/index';
import { deleteFilesInDirectory } from '../utility/files';
import { jsonFormattingOptions, readJson, readJsonAsString } from '../utility/json';
import { logInfo, logInfoWithDescriptor, logSuccess } from '../utility/logging';
import { getSourceNodes, removeImport, removeProvider } from '../utility/typescript';
import { applyRuleIf, finish, messageInfoRule, messageSuccessRule } from '../utility/util';
import { validateLuxComponentsVersion, validateNodeVersion } from '../utility/validation';

export const updateMajorVersion = '11';
export const updateMinVersion = '10.8.1';
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
      deleteOldThemeDir(options),
      clearStylesScss(options),
      addThemeAssets(options),
      updateAppComponent(options),
      updateAppModule(options),
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

export function deleteOldThemeDir(options: any): Rule {
  return chain([
    messageInfoRule(`Altes Theming-Verzeichnis '/src/theming/' wird gelöscht...`),
    deleteFilesInDirectory(options, '/src/theming/', []),
    messageSuccessRule(`Altes Theming-Verzeichnis wurde gelöscht.`),
  ]);
}

export function addThemeAssets(options: any): Rule {
  return chain([
    messageInfoRule(`Datei "angular.json" wird aktualisiert...`),
    (tree: Tree, context: SchematicContext) => {
      const filePath = '/angular.json';
      const value = { "glob": "*.css", "input": "./node_modules/@ihk-gfi/lux-components-theme/prebuilt-themes", "output": "./assets/themes" };

      let contentAsNode = readJson(tree, filePath);
      const testAssetsNode = findNodeAtLocation(contentAsNode, ['projects', options.project, 'architect', 'test', 'options', 'assets']);
      if (testAssetsNode) {
        const angularJson = readJsonAsString(tree, filePath);
        const edits = modify(angularJson, ['projects', options.project, 'architect', 'test', 'options', 'assets', 0], value, { formattingOptions: jsonFormattingOptions, isArrayInsertion: true });
        if (edits) {
          tree.overwrite(
            filePath,
            applyEdits(angularJson, edits)
          );
          logInfo(`LUX-Themes im Assets-Abschnitt (build) hinzugefügt.`);
        }
      }

      contentAsNode = readJson(tree, filePath);
      const buildAssetsNode = findNodeAtLocation(contentAsNode, ['projects', options.project, 'architect', 'build', 'options', 'assets']);
      if (buildAssetsNode) {
        const angularJson = readJsonAsString(tree, filePath);
        const edits = modify(angularJson, ['projects', options.project, 'architect', 'build', 'options', 'assets', 0], value, { formattingOptions: jsonFormattingOptions, isArrayInsertion: true });
        if (edits) {
          tree.overwrite(
            filePath,
            applyEdits(angularJson, edits)
          );
          logInfo(`LUX-Themes im Assets-Abschnitt (test) hinzugefügt.`);
        }
      }
    },
    messageSuccessRule(`\`Datei "angular.json" wurde aktualisiert.`)
  ]);
}

export function clearStylesScss(options: any): Rule {
  return chain([
    messageInfoRule(`Datei "styles.scss" wird aktualisiert...`),
   (tree: Tree, context: SchematicContext) => {
     const filePath = (options.path ? options.path : '') + '/src/styles.scss';
     const content = (tree.read(filePath) as Buffer).toString();
     if (content) {
       let modifiedContent = '';

       const lines = content.split('\n');
       if (lines) {
         lines.forEach(line => {
           // Zeilen mit dem folgenden Inhalt werden nicht übernommen.
           if (line.indexOf('@fortawesome/fontawesome-free') < 0 &&
               line.indexOf('material-design-icons.css') < 0 &&
               line.indexOf('@angular/material/theming') < 0 &&
               line.indexOf('theming/luxtheme') < 0 &&
               line.indexOf('mat-core()') < 0 &&
               line.indexOf('angular-material-theme($lux-theme)') < 0
           ) {
             modifiedContent += line + '\n';
           }
         });

         if (content !== modifiedContent) {
           tree.overwrite(filePath, modifiedContent);
         }
       }
     }
   },
    messageSuccessRule(`\`Datei "styles.scss" wurde aktualisiert.`)
  ]);
}



export function updateAppComponent(options: any): Rule {
  return chain([
    messageInfoRule(`AppComponent wird aktualisiert...`),
    (tree: Tree, context: SchematicContext) => {
      // Init
      const fileName   = 'app.component.ts';
      const filePath   = (options.path ? options.path : '') + '/src/app/app.component.ts';
      const content    = (tree.read(filePath) as Buffer).toString();
      const sourceFile = ts.createSourceFile(`${ fileName }`, content, ts.ScriptTarget.Latest, true);
      const nodes      = getSourceNodes(sourceFile);

      const constructorNode = nodes.find(n => n.kind === ts.SyntaxKind.Constructor);
      if (constructorNode) {
        // Constructor bereits vorhanden
        let constructorChildren = constructorNode.getChildren();

        if (!constructorChildren) {
          throw new SchematicsException(`Der Konstruktor in der Klasse ${ fileName } hat keine Syntaxkinder.`);
        }

        const parameterListNode = constructorChildren.find(n => n.kind === ts.SyntaxKind.SyntaxList);
        if (!parameterListNode) {
          throw new SchematicsException(`Der Konstruktor in der Klasse ${ fileName } hat keine SyntaxList.`);
        }

        const parameterNodes = parameterListNode.getChildren();

        const constructorBodyNode = constructorChildren.find(n => n.kind === ts.SyntaxKind.Block);

        if (!constructorBodyNode) {
          throw new SchematicsException(`Der Konstruktor in der Klasse ${ fileName } hat keinen Body.`);
        }

        const constructorSiblings      = constructorBodyNode.getChildren();
        const constructorBodyStartNode = constructorSiblings.find(n => n.kind === ts.SyntaxKind.SyntaxList);

        if (!constructorBodyStartNode) {
          throw new SchematicsException(`Der Konstruktor in der Klasse ${ fileName } hat keine öffnende Klammer.`);
        }

        const updateRecorder = tree.beginUpdate(filePath);
        if (parameterNodes.length == 0) {
          // Constructor ohne Parameter
          updateRecorder.insertLeft(parameterListNode.pos, `private themeService: LuxThemeService`);
          updateRecorder.insertLeft(constructorBodyStartNode.pos, `\n    themeService.loadTheme();`);
        } else if (parameterNodes.length > 0) {
          // Constructor mit Parameter
          updateRecorder.insertLeft(parameterNodes[ parameterNodes.length - 1 ].end, ', private themeService: LuxThemeService');
          updateRecorder.insertLeft(constructorBodyStartNode.pos, `\n    themeService.loadTheme();`);
        }
        tree.commitUpdate(updateRecorder);
      } else {
        // Constructor muss mit angelegt werden
        const classNode = nodes.find(n => n.kind === ts.SyntaxKind.ClassKeyword);

        if (!classNode) {
          throw new SchematicsException(`In der Klasse ${ fileName } fehlt das SyntaxKind.ClassKeyword.`);
        }

        const siblings            = classNode.parent.getChildren();
        const classIdentifierNode = siblings.slice(siblings.indexOf(classNode)).find(n => n.kind === ts.SyntaxKind.Identifier);

        if (!classIdentifierNode) {
          throw new SchematicsException(`In der Klasse ${ fileName } fehlt das SyntaxKind.Identifier`);
        }

        if (classIdentifierNode.getText() !== 'AppComponent') {
          throw new SchematicsException(`In der Klasse ${ fileName } wurde der Klassenname "AppComponent" erwartet.`);
        }

        const curlyNodeIndex = siblings.findIndex(n => n.kind === ts.SyntaxKind.FirstPunctuation);
        const listNode       = siblings.slice(curlyNodeIndex).find(n => n.kind === ts.SyntaxKind.SyntaxList);

        if (!listNode) {
          throw new SchematicsException(`Die Klasse ${ fileName } hat keinen Inhalt.`);
        }

        const updateRecorder = tree.beginUpdate(filePath);
        updateRecorder.insertLeft(listNode.pos + 1, `\n  constructor(private themeService: LuxThemeService){\n    themeService.loadTheme();\n  }\n`);
        tree.commitUpdate(updateRecorder);
      }
      logInfo(`LuxThemeService im Konstruktor hinzugefügt.`);

      // Import hinzufügen
      const updateRecorder = tree.beginUpdate(filePath);
      updateRecorder.insertLeft(0, `import { LuxThemeService } from '@ihk-gfi/lux-components';\n`);
      tree.commitUpdate(updateRecorder);
      logInfo(`Import für LuxThemeService hinzugefügt.`);
    },
    messageSuccessRule(`AppComponent wurde aktualisiert.`)
  ]);
}

export function updateAppModule(options: any): Rule {
  return chain([
    messageInfoRule(`AppComponent wird aktualisiert...`),
    (tree: Tree, context: SchematicContext) => {
      const filePath = (options.path ? options.path : '') + `/src/app/app.module.ts`;

      removeImport(tree, filePath, '@ihk-gfi/lux-components', 'LuxAppFooterButtonService');
      removeImport(tree, filePath, '@ihk-gfi/lux-components','LuxAppFooterLinkService');
      removeImport(tree, filePath, '@ihk-gfi/lux-components','LuxSnackbarService');
      removeImport(tree, filePath, '@ihk-gfi/lux-components','LuxErrorService');
      removeImport(tree, filePath, '@ihk-gfi/lux-components','LuxMasterDetailMobileHelperService');
      removeImport(tree, filePath, '@ihk-gfi/lux-components','LuxStepperHelperService');
      removeImport(tree, filePath, '@ihk-gfi/lux-components','LuxConsoleService');

      removeProvider(tree, filePath, 'LuxAppFooterButtonService');
      removeProvider(tree, filePath, 'LuxAppFooterLinkService');
      removeProvider(tree, filePath, 'LuxSnackbarService');
      removeProvider(tree, filePath, 'LuxErrorService');
      removeProvider(tree, filePath, 'LuxMasterDetailMobileHelperService');
      removeProvider(tree, filePath, 'LuxStepperHelperService');
      removeProvider(tree, filePath, 'LuxConsoleService');
    },
    messageSuccessRule(`AppComponent wurde aktualisiert.`)
  ]);
}

