import { Observable, of } from 'rxjs';
import { delay } from 'rxjs/operators';
import { SchematicContext, Tree } from '@angular-devkit/schematics';
import { controlPackageJsonScript, NodeScript } from './scripts';
import { logInfo, logSuccess, logWarn } from './logging';
import * as chalk from 'chalk';
import { NodePackageInstallTask } from '@angular-devkit/schematics/tasks';

/**
 * Konfig-Objekt für einige Util-Methoden.
 * Ermöglicht z.B. die Standard-Dauer des waitForTreeCallback-Aufrufs zu ändern
 */
export const UtilConfig = {
  defaultWaitMS: 4000
};

export function escapeRegExp(str) {
  return str.replace(/([.*+?^=!:${}()|\[\]\/\\])/g, '\\$1');
}

export function replaceAll(str, find, replace) {
  return str.replace(new RegExp(escapeRegExp(find), 'g'), replace);
}

/**
 * Wartet die übergebene Zeitspanne und ruft dann den Callback auf.
 * Gibt anschließend den Tree über ein Observable zurück.
 * @param tree
 * @param callback
 * @param waitMS
 */
export const waitForTreeCallback = (tree, callback, waitMS: number = UtilConfig.defaultWaitMS) => {
  return new Observable<Tree>((subscriber) => {
    of(callback())
      .pipe(delay(waitMS))
      .subscribe(
        (callbackResult) => {
          if (callbackResult instanceof Observable) {
            callbackResult.subscribe((result: Tree) => {
              subscriber.next(result);
              subscriber.complete();
            });
          } else {
            subscriber.next(<Tree>callbackResult);
            subscriber.complete();
          }
        },
        (error) => {
          subscriber.error(error.message);
        }
      );
  });
};

/**
 * Prüft, ob das smoketest-Skript in der package.json enthalten ist.
 * Wenn nicht, wird dieses hinzugefügt.
 */
export const checkSmoketestScriptExists = (tree: Tree, context: SchematicContext) => {
  logInfo(`Prüfe, ob das ${chalk.redBright('smoketest')}-Skript bereits existiert.`);
  const script: NodeScript = {
    name: 'smoketest',
    command: 'npm run test_single_run && npm run build-aot && npm run lint --bailOnLintError true',
    overwrite: true
  };
  controlPackageJsonScript(tree, context, script);
  logSuccess('Prüfung abgeschlossen.');
};

/**
 * Führt npm install aus und wartet auf den Abschluss des Prozess für diese Schematic.
 * Wenn dieses eintritt, werden die Hinweise und ToDos ausgegeben.
 * @param context
 * @param toDoMessages
 */
export const runInstallAndLogToDos: (context, ...toDoMessages) => void = (
  context: SchematicContext,
  ...toDoMessages
) => {
  // diese log-Ausgaben werden erst ganz zum Schluss ausgeführt (nach Update und npm-install logs)
  process.addListener('exit', () => {
    logInfo('\r\n');
    logWarn('WICHTIGE HINWEISE ZUM UPDATE: \r\n');

    toDoMessages.forEach((message: string) => {
      logInfo(message + '\r\n');
    });
  });

  // npm install starten
  context.addTask(new NodePackageInstallTask());
};
