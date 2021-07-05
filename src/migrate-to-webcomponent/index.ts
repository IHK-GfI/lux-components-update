import { chain, Rule, SchematicContext, Tree } from '@angular-devkit/schematics';
import { applyEdits, Edit, findNodeAtLocation, modify } from 'jsonc-parser';
import * as ts from 'typescript';
import { iterateFilesAndModifyContent } from '../utility/files';
import { addAttribute, appendAttribute } from '../utility/html';
import { appendScript, jsonFormattingOptions, readJson, readJsonAsString } from '../utility/json';
import { logInfo } from '../utility/logging';
import {
  addClassProperty,
  addConstructorContent,
  addConstructorParameter,
  addImport,
  addInterface,
  addMethod,
  getSourceNodes,
  getSyntaxListOfClass
} from '../utility/typescript';
import { finish, messageInfoRule, messageSuccessRule } from '../utility/util';

export function migrateToWebcomponent(options: any): Rule {
  return chain([
    messageInfoRule(`LUX-Componentsprojekt wird zur Web Component umgebaut...`),
    updateAppComponent(options),
    updatePackageJson(options),
    updateAngularJson(options),
    updateAppRoutingModule(options),
    updateAppComponentHtml(options),
    createWebpackConfigJs(options),
    updateIndexHtml(options),
    updateAppModule(options),
    messageSuccessRule(`LUX-Componentsprojekt wurde zur Web Component umgebaut.`),
    finish()
  ]);
}

export function updateAppComponent(options: any): Rule {
  return chain([
    messageInfoRule(`AppComponent wird aktualisiert...`),
    (tree: Tree, context: SchematicContext) => {
      // Init
      const filePath   = (options.path ? options.path : '') + '/src/app/app.component.ts';

      addImport(tree, filePath, '@ihk-gfi/lux-components', 'LuxAppService');
      addImport(tree, filePath, '@angular/core', 'ElementRef');
      addImport(tree, filePath, '@angular/core', 'Input');

      addConstructorParameter(tree, filePath, `private elementRef: ElementRef`);
      addConstructorParameter(tree, filePath, `private appService: LuxAppService`);
      addConstructorContent(tree, filePath,'this.appService.appEl = elementRef.nativeElement;', false);
      addConstructorContent(tree, filePath,'router.initialNavigation();', true);

      addClassProperty(tree, filePath, '@Input() luxAppHeader: \'normal\' | \'minimal\' | \'none\' = \'normal\';');
      addClassProperty(tree, filePath, '@Input() luxAppFooter: \'normal\' | \'minimal\' | \'none\' = \'normal\';');
      addClassProperty(tree, filePath, '@Input() luxMode: \'stand-alone\' | \'portal\' = \'stand-alone\';');
    },
    messageSuccessRule(`AppComponent wurde aktualisiert.`)
  ]);
}

export function updatePackageJson(options: any): Rule {
  return chain([
    messageInfoRule(`Die Datei "package.json" wird angepasst...`),
    (tree: Tree, _context: SchematicContext) => {
      const filePath = `/package.json`;

      const newValuesArr = [
        { path: ['scripts', 'build-aot'], value: "ng lint --fix", message: `Skript "build-aot" aktualisiert.`},
        { path: ['scripts', 'buildzentral'], value: "ng lint --fix", message: `Skript "buildzentral" aktualisiert.`},
        { path: ['dependencies', '@webcomponents/webcomponentsjs'], value: "2.5.0", message: `Unter "dependencies" "@webcomponents/webcomponentsjs" hinzugefügt.`},
        { path: ['dependencies', 'ngx-build-plus'], value: "^11.0.0", message: `Unter "dependencies" "ngx-build-plus" hinzugefügt.`},
        { path: ['devDependencies', '@angular/elements'], value: "11.2.14", message: `Unter "devDependencies" "@angular/elements" hinzugefügt.`},
        { path: ['devDependencies', 'replace-in-file'], value: "6.2.0", message: `Unter "devDependencies" "replace-in-file" hinzugefügt.`}
      ];

      const packageJsonAsNode = readJson(tree, filePath);
      const buildAotScriptNode = findNodeAtLocation(packageJsonAsNode, ['scripts', 'build-aot']);
      if (buildAotScriptNode) {
        newValuesArr.push({
          path: ['scripts', 'build-aot'],
          value: appendScript(buildAotScriptNode.value, ' --single-bundle --output-hashing none'),
          message: `Das Skript "build-aot" angepasst.`
        });
      } else {
        newValuesArr.push({
          path: ['scripts', 'build-aot'],
          value: 'node --max_old_space_size=4024 ./node_modules/@angular/cli/bin/ng build --aot --single-bundle --output-hashing none && npm run move-de-files',
          message: `Das neue Skript "build-aot" hinzugefügt.`
        });
      }

      const buildZentralScriptNode = findNodeAtLocation(packageJsonAsNode, ['scripts', 'buildzentral']);
      if (buildZentralScriptNode) {
        newValuesArr.push({
          path: ['scripts', 'buildzentral'],
          value: appendScript(buildZentralScriptNode.value,  ' --single-bundle --output-hashing none --plugin @ihk-gfi/lux-components/ie11-lazy-modules-plugin.js'),
          message: `Das Skript "buildzentral" angepasst.`
        });
      } else {
        newValuesArr.push({
          path: ['scripts', 'buildzentral'],
          value: 'node --max_old_space_size=4024 ./node_modules/@angular/cli/bin/ng build --prod --single-bundle --output-hashing none --plugin @ihk-gfi/lux-components/ie11-lazy-modules-plugin.js && npm run move-de-files',
          message: `Das neue Skript "buildzentral" hinzugefügt.`
        });
      }

      newValuesArr.forEach(change => {
        const tsConfigJson = readJsonAsString(tree, filePath);
        const edits: Edit[] = modify(tsConfigJson, change.path, change.value, { formattingOptions: jsonFormattingOptions })

        tree.overwrite(
          filePath,
          applyEdits(tsConfigJson, edits)
        );

        logInfo(change.message);
      });

      return tree;
    },
    messageSuccessRule(`Die Datei "package.json" wurde angepasst.`)
  ]);
}

export function updateAppRoutingModule(options: any): Rule {
  return chain([
    messageInfoRule(`Die Datei "app-routing.module.ts" wird angepasst...`),
    (tree: Tree, context: SchematicContext) => {
      iterateFilesAndModifyContent(
        tree,
        options.path,
        (filePath: string, content: string) => {
          let modifiedContent = content;
          modifiedContent = modifiedContent.replace(/import\('app\//g,  'import(\'./');
          modifiedContent = modifiedContent.replace(/import\("app\//g,  'import("./');

          if (content !== modifiedContent) {
            tree.overwrite(filePath, modifiedContent);
            logInfo(`Lazy-Importe angepasst.`);
          }
        },
        'app-routing.module.ts'
      );
    },
    messageSuccessRule(`Die Datei "app-routing.module.ts" wurde angepasst.`)
  ]);
}

export function updateAngularJson(options: any): Rule {
  return chain([
    messageInfoRule(`Die Datei "angular.json" wird angepasst...`),
    (tree: Tree, _context: SchematicContext) => {
      const filePath = `/angular.json`;

      const newValuesArr = [
        {
          path: ['projects', options.project, 'architect', 'build', 'options', 'extraWebpackConfig'],
          value: 'webpack.config.js',
          message: `Der Abschnitt "extraWebpackConfig" wurde hinzugefügt.`,
          options: { formattingOptions: jsonFormattingOptions }
        },
        {
          path: ['projects', options.project, 'architect', 'build', 'options', 'scripts', 0],
          value: {
            bundleName: 'polyfill-webcomp-es5',
            input: 'node_modules/@webcomponents/webcomponentsjs/custom-elements-es5-adapter.js'
          },
          message: `Skript "polyfill-webcomp-es5" wurde hinzugefügt.`,
          options: { formattingOptions: jsonFormattingOptions, isArrayInsertion: true }
        },
        {
          path: ['projects', options.project, 'architect', 'build', 'options', 'scripts', 0],
          value: {
            "bundleName": "polyfill-webcomp",
            "input": "node_modules/@webcomponents/webcomponentsjs/bundles/webcomponents-sd-ce-pf.js"
          },
          message: `Skript "polyfill-webcomp" wurde hinzugefügt.`,
          options: { formattingOptions: jsonFormattingOptions, isArrayInsertion: true }
        }
      ];

      newValuesArr.forEach(change => {
        const tsConfigJson = readJsonAsString(tree, filePath);
        const edits: Edit[] = modify(tsConfigJson, change.path, change.value, change.options)

        tree.overwrite(
          filePath,
          applyEdits(tsConfigJson, edits)
        );
        
        logInfo(change.message);
      });

      const content = (tree.read(filePath) as Buffer).toString();

      let modifiedContent = content;
      modifiedContent = modifiedContent.replace(new RegExp('@angular-devkit/build-angular:browser', 'g'), 'ngx-build-plus:browser');
      modifiedContent = modifiedContent.replace(new RegExp('@angular-devkit/build-angular:dev-server', 'g'), 'ngx-build-plus:dev-server');
      modifiedContent = modifiedContent.replace(new RegExp('@angular-devkit/build-angular:karma', 'g'), 'ngx-build-plus:karma');

      if (content !== modifiedContent) {
        tree.overwrite(filePath, modifiedContent);
        logInfo(`Einträge für den ngx-build-plus hinzugefügt.`);
      }

      return tree;
    },
    messageSuccessRule(`Die Datei "angular.json" wurde angepasst.`)
  ]);
}

export function updateAppModule(options: any): Rule {
  return chain([
    messageInfoRule(`Die Datei "app.module.ts" wird angepasst...`),
    (tree: Tree, context: SchematicContext) => {
      const filePath = (options.path ? options.path : '') + `/src/app/app.module.ts`;

      addImport(tree, filePath, '@angular/core', 'CUSTOM_ELEMENTS_SCHEMA');
      addImport(tree, filePath, '@angular/core', 'DoBootstrap');
      addImport(tree, filePath, '@angular/core', 'Injector');
      addImport(tree, filePath, '@angular/elements', 'createCustomElement');

      addInterface(tree, filePath, 'DoBootstrap');

      const service = `private injector: Injector`;
      addConstructorParameter(tree, filePath, service);

      addMethod(tree, filePath, getSyntaxListOfClass(tree, filePath), `
  ngDoBootstrap() {
    const ce = createCustomElement(AppComponent, { injector: this.injector });
    customElements.define('${getWebComponentTagName(options.project as string)}', ce);
  }`);
      logInfo(`ngDoBootstrap() {...} hinzugefügt.`);

      const content = (tree.read(filePath) as Buffer).toString();
      const fileName = filePath.substring(filePath.lastIndexOf('/') + 1, filePath.length);
      const sourceFile = ts.createSourceFile(`${fileName}`, content, ts.ScriptTarget.Latest, true);
      const nodes = getSourceNodes(sourceFile);

      const bootstrap = nodes.find((n) => n.kind === ts.SyntaxKind.Identifier && n.getText() === 'bootstrap');

      if (bootstrap) {
        const updateRecorder = tree.beginUpdate(filePath);
        updateRecorder.remove(bootstrap.parent.pos, bootstrap.parent.end - bootstrap.parent.pos);
        updateRecorder.insertLeft(bootstrap.parent.pos, `\n  schemas: [CUSTOM_ELEMENTS_SCHEMA]`);
        tree.commitUpdate(updateRecorder);
        logInfo(`bootstrap: [...] entfernt.`);
        logInfo(`schemas: [CUSTOM_ELEMENTS_SCHEMA] hinzugefügt.`);
      }

    },
    messageSuccessRule(`Die Datei "app.module.ts" wurde angepasst.`)
  ]);
}

export function updateIndexHtml(options: any): Rule {
  return chain([
    messageInfoRule(`Die Datei "index.html" wird angepasst...`),
    (tree: Tree, context: SchematicContext) => {

      let tagName = getWebComponentTagName(options.project as string);

      const filePath = 'src/index.html';
      const content = (tree.read(filePath) as Buffer).toString();
      const modifiedContent = content.replace(/app-root/g, tagName);

      tree.overwrite(filePath, modifiedContent);
      logInfo(`Das Tag "app-root" wurde umbenannt in "${tagName}".`);
    },
    messageSuccessRule(`Die Datei "index.html" wurde angepasst.`)
  ]);
}

export function createWebpackConfigJs(options: any): Rule {
  return chain([
    messageInfoRule(`Die Datei "webpack.config.js" wird angelegt...`),
    (tree: Tree, context: SchematicContext) => {

      let functionName = options.project as string;
      functionName = functionName.replace('-', '');
      functionName = functionName.replace('_', '');
      functionName = functionName.substring(0, 1).toUpperCase() + functionName.substring(1);

      tree.create('webpack.config.js', `
module.exports = {
  output: {
    jsonpFunction: 'jsonpFunction${functionName}'
  }
};

      `);
    },
    messageSuccessRule(`Die Datei "webpack.config.js" wurde angelegt.`)
  ]);
}

export function updateAppComponentHtml(options: any): Rule {
  return chain([
    messageInfoRule(`Die Datei "app.component.html" wird angepasst...`),
    (tree: Tree, context: SchematicContext) => {
      iterateFilesAndModifyContent(
        tree,
        options.path,
        (filePath: string, content: string) => {
          let result = addAttribute(content, 'lux-app-header', "*ngIf", 'this.luxAppHeader !== \'none\'');
          result = appendAttribute(result.content, 'lux-app-header-right-nav', "*ngIf", ' && luxMode === \'stand-alone\'');
          result = addAttribute(result.content, 'lux-app-footer', "*ngIf", 'this.luxAppFooter !== \'none\'');

          tree.overwrite(filePath, result.content);

          logInfo('Im "lux-app-header" das folgende Attribut *ngIf="this.luxAppHeader !== \'none\'" ergänzt.');
          logInfo('Im "lux-app-header-right-nav" den Wert " && luxMode === \'stand-alone\'" an das Attribut "*ngIf" angehangen.');
          logInfo('Im "lux-app-footer" das folgende Attribut *ngIf="this.luxAppFooter !== \'none\'" ergänzt.');
        },
        'app.component.html'
      );
    },
    messageSuccessRule(`Die Datei "app.component.html" wurde angepasst.`)
  ]);
}

function getWebComponentTagName(projectName: string) {
  let tagName = projectName;
  tagName     = tagName.replace(/[^a-z]/gi, '');
  tagName     = tagName.toLowerCase();
  if (tagName.startsWith('lux')) {
    tagName = tagName.replace(/lux/i, 'lux-');
  } else {
    tagName = 'lux-' + tagName;
  }
  return tagName;
}
