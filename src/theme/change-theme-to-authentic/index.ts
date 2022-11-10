import { chain, Rule, SchematicContext, Tree } from '@angular-devkit/schematics';
import * as chalk from 'chalk';
import { iterateFilesAndModifyContent } from '../../utility/files';
import { Hit } from '../../utility/html/hit';
import { HtmlManipulator as Html } from '../../utility/html/html-manipulator';
import { removeAttrFn, removeElementFn, renameElementFn } from '../../utility/html/manipulator-functions';
import { logError, logInfo, logWarn } from '../../utility/logging';
import { finish, messageInfoRule, messageSuccessRule, replaceFirst } from '../../utility/util';

export function update(options: any): Rule {
  return (_tree: Tree, _context: SchematicContext) => {
    return chain([changeToThemeAuthentic(options), finish(false, `${chalk.yellowBright('Fertig!')}`)]);
  };
}

export function changeToThemeAuthentic(options: any): Rule {
  return (_tree: Tree, _context: SchematicContext) => {
    return chain([
      messageInfoRule(`Das Authentic-Theme wird eingerichtet...`),
      setAcThemeToAppComponent(options),
      changeToAcComponents(options),
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

          result = Html.transform(result, '*[luxIconName]', updateIconAttrFn(filePath, true));

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

const updateIconAttrFn = (filePath: string, ac: boolean) => {
  return (hit: Hit) => {
    const pattern = new RegExp('((\\(|\\[|\\[\\()?luxIconName(\\)|\\]|\\)\\])?)\\s*=\\s*"(.*?)"', 'm');

    const groups = pattern.exec(hit.elementContent);
    if (groups && groups.length >= 4) {
      let iconName = groups[4];

      if (iconName.startsWith('fab ')) {
        iconName = replaceFirst(iconName, 'fab ', '');
      } else if (iconName.startsWith('fas ')) {
        iconName = replaceFirst(iconName, 'fas ', '');
      } else if (iconName.startsWith('far ')) {
        iconName = replaceFirst(iconName, 'far ', '');
      } else if (iconName.startsWith('fal ')) {
        iconName = replaceFirst(iconName, 'fal ', '');
      }

      const found = luxIcons.find((icon) => (ac ? icon.oldName : icon.newName) === iconName);

      if (found) {
        hit.elementContent = hit.elementContent.replace(pattern, '$1="' + (ac ? found.newName : found.oldName) + '"');
        logInfo(`${filePath}: Das Icon "${iconName}" -> ${ac ? found.newName : found.oldName}`);
      } else {
        if (!iconName.startsWith('lux-')) {
          logWarn(`${filePath}: Das Icon "${iconName}" konnte nicht ersetzt werden.`);
        }
      }
    }
  };
};

class LuxComponent {
  constructor(public tag: string, public acTag: string) {}
}

const luxComponents: LuxComponent[] = [
  new LuxComponent('lux-app-header', 'lux-app-header-ac'),
  new LuxComponent('lux-app-header-action-nav-item', 'lux-app-header-ac-action-nav-item'),
  new LuxComponent('lux-app-header-action-nav-item-custom', 'lux-app-header-ac-action-nav-item-custom'),
  new LuxComponent('lux-app-header-action-nav', 'lux-app-header-ac-action-nav'),
  new LuxComponent('lux-app-header-nav-menu-item', 'lux-app-header-ac-nav-menu-item'),
  new LuxComponent('lux-app-header-right-nav', 'lux-app-header-ac-user-menu'),
  new LuxComponent('lux-side-nav', 'lux-app-header-ac-nav-menu'),
  new LuxComponent('lux-side-nav-item', 'lux-app-header-ac-nav-menu-item'),
  new LuxComponent('lux-tile', 'lux-tile-authentic'),
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

class LuxIcon {
  oldName: string;
  newName: string;

  constructor(oldName: string, newName: string) {
    this.oldName = oldName;
    this.newName = newName;
  }
}

const luxIcons: LuxIcon[] = [
  new LuxIcon('account_circle', 'lux-interface-user-circle'),
  new LuxIcon('add', 'lux-interface-add-1'),
  new LuxIcon('android', 'lux-logo-android'),
  new LuxIcon('check', 'lux-interface-validation-check'),
  new LuxIcon('delete', 'lux-interface-delete-bin-2'),
  new LuxIcon('done', 'lux-interface-validation-check'),
  new LuxIcon('edit', 'lux-interface-edit-pencil'),
  new LuxIcon('error', 'lux-interface-alert-warning-circle'),
  new LuxIcon('fa-address-book', 'lux-phone-book'),
  new LuxIcon('fa-address-card', 'lux-card'),
  new LuxIcon('fa-align-justify', 'lux-interface-text-formatting-justified-align'),
  new LuxIcon('fa-align-left', 'lux-interface-text-formatting-left-align'),
  new LuxIcon('fa-angle-left', 'lux-interface-arrows-button-left'),
  new LuxIcon('fa-angle-right', 'lux-interface-arrows-button-right'),
  new LuxIcon('fa-angle-up', 'lux-interface-arrows-button-up'),
  new LuxIcon('fa-angle-down', 'lux-interface-arrows-button-down'),
  new LuxIcon('fa-archive', 'lux-interface-content-archive'),
  new LuxIcon('fa-arrow-alt-circle-left', 'lux-interface-arrows-left-circle-2'),
  new LuxIcon('fa-arrow-alt-circle-right', 'lux-interface-arrows-right-circle-2'),
  new LuxIcon('fa-arrow-alt-circle-up', 'lux-interface-arrows-up-circle-2'),
  new LuxIcon('fa-arrow-alt-circle-down', 'lux-interface-arrows-down-circle-2'),
  new LuxIcon('fa-arrow-circle-down', 'lux-interface-arrows-down-circle-1'),
  new LuxIcon('fa-arrow-circle-left', 'lux-interface-arrows-left-circle-1'),
  new LuxIcon('fa-arrow-circle-right', 'lux-interface-arrows-right-circle-1'),
  new LuxIcon('fa-arrow-circle-up', 'lux-interface-arrows-up-circle-1'),
  new LuxIcon('fa-arrow-down', 'lux-interface-arrows-down'),
  new LuxIcon('fa-arrow-left', 'lux-interface-arrows-left'),
  new LuxIcon('fa-arrow-right', 'lux-interface-arrows-right'),
  new LuxIcon('fa-arrow-up', 'lux-interface-arrows-up'),
  new LuxIcon('fa-arrows-v', 'lux-interface-arrows-vertical'),
  new LuxIcon('fa-at', 'lux-mail-sign-at'),
  new LuxIcon('fa-atom', 'lux-atom'),
  new LuxIcon('fa-automobile', 'lux-car'),
  new LuxIcon('fa-ban', 'lux-interface-block'),
  new LuxIcon('fa-bar', 'lux-interface-setting-menu-1'),
  new LuxIcon('fa-bars', 'lux-interface-setting-menu-1'),
  new LuxIcon('fa-bed', 'lux-travel-hotel-bed-2'),
  new LuxIcon('fa-bezier-curve', 'lux-bezier-curve'),
  new LuxIcon('fa-binoculars', 'lux-interface-edit-binocular'),
  new LuxIcon('fa-birthday-cake', 'lux-food-cake'),
  new LuxIcon('fa-bolt', 'lux-image-flash-2'),
  new LuxIcon('fa-bomb', 'lux-interface-edit-bomb'),
  new LuxIcon('fa-book', 'lux-interface-content-book'),
  new LuxIcon('fa-book-open', 'lux-interface-content-book-open'),
  new LuxIcon('fa-book-reader', 'lux-book-reader'),
  new LuxIcon('fa-briefcase', 'lux-shopping-briefcase'),
  new LuxIcon('fa-building', 'lux-factory'),
  new LuxIcon('fa-bullhorn', 'lux-interface-share-mega-phone-1'),
  // new LuxIcon('fa-buromobelexperte', ''),
  new LuxIcon('fa-business-time', 'lux-suitcase-time'),
  new LuxIcon('fa-calculator', 'lux-calculator'),
  new LuxIcon('fa-calendar-alt', 'lux-interface-calendar-mark'),
  new LuxIcon('fa-calendar-check', 'lux-interface-calendar-check'),
  new LuxIcon('fa-calendar-plus', 'lux-interface-calendar-add'),
  new LuxIcon('fa-calendar-times', 'lux-time'),
  new LuxIcon('fa-camera-retro', 'lux-image-camera-1'),
  new LuxIcon('fa-car', 'lux-car'),
  new LuxIcon('fa-cash-register', 'lux-money-cashier'),
  new LuxIcon('fa-chalkboard-teacher', 'lux-drawing-board'),
  new LuxIcon('fa-chart-bar', 'lux-graph-bars'),
  new LuxIcon('fa-chart-line', 'lux-money-graph'),
  new LuxIcon('fa-check', 'lux-interface-validation-check'),
  new LuxIcon('fa-check-circle', 'lux-interface-validation-check-circle'),
  new LuxIcon('fa-check-circle-o', 'lux-interface-validation-check-circle'),
  new LuxIcon('fa-check-square', 'lux-interface-validation-check-square-1'),
  new LuxIcon('fa-chevron-left', 'lux-interface-arrows-button-left'),
  new LuxIcon('fa-chevron-right', 'lux-interface-arrows-button-right'),
  new LuxIcon('fa-chevron-up', 'lux-interface-arrows-button-up'),
  new LuxIcon('fa-chevron-down', 'lux-interface-arrows-button-down'),
  new LuxIcon('fa-child', 'lux-body-kid'),
  new LuxIcon('fa-circle', 'lux-interface-geometric-circle'),
  new LuxIcon('fa-city', 'lux-city'),
  new LuxIcon('fa-clipboard', 'lux-interface-file-clipboard'),
  new LuxIcon('fa-clipboard-check', 'lux-interface-file-clipboard-check'),
  new LuxIcon('fa-clipboard-list', 'lux-interface-file-clipboard-text'),
  new LuxIcon('fa-clock', 'lux-interface-time-clock-circle'),
  new LuxIcon('fa-clone', 'lux-clone'),
  new LuxIcon('fa-close', 'lux-interface-delete-1'),
  new LuxIcon('fa-cloud', 'lux-interface-weather-cloud-1'),
  new LuxIcon('fa-cog', 'lux-interface-setting-cog'),
  new LuxIcon('fa-cogs', 'lux-cogs'),
  new LuxIcon('fa-columns', 'lux-interface-layout-three-columns'),
  new LuxIcon('fa-comment', 'lux-oval'),
  new LuxIcon('fa-comments', 'lux-ovals'),
  new LuxIcon('fa-copy', 'lux-clone'),
  new LuxIcon('fa-credit-card', 'lux-money-atm-card-1'),
  new LuxIcon('fa-crop-alt', 'lux-interface-edit-crop'),
  new LuxIcon('fa-crosshairs', 'lux-travel-map-location-target-1'),
  new LuxIcon('fa-cut', 'lux-interface-edit-scissors'),
  // new LuxIcon('fa-database', ''),
  new LuxIcon('fa-dice-five', 'lux-dice'),
  new LuxIcon('fa-download', 'lux-interface-download-button-2'),
  new LuxIcon('fa-edit', 'lux-interface-edit-write-2'),
  new LuxIcon('fa-ellipsis-h', 'lux-interface-setting-menu-horizontal'),
  new LuxIcon('fa-ellipsis-v', 'lux-interface-setting-menu-vertical'),
  new LuxIcon('fa-envelope', 'lux-mail-send-envelope'),
  new LuxIcon('fa-envelope-open', 'lux-envelope-open'),
  new LuxIcon('fa-envelope-open-text', 'lux-envelope-open-text'),
  new LuxIcon('fa-eraser', 'lux-interface-text-formatting-eraser'),
  new LuxIcon('fa-euro-sign', 'lux-money-currency-euro'),
  new LuxIcon('fa-exchange-alt', 'lux-exchange'),
  new LuxIcon('fa-exclamation', 'lux-exclamation-mark'),
  new LuxIcon('fa-exclamation-circle', 'lux-interface-alert-warning-circle'),
  new LuxIcon('fa-exclamation-triangle', 'lux-interface-alert-warning-triangle'),
  new LuxIcon('fa-expand', 'lux-interface-arrows-expand-1'),
  new LuxIcon('fa-external-link', 'lux-interface-arrows-expand-5'),
  new LuxIcon('fa-external-link-alt', 'lux-interface-arrows-expand-5'),
  new LuxIcon('fa-eye', 'lux-interface-edit-view'),
  new LuxIcon('fa-file', 'lux-interface-content-file'),
  new LuxIcon('fa-file-alt', 'lux-interface-file-text'),
  new LuxIcon('fa-file-archive', 'lux-interface-file-zip'),
  new LuxIcon('fa-file-contract', 'lux-file-contract'),
  new LuxIcon('fa-file-csv', 'lux-file-csv'),
  new LuxIcon('fa-file-download', 'lux-file-download'),
  new LuxIcon('fa-file-excel', 'lux-interface-file-delete'),
  new LuxIcon('fa-file-image', 'lux-file-image'),
  new LuxIcon('fa-file-import', 'lux-file-import'),
  new LuxIcon('fa-file-invoice', 'lux-file-invoice'),
  new LuxIcon('fa-file-invoice-dollar', 'money'),
  new LuxIcon('fa-file-medical-alt', 'lux-file-medical'),
  new LuxIcon('fa-file-pdf', 'lux-file-pdf'),
  new LuxIcon('fa-file-powerpoint', 'lux-file-powerpoint'),
  new LuxIcon('fa-file-signature', 'lux-file-signature'),
  new LuxIcon('fa-file-upload', 'lux-file-upload'),
  new LuxIcon('fa-file-word', 'lux-file-word'),
  new LuxIcon('fa-filter', 'lux-interface-text-formatting-filter-1'),
  new LuxIcon('fa-filter-circle-xmark', 'lux-filter-remove'),
  new LuxIcon('fa-flag', 'lux-travel-map-rectangle-flag'),
  new LuxIcon('fa-folder', 'lux-interface-folder'),
  new LuxIcon('fa-folder-open', 'lux-folder-open'),
  new LuxIcon('fa-font', 'lux-interface-text-formatting-font-size'),
  new LuxIcon('fa-frown', 'lux-mail-smiley-sad-face'),
  new LuxIcon('fa-gavel', 'lux-interface-setting-hammer'),
  new LuxIcon('fa-gear', 'lux-interface-setting-cog'),
  new LuxIcon('fa-gears', 'lux-cogs'),
  new LuxIcon('fa-globe', 'lux-programming-web'),
  new LuxIcon('fa-globe-americas', 'lux-travel-map-earth-1'),
  new LuxIcon('fa-globe-europe', 'lux-travel-map-earth-2'),
  new LuxIcon('fa-graduation-cap', 'lux-graduation cap'),
  new LuxIcon('fa-grip-horizontal', 'lux-dial-pad-6-digits'),
  new LuxIcon('fa-hammer', 'lux-interface-setting-hammer'),
  new LuxIcon('fa-hand-peace', 'lux-peace'),
  new LuxIcon('fa-hand-peace-o', 'lux-peace'),
  new LuxIcon('fa-handshake', 'lux-handshake'),
  new LuxIcon('fa-handshake-o', 'lux-handshake'),
  new LuxIcon('fa-history', 'lux-interface-content-archive-folder'),
  new LuxIcon('fa-home', 'lux-interface-home-3'),
  new LuxIcon('fa-hourglass-end', 'lux-hour-glass-end'),
  new LuxIcon('fa-hourglass-start', 'lux-hour-glass-start'),
  new LuxIcon('fa-id-badge', 'lux-id-badge'),
  new LuxIcon('fa-id-card', 'lux-id-card'),
  new LuxIcon('fa-image', 'lux-image-picture-landscape-2'),
  new LuxIcon('fa-inbox', 'lux-mail-inbox'),
  new LuxIcon('fa-industry', 'lux-industry'),
  new LuxIcon('fa-info', 'lux-info'),
  new LuxIcon('fa-info-circle', 'lux-interface-alert-information-circle'),
  new LuxIcon('fa-key', 'lux-interface-login-key'),
  new LuxIcon('fa-life-ring', 'lux-travel-wayfinder-lifebuoy'),
  new LuxIcon('fa-lightbulb', 'lux-interface-lighting-light-bulb'),
  new LuxIcon('fa-link', 'lux-interface-link'),
  new LuxIcon('fa-list', 'lux-interface-text-formatting-list-bullets'),
  new LuxIcon('fa-list-alt', 'lux-interface-text-formatting-list-bullets'),
  new LuxIcon('fa-list-ol', 'lux-ordered-list'),
  new LuxIcon('fa-list-ul', 'lux-interface-text-formatting-list-bullets'),
  new LuxIcon('fa-lock', 'lux-interface-lock'),
  new LuxIcon('fa-lock-open', 'lux-interface-lock-unlock'),
  new LuxIcon('fa-long-arrow-right', 'lux-interface-arrows-right'),
  new LuxIcon('fa-magic', 'lux-interface-edit-design-tool-selection-wand'),
  new LuxIcon('fa-mail-bulk', 'lux-bulk'),
  new LuxIcon('fa-map', 'lux-travel-map'),
  new LuxIcon('fa-map-marker-alt', 'lux-map-marker'),
  new LuxIcon('fa-marker', 'lux-location-pin-empty'),
  new LuxIcon('fa-minus', 'lux-interface-remove-1'),
  new LuxIcon('fa-minus-circle', 'lux-interface-remove-circle'),
  new LuxIcon('fa-moon', 'lux-interface-weather-moon'),
  new LuxIcon('fa-mouse-pointer', 'lux-interface-cursor-arrow-1'),
  new LuxIcon('fa-network-wired', 'lux-network-structure'),
  new LuxIcon('fa-newspaper', 'lux-news-paper'),
  new LuxIcon('fa-not-equal', 'lux-not-equal'),
  new LuxIcon('fa-object-group', 'lux-group-objects'),
  new LuxIcon('fa-paper-plane', 'lux-mail-send-email'),
  new LuxIcon('fa-paperclip', 'lux-interface-edit-attachment-1'),
  new LuxIcon('fa-pause-circle', 'lux-control-button-pause-circle'),
  new LuxIcon('fa-pen', 'lux-interface-edit-pen-1'),
  new LuxIcon('fa-pen-alt', 'lux-interface-edit-pen-2'),
  new LuxIcon('fa-pen-square', 'lux-interface-edit-write-2'),
  new LuxIcon('fa-pencil', 'lux-interface-edit-pencil'),
  new LuxIcon('fa-pencil-alt', 'lux-interface-edit-pencil'),
  new LuxIcon('fa-percentage', 'lux-percentage'),
  new LuxIcon('fa-flux-capacitor', 'lux-flux-capacitor'),
  new LuxIcon('fa-phone', 'lux-phone'),
  new LuxIcon('fa-play', 'lux-control-button-play'),
  new LuxIcon('fa-play-circle', 'lux-control-button-play-circle'),
  new LuxIcon('fa-plug', 'lux-plug'),
  new LuxIcon('fa-plus', 'lux-interface-add-1'),
  new LuxIcon('fa-plus-circle', 'lux-interface-add-circle'),
  new LuxIcon('fa-plus-square', 'lux-interface-add-square'),
  new LuxIcon('fa-poll', 'lux-graph-poll-vertical'),
  new LuxIcon('fa-poll-h', 'lux-graph-poll-horizontal'),
  new LuxIcon('fa-portrait', 'lux-interface-user-square-alternate'),
  new LuxIcon('fa-power-off', 'lux-control-button-power-1'),
  new LuxIcon('fa-print', 'lux-printer'),
  new LuxIcon('fa-project-diagram', 'lux-interface-hierarchy-1'),
  new LuxIcon('fa-puzzle-piece', 'lux-programming-module-puzzle'),
  new LuxIcon('fa-question', 'lux-question-mark'),
  new LuxIcon('fa-question-circle', 'lux-interface-help-question-circle'),
  new LuxIcon('fa-ravelry', 'lux-registred-trademark'),
  new LuxIcon('fa-readme', 'lux-book-readme'),
  new LuxIcon('fa-receipt', 'lux-receipt'),
  new LuxIcon('fa-redo', 'lux-interface-arrows-turn-forward'),
  new LuxIcon('fa-refresh', 'lux-interface-arrows-synchronize'),
  new LuxIcon('fa-sync', 'lux-interface-arrows-synchronize'),
  new LuxIcon('fa-robot', 'lux-robot-cyborg'),
  new LuxIcon('fa-route', 'lux-route'),
  new LuxIcon('fa-ruler', 'lux-interface-edit-ruler'),
  new LuxIcon('fa-running', 'lux-running'),
  new LuxIcon('fa-satellite-dish', 'lux-interface-share-satellite'),
  new LuxIcon('fa-save', 'lux-save'),
  new LuxIcon('fa-scroll', 'lux-scroll'),
  new LuxIcon('fa-search', 'lux-interface-search'),
  new LuxIcon('fa-search-plus', 'lux-interface-edit-zoom-in'),
  new LuxIcon('fa-search-minus', 'lux-interface-edit-zoom-out'),
  new LuxIcon('fa-searchengin', 'lux-searchengine'),
  new LuxIcon('fa-sign-in-alt', 'lux-interface-login'),
  new LuxIcon('fa-sign-out-alt', 'lux-interface-logout'),
  new LuxIcon('fa-signature', 'lux-signature'),
  new LuxIcon('fa-sitemap', 'lux-network-structure'),
  new LuxIcon('fa-sliders-h', 'lux-interface-setting-slider-horizontal'),
  new LuxIcon('fa-solid fa-barcode', 'lux-money-cashier-bar-code'),
  new LuxIcon('fa-solid fa-bug', 'lux-programming-bug'),
  new LuxIcon('fa-sort', 'lux-interface-page-controller-scroll-up-down'),
  new LuxIcon('fa-sort-up', 'lux-interface-arrows-button-up'),
  new LuxIcon('fa-sort-down', 'lux-interface-arrows-button-down'),
  new LuxIcon('fa-sort-amount-down', 'lux-amount-down-asc'),
  new LuxIcon('fa-sort-amount-down-alt', 'lux-amount-down-desc-alt'),
  new LuxIcon('fa-sort-amount-up', 'lux-amount-up-asc'),
  new LuxIcon('fa-sort-amount-up-alt', 'lux-amount-up-desc-alt'),
  new LuxIcon('fa-spell-check', 'lux-spellcheck'),
  new LuxIcon('fa-spinner', 'lux-spinner'),
  new LuxIcon('fa-star', 'lux-interface-favorite-star'),
  new LuxIcon('fa-star-half-alt', 'lux-interface-award-half-star'),
  new LuxIcon('fa-sticky-note', 'lux-interface-file-sticky-note'),
  new LuxIcon('fa-stopwatch', 'lux-stopwatch'),
  new LuxIcon('fa-stream', 'lux-stopwatch'),
  new LuxIcon('fa-sun', 'x-interface-lighting-brightness-1'),
  new LuxIcon('fa-sync', 'lux-interface-arrows-synchronize'),
  new LuxIcon('fa-sync-alt', 'lux-interface-arrows-reload-2'),
  new LuxIcon('fa-table', 'lux-interface-layout-7'),
  new LuxIcon('fa-tachometer-alt', 'lux-gauge'),
  new LuxIcon('fa-tag', 'lux-interface-bookmark-tag'),
  new LuxIcon('fa-tasks', 'lux-tasks'),
  new LuxIcon('fa-th', 'lux-interface-edit-grid'),
  new LuxIcon('fa-th-large', 'lux-interface-layout-border-full'),
  new LuxIcon('fa-thumbs-down', 'lux-interface-favorite-dislike-1'),
  new LuxIcon('fa-thumbs-up', 'lux-interface-favorite-like-1'),
  new LuxIcon('fa-thumbtack', 'lux-interface-edit-pin-2'),
  new LuxIcon('fa-times', 'lux-interface-delete-1'),
  new LuxIcon('fa-times-circle', 'lux-interface-delete-circle'),
  new LuxIcon('fa-toolbox', 'lux-interface-setting-tool-box'),
  new LuxIcon('fa-tools', 'lux-tools'),
  new LuxIcon('fa-trash', 'lux-interface-delete-bin-2'),
  new LuxIcon('fa-trash-alt', 'lux-interface-delete-bin-5'),
  new LuxIcon('fa-trophy', 'lux-interface-award-trophy'),
  new LuxIcon('fa-undo', 'lux-interface-arrows-turn-backward'),
  new LuxIcon('fa-university', 'lux-university'),
  new LuxIcon('fa-unlink', 'lux-interface-unlink'),
  new LuxIcon('fa-upload', 'lux-interface-upload-button-2'),
  new LuxIcon('fa-user', 'lux-interface-user-single'),
  new LuxIcon('fa-user-alt', 'lux-interface-user-single'),
  new LuxIcon('fa-user-astronaut', 'lux-ecology-science-planet'),
  new LuxIcon('fa-user-check', 'lux-interface-user-check'),
  new LuxIcon('fa-user-circle', 'lux-interface-user-circle'),
  new LuxIcon('fa-user-clock', 'lux-clock'),
  new LuxIcon('fa-user-cog', 'lux-cog'),
  new LuxIcon('fa-user-edit', 'lux-interface-user-edit'),
  new LuxIcon('fa-user-friends', 'lux-interface-user-multiple'),
  new LuxIcon('fa-user-graduate', 'lux-graduate'),
  new LuxIcon('fa-user-minus', 'lux-interface-user-remove'),
  new LuxIcon('fa-user-plus', 'lux-interface-user-add'),
  new LuxIcon('fa-user-secret', 'lux-interface-user-lock'),
  new LuxIcon('fa-user-tag', 'lux-tag'),
  new LuxIcon('fa-user-tie', 'lux-tie'),
  new LuxIcon('fa-user-times', 'lux-interface-user-delete'),
  new LuxIcon('fa-users', 'lux-interface-user-multiple'),
  new LuxIcon('fa-users-cog', 'lux-multiple-cog'),
  new LuxIcon('fa-utensils', 'lux-food-kitchenware-fork-spoon'),
  new LuxIcon('fa-wallet', 'lux-money-wallet'),
  new LuxIcon('fa-weight', 'lux-weight'),
  new LuxIcon('fa-window-close', 'lux-close'),
  new LuxIcon('fa-window-maximize', 'lux-maximize'),
  new LuxIcon('fa-window-restore', 'lux-programming-browser-window'),
  new LuxIcon('fa-wrench', 'lux-interface-setting-wrench'),
  new LuxIcon('fa-handshake', 'lux-handshake'),
  new LuxIcon('file_download', 'lux-file-download'),
  new LuxIcon('file_upload', 'lux-file-upload'),
  new LuxIcon('info', 'lux-info'),
  new LuxIcon('looks_3', 'lux-three'),
  new LuxIcon('looks_one', 'lux-one'),
  new LuxIcon('looks_two', 'lux-two'),
  new LuxIcon('mail_outline', 'lux-mail-send-envelope'),
  new LuxIcon('person', 'lux-interface-user-single'),
  new LuxIcon('refresh', 'lux-interface-arrows-round-right'),
  new LuxIcon('remove', 'lux-interface-remove-1'),
  new LuxIcon('rotate_left', 'lux-rotate-left'),
  new LuxIcon('rotate_right', 'lux-rotate-right'),
  new LuxIcon('save', 'lux-save'),
  new LuxIcon('sync', 'lux-interface-arrows-synchronize'),
  new LuxIcon('undo', 'lux-mail-send-reply'),
  new LuxIcon('warning', 'lux-interface-alert-warning-triangle'),
  new LuxIcon('fa-bookmark', 'lux-interface-bookmark'),
  new LuxIcon('fa-money-check-alt', 'lux-money-atm-card-1'),
  new LuxIcon('fa-cloud-upload-alt', 'lux-programming-cloud-upload'),
  new LuxIcon('fa-bell', 'lux-interface-alert-alarm-bell-2'),
  new LuxIcon('fa-caret-left', 'lux-interface-arrows-button-left'),
  new LuxIcon('keyboard_arrow_left', 'lux-interface-arrows-button-left'),
  new LuxIcon('keyboard_arrow_right', 'lux-interface-arrows-button-right'),
  new LuxIcon('fa-fill', 'lux-interface-edit-spray'),
  new LuxIcon('fa-video', 'lux-camera-video'),
  new LuxIcon('fa-at', 'lux-mail-sign-at'),
  new LuxIcon('fa-file-code', 'lux-programming-script-file-code-1'),
];
