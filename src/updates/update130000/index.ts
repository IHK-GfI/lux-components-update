import { chain, Rule, SchematicContext, Tree } from '@angular-devkit/schematics';
import * as chalk from 'chalk';
import { applyEdits, findNodeAtLocation, modify } from 'jsonc-parser';
import { updateDependencies } from '../../update-dependencies/index';
import { deleteFile, iterateFilesAndModifyContent, moveFilesToDirectory } from '../../utility/files';
import { removeAttribute } from '../../utility/html';
import {
    findObjectIndexInArray,
    jsonFormattingOptions,
    readJson,
    readJsonAsString,
    removeJsonNode,
    updateJsonArray,
    updateJsonValue
} from '../../utility/json';
import { logInfo, logInfoWithDescriptor, logSuccess } from '../../utility/logging';
import { applyRuleIf, finish, messageInfoRule, messageSuccessRule } from '../../utility/util';
import { validateLuxComponentsVersion, validateNodeVersion } from '../../utility/validation';

export const updateMajorVersion   = '13';
export const updateMinVersion     = '11.13.0';
export const updateNodeMinVersion = '16.0.0';

export function update(options: any): Rule {
    return (tree: Tree, _context: SchematicContext) => {
        return chain([
            check(options),
            applyRuleIf(updateMinVersion, updateProject(options)),
            finish(
                `${ chalk.yellowBright(
                    'Wichtig!!!'
                ) } Hinweise im Update Guide beachten -> https://github.com/IHK-GfI/lux-components/wiki/update-guide-${ updateMajorVersion }`
            )
        ]);
    };
}

export function updateProject(options: any): Rule {
    return (tree: Tree, _context: SchematicContext) => {
        return chain([
            messageInfoRule(`LUX-Components ${ updateMajorVersion } werden aktualisiert...`),
            updateAngularJson(options),
            updatePackageJson(options),
            removeLuxSelectedFilesAlwaysUseArray(options),
            fixEmptyStyles(options),
            removeDatepickerDefaultLocale(options),
            copyFiles(options),
            fixKarmaConf(options),
            deleteWebpackConfig(options),
            updateDependencies(),
            messageSuccessRule(`LUX-Components ${ updateMajorVersion } wurden aktualisiert.`)
        ]);
    };
}

export function check(options: any): Rule {
    return (tree: Tree, _context: SchematicContext) => {
        logInfoWithDescriptor(`Vorbedingungen werden geprüft...`);

        validateNodeVersion(_context, updateNodeMinVersion);
        validateLuxComponentsVersion(tree, `${ updateMinVersion } || ^${ updateMajorVersion }.0.0`);

        logSuccess(`Vorbedingungen wurden geprüft.`);

        return tree;
    };
}

export function deleteWebpackConfig(options: any): Rule {
    return chain([
        messageInfoRule(`Datei 'webpack.config.js' wird gelöscht...`),
        deleteFile(options, '/webpack.config.js'),
        messageSuccessRule(`Datei 'webpack.config.js' wurde gelöscht.`),
        messageInfoRule(`Verweis auf die 'webpack.config.js' wird aus der Datei 'angular.json' gelöscht...`),
        (tree: Tree, _context: SchematicContext) => {
            removeJsonNode(tree, '/angular.json', ['projects', options.project, 'architect', 'build', 'options', 'extraWebpackConfig']);
        },
        messageSuccessRule(`Verweis auf die 'webpack.config.js' wurde aus der Datei 'angular.json' gelöscht.`),
    ]);
}

export function copyFiles(options: any): Rule {
    return chain([
        messageInfoRule(`Dateien werden kopiert...`),
        moveFilesToDirectory(options, 'files/root', '/'),
        messageSuccessRule(`Dateien wurden kopiert.`)
    ]);
}

export function updateAngularJson(options: any): Rule {
    return (tree: Tree, _context: SchematicContext) => {
        const jsonPathAllowedCommonJS = ['projects', options.project, 'architect', 'build', 'options', 'allowedCommonJsDependencies'];
        const jsonPathOptimization    = ['projects', options.project, 'architect', 'build', 'configurations', 'production', 'optimization'];
        const jsonValueOptimization   = {
            'scripts': true,
            'styles' : {
                'minify'        : true,
                'inlineCritical': false
            },
            'fonts'  : true
        };

        const jsonPathDevelopmentBuild        = ['projects', options.project, 'architect', 'build', 'configurations', 'development'];
        const jsonValueDevelopmentBuild       = {
            'buildOptimizer' : false,
            'optimization'   : false,
            'vendorChunk'    : true,
            'extractLicenses': false,
            'sourceMap'      : true,
            'namedChunks'    : true
        };
        const jsonPathDevelopmentServe        = ['projects', options.project, 'architect', 'serve', 'configurations', 'development'];
        const jsonValueDevelopmentServe       = {
            'browserTarget': options.project + ':build:development'
        };
        const jsonPathDevelopmentServeDefault = ['projects', options.project, 'architect', 'serve', 'defaultConfiguration'];

        return chain([
            messageInfoRule(`Datei "angular.json" wird aktualisiert...`),
            updateBuildThemeAssets(options),
            updateTestThemeAssets(options),
            removeThemeAssets(options),
            updateJsonValue(options, '/angular.json', jsonPathDevelopmentBuild, jsonValueDevelopmentBuild),
            updateJsonValue(options, '/angular.json', jsonPathDevelopmentServe, jsonValueDevelopmentServe),
            updateJsonValue(options, '/angular.json', jsonPathDevelopmentServeDefault, 'development'),
            updateJsonArray(options, '/angular.json', jsonPathAllowedCommonJS, 'hammerjs'),
            updateJsonArray(options, '/angular.json', jsonPathAllowedCommonJS, 'ng2-pdf-viewer'),
            updateJsonArray(options, '/angular.json', jsonPathAllowedCommonJS, 'pdfjs-dist'),
            updateJsonValue(options, '/angular.json', jsonPathOptimization, jsonValueOptimization),
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
                const content  = readJsonAsString(tree, filePath);

                let modifiedContent = content;
                modifiedContent     = modifiedContent.replace(' --ivy', '');
                modifiedContent     = modifiedContent.replace(' --plugin @ihk-gfi/lux-components/ie11-lazy-modules-plugin.js', '');
                modifiedContent     = modifiedContent.replace(' npm run lint --bailOnLintError true', ' npm run lint');

                if (content !== modifiedContent) {
                    logInfo(`Das Flag "--ivy" wurde aus dem Script "xi18n" entfernt.`);
                    tree.overwrite(filePath, modifiedContent);
                }
            },
            (tree: Tree, _context: SchematicContext) => {
                removeJsonNode(tree, '/package.json', ['scripts', 'start-ie']);
            },
            messageSuccessRule(`Datei "package.json" wurde aktualisiert.`)
        ]);
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
    const filePath        = '/angular.json';
    const contentAsNode   = readJson(tree, filePath);
    const buildAssetsNode = findNodeAtLocation(contentAsNode, jsonPath);
    if (buildAssetsNode) {
        const arrayIndex = findObjectIndexInArray(buildAssetsNode, 'glob', '*.css');
        if (arrayIndex >= 0) {
            const angularJson = readJsonAsString(tree, filePath);
            const edits       = modify(
                angularJson,
                [...jsonPath, arrayIndex],
                {
                    glob  : '*(*min.css|*min.css.map)',
                    input : './node_modules/@ihk-gfi/lux-components-theme/prebuilt-themes',
                    output: './assets/themes'
                },
                { formattingOptions: jsonFormattingOptions, isArrayInsertion: false }
            );
            if (edits) {
                tree.overwrite(filePath, applyEdits(angularJson, edits));
                logInfo(`Den Abschnitt "${ JSON.stringify(jsonPath) }" aktualisiert.`);
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
                    let result = removeAttribute(content, 'lux-file-list', 'luxSelectedFilesAlwaysUseArray');

                    if (content !== result.content) {
                        logInfo(filePath + ' wurde angepasst.');
                        tree.overwrite(filePath, result.content);
                    }
                },
                '.component.html'
            );
        },
        messageSuccessRule(`Das Attribut "luxSelectedFilesAlwaysUseArray" wird entfernt.`)
    ]);
}

/**
 * Wenn eine Komponente einen leeren Style im styles-Array (styles: ['']) angegeben hat, führt dies zu dem folgenden Fehler:
 * Error: PostCSS received undefined instead of CSS string
 * Diese Methode repariert diesen Fehler, in dem der Leerstring entfernt wird.
 *
 * @param options
 */
export function fixEmptyStyles(options: any): Rule {
    return chain([
        messageInfoRule(`Die leeren Styles im @Component-Teil (styles: [''] => styles: []) werden korrigiert...`),
        (tree: Tree, context: SchematicContext) => {
            iterateFilesAndModifyContent(
                tree,
                options.path,
                (filePath: string, content: string) => {
                    const modifiedContent = content.replace(/styles\s?:\s*\[('{2}|"{2})\]/g, 'styles: []');

                    if (modifiedContent !== content) {
                        logInfo(filePath + ' wurde angepasst.');
                        tree.overwrite(filePath, modifiedContent);
                    }
                },
                '.component.ts'
            );
        },
        messageSuccessRule(`Die leeren Styles wurden korrigiert.`)
    ]);
}

export function removeDatepickerDefaultLocale(options: any): Rule {
    return chain([
        messageInfoRule(`Die explizit gesetzte Defaultlocale "de-DE" wird bei allen Datepickern entfernt...`),
        (tree: Tree, context: SchematicContext) => {
            iterateFilesAndModifyContent(
                tree,
                options.path,
                (filePath: string, content: string) => {
                    const modifiedContent = content.replace(/\sluxLocale="de-DE"/g, '');

                    if (modifiedContent !== content) {
                        logInfo(filePath + ' wurde angepasst.');
                        tree.overwrite(filePath, modifiedContent);
                    }
                },
                '.component.html'
            );
        },
        messageSuccessRule(`Die explizit gesetzte Defaultlocale "de-DE" wurde bei allen Datepickern entfernt.`)
    ]);
}

export function fixKarmaConf(options: any): Rule {
    return chain([
        messageInfoRule(`Datei "karma.conf.js" wird aktualisiert...`),
        (tree: Tree, context: SchematicContext) => {
            iterateFilesAndModifyContent(
                tree,
                options.path,
                (filePath: string, content: string) => {
                    const modifiedContent = content.replace(/require\('karma-coverage-istanbul-reporter'\),/g, 'require(\'karma-coverage\'),');

                    if (modifiedContent !== content) {
                        logInfo(filePath + ' wurde angepasst.');
                        tree.overwrite(filePath, modifiedContent);
                    }
                },
                'karma.conf.js'
            );
        },
        messageSuccessRule(`Datei "karma.conf.js" wurde aktualisiert.`)
    ]);
}
