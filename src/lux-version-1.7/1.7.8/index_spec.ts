import { callRule, Rule, SchematicContext, SchematicsException, Tree } from '@angular-devkit/schematics';
import { SchematicTestRunner, UnitTestTree } from '@angular-devkit/schematics/testing';
import * as path from 'path';
import { iterateFilesAndModifyContent } from '../../utility/files';
import { addAttribute, removeAttribute } from '../../utility/html';
import { logInfoWithDescriptor } from '../../utility/logging';
import { UtilConfig } from '../../utility/util';
import {
    checkVersions,
    updateHammerConfig,
    updateInterfaceNames, updateLuxAppMenuLeft,
    updateLuxList,
    updateLuxMenu,
    updateLuxStylesScss,
    updateLuxTab
} from './index';
import { of as observableOf } from 'rxjs';
import { addDependencyToPackageJson, appOptions, createMockContext, workspaceOptions } from '../../utility/test-helper';

const collectionPath = path.join(__dirname, '../../collection.json');

describe('lux-version-1.7.8', () => {
    let appTree: UnitTestTree;
    let runner: SchematicTestRunner;

    beforeEach(() => {
        runner = new SchematicTestRunner('schematics', collectionPath);

        appTree = runner.runExternalSchematic(
            '@schematics/angular', 'workspace', workspaceOptions);
        appTree = runner.runExternalSchematic(
            '@schematics/angular', 'application', appOptions, appTree);
        UtilConfig.defaultWaitMS = 0;
    });

    describe('[Rule] updateLuxAppMenuLeft', () => {
        let context: SchematicContext;

        beforeEach(() => {
            const collection = runner.engine.createCollection(collectionPath);
            const schematic = runner.engine.createSchematic('lux-version-1.7.8', collection);
            context = runner.engine.createContext(schematic);

            addDependencyToPackageJson(appTree, 'lux-components', '1.7.7');

            appTree.overwrite('/projects/bar/src/app/app.component.html',
                '<lux-app-header>\n' +
                '  <lux-app-header-left-nav>\n' +
                '    <lux-menu-item luxLabel="Home" luxIconName="fa-home" (luxClicked)="goToHome()" [luxIgnoreStorageWeight]="true" luxTagId="home-menu-item"></lux-menu-item>\n' +
                '    <lux-menu-item luxLabel="Komponenten" luxIconName="fa-gears" (luxClicked)="goToComponents()" [luxIgnoreStorageWeight]="true" luxTagId="cmp-menu-item"></lux-menu-item>\n' +
                '    <lux-menu-item luxLabel="Master-Detail" luxIconName="fa-th-list" (luxClicked)="goToMasterDetail()" [luxIgnoreStorageWeight]="false" luxTagId="md-menu-item"></lux-menu-item>\n' +
                '    <lux-menu-item luxLabel="Stepper" luxIconName="fa-chevron-circle-right" (luxClicked)="goToStepper()" [luxIgnoreStorageWeight]="false" luxTagId="stepper-menu-item"></lux-menu-item>\n' +
                '  </lux-app-header-left-nav> \n' +
                '</lux-app-header>');
        });

        it('Das alte Appheadermenü sollte durch das neue Appheadermenü ersetzt sein.', () => {
            // Vorbedingungen prüfen
            expect(appTree.readContent('/projects/bar/src/app/app.component.html')).toContain('lux-app-header-left-nav');
            // Änderungen durchführen
            callRule(updateLuxAppMenuLeft({ path: '/projects/bar/src' }), observableOf(appTree), context).toPromise()
                .then(() => {
                    // Nachbedingungen prüfen
                    const content = appTree.readContent('/projects/bar/src/app/app.component.html');

                    expect(content).not.toContain('<lux-app-header-left-nav');
                    expect(content).not.toContain('<lux-menu-item');

                    expect(content).toContain('<lux-side-nav>');
                    expect(content).toContain('<lux-side-nav-item luxLabel="Home" luxIconName="fa-home" (luxClicked)="goToHome()" luxTagId="home-menu-item" ></lux-side-nav-item>');
                    expect(content).toContain('<lux-side-nav-item luxLabel="Komponenten" luxIconName="fa-gears" (luxClicked)="goToComponents()" luxTagId="cmp-menu-item" ></lux-side-nav-item>');
                    expect(content).toContain('<lux-side-nav-item luxLabel="Master-Detail" luxIconName="fa-th-list" (luxClicked)="goToMasterDetail()" luxTagId="md-menu-item" ></lux-side-nav-item>');
                    expect(content).toContain('<lux-side-nav-item luxLabel="Stepper" luxIconName="fa-chevron-circle-right" (luxClicked)="goToStepper()" luxTagId="stepper-menu-item" ></lux-side-nav-item>');
                    expect(content).toContain('</lux-side-nav>');
                }, (reason) => {
                    expect(reason).toBeUndefined();
                });
        });
    });

    describe('[Rule] updateLuxList', () => {
        let context: SchematicContext;

        beforeEach(() => {
            const collection = runner.engine.createCollection(collectionPath);
            const schematic = runner.engine.createSchematic('lux-version-1.7.8', collection);
            context = runner.engine.createContext(schematic);

            addDependencyToPackageJson(appTree, 'lux-components', '1.7.7');

            appTree.overwrite('/projects/bar/src/app/app.component.html',
                '<lux-list [luxItems]="listItems" luxEmptyIconName="fa-times"\n' +
                '          luxEmptyLabel="Keine Informationen gefunden." luxEmptyIconSize="2x">\n' +
                '  <ng-container *ngFor="let listItem of listItems">\n' +
                '    <lux-list-item [luxTitle]="listItem.title" [luxSubTitle]="listItem.subtitle">\n' +
                '      <lux-list-item-icon>\n' +
                '        <lux-icon luxIconName="fa-ge"></lux-icon>\n' +
                '      </lux-list-item-icon>\n' +
                '      <lux-list-item-content>\n' +
                '        Value: {{ listItem.value }}\n' +
                '      </lux-list-item-content>\n' +
                '    </lux-list-item>\n' +
                '  </ng-container>\n' +
                '</lux-list>\n' +
                '<lux-list luxEmptyIconName="fa-times"\n' +
                '          luxEmptyLabel="Keine Informationen gefunden." luxEmptyIconSize="2x" [(luxItems)]="listItems">\n' +
                '  <ng-container *ngFor="let listItem of listItems">\n' +
                '    <lux-list-item [luxTitle]="listItem.title" [luxSubTitle]="listItem.subtitle">\n' +
                '      <lux-list-item-icon>\n' +
                '        <lux-icon luxIconName="fa-ge"></lux-icon>\n' +
                '      </lux-list-item-icon>\n' +
                '      <lux-list-item-content>\n' +
                '        Value: {{ listItem.value }}\n' +
                '      </lux-list-item-content>\n' +
                '    </lux-list-item>\n' +
                '  </ng-container>\n' +
                '</lux-list>\n' +
                '<lux-list luxItems="listItems">\n' +
                '  <ng-container *ngFor="let listItem of listItems">\n' +
                '    <lux-list-item [luxTitle]="listItem.title" [luxSubTitle]="listItem.subtitle">\n' +
                '      <lux-list-item-icon>\n' +
                '        <lux-icon luxIconName="fa-ge"></lux-icon>\n' +
                '      </lux-list-item-icon>\n' +
                '      <lux-list-item-content>\n' +
                '        Value: {{ listItem.value }}\n' +
                '      </lux-list-item-content>\n' +
                '    </lux-list-item>\n' +
                '  </ng-container>\n' +
                '</lux-list>\n');
        });

        it('Das Attribut "luxItems" sollte gelöscht sein', () => {
            // Vorbedingungen prüfen
            expect(appTree.readContent('/projects/bar/src/app/app.component.html')).toContain('luxItems');
            // Änderungen durchführen
            callRule(updateLuxList({ path: '/projects/bar/src' }), observableOf(appTree), context).toPromise()
                .then(() => {
                    // Nachbedingungen prüfen
                    expect(appTree.readContent('/projects/bar/src/app/app.component.html')).not.toContain('luxItems');
                }, (reason) => {
                    expect(reason).toBeUndefined();
                });
        });
    });

    describe('[Rule] updateInterfaceNames', () => {
        let context: SchematicContext;

        beforeEach(() => {
            const collection = runner.engine.createCollection(collectionPath);
            const schematic = runner.engine.createSchematic('lux-version-1.7.8', collection);
            context = runner.engine.createContext(schematic);

            addDependencyToPackageJson(appTree, 'lux-components', '1.7.7');

            appTree.overwrite('/projects/bar/src/app/app.component.ts',
                'import { LuxMessage } from \'../../lux-layout/lux-message-box/lux-message-box-model/lux-message\';\n' +
                'import { LuxMessageBoxComponent } from \'./lux-message-box/lux-message-box.component\';\n' +
                'import { LuxMessageChangeEvent, LuxMessageCloseEvent } from \'./lux-message-box-model/lux-message-events\';\n' +
                'import { LuxMessageChangeEvent } from \'./lux-message-box-model/lux-message-events\';\n' +
                '\n' +
                'private _luxMessage: LuxMessage;\n' +
                'const errorMessages: LuxMessage[] = [];\n' +
                'let messageBoxComponent: LuxMessageBoxComponent;\n' +
                '\n' +
                'LuxMessageBoxComponent,\n' +
                '\n' +
                '@Output() luxMessageBoxClosed: EventEmitter<LuxMessage> = new EventEmitter<LuxMessage>();\n' +
                ' @Output() luxMessageClosed: EventEmitter<LuxMessageCloseEvent> = new EventEmitter<LuxMessageCloseEvent>();\n' +
                '\n' +
                '  @Input() set luxMessage (message: LuxMessage) {\n' +
                '    this._luxMessage = message;\n' +
                '    if (this.luxMessage) {\n' +
                '      this.updateColor();\n' +
                '    }\n' +
                '  }\n' +
                '  \n' +
                '  get luxMessage(): LuxMessage {\n' +
                '    return this._luxMessage;\n' +
                '  }\n' +
                '  \n' +
                '  close() {\n' +
                '    this.luxMessageBoxClosed.emit(this.luxMessage);\n' +
                '  }\n' +
                '  \n' +
                '  export {\n' +
                '  LuxMessageChangeEvent, LuxMessageCloseEvent\n' +
                '} from \'./src/app/modules/lux-layout/lux-message-box/lux-message-box-model/lux-message-events\';\n' +
                '\n' +
                '/**\n' +
                ' * Animation für das Aus- und Einklappen der LuxMessageBox.\n' +
                ' */\n' +
                ' \n' +
                ' export interface LuxMessage {\n' +
                '   text: string;\n' +
                '   iconName?: string;\n' +
                '   color?: LuxBackgroundColorsEnum;\n' +
                '  }\n' +
                '\n' +
                '  const eventPayload: LuxMessageCloseEvent = {\n' +
                '    index: this.luxMessages.findIndex((compareMessage: LuxMessage) => compareMessage === $event),\n' +
                '    message: $event\n' +
                '  };\n' +
                '\t\n' +
                '  logClosed($event: LuxMessageCloseEvent) {\n' +
                '  \n' +
                '  $event.forEach((eventValue: LuxMessageCloseEvent) => {\n' +
                '  const messageChangePayload: LuxMessageChangeEvent = {');
        });

        it('Die I-Präfixe für die Klassen LuxMessage, LuxMessageCloseEvent und LuxMessageChangeEvent sollten gesetzt sein.', () => {
            // Änderungen durchführen
            callRule(updateInterfaceNames({ path: '/projects/bar/src' }), observableOf(appTree), context).toPromise()
                .then(() => {
                    // Nachbedingungen prüfen
                    const modifiedContent = appTree.readContent('/projects/bar/src/app/app.component.ts');

                    const iLuxMessages = modifiedContent.match(/(ILuxMessage)(\W)/g);
                    expect(iLuxMessages).not.toBeNull();
                    if (iLuxMessages) {
                        expect(iLuxMessages.length).toBe(9);
                    }

                    const iLuxMessageCloseEvent = modifiedContent.match(/(ILuxMessageCloseEvent)(\W)/g);
                    expect(iLuxMessageCloseEvent).not.toBeNull();
                    if (iLuxMessageCloseEvent) {
                        expect(iLuxMessageCloseEvent.length).toBe(7);
                    }

                    const iLuxMessageChangeEvent = modifiedContent.match(/(ILuxMessageChangeEvent)(\W)/g);
                    expect(iLuxMessageChangeEvent).not.toBeNull();
                    if (iLuxMessageChangeEvent) {
                        expect(iLuxMessageChangeEvent.length).toBe(4);
                    }

                }, (reason) => {
                    expect(reason).toBeUndefined();
                });
        });
    });

    describe('[Rule] updateHammerConfig', () => {
        let context: SchematicContext;

        beforeEach(() => {
            const collection = runner.engine.createCollection(collectionPath);
            const schematic = runner.engine.createSchematic('lux-version-1.7.8', collection);
            context = runner.engine.createContext(schematic);

            addDependencyToPackageJson(appTree, 'lux-components', '1.7.7');

            appTree.overwrite('/projects/bar/src/app/app.component.ts',
                'import { LuxHammerConfig } from \'./lux-layout-model/lux-hammer-config\';\n' +
                '\n' +
                'providers: [\n' +
                '    LuxMediaQueryObserverService,\n' +
                '    {\n' +
                '      provide: HAMMER_GESTURE_CONFIG,\n' +
                '      useClass: LuxHammerConfig\n' +
                '    }\n' +
                '  ],');
        });

        it('LuxHammerConfig sollte in LuxComponentsHammerConfig umbenannt sein.', () => {
            // Änderungen durchführen
            callRule(updateHammerConfig({ path: '/projects/bar/src' }), observableOf(appTree), context).toPromise()
                .then(() => {
                    // Nachbedingungen prüfen
                    const modifiedContent = appTree.readContent('/projects/bar/src/app/app.component.ts');

                    const iLuxMessages = modifiedContent.match(/(LuxComponentsHammerConfig)(\W)/g);
                    expect(iLuxMessages).not.toBeNull();
                    if (iLuxMessages) {
                        expect(iLuxMessages.length).toBe(2);
                    }

                }, (reason) => {
                    expect(reason).toBeUndefined();
                });
        });
    });

    describe('[Rule] updateLuxTab', () => {
        let context: SchematicContext;

        beforeEach(() => {
            const collection = runner.engine.createCollection(collectionPath);
            const schematic = runner.engine.createSchematic('lux-version-1.7.8', collection);
            context = runner.engine.createContext(schematic);

            addDependencyToPackageJson(appTree, 'lux-components', '1.7.7');

            appTree.overwrite('/projects/bar/src/app/app.component.html',
                '<lux-tab luxText="Hallo Welt 1">\n' +
                '    <ng-template>\n' +
                '      <h2>Hallo Welt</h2>\n' +
                '    </ng-template>\n' +
                '  </lux-tab>\n' +
                '  <lux-tab [luxText]="Hallo Welt 2">\n' +
                '    <ng-template>\n' +
                '      <h2>Hello World</h2>\n' +
                '    </ng-template>\n' +
                '  <lux-tab [(luxText)]="Hallo Welt 3">\n' +
                '    <ng-template>\n' +
                '      <h2>Hello World</h2>\n' +
                '    </ng-template>\n' +
                '  </lux-tab>\n' +
                '  <lux-tab>\n' +
                '    <ng-template>\n' +
                '      <h2>Hello World</h2>\n' +
                '    </ng-template>\n' +
                '  </lux-tab>\n' +
                '  <lux-tab (luxText)="Hallo Welt 4">\n' +
                '    <ng-template>\n' +
                '      <h2>Cia Mondo</h2>\n' +
                '    </ng-template>\n' +
                '  </lux-tab>');
        });

        it('Das Attribut "luxText" sollte in "luxTitle" umbenannt sein', () => {
            // Vorbedingungen prüfen
            expect(appTree.readContent('/projects/bar/src/app/app.component.html')).not.toContain('luxTitle');
            expect(appTree.readContent('/projects/bar/src/app/app.component.html')).toContain('luxText');

            // Änderungen durchführen
            callRule(updateLuxTab({ path: '/projects/bar/src' }), observableOf(appTree), context).toPromise()
                .then(() => {
                    // Nachbedingungen prüfen
                    expect(appTree.readContent('/projects/bar/src/app/app.component.html')).toContain('luxTitle="Hallo Welt 1"');
                    expect(appTree.readContent('/projects/bar/src/app/app.component.html')).toContain('[luxTitle]="Hallo Welt 2"');
                    expect(appTree.readContent('/projects/bar/src/app/app.component.html')).toContain('[(luxTitle)]="Hallo Welt 3"');
                    expect(appTree.readContent('/projects/bar/src/app/app.component.html')).toContain('(luxTitle)="Hallo Welt 4"');
                    expect(appTree.readContent('/projects/bar/src/app/app.component.html')).not.toContain('luxText');
                }, (reason) => {
                    expect(reason).toBeUndefined();
                });
        });
    });

    describe('[Rule] updateLuxMenu', () => {
        let context: SchematicContext;

        beforeEach(() => {
            const collection = runner.engine.createCollection(collectionPath);
            const schematic = runner.engine.createSchematic('lux-version-1.7.8', collection);
            context = runner.engine.createContext(schematic);

            addDependencyToPackageJson(appTree, 'lux-components', '1.7.7');

            appTree.overwrite('/projects/bar/src/app/app.component.html',
                ' <lux-menu [luxDisplayMenuLeft]="true" [luxDisplayExtended]="true" luxIconName="fa-ellipsis-h"\n' +
                '              luxTagId="app_footer_menu" fxLayoutAlign="end center" #menu>\n' +
                '      <lux-menu-item luxIconName="menuItem.iconName"></lux-menu-item>\n' +
                '    </lux-menu>\n' +
                '\t<lux-menu [luxDisplayMenuLeft]="true" [luxDisplayExtended]="true" [luxIconName]="fa-user"\n' +
                '              luxTagId="app_footer_menu" fxLayoutAlign="end center" #menu>\n' +
                '      <lux-menu-item [luxIconName]="menuItem.iconName"></lux-menu-item>\n' +
                '      </lux-menu-item>\n' +
                '    </lux-menu>\n' +
                '\t<lux-menu [luxDisplayMenuLeft]="true" [luxDisplayExtended]="true" [(luxIconName)]="fa-check"\n' +
                '              luxTagId="app_footer_menu" fxLayoutAlign="end center" #menu>\n' +
                '      <lux-menu-item [(luxIconName)]="menuItem.iconName"></lux-menu-item>\n' +
                '      </lux-menu-item>\n' +
                '    </lux-menu>');
        });

        it('Das Attribut "luxIconName" sollte in "luxMenuIconName" umbenannt sein', () => {
            // Vorbedingungen prüfen
            expect(appTree.readContent('/projects/bar/src/app/app.component.html')).not.toContain('luxMenuIconName');
            expect(appTree.readContent('/projects/bar/src/app/app.component.html')).toContain('luxIconName');

            // Änderungen durchführen
            callRule(updateLuxMenu({ path: '/projects/bar/src' }), observableOf(appTree), context).toPromise()
                .then(() => {
                    // Nachbedingungen prüfen
                    expect(appTree.readContent('/projects/bar/src/app/app.component.html')).toContain('luxMenuIconName="fa-ellipsis-h"');
                    expect(appTree.readContent('/projects/bar/src/app/app.component.html')).toContain('[luxMenuIconName]="fa-user"');
                    expect(appTree.readContent('/projects/bar/src/app/app.component.html')).toContain('[(luxMenuIconName)]="fa-check"');
                    expect(appTree.readContent('/projects/bar/src/app/app.component.html')).toContain('luxIconName="menuItem.iconName"');
                    expect(appTree.readContent('/projects/bar/src/app/app.component.html')).toContain('[luxIconName]="menuItem.iconName"');
                    expect(appTree.readContent('/projects/bar/src/app/app.component.html')).toContain('[(luxIconName)]="menuItem.iconName"');
                }, (reason) => {
                    expect(reason).toBeUndefined();
                });
        });
    });

    describe('[Rule] updateLuxStylesScss', () => {

        let context: SchematicContext;

        beforeEach(() => {
            const collection = runner.engine.createCollection(collectionPath);
            const schematic = runner.engine.createSchematic('lux-version-1.7.8', collection);
            context = runner.engine.createContext(schematic);

            addDependencyToPackageJson(appTree, 'lux-components', '1.7.7');
        });

        it('Die Datei "luxstyles" sollte ersetzt sein.', () => {
            appTree.create('/projects/bar/src/theming/luxstyles.scss', 'Leer');

            expect(appTree.readContent('/projects/bar/src/theming/luxstyles.scss')).toContain('Leer');

            // Änderungen durchführen
            callRule(updateLuxStylesScss({ path: '/projects/bar/' }), observableOf(appTree), context).toPromise()
                .then(() => {
                    // Nachbedingungen prüfen
                    expect(appTree.readContent('/projects/bar/src/theming/luxstyles.scss')).toContain('Version 1.7');
                }, (reason) => {
                    expect(reason).toBeUndefined();
                });
        });
    });

    describe('[Rule] setupProject', () => {
        it('Sollte Fehler werfen, wenn ein empty Tree genutzt wird', () => {
            expect(() => runner.runSchematic('lux-version-1.7.8', {}, Tree.empty()))
                .toThrowError(SchematicsException);
        });

        it('Sollte Fehler werfen, wenn keine Option "project" gesetzt ist', () => {
            try {
                runner.runSchematic('lux-version-1.7.8', {}, appTree);
            } catch (ex) {
                expect(ex.toString()).toContain('Option "project" wird benötigt.');
            }
        });
    });

    describe('[Rule] checkVersions', () => {

        let context: SchematicContext;

        beforeEach(() => {
            context = createMockContext();
        });

        it('Sollte einen Fehler werfen, wenn Version !== n - 1', () => {
            addDependencyToPackageJson(appTree, 'lux-components', '1.7.6');

            callRule(checkVersions(), observableOf(appTree), context).toPromise()
                .then((success) => {
                    expect(success).toBeUndefined();
                }, (reason) => {
                    expect(reason.toString()).toContain('Dieser Generator benötigt allerdings die (neuere) Version 1.7.7.');
                });
        });

        it('Sollte keinen Fehler werfen, wenn Version === n - 1', () => {
            addDependencyToPackageJson(appTree, 'lux-components', '1.7.7');
            callRule(checkVersions(), observableOf(appTree), context).toPromise()
                .then((success) => {
                    expect(success).toBeDefined();
                }, (reason) => {
                    expect(reason).toBeUndefined();
                });
        });

        it('Sollte einen Fehler werfen, wenn Node-Version < 8.0.0', () => {
            addDependencyToPackageJson(appTree, 'lux-components', '1.7.7');
            Object.defineProperty(process.versions, 'node', {
                get: () => '7.9.9'
            });
            callRule(checkVersions(), observableOf(appTree), context).toPromise()
                .then((success) => {
                    expect(success).toBeUndefined();
                }, (reason) => {
                    expect(reason.toString()).toContain('LUX benötigt allerdings die Version 8.0.0.');
                });
        });

        it('Sollte keinen Fehler werfen, wenn Node-Version >= 8.0.0', () => {
            addDependencyToPackageJson(appTree, 'lux-components', '1.7.7');
            Object.defineProperty(process.versions, 'node', {
                get: () => '8.0.0'
            });
            callRule(checkVersions(), observableOf(appTree), context).toPromise()
                .then((success) => {
                    expect(success).toBeDefined();
                }, (reason) => {
                    expect(reason).toBeUndefined();
                });
        });
    });

    describe('[Rule] addAttributeTest', () => {
        let context: SchematicContext;

        beforeEach(() => {
            const collection = runner.engine.createCollection(collectionPath);
            const schematic = runner.engine.createSchematic('lux-version-1.7.8', collection);
            context = runner.engine.createContext(schematic);

            addDependencyToPackageJson(appTree, 'lux-components', '1.7.7');

            appTree.overwrite('/projects/bar/src/app/app.component.html',
                '<lux-card luxTitle="Title" luxSubTitle="Subtitle" (luxClicked)="click()">\n' +
                '  <lux-icon luxIconName="fa-id-card"></lux-icon>\n' +
                '  <lux-card-content>\n' +
                '    <lux-input luxLabel="Vorname" [(luxValue)]="firstname"></lux-input>\n' +
                '  </lux-card-content>\n' +
                '</lux-card>\n' +
                '<lux-input luxLabel="Vorname" [(luxValue)]="firstname"></lux-input>\n' +
                '<lux-accordion>\n' +
                '    <lux-panel [luxHideToggle]="true">\n' +
                '        <lux-panel-header-title>\n' +
                '            Titel\n' +
                '        </lux-panel-header-title>\n' +
                '        <lux-panel-content>\n' +
                '            <lux-input luxLabel="Vorname" [(luxValue)]="firstname"></lux-input>\n' +
                '        </lux-panel-content>\n' +
                '    </lux-panel>\n' +
                '</lux-accordion>');
        });

        it('Das Attribut "luxTest" sollte enthalten sein', () => {
            // Vorbedingungen prüfen
            expect(appTree.readContent('/projects/bar/src/app/app.component.html')).not.toContain('luxTest');

            // Änderungen durchführen
            callRule(addAttributeTest({ path: '/projects/bar/src' }), observableOf(appTree), context).toPromise()
                .then(() => {
                    // Nachbedingungen prüfen
                    const modifiedContent = appTree.readContent('/projects/bar/src/app/app.component.html');

                    const newAttribute1 = modifiedContent.match(/\sluxTest/g);
                    expect(newAttribute1).not.toBeNull();
                    if (newAttribute1) {
                        expect(newAttribute1.length).toBe(3);
                    }

                    const newAttribute2 = modifiedContent.match(/\s\(luxTest\)/g);
                    expect(newAttribute2).not.toBeNull();
                    if (newAttribute2) {
                        expect(newAttribute2.length).toBe(3);
                    }

                    const newAttribute3 = modifiedContent.match(/\s\[luxTest\]/g);
                    expect(newAttribute3).not.toBeNull();
                    if (newAttribute3) {
                        expect(newAttribute3.length).toBe(3);
                    }

                    const newAttribute4 = modifiedContent.match(/\s\[\(luxTest\)\]/g);
                    expect(newAttribute4).not.toBeNull();
                    if (newAttribute4) {
                        expect(newAttribute4.length).toBe(3);
                    }
                }, (reason) => {
                    expect(reason).toBeUndefined();
                });
        });
    });

    describe('[Rule] updateAttributeTest', () => {
        let context: SchematicContext;

        beforeEach(() => {
            const collection = runner.engine.createCollection(collectionPath);
            const schematic = runner.engine.createSchematic('lux-version-1.7.8', collection);
            context = runner.engine.createContext(schematic);

            addDependencyToPackageJson(appTree, 'lux-components', '1.7.7');

            appTree.overwrite('/projects/bar/src/app/app.component.html',
                '<lux-card luxTitle="Title" luxSubTitle="Subtitle" (luxClicked)="click()">\n' +
                '  <lux-icon luxIconName="fa-id-card"></lux-icon>\n' +
                '  <lux-card-content>\n' +
                '    <lux-input luxLabel="aaa" [luxLabel]="aaa" [(luxLabel)]="aaa" (luxLabel)="aaa" [(luxValue)]="firstname"></lux-input>\n' +
                '  </lux-card-content>\n' +
                '</lux-card>');
        });

        it('Das Attribut "updateAttributeTest" sollte geändert sein.', () => {
            // Vorbedingungen prüfen
            const initContent = appTree.readContent('/projects/bar/src/app/app.component.html');
            expect(initContent).toContain('luxLabel="aaa"');
            expect(initContent).toContain('[luxLabel]="aaa"');
            expect(initContent).toContain('[(luxLabel)]="aaa"');
            expect(initContent).toContain('(luxLabel)="aaa"');

            // Änderungen durchführen
            callRule(updateAttributeTest({ path: '/projects/bar/src' }), observableOf(appTree), context).toPromise()
                .then(() => {
                    // Nachbedingungen prüfen
                    const modifiedContent = appTree.readContent('/projects/bar/src/app/app.component.html');

                    expect(modifiedContent).toContain('luxLabel="bbb"');
                    expect(modifiedContent).toContain('[luxLabel]="bbb"');
                    expect(modifiedContent).toContain('[(luxLabel)]="bbb"');
                    expect(modifiedContent).toContain('(luxLabel)="bbb"');


                }, (reason) => {
                    expect(reason).toBeUndefined();
                });
        });
    });
});

function updateAttributeTest(options: any): Rule {
    return (tree: Tree, context: SchematicContext) => {
        iterateFilesAndModifyContent(tree, options.path, (filePath: string, content: string) => {
            const info1 = addAttribute(content, 'lux-input', 'luxLabel', 'bbb');
            const info2 = addAttribute(info1.content, 'lux-input', '[luxLabel]', 'bbb');
            const info3 = addAttribute(info2.content, 'lux-input', '[(luxLabel)]', 'bbb');
            const info4 = addAttribute(info3.content, 'lux-input', '(luxLabel)', 'bbb');

            if (info1.updated || info2.updated || info3.updated || info4.updated) {
                tree.overwrite(filePath, info4.content);
            }
        }, '.html');

        return tree;
    };
}


function addAttributeTest(options: any): Rule {
    return (tree: Tree, context: SchematicContext) => {
        iterateFilesAndModifyContent(tree, options.path, (filePath: string, content: string) => {
            const info1 = addAttribute(content, 'lux-input', 'luxTest', 'aaa');
            const info2 = addAttribute(info1.content, 'lux-input', '[luxTest]', 'bbb');
            const info3 = addAttribute(info2.content, 'lux-input', '[(luxTest)]', 'ccc');
            const info4 = addAttribute(info3.content, 'lux-input', '(luxTest)', 'ddd');

            if (info1.updated || info2.updated || info3.updated || info4.updated) {
                tree.overwrite(filePath, info4.content);
            }
        }, '.html');

        return tree;
    };
}
