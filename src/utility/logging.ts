import { SchematicsException } from '@angular-devkit/schematics';
import chalk from 'chalk';

export const TAB = '\t   ';

/**
 * Erzeugt eine Log-Ausgabe für den Start eines neuen Generators in hellem Weiß mit #-Symbolen auf der rechten und
 * linken Seite sowie einer Newline am Ende.
 * @param version
 */
export const logNewUpdate = (version: string) => {
    console.log(chalk.whiteBright(`###### Update auf LUX-Components v${version} ######\n`));
};

/**
 * Erzeugt eine Info-Log-Ausgabe in hellem Blau mit einem [INFO] an der linken Seite.
 * @param messages
 */
export const logInfoWithDescriptor = (...messages: string[]) => {
    let message = generateLogMessage(...messages);
    console.log(chalk.blueBright(`[INFO]${TAB}${message}`));
};

/**
 * Erzeugt eine Info-Log-Ausgabe in hellem Weiß ohne Icon.
 * @param messages
 */
export const logInfo = (...messages: string[]) => {
    let message = generateLogMessage(...messages);
    console.log(chalk.whiteBright(`${TAB}${message}`));
};

/**
 * Erzeugt eine Success-Log-Ausgabe in hellem Grün mit einem [SUCCESS] an der linken Seite.
 * @param messages
 */
export const logSuccess = (...messages: string[]) => {
    let message = generateLogMessage(...messages);
    console.log(chalk.greenBright(`[SUCCESS]  ${message}`));
};

/**
 * Erzeugt eine Success-Log-Ausgabe in hellem Gelb mit einem [WARN] an der linken Seite.
 * @param messages
 */
export const logWarn = (...messages: string[]) => {
    let message = generateLogMessage(...messages);
    console.log(chalk.yellowBright(`[WARN]     ${message}`));
};

/**
 * Erzeugt eine Error-Log-Ausgabe in hellem Grün mit einem [ERROR] an der linken Seite.
 * @param messages
 */
export const logError = (...messages: string[]) => {
    let message = generateLogMessage(...messages);
    // Für den Fall, dass ein weitergereichter Fehler hier ankommt [ERROR] preventiv entfernen
    message = message.replace('[ERROR]    ', '');
    console.log(chalk.redBright(`[ERROR]    ${message}`));
};

/**
 * Wrapper um SchematicsException, welcher im Prinzip nur eine formatierte Log-Ausgabe des Fehler erzeugt und diesen zurückgibt.
 * @constructor
 */
export const formattedSchematicsException: (...messages: string[]) => SchematicsException = (...messages: string[]) => {
    let message = generateLogMessage(...messages);
    // Die eigentliche Exception zum Aufrufer zurückgeben '
    return new SchematicsException(`[ERROR]    ${message}`);
};

/**
 * Erzeugt eine Log-Message aus einem Array von Nachrichten.
 * Die Log-Message ist eingerückt und jede Message ist in einer neuen Zeile.
 * @param messages
 */
function generateLogMessage(...messages: string[]): string {
    let fullMessage: string = '';
    for (let i = 0; i < messages.length; i++) {
        if (i !== 0) {
            fullMessage += TAB;
        }
        fullMessage += messages[i];
        if (i !== messages.length - 1) {
            fullMessage += '\r\n';
        }
    }
    return fullMessage;
}