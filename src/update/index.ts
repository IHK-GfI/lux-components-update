import { chain, Rule, SchematicContext, Tree } from '@angular-devkit/schematics';
import { applyRuleIf, finish, messageInfoRule, messageSuccessRule } from '../utility/util';
import { validateLuxComponentsVersion, validateNodeVersion } from '../utility/validation';
import { logInfoWithDescriptor, logSuccess } from '../utility/logging';
import { updateDependencies } from '../update-dependencies';
import { updateTheme } from '../update-theme/index';
import * as chalk from 'chalk';
import { iterateFilesAndModifyContent } from '../utility/files';

export const updateMajorVersion = '10';
export const updateMinVersion = '1.9.5';
export const updateNodeMinVersion = '12.0.0';

export function update(options: any): Rule {
  return (tree: Tree, _context: SchematicContext) => {
    return chain([
      check(options),
      applyRuleIf(updateMinVersion, updateProject(options)),
      finish(
        `${chalk.yellowBright(
          'Wichtig!!!'
        )} Hinweise im Update Guide beachten -> https://github.com/IHK-GfI/lux-components/wiki/update-guide-10`
      )
    ]);
  };
}

function check(options: any): Rule {
  return (tree: Tree, _context: SchematicContext) => {
    logInfoWithDescriptor(`Vorbedingungen werden geprüft...`);

    validateNodeVersion(_context, updateNodeMinVersion);
    validateLuxComponentsVersion(tree, `${updateMinVersion} || ^${updateMajorVersion}.0.0`);

    logSuccess(`Vorbedingungen wurden geprüft.`);

    return tree;
  };
}

function updateProject(options: any): Rule {
  return (tree: Tree, _context: SchematicContext) => {
    return chain([
      messageInfoRule(`LUX-Components ${updateMajorVersion} werden eingerichtet...`),
      updatePolyfills(options),
      updateLocale(options),
      updateTsConfig(options),
      updateDependencies(),
      updateTheme(options),
      messageSuccessRule(`LUX-Components ${updateMajorVersion} wurden eingerichtet.`)
    ]);
  };
}

export function updatePolyfills(options: any): Rule {
  return chain([
    (tree: Tree, context: SchematicContext) => {
      iterateFilesAndModifyContent(
        tree,
        options.path,
        (filePath: string, content: string) => {
          let modifiedContent = content.replace(
            /import 'core-js\/es\/weak-map';/g,
            "import 'core-js/es/weak-map';\nimport 'core-js/es/weak-set';"
          );
          modifiedContent = modifiedContent.replace(
            /import "core-js\/es\/weak-map";/g,
            'import "core-js/es/weak-map";\nimport "core-js/es/weak-set";'
          );

          if (content !== modifiedContent) {
            logInfoWithDescriptor(`polyfills.ts wird aktualisiert...`);
            tree.overwrite(filePath, modifiedContent);
            logSuccess(`polyfills.ts wurde aktualisiert.`);
          }
        },
        'polyfills.ts'
      );
    }
  ]);
}

export function updateTsConfig(options: any): Rule {
  return chain([
    (tree: Tree, context: SchematicContext) => {
      const filePath = '/tsconfig.json';
      const content = tree.read(filePath)?.toString();

      if (content) {
        let modifiedContent = content.replace(/"target": "es\d+"/g, '"target": "es2015"');

        if (content !== modifiedContent) {
          logInfoWithDescriptor(`tsconfig.json wird aktualisiert...`);
          tree.overwrite(filePath, modifiedContent);
          logSuccess(`tsconfig.json wurde aktualisiert.`);
        }
      }
    }
  ]);
}

export function updateLocale(options: any): Rule {
  return chain([
    (tree: Tree, context: SchematicContext) => {
      iterateFilesAndModifyContent(
        tree,
        options.path,
        (filePath: string, content: string) => {
          let modifiedContent = content;

          if (modifiedContent.indexOf('provide: LOCALE_ID') < 0) {
            modifiedContent = content.replace(
              /providers:.*\[/g,
              "providers: [\n{ provide: LOCALE_ID, useValue: 'de-DE' },"
            );
          }

          if (modifiedContent.indexOf('@angular/common/locales/global/de') < 0) {
            modifiedContent = "import '@angular/common/locales/global/de';\n" + modifiedContent;
          }

          modifiedContent = modifiedContent.replace(/import \{ registerLocaleData \} from .@angular\/common.;/g, '');
          modifiedContent = modifiedContent.replace(/import localeDE from .@angular\/common\/locales\/de.;/g, '');
          modifiedContent = modifiedContent.replace(
            /import localeDeExtra from .@angular\/common\/locales\/extra\/de.;/g,
            ''
          );
          modifiedContent = modifiedContent.replace(/registerLocaleData\(localeDE, localeDeExtra\);/g, '');

          if (content !== modifiedContent) {
            logInfoWithDescriptor(`Locale wird aktualisiert...`);
            tree.overwrite(filePath, modifiedContent);
            logSuccess(`Locale wurde aktualisiert.`);
          }
        },
        'app.module.ts'
      );
    }
  ]);
}
