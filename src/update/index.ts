import { chain, Rule, SchematicContext, SchematicsException, Tree } from '@angular-devkit/schematics';
import * as chalk from 'chalk';
import { applyEdits, Edit, findNodeAtLocation, modify } from 'jsonc-parser';
import * as ts from 'typescript';
import { updateDependencies } from '../update-dependencies/index';
import { deleteFilesInDirectory, moveFilesToDirectory } from '../utility/files';
import { jsonFormattingOptions, readJson, readJsonAsString } from '../utility/json';
import { logInfo, logInfoWithDescriptor, logSuccess } from '../utility/logging';
import {
  addConstructorContent,
  addConstructorParameter, addImport,
  getNextSibling,
  getPrevSibling,
  getSourceNodes,
  removeImport,
  removeProvider
} from '../utility/typescript';
import { applyRuleIf, finish, messageInfoRule, messageSuccessRule } from '../utility/util';
import { validateLuxComponentsVersion, validateNodeVersion } from '../utility/validation';

export const updateMajorVersion = '11';
export const updateMinVersion = '10.8.2';
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
      deleteOldThemeDir(options),
      clearStylesScss(options),
      updateAngularJson(options),
      updateAppComponent(options),
      updateAppModule(options),
      updateTsConfigJson(options),
      addI18N(options),
      updateDependencies(),
      messageSuccessRule(`LUX-Components ${updateMajorVersion} wurden aktualisiert.`)
    ]);
  };
}

export function addI18N(options: any): Rule {
  return chain([
    messageInfoRule(`I18N-Unterstützung wird hinzugefügt...`),
    i18nUpdatePackageJson(options),
    i18nUpdateAngularJson(options),
    i18nCopyMessages(options),
    i18nUpdatePolyfills(options),
    i18nUpdateAppModule(options),
    messageSuccessRule(`I18N-Unterstützung wurde hinzugefügt...`)
  ]);
}

export function i18nUpdateAngularJson(options: any): Rule {
  return chain([
    messageInfoRule(`Die Datei "angular.json" wird angepasst...`),
    (tree: Tree, _context: SchematicContext) => {
      const filePath = `/angular.json`;

      const newValuesArr = [
        {
          path: ['projects', options.project, 'i18n'],
          value: {
            sourceLocale: {
              'code': 'de',
              'baseHref': '/'
            },
            locales: {
              en: 'src/locale/messages.en.xlf'
            }
          },
          message: `Neuen Abschnitt "xi18n" unter projects/${options.project} hinzugefügt.`
        },
        {
          path: ['projects', options.project, 'architect', 'build', 'options', 'localize'],
          value: ["de"],
          message: `Neuen Abschnitt "localize" unter projects/${options.project}/architect/build/options hinzugefügt.`
        },
        {
          path: ['projects', options.project, 'architect', 'build', 'options', 'i18nMissingTranslation'],
          value: "error",
          message: `Neuen Abschnitt "i18nMissingTranslation" unter projects/${options.project}/architect/build/options hinzugefügt.`
        },
        {
          path: ['projects', options.project, 'architect', 'build', 'configurations', 'en'],
          value: {
            "localize": ["en"],
            "aot": true,
            "outputPath": "dist/en",
            "i18nMissingTranslation": "error"
          },
          message: `Neuen Abschnitt "en" unter projects/${options.project}/architect/build/configurations hinzugefügt.`
        },
        {
          path: ['projects', options.project, 'architect', 'serve', 'configurations', 'en'],
          value: {
            "browserTarget": options.project + ":build:en"
          },
          message: `Neuen Abschnitt "en" unter projects/${options.project}/architect/serve/configurations hinzugefügt.`
        }
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

export function i18nUpdatePackageJson(options: any): Rule {
  return chain([
    messageInfoRule(`Die Datei "package.json" wird angepasst...`),
    (tree: Tree, _context: SchematicContext) => {
      const filePath = `/package.json`;

      const newValuesArr = [
        { path: ['scripts', 'move-de-files'], value: "node move-de-files.js", message: `Neues Skript "move-de-files" hinzugefügt.`},
        { path: ['scripts', 'xi18n'], value: "ng extract-i18n --output-path src/locale --ivy", message: `Neues Skript "xi18n" hinzugefügt.`}
      ];

      const packageJsonAsNode = readJson(tree, filePath);

      // Neues start-en-Skript hinzufügen
      const startScriptNode = findNodeAtLocation(packageJsonAsNode, ['scripts', 'start']);
      if (startScriptNode) {
        newValuesArr.push({
          path: ['scripts', 'start-en'],
          value: startScriptNode.value + ' --configuration en',
          message: `Das neue Skript "start-en" hinzugefügt.`
        });
      } else {
        newValuesArr.push({
          path: ['scripts', 'start-en'],
          value: 'ng serve --public-host=http://localhost:4200 --configuration en',
          message: `Das neue Skript "start-en" hinzugefügt.`
        });
      }

      // build-aot-Script anpassen
      const buildAotScriptNode = findNodeAtLocation(packageJsonAsNode, ['scripts', 'build-aot']);
      if (buildAotScriptNode) {
        newValuesArr.push({
          path: ['scripts', 'build-aot'],
          value: buildAotScriptNode.value + ' && npm run move-de-files',
          message: `Dem Skript "build-aot" den Parameter "&& npm run move-de-files" hinzugefügt.`
        });
      } else {
        newValuesArr.push({
          path: ['scripts', 'build-aot'],
          value: 'node --max_old_space_size=4024 ./node_modules/@angular/cli/bin/ng build --aot && npm run move-de-files',
          message: `Das Skript "build-aot" mit dem Parameter "&& npm run move-de-files" hinzugefügt.`
        });
      }

      // buildzentral-Script anpassen
      const buildZentralScriptNode = findNodeAtLocation(packageJsonAsNode, ['scripts', 'buildzentral']);
      if (buildZentralScriptNode) {
        newValuesArr.push({
          path   : ['scripts', 'buildzentral'],
          value  : buildZentralScriptNode.value + " && npm run move-de-files",
          message: `Dem Skript "buildzentral" den Parameter "&& npm run move-de-files" hinzugefügt.`
        });
      } else {
        newValuesArr.push({
          path: ['scripts', 'buildzentral'],
          value: 'node --max_old_space_size=4024 ./node_modules/@angular/cli/bin/ng build --prod && npm run move-de-files',
          message: `Das Skript "buildzentral" mit dem Parameter "&& npm run move-de-files" hinzugefügt.`
        });
      }

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

export function i18nUpdateAppModule(options: any): Rule {
  return chain([
    messageInfoRule(`Die Datei "app.module.ts" wird angepasst...`),
    (tree: Tree, _context: SchematicContext) => {
      const filePath = (options.path ? options.path : '') + `/src/app/app.module.ts`;

      removeImport(tree, filePath, '@angular/core', 'LOCALE_ID');
      removeImport(tree, filePath, '@angular/common', 'registerLocaleData');
      removeImport(tree, filePath, '@angular/common/locales/global/de');

      removeProvider(tree, filePath, 'LOCALE_ID');

      return tree;
    },
    messageSuccessRule(`Die Datei "app.module.ts" wurde angepasst.`)
  ]);
}

export function i18nUpdatePolyfills(options: any): Rule {
  return chain([
    messageInfoRule(`Import wird in der Datei "polyfills.ts" hinzugefügt...`),
    (tree: Tree, _context: SchematicContext) => {
      const filePath = (options.path ? options.path : '') + '/src/polyfills.ts';

      const content = tree.read(filePath);
      if (content) {
        let modifiedContent = '/***************************************************************************************************\n * Load \`$localize\` onto the global scope - used if i18n tags appear in Angular templates.\n */\nimport \'@angular/localize/init\';\n\n';
        modifiedContent += content;

        tree.overwrite(filePath, modifiedContent);
      }

      return tree;
    },
    messageSuccessRule(`Import wird in der Datei "polyfills.ts" hinzugefügt...`)
  ]);
}


export function i18nCopyMessages(options: any): Rule {
  return chain([
    messageInfoRule(`Sprachdateien werden kopiert...`),
    moveFilesToDirectory(options, 'files/locale', 'src/locale'),
    moveFilesToDirectory(options, 'files/scripts', '/'),
    messageSuccessRule(`Sprachdateien wurden kopiert.`)
  ]);
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

export function updateTsConfigJson(options: any): Rule {
  return  chain([
    messageInfoRule(`Datei "tsconfig.json" wird aktualisiert...`),(tree: Tree, _context: SchematicContext) => {
      const filePath = '/tsconfig.json';

      const newValuesArr = [
        { path: ['compilerOptions', 'strict'], value: false, message: `Die Property "compilerOptions.strict" wurde auf "false" gesetzt.`},
        { path: ['compilerOptions', 'noImplicitReturns'], value: true, message: `Die Property "compilerOptions.noImplicitReturns" wurde auf "true" gesetzt.`},
        { path: ['compilerOptions', 'noFallthroughCasesInSwitch'], value: true, message: `Die Property "compilerOptions.noFallthroughCasesInSwitch" wurde auf "true" gesetzt.`},
        { path: ['compilerOptions', 'forceConsistentCasingInFileNames'], value: true, message: `Die Property "compilerOptions.forceConsistentCasingInFileNames" wurde auf "true" gesetzt.`},
        { path: ['compilerOptions', 'lib'], value: ["es2018", "dom"], message: `Die Property "compilerOptions.lib" wurde auf "["es2018", "dom"]" gesetzt.`},
        { path: ['compilerOptions', 'module'], value: "es2020", message: `Die Property "compilerOptions.module" wurde auf "es2020" gesetzt.`},
        { path: ['angularCompilerOptions', 'strictInputAccessModifiers'], value: true, message: `Die Property "angularCompilerOptions.strictInputAccessModifiers" wurde auf "true" gesetzt.`},
        { path: ['angularCompilerOptions', 'strictTemplates'], value: false, message: `Die Property "angularCompilerOptions.strictTemplates" wurde auf "false" gesetzt.`},
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
    } ,
    messageSuccessRule(`Datei "tsconfig.json" wurde aktualisiert.`),
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
            lines.forEach(line => {
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
    messageSuccessRule(`Datei ".browserslistrc" wurde aktualisiert.`),
  ]);
}

export function deleteOldThemeDir(options: any): Rule {
  return chain([
    messageInfoRule(`Altes Theming-Verzeichnis '/src/theming/' wird gelöscht...`),
    deleteFilesInDirectory(options, '/src/theming/', []),
    messageSuccessRule(`Altes Theming-Verzeichnis wurde gelöscht.`),
  ]);
}

export function updateAngularJson(options: any): Rule {
  return (tree: Tree, _context: SchematicContext) => {
    return chain([
      messageInfoRule(`Datei "angular.json" wird aktualisiert...`),
      addThemeAssets(options),
      removeThemeAssets(options),
      addNg2PdfViewer(options),
      messageSuccessRule(`Datei "angular.json" wurde aktualisiert.`),
    ]);
  };
}

export function addNg2PdfViewer(options: any): Rule {
  return (tree: Tree, context: SchematicContext) => {
    const filePath = '/angular.json';
    const value = 'ng2-pdf-viewer';

    let contentAsNode = readJson(tree, filePath);
    const ngPdfViewerNode = findNodeAtLocation(contentAsNode, ['projects', options.project, 'architect', 'build', 'options', 'allowedCommonJsDependencies']);

    let found = false;
    if (ngPdfViewerNode){
      ngPdfViewerNode.children?.forEach(child => {
        if (child.value === value) {
          found = true;
        }
      });
    }

    if (!found) {
      const angularJson = readJsonAsString(tree, filePath);
      const edits = modify(angularJson, ['projects', options.project, 'architect', 'build', 'options', 'allowedCommonJsDependencies', 0], value, { formattingOptions: jsonFormattingOptions, isArrayInsertion: true });
      if (edits) {
        tree.overwrite(
          filePath,
          applyEdits(angularJson, edits)
        );
        logInfo(`"ng2-pdf-viewer" im Abschnitt "allowedCommonJsDependencies" hinzugefügt.`);
      }
    }
  }
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
           logInfo(`Einträge des alten LUX-Themes entfernt.`);
         }
       }
     }
   },
    messageSuccessRule(`\`Datei "styles.scss" wurde aktualisiert.`)
  ]);
}

export function addThemeAssets(options: any): Rule {
  return (tree: Tree, context: SchematicContext) => {
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
        logInfo(`Neues LUX-Theme im Assets-Abschnitt (test) hinzugefügt.`);
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
        logInfo(`Neues LUX-Theme im Assets-Abschnitt (build) hinzugefügt.`);
      }
    }
  }
}

export function removeThemeAssets(options: any): Rule {
  return (tree: Tree, context: SchematicContext) => {
    const filePath = '/angular.json';
    const value = "src/theming/luxtheme.scss";

    let contentAsNode = readJson(tree, filePath);
    const testAssetsNode = findNodeAtLocation(contentAsNode, ['projects', options.project, 'architect', 'test', 'options', 'styles']);
    if (testAssetsNode && testAssetsNode.children) {
      const assetArray = testAssetsNode.children as Array<any>;
      const index = assetArray.findIndex(item => item.value === value);

      if (index >= 0) {
        const angularJson = readJsonAsString(tree, filePath);
        const edits = modify(angularJson, ['projects', options.project, 'architect', 'test', 'options', 'styles', index], void 0, { formattingOptions: jsonFormattingOptions });
        if (edits) {
          tree.overwrite(
            filePath,
            applyEdits(angularJson, edits)
          );
          logInfo(`Altes LUX-Theme aus dem Assets-Abschnitt (test) entfernt.`);
        }
      }
    }

    contentAsNode = readJson(tree, filePath);
    const buildAssetsNode = findNodeAtLocation(contentAsNode, ['projects', options.project, 'architect', 'build', 'options', 'styles']);
    if (buildAssetsNode && buildAssetsNode.children) {
      const assetArray = buildAssetsNode.children as Array<any>;
      const index = assetArray.findIndex(item => item.value === value);

      if (index >= 0) {
        const angularJson = readJsonAsString(tree, filePath);
        const edits = modify(angularJson, ['projects', options.project, 'architect', 'build', 'options', 'styles', index], void 0, { formattingOptions: jsonFormattingOptions });
        if (edits) {
          tree.overwrite(
            filePath,
            applyEdits(angularJson, edits)
          );
          logInfo(`Altes LUX-Theme aus dem Assets-Abschnitt (build) entfernt.`);
        }
      }
    }
  }
}

export function updateAppComponent(options: any): Rule {
  return chain([
    messageInfoRule(`AppComponent wird aktualisiert...`),
    (tree: Tree, context: SchematicContext) => {
      const filePath   = (options.path ? options.path : '') + '/src/app/app.component.ts';
      addImport(tree, filePath, '@ihk-gfi/lux-components', 'LuxThemeService');
      addConstructorParameter(tree, filePath, 'private themeService: LuxThemeService');
      addConstructorContent(tree, filePath, 'themeService.loadTheme();', true);
    },
    messageSuccessRule(`AppComponent wurde aktualisiert.`)
  ]);
}

function updateConfigGenerateLuxTagIds(tree: Tree, filePath: string) {
  const content    = (tree.read(filePath) as Buffer).toString();
  const fileName   = filePath.substring(filePath.lastIndexOf('/') + 1, filePath.length);
  const sourceFile = ts.createSourceFile(`${ fileName }`, content, ts.ScriptTarget.Latest, true);
  const nodes      = getSourceNodes(sourceFile);

  const identifierNode = nodes.find(n => n.kind === ts.SyntaxKind.Identifier && n.getText() === 'luxComponentsConfig');
  if (identifierNode) {
    const objectNode = identifierNode.parent.getChildren().find(n => n.kind === ts.SyntaxKind.ObjectLiteralExpression);
    if (objectNode) {
      const syntaxListNode = objectNode.getChildren().find(n => n.kind === ts.SyntaxKind.SyntaxList);
      if (syntaxListNode) {
        const propertyAssignmentNodes = syntaxListNode.getChildren().filter(n => n.kind === ts.SyntaxKind.PropertyAssignment);
        if (propertyAssignmentNodes) {
          propertyAssignmentNodes.forEach(assignment => {
            const propertyIdentifierNode = assignment.getChildren().find(n => n.kind === ts.SyntaxKind.Identifier);
            if (propertyIdentifierNode && propertyIdentifierNode.getText() === 'generateLuxTagIds') {
              const updateRecorder = tree.beginUpdate(filePath);
              updateRecorder.remove(assignment.pos, assignment.end - assignment.pos);
              updateRecorder.insertLeft(assignment.pos, '\n  generateLuxTagIds: environment.generateLuxTagIds');
              if (!content.match(/import.*\{.*environment.*\}.*from.*/g)) {
                updateRecorder.insertLeft(0, "import { environment } from '../environments/environment';\n");
              }
              tree.commitUpdate(updateRecorder);
              logInfo(`In der Konfiguration wurde der Wert "generateLuxTagIds: environment.generateLuxTagIds" eingetragen.`);
            }
          });
        }
      }
    }
  }
}

function updateConfigLabelConfiguration(tree: Tree, filePath: string) {
  const content    = (tree.read(filePath) as Buffer).toString();
  const fileName   = filePath.substring(filePath.lastIndexOf('/') + 1, filePath.length);
  const sourceFile = ts.createSourceFile(`${ fileName }`, content, ts.ScriptTarget.Latest, true);
  const nodes      = getSourceNodes(sourceFile);

  const identifierNode = nodes.find(n => n.kind === ts.SyntaxKind.Identifier && n.getText() === 'luxComponentsConfig');
  if (identifierNode) {
    const objectNode = identifierNode.parent.getChildren().find(n => n.kind === ts.SyntaxKind.ObjectLiteralExpression);
    if (objectNode) {
      const syntaxListNode = objectNode.getChildren().find(n => n.kind === ts.SyntaxKind.SyntaxList);
      if (syntaxListNode) {
        const propertyAssignmentNodes = syntaxListNode.getChildren().filter(n => n.kind === ts.SyntaxKind.PropertyAssignment);
        if (propertyAssignmentNodes) {
          propertyAssignmentNodes.forEach(assignment => {
            const propertyIdentifierNode = assignment.getChildren().find(n => n.kind === ts.SyntaxKind.Identifier);
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
              logInfo(`Aus der Konfiguration wurde die Property "labelConfiguration" entfernt, damit der Default verwendet wird.`)
              tree.commitUpdate(updateRecorder);
            }
          });
        }
      }
    }
  }
}

function deleteDisplayBindingDebugHint(tree: Tree, filePath: string) {
  const content    = (tree.read(filePath) as Buffer).toString();
  const fileName   = filePath.substring(filePath.lastIndexOf('/') + 1, filePath.length);
  const sourceFile = ts.createSourceFile(`${ fileName }`, content, ts.ScriptTarget.Latest, true);
  const nodes      = getSourceNodes(sourceFile);

  const identifierNode = nodes.find(n => n.kind === ts.SyntaxKind.Identifier && n.getText() === 'luxComponentsConfig');
  if (identifierNode) {
    const objectNode = identifierNode.parent.getChildren().find(n => n.kind === ts.SyntaxKind.ObjectLiteralExpression);
    if (objectNode) {
      const syntaxListNode = objectNode.getChildren().find(n => n.kind === ts.SyntaxKind.SyntaxList);
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
              logInfo(`Aus der Konfiguration wurde die Property "displayBindingDebugHint" entfernt.`)
              tree.commitUpdate(updateRecorder);
            }
          });
        }
      }
    }
  }
}

function updateConfiglookupServiceUrl(tree: Tree, filePath: string) {
  const content    = (tree.read(filePath) as Buffer).toString();
  const fileName   = filePath.substring(filePath.lastIndexOf('/') + 1, filePath.length);
  const sourceFile = ts.createSourceFile(`${ fileName }`, content, ts.ScriptTarget.Latest, true);
  const nodes      = getSourceNodes(sourceFile);

  const identifierNode = nodes.find(n => n.kind === ts.SyntaxKind.Identifier && n.getText() === 'luxComponentsConfig');
  if (identifierNode) {
    const objectNode = identifierNode.parent.getChildren().find(n => n.kind === ts.SyntaxKind.ObjectLiteralExpression);
    if (objectNode) {
      const syntaxListNode = objectNode.getChildren().find(n => n.kind === ts.SyntaxKind.SyntaxList);
      if (syntaxListNode) {
        const propertyAssignmentNodes = syntaxListNode
          .getChildren()
          .filter((n) => n.kind === ts.SyntaxKind.PropertyAssignment);
        if (propertyAssignmentNodes) {
          propertyAssignmentNodes.forEach((assignment) => {
            const propertyIdentifierNode = assignment.getChildren().find((n) => n.kind === ts.SyntaxKind.Identifier);
            const propertyStringNode = assignment.getChildren().find((n) => n.kind === ts.SyntaxKind.StringLiteral);
            if (
              propertyIdentifierNode && propertyIdentifierNode.getText() === 'lookupServiceUrl' &&
              propertyStringNode && (propertyStringNode.getText() === "'/lookup/'" || propertyStringNode.getText() === '"/lookup/"')
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
              logInfo(`Aus der Konfiguration wurde die Property "lookupServiceUrl" entfernt. Der Wert entspricht dem Defaultwert.`)
              tree.commitUpdate(updateRecorder);
            }
          });
        }
      }
    }
  }
}

export function updateAppModule(options: any): Rule {
  return chain([
    messageInfoRule(`AppModule wird aktualisiert...`),
    (tree: Tree, context: SchematicContext) => {
      const filePath = (options.path ? options.path : '') + `/src/app/app.module.ts`;

      updateConfigGenerateLuxTagIds(tree, filePath);
      updateConfigLabelConfiguration(tree, filePath);
      updateConfiglookupServiceUrl(tree, filePath);
      deleteDisplayBindingDebugHint(tree, filePath);

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
    messageSuccessRule(`AppModule wurde aktualisiert.`)
  ]);
}

