import { chain, Rule, SchematicContext, Tree } from '@angular-devkit/schematics';
import * as chalk from 'chalk';
import { applyEdits, findNodeAtLocation, modify } from 'jsonc-parser';
import { updateDependencies } from '../update-dependencies/index';
import { iterateFilesAndModifyContent, moveFilesToDirectory } from '../utility/files';
import { removeAttribute } from '../utility/html';
import {
  findObjectIndexInArray,
  jsonFormattingOptions,
  readJson,
  readJsonAsString,
  removeJsonNode
} from '../utility/json';
import { logInfo, logInfoWithDescriptor, logSuccess } from '../utility/logging';
import { applyRuleIf, finish, messageInfoRule, messageSuccessRule } from '../utility/util';
import { validateLuxComponentsVersion, validateNodeVersion } from '../utility/validation';

export const updateMajorVersion = '12';
export const updateMinVersion = '11.7.0';
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
      updateAngularJson(options),
      updatePackageJson(options),
      copyFiles(options),
      removeLuxSelectedFilesAlwaysUseArray(options),
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

export function copyFiles(options: any): Rule {
  return chain([
    messageInfoRule(`Dateien werden kopiert...`),
    moveFilesToDirectory(options, 'files/locale', 'src/locale'),
    moveFilesToDirectory(options, 'files/root', '/'),
    messageSuccessRule(`Dateien wurden kopiert.`)
  ]);
}

export function updateAngularJson(options: any): Rule {
  return (tree: Tree, _context: SchematicContext) => {
    return chain([
      messageInfoRule(`Datei "angular.json" wird aktualisiert...`),
      updateBuildThemeAssets(options),
      updateTestThemeAssets(options),
      removeThemeAssets(options),
      addNg2PdfViewer(options),
      messageSuccessRule(`Datei "angular.json" wurde aktualisiert.`)
    ]);
  };
}

export function updatePackageJson(options: any): Rule {
  return (tree: Tree, _context: SchematicContext) => {
    return chain([
      messageInfoRule(`Datei "package.json" wird aktualisiert...`),
      (tree: Tree, _context: SchematicContext) => {
        const filePath = '/package.json';
        const content = readJsonAsString(tree, filePath);

        let modifiedContent = content;
        modifiedContent = modifiedContent.replace(' --ivy', '');

        if (content !== modifiedContent) {
          logInfo(`Das Flag "--ivy" wurde aus dem Script "xi18n" entfernt.`);
          tree.overwrite(filePath, modifiedContent);
        }
      },
      messageSuccessRule(`Datei "package.json" wurde aktualisiert.`)
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

export function updateBuildThemeAssets(options: any): Rule {
  return (tree: Tree, context: SchematicContext) => {
    updateThemeAssetsIntern(tree, ['projects', options.project, 'architect', 'build', 'options', 'assets'], 'build');
  };
}

export function updateTestThemeAssets(options: any): Rule {
  return (tree: Tree, context: SchematicContext) => {
    updateThemeAssetsIntern(tree, ['projects', options.project, 'architect', 'test', 'options', 'assets'], 'test');
  };
}

function updateThemeAssetsIntern(tree: Tree, jsonPath: string[], label: string) {
  const filePath = '/angular.json';
  const contentAsNode = readJson(tree, filePath);
  const buildAssetsNode = findNodeAtLocation(contentAsNode, jsonPath);
  if (buildAssetsNode) {
    const arrayIndex = findObjectIndexInArray(buildAssetsNode, 'glob', '*.css');
    if (arrayIndex >= 0) {
      const angularJson = readJsonAsString(tree, filePath);
      const edits = modify(
        angularJson,
        [...jsonPath, arrayIndex],
        {
          glob: '*(*min.css|*min.css.map)',
          input: './node_modules/@ihk-gfi/lux-components-theme/prebuilt-themes',
          output: './assets/themes'
        },
        { formattingOptions: jsonFormattingOptions, isArrayInsertion: false }
      );
      if (edits) {
        tree.overwrite(filePath, applyEdits(angularJson, edits));
        logInfo(`Den Abschnitt "${JSON.stringify(jsonPath)}" aktualisiert.`);
      }
    }
  }
}

export function removeThemeAssets(options: any): Rule {
  return (tree: Tree, context: SchematicContext) => {
    const filePath = '/angular.json';
    const jsonPath = ['projects', options.project, 'architect', 'build', 'configurations', 'es5'];

    removeJsonNode(tree, filePath, jsonPath);
  };
}

export function removeLuxSelectedFilesAlwaysUseArray(options: any): Rule {
  return chain([
    messageInfoRule(`Das Attribut "luxSelectedFilesAlwaysUseArray" wird entfernt...`),
    (tree: Tree, context: SchematicContext) => {
      iterateFilesAndModifyContent(
          tree,
          options.path,
          (filePath: string, content: string) => {
            let result = removeAttribute(content, 'lux-file-list', "luxSelectedFilesAlwaysUseArray");;

            if (content !== result.content) {
              logInfo(filePath + ' wurde angepasst.')
              tree.overwrite(filePath, result.content);
            }
          },
          '.component.html'
      );
    },
    messageSuccessRule(`Das Attribut "luxSelectedFilesAlwaysUseArray" wird entfernt.`)
  ]);
}
