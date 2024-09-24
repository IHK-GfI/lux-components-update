import { chain, Rule, SchematicContext, Tree } from '@angular-devkit/schematics';
import * as chalk from 'chalk';
import { updateDep, updateDevDep } from '../../update-dependencies/index';
import { applyRuleIfFileExists, finish, messageInfoRule, messageSuccessRule, replaceAll } from '../../utility/util';
import { iterateFilesAndModifyContent } from '../../utility/files';
import { logInfo } from '../../utility/logging';
import { deleteJsonArray, findObjectPropertyInArray } from '../../utility/json';

export function update160600(options: any, runNpmInstall = true): Rule {
  return (_tree: Tree, _context: SchematicContext) => {
    return chain([
      messageInfoRule(`Die LUX-Components werden auf die Version 16.6.0 aktualisiert...`),
      messageInfoRule(`Die Datei "package.json" wird angepasst...`),
      updateDep('@ihk-gfi/lux-components', '16.6.0', false),
      updateDep('dompurify', '~3.1.6', true),
      updateDevDep('@angular-devkit/build-angular', '16.2.16', false),
      updateDevDep('@angular/cli', '16.2.16', false),
      updateAngularJson(options),
      updateAppModuleTs(options),
      messageSuccessRule(`Die LUX-Components wurden auf die Version 16.6.0 aktualisiert.`),
      finish(
        runNpmInstall,
        ``,
        `${chalk.yellowBright('Die folgenden manuellen Schritte müssen nur ausgeführt werden,')}`,
        `${chalk.yellowBright('wenn die App die LUX-File-Preview (PDF-Vorschau) einsetzt')}`,
        `${chalk.yellowBright('----------------------------------------------------------------------')}`,
        `${chalk.yellowBright('1. Bitte einmal den "node_modules"-Ordner und die "package-lock.json"-Datei löschen und noch einmal "npm install" ausführen.')}`,
        `${chalk.yellowBright('2. Die Datei "./node_modules/pdfjs-dist/build/pdf.worker.min.mjs" in den Ordner "src/assets/pdf" kopieren.')}`,
        `${chalk.yellowBright('3. Die Datei "pdf.worker.min.mjs" in "pdf.worker.min.js" umbenennen.')}`,
        `${chalk.yellowBright('4. Prüfen, ob in der "app.module.ts" die folgende Zeile "(window as any).pdfWorkerSrc = "/assets/pdf/pdf.worker.min.js"; enthalten ist.')}`,
        `${chalk.gray('Die Abhängigkeit "ng2-pdf-viewer" wurde aktualisiert.')}`,
        `${chalk.gray('Diese Library verwendet intern die Abhängigkeit "pdfjs-dist@4.6.82".')}`,
        ``,
        `${chalk.greenBright('Fertig!')}`
      )
    ]);
  };
}

export function updateAngularJson(options: any): Rule {
  return chain([
    messageInfoRule(`Die Datei angular.json wird verarbeitet...`),
    applyRuleIfFileExists(
      deleteJsonArray(
        (options.path ?? '.') + '/angular.json',
        ['projects', options.project, 'architect', 'build', 'options', 'assets'],
        (node) => findObjectPropertyInArray(node, 'glob', 'pdf.worker.min.js')
      ),
      (options.path ?? '.') + '/angular.json'
    ),
    applyRuleIfFileExists(
      deleteJsonArray(
        (options.path ?? '.') + '/angular.json',
        ['projects', options.project, 'architect', 'test', 'options', 'assets'],
        (node) => findObjectPropertyInArray(node, 'glob', 'pdf.worker.min.js')
      ),
      (options.path ?? '.') + '/angular.json'
    ),
    applyRuleIfFileExists(
      deleteJsonArray(
        (options.path ?? '.') + '/angular.json',
        ['projects', options.project, 'architect', 'build', 'options', 'assets'],
        (node) => findObjectPropertyInArray(node, 'glob', 'pdf.worker.min.mjs')
      ),
      (options.path ?? '.') + '/angular.json'
    ),
    applyRuleIfFileExists(
      deleteJsonArray(
        (options.path ?? '.') + '/angular.json',
        ['projects', options.project, 'architect', 'test', 'options', 'assets'],
        (node) => findObjectPropertyInArray(node, 'glob', 'pdf.worker.min.mjs')
      ),
      (options.path ?? '.') + '/angular.json'
    ),
    messageSuccessRule(`Die Datei angular.json wurde verarbeitet.`)
  ]);
}

export function updateAppModuleTs(options: any): Rule {
  return chain([
    messageInfoRule(`Die Datei app.module.ts wird verarbeitet...`),
    (tree: Tree, _context: SchematicContext) => {
      iterateFilesAndModifyContent(
        tree,
        options.path,
        (filePath: string, content: string) => {
          let result = content;
          result = replaceAll(result, 'pdf.worker.min.mjs', 'pdf.worker.min.js');

          if (content !== result) {
            logInfo(filePath + ' wurde angepasst.');
            tree.overwrite(filePath, result);
          }
        },
        'app.module.ts'
      );
    },
    messageSuccessRule(`Die Datei app.module.ts wurde verarbeitet.`)
  ]);
}
