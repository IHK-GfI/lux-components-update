import { chain, Rule, SchematicContext, Tree } from '@angular-devkit/schematics';
import * as chalk from 'chalk';
import { deleteDep, deleteDevDep, updateDep, updateDevDep } from '../../update-dependencies/index';
import { finish, messageInfoRule, messageSuccessRule, replaceAll } from '../../utility/util';
import { iterateFilesAndModifyContent } from '../../utility/files';
import { logInfo } from '../../utility/logging';

export function update160500(options: any, runNpmInstall = true): Rule {
  return (_tree: Tree, _context: SchematicContext) => {
    return chain([
      messageInfoRule(`Die LUX-Components werden auf die Version 16.5.0 aktualisiert...`),
      messageInfoRule(`Die Datei "package.json" wird angepasst...`),
      updateDep('@ihk-gfi/lux-components', '16.5.0', false),
      updateDep('@ihk-gfi/lux-components-theme', '16.3.0', false),
      updateDevDep('@angular-devkit/build-angular', '16.2.15', false),
      updateDevDep('@angular/cli', '16.2.15', false),
      updateDevDep('@compodoc/compodoc', '1.1.25', true),
      updateDep('ng2-pdf-viewer', '10.3.0', true),
      deleteDep('pdfjs-dist'),
      deleteDevDep('pdfjs-dist'),
      updateAngularJson(options),
      updateAppModuleTs(options),
      messageSuccessRule(`Die LUX-Components wurden auf die Version 16.5.0 aktualisiert.`),
      finish(
        runNpmInstall,
        ``,
        `${chalk.yellowBright('Wichtig für Apps, welche die LUX-File-Preview (PDF-Vorschau) einsetzen')}`,
        `${chalk.yellowBright('----------------------------------------------------------------------')}`,
        `${chalk.gray('Die Abhängigkeit "ng2-pdf-viewer" wurde aktualisiert.')}`,
        `${chalk.gray('Diese Library verwendet intern die Abhängigkeit "pdfjs-dist@4.6.82".')}`,
        `${chalk.gray('Sollte der PDF-Worker NICHT mit der App ausgeliefert werden')}`,
        `${chalk.gray('siehe https://github.com/IHK-GfI/lux-components/wiki/lux%E2%80%90file%E2%80%90preview-v16')}`,
        `${chalk.gray('müssen die CSP-Abschnitte in den Konfigurationsdateien (ui-service/src/main/resources/application*.yml) im UI-Service angepasst werden!')}`,
        ``,
        `${chalk.yellowBright('Bitte einmal den "node_modules"-Ordner und die "package-lock.json"-Datei löschen und noch einmal "npm install" ausführen')}`,
        ``,
        `${chalk.greenBright('Fertig!')}`
      )
    ]);
  };
}

export function updateAngularJson(options: any): Rule {
  return chain([
    messageInfoRule(`Die Datei angular.json wird verarbeitet...`),
    (tree: Tree, _context: SchematicContext) => {
      iterateFilesAndModifyContent(
        tree,
        options.path,
        (filePath: string, content: string) => {
          let result = content;
          result = replaceAll(result, 'pdf.worker.min.js', 'pdf.worker.min.mjs');
          result = replaceAll(result, 'node_modules/ng2-pdf-viewer/node_modules/pdfjs-dist/build', 'node_modules/pdfjs-dist/build');

          if (content !== result) {
            logInfo(filePath + ' wurde angepasst.');
            tree.overwrite(filePath, result);
          }
        },
        'angular.json'
      );
    },
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
          result = replaceAll(result, 'pdf.worker.min.js', 'pdf.worker.min.mjs');

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
