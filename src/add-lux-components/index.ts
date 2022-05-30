import { chain, Rule, SchematicContext, Tree } from '@angular-devkit/schematics';
import * as chalk from 'chalk';
import { applyEdits, Edit, modify } from 'jsonc-parser';
import { updateDependencies } from '../update-dependencies/index';
import {
  updateBuildThemeAssets,
  copyFiles,
  updateMajorVersion,
  updateNodeMinVersion,
  updateTestThemeAssets
} from '../updates/update130000/index';
import { iterateFilesAndModifyContent, moveFilesToDirectory } from '../utility/files';
import {
  findObjectPropertyInArray,
  jsonFormattingOptions,
  readJson,
  readJsonAsString,
  updateJsonArray,
  updateJsonValue
} from '../utility/json';
import { logInfo } from '../utility/logging';
import { finish, messageInfoRule, messageSuccessRule, replaceAll, waitForTreeCallback } from '../utility/util';
import { validateAngularVersion, validateNodeVersion } from '../utility/validation';

export function addLuxComponents(options: any): Rule {
  return (tree: Tree, _context: SchematicContext) => {
    const jsonPathAllowedCommonJS = ['projects', options.project, 'architect', 'build', 'options', 'allowedCommonJsDependencies'];
    const jsonPathBudget = ['projects', options.project, 'architect', 'build', 'configurations', 'production', 'budgets'];
    const budgetValue = {
      "type": "initial",
      "maximumWarning": "1mb",
      "maximumError": "2mb"
    };

    const jsonPathAssetsBuild = ['projects', options.project, 'architect', 'build', 'options', 'assets'];
    const jsonPathAssetsTest = ['projects', options.project, 'architect', 'test', 'options', 'assets'];
    const assetsValues = [
      {
        glob: '*(*min.css|*min.css.map)',
        input: './node_modules/@ihk-gfi/lux-components-theme/prebuilt-themes',
        output: './assets/themes'
      },
      {
        glob: "all.css",
        input: "./node_modules/@fortawesome/fontawesome-free/css",
        output: "./assets/icons/fontawesome/css"
      },
      {
        glob: "*(*.eot|*.ttf|*.woff|*.woff2)",
        input: "./node_modules/@fortawesome/fontawesome-free/webfonts",
        output: "./assets/icons/fontawesome/webfonts"
      },
      {
        glob: "material-design-icons.css*",
        input: "./node_modules/material-design-icons-iconfont/dist",
        output: "./assets/icons/material-icons"
      },
      {
        glob: "*(*.eot|*.ttf|*.woff|*.woff2)",
        input: "./node_modules/material-design-icons-iconfont/dist/fonts",
        output: "./assets/icons/material-icons/fonts"
      }
    ];

    const jsonPathOptimization = ['projects', options.project, 'architect', 'build', 'configurations', 'production', 'optimization'];
    const jsonValueOptimization = {
      "scripts": true,
      "styles": {
        "minify": true,
        "inlineCritical": false
      },
      "fonts": true
    };

    const findBudgetFn = (node) => findObjectPropertyInArray(node, 'type', 'initial');

    return chain([
      check(),
      copyAppFiles(options),
      updatePackageJson(options),
      updateDependencies(),

      updateIndexHtml(options),
      copyFiles(options),
      updateApp(options),
      updateJsonValue(options, '/tsconfig.json', ['compilerOptions', 'strict'], false),
      updateJsonValue(options, '/angular.json', jsonPathOptimization, jsonValueOptimization),
      updateJsonArray(options, '/angular.json', jsonPathBudget, budgetValue, true,  findBudgetFn),
      updateJsonArray(options, '/angular.json', jsonPathAssetsBuild, assetsValues[0]),
      updateJsonArray(options, '/angular.json', jsonPathAssetsTest, assetsValues[0]),
      updateJsonArray(options, '/angular.json', jsonPathAssetsBuild, assetsValues[1]),
      updateJsonArray(options, '/angular.json', jsonPathAssetsTest, assetsValues[1]),
      updateJsonArray(options, '/angular.json', jsonPathAssetsBuild, assetsValues[2]),
      updateJsonArray(options, '/angular.json', jsonPathAssetsTest, assetsValues[2]),
      updateJsonArray(options, '/angular.json', jsonPathAssetsBuild, assetsValues[3]),
      updateJsonArray(options, '/angular.json', jsonPathAssetsTest, assetsValues[3]),
      updateJsonArray(options, '/angular.json', jsonPathAssetsBuild, assetsValues[4]),
      updateJsonArray(options, '/angular.json', jsonPathAssetsTest, assetsValues[4]),
      updateJsonArray(options, '/angular.json', jsonPathAllowedCommonJS, 'hammerjs'),
      updateJsonArray(options, '/angular.json', jsonPathAllowedCommonJS, 'ng2-pdf-viewer'),
      updateJsonArray(options, '/angular.json', jsonPathAllowedCommonJS, 'pdfjs-dist'),
      finish(
          true,
        `Die LUX-Components ${updateMajorVersion} wurden erfolgreich eingerichtet.`,
        `${chalk.yellowBright('Fertig!')}`
      )
    ]);
  };
}

/**
 * Prüft ob die Versionen des Projekts mit den erforderlichen Versionen dieses Updates übereinstimmen.
 */
export function check(): Rule {
  return (tree: Tree, context: SchematicContext) => {
    return waitForTreeCallback(tree, () => {
      validateAngularVersion(tree, context, `^${+updateMajorVersion}.0.0`);
      validateNodeVersion(context, updateNodeMinVersion);

      return tree;
    });
  };
}

export function updatePackageJson(options: any): Rule {
  return chain([
    messageInfoRule(`package.json wird aktualisiert...`),
    (tree: Tree, context: SchematicContext) => {
      const filePath = `/package.json`;

      const newValuesArr = [
        {
          path: ['scripts', 'build-prod'],
          value: 'ng build --configuration production --localize && npm run move-de-files',
          message: `Skript "build-prod" hinzugefügt.`
        },
        {
          path: ['scripts', 'test-headless'],
          value: 'ng test --watch=false --browsers=ChromeHeadless --code-coverage=true',
          message: `Skript "test-headless" hinzugefügt.`
        },
        {
          path: ['scripts', 'smoketest'],
          value: 'npm run build-prod && npm run test-headless && npm run xi18n',
          message: `Skript "smoketest" hinzugefügt.`
        },
        {
          path: ['scripts', 'move-de-files'],
          value: 'node move-de-files.js',
          message: `Skript "move-de-files" hinzugefügt.`
        },
        {
          path: ['scripts', 'xi18n'],
          value: 'ng extract-i18n --output-path src/locale',
          message: `Skript "xi18n" hinzugefügt.`
        }
      ];

      newValuesArr.forEach((change) => {
        const tsConfigJson = readJsonAsString(tree, filePath);
        const edits: Edit[] = modify(tsConfigJson, change.path, change.value, {
          formattingOptions: jsonFormattingOptions
        });

        tree.overwrite(filePath, applyEdits(tsConfigJson, edits));

        logInfo(change.message);
      });

      return tree;
    },
    messageSuccessRule(`package.json wurde aktualisiert.`)
  ]);
}

export function updateIndexHtml(options: any): Rule {
  return chain([
    messageInfoRule(`index.html wird aktualisiert...`),
    (tree: Tree, context: SchematicContext) => {
      iterateFilesAndModifyContent(
        tree,
        options.path,
        (filePath: string, content: string) => {
          let modifiedContent = replaceAll(content, '<body>', '<body style="margin: 0">');

          if (content !== modifiedContent) {
            tree.overwrite(filePath, modifiedContent);
          }
        },
        'index.html'
      );
    },
    messageSuccessRule(`index.html wurde aktualisiert.`)
  ]);
}

export function copyAppFiles(options: any): Rule {
  return chain([
    messageInfoRule(`App-Dateien werden angelegt...`),
    moveFilesToDirectory(options, 'files/app', 'src/app'),
    moveFilesToDirectory(options, 'files/environments', 'src/environments'),
    moveFilesToDirectory(options, 'files/scripts', '/'),
    moveFilesToDirectory(options, 'files/src', '/src'),
    messageSuccessRule(`App-Dateien wurden angelegt.`)
  ]);
}

export function updateApp(options: any): Rule {
  return chain([
    messageInfoRule(`App-Dateien wird angepasst...`),
    (tree: Tree, context: SchematicContext) => {
      const filePath = `/package.json`;

      const newValuesArr = [
        {
          path: ['scripts', 'move-de-files'],
          value: 'node move-de-files.js',
          message: `Skript "move-de-files" hinzugefügt.`
        },
        {
          path: ['scripts', 'build'],
          value: 'ng build --aot --localize && npm run move-de-files',
          message: `Skript "build" angepasst.`
        },
        { path: ['scripts', 'build-aot'], value: undefined, message: `` },
        { path: ['scripts', 'buildzentral'], value: undefined, message: `` },
        { path: ['devDependencies', 'fs-extra'], value: '^10.0.0', message: `devDependencies "fs-extra" hinzugefügt.` },
        { path: ['devDependencies', 'del'], value: '^6.0.0', message: `devDependencies "del" hinzugefügt.` }
      ];

      newValuesArr.forEach((change) => {
        const tsConfigJson = readJsonAsString(tree, filePath);
        const edits: Edit[] = modify(tsConfigJson, change.path, change.value, {
          formattingOptions: jsonFormattingOptions
        });

        tree.overwrite(filePath, applyEdits(tsConfigJson, edits));

        logInfo(change.message);
      });

      readJson(tree, filePath);

      return tree;
    },
    (tree: Tree, context: SchematicContext) => {
      const filePath = `/angular.json`;

      const newValuesArr = [
        {
          path: ['projects', options.project, 'architect', 'build', 'options', 'outputPath'],
          value: 'dist',
          message: `Property "outputPath" auf "dist" gesetzt.`
        }
      ];

      newValuesArr.forEach((change) => {
        const tsConfigJson = readJsonAsString(tree, filePath);
        const edits: Edit[] = modify(tsConfigJson, change.path, change.value, {
          formattingOptions: jsonFormattingOptions
        });

        tree.overwrite(filePath, applyEdits(tsConfigJson, edits));

        logInfo(change.message);
      });

      readJson(tree, filePath);

      return tree;
    },
    messageSuccessRule(`App wurde angepasst.`)
  ]);
}
