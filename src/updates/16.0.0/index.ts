import { chain, Rule, SchematicContext, Tree } from '@angular-devkit/schematics';
import * as chalk from 'chalk';
import { updateDependencies } from '../../update-dependencies/index';
import { logInfoWithDescriptor, logSuccess } from '../../utility/logging';
import { applyRuleIf, finish, messageInfoRule, messageSuccessRule, updateI18nFile } from '../../utility/util';
import { validateLuxComponentsVersion, validateNodeVersion } from '../../utility/validation';

export const updateMajorVersion = '16';
export const updateMinVersion = '15.5.1';
export const updateNodeMinVersion = '18.0.0';

export function update(options: any): Rule {
  return (_tree: Tree, _context: SchematicContext) => {
    return chain([
      check(options),
      applyRuleIf(updateMinVersion, updateProject(options)),
      finish(
        false,
        `${chalk.yellowBright(
          'Wichtig!!!'
        )} Hinweise im Update Guide beachten -> https://github.com/IHK-GfI/lux-components/wiki/update-guide-v${updateMajorVersion}`
      )
    ]);
  };
}

export function updateProject(_options: any): Rule {
  return (_tree: Tree, _context: SchematicContext) => {
    return chain([
      messageInfoRule(`LUX-Components ${updateMajorVersion} werden aktualisiert...`),
      updateDependencies(),
      updateI18NFiles(),
      messageSuccessRule(`LUX-Components ${updateMajorVersion} wurden aktualisiert.`)
    ]);
  };
}

function check(_options: any): Rule {
  return (tree: Tree, _context: SchematicContext) => {
    logInfoWithDescriptor(`Vorbedingungen werden geprüft...`);

    validateNodeVersion(_context, updateNodeMinVersion);
    validateLuxComponentsVersion(tree, `${updateMinVersion} || ^${updateMajorVersion}.0.0`);

    logSuccess(`Vorbedingungen wurden geprüft.`);

    return tree;
  };
}

export function updateI18NFiles(): Rule {
  return (tree: Tree, _context: SchematicContext) => {
    messageInfoRule(`I18n-Dateien werden angepasst...`),
    updateI18nFile(tree, 'de', 'luxc.paginator.elements_on_page', i18nDe);
    updateI18nFile(tree, 'en', 'luxc.paginator.elements_on_page', i18nEn);
    messageInfoRule(`I18n-Dateien wurden angepasst.`)
  };
}

export const i18nDe = `<trans-unit id="luxc.dialog.btn.close.arialabel" datatype="html">
        <source>Dialog schließen</source>
        <context-group purpose="location">
          <context context-type="sourcefile">src/app/modules/lux-popups/lux-dialog/lux-dialog-structure/lux-dialog-structure.component.html</context>
          <context context-type="linenumber">16</context>
        </context-group>
      </trans-unit>`;

export const i18nEn = `<trans-unit id="luxc.dialog.btn.close.arialabel" datatype="html">
        <source>Dialog schließen</source>
        <target>Dialog close</target>
        <context-group purpose="location">
          <context context-type="sourcefile">src/app/modules/lux-popups/lux-dialog/lux-dialog-structure/lux-dialog-structure.component.html</context>
          <context context-type="linenumber">16</context>
        </context-group>
      </trans-unit>`;
