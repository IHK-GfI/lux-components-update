import { chain, Rule, SchematicContext, Tree } from '@angular-devkit/schematics';
import * as chalk from 'chalk';
import { applyEdits, findNodeAtLocation, modify } from 'jsonc-parser';
import { updateDependency } from '../utility/dependencies';
import { jsonFormattingOptions, readJson, readJsonAsString } from '../utility/json';
import { logError, logInfo, logWarn } from '../utility/logging';
import { finish, messageInfoRule, messageSuccessRule } from '../utility/util';

export function update110900(options: any): Rule {
  return (tree: Tree, context: SchematicContext) => {
    const fontawesomeCss = {
      glob: 'all.css',
      input: './node_modules/@fortawesome/fontawesome-free/css',
      output: './assets/icons/fontawesome/css'
    };
    const fontawesomeIcons = {
      glob: '*(*.eot|*.ttf|*.woff|*.woff2)',
      input: './node_modules/@fortawesome/fontawesome-free/webfonts',
      output: './assets/icons/fontawesome/webfonts'
    };
    const materialCss = {
      glob: 'material-design-icons.css',
      input: './node_modules/material-design-icons-iconfont/dist',
      output: './assets/icons/material-icons'
    };
    const materialIcons = {
      glob: '*(*.eot|*.ttf|*.woff|*.woff2)',
      input: './node_modules/material-design-icons-iconfont/dist/fonts',
      output: './assets/icons/material-icons/fonts'
    };

    return chain([
      messageInfoRule(`Die LUX-Components werden auf die Version 11.9.0 aktualisiert...`),

      messageInfoRule(`Die Datei "package.json" wird angepasst...`),
      updateDependencies(),
      messageSuccessRule(`Die Datei "package.json" wurde angepasst.`),

      messageInfoRule(`Die Datei "angular.json" wird angepasst...`),
      addIconAssets(options, materialIcons),
      addIconAssets(options, materialCss),
      addIconAssets(options, fontawesomeIcons),
      addIconAssets(options, fontawesomeCss),
      messageSuccessRule(`Die Datei "angular.json" wurde angepasst.`),

      messageInfoRule(`Die Datei "index.html" wird angepasst...`),
      addIconsToIndexHtml(options),
      messageSuccessRule(`Die Datei "index.html" wurde angepasst.`),

      messageSuccessRule(`Die LUX-Components wurden auf die Version 11.9.0 aktualisiert.`),
      finish(`${chalk.yellowBright('Fertig!')}`)
    ]);
  };

  function updateDependencies() {
    return (tree: Tree, _context: SchematicContext) => {
      updateDependency(tree, '@ihk-gfi/lux-components', '11.9.0');
      updateDependency(tree, '@ihk-gfi/lux-components-theme', '11.11.0');

      return tree;
    };
  }
}

export function addIconsToIndexHtml(options: any): Rule {
  return chain([
    (tree: Tree, context: SchematicContext) => {
      const newValue =
        '<link rel="stylesheet" href="assets/icons/fontawesome/css/all.css">\n' +
        '<link rel="stylesheet" href="assets/icons/material-icons/material-design-icons.css">\n' +
        '<link rel="icon"';

      const errorMessage =
        'Die folgenden Einträge konnten NICHT automatisiert eingetragen werden. Diese müssen jetzt manuell im <head>-Tag nachgetragen werden: ' +
        '\n' +
        newValue.replace('<link rel="icon"', '');

      const filePath = 'src/index.html';
      if (tree.read(filePath)) {
        const content = (tree.read(filePath) as Buffer).toString();
        const modifiedContent = content.replace('<link rel="icon"', newValue);

        if (modifiedContent !== content) {
          logInfo('Folgender Einträge wurden ergänzt: ' + newValue);
          tree.overwrite(filePath, modifiedContent);
        } else {
          logError(errorMessage);
        }
      } else {
        logError(errorMessage);
      }
    }
  ]);
}

export function addIconAssets(options: any, value: any): Rule {
  return (tree: Tree, context: SchematicContext) => {
    const filePath = '/angular.json';

    let contentAsNode = readJson(tree, filePath);
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
        logInfo('Folgender Eintrag wurden ergänzt: ' + JSON.stringify(value));
      }
    }
  };
}
