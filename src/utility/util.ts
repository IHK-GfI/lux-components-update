import { Observable, of } from 'rxjs';
import { delay } from 'rxjs/operators';
import { Rule, SchematicContext, Tree } from '@angular-devkit/schematics';
import { logError, logInfo, logInfoWithDescriptor, logSuccess } from './logging';
import { NodePackageInstallTask } from '@angular-devkit/schematics/tasks';
import { getPackageJsonDependency } from './dependencies';
import * as semver from 'semver';

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
 * Führt npm install aus und wartet auf den Abschluss des Prozess für diese Schematic.
 * Wenn dieses eintritt, werden die Hinweise und ToDos ausgegeben.
 * @param context
 * @param messages
 */
export const runInstallAndLogToDos: (context, messages) => void = (context: SchematicContext, messages) => {
  // diese log-Ausgaben werden erst ganz zum Schluss ausgeführt (nach Update und npm-install logs)
  process.addListener('exit', () => {
    if (messages) {
      messages.forEach((message: string) => {
        logInfo(message);
      });
    }
  });

  // npm install starten
  context.addTask(new NodePackageInstallTask());
};

export function applyRuleIf(minVersion: string, rule: Rule): Rule {
  return (tree: Tree, _context: SchematicContext) => {
    let version = getPackageJsonDependency(tree, '@ihk-gfi/lux-components').version;

    if (semver.satisfies(minVersion, version)) {
      return rule;
    } else {
      return tree;
    }
  };
}

export function messageDebugRule(message: any, options: any): Rule {
  return (tree: Tree, _context: SchematicContext) => {
    if (options && options.verbose) {
      logInfo(message);
    }
  };
}

export function messageInfoRule(message: any): Rule {
  return (tree: Tree, _context: SchematicContext) => {
    logInfoWithDescriptor(message);
  };
}

export function messageInfoInternRule(message: any): Rule {
  return (tree: Tree, _context: SchematicContext) => {
    logInfo(message);
  };
}

export function messageSuccessRule(message: any): Rule {
  return (tree: Tree, _context: SchematicContext) => {
    logSuccess(message);
  };
}

export function finish(...messages: string[]): Rule {
  return (tree: Tree, context: SchematicContext) => {
    runInstallAndLogToDos(context, messages);
    return tree;
  };
}
