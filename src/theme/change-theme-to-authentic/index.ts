import { chain, Rule, SchematicContext, Tree } from '@angular-devkit/schematics';
import { iterateFilesAndModifyContent } from '../../utility/files';
import { HtmlManipulator as Html } from '../../utility/html/html-manipulator';
import { removeAttrFn, removeElementFn, renameElementFn } from '../../utility/html/manipulator-functions';
import { logError, logInfo } from '../../utility/logging';
import { messageInfoRule, messageSuccessRule } from '../../utility/util';
import { changeToLuxIcons } from '../change-to-lux-icons/index';

export function changeToThemeAuthentic(options: any): Rule {
  return (_tree: Tree, _context: SchematicContext) => {
    return chain([
      messageInfoRule(`Das Authentic-Theme wird eingerichtet...`),
      setAcThemeToAppComponent(options),
      changeToAcComponents(options),
      changeToLuxIcons(options),
      messageSuccessRule(`Das Authentic-Theme wurde eingerichtet.`)
    ]);
  };
}

export function setAcThemeToAppComponent(options: any): Rule {
  return chain([
    messageInfoRule(`Das Authentic-Theme wird in der app.component.ts gesetzt...`),
    (tree: Tree, _context: SchematicContext) => {
      const themeName = 'authentic';
      const filePath = (options.path ?? '.') + '/src/app/app.component.ts';
      if (tree.exists(filePath)) {
        const content = tree.read(filePath)!.toString();
        let result = content;

        const setThemeRegEx = new RegExp("(\\w*\\.setTheme\\(['|\"'])(.*?)(['|\"']\\);)");
        const loadThemeRegEx = new RegExp('(\\w*\\.loadTheme\\(.*?\\);)');

        if (setThemeRegEx.test(content)) {
          const groups = setThemeRegEx.exec(content);
          if (groups && groups.length > 0) {
            result = result.replace(setThemeRegEx, `$1${themeName}$3`);
          }
        } else if (loadThemeRegEx.test(content)) {
          const groups = loadThemeRegEx.exec(content);
          if (groups && groups.length > 0) {
            result = result.replace(loadThemeRegEx, `themeService.setTheme('${themeName}');\n    $1`);
          }
        }

        if (content !== result) {
          logInfo(`Konstruktor angepasst -> themeService.setTheme('${themeName}');`);
          tree.overwrite(filePath, result);
        } else {
          logError('Das Theme konnte nicht in der app.component.ts gesetzt werden. Bitte manuell setzen.');
        }
      } else {
        logError(`Der Dateipfad "${filePath}" existiert nicht.`);
      }
    },
    messageSuccessRule(`Das Theme wurde in der app.component.ts gesetzt.`)
  ]);
}

export function changeToAcComponents(options: any): Rule {
  return chain([
    messageInfoRule(`Die Standardkomponenten werden durch die AC-Komponenten ersetzt...`),
    (tree: Tree, _context: SchematicContext) => {
      iterateFilesAndModifyContent(
        tree,
        options.path,
        (filePath: string, content: string) => {
          let result = content;

          luxComponents.forEach((luxComponent) => {
            result = Html.transform(result, luxComponent.tag, renameElementFn(luxComponent.acTag));
          });

          result = Html.transform(result, 'lux-side-nav-header', removeElementFn);
          result = Html.transform(result, 'lux-side-nav-footer', removeElementFn);
          result = Html.transform(result, 'lux-app-header-ac-nav-menu', removeAttrFn('luxSideNavExpandedChange'));
          result = Html.transform(result, 'lux-app-header-ac-nav-menu', removeAttrFn('luxOpenLinkBlank'));

          if (content !== result) {
            logInfo(filePath + ' wurde angepasst.');
            tree.overwrite(filePath, result);
          }
        },
        '.component.html'
      );
    },
    messageSuccessRule(`Die Standardkomponenten wurden durch die AC-Komponenten ersetzt.`)
  ]);
}

class LuxComponent {
  constructor(public tag: string, public acTag: string) {}
}

const luxComponents: LuxComponent[] = [
  new LuxComponent('lux-master-detail', 'lux-master-detail-ac'),
  new LuxComponent('lux-detail-view', 'lux-detail-view-ac'),
  new LuxComponent('lux-detail-wrapper', 'lux-detail-wrapper-ac'),
  new LuxComponent('lux-detail-header', 'lux-detail-header-ac'),
  new LuxComponent('lux-master-header', 'lux-master-header-ac'),
  new LuxComponent('lux-master-header-content', 'lux-master-header-content-ac'),
  new LuxComponent('lux-master-footer', 'lux-master-footer-ac'),
  new LuxComponent('lux-master-simple', 'lux-master-list-ac'),
  new LuxComponent('lux-app-header', 'lux-app-header-ac'),
  new LuxComponent('lux-app-header-action-nav-item', 'lux-app-header-ac-action-nav-item'),
  new LuxComponent('lux-app-header-action-nav-item-custom', 'lux-app-header-ac-action-nav-item-custom'),
  new LuxComponent('lux-app-header-action-nav', 'lux-app-header-ac-action-nav'),
  new LuxComponent('lux-app-header-nav-menu-item', 'lux-app-header-ac-nav-menu-item'),
  new LuxComponent('lux-app-header-right-nav', 'lux-app-header-ac-user-menu'),
  new LuxComponent('lux-side-nav', 'lux-app-header-ac-nav-menu'),
  new LuxComponent('lux-side-nav-item', 'lux-app-header-ac-nav-menu-item'),
  new LuxComponent('lux-tile', 'lux-tile-ac'),
  new LuxComponent('lux-autocomplete', 'lux-autocomplete-ac'),
  new LuxComponent('lux-checkbox', 'lux-checkbox-ac'),
  new LuxComponent('lux-chips', 'lux-chips-ac'),
  new LuxComponent('lux-chip', 'lux-chip-ac'),
  new LuxComponent('lux-chip-group', 'lux-chip-ac-group'),
  new LuxComponent('lux-datepicker', 'lux-datepicker-ac'),
  new LuxComponent('lux-datetimepicker', 'lux-datetimepicker-ac'),
  new LuxComponent('lux-radio', 'lux-radio-ac'),
  new LuxComponent('lux-select', 'lux-select-ac'),
  new LuxComponent('lux-slider', 'lux-slider-ac'),
  new LuxComponent('lux-toggle', 'lux-toggle-ac'),
  new LuxComponent('lux-textarea', 'lux-textarea-ac'),
  new LuxComponent('lux-file-input', 'lux-file-input-ac'),
  new LuxComponent('lux-input', 'lux-input-ac'),
  new LuxComponent('lux-input-prefix', 'lux-input-ac-prefix'),
  new LuxComponent('lux-input-suffix', 'lux-input-ac-suffix'),
  new LuxComponent('lux-lookup-combobox', 'lux-lookup-combobox-ac'),
  new LuxComponent('lux-lookup-autocomplete', 'lux-lookup-autocomplete-ac')
];
