import { SchematicTestRunner, UnitTestTree } from '@angular-devkit/schematics/testing';
import * as path from 'path';
import { of as observableOf } from 'rxjs';
import { addDependencyToPackageJson, appOptions, workspaceOptions } from '../../utility/test-helper';
import { callRule, SchematicContext, SchematicsException, Tree } from '@angular-devkit/schematics';
import {activateIvy, checkVersions, deactivateDirectiveClassSuffix, updateAnglarHttpImports} from './index';
import { UtilConfig } from '../../utility/util';

const collectionPath = path.join(__dirname, '../../collection.json');

describe('lux-version-1.9.0', () => {
    let appTree: UnitTestTree;
    let runner: SchematicTestRunner;
    let context: SchematicContext;

    beforeEach(() => {
        runner = new SchematicTestRunner('schematics', collectionPath);

        appTree = runner.runExternalSchematic(
            '@schematics/angular', 'workspace', workspaceOptions);
        appTree = runner.runExternalSchematic(
            '@schematics/angular', 'application', appOptions, appTree);

        UtilConfig.defaultWaitMS = 0;

        const collection = runner.engine.createCollection(collectionPath);
        const schematic = runner.engine.createSchematic('lux-version-1.9.0', collection);
        context = runner.engine.createContext(schematic);
    });

    describe('[Rule] setupProject', () => {
        it('Sollte Fehler werfen, wenn ein empty Tree genutzt wird', () => {
            expect(() => runner.runSchematic('lux-version-1.9.0', {}, Tree.empty()))
                .toThrowError(SchematicsException);
        });

        it('Sollte Fehler werfen, wenn keine Option "project" gesetzt ist', () => {
            try {
                runner.runSchematic('lux-version-1.9.0', {}, appTree);
            } catch (ex) {
                expect(ex.toString()).toContain('Option "project" wird benötigt.');
            }
        });
    });

    describe('[Rule] checkVersions', () => {

        it('Sollte einen Fehler werfen, wenn Version < n - 1', () => {
            addDependencyToPackageJson(appTree, '@ihk-gfi/lux-components', '1.7.8');

            callRule(checkVersions(), observableOf(appTree), context).subscribe(
                (success) => expect(success).toBeUndefined(),
                (reason) => expect(reason.toString()).toContain('Dieser Generator benötigt allerdings die (neuere) Version 1.8.7.'));
        });

        it('Sollte einen Fehler werfen, wenn Version > n - 1', () => {
            addDependencyToPackageJson(appTree, '@ihk-gfi/lux-components', '1.8.8');

            callRule(checkVersions(), observableOf(appTree), context).subscribe(
                (success) => expect(success).toBeUndefined(),
                (reason) => expect(reason.toString()).toContain('Dieser Generator benötigt allerdings die (ältere) Version 1.8.7.'));
        });

        it('Sollte keinen Fehler werfen, wenn Version === n - 1', () => {
            addDependencyToPackageJson(appTree, '@ihk-gfi/lux-components', '1.8.7');
            Object.defineProperty(process.versions, 'node', {
                get: () => '10.16.3'
            });

            callRule(checkVersions(), observableOf(appTree), context).subscribe(
                (success) => expect(success).toBeDefined(),
                (reason) => expect(reason).toBeUndefined());
        });

        it('Sollte einen Fehler werfen, wenn Node-Version < 10.16.3', () => {
            addDependencyToPackageJson(appTree, '@ihk-gfi/lux-components', '1.8.7');
            Object.defineProperty(process.versions, 'node', {
                get: () => '7.9.9'
            });

            callRule(checkVersions(), observableOf(appTree), context).subscribe(
                (success) => expect(success).toBeUndefined(),
                (reason) => expect(reason.toString()).toContain('LUX benötigt allerdings die Version 10.16.3.'));
        });

        it('Sollte keinen Fehler werfen, wenn Node-Version >= 10.0.0', () => {
            addDependencyToPackageJson(appTree, '@ihk-gfi/lux-components', '1.8.7');
            Object.defineProperty(process.versions, 'node', {
                get: () => '10.16.3'
            });
            callRule(checkVersions(), observableOf(appTree), context).subscribe(
                (success) => expect(success).toBeDefined(),
                (reason) => expect(reason).toBeUndefined());
        });
    });

    describe('[Rule] updateAnglarHttpImports', () => {

        it('Sollte den Import auf "@angular/common/http" geändert haben', (async (done) => {
            const tsFile = "import { HttpClient } from '@angular/http';";

            appTree.create('/aaa/test.ts', tsFile);

            callRule(updateAnglarHttpImports({path: '/aaa/'}), observableOf(appTree), context).subscribe(
                () => {
                    expect(appTree.readContent('/aaa/test.ts')).toContain("'@angular/common/http'");
                    done();
                },
                (reason) => expect(reason).toBeUndefined());
        }));

        it("Sollte den Import auf '@angular/common/http' geändert haben", (async (done) => {
            const tsFile = 'import { HttpClient } from "@angular/http";';

            appTree.create('/aaa/test.ts', tsFile);

            callRule(updateAnglarHttpImports({path: '/aaa/'}), observableOf(appTree), context).subscribe(
                () => {
                    expect(appTree.readContent('/aaa/test.ts')).toContain("'@angular/common/http'");
                    done();
                },
                (reason) => expect(reason).toBeUndefined());
        }));

        it('Sollte den Import nicht "@angular//http/abc" geändert haben', (async (done) => {
            const tsFile = "import { HttpClient } from '@angular/http/abc';";

            appTree.create('/aaa/test.ts', tsFile);

            callRule(updateAnglarHttpImports({path: '/aaa/'}), observableOf(appTree), context).subscribe(
                () => {
                    expect(appTree.readContent('/aaa/test.ts')).toContain("from '@angular/http/abc';");
                    done();
                },
                (reason) => expect(reason).toBeUndefined());
        }));
    });

    describe('[Rule] activateIvy', () => {

        it('Sollte Ivy von false auf true setzen', (async (done) => {
            const tsconfig = '{\n' +
                '  "compileOnSave": false,\n' +
                '  "compilerOptions": {\n' +
                '    "downlevelIteration": true,\n' +
                '    "outDir": "./dist/out-tsc",\n' +
                '    "sourceMap": true,\n' +
                '    "declaration": false,\n' +
                '    "moduleResolution": "node",\n' +
                '    "emitDecoratorMetadata": true,\n' +
                '    "experimentalDecorators": true,\n' +
                '    "target": "es2015",\n' +
                '    "typeRoots": [\n' +
                '      "node_modules/@types"\n' +
                '    ],\n' +
                '    "lib": [\n' +
                '      "es2017",\n' +
                '      "dom"\n' +
                '    ],\n' +
                '    "module": "esnext",\n' +
                '    "baseUrl": "./"\n' +
                '  },\n' +
                '  "angularCompilerOptions": {\n' +
                '    "fullTemplateTypeCheck": true,\n' +
                '    "preserveWhiteSpace": false,\n' +
                '    "strictInjectionParameters": true,\n' +
                '    "enableIvy": false\n' +
                '  }\n' +
                '}';

            appTree.overwrite('/tsconfig.json', tsconfig);

            callRule(activateIvy(), observableOf(appTree), context).subscribe(
                () => {
                    expect(appTree.readContent('/tsconfig.json'))
                        .toContain('"enableIvy": true');
                    done();
                },
                (reason) => expect(reason).toBeUndefined());
        }));

        it('Sollte einen neuen Eintrag "enableIvy": true einfügen', (async (done) => {
            const tsconfig = '{\n' +
                '  "compileOnSave": false,\n' +
                '  "compilerOptions": {\n' +
                '    "downlevelIteration": true,\n' +
                '    "outDir": "./dist/out-tsc",\n' +
                '    "sourceMap": true,\n' +
                '    "declaration": false,\n' +
                '    "moduleResolution": "node",\n' +
                '    "emitDecoratorMetadata": true,\n' +
                '    "experimentalDecorators": true,\n' +
                '    "target": "es2015",\n' +
                '    "typeRoots": [\n' +
                '      "node_modules/@types"\n' +
                '    ],\n' +
                '    "lib": [\n' +
                '      "es2017",\n' +
                '      "dom"\n' +
                '    ],\n' +
                '    "module": "esnext",\n' +
                '    "baseUrl": "./"\n' +
                '  },\n' +
                '  "angularCompilerOptions": {\n' +
                '    "fullTemplateTypeCheck": true,\n' +
                '    "preserveWhiteSpace": false,\n' +
                '    "strictInjectionParameters": true\n' +
                '  }\n' +
                '}';

            appTree.overwrite('/tsconfig.json', tsconfig);

            callRule(activateIvy(), observableOf(appTree), context).subscribe(
                () => {
                    expect(appTree.readContent('/tsconfig.json'))
                        .toContain('"enableIvy": true');
                    done();
                },
                (reason) => expect(reason).toBeUndefined());
        }));
    });

    describe('[Rule] deactivateDirectiveClassSuffix', () => {

        it('Sollte "directive-class-suffix" von false auf true setzen', (async (done) => {
            const tslint = '{\n' +
                '  "rulesDirectory": [\n' +
                '    "node_modules/codelyzer"\n' +
                '  ],\n' +
                '  "rules": {\n' +
                '    "template-banana-in-box": true,\n' +
                '    "component-selector": [\n' +
                '      true,\n' +
                '      "element",\n' +
                '      "",\n' +
                '      "kebab-case"\n' +
                '    ],\n' +
                '    "no-pipe-impure": false,\n' +
                '    "directive-class-suffix": false,\n' +
                '    "template-i18n": false,\n' +
                '    "semicolon": [true, "ignore-bound-class-methods"]\n' +
                '  }\n' +
                '}\n';

            appTree.overwrite('/tslint.json', tslint);

            callRule(deactivateDirectiveClassSuffix(), observableOf(appTree), context).subscribe(
                () => {
                    expect(appTree.readContent('/tslint.json'))
                        .toContain('"directive-class-suffix": false');
                    done();
                },
                (reason) => expect(reason).toBeUndefined());
        }));

        it('Sollte einen neuen Eintrag "directive-class-suffix": true einfügen', (async (done) => {
            const tslint = '{\n' +
                '  "rulesDirectory": [\n' +
                '    "node_modules/codelyzer"\n' +
                '  ],\n' +
                '  "rules": {\n' +
                '    "template-banana-in-box": true,\n' +
                '    "component-selector": [\n' +
                '      true,\n' +
                '      "element",\n' +
                '      "",\n' +
                '      "kebab-case"\n' +
                '    ],\n' +
                '    "no-pipe-impure": false,\n' +
                '    "template-i18n": false,\n' +
                '    "semicolon": [true, "ignore-bound-class-methods"]\n' +
                '  }\n' +
                '}\n';

            appTree.overwrite('/tslint.json', tslint);

            callRule(deactivateDirectiveClassSuffix(), observableOf(appTree), context).subscribe(
                () => {
                    expect(appTree.readContent('/tslint.json'))
                        .toContain('"directive-class-suffix": false');
                    done();
                },
                (reason) => expect(reason).toBeUndefined());
        }));
    });

});
