import { chain, Rule, SchematicContext, Tree } from '@angular-devkit/schematics';
import * as chalk from 'chalk';
import { applyEdits, Edit, modify } from 'jsonc-parser';
import { updateDependencies } from '../update-dependencies/index';
import {
  addThemeAssets,
  i18nCopyMessages,
  i18nUpdateAngularJson,
  i18nUpdatePackageJson,
  updateAppComponent,
  updateMajorVersion,
  updateNodeMinVersion
} from '../update/index';
import { update110001 } from '../update110001/index';
import { update110100 } from '../update110100/index';
import { update110101 } from '../update110101/index';
import { update110200 } from '../update110200/index';
import { update110300 } from '../update110300/index';
import { update110400 } from '../update110400/index';
import { update110500 } from '../update110500';
import { iterateFilesAndModifyContent, moveFilesToDirectory } from '../utility/files';
import { jsonFormattingOptions, readJson, readJsonAsString } from '../utility/json';
import { logInfo } from '../utility/logging';
import { finish, messageInfoRule, messageSuccessRule, replaceAll, waitForTreeCallback } from '../utility/util';
import { validateAngularVersion, validateNodeVersion } from '../utility/validation';

export function addLuxComponents(options: any): Rule {
  return (tree: Tree, _context: SchematicContext) => {
    return chain([
      check(),
      copyAppFiles(options),
      updatePackageJson(options),
      updateDependencies(),
      addThemeAssets(options),
      updateAppComponent(options),
      updateIndexHtml(options),
      i18nUpdatePackageJson(options),
      i18nUpdateAngularJson(options),
      i18nCopyMessages(options),
      updateApp(options),
      update110001(options),
      update110100(options),
      update110101(options),
      update110200(options),
      update110300(options),
      update110400(options),
      update110500(options),
      finish(
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
        { path: ['scripts', 'test_single_run'], value: 'ng test --watch=false --browsers=ChromeHeadless', message: `Skript "test_single_run" hinzugefügt.`},
        { path: ['scripts', 'smoketest'], value: 'npm run test_single_run && npm run build && npm run lint --bailOnLintError true', message: `Skript "smoketest" hinzugefügt.`}
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
        { path: ['scripts', 'move-de-files'], value: 'node move-de-files.js', message: `Skript "move-de-files" hinzugefügt.`},
        { path: ['scripts', 'build'], value: 'ng build --aot --localize && npm run move-de-files', message: `Skript "build" angepasst.`},
        { path: ['scripts', 'build-aot'], value: undefined, message: ``},
        { path: ['scripts', 'buildzentral'], value: undefined, message: ``},
        { path: ['devDependencies', 'fs-extra'], value: '^10.0.0', message: `devDependencies "fs-extra" hinzugefügt.`},
        { path: ['devDependencies', 'del'], value: '^6.0.0', message: `devDependencies "del" hinzugefügt.`}
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

      readJson(tree, filePath);

      return tree;
    },
    (tree: Tree, context: SchematicContext) => {
      const filePath = `/angular.json`;

      const newValuesArr = [
        { path: ['projects', options.project, 'architect', 'build', 'options', 'outputPath'], value: 'dist', message: `Property "outputPath" auf "dist" gesetzt.`},
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

      readJson(tree, filePath);

      return tree;
    },
    messageSuccessRule(`App wurde angepasst.`)
  ]);
}
