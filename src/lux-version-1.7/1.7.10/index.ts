import { chain, Rule, SchematicContext, Tree } from '@angular-devkit/schematics';
import { getProject } from '@schematics/angular/utility/project';
import { validateLuxComponentsVersion, validateNodeVersion } from '../../utility/validation';
import { NodeDependency, NodeDependencyType, updatePackageJsonDependency } from '../../utility/dependencies';
import {
  formattedSchematicsException,
  logInfo,
  logInfoWithDescriptor,
  logNewUpdate,
  logSuccess,
  TAB
} from '../../utility/logging';
import { iterateFilesAndModifyContent, moveFilesToDirectory } from '../../utility/files';
import * as chalk from 'chalk';
import { checkSmoketestScriptExists, replaceAll, runInstallAndLogToDos, waitForTreeCallback } from '../../utility/util';

/**
 * Haupt-Rule für diesen Schematic-Generator.
 * @param options
 */
export const luxVersion: (options: any) => Rule = (options: any) => {
  return chain([
    setupProject(options),
    checkVersions(),
    updatePackageJson(),
    updateLuxStylesScss(options),
    updateLuxAppFooterButtonInfoConstructorParams(options),
    todosForUser()
  ]);
};

/**
 * Prüft, ob die Property "project" gesetzt ist und
 * erstellt wenn nötig einen Standard-Pfad zum Projekt, wenn keiner bekannt ist.
 * @param options
 */
export function setupProject(options: any): Rule {
  return (tree: Tree, context: SchematicContext) => {
    logNewUpdate('1.7.10');
    logInfoWithDescriptor('Starte Konfiguration der Schematic.');
    return waitForTreeCallback(tree, () => {
      if (!options.project) {
        throw formattedSchematicsException('Option "project" wird benötigt.');
      }
      const project = getProject(tree, options.project);

      if (options.path === undefined) {
        options.path = project.root;
      }

      checkSmoketestScriptExists(tree, context);

      logSuccess(`Schematic-Konfiguration für Projekt "${options.project}" erfolgreich.`);
      return tree;
    });
  };
}

/**
 * Prüft ob die Versionen des Projekts mit den erforderlichen Versionen dieses Updates übereinstimmen.
 */
export function checkVersions(): Rule {
  return (tree: Tree, context: SchematicContext) => {
    logInfoWithDescriptor('Starte die Versionsprüfung.');
    return waitForTreeCallback(tree, () => {
      const minimumLuxComponentsVersion = '1.7.9';
      validateLuxComponentsVersion(tree, context, minimumLuxComponentsVersion);

      const minimumNodeVersion = '8.0.0';
      validateNodeVersion(context, minimumNodeVersion);

      logSuccess(`Versionen erfolgreich geprüft.`);
      return tree;
    });
  };
}

/**
 * Aktualisiert die package.json des Projekts.
 */
export function updatePackageJson(): Rule {
  return (tree: Tree, context: SchematicContext) => {
    logInfoWithDescriptor('Aktualisiere LUX-Components Version auf 1.7.10');
    return waitForTreeCallback(tree, () => {
      const newDependency: NodeDependency = {
        type: NodeDependencyType.Default,
        version: '1.7.10',
        name: 'lux-components'
      };
      updatePackageJsonDependency(tree, context, newDependency);
      logSuccess(`package.json erfolgreich aktualisiert.`);
      return tree;
    });
  };
}

export function updateLuxStylesScss(options: any): Rule {
  return moveFilesToDirectory(options, 'files/theming', 'src/theming');
}

/**
 * Aktualisiert die Property "luxMargins" zu "luxMargin" in dem Projekt.
 */
export function updateLuxAppFooterButtonInfoConstructorParams(options: any): Rule {
  return (tree: Tree, context: SchematicContext) => {
    logInfoWithDescriptor(`Passe die Konstruktor-Aufrufe für LuxAppFooterButtonInfo's an.`);
    return waitForTreeCallback(tree, () => {
      const fullRegExp = /new LuxAppFooterButtonInfo\(((.|\n)*?)\)(;|,|(\r\n|\r|\n|\s))/gm;
      let fileCount: number = 0;
      iterateFilesAndModifyContent(
        tree,
        options.path + '/src/app',
        (filePath: string, content: string) => {
          let modifiedContent = content;

          // Zeilenumbrüche aus den LuxAppFooterButtonInfo entfernen
          let matchesWithLineBreaks = modifiedContent.match(fullRegExp);
          if (matchesWithLineBreaks) {
            matchesWithLineBreaks.forEach((buttonInfo: string) => {
              // Nur durchführen, wenn das Label keine runde Klammer ")" enthält.
              if (buttonInfo.split(',').length > 1) {
                let newTest = buttonInfo.replace(/(\n| )/g, '');
                newTest = newTest.replace('newLuxAppFooterButtonInfo', 'new LuxAppFooterButtonInfo');
                newTest = newTest.replace(/,/g, ', ');
                modifiedContent = modifiedContent.replace(buttonInfo, newTest);
              }
            });
          }

          // Alle Vorkommnisse des Konstruktor-Aufrufs finden
          let matches = modifiedContent.match(fullRegExp);
          if (matches) {
            matches.forEach((oldConstructorCall: string) => {
              let parametersString: string = (<any>(
                oldConstructorCall.match(new RegExp(/\(((.|\n)*?)\)(;|,|(\r\n|\r|\n|\s))/, 'gm'))
              ))[0];
              parametersString = parametersString.replace('(', '').replace(/\)(;|,|(\r\n|\r|\n|\s))/gm, '');
              // Die einzelnen Parameter aus dem Konstruktor erhalten
              const parameters = parametersString.split(',');
              // Nur wenn überhaupt Parameter gesetzt sind und wenn sie noch nicht geändert wurden.
              // Das stellen wir darüber fest, das der zweite Parameter früher für disabled (boolean) stand und
              // ein Pflichtfeld war. Es muss also vor der Umwandlung an der 3ten Stelle im Array stehen.
              if (parameters.length > 3 && (parameters[2].trim() === 'false' || parameters[2].trim() === 'true')) {
                //let newConstructorCall: string = 'new LuxAppFooterButtonInfo(';
                let newConstructorCall: string = 'new LuxAppFooterButtonInfo(';

                // cmd-Parameter an 2te Stelle verschieben ([label, cmd, color, disabled])
                newConstructorCall += `${parameters[0]}, ${parameters[3]}, ${parameters[1]}, ${parameters[2]}, `;
                // Die übrigen Parameter anhängen
                parameters.forEach((parameter: string, index: number) => {
                  if (index > 3) {
                    newConstructorCall += parameter.trim() + ', ';
                  }
                });
                newConstructorCall += ')';
                // Mehrere spaces hintereinander entfernen
                newConstructorCall = newConstructorCall.replace(', )', ')').replace(/  +/g, ' ');

                if (oldConstructorCall.endsWith(',')) {
                  newConstructorCall += ',';
                } else if (oldConstructorCall.endsWith(';')) {
                  newConstructorCall += ';';
                }
                console.log(newConstructorCall, oldConstructorCall);
                modifiedContent = replaceAll(modifiedContent, oldConstructorCall, newConstructorCall);
              }
            });
            // Den angepassten Content einsetzen
            if (modifiedContent !== content) {
              tree.overwrite(filePath, modifiedContent);
              fileCount++;
            }
          }
        },
        '.ts'
      );
      logInfo(`${fileCount} Typescript-Dateien angepasst.`);
      logSuccess(`Konstruktoraufrufe erfolgreich angepasst.`);
      return tree;
    });
  };
}

/**
 * Gibt die offen stehenden ToDos (Aufgaben, die der Generator nicht übernehmen konnte) für den User aus.
 */
export function todosForUser(): Rule {
  return (tree: Tree, context: SchematicContext) => {
    runInstallAndLogToDos(
      context,
      `Die ${chalk.blueBright(
        'LuxSliderComponent'
      )} zeigt jetzt standardmäßig immer das ThumbLabel an.\r\n${TAB}Dies ist bei Bedarf über die Property ${chalk.redBright(
        'luxThumbLabelAlways'
      )} abschaltbar.`,
      `Die Funktionen ${chalk.redBright('sendButtonCommand')} und ${chalk.redBright(
        'getButtonObservable'
      )} vom ${chalk.blueBright('LuxAppFooterButtonService')} sind nun @deprecated.\r\n` +
        `${TAB}Stattdessen bitte die neuen ${chalk.redBright(
          'onClick'
        )}-Callbackfunktionen bei Erstellung von ${chalk.blueBright('LuxAppFooterButtonInfo')}-Objekten nutzen.`,
      `Die ${chalk.blueBright(
        'LuxStepperComponent'
      )} wurde intern überarbeitet, bitte prüfen ob alles noch wie gewünscht funktioniert.`,
      `Bitte starten Sie ${chalk.redBright('npm run smoketest')} um möglichen Fehlern vorzugreifen.`,
      `Weitere Informationen: https://confluence.gfi.ihk.de/display/EVA/Update+Guide#UpdateGuide-UmstellungaufVersion1.7.10`
    );
    return tree;
  };
}
